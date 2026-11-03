import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Tool } from "./types.ts";
import { ToolExecutionError, type FailureKind } from '../context/recovery.ts';

const execFileAsync = promisify(execFile); // 异步执行文件
const TIMEOUT_MS = 30_000; // 30 秒超时
const MAX_BUFFER = 8_000; // 最大缓冲区大小，8KB

/**
 *  解析Bash工具参数
 * @param argumentsJson 工具参数 JSON 字符串
 * @returns 解析后的命令
 * @returns 
 */
function parseCommand(argumentsJson: string): string {
  const input: unknown = JSON.parse(argumentsJson);

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("工具参数必须是一个对象。");
  }

  const command = (input as Record<string, unknown>).command;

  if (typeof command !== "string" || !command.trim()) {
    throw new Error("command 必须是非空字符串。");
  }

  return command;
}

/**
 *  Bash工具
 * @param argumentsJson 工具参数 JSON 字符串
 * @returns 工具执行结果
 */
export class BashTool implements Tool {
  readonly name = "bash";

  readonly definition = {
    type: "function" as const,
    function: {
      name: this.name,
      description: "在当前项目目录中执行命令，用于构建、测试和运行代码。",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "要执行的命令" },
        },
        required: ["command"], // 必须提供 command 参数
        additionalProperties: false,
      },
    },
  };

  constructor(
    private readonly workDir: string,
    private readonly timeoutMs = TIMEOUT_MS,
  ) {}

  /**
 *  执行工具
 * @param argumentsJson  工具参数 JSON 字符串
 * @returns              工具执行结果
 */
async execute(argumentsJson: string): Promise<string> {
  const command = parseCommand(argumentsJson);

  try {
    const { stdout, stderr } = await execFileAsync("bash", ["-c", command], {
      cwd: this.workDir,
      timeout: this.timeoutMs,
      maxBuffer: MAX_BUFFER,
    });
    return [stdout, stderr].filter(Boolean).join("\n").trim()
      || "命令执行成功，没有终端输出。";
  } catch (error) {
    const e = error as Error & {
      code?: string | number; killed?: boolean; signal?: string;
      stdout?: string; stderr?: string;
    };
    let kind: FailureKind = "command_failed";
    if (e.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
      kind = "output_limit";
    } else if (e.killed) {
      kind = "timeout";
    }
    const detail = [
      `code=${e.code ?? "unknown"}; signal=${e.signal ?? "none"}`,
      e.message, e.stdout, e.stderr,
    ].filter(Boolean).join("\n");
    throw new ToolExecutionError(kind, detail);
  }
}

}