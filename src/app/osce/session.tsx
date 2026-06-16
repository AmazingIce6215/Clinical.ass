"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import type { OsceSessionState } from "@/lib/osce/state";

export function OsceSession({
  session,
  onMessage,
  onSubmit,
  onBack,
}: {
  session: OsceSessionState;
  onMessage: (input: string) => Promise<string>;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(session.conversation);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(session.timeRemaining);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user" as const, content: text }]);
    setLoading(true);
    try {
      const response = await onMessage(text);
      setMessages((prev) => [...prev, { role: "patient" as const, content: response }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get response";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [input, loading, onMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const timerColor = timeLeft < 60 ? "text-red-500" : timeLeft < 180 ? "text-amber-500" : "text-emerald-500";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border/60 bg-surface/50 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent/40"
          >
            ← Exit OSCE
          </button>
          <span className="hidden rounded-full border border-border/60 px-2 py-0.5 text-[11px] font-semibold uppercase text-accent sm:inline">
            {session.difficulty}
          </span>
        </div>

        <div className={`flex items-center gap-2 font-mono text-xl font-bold tracking-wider ${timerColor}`}>
          <span className="h-2.5 w-2.5 rounded-full bg-current animate-pulse" />
          {formatTime(timeLeft)}
        </div>

        <div />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%] ${
                  msg.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "border border-border/60 bg-surface/70 text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </motion.div>
          ))}

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="rounded-2xl border border-border/60 bg-surface/70 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center"
            >
              <div className="rounded-xl bg-red-500/10 px-4 py-2 text-xs text-red-500">
                {error}
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border/60 bg-surface/30 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the patient a question..."
              disabled={loading}
              className="w-full rounded-xl border border-border/70 bg-surface/80 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-muted/50 focus:border-accent/50 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:text-accent disabled:opacity-30"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="flex shrink-0 items-center gap-2 rounded-xl border-2 border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-500/20 disabled:opacity-50"
          >
            Submit OSCE
          </button>
        </div>
      </div>
    </div>
  );
}
