# Demo 06：Plan Mode 与任务清单

这是第六篇《AI Agent 如何执行长任务？给它加上 Plan Mode 和任务清单》的代码存档，保存主项目当前版本，方便后续继续修改根目录的 `src/`。

源码来自提交 `a5b28d1` 对应的当前工作区，`src/` 中的 20 个 TypeScript 文件原样复制，包含现有注释。依赖与编译配置也沿用主项目；未复制真实模型配置、运行目录或构建产物。

## 配置与启动

从仓库根目录进入本 Demo，安装锁定的依赖：

```bash
cd demos/06-plan-mode
npm ci
```

修改本目录的 `provider.json`，按自己的服务填写 `baseURL`、`apiKey`、`model` 和 `contextWindow`。模板中的域名、密钥与模型名均为占位值，`128000` 也只是窗口配置示例，应按实际模型调整。

所有命令都在本 Demo 根目录执行：

```bash
npm run build
mkdir -p workspace/plan-demo
npm start -- --plan -dir ./workspace/plan-demo
```

启动后在终端输入任务，Agent 先研究项目并通过 `submit_plan` 提交计划，再由用户选择批准、修改或取消。批准后进入 Code Mode，并在目标项目中生成对应任务的 `PLAN.md` 和 `TODO.md`。

运行现有项目时，把 `-dir` 后的路径替换成项目路径。省略 `--plan` 会直接进入 Code Mode。

## 交互命令

- `/status`：查看当前模式和状态。
- `/plan`：切换到只读规划模式。
- `/code`：切换到代码模式。
- `exit` 或 `quit`：退出。

## 本阶段保留的能力

- `Session`、Token 用量记录和 `Compactor` 上下文压缩。
- `list_files`、`search_files` 及原有文件和 Bash 工具。
- `AgentState` 管理规划、等待审批和执行状态。
- `Registry` 根据模式筛选工具，并在执行时再次检查允许集合。
- 每个批准计划单独保存计划和任务清单。

这是第六阶段原始行为的存档，尚未接入第七篇的错误分类、失败计数和强制暂停改造。
