import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const logDir = path.join(process.cwd(), "data");
    const logPath = path.join(logDir, "feedback.log");

    // Ensure data directory exists
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch {
      // directory already exists
    }

    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] ${message.trim()}\n`;

    await fs.appendFile(logPath, entry, "utf-8");

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}