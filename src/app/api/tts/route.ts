import { EdgeTTS } from "@andresaya/edge-tts";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

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

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(piperBin, args, { stdio: ["pipe", "pipe", "pipe"] });
      let stderr = "";

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(stderr || `Piper exited with code ${code ?? "unknown"}`));
      });

      if (child.stdin.writable) {
        child.stdin.end(`${stdinText}\n`);
      } else {
        child.kill();
        reject(new Error("Piper stdin is not writable"));
      }
    });

    const audio = await fs.readFile(outPath);
    return audio;
  } finally {
    await fs.rm(outDir, { recursive: true, force: true });
  }
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
  } catch {
    return new Response(JSON.stringify({ error: "Speech playback is temporarily unavailable." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
