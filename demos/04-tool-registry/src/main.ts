import { resolve } from "node:path";
import { Agent } from "./agent.ts";
import { ChatClient } from "./chat.ts";
import { loadConfig } from "./config.ts";
import { BashTool } from "./tools/bash.ts";
import { EditFileTool } from "./tools/edit-file.ts";
import { ReadFileTool } from "./tools/read-file.ts";
import { Registry } from "./tools/registry.ts";
import { WriteFileTool } from "./tools/write-file.ts";

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
  const workDir = resolve(process.cwd());
  const registry = new Registry();

  registry.register(new ReadFileTool(workDir));
  registry.register(new WriteFileTool(workDir));
  registry.register(new EditFileTool(workDir));
  registry.register(new BashTool(workDir));

  const agent = new Agent(client, registry);

  console.log("AI 正在思考...\n");
  const answer = await agent.run(prompt);
  console.log(`AI：${answer}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`启动失败：${message}`);
  process.exit(1);
});

