import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ChatClient } from "./chat.ts";
import { loadConfig } from "./config.ts";
import { Compactor } from "./context/compactor.ts";
import { Session } from "./context/session.ts";

const DEMO_DIR = resolve("workspace/context-demo");
const DEMO_FILE = resolve(DEMO_DIR, "large-context.txt");
const DEMO_TOOL_PATH = "context-demo/large-context.txt";
const BEFORE_FILE = resolve(DEMO_DIR, "context-before.json");
const SUMMARY_FILE = resolve(DEMO_DIR, "compressed-summary.md");
const AFTER_FILE = resolve(DEMO_DIR, "context-after.json");

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  const config = await loadConfig();
  const client = new ChatClient(config);
  const session = new Session();

  const blocks = Array.from({ length: 14 }, (_, index) => {
    const title = `# 演示片段 ${index + 1}`;
    const content = `context demo block ${index + 1} `.repeat(300);
    return `${title}\n${content}`;
  });

  await mkdir(DEMO_DIR, { recursive: true });
  await writeFile(DEMO_FILE, blocks.join("\n\n"), "utf8");

  const largeContent = await readFile(DEMO_FILE, "utf8");
  const sections = largeContent.split("\n\n");

  for (const [index, section] of sections.entries()) {
    const toolCallId = `demo-read-${index + 1}`;

    session.append(
      {
        role: "user",
        content: `请读取演示文件的第 ${index + 1} 段。`,
      },
      {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: toolCallId,
            type: "function",
            function: {
              name: "read_file",
              arguments: JSON.stringify({ path: DEMO_TOOL_PATH }),
            },
          },
        ],
      },
      {
        role: "tool",
        tool_call_id: toolCallId,
        content: section,
      },
      {
        role: "assistant",
        content: `已经读取第 ${index + 1} 段。`,
      },
    );
  }

  session.append({
    role: "user",
    content: "请用一句话说明刚才读取的演示文件主要包含什么。",
  });

  console.log(`已创建演示文件：${DEMO_FILE}`);
  console.log(`已构造 ${sections.length} 轮历史消息。\n`);

  const beforeContext = JSON.stringify(session.getHistory(), null, 2);
  await writeFile(BEFORE_FILE, beforeContext, "utf8");

  // 这里使用较小的演示预算，让压缩可以稳定触发。
  // 不会修改 provider.json 中模型真实的 contextWindow。
  const compactor = new Compactor(
    client,
    16_000,
    4_000,
    4_000,
  );

  const memory = await compactor.buildWorkingMemory(session);
  const state = session.getCompaction();

  if (!state?.summary) {
    throw new Error("没有触发上下文压缩，请增加演示文件内容后重试。");
  }

  const afterContext = JSON.stringify(memory, null, 2);
  await Promise.all([
    writeFile(SUMMARY_FILE, state.summary, "utf8"),
    writeFile(AFTER_FILE, afterContext, "utf8"),
  ]);

  console.log(`完整历史：${session.getHistory().length} 条消息`);
  console.log(`本轮工作记忆：${memory.length} 条消息`);
  console.log(`已经压缩到 history[${state.compactedUntil}]。\n`);

  console.log("压缩前后文件：");
  console.log(
    `压缩前 ${formatBytes(Buffer.byteLength(beforeContext, "utf8"))}  ${BEFORE_FILE}`,
  );
  console.log(
    `摘要   ${formatBytes(Buffer.byteLength(state.summary, "utf8"))}  ${SUMMARY_FILE}`,
  );
  console.log(
    `压缩后 ${formatBytes(Buffer.byteLength(afterContext, "utf8"))}  ${AFTER_FILE}\n`,
  );

  const completion = await client.completeWithUsage(
    [
      {
        role: "system",
        content: "你是一个用于验证上下文压缩的助手，请使用中文简短回答。",
      },
      ...memory,
    ],
    [],
  );

  console.log(`AI：${completion.message?.content ?? "没有返回内容"}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`演示失败：${message}`);
  process.exit(1);
});
