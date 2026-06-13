import { NextRequest, NextResponse } from "next/server";
import { getMessageCount, getRecentMessages, saveMessage } from "@/lib/db";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET() {
  return NextResponse.json(
    {
      messages: getRecentMessages(7),
      total: getMessageCount(),
    },
    { headers: NO_STORE_HEADERS }
  );
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

    saveMessage(message_text, theme ?? "", tone ?? "");

    return NextResponse.json(
      {
        ok: true,
        messages: getRecentMessages(7),
        total: getMessageCount(),
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
