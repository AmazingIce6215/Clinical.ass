import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const maxDuration = 30;

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    return null;
  }
  return new Groq({ apiKey });
}

export async function POST(request: Request) {
  try {
    const groq = getGroqClient();
    if (!groq) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 503 },
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "audio file is required" },
        { status: 400 },
      );
    }

    const transcription = await groq.audio.transcriptions.create({
      model: "whisper-large-v3-turbo",
      file: audioFile,
      language: "en",
      prompt:
        "Medical history taking consultation. The doctor is asking the patient about their symptoms, medical history, medications, family history, and social history.",
      response_format: "json",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
