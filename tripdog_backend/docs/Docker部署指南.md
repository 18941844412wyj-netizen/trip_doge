# TripDog Backend Docker 部署指南

## 环境要求

### 系统要求
- Linux服务器（Ubuntu 20.04+ / CentOS 7+ / RHEL 8+）
- 至少 2GB RAM
- 至少 10GB 可用磁盘空间
- Docker 20.10+
- Docker Compose 2.0+

### 端口要求
确保以下端口未被占用：
- `3306` - MySQL数据库
- `7979` - Spring Boot应用

## 快速部署

### 1. 准备服务器环境

#### 安装Docker（Ubuntu/Debian）
```bash
# 更新包索引
sudo apt update

# 安装依赖
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# 添加Docker GPG密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加Docker仓库
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到docker组
sudo usermod -aG docker $USER
```

#### 安装Docker（CentOS/RHEL）
```bash
# 安装依赖
sudo yum install -y yum-utils

# 添加Docker仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到docker组
sudo usermod -aG docker $USER
```

### 2. 部署应用

#### 上传项目文件
将项目文件上传到服务器，推荐目录：`/opt/tripdog-backend`

```bash
# 创建部署目录
sudo mkdir -p /opt/tripdog-backend
sudo chown $USER:$USER /opt/tripdog-backend
cd /opt/tripdog-backend

# 上传项目文件（可使用scp、rsync或git clone）
# 例如使用git：
git clone <your-repo-url> .
```

#### 配置环境变量（推荐）
复制环境变量模板并自定义配置：

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量文件
vi .env
```

`.env` 文件内容示例：
```bash
# 数据库配置
MYSQL_ROOT_PASSWORD=your_secure_password
MYSQL_DATABASE=trip_dog
MYSQL_USERNAME=root
MYSQL_PASSWORD=your_secure_password

# 邮件配置
MAIL_HOST=smtp.qq.com
MAIL_PORT=465
MAIL_USERNAME=your-email@qq.com
MAIL_PASSWORD=your-app-password

# 应用配置
SERVER_PORT=7979
SPRING_PROFILES_ACTIVE=prod
```

#### 执行部署
```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

## 部署脚本使用说明

### 基本命令
```bash
# 完整部署（构建镜像并启动所有服务）
./deploy.sh

# 查看实时日志
./deploy.sh logs

# 查看服务状态
./deploy.sh status

# 重启所有服务
./deploy.sh restart

# 停止所有服务
./deploy.sh stop
```

### Docker Compose 命令
```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
docker-compose logs -f app    # 只查看应用日志
docker-compose logs -f mysql  # 只查看MySQL日志

# 重启服务
docker-compose restart
docker-compose restart app    # 只重启应用

# 停止服务
docker-compose down

# 启动服务
docker-compose up -d

# 重新构建并启动
docker-compose up -d --build
```

## 配置说明

### 环境变量配置
在 `docker-compose.yml` 中可以通过环境变量配置以下参数：

#### 数据库配置
- `SPRING_DATASOURCE_URL` - 数据库连接URL
- `SPRING_DATASOURCE_USERNAME` - 数据库用户名
- `SPRING_DATASOURCE_PASSWORD` - 数据库密码

#### 邮件配置
- `MAIL_HOST` - SMTP服务器地址
- `MAIL_PORT` - SMTP端口
- `MAIL_USERNAME` - 邮箱用户名
- `MAIL_PASSWORD` - 邮箱密码（应用专用密码）

### 生产环境优化建议

#### 1. 安全配置
```bash
# 修改默认密码
# 编辑 docker-compose.yml，修改以下密码：
- MYSQL_ROOT_PASSWORD
- MYSQL_PASSWORD
```

#### 2. 资源限制
在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

#### 3. 数据持久化
确保重要数据目录已配置卷挂载：
- MySQL数据：`mysql_data`
- 应用日志：`app_logs`

#### 4. 备份策略
```bash
# 创建数据库备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD tripdog > backup_${DATE}.sql
EOF

chmod +x backup.sh

# 设置定时备份（可选）
# crontab -e
# 0 2 * * * /opt/tripdog-backend/backup.sh
```

## 监控和日志

### 健康检查
- 应用健康检查：`http://your-server:7979/actuator/health`
- 服务状态检查：`docker-compose ps`

### 日志管理
```bash
# 查看应用日志
docker-compose logs -f app

# 查看日志文件（容器内）
docker-compose exec app tail -f /app/logs/tripdog-backend.log

# 日志轮转配置已在logback中设置：
# - 单文件最大100MB
# - 保留30天历史日志
```

### 性能监控
- 使用 `docker stats` 查看容器资源使用情况
- 通过 Actuator 端点获取应用指标：
  - `/actuator/health` - 健康状态
  - `/actuator/info` - 应用信息
  - `/actuator/metrics` - 应用指标

## 故障排除

### 常见问题

#### 1. Docker镜像拉取失败
```bash
# 运行网络诊断脚本
chmod +x fix-docker-network.sh
./fix-docker-network.sh

# 或者手动配置Docker镜像加速器
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker

# 使用备用Dockerfile
cp Dockerfile.backup Dockerfile
./deploy.sh
```

#### 2. 端口占用
```bash
# 检查端口占用
netstat -tuln | grep :7979
lsof -i :7979

# 停止占用端口的服务
sudo systemctl stop <service-name>
```

#### 2. 数据库连接失败
```bash
# 检查MySQL容器状态
docker-compose logs mysql

# 手动连接测试
docker-compose exec mysql mysql -u tripdog -p
```

#### 3. 应用启动失败
```bash
# 查看应用日志
docker-compose logs app

# 进入容器调试
docker-compose exec app bash
```

#### 4. 内存不足
```bash
# 查看系统资源
free -h
df -h

# 清理Docker资源
docker system prune -a
```

### 重置部署
如果需要完全重置环境：

```bash
# 停止并删除所有容器
docker-compose down -v

# 删除相关镜像
docker rmi tripdog/backend:latest

# 清理数据卷（注意：这会删除所有数据）
docker volume prune

# 重新部署
./deploy.sh
```

## 更新部署

### 代码更新
```bash
# 拉取最新代码
git pull origin main

# 重新构建并部署
docker-compose down
docker-compose up -d --build
```

### 版本回滚
```bash
# 查看镜像历史
docker images tripdog/backend

# 使用特定版本
docker-compose down
docker tag tripdog/backend:latest tripdog/backend:backup
# 恢复到之前的版本...
```

## 技术支持

如有问题，请检查：
1. 系统日志：`journalctl -u docker`
2. 容器日志：`docker-compose logs`
3. 应用日志：`/app/logs/tripdog-backend.log`

更多技术细节请参考：
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
