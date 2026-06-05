import { NextResponse } from "next/server";

interface GreetingResponse {
  greeting: string;
}

function getTimePeriod(hour: number): string {
  if (hour >= 5 && hour < 12) return "MORNING";
  if (hour >= 12 && hour < 14) return "AFTERNOON";
  if (hour >= 14 && hour < 18) return "AFTERNOON";
  if (hour >= 18 && hour < 21) return "EVENING";
  if (hour >= 21 && hour < 24) return "NIGHT";
  return "LATE_NIGHT";
}

const fallbackGreetings: Record<string, string[]> = {
  MORNING: ["RISE AND SHINE DOCTOR", "GOOD MORNING SUNSHINE", "EARLY BIRD GETS THE GRADE", "MORNING GRIND STARTS NOW", "COFFEE FIRST DIAGNOSIS LATER"],
  AFTERNOON: ["HOPE LUNCH WAS GOOD", "POST-LUNCH BRAIN ACTIVATED", "FED AND READY TO LEARN", "AFTERNOON GRIND TIME", "COFFEE O'CLOCK ALREADY"],
  EVENING: ["EVENING SHIFT BEGINS", "DINNER DONE LETS GO", "GOLDEN HOUR STUDY TIME", "EVENING WARRIOR MODE", "NIGHT SHIFT APPROACHING"],
  NIGHT: ["BURNING THE MIDNIGHT OIL", "NIGHT MODE ACTIVATED", "STARS OUT BOOKS OPEN", "LATE NIGHT STUDY SESSION", "NIGHT OWL IN THE HOUSE"],
  LATE_NIGHT: ["STILL AWAKE HUH", "NIGHT OWL SPOTTED", "SLEEP IS FOR ATTENDINGS", "REALLY LATE BUT RESPECT", "FINAL STRETCH DOCTOR"],
};

function getRandomFallback(timePeriod: string): string {
  const greetings = fallbackGreetings[timePeriod] || fallbackGreetings.MORNING;
  return greetings[Math.floor(Math.random() * greetings.length)];
}

async function callAnthropicAPI(timePeriod: string, timeString: string): Promise<string | null> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log("ANTHROPIC_API_KEY not configured, using fallback");
      return null;
    }

    const systemPrompt = "You are a witty, warm, slightly playful companion greeting a medical student opening their study app. Generate ONE short greeting line (max 6 words) based on the time of day. No punctuation at the end. All caps. Be creative, personal, and fun — not generic.";

    const userPrompt = `Current time: ${timeString}. Time period: ${timePeriod}. Generate a greeting.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 50,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const greeting = data.content?.[0]?.text?.trim().toUpperCase();
    return greeting || null;
  } catch (error) {
    console.error("Error calling Anthropic API:", error);
    return null;
  }
}

export async function GET(request: Request) {
  const now = new Date();
  const hour = now.getHours();
  const timePeriod = getTimePeriod(hour);
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // Try Anthropic API first
  const aiGreeting = await callAnthropicAPI(timePeriod, timeString);

  // Fall back to random local greeting if API fails
  const greeting = aiGreeting || getRandomFallback(timePeriod);

  return NextResponse.json({ greeting });
}
