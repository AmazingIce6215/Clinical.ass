import { NextResponse } from "next/server";

interface GreetingResponse {
  greeting: string;
}

function getTimePeriod(hour: number): string {
  if (hour >= 5 && hour < 12) return "MORNING";
  if (hour >= 12 && hour < 18) return "AFTERNOON";
  if (hour >= 18 && hour < 21) return "EVENING";
  if (hour >= 21 && hour < 24) return "NIGHT";
  return "LATE_NIGHT";
}

const greetings: Record<string, string[]> = {
  MORNING: [
    "GOOD MORNING",
    "GOOD MORNING",
    "GOOD MORNING",
    "MORNING",
    "MORNING",
    "MORNING",
    "RISE AND SHINE",
    "RISE AND SHINE",
    "GOOD MORNING DOCTOR",
    "GOOD MORNING DOCTOR",
    "EARLY BIRD",
    "EARLY BIRD",
    "MORNING COFFEE",
    "MORNING COFFEE",
    "WAKE UP",
    "WAKE UP",
    "HELLO MORNING",
    "SUNRISE",
    "RISE AND SHINE DOCTOR",
    "EARLY BIRD GETS THE GRADE",
  ],
  AFTERNOON: [
    "GOOD AFTERNOON",
    "GOOD AFTERNOON",
    "GOOD AFTERNOON",
    "AFTERNOON",
    "AFTERNOON",
    "AFTERNOON",
    "GOOD AFTERNOON DOCTOR",
    "GOOD AFTERNOON DOCTOR",
    "AFTERNOON COFFEE",
    "AFTERNOON COFFEE",
    "HELLO AFTERNOON",
    "HELLO AFTERNOON",
    "HOPE LUNCH WAS GOOD",
    "POST-LUNCH",
    "SECOND WIND",
    "KEEP GOING",
    "AFTERNOON GRIND",
    "POST-LUNCH BRAIN ACTIVATED",
    "COFFEE O'CLOCK ALREADY",
  ],
  EVENING: [
    "GOOD EVENING",
    "GOOD EVENING",
    "GOOD EVENING",
    "EVENING",
    "EVENING",
    "EVENING",
    "GOOD EVENING DOCTOR",
    "GOOD EVENING DOCTOR",
    "EVENING STUDY",
    "EVENING STUDY",
    "HELLO EVENING",
    "HELLO EVENING",
    "DINNER DONE",
    "SUNSET",
    "GOLDEN HOUR",
    "STILL GOING",
    "EVENING GRIND",
    "DINNER DONE LETS GO",
    "GOLDEN HOUR STUDY TIME",
    "EVENING WARRIOR MODE",
  ],
  NIGHT: [
    "GOOD NIGHT",
    "GOOD NIGHT",
    "GOOD NIGHT",
    "NIGHT",
    "NIGHT",
    "NIGHT",
    "GOOD NIGHT DOCTOR",
    "GOOD NIGHT DOCTOR",
    "NIGHT STUDY",
    "NIGHT STUDY",
    "HELLO NIGHT",
    "HELLO NIGHT",
    "HEY NIGHT OWL",
    "HEY NIGHT OWL",
    "NIGHT OWL",
    "NIGHT OWL",
    "LATE NIGHT",
    "LATE NIGHT",
    "BURNING THE MIDNIGHT OIL",
    "NIGHT MODE ACTIVATED",
  ],
  LATE_NIGHT: [
    "LATE NIGHT",
    "LATE NIGHT",
    "LATE NIGHT",
    "REALLY LATE",
    "REALLY LATE",
    "STILL AWAKE",
    "STILL AWAKE",
    "HEY NIGHT OWL",
    "NIGHT OWL",
    "NIGHT OWL",
    "LATE NIGHT STUDY",
    "LATE NIGHT STUDY",
    "FINAL STRETCH",
    "FINAL PUSH",
    "STILL GOING",
    "STILL AWAKE HUH",
    "NIGHT OWL SPOTTED",
    "SLEEP IS FOR ATTENDINGS",
    "FINAL STRETCH DOCTOR",
    "3AM WARRIOR",
  ],
};

function personalizeGreeting(greeting: string, name: string): string {
  const upperName = name.toUpperCase();
  
  // Add name to the end of greetings
  if (greeting.includes("DOCTOR")) {
    return greeting.replace("DOCTOR", upperName);
  }
  
  // For specific patterns, append the name
  if (greeting === "MORNING" || greeting === "AFTERNOON" || greeting === "EVENING" || greeting === "NIGHT") {
    return `${greeting} ${upperName}`;
  }
  
  if (greeting === "RISE AND SHINE" || greeting === "WAKE UP") {
    return `${greeting} ${upperName}`;
  }
  
  if (greeting === "EARLY BIRD" || greeting === "NIGHT OWL") {
    return `${greeting} ${upperName}`;
  }
  
  if (greeting === "STILL AWAKE" || greeting === "STILL GOING") {
    return `${greeting} ${upperName}`;
  }
  
  // Default: append name
  return `${greeting} ${upperName}`;
}

function getRandomGreeting(timePeriod: string): string {
  const timeGreetings = greetings[timePeriod] || greetings.MORNING;
  return timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name")?.trim();
  
  const now = new Date();
  const hour = now.getHours();
  const timePeriod = getTimePeriod(hour);

  let greeting = getRandomGreeting(timePeriod);
  
  // Personalize greeting if name is provided
  if (name) {
    greeting = personalizeGreeting(greeting, name);
  }

  return NextResponse.json({ greeting });
}
