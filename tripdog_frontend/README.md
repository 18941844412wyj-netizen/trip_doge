# TripDoge 语音助手前端

这是一个基于 Next.js 构建的语音助手应用，具有语音识别和语音合成功能。

## 功能特性

- 语音识别（Speech-to-Text）：将用户的语音转换为文本
- AI 对话：与 AI 模型进行自然语言对话
- 语音合成（Text-to-Speech）：将 AI 回复转换为语音播放
- 实时流式响应：支持流式数据显示和播放
- 对话历史记录：保存和查看历史对话

## 技术栈

- [Next.js 15](https://nextjs.org) - React 框架
- [React 19](https://react.dev) - UI 库
- [@lobehub/tts](https://github.com/lobehub/lobe-tts) - 语音识别和合成库
- [Tailwind CSS](https://tailwindcss.com) - CSS 框架
- [Ant Design](https://ant.design) - UI 组件库
- [TypeScript](https://www.typescriptlang.org) - JavaScript 超集

## 环境要求

- Node.js 18.17 或更高版本
- npm、yarn、pnpm 或 bun 包管理器

## 开始使用

首先，安装依赖：

```bash
npm install
# 或
yarn install
# 或
pnpm install
# 或
bun install
```

然后，运行开发服务器：

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
# 或
bun dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 配置

应用需要以下环境变量：

- `NEXT_PUBLIC_OPENAI_API_KEY` - DeepSeek API 密钥
- `NEXT_PUBLIC_OPENAI_PROXY_URL` - API 代理地址（可选，默认为 DeepSeek 官方地址）

## 部署

使用 Vercel 部署是最简单的方式：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/tripdoge)

你也可以参考 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying) 了解更多部署选项。

## 学习资源

- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 特性和 API
- [Learn Next.js](https://nextjs.org/learn) - Next.js 交互式教程
- [GitHub 仓库](https://github.com/vercel/next.js) - 欢迎反馈和贡献
