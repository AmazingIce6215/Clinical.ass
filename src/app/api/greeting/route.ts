import { NextResponse } from "next/server";
import { getGroqClient, AI_MODELS } from "@/lib/groq";

const greetingBank: Record<string, string[]> = {
  LATE_NIGHT: [
    "HEY NIGHT OWL [NAME]",
    "HELLO DARKNESS MY OLD FRIEND",
    "GOOD ALMOST-MORNING [NAME]",
    "HEY STILL AWAKE [NAME]",
    "GREETINGS FELLOW INSOMNIAC",
    "HELLO CAFFEINE DEPENDENT [NAME]",
    "HEY SLEEPLESS IN GRODNO",
    "GOOD UNGODLY HOUR [NAME]",
    "HELLO FUTURE SLEEP-DEPRIVED DOCTOR",
    "HEY [NAME] YOUR BED MISSES YOU",
    "GREETINGS FROM THE VOID [NAME]",
    "HELLO [NAME] THE NIGHT IS YOUNG",
    "HEY BURNING MIDNIGHT OIL AGAIN",
    "GOOD WHATEVER THIS HOUR IS [NAME]",
    "HELLO BRAVE SOUL [NAME]",
  ],
  EARLY_MORNING: [
    "GOOD EARLY MORNING [NAME]",
    "HEY EARLY BIRD [NAME]",
    "HELLO SUNRISE CHASER [NAME]",
    "GOOD DAWN [NAME]",
    "HEY YOU BEAT THE ATTENDINGS IN",
    "HELLO FIRST ONE UP [NAME]",
    "GREETINGS EARLY RISER [NAME]",
    "HEY [NAME] THE WARD APPROVES",
    "GOOD PRE-ROUND MORNING [NAME]",
    "HELLO DEDICATED ONE [NAME]",
    "HEY [NAME] UP BEFORE THE SUN",
    "GOOD MORNING OVERACHIEVER [NAME]",
    "HELLO [NAME] COFFEE IS READY",
    "HEY [NAME] YOUR FUTURE THANKS YOU",
    "GOOD HUSTLE HOUR [NAME]",
  ],
  MORNING: [
    "GOOD MORNING [NAME]",
    "HEY MORNING SUNSHINE [NAME]",
    "HELLO FRESH BRAIN [NAME]",
    "GOOD MORNING FUTURE DOCTOR [NAME]",
    "HEY [NAME] READY TO SAVE LIVES",
    "HELLO BRIGHT AND EARLY [NAME]",
    "GOOD MORNING WARD ROUND AWAITS",
    "HEY [NAME] WHITE COAT ON",
    "HELLO MORNING GRINDER [NAME]",
    "GOOD MORNING TOP OF THE CLASS",
    "HEY [NAME] LETS MAKE IT COUNT",
    "HELLO [NAME] RISE AND DIAGNOSE",
    "GOOD MORNING DOCTOR IN TRAINING",
    "HEY [NAME] COFFEE THEN CONQUER",
    "HELLO CHAMPION GOOD MORNING",
  ],
  AFTERNOON: [
    "GOOD AFTERNOON [NAME]",
    "HEY AFTERNOON [NAME]",
    "HELLO POST-LUNCH [NAME]",
    "HAPPY AFTER LUNCH [NAME]",
    "HEY [NAME] HOPE LUNCH WAS GOOD",
    "GOOD AFTERNOON FUTURE CONSULTANT",
    "HELLO [NAME] FIGHTING THE FOOD COMA",
    "HEY FULL STOMACH [NAME]",
    "GOOD AFTERNOON OVERACHIEVER [NAME]",
    "HELLO [NAME] SECOND HALF BEGINS",
    "HEY [NAME] LUNCH WAS THE EASY PART",
    "GOOD AFTERNOON GRIND TIME [NAME]",
    "HELLO [NAME] BACK AT IT AGAIN",
    "HEY POST-LUNCH BRAIN ACTIVATED [NAME]",
    "GOOD AFTERNOON CHAMPION [NAME]",
  ],
  LATE_AFTERNOON: [
    "HEY GOLDEN HOUR [NAME]",
    "HELLO LATE AFTERNOON [NAME]",
    "GOOD EVENING ALMOST [NAME]",
    "HEY [NAME] FINAL STRETCH",
    "HELLO [NAME] ALMOST THROUGH IT",
    "HEY STILL GRINDING [NAME]",
    "GOOD LATE AFTERNOON [NAME]",
    "HELLO [NAME] DONT STOP NOW",
    "HEY [NAME] THREE MORE HOURS",
    "GOOD HUSTLE [NAME] KEEP GOING",
    "HELLO RESILIENT ONE [NAME]",
    "HEY [NAME] LAST PUSH OF THE DAY",
    "GOOD AFTERNOON STILL GOING [NAME]",
    "HELLO RESILIENT ONE [NAME]",
    "HEY [NAME] SUNSET STUDY SESSION",
  ],
  EVENING: [
    "GOOD EVENING [NAME]",
    "HEY EVENING SCHOLAR [NAME]",
    "HELLO DINNER SURVIVOR [NAME]",
    "GOOD EVENING FUTURE DOCTOR [NAME]",
    "HEY [NAME] EVENING SHIFT BEGINS",
    "HELLO [NAME] LIGHTS ON BOOKS OPEN",
    "GOOD EVENING NIGHT SHIFT [NAME]",
    "HEY [NAME] ONE MORE TOPIC",
    "HELLO EVENING GRINDER [NAME]",
    "GOOD EVENING DEDICATED [NAME]",
    "HEY [NAME] THE LIBRARY IS YOURS",
    "HELLO [NAME] EVENING ROUNDS BEGIN",
    "GOOD EVENING CHAMPION [NAME]",
    "HEY [NAME] STARS COMING OUT SOON",
    "HELLO [NAME] ANOTHER EVENING ANOTHER LESSON",
  ],
  NIGHT: [
    "GOOD NIGHT OWL [NAME]",
    "HEY NIGHT SHIFT [NAME]",
    "HELLO NIGHT MODE [NAME]",
    "GOOD LATE EVENING [NAME]",
    "HEY [NAME] BURNING THAT MIDNIGHT OIL",
    "HELLO NOCTURNAL SCHOLAR [NAME]",
    "GOOD NIGHT GRINDER [NAME]",
    "HEY [NAME] THE NIGHT IS YOURS",
    "HELLO [NAME] STARS OUT BOOKS OPEN",
    "GOOD NIGHT SESSION [NAME]",
    "HEY [NAME] YOUR CONSULTANT IS ASLEEP",
    "HELLO DEDICATED NIGHT OWL [NAME]",
    "GOOD EVENING STILL GOING [NAME]",
    "HEY [NAME] NIGHT MODE ACTIVATED",
    "HELLO [NAME] THE GRIND NEVER STOPS",
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
