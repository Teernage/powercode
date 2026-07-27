import type OpenAI from "openai";
import { readFileTool } from "./readFile.js";
import { ChatClient } from "./chat.js";

// 最大循环次数
const MAX_STEPS = 8;

export class Agent {
  constructor(private readonly client: ChatClient) {}

  async run(prompt: string): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "你是 power-code，一个研发助手。需要了解项目内容时，优先读取真实文件。请使用中文回答。",
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    for (let step = 1; step <= MAX_STEPS; step += 1) {
      const message = await this.client.complete(messages);

      if (!message) {
        throw new Error("模型没有返回消息。");
      }

      messages.push(message);

      // 接下来判断：它是想调用工具，还是已经准备回答？
      const toolCalls = message.tool_calls ?? [];

      if (toolCalls.length === 0) {
        return message.content ?? "模型没有返回文本内容。";
      }

      // 处理工具调用
      for (const toolCall of toolCalls) {
        if (toolCall.type !== "function") {
          throw new Error(`暂时不支持工具类型：${toolCall.type}`);
        }

        if (toolCall.function.name !== "read_file") {
          throw new Error(`暂时不支持工具：${toolCall.function.name}`);
        }

        console.log(`第 ${step} 轮：AI 想调用 read_file`);
        console.log(`正在读取文件：${toolCall.function.arguments}\n`);

        let result: string;

        try {
          result = await readFileTool(toolCall.function.arguments);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          result = `读取失败：${message}`;
        }

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    }

    throw new Error(`执行超过 ${MAX_STEPS} 轮，已停止。`);
  }
}
