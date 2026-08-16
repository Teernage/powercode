import { ChatClient } from "../chat.ts";
import type { Message, Session } from "./session.ts";

// 摘要提示词
const SUMMARY_PROMPT = `
你负责压缩一个 AI 编程任务的较早对话。
请只保留后续完成任务真正需要的信息，并严格使用以下结构：

## 用户目标
## 约束与关键决定
## 已完成
## 当前问题
## 已读取或修改的文件
## 下一步

不要编造对话中没有出现的结论。
`;

//  会话压缩器
export class Compactor {
  constructor(
    private readonly client: ChatClient, // 会话压缩器使用的 ChatClient 
    private readonly maxContextTokens: number, // 最大上下文 Token 数量
    private readonly reserveTokens = 16_384, // 给模型本轮回答预留空间
    private readonly keepRecentTokens = 20_000, // 保留近期对话原文
  ) {}

  /**
   * 构建工作记忆
   * @param session 会话
   * @returns 工作记忆
   */
  async buildWorkingMemory(session: Session): Promise<Message[]> {
    const history = session.getHistory();
    const state = session.getCompaction();
    const start = state?.compactedUntil ?? 0;
    const pending = history.slice(start);
    const current = this.withSummary(state?.summary, pending);
    const usableTokens = this.maxContextTokens - this.reserveTokens;
    const contextTokens = estimateContextTokens(
      session,
      history,
      current,
    );

    if (contextTokens <= usableTokens) {
      return current;
    }

    const cutIndex = this.findCutIndex(pending);

    // 一条工具输出本身就太长时，先不切断对话结构，只截短输出。
    if (cutIndex <= 0) {
      return this.withSummary(
        state?.summary,
        truncateLargeToolOutputs(pending),
      );
    }

    // 切分新旧消息
    const older = truncateLargeToolOutputs(pending.slice(0, cutIndex));
    // 最近消息
    const recent = truncateLargeToolOutputs(pending.slice(cutIndex));
    const summaryInput = [
      state?.summary ? `# 上一次摘要\n${state.summary}` : "",
      `# 新增历史\n${JSON.stringify(older, null, 2)}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    // 生成摘要
    const completion = await this.client.completeWithUsage(
      [
        { role: "system", content: SUMMARY_PROMPT },
        { role: "user", content: summaryInput },
      ],
      [],
    );

    const summary = completion.message?.content?.trim() ?? "";

    // 摘要为空时，只截短输出。
    if (!summary) {
      return this.withSummary(
        state?.summary,
        truncateLargeToolOutputs(pending),
      );
    }
    // 保存摘要和消息索引
    session.saveCompaction(summary, start + cutIndex);
    return this.withSummary(summary, recent);
  }

  private findCutIndex(messages: Message[]): number {
    let recentTokens = 0;

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      recentTokens += estimateMessageTokens(messages[index]);

      if (recentTokens < this.keepRecentTokens) continue;

      // 从普通 user 消息开始保留，避免把 assistant 工具调用和 tool 结果拆开。
      for (let cut = index; cut < messages.length; cut += 1) {
        if (messages[cut].role === "user") {
          return cut;
        }
      }
    }

    return 0;
  }

  private withSummary(
    summary: string | undefined,
    messages: Message[],
  ): Message[] {
    if (!summary) return messages;

    const summaryMessage: Message = {
      role: "user",
      content: `[系统生成的较早会话摘要]\n${summary}`,
    };

    return [summaryMessage, ...messages];
  }
}

function estimateContextTokens(
  session: Session,
  history: Message[],
  current: Message[],
): number {
  const usage = session.getUsage();

  // 还没有真实 usage 时，估算当前工作记忆。
  if (usage === undefined) {
    return estimateTokens(current);
  }

  // usage 覆盖之前的消息，只估算它之后新增的部分。
  const trailingMessages = history.slice(usage.historyLength);
  return usage.totalTokens + estimateTokens(trailingMessages);
}

function estimateTokens(messages: Message[]): number {
  return messages.reduce(
    (total, message) => total + estimateMessageTokens(message),
    0,
  );
}

function estimateMessageTokens(message: Message): number {
  const bytes = Buffer.byteLength(JSON.stringify(message), "utf8");

  // 只用于估算尚未包含在 API usage 中的新消息。
  return Math.ceil(bytes / 4);
}

function truncateLargeToolOutputs(messages: Message[]): Message[] {
  return messages.map((message) => {
    if (message.role !== "tool" || typeof message.content !== "string") {
      return message;
    }

    const content = message.content;

    if (content.length <= 8_000) {
      return message;
    }

    return {
      ...message,
      content:
        `${content.slice(0, 4_000)}\n\n` +
        "...[中间工具输出已截断]...\n\n" +
        content.slice(-4_000),
    };
  });
}
