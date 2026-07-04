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

// Both providers use their non-streaming, single-JSON-response endpoint.
// A real Cloudflare Workers deployment killed the request ("runtime canceled
// this request because it detected that your Worker's code had hung") on the
// Groq streaming path — workerd's ReadableStream/ TextDecoderStream behavior
// didn't match what worked under local `next dev` (Node). Non-streaming
// avoids that whole class of runtime-dependent hang for both providers;
// `textStream()` still gives the widget a lightweight typing effect client-side.
function fetchGroqOnce(attempt: Attempt, systemPrompt: string, messages: ChatMessage[]) {
  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${attempt.key}`,
    },
    body: JSON.stringify({
      model: attempt.model,
      stream: false,
      max_tokens: 512,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

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

/**
 * Tries Groq (primary + backup keys) then Gemini (primary + backup keys) in
 * order, both single-shot JSON completions. A retryable status (auth/rate-
 * limit/server error) or network error moves to the next attempt. A non-
 * retryable status stops the chain — it signals a request-shape problem that
 * would fail identically everywhere. All attempts exhausted or a non-
 * retryable failure both resolve to a graceful fallback message.
 */
export async function callWithFallback(
  systemPrompt: string,
  messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  for (const attempt of buildAttempts()) {
    try {
      const res =
        attempt.provider === "groq"
          ? await fetchGroqOnce(attempt, systemPrompt, messages)
          : await fetchGeminiOnce(attempt, systemPrompt, messages);

      if (res.ok) {
        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text =
          attempt.provider === "groq"
            ? json.choices?.[0]?.message?.content
            : json.candidates?.[0]?.content?.parts?.[0]?.text;
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
