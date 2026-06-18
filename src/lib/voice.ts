"use client";

export type VoiceQuality = "premium" | "standard" | "basic";

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

const PREMIUM_VOICE_NAMES = ["Samantha", "Karen", "Fiona", "Moira", "Tessa", "Veena"];

let cachedVoices: SpeechSynthesisVoice[] | null = null;

function getVoices(): SpeechSynthesisVoice[] {
  if (cachedVoices) return cachedVoices;
  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) {
    cachedVoices = voices;
  }
  return voices;
}

export function warmVoiceCache(): void {
  if (!isSpeechSynthesisSupported()) return;
  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) cachedVoices = voices;
  speechSynthesis.onvoiceschanged = () => {
    cachedVoices = speechSynthesis.getVoices();
  };
}

export function findBestVoice(): SpeechSynthesisVoice | null {
  const voices = getVoices();

  for (const name of PREMIUM_VOICE_NAMES) {
    const match = voices.find((v) => v.name === name && v.lang.startsWith("en"));
    if (match) return match;
  }

  const female = voices.find((v) => v.lang.startsWith("en") && /female|samantha|karen|fiona|moira|tessa|veena|zira|hazel|heather|ava|emma|martha|sarah|jenny|salli|joanna|kimberly|kendra/i.test(v.name));
  if (female) return female;

  const enVoice = voices.find((v) => v.lang.startsWith("en"));
  if (enVoice) return enVoice;

  return voices[0] ?? null;
}

export function getVoiceQuality(): VoiceQuality {
  const voice = findBestVoice();
  if (!voice) return "basic";
  if (PREMIUM_VOICE_NAMES.includes(voice.name)) return "premium";
  if (voice.name.includes("Enhanced") || voice.name.includes("Premium") || voice.name.includes("Neural")) return "premium";
  return "standard";
}

export function processTextForSpeech(text: string): string {
  let processed = text;

  processed = processed.replace(/([.!?])\s*/g, "$1 ");

  processed = processed.replace(/([,;:])\s*/g, "$1 ");

  processed = processed.trim();

  return processed;
}

let speakingAborted = false;

export function speak(text: string, onStart?: () => void, onEnd?: () => void): void {
  if (!isSpeechSynthesisSupported()) return;

  stopSpeaking();
  speakingAborted = false;

  const processed = processTextForSpeech(text);
  const utterance = new SpeechSynthesisUtterance(processed);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  utterance.pitch = 1.05;
  utterance.volume = 1.0;

  const bestVoice = findBestVoice();
  if (bestVoice) {
    utterance.voice = bestVoice;
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    if (!speakingAborted) {
      onEnd?.();
    }
  };

  utterance.onerror = () => {
    stopSpeaking();
    if (!speakingAborted) {
      onEnd?.();
    }
  };

  speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  speakingAborted = true;
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return speechSynthesis.speaking;
}
