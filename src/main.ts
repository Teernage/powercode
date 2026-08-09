import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { resolve } from "node:path";
import { Agent } from "./agent.ts";
import { ChatClient } from "./chat.ts";
import { loadConfig } from "./config.ts";
import { Session } from "./context/session.ts";
import { BashTool } from "./tools/bash.ts";
import { EditFileTool } from "./tools/edit-file.ts";
import { ReadFileTool } from "./tools/read-file.ts";
import { Registry } from "./tools/registry.ts";
import { WriteFileTool } from "./tools/write-file.ts";

async function main() {
  const config = await loadConfig();
  const client = new ChatClient(config);
  const workDir = resolve(process.cwd());
  const registry = new Registry();

  registry.register(new ReadFileTool(workDir));
  registry.register(new WriteFileTool(workDir));
  registry.register(new EditFileTool(workDir));
  registry.register(new BashTool(workDir));

  const session = new Session();
  const agent = new Agent(client, registry, session);

  const runPrompt = async (value: string) => {
    console.log("AI 正在思考...\n");
    const answer = await agent.run(value);
    console.log(`AI：${answer}`);
  };

  const readline = createInterface({ input, output });

  try {
    console.log("已进入交互模式，输入 exit 或 quit 退出。\n");

    while (true) {
      const value = (await readline.question("> ")).trim();

      if (!value) continue;
      if (value === "exit" || value === "quit") break;

      try {
        await runPrompt(value);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`本轮执行失败：${message}`);
      }
    }
  } finally {
    readline.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`启动失败：${message}`);
  process.exit(1);
});