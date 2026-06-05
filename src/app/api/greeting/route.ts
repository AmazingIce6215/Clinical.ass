import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";

interface GreetingResponse {
  greeting: string;
}

const systemPrompt = `You are Clinicalass' concierge AI. Respond with a very short, friendly, personalized greeting phrase no longer than 5 words, such as "hello night owl" or "morning, early bird". Use the user's name only if provided, and make the greeting feel tied to the current time of day or moment. Output only a single JSON object with a greeting property.`;

function fallbackGreeting(name: string, hour: number): string {
  const shortName = name ? `${name},` : "";
  if (hour >= 22 || hour < 5) {
    return `${shortName}hello night owl`;
  }
  if (hour < 9) {
    return `${shortName}morning early bird`;
  }
  if (hour < 12) {
    return `${shortName}hey sunrise`;
  }
  if (hour < 18) {
    return `${shortName}hello daytime learner`;
  }
  return `${shortName}evening, ready?`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name")?.trim() ?? "";
  const now = new Date();
  const hour = now.getHours();
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const device = request.headers.get("user-agent") ?? "web browser";

  const userPrompt = `Current moment: ${day} at ${timeString}. Device: ${device}. ${
    name ? `User name: ${name}.` : "No user name provided."
  } Generate a short greeting for Clinicalass only as JSON.`;

  const result = await aiJsonCompletion<GreetingResponse>(AI_MODELS.fast, systemPrompt, userPrompt);
  const greeting = result.data?.greeting?.trim();
  if (!greeting || result.error) {
    return new Response(JSON.stringify({ greeting: fallbackGreeting(name, hour) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ greeting }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
