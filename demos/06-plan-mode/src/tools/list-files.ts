import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import type { Tool } from "./types.ts";
import { resolveInWorkDir } from "./path.ts";

const MAX_ITEMS = 200; // 最多列出 200 个文件或目录
const SKIPPED_DIRECTORIES = new Set([
  ".git", // 忽略 Git 目录
  ".powercode", // 忽略 PowerCode 目录
  "dist", // 忽略构建输出目录
  "node_modules", // 忽略 Node.js 模块目录
]);

/**
 * 解析路径参数
 * 
 * @param argumentsJson JSON 字符串，包含 path 参数
 * @returns 解析后的路径字符串
 */
function parsePath(argumentsJson: string): string {
  const input = JSON.parse(argumentsJson) as {
    path?: unknown;
  };

  if (input.path !== undefined && typeof input.path !== "string") {
    throw new Error("path 必须是字符串。");
  }

  return input.path ?? ".";
}

/**
 * 转换路径为显示格式
 * 
 * @param path 路径字符串
 * @returns 显示格式的路径字符串
 */
function toDisplayPath(path: string): string {
  return path.replaceAll("\\", "/");
}

/**
 * 列出文件和目录工具
 * 
 * @param workDir 工作目录
 */
export class ListFilesTool implements Tool {
  readonly name = "list_files"; // 工具名称

  /**
   * 工具定义
   */
  readonly definition = {
    type: "function" as const,
    function: {
      name: this.name,
      description: "递归列出当前项目中的文件和目录。",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "相对于项目根目录的目录，默认是当前项目根目录",
          },
        },
        additionalProperties: false,
      },
    },
  };

  constructor(private readonly workDir: string) {}

  /**
   * 执行列出文件和目录操作
   * 
   * @param argumentsJson JSON 字符串，包含 path 参数
   * @returns 列出的文件和目录列表
   */
  async execute(argumentsJson: string): Promise<string> {
    const path = parsePath(argumentsJson); // 解析路径参数
    const start = resolveInWorkDir(this.workDir, path); // 列出的目录路径
    const items: string[] = []; // 列出的文件和目录列表

    /**
     * 递归列出目录和文件
     * 
     * @param directory 目录路径
     */
    const walk = async (directory: string): Promise<void> => {
      if (items.length >= MAX_ITEMS) {
        return;
      }

      const entries = await readdir(directory, {
        withFileTypes: true,
      });

      entries.sort((left, right) =>
        left.name.localeCompare(right.name),
      );

      for (const entry of entries) {
        if (items.length >= MAX_ITEMS) {
          return;
        }

        if (entry.isSymbolicLink()) {
          continue;
        }

        if (
          entry.isDirectory() &&
          SKIPPED_DIRECTORIES.has(entry.name)
        ) {
          continue;
        }

        const fullPath = join(directory, entry.name);
        const displayPath = toDisplayPath(
          relative(this.workDir, fullPath),
        );

        items.push(
          entry.isDirectory()
            ? `${displayPath}/`
            : displayPath,
        );

        if (entry.isDirectory()) {
          await walk(fullPath);
        }
      }
    };

    await walk(start);

    if (items.length === 0) {
      return "目录为空。";
    }

    const suffix =
      items.length >= MAX_ITEMS
        ? `\n...[最多返回 ${MAX_ITEMS} 项]...`
        : "";

    return items.join("\n") + suffix;
  }
}