"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MAX_INPUT_LENGTH = 500;
const MAX_HISTORY = 6;
const TYPE_CHUNK_MS = 18; // client-side reveal speed (per word), purely cosmetic

const SUGGESTED_PROMPTS = [
  "What's Tuan's SOC experience?",
  "Tell me about the WAF project",
  "How can I contact him?",
];

/** Fetches the full reply, then reveals it word by word for a lightweight typing effect. */
async function fetchReply(messages: Message[], onWord: (soFar: string) => void) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages.slice(-MAX_HISTORY) }),
  });

  const data = (await res.json()) as { reply?: string };
  const words = (data.reply ?? "").split(" ");

  for (let i = 0; i < words.length; i++) {
    onWord(words.slice(0, i + 1).join(" "));
    if (i < words.length - 1) await new Promise((r) => setTimeout(r, TYPE_CHUNK_MS));
  }
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-chat-widget", handler);
    return () => window.removeEventListener("open-chat-widget", handler);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      await fetchReply(nextMessages, (soFar) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: soFar };
          return updated;
        });
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI chat"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-white text-black shadow-lg flex items-center justify-center hover:bg-white/90 transition-colors"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-black text-white border-white/10 p-0 flex flex-col">
          <SheetHeader className="border-b border-white/10 p-6">
            <SheetTitle className="text-white font-display text-2xl">Ask about Tuan</SheetTitle>
            <SheetDescription className="text-white/50">
              An AI assistant grounded in this portfolio — SOC experience, projects, skills, contact.
            </SheetDescription>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="text-left px-4 py-3 border border-white/15 text-sm text-white/70 hover:border-[#eca8d6]/50 hover:text-white transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-[#eca8d6] text-black"
                    : "bg-white/5 text-white/90 border border-white/10"
                }`}
              >
                {m.content || (isStreaming && i === messages.length - 1 ? "···" : "")}
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-white/10 p-4 flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={MAX_INPUT_LENGTH}
              disabled={isStreaming}
              placeholder="Ask a question..."
              className="flex-1 bg-transparent border border-white/15 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#eca8d6]/50 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              aria-label="Send message"
              className="shrink-0 w-10 h-10 flex items-center justify-center bg-white text-black disabled:opacity-30 hover:bg-white/90 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
