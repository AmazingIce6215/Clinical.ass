"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import type { OsceSessionState } from "@/lib/osce/state";
import { warmVoiceCache, speak, stopSpeaking, isSpeechSynthesisSupported } from "@/lib/voice";
import { cn } from "@/lib/utils";
import { shouldRestartListening } from "@/lib/osce/voice-loop";

type VoiceStatus = "idle" | "listening" | "thinking" | "speaking";

const hasSpeechRecognition =
  typeof window !== "undefined" &&
  ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? ((window as unknown as Record<string, unknown>).SpeechRecognition ??
       (window as unknown as Record<string,unknown>).webkitSpeechRecognition)
    : null;

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

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
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const voiceModeRef = useRef(false);
  const voiceStatusRef = useRef<VoiceStatus>("idle");
  const loadingRef = useRef(false);
  const sendingRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  const listeningRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const beginListeningRef = useRef<() => void>(() => {});
  const sendTextRef = useRef<(text: string) => Promise<void>>(async () => {});

  const stopVoiceCapture = useCallback(() => {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    listeningRef.current = false;
    recognitionRef.current?.abort?.();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setVoiceStatus("idle");
  }, []);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
    voiceStatusRef.current = voiceStatus;
    loadingRef.current = loading;
    onMessageRef.current = onMessage;
  }, [voiceMode, voiceStatus, loading, onMessage]);

  useEffect(() => { warmVoiceCache(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!voiceMode) inputRef.current?.focus();
  }, [voiceMode, loading]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      stopVoiceCapture();
      stopSpeaking();
    };
  }, [stopVoiceCapture]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const beginListening = useCallback(() => {
    if (!voiceModeRef.current || sendingRef.current || listeningRef.current || loadingRef.current) return;
    if (!SpeechRecognitionAPI) return;

    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    listeningRef.current = true;
    setRecordingError(null);
    setVoiceStatus("listening");

    try {
      const sr = new (SpeechRecognitionAPI as new () => SpeechRecognitionLike)();
      sr.lang = "en-US";
      sr.continuous = false;
      sr.interimResults = false;
      sr.maxAlternatives = 1;

      recognitionRef.current = sr;

      sr.onresult = (e) => {
        const r = e.results[e.results.length - 1];
        if (r?.[0]?.transcript) {
          const text = r[0].transcript.trim();
          if (text && voiceModeRef.current && !sendingRef.current) {
            listeningRef.current = false;
            recognitionRef.current = null;
            sr.stop();
            setVoiceStatus("thinking");
            void sendTextRef.current(text);
          }
        }
      };

      sr.onend = () => {
        listeningRef.current = false;
        recognitionRef.current = null;
        if (voiceModeRef.current && !sendingRef.current && !loadingRef.current) {
          if (voiceStatusRef.current === "thinking") {
            return;
          }
          restartTimerRef.current = window.setTimeout(() => {
            if (shouldRestartListening({ voiceMode: voiceModeRef.current, isListening: false, isSending: false, isSpeaking: false, isLoading: loadingRef.current, hasSpeechRecognition: true })) {
              beginListeningRef.current();
            }
          }, 600);
        }
      };

      sr.onerror = (e) => {
        listeningRef.current = false;
        recognitionRef.current = null;
        if (e.error === "aborted") return;
        if (e.error !== "no-speech") setRecordingError(e.error);
        if (voiceModeRef.current) {
          restartTimerRef.current = window.setTimeout(() => {
            if (shouldRestartListening({ voiceMode: voiceModeRef.current, isListening: false, isSending: false, isSpeaking: false, isLoading: loadingRef.current, hasSpeechRecognition: true })) {
              beginListeningRef.current();
            }
          }, 800);
        }
      };

      sr.start();
    } catch {
      listeningRef.current = false;
      recognitionRef.current = null;
      if (voiceModeRef.current) {
        restartTimerRef.current = window.setTimeout(() => {
          if (shouldRestartListening({ voiceMode: voiceModeRef.current, isListening: false, isSending: false, isSpeaking: false, isLoading: loadingRef.current, hasSpeechRecognition: true })) {
            beginListeningRef.current();
          }
        }, 1000);
      }
    }
  }, []);

  const sendText = useCallback(async (text: string) => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setError(null);
    setMessages((prev) => [...prev, { role: "user" as const, content: text }]);
    setLoading(true);
    try {
      const response = await onMessageRef.current(text);
      setMessages((prev) => [...prev, { role: "patient" as const, content: response }]);
      sendingRef.current = false;
      setLoading(false);
      if (voiceModeRef.current) {
        setVoiceStatus("speaking");
        speak(response, () => {
          if (voiceModeRef.current) {
            setVoiceStatus("idle");
            beginListeningRef.current();
          }
        });
      }
    } catch (err) {
      sendingRef.current = false;
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed");
      if (voiceModeRef.current) {
        setVoiceStatus("idle");
        restartTimerRef.current = window.setTimeout(() => {
          if (shouldRestartListening({ voiceMode: voiceModeRef.current, isListening: false, isSending: false, isSpeaking: false, isLoading: loadingRef.current, hasSpeechRecognition: true })) {
            beginListeningRef.current();
          }
        }, 500);
      }
    }
  }, []);

  useEffect(() => {
    beginListeningRef.current = beginListening;
  }, [beginListening]);

  useEffect(() => {
    sendTextRef.current = sendText;
  }, [sendText]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sendingRef.current) return;
    sendingRef.current = true;
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user" as const, content: text }]);
    setLoading(true);
    try {
      const response = await onMessageRef.current(text);
      setMessages((prev) => [...prev, { role: "patient" as const, content: response }]);
      sendingRef.current = false;
      setLoading(false);
      if (voiceModeRef.current) {
        setVoiceStatus("speaking");
        speak(response, () => {
          if (voiceModeRef.current) {
            setVoiceStatus("idle");
            beginListening();
          }
        });
      }
    } catch (err) {
      sendingRef.current = false;
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed");
      if (voiceModeRef.current) {
        setVoiceStatus("idle");
        restartTimerRef.current = window.setTimeout(() => {
          if (shouldRestartListening({ voiceMode: voiceModeRef.current, isListening: false, isSending: false, isSpeaking: false, isLoading: loadingRef.current, hasSpeechRecognition: true })) {
            beginListening();
          }
        }, 500);
      }
    }
  }, [input, beginListening]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const toggleVoiceMode = useCallback(() => {
    if (voiceMode) {
      stopSpeaking();
      stopVoiceCapture();
      setRecordingError(null);
      setVoiceMode(false);
    } else {
      setVoiceMode(true);
      setRecordingError(null);
      setTimeout(beginListening, 300);
    }
  }, [voiceMode, beginListening, stopVoiceCapture]);

  const handleMicClick = useCallback(() => {
    if (voiceStatus === "speaking") { stopSpeaking(); setVoiceStatus("idle"); return; }
    if (voiceStatus === "listening") {
      stopVoiceCapture();
      return;
    }
    beginListening();
  }, [voiceStatus, beginListening, stopVoiceCapture]);

  const handleSubmitClick = useCallback(() => {
    stopVoiceCapture();
    stopSpeaking();
    onSubmit();
  }, [onSubmit, stopVoiceCapture]);

  const statusDisplay = (): { icon: string; text: string; color: string } => {
    switch (voiceStatus) {
      case "listening": return { icon: "🎤", text: "Listening...", color: "text-red-500" };
      case "thinking": return { icon: "🤔", text: "Patient is thinking...", color: "text-amber-500" };
      case "speaking": return { icon: "🗣️", text: "Patient is speaking...", color: "text-accent" };
      default: return { icon: "🎤", text: "Tap to speak", color: "text-muted" };
    }
  };

  const timerColor = timeLeft < 60 ? "text-red-500" : timeLeft < 180 ? "text-amber-500" : "text-emerald-500";

  const synthesisSupported = isSpeechSynthesisSupported();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border/60 bg-surface/50 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { stopVoiceCapture(); stopSpeaking(); onBack(); }} className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface/60 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent/40">← Exit OSCE</button>
          <span className="hidden rounded-full border border-border/60 px-2 py-0.5 text-[11px] font-semibold uppercase text-accent sm:inline">{session.difficulty}</span>
        </div>
        <div className={`flex items-center gap-2 font-mono text-xl font-bold tracking-wider ${timerColor}`}>
          <span className="h-2.5 w-2.5 rounded-full bg-current animate-pulse" />
          {formatTime(timeLeft)}
        </div>
        <div className="flex items-center gap-2">
          {hasSpeechRecognition && (
            <button type="button" onClick={toggleVoiceMode} className={cn("rounded-xl border px-3 py-1.5 text-xs font-medium transition", voiceMode ? "border-accent/50 bg-accent/15 text-accent shadow-glow-sm" : "border-border/60 bg-surface/60 text-muted hover:border-accent/40 hover:text-accent")} title={voiceMode ? "Disable voice mode" : "Enable voice mode"}>
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
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[70%]", msg.role === "user" ? "bg-accent text-accent-foreground" : "border border-border/60 bg-surface/70 text-foreground")}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.role === "patient" && synthesisSupported && voiceMode && (
                  <button type="button" onClick={() => { stopSpeaking(); speak(msg.content, () => { if (voiceModeRef.current) beginListening(); }); }} className={cn("mt-2 flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium uppercase tracking-wider transition", voiceStatus === "speaking" && i === messages.length - 1 ? "bg-accent/20 text-accent" : "text-muted hover:bg-surface/50 hover:text-accent")} title="Read aloud">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M11 5L6 9H2v6h4l5 4V5z" />
                    </svg>
                    {voiceStatus === "speaking" && i === messages.length - 1 ? (
                      <span className="flex items-center gap-1"><span className="h-1 w-1 animate-pulse rounded-full bg-current" /> Playing</span>
                    ) : "Listen"}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center">
              <div className="rounded-xl bg-red-500/10 px-4 py-2 text-xs text-red-500">{error}</div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border/60 bg-surface/30 backdrop-blur-md">
        {voiceMode && hasSpeechRecognition && (
          <div className="border-b border-border/40 px-4 py-3 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center justify-between gap-3">
                <div className={`flex items-center gap-2 text-sm font-medium ${statusDisplay().color}`}>
                  <span className="relative flex h-6 w-6 items-center justify-center">
                    {voiceStatus === "listening" && (<><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/30" /><span className="text-base">🎤</span></>)}
                    {voiceStatus === "thinking" && <span className="inline-block animate-bounce text-base">🤔</span>}
                    {voiceStatus === "speaking" && <span className="inline-block text-base">🗣️</span>}
                    {voiceStatus === "idle" && <span className="text-base">🎤</span>}
                  </span>
                  <span className={voiceStatus === "listening" ? "animate-pulse" : ""}>{statusDisplay().text}</span>
                  {voiceMode && synthesisSupported && (
                    <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-accent">Speech</span>
                  )}
                </div>
                <button type="button" onClick={handleMicClick} disabled={loading}
                  className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50",
                    voiceStatus === "listening" ? "bg-red-500/15 text-red-500" : voiceStatus === "speaking" ? "bg-accent/15 text-accent" : "bg-surface/60 text-muted hover:bg-surface hover:text-accent")}>
                  {voiceStatus === "listening" ? <><span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> Stop</> : voiceStatus === "speaking" ? "Skip" : "Start"}
                </button>
              </div>
              {recordingError && <p className="mt-1.5 text-[10px] text-red-500">{recordingError}</p>}
            </div>
          </div>
        )}

        <div className="px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-3xl items-end gap-3">
            <div className="relative flex-1">
              {voiceMode && hasSpeechRecognition && voiceStatus !== "idle" ? null : (
                <>
                  <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder={voiceMode && hasSpeechRecognition ? "Type your question..." : "Ask the patient a question..."}
                    disabled={loading}
                    className="w-full rounded-xl border border-border/70 bg-surface/80 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-muted/50 focus:border-accent/50 disabled:opacity-50" />
                  <button type="button" onClick={handleSend} disabled={loading || !input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition hover:text-accent disabled:opacity-30">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
            <button type="button" onClick={handleSubmitClick} disabled={loading}
              className="flex shrink-0 items-center gap-2 rounded-xl border-2 border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-500/20 disabled:opacity-50">
              Submit OSCE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
