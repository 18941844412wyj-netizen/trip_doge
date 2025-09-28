# TripDoge 语音助手前端

这是一个基于 Next.js 构建的语音助手应用，具有语音识别和语音合成功能。

## 功能特性

- 语音识别（Speech-to-Text）：将用户的语音转换为文本
- AI 对话：与 AI 模型进行自然语言对话
- 语音合成（Text-to-Speech）：将 AI 回复转换为语音播放
- 实时流式响应：支持流式数据显示和播放
- 对话历史记录：保存和查看历史对话
- 角色选择：多种 AI 角色可供选择
- 用户认证：支持登录和注册功能

## 技术栈

- [Next.js 15](https://nextjs.org) - React 框架
- [React 19](https://react.dev) - UI 库
- [@lobehub/tts](https://github.com/lobehub/lobe-tts) - 语音识别和合成库
- [Tailwind CSS](https://tailwindcss.com) - CSS 框架
- [Ant Design](https://ant.design) - UI 组件库
- [TypeScript](https://www.typescriptlang.org) - JavaScript 超集
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown 渲染组件

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

- `NEXT_PUBLIC_API_BASE_URL` - 后端 API 基础地址（可选，默认为 http://localhost:7979）
- `DASHSCOPE_API_KEY` - 阿里云 DashScope API 密钥（用于语音合成）

### 环境变量配置方法

1. 在项目根目录下创建 `.env.local` 文件
2. 在文件中添加所需的环境变量，例如：

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
DASHSCOPE_API_KEY=your_dashscope_api_key
```

3. 重启开发服务器使配置生效

注意：
- 以 `NEXT_PUBLIC_` 开头的环境变量会在构建时嵌入到浏览器端代码中
- 不要将敏感信息（如 `DASHSCOPE_API_KEY`）暴露给客户端，它只在服务端使用
- `.env.local` 文件应该加入 `.gitignore` 中，避免提交到代码仓库

## 部署

使用 Vercel 部署是最简单的方式：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/tripdoge)

你也可以参考 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying) 了解更多部署选项。

## 项目结构

```
app/
  ├── (routes)/           # 页面路由
  │   ├── characters/     # 角色选择页面
  │   ├── chat/           # 聊天主页面
  │   ├── files/          # 文件管理页面
  │   ├── history/        # 历史记录页面
  │   ├── login/          # 登录页面
  │   ├── settings/       # 设置页面
  │   └── signup/         # 注册页面
  ├── api/                # API 路由
  │   ├── qwen-tts/       # 通义千问语音合成 API
  │   ├── qwen-tts-realtime/ # 通义千问实时语音合成 API
  │   └── qwen-tts-stream/   # 通义千问流式语音合成 API
  └── ...
components/               # React 组件
  ├── characters/         # 角色相关组件
  ├── chat/               # 聊天相关组件
  └── ...
services/                 # 业务逻辑和服务
stores/                   # 状态管理
types/                    # TypeScript 类型定义
__tests__/                # 测试文件
```

## 测试

本项目使用 Jest 和 React Testing Library 进行测试。

### 测试目录结构

```
__tests__/
├── app/          # 页面组件测试
├── components/   # 可复用组件测试
├── contexts/     # Context测试
├── services/     # 服务层测试
└── stores/       # 状态管理测试
```

### 运行测试

运行所有测试：
```bash
npm run test
```

以监听模式运行测试：
```bash
npm run test:watch
```

生成测试覆盖率报告：
```bash
npm run test -- --coverage
```

### 测试工具

- [Jest](https://jestjs.io/) - JavaScript测试框架
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - React组件测试工具
- [Jest DOM](https://github.com/testing-library/jest-dom) - DOM元素断言扩展

## 学习资源

- [Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 特性和 API
- [Learn Next.js](https://nextjs.org/learn) - Next.js 交互式教程
- [GitHub 仓库](https://github.com/vercel/next.js) - 欢迎反馈和贡献