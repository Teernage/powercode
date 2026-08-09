# powercode

一个从零实现 AI Agent 的 TypeScript 教学项目。

## ✨ 功能

- 在终端中与 AI 模型对话（交互式多轮对话）
- 支持读取、创建/覆盖、编辑文件
- 支持执行 shell 命令（构建、测试等）
- 多轮工具调用，最多 8 轮自动执行
- 工具注册机制，支持灵活扩展工具
- 会话上下文压缩，优化 token 使用

## 🛠️ 技术栈

- TypeScript + Node.js（ESM）
- OpenAI 兼容 SDK（可对接 DeepSeek、OpenAI 等）

## 📦 安装

```bash
npm install
```

## ⚙️ 配置

在项目根目录创建 `provider.json`：

```json
{
  "baseURL": "https://api.deepseek.com",
  "apiKey": "你的 API Key",
  "model": "deepseek-v4-flash"
}
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API

在项目根目录创建 `.env` 文件（或修改 `provider.json`）：

```json
{
  "protocol": "openai",
  "baseURL": "https://api.deepseek.com",
  "apiKey": "你的 API Key",
  "model": "deepseek-v4-flash"
}
```

### 3. 构建

```bash
npm run build
```

### 4. 运行

```bash
npm start -- -prompt "帮我看看这个项目结构"
```

## 📚 示例

项目在 `demos/` 目录提供了 4 个完整示例：

| 示例 | 说明 |
|------|------|
| `01-chat-only` | 基础对话示例，仅调用 LLM |
| `02-read-file` | 读取文件示例 |
| `03-agent-loop` | 完整的 Agent 循环示例 |
| `04-tool-registry` | 工具注册机制示例 |

运行示例：

```bash
node demos/01-chat-only/index.ts
```

## 📁 项目结构

```
src/
├── agent.ts          # Agent 主循环，负责多轮工具调用
├── chat.ts           # 封装 OpenAI 兼容客户端
├── config.ts         # 加载 provider.json 配置
├── main.ts           # 程序入口，注册工具并启动
└── tools/
    ├── types.ts      # Tool 接口定义
    ├── registry.ts   # 工具注册表（注册/分发/执行）
    ├── path.ts       # 路径安全校验
    ├── read-file.ts  # 读取文件
    ├── write-file.ts # 创建或覆盖文件
    ├── edit-file.ts  # 编辑文件（精确替换）
    └── bash.ts       # 执行 shell 命令
```

## 🔧 内置工具

| 工具 | 说明 |
|------|------|
| `read_file` | 读取项目内文本文件，超过 8KB 自动截断 |
| `write_file` | 创建或覆盖文件，目录不存在时自动创建 |
| `edit_file` | 精确替换文件中的一段文本（需先读取） |
| `bash` | 在项目目录执行命令，30 秒超时，8KB 输出上限 |

## 📖 学习路径

1. **从零开始**：阅读 `src/` 中的源码，理解 Agent 的基本架构
2. **运行示例**：从 `demos/01-chat-only` 开始，逐步学习工具集成
3. **扩展工具**：在 `src/tools/` 中添加自己的工具
4. **优化上下文**：了解会话上下文压缩机制如何节省 token

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
