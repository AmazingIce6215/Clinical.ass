"use client";

export type VoiceQuality = "premium" | "standard" | "basic";

export function isSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

export function isApiSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(navigator.mediaDevices && typeof MediaRecorder !== "undefined");
}

export const EDGE_TTS_VOICES = [
  { id: "en-US-JennyNeural", label: "Jenny (US, Female)" },
  { id: "en-US-AriaNeural", label: "Aria (US, Female)" },
  { id: "en-US-GuyNeural", label: "Guy (US, Male)" },
  { id: "en-US-DavisNeural", label: "Davis (US, Male)" },
  { id: "en-GB-SoniaNeural", label: "Sonia (UK, Female)" },
  { id: "en-GB-LibbyNeural", label: "Libby (UK, Female)" },
  { id: "en-GB-RyanNeural", label: "Ryan (UK, Male)" },
  { id: "en-AU-NatashaNeural", label: "Natasha (AU, Female)" },
] as const;

export function getEdgeVoiceLabel(voiceId: string): string {
  return EDGE_TTS_VOICES.find((v) => v.id === voiceId)?.label ?? voiceId;
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

export function createApiSpeechRecognizer(
  onResult: (text: string) => void,
  onEnd: () => void,
  onError: (error: string) => void,
): SpeechRecognizer | null {
  if (!isApiSpeechSupported()) return null;

  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let running = false;
  let stream: MediaStream | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let mimeType = "audio/webm";

  function getBestMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return "audio/webm";
  }

  async function startInternal() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mimeType = getBestMimeType();
      chunks = [];

      mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const stopRecorder = () => {
        if (mediaRecorder?.state === "recording") {
          mediaRecorder.stop();
        }
      };

      mediaRecorder.onstop = async () => {
        running = false;
        if (timeoutId) clearTimeout(timeoutId);

        stream?.getTracks().forEach((t) => t.stop());
        stream = null;

        if (chunks.length === 0) {
          onEnd();
          return;
        }

        const blob = new Blob(chunks, { type: mimeType });
        chunks = [];

        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

          const res = await fetch("/api/stt", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(data.error || "Transcription failed");
          }

          const data = (await res.json()) as { text: string };
          if (data.text?.trim()) {
            onResult(data.text.trim());
          }
          onEnd();
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Transcription failed";
          onError(message);
          onEnd();
        }
      };

      mediaRecorder.onerror = () => {
        running = false;
        if (timeoutId) clearTimeout(timeoutId);
        stream?.getTracks().forEach((t) => t.stop());
        stream = null;
        onError("Recording error");
        onEnd();
      };

      mediaRecorder.start();
      running = true;

      timeoutId = setTimeout(stopRecorder, 30000);
    } catch {
      running = false;
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      const browserRecognizer = createSpeechRecognizer(
        onResult,
        onEnd,
        onError,
      );
      if (browserRecognizer) {
        browserRecognizer.start();
        return;
      }
      onError("Microphone access denied");
      onEnd();
    }
  }

  function start() {
    if (running) return;
    running = true;
    startInternal();
  }

  function abort() {
    if (timeoutId) clearTimeout(timeoutId);
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.onstop = null;
      try {
        mediaRecorder.stop();
      } catch {
        // ignore
      }
    }
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
    mediaRecorder = null;
    chunks = [];
    running = false;
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
let currentAudio: HTMLAudioElement | null = null;

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
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return speechSynthesis.speaking || currentAudio !== null;
}

export async function apiSpeak(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  voice?: string,
): Promise<void> {
  if (typeof window === "undefined") return;

  stopSpeaking();
  speakingAborted = false;

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: processTextForSpeech(text),
        voice: voice || "en-US-JennyNeural",
        rate: 0,
        pitch: 0,
      }),
    });

    if (!res.ok) throw new Error("TTS API failed");
    if (speakingAborted) return;

    const blob = await res.blob();
    if (speakingAborted) return;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      if (!speakingAborted) onEnd?.();
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      if (!speakingAborted) onEnd?.();
    };

    onStart?.();

    try {
      await audio.play();
    } catch {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      if (!speakingAborted) onEnd?.();
    }
  } catch {
    if (!speakingAborted) {
      speak(text, onStart, onEnd);
    }
  }
}
