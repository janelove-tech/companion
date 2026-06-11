import { Ollama } from "ollama";

type LLMProvider = "ollama" | "anthropic" | "openai";

function getProvider(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER ?? "ollama").toLowerCase();
  if (provider === "anthropic" || provider === "openai" || provider === "ollama") {
    return provider;
  }
  throw new Error(
    `Unsupported LLM_PROVIDER "${provider}". Use ollama, anthropic, or openai.`
  );
}

function isThinkingModel(model: string): boolean {
  const lower = model.toLowerCase();
  return lower.includes("qwen3") || lower.includes("deepseek-r1");
}

function extractOllamaText(message: {
  content?: string;
  thinking?: string;
}): string {
  const content = message.content?.trim() ?? "";
  if (content) return content;

  const thinking = message.thinking?.trim() ?? "";
  if (thinking) return thinking;

  return "";
}

async function generateWithOllama(systemPrompt: string): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL ?? "qwen3:4b";

  const ollama = new Ollama({ host: baseUrl });

  try {
    const response = await ollama.chat({
      model,
      messages: [{ role: "user", content: systemPrompt }],
      format: "json",
      ...(isThinkingModel(model) ? { think: false as const } : {}),
      options: {
        temperature: 0.9,
        num_predict: 300,
      },
    });

    const text = extractOllamaText(response.message);
    if (!text) {
      throw new Error("Ollama returned an empty response.");
    }
    return text;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Ollama generation failed. Ensure Ollama is running (ollama serve) and model "${model}" is pulled. ${message}`
    );
  }
}

async function generateWithAnthropic(systemPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your environment or switch LLM_PROVIDER to ollama."
    );
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 300,
      temperature: 0.9,
      messages: [{ role: "user", content: systemPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Anthropic returned no text content.");
    }
    return textBlock.text;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Anthropic generation failed: ${message}`);
  }
}

async function generateWithOpenAI(systemPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to your environment or switch LLM_PROVIDER to ollama."
    );
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      max_tokens: 300,
      temperature: 0.9,
      messages: [{ role: "user", content: systemPrompt }],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned no content.");
    }
    return content;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenAI generation failed: ${message}`);
  }
}

export async function generateMessage(
  systemPrompt: string
): Promise<string> {
  const provider = getProvider();

  switch (provider) {
    case "ollama":
      return generateWithOllama(systemPrompt);
    case "anthropic":
      return generateWithAnthropic(systemPrompt);
    case "openai":
      return generateWithOpenAI(systemPrompt);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
