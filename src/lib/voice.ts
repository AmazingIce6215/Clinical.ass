"use client";

import type { Sex } from "@/lib/types";

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

const FEMALE_VOICES = new Set([
  "Samantha", "Karen", "Fiona", "Moira", "Tessa", "Veena", "Zira", "Hazel", "Heather", "Ava", "Emma", "Martha", "Sarah", "Jenny", "Salli", "Joanna", "Kimberly", "Kendra", "Alexa",
]);
const MALE_VOICES = new Set([
  "Daniel", "George", "Mark", "Oliver", "Thomas", "David", "Alex", "Aron", "Aiden", "Ryan", "Brandon", "Peter", "John",
]);

let cachedVoices: SpeechSynthesisVoice[] | null = null;

function loadVoices(): SpeechSynthesisVoice[] {
  if (cachedVoices && cachedVoices.length > 0) return cachedVoices;
  const voices = speechSynthesis.getVoices();
  if (voices.length > 0) {
    const sorted = [...voices].sort((a, b) => {
      const aScore = (a.lang.startsWith("en") ? 2 : 0) + (a.name.includes("Neural") ? 4 : 0) + (a.name.includes("Premium") ? 3 : 0) + (a.name.includes("Enhanced") ? 2 : 0);
      const bScore = (b.lang.startsWith("en") ? 2 : 0) + (b.name.includes("Neural") ? 4 : 0) + (b.name.includes("Premium") ? 3 : 0) + (b.name.includes("Enhanced") ? 2 : 0);
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

function findBestVoice(sex?: Sex): SpeechSynthesisVoice | null {
  const voices = loadVoices();
  const english = voices.filter((v) => v.lang.startsWith("en"));
  const score = (voice: SpeechSynthesisVoice) =>
    (voice.lang.startsWith("en") ? 3 : 0) +
    (voice.name.includes("Neural") ? 4 : 0) +
    (voice.name.includes("Premium") ? 3 : 0) +
    (voice.name.includes("Enhanced") ? 2 : 0) +
    (voice.localService ? 1 : 0);

  const gendered = english.filter((v) => {
    if (!sex || sex === "other") return true;
    const name = v.name.toLowerCase();
    if (sex === "female") {
      return FEMALE_VOICES.has(v.name) || /female|woman|girl|samantha|karen|fiona|moira|tessa|veena|zira|hazel|heather|ava|emma|martha|sarah|jenny|salli|joanna|kimberly|kendra|alexa/.test(name);
    }
    return MALE_VOICES.has(v.name) || /male|man|boy|daniel|george|mark|oliver|thomas|david|alex|aron|aiden|ryan|brandon|peter|john/.test(name);
  });

  const rankedGendered = [...gendered].sort((a, b) => score(b) - score(a));
  if (rankedGendered.length > 0) return rankedGendered[0];

  const rankedEnglish = [...english].sort((a, b) => score(b) - score(a));
  if (rankedEnglish.length > 0) return rankedEnglish[0];

  return [...voices].sort((a, b) => score(b) - score(a))[0] ?? null;
}

function getVoiceStyle(sex?: Sex): { rate: number; pitch: number } {
  if (sex === "female") return { rate: 0.95, pitch: 1.08 };
  if (sex === "male") return { rate: 0.94, pitch: 0.92 };
  return { rate: 0.95, pitch: 1.0 };
}

function analyzeEmotion(text: string): { rate: number; pitch: number } {
  let rate = 0;
  let pitch = 0;
  const m = text.match(/\*([^*]+)\*/g);
  if (m) {
    for (const match of m) {
      const a = match.slice(1, -1).toLowerCase();
      if (/laugh|chuckle|giggle|amused|happily|joy/i.test(a)) { rate += 12; pitch += 6; }
      else if (/sigh|tired|weary|exhausted|yawn/i.test(a)) { rate -= 12; pitch -= 6; }
      else if (/whisper|quiet|softly|gently|murmur/i.test(a)) { rate -= 18; pitch -= 12; }
      else if (/urgent|worried|anxious|nervous/i.test(a)) { rate += 18; pitch += 12; }
      else if (/calm|calmly|relaxed|peaceful/i.test(a)) { rate -= 12; pitch -= 6; }
      else if (/sad|sadly|tearful|crying|cries|sob/i.test(a)) { rate -= 18; pitch -= 12; }
      else if (/angry|angrily|frustrated|annoyed|irritated/i.test(a)) { rate += 12; pitch += 12; }
      else if (/shout|loud|exclaimed|excited|exclaim/i.test(a)) { rate += 22; pitch += 18; }
    }
  }
  return {
    rate: Math.max(-50, Math.min(100, rate)),
    pitch: Math.max(-50, Math.min(50, pitch)),
  };
}

function cleanText(text: string): string {
  return text.replace(/\*[^*]+\*/g, "").replace(/\s+/g, " ").trim();
}

let speechCallId = 0;
let naturalVoiceCallId = 0;

export function stopSpeaking(): void {
  if (speechSynthesis.speaking) speechSynthesis.cancel();
  speechCallId++;
}

export function speak(text: string, onEnd?: () => void, options?: { sex?: Sex }): void {
  if (!isSpeechSynthesisSupported()) return;
  stopSpeaking();
  const callId = ++speechCallId;
  const cleaned = cleanText(text);
  if (!cleaned) { onEnd?.(); return; }
  const emotion = analyzeEmotion(text);
  const u = new SpeechSynthesisUtterance(cleaned);
  u.lang = "en-US";
  const voiceStyle = getVoiceStyle(options?.sex);
  u.rate = Math.max(0.1, Math.min(2, voiceStyle.rate + emotion.rate / 120));
  u.pitch = Math.max(0.1, Math.min(2, voiceStyle.pitch + emotion.pitch / 120));
  u.volume = 1.0;
  const v = findBestVoice(options?.sex);
  if (v) u.voice = v;
  u.onend = () => { if (callId === speechCallId) onEnd?.(); };
  u.onerror = () => { if (callId === speechCallId) onEnd?.(); };
  speechSynthesis.speak(u);
}

export async function speakNatural(
  text: string,
  onEnd?: () => void,
  options?: { sex?: Sex; voice?: string; rate?: number; pitch?: number },
): Promise<void> {
  const callId = ++naturalVoiceCallId;
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice: options?.voice,
        rate: options?.rate,
        pitch: options?.pitch,
      }),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const blob = await res.blob();
    if (callId !== naturalVoiceCallId) return;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (callId === naturalVoiceCallId) onEnd?.();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (callId === naturalVoiceCallId) onEnd?.();
    };
    await audio.play();
  } catch {
    if (callId === naturalVoiceCallId) {
      speak(text, onEnd, options);
    }
  }
}

export function stopNaturalVoice(): void {
  naturalVoiceCallId++;
}
