export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Attempt {
  provider: "groq" | "gemini";
  key: string;
  model: string;
}

const RETRYABLE_STATUS = new Set([401, 403, 429, 500, 502, 503, 504]);
const REQUEST_TIMEOUT_MS = 10_000;
// Groq's SSE connection can idle-hang past its final chunk under some
// runtimes; bound each read so a stalled upstream can't hang the response.
const READ_IDLE_TIMEOUT_MS = 12_000;

const FALLBACK_TEXT =
  "The AI assistant is temporarily unavailable. Please reach out directly at tinyly90891@gmail.com.";

function splitCsv(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildAttempts(): Attempt[] {
  const groqModel = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const groqKeys = [process.env.GROQ_API_KEY, ...splitCsv(process.env.GROQ_API_KEY_BACKUP)].filter(
    (k): k is string => Boolean(k)
  );
  const geminiKeys = [process.env.GEMINI_API_KEY, ...splitCsv(process.env.GEMINI_API_KEY_BACKUP)].filter(
    (k): k is string => Boolean(k)
  );

  return [
    ...groqKeys.map((key) => ({ provider: "groq" as const, key, model: groqModel })),
    ...geminiKeys.map((key) => ({ provider: "gemini" as const, key, model: geminiModel })),
  ];
}

function encodeChunk(text: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ t: text })}\n\n`);
}

const DONE_EVENT = new TextEncoder().encode("data: [DONE]\n\n");

/** Emits a complete string as a few word-chunks (light typing effect) then DONE. */
function textStream(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const word of text.split(" ")) controller.enqueue(encodeChunk(word + " "));
      controller.enqueue(DONE_EVENT);
      controller.close();
    },
  });
}

function fallbackStream(): ReadableStream<Uint8Array> {
  return textStream(FALLBACK_TEXT);
}

function fetchGroq(attempt: Attempt, systemPrompt: string, messages: ChatMessage[]) {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${attempt.key}`,
    },
    body: JSON.stringify({
      model: attempt.model,
      stream: true,
      max_tokens: 512,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

// Gemini fallback uses the non-streaming endpoint deliberately: it's the
// last-resort path (low free-tier quota), and avoiding a second streaming
// format sidesteps SSE-framing edge cases for a rarely-hit code path (KISS).
function fetchGeminiOnce(attempt: Attempt, systemPrompt: string, messages: ChatMessage[]) {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${attempt.model}:generateContent?key=${attempt.key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 512 },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );
}

/** Races a promise against a timeout; resolves to a sentinel instead of rejecting. */
function withIdleTimeout<T>(promise: Promise<T>, ms: number): Promise<T | "timeout"> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve("timeout"), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve("timeout");
      }
    );
  });
}

/** Re-emits Groq's OpenAI-format SSE body as our own `{t: text}` chunk protocol. */
function normalizeGroqStream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  // Cast: lib.dom's TextDecoderStream types its writable side as BufferSource,
  // which TS won't structurally match to ReadableStream<Uint8Array> — safe at
  // runtime since Uint8Array satisfies BufferSource.
  const reader = body
    .pipeThrough(new TextDecoderStream() as unknown as ReadableWritablePair<string, Uint8Array>)
    .getReader();
  let buffer = "";

  const extractText = (payload: string): string | undefined => {
    if (payload === "[DONE]") return undefined;
    try {
      return JSON.parse(payload).choices?.[0]?.delta?.content;
    } catch {
      return undefined; // partial/keep-alive line split across reads
    }
  };

  const flushBuffer = (controller: ReadableStreamDefaultController<Uint8Array>) => {
    const line = buffer.split("\n").find((l) => l.startsWith("data: "));
    const text = line && extractText(line.slice(6).trim());
    if (text) controller.enqueue(encodeChunk(text));
    buffer = "";
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const result = await withIdleTimeout(reader.read(), READ_IDLE_TIMEOUT_MS);

      if (result === "timeout" || result.done) {
        flushBuffer(controller);
        controller.enqueue(DONE_EVENT);
        controller.close();
        reader.cancel().catch(() => {});
        return;
      }

      buffer += result.value;
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        const line = event.split("\n").find((l) => l.startsWith("data: "));
        if (!line) continue;
        const text = extractText(line.slice(6).trim());
        if (text) controller.enqueue(encodeChunk(text));
      }
    },
  });
}

/**
 * Tries Groq (primary + backup keys, streamed) then Gemini (primary + backup
 * keys, single-shot) in order. A retryable status (auth/rate-limit/server
 * error) or network error moves to the next attempt. A non-retryable status
 * stops the chain — it signals a request-shape problem that would fail
 * identically everywhere. All attempts exhausted or a non-retryable failure
 * both resolve to a graceful fallback message rather than a hard error.
 */
export async function callWithFallback(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  for (const attempt of buildAttempts()) {
    try {
      if (attempt.provider === "groq") {
        const res = await fetchGroq(attempt, systemPrompt, messages);
        if (res.ok && res.body) return normalizeGroqStream(res.body);
        if (!RETRYABLE_STATUS.has(res.status)) break;
      }

      const res = await fetchGeminiOnce(attempt, systemPrompt, messages);
      if (res.ok) {
        const json = (await res.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return textStream(text);
        break; // 200 with an unexpected shape won't fix itself on retry
      }
      if (!RETRYABLE_STATUS.has(res.status)) break;
    } catch {
      // Network error or timeout — fall through to the next attempt.
    }
  }

  return fallbackStream();
}
