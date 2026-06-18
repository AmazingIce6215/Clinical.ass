"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import type { OsceSessionState } from "@/lib/osce/state";
import {
  isSpeechSupported,
  isSpeechSynthesisSupported,
  createSpeechRecognizer,
  speak,
  stopSpeaking,
  isSpeaking,
} from "@/lib/voice";

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
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognizerRef = useRef<ReturnType<typeof createSpeechRecognizer>>(null);
  const voiceSupported = isSpeechSupported();
  const synthesisSupported = isSpeechSynthesisSupported();

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

  const handleSpeakMessage = useCallback((text: string) => {
    if (!synthesisSupported) return;
    if (isSpeaking()) stopSpeaking();
    setIsCurrentlySpeaking(true);
    speak(text, () => setIsCurrentlySpeaking(false));
  }, [synthesisSupported]);

  const tryAutoSpeak = useCallback((text: string) => {
    if (!synthesisSupported) return;
    stopSpeaking();
    setIsCurrentlySpeaking(true);
    speak(text, () => setIsCurrentlySpeaking(false));
  }, [synthesisSupported]);

  const handleSendWithText = useCallback((text: string) => {
    if (!text.trim() || loading) return;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user" as const, content: text }]);
    setLoading(true);
    onMessage(text)
      .then((response) => {
        setMessages((prev) => [...prev, { role: "patient" as const, content: response }]);
        if (voiceMode) {
          tryAutoSpeak(response);
        }
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to get response";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [loading, onMessage, voiceMode, tryAutoSpeak]);

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
      if (voiceMode && synthesisSupported) {
        tryAutoSpeak(response);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get response";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [input, loading, onMessage, voiceMode, synthesisSupported, tryAutoSpeak]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleVoiceMode = useCallback(() => {
    setVoiceMode((prev) => {
      if (prev) {
        stopSpeaking();
        setIsCurrentlySpeaking(false);
        if (recognizerRef.current) {
          recognizerRef.current.abort();
          setIsListening(false);
        }
      }
      return !prev;
    });
    setRecordingError(null);
  }, []);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      recognizerRef.current?.abort();
      setIsListening(false);
      return;
    }

    if (!recognizerRef.current) {
      recognizerRef.current = createSpeechRecognizer(
        (text) => {
          setIsListening(false);
          setInput(text);
          setTimeout(() => {
            setInput((current) => {
              if (current.trim()) {
                handleSendWithText(current);
              }
              return current;
            });
          }, 100);
        },
        () => {
          setIsListening(false);
        },
        (err) => {
          setIsListening(false);
          if (err !== "no-speech" && err !== "aborted") {
            setRecordingError(err);
          }
        },
      );
    }

    if (recognizerRef.current) {
      setRecordingError(null);
      setIsListening(true);
      recognizerRef.current.start();
    }
  }, [isListening, handleSendWithText]);



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

        <div className="flex items-center gap-2">
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoiceMode}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                voiceMode
                  ? "border-accent/50 bg-accent/15 text-accent shadow-glow-sm"
                  : "border-border/60 bg-surface/60 text-muted hover:border-accent/40 hover:text-accent"
              }`}
              title={voiceMode ? "Disable voice mode" : "Enable voice mode"}
            >
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19v4" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 23h8" />
                </svg>
                Voice
                {voiceMode && <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />}
              </span>
            </button>
          )}
        </div>
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
                {msg.role === "patient" && synthesisSupported && voiceMode && (
                  <button
                    type="button"
                    onClick={() => handleSpeakMessage(msg.content)}
                    className={`mt-2 flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium uppercase tracking-wider transition ${
                      isCurrentlySpeaking && messages.indexOf(msg) === messages.length - 1
                        ? "bg-accent/20 text-accent"
                        : "text-muted hover:bg-surface/50 hover:text-accent"
                    }`}
                    title="Read aloud"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M11 5L6 9H2v6h4l5 4V5z" />
                    </svg>
                    {isCurrentlySpeaking && messages.indexOf(msg) === messages.length - 1 ? (
                      <span className="flex items-center gap-1">
                        <span className="h-1 w-1 animate-pulse rounded-full bg-current" />
                        Speaking
                      </span>
                    ) : (
                      "Listen"
                    )}
                  </button>
                )}
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
            {voiceMode && voiceSupported ? (
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-surface/80 px-3 py-2.5 transition focus-within:border-accent/50">
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={loading}
                  className={`flex items-center justify-center rounded-lg p-2 transition disabled:opacity-50 ${
                    isListening
                      ? "bg-red-500/20 text-red-500 shadow-glow-sm"
                      : "text-muted hover:text-accent hover:bg-surface/50"
                  }`}
                  title={isListening ? "Stop recording" : "Tap to speak"}
                >
                  {isListening ? (
                    <span className="flex items-center gap-1.5">
                      <span className="flex h-4 w-4 items-center justify-center">
                        <span className="absolute h-3 w-3 animate-ping rounded-full bg-red-500/40" />
                        <span className="h-3 w-3 rounded-full bg-red-500" />
                      </span>
                      <span className="text-xs font-medium animate-pulse">Listening...</span>
                    </span>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19v4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 23h8" />
                    </svg>
                  )}
                </button>
                <span className="flex-1 text-sm text-muted/50">
                  {isListening ? "" : "Tap mic to speak..."}
                </span>
                {recordingError && (
                  <span className="text-[10px] text-red-500">{recordingError}</span>
                )}
              </div>
            ) : (
              <>
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
              </>
            )}
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
