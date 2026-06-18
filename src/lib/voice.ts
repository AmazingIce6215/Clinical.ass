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
    continuous: boolean;
    interimResults: boolean;
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

const PREMIUM_VOICES = new Set([
  "Samantha", "Karen", "Fiona", "Moira", "Tessa", "Veena",
]);

let cachedVoices: SpeechSynthesisVoice[] | null = null;

function loadVoices(): SpeechSynthesisVoice[] {
  if (cachedVoices && cachedVoices.length > 0) return cachedVoices;
  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) {
    const sorted = [...voices].sort((a, b) => {
      const aScore = (a.lang.startsWith("en") ? 2 : 0) + (PREMIUM_VOICES.has(a.name) ? 3 : a.name.includes("Premium") || a.name.includes("Neural") ? 1 : 0);
      const bScore = (b.lang.startsWith("en") ? 2 : 0) + (PREMIUM_VOICES.has(b.name) ? 3 : b.name.includes("Premium") || b.name.includes("Neural") ? 1 : 0);
      return bScore - aScore;
    });
    cachedVoices = sorted;
  }
  return cachedVoices ?? [];
}

export function warmVoiceCache(): void {
  if (!isSpeechSynthesisSupported()) return;
  loadVoices();
  speechSynthesis.onvoiceschanged = () => {
    cachedVoices = null;
    loadVoices();
  };
}

export function findBestVoice(): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  for (const name of PREMIUM_VOICES) {
    const match = voices.find((v) => v.name === name && v.lang.startsWith("en"));
    if (match) return match;
  }
  const neural = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Neural") || v.name.includes("Premium") || v.name.includes("Enhanced")));
  if (neural) return neural;
  const female = voices.find((v) => v.lang.startsWith("en") && /female|samantha|karen|fiona|moira|tessa|veena|zira|hazel|heather|ava|emma|martha|sarah|jenny|salli|joanna|kimberly|kendra|alexa/i.test(v.name));
  if (female) return female;
  const enVoice = voices.find((v) => v.lang.startsWith("en"));
  if (enVoice) return enVoice;
  return voices[0] ?? null;
}

function analyzeEmotion(text: string): { rate: number; pitch: number } {
  let rate = 0;
  let pitch = 0;

  const actionMatches = text.match(/\*([^*]+)\*/g);
  if (actionMatches) {
    for (const m of actionMatches) {
      const a = m.slice(1, -1).toLowerCase().trim();
      if (/laugh|chuckle|giggle|amused|happily|joy/i.test(a)) {
        rate += 12; pitch += 6;
      } else if (/sigh|tired|weary|exhausted|yawn/i.test(a)) {
        rate -= 12; pitch -= 6;
      } else if (/whisper|quiet|softly|gently|murmur/i.test(a)) {
        rate -= 18; pitch -= 12;
      } else if (/urgent|urgently|worried|anxious|nervous/i.test(a)) {
        rate += 18; pitch += 12;
      } else if (/calm|calmly|relaxed|peaceful/i.test(a)) {
        rate -= 12; pitch -= 6;
      } else if (/sad|sadly|tearful|crying|cries|sob/i.test(a)) {
        rate -= 18; pitch -= 12;
      } else if (/angry|angrily|frustrated|annoyed|irritated/i.test(a)) {
        rate += 12; pitch += 12;
      } else if (/shout|loud|exclaimed|excited|exclaim/i.test(a)) {
        rate += 22; pitch += 18;
      }
    }
  }

  const lower = text.toLowerCase();
  if (/terrible|agonizing|excruciating|unbearable/i.test(lower)) rate -= 8;
  if (/scared|terrified|frightened|panicking/i.test(lower)) { rate += 10; pitch += 8; }
  if (/relieved|grateful|thankful|better/i.test(lower)) { rate -= 5; pitch -= 3; }
  if (/confused|unsure|don't know|not sure/i.test(lower)) { rate -= 6; pitch -= 4; }

  return {
    rate: Math.max(-50, Math.min(100, rate)),
    pitch: Math.max(-50, Math.min(50, pitch)),
  };
}

function cleanText(text: string): string {
  return text
    .replace(/\*[^*]+\*/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([.!?])\s*/g, "$1 ")
    .replace(/\s*([,;:])\s*/g, "$1 ")
    .trim();
}

function addNaturalPauses(text: string): string {
  return text
    .replace(/\. /g, ". ... ")
    .replace(/\? /g, "? ... ")
    .replace(/\! /g, "! ... ")
    .replace(/, /g, ", .. ")
    .replace(/\.\.\./g, " ... ")
    .replace(/\.\./g, " .. ");
}

let speechCallId = 0;

export function stopSpeaking(): void {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
  speechCallId++;
}

export function isSpeaking(): boolean {
  return speechSynthesis.speaking;
}

export function speak(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
): void {
  if (!isSpeechSynthesisSupported()) return;

  const callId = ++speechCallId;
  stopSpeaking();

  const processed = cleanText(text);
  if (!processed) {
    onEnd?.();
    return;
  }

  const emotion = analyzeEmotion(text);
  const withPauses = addNaturalPauses(processed);

  const utterance = new SpeechSynthesisUtterance(withPauses);
  utterance.lang = "en-US";
  utterance.rate = Math.max(0.1, Math.min(2, 0.9 + emotion.rate / 100));
  utterance.pitch = Math.max(0.1, Math.min(2, 1.0 + emotion.pitch / 100));
  utterance.volume = 1.0;

  const voice = findBestVoice();
  if (voice) utterance.voice = voice;

  utterance.onstart = () => {
    if (callId === speechCallId) onStart?.();
  };

  utterance.onend = () => {
    if (callId === speechCallId) onEnd?.();
  };

  utterance.onerror = () => {
    if (callId === speechCallId) onEnd?.();
  };

  speechSynthesis.speak(utterance);
}
