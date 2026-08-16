# Demo 05：会话记忆与上下文压缩

这是第五阶段：用 `Session` 保存进程内的完整对话历史，再由 `Compactor` 为每轮请求构造受控的工作记忆。

## 运行

```bash
cd /Users/xuzhenxin/Documents/harness工程/powercode/demos/05-session-compaction
npm run build
npm start
```

连续输入几轮问题，可以观察同一进程中的上下文记忆。

## 观察压缩过程

```bash
node dist/demo-compaction.js
```

脚本会在当前 Demo 的 `workspace/context-demo` 中生成压缩前上下文、压缩后上下文和摘要文件。

## 现场重点

- `Session` 保存完整消息历史和 Token 用量。
- `Compactor` 只改变本轮发送给模型的工作记忆，不删除原始历史。
- 进程退出后内存会话仍会消失；跨进程任务状态留给下一阶段解决。
