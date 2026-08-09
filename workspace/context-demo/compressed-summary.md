## 用户目标
依次读取 `context-demo/large-context.txt` 演示文件的第 1 至第 12 段。

## 约束与关键决定
- 通过 `read_file` 工具读取文件 `context-demo/large-context.txt`。
- 每次请求对应一个段落，段落编号从 1 递增到 12。

## 已完成
- 已成功读取第 1 至第 12 段，每段内容格式为 `# 演示片段 N`，正文为大量重复的 `context demo block N` 文本。
- 助手已逐一确认“已经读取第 N 段”。

## 当前问题
- 无未解决问题。

## 已读取或修改的文件
- `context-demo/large-context.txt`（仅读取，未修改）

## 下一步
- 等待用户指示是否继续读取更多段落，或执行其他任务。