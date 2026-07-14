import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ImageDiagnosisPage from "../page";

jest.mock("@/components/app-shell", () => ({
  AppShell: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
  GlassCard: ({ children }: { children: React.ReactNode }) => <section>{children}</section>,
}));

jest.mock("@/components/loading-panel", () => ({
  LoadingPanel: () => <p>Processing image</p>,
}));

const fetchMock = jest.fn();

describe("ImageDiagnosisPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock,
    });
  });

  it("shows de-identification, provider-processing, and AI-output notices", () => {
    render(<ImageDiagnosisPage />);

    expect(screen.getByText(/de-identify the image before upload/i)).toBeInTheDocument();
    expect(screen.getByText(/processed by google gemini/i)).toBeInTheDocument();
    expect(screen.getByText(/ai-generated educational interpretation/i)).toBeInTheDocument();
  });

  it("sends only imageBase64 and mimeType to the analysis endpoint", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          text: "## Observed findings\n\n- Example educational finding",
        }),
    });
    const user = userEvent.setup();
    render(<ImageDiagnosisPage />);

    const input = screen.getByLabelText(/choose an image/i);
    const file = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      "study.png",
      { type: "image/png" },
    );

    await user.upload(input, file);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body)) as Record<string, unknown>;

    expect(Object.keys(body).sort()).toEqual(["imageBase64", "mimeType"]);
    expect(body).not.toHaveProperty("prompt");
    expect(await screen.findByText("Example educational finding")).toBeInTheDocument();
    expect(screen.getByText(/not a diagnosis/i)).toBeInTheDocument();
  });

  it("rejects unsupported files before making a request", () => {
    render(<ImageDiagnosisPage />);
    const input = screen.getByLabelText(/choose an image/i);
    const file = new File(["not an image"], "notes.txt", { type: "text/plain" });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByRole("alert")).toHaveTextContent("Use a JPEG, PNG, or WebP image.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses a neutral message for unexpected client or network failures", async () => {
    fetchMock.mockRejectedValue(new Error("GEMINI_API_KEY debug detail"));
    const user = userEvent.setup();
    render(<ImageDiagnosisPage />);
    const input = screen.getByLabelText(/choose an image/i);
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0x00])], "study.jpg", {
      type: "image/jpeg",
    });

    await user.upload(input, file);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The image could not be analyzed right now. Please try again.",
    );
    expect(screen.queryByText(/GEMINI_API_KEY/i)).not.toBeInTheDocument();
  });
});
