# Demo 03：让它做完一步，再判断下一步

这是第三阶段：让 Agent 通过多轮循环自主决定下一步工具调用。

## 配置

打开当前目录下的 `provider.json`，填写自己的 API Key；`baseURL` 和 `model` 也可以按实际使用的模型服务调整。这个文件只是模板，填好后不要把包含真实 API Key 的版本再次分享。

## 运行

```bash
npm install
npm run build
npm run start -- -prompt "先读 README.md，再看看 package.json，告诉我这个项目怎么启动"
```

## 现场重点

观察两轮 `read_file`。程序把第一轮的真实结果放回消息，模型再决定是否读取第二个文件，直到信息足够后回答。

## 下一阶段

工具从一个变成四个以后，Agent 循环还要不要认识每个工具的实现细节？下一阶段进入 `04-tool-registry`，展示 Registry 和多工具边界。
