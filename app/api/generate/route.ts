import { NextResponse } from "next/server";
import { buildContext, AppContext, isValidCoordinates, GeoCoordinates } from "@/lib/context";
import { getRecentMessages, getSettings, RecipientSettings } from "@/lib/db";
import { generateMessage } from "@/lib/llm";
import { checkSimilarity } from "@/lib/similarity";

export const dynamic = "force-dynamic";

interface GeneratedMessage {
  message: string;
  theme: string;
  tone: string;
}

function genderGuidance(gender: RecipientSettings["recipient_gender"]): string {
  if (gender === "female") {
    return "The recipient is a woman. Use natural, affectionate language suited to someone you love who is female.";
  }
  return "The recipient is a man. Use natural, affectionate language suited to someone you love who is male.";
}

function buildSystemPrompt(
  context: AppContext,
  settings: RecipientSettings
): string {
  const themesList =
    context.recentThemes.length > 0
      ? context.recentThemes.join(", ")
      : "none yet";

  const recipientContext = settings.recipient_context.trim()
    ? settings.recipient_context.trim()
    : "No additional context provided.";

  return `You are helping someone write a warm, genuine message to the person they love.

About the recipient:
- ${genderGuidance(settings.recipient_gender)}
- Personal context: ${recipientContext}

Today's context:

- Day: ${context.day}
- Time: ${context.timeOfDay}
- Weather in ${context.location}: ${context.weather.condition}, ${context.weather.temp}, feels ${context.weather.mood}
- Recent themes used (avoid repeating these): ${themesList}

Rules:

- Write ONE short message
- Maximum 5 sentences
- Sound like a real human
- Never sound like a greeting card
- Avoid clichés
- Vary openings
- Avoid repetitive structure
- If weather fits naturally, mention it
- End with something personal, warm, or smile-inducing

Choose ONE theme:

[gratitude, admiration, encouragement, tenderness, playfulness, reflection]

Choose ONE tone:

[warm, poetic, teasing, supportive, calm, affectionate]

Respond ONLY as valid JSON:

{
  "message":"...",
  "theme":"...",
  "tone":"..."
}`;
}

function stripNoise(text: string): string {
  return text
    .replace(/[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();
}

function extractJsonObject(text: string): string | null {
  const cleaned = stripNoise(text);
  const start = cleaned.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "{") depth++;
    else if (cleaned[i] === "}") {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }

  return null;
}

function isValidGeneratedMessage(value: unknown): value is GeneratedMessage {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.message === "string" &&
    obj.message.length > 0 &&
    typeof obj.theme === "string" &&
    obj.theme.length > 0 &&
    typeof obj.tone === "string" &&
    obj.tone.length > 0
  );
}

function parseGeneratedResponse(raw: string): GeneratedMessage | null {
  const candidates = [raw.trim(), extractJsonObject(raw)].filter(
    (value): value is string => Boolean(value)
  );

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (isValidGeneratedMessage(parsed)) {
        return parsed;
      }
    } catch {
      // try next candidate
    }
  }

  return null;
}

async function generateAndParse(
  systemPrompt: string
): Promise<GeneratedMessage | null> {
  const raw = await generateMessage(systemPrompt);
  return parseGeneratedResponse(raw);
}

export async function POST(request: Request) {
  try {
    const settings = getSettings();
    if (!settings) {
      return NextResponse.json(
        { error: "Please set up who you're writing for first." },
        { status: 400 }
      );
    }

    let coordinates: GeoCoordinates | undefined;
    try {
      const body = await request.json();
      if (isValidCoordinates(body)) {
        coordinates = body;
      }
    } catch {
      // Empty or non-JSON body — use default location
    }

    const context = await buildContext(coordinates);
    const recent = getRecentMessages(10);
    const recentTexts = recent.map((m) => m.message_text);
    const systemPrompt = buildSystemPrompt(context, settings);

    let parsed = await generateAndParse(systemPrompt);
    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to parse LLM response as JSON" },
        { status: 500 }
      );
    }

    let similarity = await checkSimilarity(parsed.message, recentTexts);

    if (similarity > 0.75) {
      const retryPrompt =
        systemPrompt +
        "\n\nIMPORTANT: Your previous attempt was too similar to recent messages. Write something distinctly different in structure, opening, and theme.";
      const retryParsed = await generateAndParse(retryPrompt);
      if (retryParsed) {
        parsed = retryParsed;
        similarity = await checkSimilarity(parsed.message, recentTexts);
      }
    }

    if (similarity > 0.75) {
      return NextResponse.json({
        message: parsed.message,
        theme: parsed.theme,
        tone: parsed.tone,
        context,
        tooSimilar: true,
      });
    }

    return NextResponse.json({
      message: parsed.message,
      theme: parsed.theme,
      tone: parsed.tone,
      context,
      tooSimilar: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
