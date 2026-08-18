/**
 * CLI 选项
 */
export interface CliOptions {
  dir: string; // Agent 可以操作的工作目录
  plan: boolean; // 是否启动后直接进入 Plan Mode
}


/**
 * 读取命令行参数值
 * 
 * @param args 命令行参数数组
 * @param name 参数名
 * @returns 参数值
 */
function readValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  const value = args[index + 1];

  if (!value || value.startsWith("-")) {
    throw new Error(`${name} 后面需要一个值。`);
  }

  return value;
}

/**
 * 解析命令行参数为 CLI 选项
 * 
 * @param args 命令行参数数组
 * @returns CLI 选项
 */
export function parseCliOptions(args: string[]): CliOptions {
  return {
    dir: readValue(args, "-dir") ?? ".",
    plan: args.includes("--plan"),
  };
}