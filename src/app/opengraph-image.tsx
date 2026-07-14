import { ImageResponse } from "next/og";

export const alt = "DxFlow — clinical tools for medical students";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#f4f7f9",
        color: "#14232e",
        padding: 64,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", width: "100%", border: "1px solid #d9e2e8", borderRadius: 28, background: "#ffffff", overflow: "hidden" }}>
        <div style={{ width: 370, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 48, background: "#153f5b", color: "white" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 16, background: "#ffffff", color: "#153f5b", fontSize: 28, fontWeight: 800 }}>Dx</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>DxFlow</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 19, color: "#c9e0eb" }}>
            <div>Patient encounter tools</div><div>Case presentations</div><div>Practice modes</div><div>Clinical utilities</div>
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: 58 }}>
          <div style={{ color: "#0f766e", fontSize: 20, fontWeight: 700, letterSpacing: 2 }}>CLINICAL TOOLS FOR MEDICAL STUDENTS</div>
          <div style={{ maxWidth: 650, marginTop: 24, fontSize: 56, lineHeight: 1.04, letterSpacing: -3, fontWeight: 700 }}>Tools for the patient encounter—and the learning around it.</div>
          <div style={{ marginTop: 30, fontSize: 23, lineHeight: 1.5, color: "#5b6c78" }}>Independent modules, organized by purpose. Educational use only.</div>
        </div>
      </div>
    </div>,
    size,
  );
}
