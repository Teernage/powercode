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
import { AgentState } from "./plan.ts";
import { saveApprovedPlan } from "./plan-files.ts";
import { ListFilesTool } from "./tools/list-files.ts";
import { SearchFilesTool } from "./tools/search-files.ts";
import { SubmitPlanTool } from "./tools/submit-plan.ts";
import { parseCliOptions } from "./options.ts";

async function main() {
  const config = await loadConfig();
  const client = new ChatClient(config);

  const options = parseCliOptions(process.argv.slice(2));
  const workDir = resolve(process.cwd(), options.dir);
  const state = new AgentState(options.plan ? "plan" : "code");
  const registry = new Registry();

  registry.register(new ReadFileTool(workDir));
  registry.register(new ListFilesTool(workDir));
  registry.register(new SearchFilesTool(workDir));
  registry.register(new WriteFileTool(workDir));
  registry.register(new EditFileTool(workDir));
  registry.register(new BashTool(workDir));
  registry.register(new SubmitPlanTool(state));

  const session = new Session();
  const agent = new Agent(client, registry, session, state);
  const runPrompt = async (value: string) => {
    console.log("AI 正在思考...\n");
    const answer = await agent.run(value);
    console.log(`AI：${answer}`);
  };

  const readline = createInterface({ input, output });

  try {
    console.log("已进入交互模式，输入 exit 或 quit 退出。\n");

    function printStatus(): void {
      console.log(`当前模式：${state.getMode()}`);
      console.log(`当前状态：${state.getStatus()}`);

      const tools =
        state.getMode() === "plan"
          ? "read_file, list_files, search_files, submit_plan"
          : "read_file, list_files, search_files, write_file, edit_file, bash";

      console.log(`可用工具：${tools}`);
    }

    async function reviewPendingPlan(): Promise<void> {
      while (state.getStatus() === "waiting_for_approval") {
        console.log(`
请选择：
1. 批准并执行
2. 继续修改计划
3. 取消
`);

        const choice = (await readline.question("选择：")).trim();

        if (choice === "1") {
          const plan = state.approvePlan();

          const files = await saveApprovedPlan(workDir, plan);

          console.log("\n计划已批准，已进入 Code Mode。");
          console.log(`已创建任务目录：${files.taskDir}\n`);

          await runPrompt(
            `计划已经批准。
计划文件：${files.planPath}
执行清单：${files.todoPath}
请先读取这两份文件，从第一项未完成任务开始执行；每完成一项后立即更新这份 TODO.md。`,
          );
          return;
        }

        if (choice === "2") {
          const feedback = (
            await readline.question("请输入计划修改意见：")
          ).trim();

          if (!feedback) {
            console.log("修改意见不能为空。");
            continue;
          }

          state.refinePlan();

          await runPrompt(
            `请根据下面的反馈修改计划，并再次调用 submit_plan：\n${feedback}`,
          );

          continue;
        }

        if (choice === "3") {
          state.cancelPlan();
          console.log("\n计划已取消，已返回 Code Mode。");
          return;
        }

        console.log("请输入 1、2 或 3。");
      }
    }

    while (true) {
      const value = (await readline.question("> ")).trim();

      if (!value) continue;
      if (value === "exit" || value === "quit") {
        break;
      }

      if (value === "/plan") {
        state.enterPlan();
        console.log("已进入 Plan Mode，只能读取和搜索项目。");
        continue;
      }

      if (value === "/code") {
        state.enterCode();
        console.log("已进入 Code Mode。");
        continue;
      }

      if (value === "/status") {
        printStatus();
        continue;
      }

      try {
        await runPrompt(value);
        await reviewPendingPlan();
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
