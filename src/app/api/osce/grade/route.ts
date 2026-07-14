import { NextResponse } from "next/server";
import { gradeSession } from "@/lib/osce/engine";
import type { OsceSessionState } from "@/lib/osce/state";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      session: OsceSessionState;
    };

    if (!body.session) {
      return NextResponse.json({ error: "session is required" }, { status: 400 });
    }

    const result = await gradeSession(body.session);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Formative feedback is temporarily unavailable." },
      { status: 500 },
    );
  }
}
