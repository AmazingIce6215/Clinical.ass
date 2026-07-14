import {
  MAX_BASE64_CHARACTERS,
  validateImagePayload,
} from "../validation";

function asBase64(bytes: number[]) {
  return Buffer.from(bytes).toString("base64");
}

describe("validateImagePayload", () => {
  it("accepts a supported image whose signature matches its MIME type", () => {
    const result = validateImagePayload({
      imageBase64: asBase64([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
      ]),
      mimeType: "image/png",
    });

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({ mimeType: "image/png" }),
    });
  });

  it("rejects unsupported MIME types", () => {
    expect(
      validateImagePayload({
        imageBase64: asBase64([0x47, 0x49, 0x46, 0x38]),
        mimeType: "image/gif",
      }),
    ).toEqual({ ok: false, error: "unsupported_type" });
  });

  it("rejects malformed base64 and MIME-signature mismatches", () => {
    expect(
      validateImagePayload({ imageBase64: "not-base64", mimeType: "image/png" }),
    ).toEqual({ ok: false, error: "invalid_image" });

    expect(
      validateImagePayload({
        imageBase64: asBase64([0xff, 0xd8, 0xff, 0x00]),
        mimeType: "image/png",
      }),
    ).toEqual({ ok: false, error: "invalid_image" });
  });

  it("rejects encoded payloads above the image-size limit before decoding", () => {
    expect(
      validateImagePayload({
        imageBase64: "A".repeat(MAX_BASE64_CHARACTERS + 4),
        mimeType: "image/jpeg",
      }),
    ).toEqual({ ok: false, error: "image_too_large" });
  });
});
