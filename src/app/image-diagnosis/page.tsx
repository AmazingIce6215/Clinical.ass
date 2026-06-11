"use client";

import { useState } from "react";
import { AppShell, GlassCard } from "@/components/app-shell";

const CLINICAL_PROMPT =
  "You are a clinical assistant. Analyze this medical image. Identify the most likely condition visible, describe the key visual findings, and provide standard management and treatment. Be concise and clinically structured.";

type AnalysisState = {
  loading: boolean;
  error: string;
  result: string;
  previewUrl: string;
  mimeType: string;
};

const initialState: AnalysisState = {
  loading: false,
  error: "",
  result: "",
  previewUrl: "",
  mimeType: "",
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function getPureBase64(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match?.[2]) {
    throw new Error("Could not read image as a base64 file");
  }
  return match[2].trim();
}

async function readApiResponse(response: Response) {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw) as { text?: string; error?: string; details?: string };
  } catch {
    return {
      error: response.ok ? "Unexpected server response" : "Server returned a non-JSON response",
      details: raw,
    };
  }
}

export default function ImageDiagnosisPage() {
  const [state, setState] = useState(initialState);

  const handleFile = async (file?: File) => {
    if (!file) return;

    try {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: "",
        result: "",
      }));

      const dataUrl = await fileToDataUrl(file);
      const base64 = getPureBase64(dataUrl);

      setState((prev) => ({
        ...prev,
        previewUrl: dataUrl,
        mimeType: file.type || "image/jpeg",
      }));

      const response = await fetch("/api/gemini-vision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: file.type || "image/jpeg",
          prompt: CLINICAL_PROMPT,
        }),
      });

      const data = await readApiResponse(response);
      if (!response.ok) {
        throw new Error(data.details || data.error || "Image analysis failed");
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        result: data.text || "No response returned.",
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Something went wrong while reading or analyzing the image",
      }));
    }
  };

  return (
    <AppShell backHref="/" title="Image Diagnosis" subtitle="Upload a clinical image for a visual read">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <GlassCard className="space-y-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
              Upload image
            </p>
            <p className="mt-2 text-sm text-muted">
              Choose a medical image and we&apos;ll send it to Gemini 2.0 Flash for a concise clinical read.
            </p>
          </div>

          <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-surface/50 px-4 py-8 text-center transition hover:border-accent/40 hover:bg-surface/70">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                void handleFile(file);
              }}
            />
            <span className="text-4xl">🖼️</span>
            <span className="mt-4 text-sm font-medium text-foreground">
              Click to upload or drop an image here
            </span>
            <span className="mt-2 text-xs text-muted">
              PNG, JPG, WebP, or similar image formats
            </span>
          </label>
        </GlassCard>

        <GlassCard className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-accent/90">
              Output
            </p>
            <p className="mt-2 text-sm text-muted">
              Gemini&apos;s response appears here in the same clinical output style used elsewhere.
            </p>
          </div>

          {state.previewUrl ? (
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.previewUrl}
                alt="Uploaded medical image preview"
                className="h-auto w-full"
              />
            </div>
          ) : null}

          <div className="rounded-2xl border border-border/60 bg-background/40 p-5">
            {state.loading ? (
              <p className="text-sm text-muted">Analyzing image...</p>
            ) : state.error ? (
              <p className="text-sm text-rose-500">{state.error}</p>
            ) : state.result ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{state.result}</p>
            ) : (
              <p className="text-sm text-muted">Your result will appear here after analysis.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
