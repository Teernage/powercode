import OpenAI from "openai";
import type { ProviderConfig } from "./config.ts";

export interface CompletionResult {
  message:
    | OpenAI.Chat.Completions.ChatCompletionMessage
    | undefined;
  totalTokens: number | undefined;
}

export class ChatClient {
  private readonly client: OpenAI;

  constructor(private readonly config: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  getContextWindow(): number {
    return this.config.contextWindow;
  }

  async complete(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  ) {
    const result = await this.completeWithUsage(messages, tools);
    return result.message;
  }

  async completeWithUsage(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    tools: OpenAI.Chat.Completions.ChatCompletionTool[],
  ): Promise<CompletionResult> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages,
      tools,
    });

    return {
      message: response.choices[0]?.message,
      totalTokens: response.usage?.total_tokens,
    };
  }
}
