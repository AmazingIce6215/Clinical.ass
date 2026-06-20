"use client";

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
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

function findBestVoice(): SpeechSynthesisVoice | null {
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

export function stopSpeaking(): void {
  if (speechSynthesis.speaking) speechSynthesis.cancel();
  speechCallId++;
}

export function speak(text: string, onEnd?: () => void): void {
  if (!isSpeechSynthesisSupported()) return;
  stopSpeaking();
  const callId = ++speechCallId;
  const cleaned = cleanText(text);
  if (!cleaned) { onEnd?.(); return; }
  const emotion = analyzeEmotion(text);
  const u = new SpeechSynthesisUtterance(cleaned);
  u.lang = "en-US";
  u.rate = Math.max(0.1, Math.min(2, 0.9 + emotion.rate / 100));
  u.pitch = Math.max(0.1, Math.min(2, 1.0 + emotion.pitch / 100));
  u.volume = 1.0;
  const v = findBestVoice();
  if (v) u.voice = v;
  u.onend = () => { if (callId === speechCallId) onEnd?.(); };
  u.onerror = () => { if (callId === speechCallId) onEnd?.(); };
  speechSynthesis.speak(u);
}
