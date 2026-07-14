"use client";

import {
  ArrowLeft,
  Clock3,
  LoaderCircle,
  Mic,
  MicOff,
  Send,
  Square,
  Volume2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { OsceSessionState } from "@/lib/osce/state";
import {
  warmVoiceCache,
  speakNatural,
  stopSpeaking,
  stopNaturalVoice,
  isSpeechSynthesisSupported,
} from "@/lib/voice";
import { cn } from "@/lib/utils";
import { shouldRestartListening } from "@/lib/osce/voice-loop";

type VoiceStatus = "idle" | "listening" | "thinking" | "speaking";

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

function subscribeToBrowserCapabilities(onStoreChange: () => void) {
  window.addEventListener("languagechange", onStoreChange);
  return () => window.removeEventListener("languagechange", onStoreChange);
}

function getSpeechRecognitionSnapshot() {
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

function getSpeechSynthesisSnapshot() {
  return isSpeechSynthesisSupported();
}

function getServerCapabilitySnapshot() {
  return false;
}

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
  const patientSexRef = useRef<OsceSessionState["patientSex"]>(session.patientSex);
  const loadingRef = useRef(false);
  const sendingRef = useRef(false);
  const sessionEndingRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  const listeningRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const beginListeningRef = useRef<() => void>(() => {});
  const sendTextRef = useRef<(text: string) => Promise<void>>(async () => {});
  const speechRecognitionSupported = useSyncExternalStore(
    subscribeToBrowserCapabilities,
    getSpeechRecognitionSnapshot,
    getServerCapabilitySnapshot,
  );
  const synthesisSupported = useSyncExternalStore(
    subscribeToBrowserCapabilities,
    getSpeechSynthesisSnapshot,
    getServerCapabilitySnapshot,
  );

  const stopVoiceCapture = useCallback(() => {
    sessionEndingRef.current = true;
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    listeningRef.current = false;
    recognitionRef.current?.abort?.();
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    stopNaturalVoice();
    setVoiceStatus("idle");
  }, []);

  const disableVoiceMode = useCallback(() => {
    sessionEndingRef.current = true;
    stopVoiceCapture();
    stopSpeaking();
    stopNaturalVoice();
    setRecordingError(null);
    setVoiceMode(false);
  }, [stopVoiceCapture]);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
    voiceStatusRef.current = voiceStatus;
    patientSexRef.current = session.patientSex;
    loadingRef.current = loading;
    onMessageRef.current = onMessage;
    if (voiceMode) {
      sessionEndingRef.current = false;
    }
  }, [voiceMode, voiceStatus, loading, onMessage, session.patientSex]);

  useEffect(() => { warmVoiceCache(); }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bottomRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
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
    if (sessionEndingRef.current || !voiceModeRef.current || sendingRef.current || listeningRef.current || loadingRef.current) return;
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
            if (sessionEndingRef.current) return;
            listeningRef.current = false;
            recognitionRef.current = null;
            sr.stop();
            setVoiceStatus("thinking");
            void sendTextRef.current(text);
          }
        }
      };

      sr.onend = () => {
        if (sessionEndingRef.current) {
          listeningRef.current = false;
          recognitionRef.current = null;
          return;
        }
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
        if (sessionEndingRef.current) {
          listeningRef.current = false;
          recognitionRef.current = null;
          return;
        }
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
      if (sessionEndingRef.current) return;
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
    if (sessionEndingRef.current) return;
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
        if (sessionEndingRef.current) return;
        setVoiceStatus("speaking");
        void speakNatural(response, () => {
          if (voiceModeRef.current && !sessionEndingRef.current) {
            setVoiceStatus("idle");
            beginListeningRef.current();
          }
        }, { sex: patientSexRef.current });
      }
    } catch (err) {
      sendingRef.current = false;
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed");
      if (voiceModeRef.current) {
        if (sessionEndingRef.current) return;
        setVoiceStatus("idle");
        restartTimerRef.current = window.setTimeout(() => {
          if (!sessionEndingRef.current && shouldRestartListening({ voiceMode: voiceModeRef.current, isListening: false, isSending: false, isSpeaking: false, isLoading: loadingRef.current, hasSpeechRecognition: true })) {
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
        void speakNatural(response, () => {
          if (voiceModeRef.current) {
            setVoiceStatus("idle");
            beginListening();
          }
        }, { sex: patientSexRef.current });
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

  const toggleVoiceMode = useCallback(() => {
    if (voiceMode) {
      disableVoiceMode();
    } else {
      sessionEndingRef.current = false;
      setVoiceMode(true);
      setRecordingError(null);
      setTimeout(beginListening, 300);
    }
  }, [voiceMode, beginListening, disableVoiceMode]);

  const handleMicClick = useCallback(() => {
    if (voiceStatus === "speaking") { stopSpeaking(); setVoiceStatus("idle"); return; }
    if (voiceStatus === "listening") {
      stopVoiceCapture();
      return;
    }
    beginListening();
  }, [voiceStatus, beginListening, stopVoiceCapture]);

  const handleSubmitClick = useCallback(() => {
    disableVoiceMode();
    onSubmit();
  }, [onSubmit, disableVoiceMode]);

  const statusDisplay = (): { text: string; color: string } => {
    switch (voiceStatus) {
      case "listening":
        return { text: "Listening for your question", color: "text-danger" };
      case "thinking":
        return { text: "Simulated patient is responding", color: "text-warning" };
      case "speaking":
        return { text: "Playing patient response", color: "text-accent" };
      default:
        return { text: "Voice input ready", color: "text-muted" };
    }
  };

  const timerColor =
    timeLeft < 60 ? "text-danger" : timeLeft < 180 ? "text-warning" : "text-foreground";
  const timerMinutes = Math.floor(timeLeft / 60);
  const timerSeconds = timeLeft % 60;
  const timerLabel = `${timerMinutes} minute${timerMinutes === 1 ? "" : "s"} and ${timerSeconds} second${timerSeconds === 1 ? "" : "s"} remaining`;

  return (
    <div className="fixed inset-0 z-50 flex h-dvh flex-col bg-background pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <header className="grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-border bg-surface px-3 py-2.5 sm:px-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              disableVoiceMode();
              onBack();
            }}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[10px] border border-border bg-surface px-3 text-sm font-semibold text-muted transition-colors hover:border-accent/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Exit OSCE station"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
          <span className="hidden rounded-full border border-border bg-surface-subtle px-2.5 py-1 text-xs font-semibold capitalize text-muted md:inline">
            {session.difficulty}
          </span>
        </div>

        <div
          className={cn(
            "mx-auto flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-2 font-mono text-lg font-semibold tabular-nums",
            timerColor,
          )}
          role="timer"
          aria-label={timerLabel}
        >
          <Clock3 aria-hidden="true" className="h-4 w-4" />
          <time dateTime={`PT${timeLeft}S`}>{formatTime(timeLeft)}</time>
        </div>
        <span className="sr-only" aria-live="polite">
          {timeLeft === 60 ? "One minute remaining" : timeLeft === 0 ? "Station time has ended" : ""}
        </span>

        <div className="flex justify-end">
          {speechRecognitionSupported ? (
            <button
              type="button"
              onClick={toggleVoiceMode}
              className={cn(
                "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-[10px] border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                voiceMode
                  ? "border-accent/35 bg-accent/10 text-accent"
                  : "border-border bg-surface text-muted hover:border-accent/35 hover:text-foreground",
              )}
              aria-label={voiceMode ? "Turn off voice mode" : "Turn on voice mode"}
              aria-pressed={voiceMode}
            >
              {voiceMode ? (
                <MicOff aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Mic aria-hidden="true" className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Voice</span>
            </button>
          ) : null}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6" aria-label="OSCE patient interview">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-3 text-xs text-muted">
            <span className="rounded-full border border-info/25 bg-info-soft px-2.5 py-1 font-semibold text-info">
              AI-generated simulated patient
            </span>
            <span>Ask one clear clinical question at a time.</span>
          </div>

          <ol
            className="space-y-4"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-label="Patient interview transcript"
          >
            {messages.map((message, index) => (
              <li
                key={`${message.role}-${index}`}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-[12px] border px-4 py-3 text-sm leading-6 sm:max-w-[76%]",
                    message.role === "user"
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-surface text-foreground",
                  )}
                >
                  <p
                    className={cn(
                      "mb-1 text-[11px] font-semibold uppercase tracking-[0.1em]",
                      message.role === "user" ? "text-accent-foreground/75" : "text-muted",
                    )}
                  >
                    {message.role === "user" ? "You" : "Simulated patient"}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === "patient" && synthesisSupported && voiceMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        stopSpeaking();
                        stopNaturalVoice();
                        void speakNatural(
                          message.content,
                          () => {
                            if (voiceModeRef.current) beginListening();
                          },
                          { sex: patientSexRef.current },
                        );
                      }}
                      className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-[10px] px-3 text-xs font-semibold text-muted transition-colors hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      aria-label="Play this simulated patient response"
                    >
                      <Volume2 aria-hidden="true" className="h-4 w-4" />
                      {voiceStatus === "speaking" && index === messages.length - 1
                        ? "Playing response"
                        : "Play response"}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>

          {loading ? (
            <div className="mt-4 flex justify-start" role="status" aria-live="polite">
              <div className="flex min-h-11 items-center gap-2 rounded-[12px] border border-border bg-surface px-4 py-3 text-sm text-muted">
                <LoaderCircle
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin motion-reduce:animate-none"
                />
                Simulated patient is responding
              </div>
            </div>
          ) : null}
          {error ? (
            <div
              className="mt-4 rounded-[10px] border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger"
              role="alert"
            >
              The simulated patient could not respond. Check your connection and try the question again.
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="border-t border-border bg-surface">
        {voiceMode && speechRecognitionSupported ? (
          <div className="border-b border-border px-3 py-2.5 sm:px-6">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <div
                className={cn("flex min-w-0 items-center gap-2 text-sm font-medium", statusDisplay().color)}
                role="status"
                aria-live="polite"
              >
                {voiceStatus === "listening" ? (
                  <Mic aria-hidden="true" className="h-4 w-4 shrink-0" />
                ) : voiceStatus === "thinking" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
                  />
                ) : voiceStatus === "speaking" ? (
                  <Volume2 aria-hidden="true" className="h-4 w-4 shrink-0" />
                ) : (
                  <Mic aria-hidden="true" className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">{statusDisplay().text}</span>
                {synthesisSupported ? (
                  <span className="hidden rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted sm:inline">
                    Playback on
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleMicClick}
                disabled={loading}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[10px] border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50",
                  voiceStatus === "listening"
                    ? "border-danger/30 bg-danger-soft text-danger"
                    : voiceStatus === "speaking"
                      ? "border-accent/30 bg-accent/10 text-accent"
                      : "border-border bg-surface text-muted hover:border-accent/35 hover:text-foreground",
                )}
                aria-label={
                  voiceStatus === "listening"
                    ? "Stop voice input"
                    : voiceStatus === "speaking"
                      ? "Stop patient playback"
                      : "Start voice input"
                }
              >
                {voiceStatus === "listening" ? (
                  <MicOff aria-hidden="true" className="h-4 w-4" />
                ) : voiceStatus === "speaking" ? (
                  <Square aria-hidden="true" className="h-3.5 w-3.5" />
                ) : (
                  <Mic aria-hidden="true" className="h-4 w-4" />
                )}
                {voiceStatus === "listening" ? "Stop" : voiceStatus === "speaking" ? "Stop" : "Start"}
              </button>
            </div>
            {recordingError ? (
              <p className="mx-auto mt-1.5 max-w-3xl text-xs text-danger" role="alert">
                Voice input is unavailable. You can continue by typing your questions.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="px-3 py-3 sm:px-6">
          <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:gap-3">
            {voiceMode && speechRecognitionSupported && voiceStatus !== "idle" ? (
              <div className="flex min-h-11 items-center rounded-[10px] border border-border bg-surface-subtle px-3 text-sm text-muted">
                Voice mode is active. Use the voice control above or turn voice mode off to type.
              </div>
            ) : (
              <form
                className="relative min-w-0"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSend();
                }}
              >
                <label htmlFor="osce-question" className="sr-only">
                  Question for the simulated patient
                </label>
                <input
                  id="osce-question"
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask the simulated patient a question"
                  disabled={loading}
                  autoComplete="off"
                  className="min-h-11 w-full rounded-[10px] border border-border bg-background px-3.5 pr-12 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-1 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-[9px] text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-30"
                  aria-label="Send question"
                >
                  <Send aria-hidden="true" className="h-4 w-4" />
                </button>
              </form>
            )}
            <button
              type="button"
              onClick={handleSubmitClick}
              disabled={loading}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-[10px] border border-danger/30 bg-danger-soft px-3 text-sm font-semibold text-danger transition-colors hover:border-danger/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:opacity-50 sm:px-4"
            >
              Finish station
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
