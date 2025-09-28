# TripDoge

轻量、可扩展的 AI 虚拟角色平台。该项目由前端、后端、产品协作开发，目标是提供：多角色对话、文档检索增强问答、语音交互与养成体系的完整样例工程。

本仓库包含前端（Next.js）、后端（Spring Boot）、以及运维/配置文件，方便本地开发与部署。

---

## 目录简介

- `tripdog_frontend/` — 前端 (Next.js + TypeScript)
- `tripdog_backend/` — 后端 (Spring Boot)
- `tripdog_design/` — 产品需求、演示脚本、验收标准
- `config/` — MySQL / Redis / MinIO 等配置样例
- `docs/` — 项目文档与演示视频（包含 `docs/trip_doge-pm.mp4`）

更多细节请查看各子目录下的 README。
更多细节请查看各子目录下的 README（若存在）：

- [tripdog_frontend/README.md](tripdog_frontend/README.md) — 前端说明与快速启动
- [tripdog_frontend/__tests__/README.md](tripdog_frontend/__tests__/README.md) — 前端测试说明
- [tripdog_backend/README.md](tripdog_backend/README.md) — 后端说明与构建指南

如果你希望我为每个子模块生成更详细的 README 摘要（例如自动摘取首段作为简介），我可以把摘要添加在每个链接下。

---

## 快速开始（开发环境）

以下步骤假设你在 Windows / macOS / Linux 上已经安装好 Git、Docker、Node.js 与 JDK。

1. 克隆仓库

```powershell
git clone https://github.com/18941844412wyj-netizen/trip_doge.git
cd trip_doge
```

2. 启动依赖服务（推荐使用 Docker Compose）

```powershell
docker-compose up -d
```

3. 启动后端

```powershell
cd tripdog_backend
mvn -U clean package -DskipTests
mvn spring-boot:run
```

默认后端地址示例： http://localhost:7979（端口以配置为准）

4. 启动前端

```powershell
cd ..\tripdog_frontend
npm install
npm run dev
```

打开浏览器访问 http://localhost:3000

---

## 环境与配置

- JDK 17+
- Maven 3.8+
- Node.js 18+
- Docker & Docker Compose

常用配置位置：
- 后端 Spring 配置：`tripdog_backend/src/main/resources/application*.yml`
- 前端环境：`tripdog_frontend/.env.local`（示例请参考前端 README）
- 数据初始化：`sql/init.sql`

建议把敏感配置（API Key、数据库密码等）放入环境变量或 CI Secrets，不要提交到仓库。

---

## 源代码指引（快速定位）

- 后端
  - 启动类：`tripdog_backend/src/main/java/com/tripdog/TripdogBackendApplication.java`
  - 控制层：`com.tripdog.controller`
  - 服务层：`com.tripdog.service`
  - 仓储/持久层：`com.tripdog.repository`
  - 常用文档：`tripdog_backend/docs/TripDoge功能模块.md`、`tripdog_backend/docs/TripDoge项目启动配置说明.md`

- 前端
  - 入口：`tripdog_frontend/app`（App Router）
  - 关键组件：`tripdog_frontend/components/chat/VoiceChat.tsx`、`tripdog_frontend/components/characters/Characters.tsx`

---

## 架构设计与模块规格

整体设计为前端（UI）→ 后端（业务 + 向量检索/模型中间层）→ 模型/向量库 的三层协作结构。

主要模块说明：

1. 用户管理 (User)
	- 功能：注册、登录、JWT/Token 鉴权、用户资料管理
	- 存储：MySQL

2. 对话引擎 (Chat)
	- 功能：多轮对话、SSE/流式响应、角色切换、上下文管理
	- 要点：上下文窗口、速率/并发控制、对话持久化

3. 文档管理与向量检索 (Doc)
	- 功能：文件上传（MinIO）、文本提取、分块/向量化、检索
	- 存储：MinIO + 向量库（Postgres+pgvector 或 Milvus/Weaviate）

4. 角色与养成系统 (Role)
	- 功能：角色配置、亲密度/养成参数决定对话风格与模型参数

非功能需求：鉴权、安全（上传/下载策略）、可扩展的检索后端、日志与监控

---

## 团队与分工（参考）

- 前端：UI/交互、语音/音频、路由与状态管理（Next.js）
- 后端：接口设计、业务逻辑、向量化流水线、数据库与部署（Spring Boot）
- 产品/设计：需求、演示脚本、验收标准

注：实际分工请参考项目内 `tripdog_design/` 文档。

---

## 演示视频与产品文档

- 演示视频（仓库内）： `docs/trip_doge-pm.mp4`
- 产品需求： `tripdog_design/Product requirements document_pm.md`
- 演示脚本/分镜： `tripdog_design/视频demo.md`

---

## 开发规范与贡献

欢迎贡献！建议流程：

1. Fork 仓库 → 创建功能分支（feature/xxx）
2. 提交 PR，确保包含描述与复现步骤
3. CI 会运行单元测试（若启用）

代码风格、提交规范与 CI 配置可根据团队偏好补充到项目根目录。

---

## 常见问题（Troubleshooting）

- 后端启动失败：检查数据库连接字符串、端口占用、以及 Docker 容器状态
- 前端无法调用后端：确认前端环境变量中后端地址是否正确，或检查浏览器控制台的 CORS 错误

---

## 许可证

该仓库默认使用 MIT 许可证。

---