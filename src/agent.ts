import type OpenAI from "openai";
import { ChatClient } from "./chat.js";
import { Registry } from "./tools/registry.js";

const MAX_STEPS = 8;

export class Agent {
  constructor(
    private readonly client: ChatClient,
    private readonly registry: Registry,
  ) {}

  /**
   *  运行对话
   * @param prompt  输入
   * @returns       输出
   */
  async run(prompt: string): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          "你是 power-code，一个研发助手。请优先读取真实文件；修改后主动运行构建或测试验证结果。请使用中文回答。",
      },
      { role: "user", content: prompt },
    ];

    for (let step = 1; step <= MAX_STEPS; step += 1) {
      const message = await this.client.complete(
        messages,
        this.registry.getDefinitions(),
      );

      if (!message) {
        throw new Error("模型没有返回消息。");
      }

      messages.push(message);
      const toolCalls = message.tool_calls ?? [];

      if (toolCalls.length === 0) {
        return message.content ?? "模型没有返回文本内容。";
      }

      for (const toolCall of toolCalls) {
        if (toolCall.type !== "function") {
          throw new Error(`暂时不支持工具类型：${toolCall.type}`);
        }

        const name = toolCall.function.name;
        console.log(`第 ${step} 轮：AI 调用 ${name}`);

        let result: string;

        try {
          result = await this.registry.execute(
            name,
            toolCall.function.arguments,
          );
          console.log(`✓ ${result}\n`);
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          result = `工具执行失败：${reason}`;
          console.log(`✗ ${result}\n`);
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