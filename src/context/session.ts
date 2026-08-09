import type OpenAI from "openai";

// 会话中的消息类型
export type Message = OpenAI.Chat.Completions.ChatCompletionMessageParam;

// 会话中的压缩状态
// 用于记录压缩到的步骤数和压缩后的摘要
export interface CompactionState {
  summary: string;
  compactedUntil: number;
}

// 最近一次模型请求返回的 Token 用量
export interface UsageSnapshot {
  totalTokens: number;
  historyLength: number;
}

// 会话类
export class Session {
  readonly createdAt = new Date(); // 创建时间
  updatedAt = new Date(); // 更新时间
  private readonly history: Message[] = []; // 会话历史
  private compaction?: CompactionState; // 压缩状态
  private usage?: UsageSnapshot; // 最近一次 Token 用量

  /**
   * 添加消息到会话历史
   * @param messages 要追加的消息
   */
  append(...messages: Message[]): void {
    this.history.push(...messages);
    this.updatedAt = new Date();
  }

  /**
   * 获取会话历史
   * @returns 会话历史
   */
  getHistory(): Message[] {
    return structuredClone(this.history);
  }

  /**
   * 获取压缩状态
   * @returns 压缩状态
   */
  getCompaction(): CompactionState | undefined {
    return this.compaction === undefined ? undefined : { ...this.compaction };
  }

  /**
   * 获取最近一次 Token 用量
   * @returns 最近一次 Token 用量
   */
  getUsage(): UsageSnapshot | undefined {
    return this.usage === undefined ? undefined : { ...this.usage };
  }

/**
   * 保存最近一次 Token 用量
   * @param totalTokens 最近一次 Token 用量
   */
  saveUsage(totalTokens: number): void {
    this.usage = {
      totalTokens,
      historyLength: this.history.length,
    };
    this.updatedAt = new Date();
  }

  /**
   * 保存压缩状态
   * @param summary 压缩后的摘要
   * @param compactedUntil 压缩到的步骤数
   */
  saveCompaction(summary: string, compactedUntil: number): void {
    this.compaction = { summary, compactedUntil };
    // 压缩后上下文已经改变，旧 usage 不能继续使用。
    this.usage = undefined;
    this.updatedAt = new Date();
  }
}