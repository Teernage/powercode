# Demo 04：工具管理中心

这是第四阶段：工具集合、统一注册和 Agent 的安全边界。

## 配置

打开当前目录下的 `provider.json`，填写自己的 API Key；`baseURL` 和 `model` 也可以按实际使用的模型服务调整。这个文件只是模板，填好后不要把包含真实 API Key 的版本再次分享。

## 运行

```bash
cd /Users/xuzhenxin/Documents/harness工程/powercode/demos/04-tool-registry
npm install
npm run build
npm start -- -prompt "创建 workspace/demo/hello.ts，让它输出 Hello, power-code，然后运行它"
```

## 现场重点

观察 `write_file → bash → 最终回答`，并补一句：工具越多，越需要统一注册、分发和限制路径、命令、超时与输出。

---

# 项目说明

一个从零实现 AI Agent 的 TypeScript 教学项目。

## ✨ 功能

- 在终端中与 AI 模型对话
- 支持读取、创建/覆盖、编辑文件
- 支持执行 shell 命令（构建、测试等）
- 多轮工具调用，最多 8 轮自动执行

## 🛠️ 技术栈

- TypeScript + Node.js（ESM）
- OpenAI 兼容 SDK（可对接 DeepSeek、OpenAI 等）

## 🚀 使用

### 构建

```bash
npm run build
```

### 运行

```bash
npm start -- -prompt "帮我看看这个项目结构"
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
