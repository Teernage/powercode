import {
  AgentState,
  type PlanDraft,
} from "../plan.ts";
import type { Tool } from "./types.ts";

/**
 * 解析字符串参数
 * 
 * @param input  输入参数对象
 * @param name   参数名称
 * @returns 解析后的字符串值
 */
function parseString(
  input: Record<string, unknown>,
  name: string,
): string {
  const value = input[name];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} 必须是非空字符串。`);
  }

  return value.trim();
}

/**
 * 解析字符串数组参数
 * 
 * @param input  输入参数对象
 * @param name   参数名称
 * @returns 解析后的字符串数组值
 */
function parseStringArray(
  input: Record<string, unknown>,
  name: string,
): string[] {
  const value = input[name];

  if (
    !Array.isArray(value) ||
    value.some(
      (item) =>
        typeof item !== "string" || !item.trim(),
    )
  ) {
    throw new Error(`${name} 必须是字符串数组。`);
  }

  if (value.length === 0) {
    throw new Error(`${name} 不能为空。`);
  }

  return value.map((item) => item.trim());
}

/**
 * 解析计划参数
 * 
 * @param argumentsJson JSON 字符串，包含计划参数
 * @returns 解析后的计划对象
 */
function parsePlan(argumentsJson: string): PlanDraft {
  const input: unknown = JSON.parse(argumentsJson);

  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input)
  ) {
    throw new Error("计划参数必须是对象。");
  }

  const record = input as Record<string, unknown>;

  return {
    title: parseString(record, "title"),
    content: parseString(record, "content"),
    steps: parseStringArray(record, "steps"),
  };
}

/**
 * 提交计划工具
 */
export class SubmitPlanTool implements Tool {
  readonly name = "submit_plan";

  readonly definition = {
    type: "function" as const,
    function: {
      name: this.name,
      description:
        "提交最终实施计划，并暂停等待用户审批。",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "计划标题",
          },
          content: {
            type: "string",
            description:
              "完整的 Markdown 计划正文，包含目标、方案、风险和验证方式，不重复一级标题",
          },
          steps: {
            type: "array",
            items: { type: "string" },
            description: "按执行顺序排列的实施步骤",
          },
        },
        required: [
          "title",
          "content",
          "steps",
        ],
        additionalProperties: false,
      },
    },
  };

  constructor(private readonly state: AgentState) {}

  /**
   * 执行提交计划工具
   * 
   * @param argumentsJson JSON 字符串，包含计划参数
   * @returns 工具执行结果
   */
  async execute(argumentsJson: string): Promise<string> {
    const plan = parsePlan(argumentsJson);
    this.state.submitPlan(plan);

    return "计划已提交，等待用户审批。";
  }
}