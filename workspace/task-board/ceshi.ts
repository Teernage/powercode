import * as readline from "readline";

type Todo = {
  id: number;
  text: string;
  done: boolean;
};

const todos: Todo[] = [];
let nextId = 1;

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

function printHelp(): void {
  console.log(`
${CYAN}可用命令:${RESET}
  add <内容> / + <内容>        添加一条待办
  list / ls                    列出全部待办
  done <编号>                  标记完成
  undo <编号>                  取消完成
  remove <编号> / del <编号>   删除待办
  clear                        清空全部待办
  help                         显示本帮助
  quit / exit                  退出程序
`);
}

function showList(): void {
  if (todos.length === 0) {
    console.log(
      `${YELLOW}暂无待办事项，试试输入 "add 写周报" 添加一个。${RESET}`,
    );
    return;
  }
  console.log(`${CYAN}===== 待办列表 (共 ${todos.length} 条) =====${RESET}`);
  todos.forEach((t) => {
    const status = t.done ? `${GREEN}[✓]${RESET}` : `${RED}[ ]${RESET}`;
    const text = t.done ? `${YELLOW}${t.text}${RESET}` : t.text;
    console.log(`  ${status} #${t.id} ${text}`);
  });
  console.log(`${CYAN}===================================${RESET}`);
}

function addTodo(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) {
    console.log(`${RED}请输入待办内容，例如: add 买牛奶${RESET}`);
    return;
  }
  todos.push({ id: nextId++, text: trimmed, done: false });
  console.log(`${GREEN}已添加: ${trimmed}${RESET}`);
  showList();
}

function doneTodo(idStr: string): void {
  const id = Number(idStr);
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    console.log(`${RED}找不到编号 #${idStr} 的待办。${RESET}`);
    return;
  }
  if (todo.done) {
    console.log(`${YELLOW}#${id} 已经是完成状态了。${RESET}`);
  } else {
    todo.done = true;
    console.log(`${GREEN}#${id} 已标记完成: ${todo.text}${RESET}`);
  }
  showList();
}

function undoTodo(idStr: string): void {
  const id = Number(idStr);
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    console.log(`${RED}找不到编号 #${idStr} 的待办。${RESET}`);
    return;
  }
  if (!todo.done) {
    console.log(`${YELLOW}#${id} 本来就是未完成状态。${RESET}`);
  } else {
    todo.done = false;
    console.log(`${GREEN}#${id} 已取消完成: ${todo.text}${RESET}`);
  }
  showList();
}

function removeTodo(idStr: string): void {
  const id = Number(idStr);
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) {
    console.log(`${RED}找不到编号 #${idStr} 的待办。${RESET}`);
    return;
  }
  const [removed] = todos.splice(index, 1);
  console.log(`${GREEN}已删除 #${removed.id}: ${removed.text}${RESET}`);
  showList();
}

function clearTodos(): void {
  todos.length = 0;
  nextId = 1;
  console.log(`${YELLOW}已清空全部待办。${RESET}`);
  showList();
}

function welcome(): void {
  console.log(`
${CYAN}========================================${RESET}
${CYAN}  小型待办演示 (TypeScript + readline)${RESET}
${CYAN}========================================${RESET}
输入 help 查看命令帮助，输入 quit 退出。
`);
  // 附上演示数据，方便快速体验
  todos.push({ id: nextId++, text: "学习 TypeScript", done: true });
  todos.push({ id: nextId++, text: "写周报", done: false });
  todos.push({ id: nextId++, text: "买牛奶", done: false });
  showList();
}

function handleInput(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    console.log(`${YELLOW}输入为空，输入 help 查看帮助。${RESET}`);
    return true;
  }
  const [cmd, ...rest] = trimmed.split(/\s+/);
  const args = rest.join(" ");

  switch (cmd.toLowerCase()) {
    case "add":
    case "+":
      addTodo(args);
      return true;
    case "list":
    case "ls":
      showList();
      return true;
    case "done":
      doneTodo(args);
      return true;
    case "undo":
      undoTodo(args);
      return true;
    case "remove":
    case "del":
      removeTodo(args);
      return true;
    case "clear":
      clearTodos();
      return true;
    case "help":
      printHelp();
      return true;
    case "quit":
    case "exit":
      console.log(`${CYAN}再见，下次再来！${RESET}`);
      return false;
    default:
      console.log(`${RED}未知命令: "${cmd}"，输入 help 查看帮助。${RESET}`);
      return true;
  }
}

function main(): void {
  welcome();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("line", (line) => {
    const keepRunning = handleInput(line);
    if (!keepRunning) {
      rl.close();
    }
  });

  rl.on("close", () => {
    console.log(`${CYAN}程序已退出。${RESET}`);
    process.exit(0);
  });
}

main();
