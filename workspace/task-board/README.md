# 小型待办演示

一个可直接运行的 CLI 待办程序，基于 TypeScript + Node.js `readline` 实现，无第三方运行时依赖，数据保存在内存中（演示用途）。

## 运行方式

```bash
# 1. 安装依赖
npm install

# 2. 直接运行（推荐，tsx 零配置）
npm start

# 备选：先编译为 JS 再运行（不依赖 tsx）
npm run build && npm run run:js
```

## 命令说明

| 命令 | 说明 |
| --- | --- |
| `add <内容>` / `+ <内容>` | 添加一条待办 |
| `list` / `ls` | 列出全部待办（带编号与完成状态 ✓/✗） |
| `done <编号>` | 标记完成 |
| `undo <编号>` | 取消完成 |
| `remove <编号>` / `del <编号>` | 删除待办 |
| `clear` | 清空全部待办 |
| `help` | 显示命令帮助 |
| `quit` / `exit` | 退出程序 |

## 示例

```bash
$ npm start
>>> add 写周报
>>> list
>>> done 1
>>> quit
```

## 非交互验证

支持管道输入，便于脚本测试：

```bash
printf 'add 测试\nlist\nexit\n' | npm start
```
