import {
  mkdir,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import {
  formatPlan,
  type PlanDraft,
} from "./plan.ts";

export interface PlanFiles {
  taskDir: string;
  planPath: string;
  todoPath: string;
}

function createTaskName(title: string): string {
  const safeTitle = title
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");

  const digits = new Date()
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 17);
  const timestamp = [
    digits.slice(0, 8),
    digits.slice(8),
  ].join("-");

  return `${timestamp}-${safeTitle || "plan"}`;
}

function formatTodo(plan: PlanDraft): string {
  const steps = plan.steps
  
    .map((item) => `- [ ] ${item}`)
    .join("\n");

  return `# 执行清单

> 这份清单由已经批准的 PLAN.md 生成。

## 实现步骤

${steps}
`;
}

export async function saveApprovedPlan(
  workDir: string,
  plan: PlanDraft,
): Promise<PlanFiles> {
  const taskName = createTaskName(plan.title);
  const taskDir = join(
    ".powercode",
    "tasks",
    taskName,
  );
  const absoluteTaskDir = join(workDir, taskDir);
  const planPath = join(taskDir, "PLAN.md");
  const todoPath = join(taskDir, "TODO.md");

  await mkdir(absoluteTaskDir, {
    recursive: true,
  });

  await Promise.all([
    writeFile(
      join(workDir, planPath),
      formatPlan(plan),
      "utf8",
    ),
    writeFile(
      join(workDir, todoPath),
      formatTodo(plan),
      "utf8",
    ),
  ]);

  return {
    taskDir,
    planPath,
    todoPath,
  };
}