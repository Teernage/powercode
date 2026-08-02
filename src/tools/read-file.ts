import { readFile } from "node:fs/promises";
import type { Tool } from "./types.js";
import { resolveInWorkDir } from "./path.js";

// 最大读取字节数
const MAX_BYTES = 8_000;

/**
 *  解析路径
 * @description 解析路径，确保它在工作目录内。
 * @param workDir 工作目录
 * @param relativePath 相对路径
 * @returns 解析后的路径
 */
function parsePath(argumentsJson: string): string {
  const input: unknown = JSON.parse(argumentsJson);

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("工具参数必须是一个对象。");
  }

  const path = (input as Record<string, unknown>).path;

  if (typeof path !== "string") {
    throw new Error("path 必须是字符串。");
  }

  return path;
}

/**
 *  读取文件工具
 */
export class ReadFileTool implements Tool {
  readonly name = "read_file"; // 工具名称

  readonly definition = {
    type: "function" as const, // 工具类型
    // 工具函数定义
    function: { 
      name: this.name,
    // 工具描述
      description: "读取当前项目中的文本文件。",
    // 工具参数定义
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string", // 文件路径参数类型
            description: "相对于项目根目录的文件路径", // 文件路径参数描述
          },
        },
        required: ["path"], // 必须包含 path 参数
        additionalProperties: false,  // 不允许其他额外属性
      }, 
    },
  };

  constructor(private readonly workDir: string) {}

  /**
   * 执行工具
   * @param argumentsJson 工具参数 JSON 字符串
   * @returns 工具执行结果
   */
  async execute(argumentsJson: string): Promise<string> {
    const path = parsePath(argumentsJson);
    const targetPath = resolveInWorkDir(this.workDir, path);
    const content = await readFile(targetPath);

    if (content.length > MAX_BYTES) {
      return `${content.subarray(0, MAX_BYTES).toString("utf8")}

...[文件太长，只返回前 ${MAX_BYTES} 个字节]...`;
    }

    return content.toString("utf8");
  }
}