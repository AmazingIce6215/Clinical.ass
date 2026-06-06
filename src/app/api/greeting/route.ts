import { NextResponse } from "next/server";
import { getGroqClient, AI_MODELS } from "@/lib/groq";

const greetingBank: Record<string, string[]> = {
  LATE_NIGHT: [
    "GOOD NIGHT",
    "HELLO",
    "HEY",
    "GOOD EVENING",
    "GREETINGS",
  ],
  EARLY_MORNING: [
    "GOOD MORNING",
    "HELLO",
    "HEY",
    "GOOD EARLY",
    "GREETINGS",
  ],
  MORNING: [
    "GOOD MORNING",
    "HELLO",
    "HEY",
    "GOOD DAY",
    "GREETINGS",
  ],
  AFTERNOON: [
    "GOOD AFTERNOON",
    "HELLO",
    "HEY",
    "GOOD DAY",
    "GREETINGS",
  ],
  LATE_AFTERNOON: [
    "GOOD AFTERNOON",
    "HELLO",
    "HEY",
    "GOOD EVENING",
    "GREETINGS",
  ],
  EVENING: [
    "GOOD EVENING",
    "HELLO",
    "HEY",
    "GOOD NIGHT",
    "GREETINGS",
  ],
  NIGHT: [
    "GOOD EVENING",
    "HELLO",
    "HEY",
    "GOOD NIGHT",
    "GREETINGS",
  ],
};

function getTimePeriod(hour: number): string {
  if (hour >= 4 && hour < 7) return "EARLY_MORNING";
  if (hour >= 7 && hour < 12) return "MORNING";
  if (hour >= 12 && hour < 15) return "AFTERNOON";
  if (hour >= 15 && hour < 18) return "LATE_AFTERNOON";
  if (hour >= 18 && hour < 21) return "EVENING";
  if (hour >= 21 && hour < 24) return "NIGHT";
  return "LATE_NIGHT";
}

function replaceNameTokens(text: string, name: string): string {
  const upperName = name.toUpperCase();
  return text.replace(/\[NAME\]/g, upperName);
}

const VALID_GREETING_PREFIXES = [
  "HEY",
  "HELLO",
  "GOOD",
  "GREETINGS",
  "HAPPY",
];

function ensureGreetingText(raw: string): string {
  const sanitized = raw
    .trim()
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.?!]+$/g, "")
    .toUpperCase();

  const words = sanitized.split(" ").filter(Boolean);
  if (words.length <= 7) return sanitized;
  return words.slice(0, 7).join(" ");
}

function isValidGreeting(greeting: string, name: string): boolean {
  const trimmed = greeting.trim();
  if (!trimmed) return false;
  const words = trimmed.split(" ").filter(Boolean);
  if (words.length === 0 || words.length > 7) return false;
  const prefix = words[0];
  if (!VALID_GREETING_PREFIXES.includes(prefix)) return false;
  const upperName = name.toUpperCase();
  if (!trimmed.includes(upperName)) return false;
  if (!/^[A-Z0-9\-\' ]+$/.test(trimmed)) return false;
  return true;
}

function getRandomGreeting(timePeriod: string, name: string): string {
  const timeGreetings = greetingBank[timePeriod] || greetingBank.MORNING;
  const greeting = timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
  return replaceNameTokens(greeting, name);
}

function buildSystemPrompt(name: string, timePeriod: string): string {
  const exampleList = (greetingBank[timePeriod] || greetingBank.MORNING)
    .map((item) => item.replace(/\[NAME\]/g, name.toUpperCase()))
    .join(", ");

  return `You are generating a greeting for a medical student named ${name.toUpperCase()} opening their clinical study app. Current time period: ${timePeriod}. Generate ONE greeting that:
- Starts with a greeting word (Hey, Hello, Good Morning, Greetings, Happy, etc.)
- Includes the name ${name.toUpperCase()} naturally
- Is ALL CAPS
- Is maximum 6-7 words
- Is warm, witty, and med-student aware
- Feels fresh and personal, not generic

Here are example style references for this time period:
${exampleList}

The examples in this prompt are style guides only — generate a NEW greeting, not a copy from the list.
Return ONLY the greeting text. Nothing else. No punctuation at the end.`;
}

async function fetchAiGreeting(name: string, timePeriod: string): Promise<string | null> {
  const groq = getGroqClient();
  if (!groq) return null;

  try {
    const systemPrompt = buildSystemPrompt(name, timePeriod);
    const completion = await groq.chat.completions.create({
      model: AI_MODELS.smart,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content;
    if (!raw || typeof raw !== "string") return null;

    const greeting = ensureGreetingText(raw);
    if (!isValidGreeting(greeting, name)) return null;
    return greeting;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nameParam = url.searchParams.get("name")?.trim() || "STUDENT";
  const name = nameParam || "STUDENT";

  const now = new Date();
  const hour = now.getHours();
  const timePeriod = getTimePeriod(hour);

  const aiGreeting = await fetchAiGreeting(name, timePeriod);
  const greeting = aiGreeting ?? getRandomGreeting(timePeriod, name);

  return NextResponse.json({ greeting }, { headers: { "Cache-Control": "no-store" } });
}
