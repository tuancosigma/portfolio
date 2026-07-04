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

export const FALLBACK_TEXT =
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
 * would fail identically everywhere. Returns FALLBACK_TEXT if every attempt
 * fails, rather than throwing, so the route always has a reply to send.
 *
 * Returns a plain string (not a stream): both providers are single-shot, and
 * a hand-rolled ReadableStream/TextEncoder response body was found to mangle
 * multi-byte UTF-8 (Vietnamese diacritics) under `next dev`'s Node runtime —
 * `Response.json()` on a plain string encodes UTF-8 correctly everywhere.
 */
export async function getReply(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
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
        if (text) return text;
        break; // 200 with an unexpected shape won't fix itself on retry
      }
      if (!RETRYABLE_STATUS.has(res.status)) break;
    } catch {
      // Network error or timeout — fall through to the next attempt.
    }
  }

  return FALLBACK_TEXT;
}
