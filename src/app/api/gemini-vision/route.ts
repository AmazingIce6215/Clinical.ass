import { NextResponse } from "next/server";
import {
  MAX_BASE64_CHARACTERS,
  validateImagePayload,
  type ImageValidationError,
} from "./validation";

export const maxDuration = 30;
export const runtime = "nodejs";

const MAX_REQUEST_BYTES = MAX_BASE64_CHARACTERS + 2_048;

const IMAGE_ANALYSIS_PROMPT = `You are an educational clinical image interpretation assistant for medical learners.

Describe only features that are visible in the supplied image. Do not infer or reproduce a person's identity or other personal information. Separate observations from interpretation, state important uncertainty, and never present the output as a confirmed diagnosis or a substitute for review by a qualified clinician.

Return concise Markdown with these headings when applicable:
## Observed findings
## Educational interpretation
## Differential considerations
## Limitations
## Learning next steps

Use neutral clinical language. Do not provide patient-specific prescribing or treatment instructions. If the image is not a clinical image, is too limited to interpret, or lacks enough context, say so clearly.`;

type ProviderResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string };
};

function normalizeModel(value: string) {
  return value.trim().replace(/^models\//, "");
}

function getModelCandidates() {
  const envModel = process.env.GEMINI_VISION_MODEL?.trim();
  const candidates = [
    envModel ? normalizeModel(envModel) : null,
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
  ].filter((value): value is string => Boolean(value));

  return [...new Set(candidates)];
}

function jsonResponse(body: { text?: string; error?: string }, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function validationErrorResponse(error: ImageValidationError) {
  if (error === "unsupported_type") {
    return jsonResponse({ error: "Use a JPEG, PNG, or WebP image." }, 415);
  }

  if (error === "image_too_large") {
    return jsonResponse({ error: "Choose an image smaller than 8 MB." }, 413);
  }

  if (error === "invalid_image") {
    return jsonResponse({ error: "The selected file could not be verified as an image." }, 400);
  }

  return jsonResponse({ error: "The upload request could not be read." }, 400);
}

async function callImageAnalysisProvider(params: {
  apiKey: string;
  model: string;
  imageBase64: string;
  mimeType: string;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": params.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                inline_data: {
                  mime_type: params.mimeType,
                  data: params.imageBase64,
                },
              },
              { text: IMAGE_ANALYSIS_PROMPT },
            ],
          },
        ],
      }),
    },
  );

  const responseText = await response.text();
  return { response, responseText };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return validationErrorResponse("image_too_large");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return validationErrorResponse("invalid_request");
  }

  const validation = validateImagePayload(body);
  if (!validation.ok) {
    return validationErrorResponse(validation.error);
  }

  const apiKey =
    (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)?.trim();
  if (!apiKey) {
    console.error("Image analysis service is not configured.");
    return jsonResponse(
      { error: "Image analysis is temporarily unavailable. Please try again later." },
      503,
    );
  }

  const models = getModelCandidates();
  let lastStatus = 502;
  let lastDetails = "No provider response was received.";

  try {
    for (const model of models) {
      const { response, responseText } = await callImageAnalysisProvider({
        apiKey,
        model,
        ...validation.value,
      });

      lastStatus = response.status;

      let data: ProviderResponse;
      try {
        data = JSON.parse(responseText) as ProviderResponse;
      } catch {
        lastDetails = "The provider returned an unreadable response.";
        continue;
      }

      if (!response.ok) {
        lastDetails = data.error?.message || `Provider status ${response.status}`;
        continue;
      }

      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("")
          .trim() || "";

      if (text) {
        return jsonResponse({ text });
      }

      lastDetails = "The provider returned an empty interpretation.";
    }
  } catch (error) {
    lastDetails = error instanceof Error ? error.message : "Unexpected provider failure.";
  }

  console.error("Image analysis provider request failed.", {
    status: lastStatus,
    details: lastDetails.slice(0, 500),
  });

  return jsonResponse(
    { error: "The image could not be analyzed right now. Please try again." },
    502,
  );
}
