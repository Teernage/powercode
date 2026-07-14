import OpenAI from "openai";
import type { ProviderConfig } from "./config.js";

export class ChatClient {
  private readonly client: OpenAI; // OpenAI 客户端实例

  /**
   * 初始化 ChatClient 实例
   *
   * @param config 提供商配置对象
   */
  constructor(private readonly config: ProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  /**
   * 向 AI 模型发送问题并获取回答
   *
   * @param prompt 用户的问题或指令
   * @returns 模型回答的内容
   */
  async ask(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: "你是一个乐于帮助初学者的 AI 助手，请使用中文回答。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response.choices[0]?.message.content ?? "模型没有返回内容。";
  }
}