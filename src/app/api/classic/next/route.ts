import { NextResponse } from "next/server";
import { getNextClassicStep } from "@/lib/classic-flow";
import type { PatientCase } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      patientCase: PatientCase;
      completedKeys?: string[];
    };

    const { completedKeys = [] } = body;
    const step = getNextClassicStep(completedKeys);

    return NextResponse.json({ step, aiPowered: false });
  } catch (error) {
    console.error("Classic step error:", error);
    return NextResponse.json({ error: "Failed to get next step" }, { status: 500 });
  }
}
