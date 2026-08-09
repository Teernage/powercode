import OpenAI from "openai";
import type { ProviderConfig } from "./config.ts";

export class ChatClient {
  private readonly client: OpenAI;

  constructor(private readonly config: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  async complete(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  ) {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages,
      tools,
    });

    return response.choices[0]?.message;
  }
}