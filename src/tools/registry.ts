import type OpenAI from "openai";
import type { Tool } from "./types.ts";

export class Registry {
  // 工具注册表
  // 键：工具名称
  // 值：工具实例
  private readonly tools = new Map<string, Tool>();

  /**
   * 注册工具
   * @param tool 工具
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`工具重复注册：${tool.name}`);
    }

    this.tools.set(tool.name, tool);
  }

  /**
   * 获取所有工具的定义
   * @returns 所有工具的定义
   */
  getDefinitions(
    allowedNames?: ReadonlySet<string>,
  ): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return [...this.tools.values()]
      .filter((tool) => !allowedNames || allowedNames.has(tool.name))
      .map((tool) => tool.definition);
  }

  /**
   * 执行工具
   * @param name 工具名称
   * @param argumentsJson JSON 字符串，包含工具参数
   * @param allowedNames  允许调用的工具名称集合
   * @returns 工具执行结果
   */
  async execute(
    name: string,
    argumentsJson: string,
    allowedNames?: ReadonlySet<string>,
  ): Promise<string> {
    if (allowedNames && !allowedNames.has(name)) {
      throw new Error(`当前模式不允许调用工具：${name}`);
    }

    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`找不到工具：${name}`);
    }

    return tool.execute(argumentsJson);
  }
}
