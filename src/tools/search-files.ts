import {
  readFile,
  readdir,
  stat,
} from "node:fs/promises";
import { join, relative } from "node:path";
import type { Tool } from "./types.ts";
import { resolveInWorkDir } from "./path.ts";

const MAX_RESULTS = 50;
const MAX_FILE_BYTES = 200_000;
const SKIPPED_DIRECTORIES = new Set([
  ".git",
  ".powercode",
  "dist",
  "node_modules",
]);

/**
 * 搜索文件输入参数
 */
interface SearchInput {
  query: string;
  path: string;
}

/**
 * 解析搜索文件输入参数
 * 
 * @param argumentsJson JSON 字符串，包含 query 和 path 参数
 * @returns 解析后的搜索文件输入参数
 */
function parseInput(argumentsJson: string): SearchInput {
  const input = JSON.parse(argumentsJson) as {
    query?: unknown;
    path?: unknown;
  };

  if (
    typeof input.query !== "string" ||
    !input.query.trim()
  ) {
    throw new Error("query 必须是非空字符串。");
  }

  if (
    input.path !== undefined &&
    typeof input.path !== "string"
  ) {
    throw new Error("path 必须是字符串。");
  }

  return {
    query: input.query,
    path: input.path ?? ".",
  };
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
 * 搜索文件工具
 */
export class SearchFilesTool implements Tool {
  readonly name = "search_files";

  readonly definition = {
    type: "function" as const,
    function: {
      name: this.name,
      description:
        "在当前项目的文本文件中搜索关键词。",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "要搜索的文本关键词",
          },
          path: {
            type: "string",
            description:
              "相对于项目根目录的搜索目录，默认是项目根目录",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  };

  constructor(private readonly workDir: string) {}

  /**
   * 执行搜索文件工具
   * 
   * @param argumentsJson JSON 字符串，包含 query 和 path 参数
   * @returns 搜索结果
   */
  async execute(argumentsJson: string): Promise<string> {
    const input = parseInput(argumentsJson);
    const start = resolveInWorkDir(
      this.workDir,
      input.path,
    );
    const query = input.query.toLowerCase();
    const results: string[] = [];

    /**
     * 递归搜索目录和文件
     * 
     * @param directory 目录路径
     */
    const walk = async (directory: string): Promise<void> => {
      if (results.length >= MAX_RESULTS) {
        return;
      }

      const entries = await readdir(directory, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        if (results.length >= MAX_RESULTS) {
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

        if (entry.isDirectory()) {
          await walk(fullPath);
          continue;
        }

        const fileStat = await stat(fullPath);

        if (fileStat.size > MAX_FILE_BYTES) {
          continue;
        }

        const content = await readFile(fullPath, "utf8");

        if (content.includes("\0")) {
          continue;
        }

        const displayPath = toDisplayPath(
          relative(this.workDir, fullPath),
        );
        const lines = content.split(/\r?\n/);

        for (
          let index = 0;
          index < lines.length;
          index += 1
        ) {
          const line = lines[index];

          if (line.toLowerCase().includes(query)) {
            results.push(
              `${displayPath}:${index + 1}: ${line.trim()}`,
            );
          }

          if (results.length >= MAX_RESULTS) {
            return;
          }
        }
      }
    };

    await walk(start);

    if (results.length === 0) {
      return `没有找到关键词：${input.query}`;
    }

    const suffix =
      results.length >= MAX_RESULTS
        ? `\n...[最多返回 ${MAX_RESULTS} 条结果]...`
        : "";

    return results.join("\n") + suffix;
  }
}