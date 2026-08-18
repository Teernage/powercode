import type OpenAI from "openai";
import { ChatClient } from "./chat.ts";
import { Compactor } from "./context/compactor.ts";
import type { Session } from "./context/session.ts";
import { Registry } from "./tools/registry.ts";
import { AgentState, formatPlan } from "./plan.ts";

const MAX_STEPS = 30;

const CORE_SYSTEM_PROMPT = `
你是 power-code，一个研发助手。
请优先读取真实文件；修改后主动运行命令验证结果；请使用中文回答。
所有文件路径都相对于当前工作目录，不能操作工作目录之外的文件。
`;

const PLAN_MODE_PROMPT = `

# 当前模式：Plan Mode

你现在只能研究项目和制定计划，不能修改文件或执行命令。

请按以下顺序工作：

1. 先使用 list_files、search_files 和 read_file 了解真实项目。
2. 能从项目中找到的答案，不要询问用户。
3. 只有关键需求或取舍无法从项目确认时，才向用户提出问题并等待回答。
4. 不要把普通猜测写成已经确定的事实。
5. content 必须是一份完整的 Markdown 计划正文，写清目标、方案、风险和验证方式，不重复 title 对应的一级标题。
6. steps 必须从 content 的实施方案中提炼，按执行顺序排列，并包含必要的验证步骤。
7. content 和 steps 不能出现两套不同的方案。
8. 计划完成后必须调用 submit_plan，不要只输出一段普通 Markdown。
`;

const EXECUTION_PROMPT = `

# 当前模式：Code Mode

下面的计划已经由用户批准。

批准消息会给出本次任务的 PLAN.md 和 TODO.md 路径。
请先读取这两份文件，然后按照 TODO.md 从上到下执行。

- 完成一个有结果的步骤后，立即把对应的 - [ ] 更新为 - [x]。
- 修改代码但还没有完成对应验证时，不能勾选包含验证工作的步骤。
- 遇到错误时先读取本次任务的 TODO.md 确认当前位置，再修复并重新验证。
- 不得擅自改变已经批准的目标和范围。
`;

const PLAN_TOOL_NAMES = new Set([
  "read_file",
  "list_files",
  "search_files",
  "submit_plan",
]);

const CODE_TOOL_NAMES = new Set([
  "read_file",
  "list_files",
  "search_files",
  "write_file",
  "edit_file",
  "bash",
]);

export class Agent {
  private readonly compactor: Compactor;

  constructor(
    private readonly client: ChatClient,
    private readonly registry: Registry,
    private readonly session: Session,
    private readonly state: AgentState,
  ) {
    this.compactor = new Compactor(client, client.getContextWindow());
  }

  /**
   * 获取当前模式允许的工具名
   *
   * @returns 允许的工具名集合
   */
  private getAllowedToolNames(): ReadonlySet<string> {
    return this.state.getMode() === "plan" ? PLAN_TOOL_NAMES : CODE_TOOL_NAMES;
  }

  /**
   * 构建系统提示词
   *
   * @returns 系统提示词
   */
  private buildSystemPrompt(): string {
    if (this.state.getMode() === "plan") {
      return CORE_SYSTEM_PROMPT + PLAN_MODE_PROMPT;
    }

    const approvedPlan = this.state.getApprovedPlan();

    if (approvedPlan) {
      return (
        CORE_SYSTEM_PROMPT +
        EXECUTION_PROMPT +
        `\n\n${formatPlan(approvedPlan)}`
      );
    }

    return CORE_SYSTEM_PROMPT;
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
         content: this.buildSystemPrompt(),
        },
        ...memory,
      ];

      const allowedToolNames = this.getAllowedToolNames();
      const completion = await this.client.completeWithUsage(
        messages,
        this.registry.getDefinitions(allowedToolNames),
      );
      const message = completion.message;

      if (!message) {
        throw new Error("模型没有返回消息。");
      }

      this.session.append(message);

      if (completion.totalTokens !== undefined && completion.totalTokens > 0) {
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
            allowedToolNames,
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

      if (this.state.getStatus() === "waiting_for_approval") {
        const plan = this.state.getPendingPlan();

        if (!plan) {
          throw new Error("计划状态异常。");
        }

        return formatPlan(plan);
      }
    }

    throw new Error(`执行超过 ${MAX_STEPS} 轮，已停止。`);
  }
}
