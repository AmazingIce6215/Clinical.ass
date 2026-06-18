import { EdgeTTS } from "@andresaya/edge-tts";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { text, voice, rate, pitch } = (await request.json()) as {
      text: string;
      voice?: string;
      rate?: number;
      pitch?: number;
    };

    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tts = new EdgeTTS();

    await tts.synthesize(text, voice || "en-US-JennyNeural", {
      rate: rate ?? 0,
      pitch: pitch ?? 0,
      outputFormat: "audio-24khz-96kbitrate-mono-mp3",
    });

    const buffer = tts.toBuffer();
    const audioData = new Uint8Array(buffer);

    return new Response(audioData, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to synthesize speech";
    return new Response(JSON.stringify({ error: message, detail: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
