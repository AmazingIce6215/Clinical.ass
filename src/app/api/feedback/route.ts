import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY is not set");
      return NextResponse.json(
        { error: "Email service is not configured. Please try again later." },
        { status: 500 },
      );
    }

    const toEmail = process.env.FEEDBACK_EMAIL_TO;
    if (!toEmail) {
      console.error("FEEDBACK_EMAIL_TO is not set");
      return NextResponse.json(
        { error: "Email service is not configured. Please try again later." },
        { status: 500 },
      );
    }

    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "UTC",
    });

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "DxFlow <onboarding@resend.dev>",
      to: toEmail,
      subject: "New DxFlow feedback",
      text: `Message:\n${message.trim()}\n\n---\nSent at: ${timestamp} UTC`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to send feedback email:", err);
    return NextResponse.json(
      { error: "Couldn't send your message right now. Please try again later." },
      { status: 500 },
    );
  }
}
