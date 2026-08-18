# 将 ceshi.ts 改造为可直接运行的待办演示

## 目标

把当前仅有一行 `console.log("我是测试")` 的 `ceshi.ts` 改造成一个**可以直接运行**的小型 CLI 待办演示程序，支持添加、查看、完成、取消、删除待办等交互操作。

当前项目状态（已核实）：
- 项目根目录只有一个文件 `ceshi.ts`（实际位于根目录而非 `src/` 下）
- 没有 `package.json`、`tsconfig.json` 等任何运行配置

## 方案

### 1. 重写 `ceshi.ts` 为交互式待办程序

使用 Node.js 内置 `readline` 实现命令行交互，纯 TypeScript 单文件、无第三方运行时依赖，数据保存在内存中（演示用途）。

支持命令：

| 命令 | 说明 |
| --- | --- |
| `add <内容>` / `+ <内容>` | 添加一条待办 |
| `list` / `ls` | 列出全部待办（带序号与完成状态 ✓/✗） |
| `done <编号>` | 标记编号对应的待办为已完成 |
| `undo <编号>` | 取消完成状态 |
| `remove <编号>` / `del <编号>` | 删除指定待办 |
| `clear` | 清空全部待办 |
| `help` | 显示命令帮助 |
| `quit` / `exit` | 退出程序 |

主要设计：
- 程序启动时输出欢迎语并附上几条演示数据，方便快速体验；
- 输入为空时提示，非法命令时给出提示而非崩溃；
- 列表输出带颜色与状态符号，阅读友好；
- 每次操作后自动刷新显示当前列表。

### 2. 新增 `package.json`（让程序"直接运行"的关键）

提供零配置运行脚本，使 `npm start` 即可运行：

```json
{
  "name": "todo-demo",
  "version": "1.0.0",
  "description": "小型待办命令行演示",
  "type": "module",
  "scripts": {
    "start": "tsx ceshi.ts",
    "build": "tsc ceshi.ts --outDir dist",
    "run:js": "node dist/ceshi.js"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0"
  }
}
```

- `npm start` → 通过 `tsx` 直接运行 TS 源码，无需先编译；
- 备选方案：`npm run build && npm run run:js` 先编译为 JS 再用 Node 运行，适合无 `tsx` 的环境。

### 3. 目录说明

用户描述为 `src/ceshi.ts`，但实际文件在根目录。为保证改动最小、不破坏现有结构，**保留文件在根目录**，并在 `package.json` 脚本中指向根目录的 `ceshi.ts`。若后续希望纳入 `src/` 目录，只需移动文件并同步修改脚本路径即可。

## 风险

- 环境无网络时 `npm install` 可能失败：提供备选 `npx tsx ceshi.ts`（同样需要网络）以及纯 `tsc` 编译方案；
- 交互式程序在非 TTY（如管道输入）环境下 `readline` 仍可用，但按行读取；程序会在 `EOF`（如 Ctrl+D）时优雅退出；
- 数据仅存内存，退出后清空——符合"小型演示"定位，如需持久化可在后续迭代中加入文件存储。

## 验证方式

1. `npm install` 安装依赖；
2. `npm start` 启动程序；
3. 依次输入命令验证：`list` → `add 写周报` → `done 1` → `remove 2` → `quit`，确认增删改查与退出均正常；
4. 也可用管道方式验证非交互输出：`echo -e "add 测试\nlist\nexit" | npm start`。
