
import type OpenAI from "openai";

export interface Tool {
  name: string;

  definition: OpenAI.Chat.Completions.ChatCompletionTool;

  execute(argumentsJson: string): Promise<string>;
}