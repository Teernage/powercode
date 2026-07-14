/*
 * @Author: Teernage 2644545276@qq.com
 * @Date: 2026-07-12 18:46:27
 * @LastEditors: Teernage 2644545276@qq.com
 * @LastEditTime: 2026-07-12 22:38:06
 * @FilePath: /harness工程/powercode/src/main.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ChatClient } from "./chat.js";
import { loadConfig } from "./config.js";

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