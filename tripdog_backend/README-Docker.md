# TripDog Backend - Docker 部署

这是TripDog旅行伴侣的后端服务，基于Spring Boot 3.3.2开发，支持Docker容器化部署。

## 🚀 快速开始

### 一键部署
```bash
# 克隆项目
git clone <your-repo-url>
cd tripdog_backend

# 给部署脚本执行权限
chmod +x deploy.sh

# 一键部署
./deploy.sh
```

### 服务访问
部署完成后，可以通过以下地址访问服务：
- **API服务**: http://localhost:7979
- **健康检查**: http://localhost:7979/actuator/health
- **API文档**: 查看 `docs/API接口文档.md`

## 📁 项目结构

```
tripdog_backend/
├── src/                          # 源代码目录
├── docs/                         # 文档目录
│   ├── API接口文档.md            # API接口文档
│   └── Docker部署指南.md         # 详细部署指南
├── sql/                          # 数据库初始化脚本
│   └── init.sql                  # 数据库表结构和初始数据
├── Dockerfile                    # Docker镜像构建文件
├── docker-compose.yml           # Docker Compose配置
├── .dockerignore                # Docker构建忽略文件
├── deploy.sh                    # 一键部署脚本
└── README-Docker.md             # 本文件
```

## 🐳 Docker 组件

### 服务组件
- **app**: Spring Boot应用服务
- **mysql**: MySQL 8.0 数据库

### 端口映射
- `7979`: Spring Boot应用
- `3306`: MySQL数据库

### 数据卷
- `mysql_data`: MySQL数据持久化
- `app_logs`: 应用日志存储

## 🛠 常用命令

### 部署管理
```bash
./deploy.sh          # 完整部署
./deploy.sh logs     # 查看实时日志
./deploy.sh status   # 查看服务状态
./deploy.sh restart  # 重启所有服务
./deploy.sh stop     # 停止所有服务
```

### Docker Compose
```bash
docker-compose ps              # 查看服务状态
docker-compose logs -f         # 查看所有日志
docker-compose logs -f app     # 查看应用日志
docker-compose restart app     # 重启应用服务
docker-compose down            # 停止所有服务
docker-compose up -d --build   # 重新构建并启动
```

## ⚙️ 配置说明

### 环境变量
主要的环境变量配置（在docker-compose.yml中）：

```yaml
# 数据库配置
SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/tripdog?...
SPRING_DATASOURCE_USERNAME: tripdog
SPRING_DATASOURCE_PASSWORD: tripdog123456

# 应用配置
SPRING_PROFILES_ACTIVE: prod
SERVER_PORT: 7979
```

### 自定义配置
推荐使用环境变量进行配置：

```bash
# 1. 复制环境变量模板
cp .env.example .env

# 2. 编辑配置文件
vi .env

# 3. 重新部署应用
./deploy.sh
```

也可以通过以下方式配置：
1. 直接设置系统环境变量
2. 编辑 `docker-compose.yml` 中的默认值
3. 修改 `src/main/resources/application-prod.yml`

## 📊 监控和日志

### 健康检查
```bash
# 检查服务健康状态
curl http://localhost:7979/actuator/health

# 查看应用信息
curl http://localhost:7979/actuator/info
```

### 日志查看
```bash
# 实时查看应用日志
docker-compose logs -f app

# 查看容器内日志文件
docker-compose exec app tail -f /app/logs/tripdog-backend.log

# 查看MySQL日志
docker-compose logs -f mysql
```

## 🔧 故障排除

### 常见问题

#### 端口被占用
```bash
# 检查端口占用
netstat -tuln | grep :7979
lsof -i :7979

# 修改docker-compose.yml中的端口映射
```

#### 数据库连接失败
```bash
# 检查MySQL容器状态
docker-compose logs mysql

# 手动连接测试
docker-compose exec mysql mysql -u tripdog -p
```

#### 应用启动失败
```bash
# 查看详细启动日志
docker-compose logs app

# 进入容器调试
docker-compose exec app bash
```

### 重置环境
```bash
# 完全重置（会删除所有数据）
docker-compose down -v
docker system prune -a
./deploy.sh
```

## 🚀 生产环境部署

### 安全建议
1. **修改默认密码**: 更改MySQL的默认密码
2. **使用HTTPS**: 配置反向代理（Nginx）启用SSL
3. **防火墙配置**: 只开放必要的端口
4. **定期备份**: 设置数据库自动备份

### 性能优化
1. **资源限制**: 在docker-compose.yml中配置内存和CPU限制
2. **JVM调优**: 修改JAVA_OPTS环境变量
3. **数据库优化**: 调整MySQL配置参数
4. **监控告警**: 集成Prometheus + Grafana

### 扩展部署
- **负载均衡**: 使用Nginx进行负载均衡
- **集群部署**: 使用Docker Swarm或Kubernetes
- **外部数据库**: 连接到外部MySQL集群

## 📚 相关文档

- [API接口文档](docs/API接口文档.md) - 完整的API接口说明
- [Docker部署指南](docs/Docker部署指南.md) - 详细的部署指南
- [Spring Boot官方文档](https://spring.io/projects/spring-boot)
- [Docker官方文档](https://docs.docker.com/)

## 🆘 技术支持

如遇到问题，请按以下步骤排查：
1. 查看服务状态：`docker-compose ps`
2. 查看应用日志：`docker-compose logs -f app`
3. 检查系统资源：`free -h` 和 `df -h`
4. 查看错误日志：容器内的 `/app/logs/` 目录

---

**版本**: 1.0.0
**更新时间**: 2025年9月25日
**技术栈**: Spring Boot 3.3.2 + MySQL 8.0 + Docker
