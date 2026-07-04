import { callWithFallback, type ChatMessage } from "@/lib/ai/provider-chain";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";

const MAX_HISTORY = 6;
const MAX_MESSAGE_LENGTH = 500;

function isValidRawMessage(m: unknown): m is { role: string; content: string } {
  return (
    !!m &&
    typeof m === "object" &&
    (m as { role?: unknown }).role !== undefined &&
    ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant") &&
    typeof (m as { content?: unknown }).content === "string" &&
    (m as { content: string }).content.length > 0 &&
    (m as { content: string }).content.length <= MAX_MESSAGE_LENGTH
  );
}

// Validates AND strips to exactly {role, content} — extra fields on a message
// object (e.g. a large hidden property) must never reach the outstream
// provider payload unbounded by the length check above.
function sanitizeMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_HISTORY) return null;
  if (!value.every(isValidRawMessage)) return null;
  return value.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const messages = sanitizeMessages((body as { messages?: unknown })?.messages);
  if (!messages) {
    return new Response("Invalid messages: expected 1-6 items, role user/assistant, content 1-500 chars", {
      status: 400,
    });
  }

  const stream = await callWithFallback(SYSTEM_PROMPT, messages);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
