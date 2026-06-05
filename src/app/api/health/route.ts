import { NextResponse } from "next/server";
import { isGroqConfigured } from "@/lib/ai";

export async function GET() {
  return NextResponse.json({
    ok: true,
    groqConfigured: isGroqConfigured(),
  });
}
