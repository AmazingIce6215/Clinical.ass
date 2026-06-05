import { aiJsonCompletion, AI_MODELS } from "@/lib/ai";

interface GreetingResponse {
  greeting: string;
}

const systemPrompt = `You are Clinicalass' concierge AI. Create a short, friendly, and personalized greeting line for a medical learner who is opening the app. Use the user's name when provided, reference the time of day or current moment naturally, and keep the tone warm, confident, and concise. Output only a single JSON object with a greeting property.`;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name")?.trim() ?? "";
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const device = request.headers.get("user-agent") ?? "web browser";

  const userPrompt = `Current moment: ${day} at ${timeString}. Device: ${device}. ${
    name ? `User name: ${name}.` : "No user name provided."
  } Generate a greeting for Clinicalass only as JSON.`;

  const result = await aiJsonCompletion<GreetingResponse>(AI_MODELS.fast, systemPrompt, userPrompt);
  if (result.error) {
    return new Response(JSON.stringify({ greeting: `Hey ${name || "there"},` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const greeting = result.data?.greeting?.trim();
  if (!greeting) {
    return new Response(JSON.stringify({ greeting: `Hey ${name || "there"},` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ greeting }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
