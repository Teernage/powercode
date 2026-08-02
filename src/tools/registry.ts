import type OpenAI from "openai";
import type { Tool } from "./types.js";

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
  getDefinitions(): OpenAI.Chat.Completions.ChatCompletionTool[] {
    return [...this.tools.values()].map((tool) => tool.definition);
  }

  /**
   * 执行工具
   * @param name 工具名称
   * @param argumentsJson 工具参数 JSON 字符串
   * @returns 工具执行结果
   */   
  async execute(name: string, argumentsJson: string): Promise<string> {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`找不到工具：${name}`);
    }

    return tool.execute(argumentsJson);
  }
}