import OpenAI from 'openai';
import type { ProviderConfig } from './config.ts';
import { READ_FILE_TOOL } from './readFile.ts';

export class ChatClient {
  private readonly client: OpenAI;

  constructor(private readonly config: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey, // 从环境变量中获取 API 密钥
      baseURL: config.baseURL, // 从环境变量中获取 API 基础 URL
    });
  }

  /**
   *  完成对话
   * @param messages 全部聊天记录
   * @returns  模型回复的消息
   */
  async complete(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  ) {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages,
      tools: [READ_FILE_TOOL],
    });

    return response.choices[0]?.message;
  }
}