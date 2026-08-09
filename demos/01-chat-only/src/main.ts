import { ChatClient } from "./chat.ts";
import { loadConfig } from "./config.ts";

/**
 * 从命令行参数中提取用户问题
 *
 * @param args 命令行参数数组
 * @returns 用户的问题或指令
 * @throws 当 -prompt 参数缺失或后面为空时抛出错误
 */
function getPrompt(args: string[]): string {
  const promptIndex = args.indexOf("-prompt");

  if (promptIndex === -1) {
    throw new Error('请通过 -prompt 传入问题，例如：-prompt "你好"');
  }

  const prompt = args[promptIndex + 1];

  if (!prompt) {
    throw new Error("-prompt 后面不能是空内容。");
  }

  return prompt;
}

/**
 * 主函数，处理命令行参数并调用 ChatClient 发送问题
 */
async function main() {
  const prompt = getPrompt(process.argv.slice(2));
  const config = await loadConfig();
  const client = new ChatClient(config);

  console.log("AI 正在思考...\n");

  const answer = await client.ask(prompt);

  console.log(`AI：${answer}`);
}

// 处理异常并退出进程
main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`启动失败：${message}`);
  process.exit(1);
});