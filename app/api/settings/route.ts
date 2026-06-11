import { NextRequest, NextResponse } from "next/server";
import {
  getSettings,
  isValidGender,
  saveSettings,
} from "@/lib/db";

export async function GET() {
  const settings = getSettings();
  return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipient_gender, recipient_context } = body;

    if (!recipient_gender || !isValidGender(recipient_gender)) {
      return NextResponse.json(
        { error: "recipient_gender must be female or male" },
        { status: 400 }
      );
    }

    const settings = saveSettings(
      recipient_gender,
      typeof recipient_context === "string" ? recipient_context : ""
    );

    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
