import type OpenAI from "openai";
import { ChatClient } from "./chat.ts";
import { Compactor } from "./context/compactor.ts";
import type { Session } from "./context/session.ts";
import { Registry } from "./tools/registry.ts";

const MAX_STEPS = 8;

export class Agent {
  private readonly compactor: Compactor;

  constructor(
    private readonly client: ChatClient,
    private readonly registry: Registry,
    private readonly session: Session,
  ) {
    this.compactor = new Compactor(
      client,
      client.getContextWindow(),
    );
  }

  async run(prompt: string): Promise<string> {
    this.session.append({
      role: "user",
      content: prompt,
    });

    for (let step = 1; step <= MAX_STEPS; step += 1) {
      const memory = await this.compactor.buildWorkingMemory(this.session);
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            "你是 power-code，一个研发助手。请优先读取真实文件；修改后主动运行命令验证结果。请使用中文回答。",
        },
        ...memory,
      ];

      const completion = await this.client.completeWithUsage(
        messages,
        this.registry.getDefinitions(),
      );
      const message = completion.message;

      if (!message) {
        throw new Error("模型没有返回消息。");
      }

      this.session.append(message);

      if (
        completion.totalTokens !== undefined &&
        completion.totalTokens > 0
      ) {
        this.session.saveUsage(completion.totalTokens);
      }

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
          console.log(`✓ ${name} 执行完成\n`);
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          result = `工具执行失败：${reason}`;
          console.log(`✗ ${result}\n`);
        }

        this.session.append({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        });
      }
    }

    throw new Error(`执行超过 ${MAX_STEPS} 轮，已停止。`);
  }
}
