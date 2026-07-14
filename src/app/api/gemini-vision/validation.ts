export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_BASE64_CHARACTERS = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;

type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export type ValidatedImagePayload = {
  imageBase64: string;
  mimeType: AllowedImageMimeType;
};

export type ImageValidationError =
  | "invalid_request"
  | "unsupported_type"
  | "invalid_image"
  | "image_too_large";

export type ImageValidationResult =
  | { ok: true; value: ValidatedImagePayload }
  | { ok: false; error: ImageValidationError };

const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const ALLOWED_MIME_TYPES = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeMimeType(value: string) {
  return value.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

function imageSignatureMatches(bytes: Uint8Array, mimeType: AllowedImageMimeType) {
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((byte, index) => bytes[index] === byte);
  }

  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

export function validateImagePayload(body: unknown): ImageValidationResult {
  if (!isRecord(body)) {
    return { ok: false, error: "invalid_request" };
  }

  if (typeof body.imageBase64 !== "string" || typeof body.mimeType !== "string") {
    return { ok: false, error: "invalid_request" };
  }

  const mimeType = normalizeMimeType(body.mimeType);
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { ok: false, error: "unsupported_type" };
  }

  const imageBase64 = body.imageBase64.trim();
  if (!imageBase64 || imageBase64.length > MAX_BASE64_CHARACTERS) {
    return {
      ok: false,
      error: imageBase64 ? "image_too_large" : "invalid_request",
    };
  }

  if (imageBase64.length % 4 !== 0 || !BASE64_PATTERN.test(imageBase64)) {
    return { ok: false, error: "invalid_image" };
  }

  const paddingLength = imageBase64.endsWith("==") ? 2 : imageBase64.endsWith("=") ? 1 : 0;
  const estimatedBytes = (imageBase64.length * 3) / 4 - paddingLength;
  if (estimatedBytes > MAX_IMAGE_BYTES) {
    return { ok: false, error: "image_too_large" };
  }

  const bytes = Buffer.from(imageBase64, "base64");
  if (
    bytes.byteLength === 0 ||
    bytes.byteLength !== estimatedBytes ||
    !imageSignatureMatches(bytes, mimeType as AllowedImageMimeType)
  ) {
    return { ok: false, error: "invalid_image" };
  }

  return {
    ok: true,
    value: {
      imageBase64,
      mimeType: mimeType as AllowedImageMimeType,
    },
  };
}
