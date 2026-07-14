import { NextResponse } from "next/server";
import { getPatientResponse } from "@/lib/osce/engine";
import type { OsceSessionState } from "@/lib/osce/state";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      session: OsceSessionState;
      userInput: string;
    };

    if (!body.userInput?.trim()) {
      return NextResponse.json({ error: "userInput is required" }, { status: 400 });
    }

    if (!body.session) {
      return NextResponse.json({ error: "session is required" }, { status: 400 });
    }

    const response = await getPatientResponse(body.session, body.userInput.trim());

    return NextResponse.json({ response });
  } catch {
    return NextResponse.json(
      { error: "The simulated patient response is temporarily unavailable." },
      { status: 500 },
    );
  }
}
