import { ChatClient } from './chat.ts';
import { loadConfig } from './config.ts';
import { readFileTool } from './readFile.ts';

/**
 *  从命令行参数中获取用户的问题
 * @param args 命令行参数
 * @returns 用户的问题
 */
function getPrompt(args: string[]): string {
  const promptIndex = args.indexOf('-prompt');

  if (promptIndex === -1) {
    throw new Error('请通过 -prompt 传入问题，例如：-prompt "你好"');
  }

  const prompt = args[promptIndex + 1];

  if (!prompt) {
    throw new Error('-prompt 后面不能是空内容。');
  }

  return prompt;
}

/**
 *  主函数，负责处理命令行参数、加载配置、与模型交互并打印结果。
 * @returns 
 */
async function main() {
  // 从命令行参数中获取用户的问题
  const prompt = getPrompt(process.argv.slice(2));
  // 加载配置
  const config = await loadConfig();
  const client = new ChatClient(config); // 创建 ChatClient 实例

  console.log('AI 正在思考...\n');

  const firstMessage = await client.askWithTools(prompt); // 调用模型，获取第一个消息
  const toolCall = firstMessage?.tool_calls?.[0];

  if (!toolCall) {
    console.log(`AI：${firstMessage?.content ?? '模型没有返回内容。'}`);
    return;
  }

  if (toolCall.type !== 'function') {
    throw new Error(`暂时不支持工具类型：${toolCall.type}`);
  }

  if (toolCall.function.name !== 'read_file') {
    throw new Error(`暂时不支持工具：${toolCall.function.name}`);
  }

  console.log(`AI 想读文件：${toolCall.function.arguments}\n`);
  console.log(`正在读取文件：${toolCall.function.arguments}`);

  const fileContent = await readFileTool(toolCall.function.arguments);

  const answer = await client.answerAfterReadFile(
    prompt,
    toolCall,
    fileContent,
  );

  console.log(`AI：${answer}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`启动失败：${message}`);
  process.exit(1);
});