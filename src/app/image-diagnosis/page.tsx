"use client";

import { useId, useState } from "react";
import { AlertTriangle, FileImage, Info, ShieldAlert, Upload } from "lucide-react";
import { AppShell, GlassCard } from "@/components/app-shell";
import { LoadingPanel } from "@/components/loading-panel";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

class ImageAnalysisError extends Error {}

type AnalysisState = {
  loading: boolean;
  error: string;
  result: string;
  previewUrl: string;
  mimeType: string;
  fileName: string;
};

const initialState: AnalysisState = {
  loading: false,
  error: "",
  result: "",
  previewUrl: "",
  mimeType: "",
  fileName: "",
};

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new ImageAnalysisError("The selected file could not be read."));
    reader.readAsDataURL(file);
  });
}

function getPureBase64(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match?.[2]) {
    throw new ImageAnalysisError("The selected file could not be prepared for analysis.");
  }
  return match[2].trim();
}

async function readApiResponse(response: Response) {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw) as { text?: string; error?: string };
  } catch {
    return {
      error: "The analysis service returned an unreadable response. Please try again.",
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
  const uploadHelpId = useId();
  const privacyNoticeId = useId();

  const handleFile = async (file?: File) => {
    if (!file || state.loading) return;

    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      setState({
        ...initialState,
        error: "Use a JPEG, PNG, or WebP image.",
      });
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setState({
        ...initialState,
        error: "Choose an image smaller than 8 MB.",
      });
      return;
    }

    try {
      setState((previous) => ({
        ...previous,
        loading: true,
        error: "",
        result: "",
        fileName: file.name,
        mimeType,
      }));

      const dataUrl = await fileToDataUrl(file);
      const imageBase64 = getPureBase64(dataUrl);

      setState((previous) => ({
        ...previous,
        previewUrl: dataUrl,
      }));

      const response = await fetch("/api/gemini-vision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64,
          mimeType,
        }),
      });

      const data = await readApiResponse(response);
      if (!response.ok) {
        throw new ImageAnalysisError(
          data.error || "The image could not be analyzed right now. Please try again.",
        );
      }

      if (!data.text?.trim()) {
        throw new ImageAnalysisError("No interpretation was returned. Please try a different image.");
      }

      setState((previous) => ({
        ...previous,
        loading: false,
        result: data.text!.trim(),
      }));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        error:
          error instanceof ImageAnalysisError
            ? error.message
            : "The image could not be analyzed right now. Please try again.",
      }));
    }
  };

  return (
    <AppShell
      backHref="/dashboard"
      title="Image diagnosis"
      subtitle="Educational, AI-assisted review of a de-identified image"
    >
      <h1 className="sr-only">Image diagnosis</h1>
      <section
        id={privacyNoticeId}
        aria-labelledby={`${privacyNoticeId}-title`}
        className="mb-6 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
      >
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <h2 id={`${privacyNoticeId}-title`} className="text-sm font-semibold">
            De-identify the image before upload
          </h2>
          <p className="mt-1 text-sm leading-6">
            Remove names, dates of birth, record numbers, embedded labels, and other direct
            identifiers. The selected image is processed by Google Gemini to generate an
            educational response.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <GlassCard className="space-y-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Select an image</h2>
            <p id={uploadHelpId} className="mt-2 text-sm leading-6 text-muted">
              Upload one JPEG, PNG, or WebP file up to 8 MB. Use the original-quality clinical
              image when possible.
            </p>
          </div>

          <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center transition-colors hover:border-accent focus-within:border-accent focus-within:outline-none focus-within:ring-2 focus-within:ring-accent/30">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={state.loading}
              aria-describedby={`${uploadHelpId} ${privacyNoticeId}`}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                void handleFile(file);
              }}
            />
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background text-accent">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="mt-4 text-sm font-semibold text-foreground">
              {state.loading ? "Uploading image…" : "Choose an image"}
            </span>
            <span className="mt-2 text-xs text-muted">JPEG, PNG, or WebP · maximum 8 MB</span>
          </label>

          {state.fileName ? (
            <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-3">
              <FileImage className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{state.fileName}</p>
                <p className="mt-0.5 text-xs text-muted">{state.mimeType}</p>
              </div>
            </div>
          ) : null}
        </GlassCard>

        <GlassCard className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              AI-generated educational interpretation
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Observations and suggestions are generated from the uploaded image and may be
              incomplete or incorrect. Confirm them against the source image and appropriate
              clinical guidance.
            </p>
          </div>

          {state.previewUrl ? (
            <figure className="overflow-hidden rounded-xl border border-border bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.previewUrl}
                alt="Preview of the selected clinical image"
                className="h-auto w-full"
              />
              <figcaption className="border-t border-border px-3 py-2 text-xs text-muted">
                Uploaded image preview
              </figcaption>
            </figure>
          ) : null}

          <div className="rounded-xl border border-border bg-background">
            {state.loading ? (
              <LoadingPanel visible={true} />
            ) : (
              <div className="p-5" aria-live="polite">
                {state.error ? (
                  <div className="flex gap-3 text-red-700 dark:text-red-300" role="alert">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p className="text-sm leading-6">{state.error}</p>
                  </div>
                ) : state.result ? (
                  <div className="space-y-5">
                    <div className="flex gap-3 rounded-xl border border-border bg-surface p-3 text-sm text-muted">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                      <p className="leading-6">
                        For learning support only. This output is not a diagnosis and must not be
                        used as the sole basis for patient care.
                      </p>
                    </div>
                    <MarkdownResponse content={state.result} />
                  </div>
                ) : (
                  <div className="flex gap-3 text-muted">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <p className="text-sm leading-6">
                      The generated interpretation will appear here after an image is selected.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
