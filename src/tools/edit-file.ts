import { readFile, writeFile } from "node:fs/promises";
import type { Tool } from "./types.ts";
import { resolveInWorkDir } from "./path.ts";

/**
 *   解析编辑文件工具参数
 * @param argumentsJson  工具参数 JSON 字符串
 * @returns 解析后的参数
 */
function parseArguments(argumentsJson: string): {
  path: string;
  oldText: string;
  newText: string;
} {
  const input: unknown = JSON.parse(argumentsJson);

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("工具参数必须是一个对象。");
  }

  const value = input as Record<string, unknown>;
  const path = value.path;
  const oldText = value.old_text;
  const newText = value.new_text;

  if (
    typeof path !== "string" ||
    typeof oldText !== "string" ||
    typeof newText !== "string"
  ) {
    throw new Error("path、old_text 和 new_text 必须是字符串。");
  }

  if (!oldText) {
    throw new Error("old_text 不能为空。");
  }

  return { path, oldText, newText };
}

/**
 *   编辑文件工具
 * @param argumentsJson 工具参数 JSON 字符串
 * @returns 工具执行结果
 */
export class EditFileTool implements Tool {
  readonly name = "edit_file";

  readonly definition = {
    type: "function" as const,
    function: {
      name: this.name,
      description:
        "把文件中唯一出现的一段旧文本替换成新文本。修改前应先读取文件。",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "要修改的文件路径" },
          old_text: { type: "string", description: "文件中原有的完整文本" },
          new_text: { type: "string", description: "替换后的文本" },
        },
        required: ["path", "old_text", "new_text"],
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
    const { path, oldText, newText } = parseArguments(argumentsJson);
    const targetPath = resolveInWorkDir(this.workDir, path);
    const content = await readFile(targetPath, "utf8");
    const matches = content.split(oldText).length - 1;

    if (matches === 0) {
      throw new Error("没有找到 old_text，请先重新读取文件。");
    }

    if (matches > 1) {
      throw new Error(`old_text 出现了 ${matches} 次，请提供更多上下文。`);
    }

    await writeFile(targetPath, content.replace(oldText, newText), "utf8");

    return `已修改文件：${path}`;
  }
}