import { Agent } from './agent.js';
import { ChatClient } from './chat.js';
import { loadConfig } from './config.js';

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

async function main() {
  const prompt = getPrompt(process.argv.slice(2));
  const config = await loadConfig();
  const client = new ChatClient(config);
  const agent = new Agent(client);

  console.log('AI 正在思考...\n');

  const answer = await agent.run(prompt);
  console.log(`AI：${answer}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`启动失败：${message}`);
  process.exit(1);
});
