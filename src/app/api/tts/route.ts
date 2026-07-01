import { EdgeTTS } from "@andresaya/edge-tts";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);

function getPiperConfig() {
  const piperBin = process.env.PIPER_BIN || process.env.PIPER_PATH;
  const modelPath = process.env.PIPER_MODEL || process.env.PIPER_MODEL_PATH;
  return { piperBin, modelPath };
}

async function synthesizeWithPiper(text: string, voice?: string) {
  const { piperBin, modelPath } = getPiperConfig();
  if (!piperBin || !modelPath) return null;

  const outDir = await fs.mkdtemp(path.join(process.cwd(), ".tmp-piper-"));
  const outPath = path.join(outDir, `tts-${Date.now()}.wav`);
  const stdinText = text.replace(/\r?\n/g, " ").trim();

  const args = [
    "--model",
    modelPath,
    "--output_file",
    outPath,
  ];

  if (voice) {
    args.push("--speaker", voice);
  }

  await execFileAsync(piperBin, args, {
    input: stdinText,
    maxBuffer: 10 * 1024 * 1024,
  });

  const audio = await fs.readFile(outPath);
  await fs.rm(outDir, { recursive: true, force: true });
  return audio;
}

export const maxDuration = 30;
export const runtime = "nodejs";

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

    const piperAudio = await synthesizeWithPiper(text, voice);
    if (piperAudio) {
      return new Response(piperAudio, {
        headers: {
          "Content-Type": "audio/wav",
          "Cache-Control": "no-cache",
        },
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
