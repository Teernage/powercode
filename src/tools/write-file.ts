import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { Tool } from "./types.js";
import { resolveInWorkDir } from "./path.js";

/**
 *   解析写入文件工具参数
 * @param argumentsJson 工具参数 JSON 字符串
 * @returns 解析后的参数
 */
function parseArguments(argumentsJson: string): {
  path: string;
  content: string;
} {
  const input: unknown = JSON.parse(argumentsJson);

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("工具参数必须是一个对象。");
  }

  const { path, content } = input as Record<string, unknown>;

  if (typeof path !== "string" || typeof content !== "string") {
    throw new Error("path 和 content 必须是字符串。");
  }

  return { path, content };
}

/**
 *   写入文件工具
 * @param argumentsJson 工具参数 JSON 字符串
 * @returns 工具执行结果
 */
export class WriteFileTool implements Tool {
  readonly name = "write_file";

  readonly definition = {
    type: "function" as const,
    function: {
      name: this.name,
      description: "创建或覆盖当前项目中的文件，目录不存在时会自动创建。",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "相对于项目根目录的路径" },
          content: { type: "string", description: "完整文件内容" },
        },
        required: ["path", "content"], 
        additionalProperties: false,
      },
    },
  };

  constructor(private readonly workDir: string) {}

  /**
   *   执行工具
   * @param argumentsJson 工具参数 JSON 字符串
   * @returns 工具执行结果
   */
  async execute(argumentsJson: string): Promise<string> {
    const { path, content } = parseArguments(argumentsJson);
    const targetPath = resolveInWorkDir(this.workDir, path);

    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, content, "utf8");

    return `已写入文件：${path}`;
  }
}