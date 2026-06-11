import { NextRequest, NextResponse } from "next/server";
import { getRecentMessages, saveMessage } from "@/lib/db";

export async function GET() {
  const messages = getRecentMessages(7);
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_text, theme, tone } = body;

    if (!message_text || typeof message_text !== "string") {
      return NextResponse.json(
        { error: "message_text is required" },
        { status: 400 }
      );
    }

    saveMessage(
      message_text,
      theme ?? "",
      tone ?? ""
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
