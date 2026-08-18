# 往期文章 Demo

这组目录对应 Agent 能力演进的五个代码阶段，每个阶段都整理为独立 Demo。

| 阶段 | 目录 | 对应能力 | 现场问题 |
| --- | --- | --- | --- |
| 01 | `01-chat-only` | 最短一问一答 | `用一句话解释什么是 TypeScript` |
| 02 | `02-read-file` | 一次 `read_file` 工具调用 | `帮我读一下 README.md，这个项目是做什么的？` |
| 03 | `03-agent-loop` | 多轮 Agent Loop | `先读 README.md，再看看 package.json，告诉我这个项目怎么启动` |
| 04 | `04-tool-registry` | Registry、多工具和安全边界 | `创建 workspace/demo/hello.ts，让它输出 Hello, power-code，然后运行它` |
| 05 | `05-session-compaction` | Session 会话记忆与 Compactor 上下文压缩 | 连续追问，并运行 `node dist/demo-compaction.js` 观察压缩结果 |

## 运行前准备

每个 Demo 都从对应阶段的代码整理而来，代码和阶段目标保持一致。每个目录都包含独立的依赖配置和一个不含真实密钥的 `provider.json` 模板。

首次运行某个 Demo 时，进入对应目录，打开 `provider.json` 并填写自己的 API Key：

```bash
cd demos/04-tool-registry
npm install
```

按实际使用的模型服务配置 `baseURL`、`apiKey` 和 `model`。填好后的 `provider.json` 不要再次分享。

每个 Demo 都可以单独安装依赖，不需要先安装父目录的依赖。

```bash
npm run build
npm start -- -prompt "帮我看看这个项目结构"
```

把路径和问题替换成上表中的其他阶段即可。现场演示时，建议提前把五组命令各跑一次，并保存终端截图作为备用。

## 阶段说明

- `01-chat-only`：最短一问一答。
- `02-read-file`：一次 `read_file` 工具调用。
- `03-agent-loop`：多轮 Agent Loop。
- `04-tool-registry`：工具管理阶段，包含 `Registry`、`read_file`、`write_file`、`edit_file` 和 `bash`。
- `05-session-compaction`：会话与上下文管理阶段，包含 `Session`、Token 用量记录、工作记忆构造和 `Compactor`。
