"use client";

export function isSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface SpeechRecognizer {
  start: () => void;
  abort: () => void;
  isRunning: () => boolean;
}

export function createSpeechRecognizer(
  onResult: (text: string) => void,
  onEnd: () => void,
  onError: (error: string) => void,
): SpeechRecognizer | null {
  if (!isSpeechSupported()) return null;

  const SpeechRecognitionAPI =
    (window as unknown as Record<string, unknown>).SpeechRecognition ??
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) return null;

  let recognition: {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    maxAlternatives: number;
    start: () => void;
    abort: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onresult: ((event: any) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error: string }) => void) | null;
  } | null = null;
  let running = false;

  function start() {
    if (running) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = new (SpeechRecognitionAPI as any)();
      instance.lang = "en-US";
      instance.interimResults = false;
      instance.continuous = false;
      instance.maxAlternatives = 1;

      instance.onresult = (event: { results: { length: number; [index: number]: { [index: number]: { transcript: string } } } }) => {
        const result = event.results[event.results.length - 1];
        if (result && result[0]) {
          const transcript = result[0].transcript.trim();
          if (transcript) onResult(transcript);
        }
      };

      instance.onend = () => {
        running = false;
        recognition = null;
        onEnd();
      };

      instance.onerror = (event: { error: string }) => {
        running = false;
        recognition = null;
        onError(event.error);
      };

      recognition = instance;
      instance.start();
      running = true;
    } catch {
      running = false;
      onError("Failed to start speech recognition");
    }
  }

  function abort() {
    if (recognition && running) {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    }
    running = false;
    recognition = null;
  }

  function isRunning() {
    return running;
  }

  return { start, abort, isRunning };
}

export function speak(text: string, onEnd?: () => void): void {
  if (!isSpeechSynthesisSupported()) return;

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const voices = speechSynthesis.getVoices();
  const preferredVoice =
    voices.find((v) => v.lang.startsWith("en") && /female/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null;

  if (preferredVoice) utterance.voice = preferredVoice;

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = () => {
    stopSpeaking();
    onEnd?.();
  };

  speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return speechSynthesis.speaking;
}
