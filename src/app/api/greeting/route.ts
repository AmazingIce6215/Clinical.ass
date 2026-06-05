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
    "RISE AND SHINE DOCTOR",
    "GOOD MORNING SUNSHINE",
    "EARLY BIRD GETS THE GRADE",
    "MORNING GRIND STARTS NOW",
    "COFFEE FIRST DIAGNOSIS LATER",
    "WAKE UP AND STUDY",
    "MORNING COFFEE MODE",
    "EARLY RISER WINS",
    "SUNRISE STUDY SESSION",
    "MORNING MEDICINE TIME",
    "HELLO EARLY BIRD",
    "MORNING ENERGY ACTIVATED",
    "FIRST PATIENT AWAITS",
    "MORNING ROUNDS READY",
    "DAY ONE MINDSET",
    "FRESH START DOCTOR",
    "MORNING FOCUS MODE",
    "EARLY SHIFT BEGINS",
    "WAKE UP BRAIN",
    "MORNING HUSTLE ON",
  ],
  AFTERNOON: [
    "HOPE LUNCH WAS GOOD",
    "POST-LUNCH BRAIN ACTIVATED",
    "FED AND READY TO LEARN",
    "AFTERNOON GRIND TIME",
    "COFFEE O'CLOCK ALREADY",
    "AFTERNOON SLUMP NO MORE",
    "SECOND WIND COMING",
    "AFTERNOON STUDY POWER",
    "MIDDAY MOTIVATION",
    "AFTERNOON FOCUS MODE",
    "POST-LUNCH LEARNING",
    "AFTERNOON ENERGY BOOST",
    "DAYTIME DOCTOR MODE",
    "AFTERNOON KNOWLEDGE",
    "KEEP PUSHING DOCTOR",
    "AFTERNOON HUSTLE",
    "STILL GRINDING",
    "AFTERNOON WARRIOR",
    "MIDDAY MASTERY",
    "AFTERNOON AMBITION",
  ],
  EVENING: [
    "EVENING SHIFT BEGINS",
    "DINNER DONE LETS GO",
    "GOLDEN HOUR STUDY TIME",
    "EVENING WARRIOR MODE",
    "NIGHT SHIFT APPROACHING",
    "EVENING ENERGY RISING",
    "SUNSET STUDY SESSION",
    "EVENING FOCUS TIME",
    "DINNER OVER STUDY ON",
    "EVENING EXCELLENCE",
    "NIGHT PREP MODE",
    "EVENING GRIND CONTINUES",
    "GOLDEN HOUR LEARNING",
    "EVENING DEDICATION",
    "STILL GOING STRONG",
    "EVENING POWER HOUR",
    "SUNSET SUCCESS",
    "EVENING ELITE MODE",
    "TWILIGHT TIME TO STUDY",
    "EVENING ENDURANCE",
  ],
  NIGHT: [
    "BURNING THE MIDNIGHT OIL",
    "NIGHT MODE ACTIVATED",
    "STARS OUT BOOKS OPEN",
    "LATE NIGHT STUDY SESSION",
    "NIGHT OWL IN THE HOUSE",
    "NIGHT SHIFT DOCTOR",
    "MIDNIGHT MADNESS",
    "LATE NIGHT GRIND",
    "NIGHT KNOWLEDGE",
    "STARS ARE WATCHING",
    "NIGHT NINJA MODE",
    "MIDNIGHT MASTERY",
    "LATE NIGHT LEGEND",
    "NIGHT OWL STUDYING",
    "DARK MODE STUDYING",
    "NIGHT TIME KNOWLEDGE",
    "MOONLIGHT MEDICINE",
    "LATE NIGHT LEARNING",
    "NIGHT SHIFT READY",
    "MIDNIGHT MOTIVATION",
  ],
  LATE_NIGHT: [
    "STILL AWAKE HUH",
    "NIGHT OWL SPOTTED",
    "SLEEP IS FOR ATTENDINGS",
    "REALLY LATE BUT RESPECT",
    "FINAL STRETCH DOCTOR",
    "INSOMNIA STUDY MODE",
    "3AM WARRIOR",
    "LATE NIGHT LEGEND",
    "SLEEP WHEN DEAD",
    "FINAL PUSH DOCTOR",
    "EXTREME NIGHT MODE",
    "LAST ONE STANDING",
    "DEADLY DEDICATION",
    "NIGHT OF THE LIVING STUDENT",
    "FINAL HOURS",
    "EXTREME GRIND",
    "LAST CALL KNOWLEDGE",
    "NIGHT MARATHON",
    "ULTIMATE NIGHT OWL",
    "SLEEPLESS SUCCESS",
  ],
};

function getRandomGreeting(timePeriod: string): string {
  const timeGreetings = greetings[timePeriod] || greetings.MORNING;
  return timeGreetings[Math.floor(Math.random() * timeGreetings.length)];
}

export async function GET(request: Request) {
  const now = new Date();
  const hour = now.getHours();
  const timePeriod = getTimePeriod(hour);

  const greeting = getRandomGreeting(timePeriod);

  return NextResponse.json({ greeting });
}
