"use client";

import { useState } from "react";
import { AppShell, GlassCard } from "@/components/app-shell";

const CLINICAL_PROMPT =
  "You are an educational image interpretation assistant. Analyze this image in a concise radiology-style way and respond in markdown. Focus on visible findings, the most likely interpretation, and brief next-step guidance if relevant. Use clear headings like ## Findings, ## Likely Diagnosis, ## Management, and ## Treatment when appropriate. Use bullet points where helpful, keep the response organized, and do not mention policy, safety disclaimers, or refusals unless absolutely required.";

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

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
    if (boldMatch) {
      return (
        <strong key={`${index}-${part}`} className="font-semibold text-foreground">
          {boldMatch[1]}
        </strong>
      );
    }

    return (
      <span key={`${index}-${part}`} className="text-foreground">
        {part}
      </span>
    );
  });
}

function MarkdownLine({ line }: { line: string }) {
  const bulletMatch = line.match(/^[-*]\s+(.*)$/);
  const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);

  if (bulletMatch) {
    return (
      <div className="flex gap-2 pl-1">
        <span className="mt-[0.66rem] h-1.5 w-1.5 shrink-0 rounded-full bg-accent/80" />
        <p className="min-w-0 flex-1 text-sm leading-7 text-foreground">
          {renderInlineMarkdown(bulletMatch[1])}
        </p>
      </div>
    );
  }

  if (numberedMatch) {
    return (
      <div className="flex gap-3 pl-1">
        <span className="min-w-4 shrink-0 text-sm font-semibold leading-7 text-accent/90">
          {numberedMatch[1]}.
        </span>
        <p className="min-w-0 flex-1 text-sm leading-7 text-foreground">
          {renderInlineMarkdown(numberedMatch[2])}
        </p>
      </div>
    );
  }

  if (!line) {
    return null;
  }

  return <p className="text-sm leading-7 text-foreground">{renderInlineMarkdown(line)}</p>;
}

function MarkdownResponse({ content }: { content: string }) {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").map((line) => line.trim());
        const headingMatch = lines[0]?.match(/^(#{1,3})\s+(.*)$/);

        if (headingMatch) {
          const level = headingMatch[1].length;
          const headingText = headingMatch[2];
          const headingClass =
            level === 1
              ? "text-lg font-semibold tracking-tight text-foreground"
              : level === 2
                ? "text-base font-semibold tracking-tight text-foreground"
                : "text-sm font-semibold tracking-tight text-foreground";

          return (
            <section key={blockIndex} className="space-y-2">
              <h3 className={headingClass}>{renderInlineMarkdown(headingText)}</h3>
              {lines.slice(1).map((line, lineIndex) => (
                <MarkdownLine key={`${blockIndex}-${lineIndex}`} line={line} />
              ))}
            </section>
          );
        }

        return (
          <div key={blockIndex} className="space-y-2">
            {lines.map((line, lineIndex) => (
              <MarkdownLine key={`${blockIndex}-${lineIndex}`} line={line} />
            ))}
          </div>
        );
      })}
    </div>
  );
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

      const resultText = data.text || "No response returned.";

      setState((prev) => ({
        ...prev,
        loading: false,
        result: resultText,
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
              <MarkdownResponse content={state.result} />
            ) : (
              <p className="text-sm text-muted">Your result will appear here after analysis.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
