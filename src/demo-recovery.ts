import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { RecoveryManager } from "./context/recovery.ts";
import { runToolBatch } from "./tool-runner.ts";
import { Registry } from "./tools/registry.ts";
import { EditFileTool } from "./tools/edit-file.ts";
import { ReadFileTool } from "./tools/read-file.ts";

const call = (id: string, name: string, args: object) => ({
  id,
  type: "function" as const,
  function: { name, arguments: JSON.stringify(args) },
});

const dir = await mkdtemp(join(tmpdir(), "powercode-demo-"));
try {
  await writeFile(join(dir, "demo.txt"), "status=pending\n", "utf8");
  const registry = new Registry();
  registry.register(new EditFileTool(dir));
  registry.register(new ReadFileTool(dir));
  const allowed = new Set(["edit_file", "read_file"]);

  // 演示 1：编辑失败后先重读文件，再修正参数完成修改
  const recovery1 = new RecoveryManager();
  const first = await runToolBatch(
    [call("1", "edit_file", { path: "demo.txt", old_text: "status=todo", new_text: "status=done" })],
    registry,
    allowed,
    recovery1,
  );
  console.log(String(first.messages[0].content).split("\n").slice(0, 4).join("\n"));
  console.log("");

  const read = await runToolBatch(
    [call("2", "read_file", { path: "demo.txt" })],
    registry,
    allowed,
    recovery1,
  );
  console.log(`读取结果：${String(read.messages[0].content).trim()}`);

  const edit = await runToolBatch(
    [call("3", "edit_file", { path: "demo.txt", old_text: "status=pending", new_text: "status=done" })],
    registry,
    allowed,
    recovery1,
  );
  console.log(String(edit.messages[0].content));
  console.log(`文件核验：${(await readFile(join(dir, "demo.txt"), "utf8")).trim()}\n`);

  // 演示 2：同一错误调用累计失败 3 次（即使中间穿插成功操作）触发暂停
  const recovery2 = new RecoveryManager();
  const error = new Error("没有找到 old_text，请先重新读取文件。");
  recovery2.onFailure("edit_file", "{}", error);
  recovery2.onSuccess("read_file", "{}");
  recovery2.onFailure("edit_file", "{}", error);
  const third = recovery2.onFailure("edit_file", "{}", error);
  console.log(third.output.split("\n").slice(-2).join("\n"));
  console.log(`stop=${third.stop}`);
} finally {
  await rm(dir, { recursive: true, force: true });
}
