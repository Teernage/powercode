# Demo 01：先让它跑起来

这是第一阶段：先完成一次基础对话。

## 配置

打开当前目录下的 `provider.json`，填写自己的 API Key；`baseURL` 和 `model` 也可以按实际使用的模型服务调整。这个文件只是模板，填好后不要把包含真实 API Key 的版本再次分享。

## 运行

```bash
npm install
npm run build
npm run start -- -prompt "用一句话解释什么是 TypeScript"
```

## 现场重点

这时只有一次模型请求。它会回答问题，但还看不到项目文件，也不能执行任何工具。

## 下一阶段

如果让它解释当前项目，它凭什么知道项目里的真实内容？下一步给它一只手——`read_file`。
