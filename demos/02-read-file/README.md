# Demo 02：给大模型装上第一只手

这是第二阶段：让 Agent 通过 `read_file` 获取项目中的真实文件内容。

## 配置

打开当前目录下的 `provider.json`，填写自己的 API Key；`baseURL` 和 `model` 也可以按实际使用的模型服务调整。这个文件只是模板，填好后不要把包含真实 API Key 的版本再次分享。

## 运行

```bash
npm install
npm run build
npm run start -- -prompt "帮我读一下 README.md，这个项目是做什么的？"
```

## 现场重点

先看 `AI 想读文件：...`，再看程序读取文件，最后把内容交回模型。重点不是最终答案，而是模型没有凭空猜，而是申请了 `read_file`。

## 下一阶段

如果 README 里的信息不够，还需要看 `package.json`，程序能不能让模型自己决定继续查？下一步进入 Agent Loop。
