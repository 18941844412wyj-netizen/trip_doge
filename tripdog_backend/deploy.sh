#!/bin/bash

# TripDog Backend 部署脚本
# 使用方法：chmod +x deploy.sh && ./deploy.sh

set -e

echo "========================================="
echo "      TripDog Backend 部署脚本"
echo "========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 函数：打印信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 处理命令行参数 - 环境profile
PROFILE_ARG=""
for arg in "$@"; do
    case $arg in
        --profile=*)
            PROFILE_ARG="${arg#*=}"
            export SPRING_PROFILES_ACTIVE="$PROFILE_ARG"
            print_info "设置Spring Profile为: $PROFILE_ARG"
            shift
            ;;
        prod)
            export SPRING_PROFILES_ACTIVE="ai,prod"
            print_info "设置Spring Profile为: ai,prod (生产环境)"
            shift
            ;;
        dev)
            export SPRING_PROFILES_ACTIVE="ai"
            print_info "设置Spring Profile为: ai (开发模式)"
            shift
            ;;
    esac
done

# 加载环境变量 - 根据profile选择配置文件
if [[ "$SPRING_PROFILES_ACTIVE" == "ai" ]] && [ -f "env-vars-dev.sh" ]; then
    print_info "加载开发环境配置..."
    source env-vars-dev.sh
elif [[ "$SPRING_PROFILES_ACTIVE" == *"prod"* ]] && [ -f "env-vars.sh" ]; then
    print_info "加载生产环境配置..."
    source env-vars.sh
elif [ -f ".env" ]; then
    print_info "加载 .env 文件..."
    export $(grep -v '^#' .env | xargs)
else
    print_warning "未找到环境变量配置文件，使用默认配置"
fi

# 如果没有通过参数设置profile，则使用环境变量默认值
export SPRING_PROFILES_ACTIVE="${SPRING_PROFILES_ACTIVE:-ai,prod}"
print_info "当前Spring Profile: $SPRING_PROFILES_ACTIVE"

# 项目配置（可以被环境变量覆盖）
PROJECT_NAME="${PROJECT_NAME:-tripdog-backend}"
DOCKER_IMAGE_NAME="${DOCKER_IMAGE_NAME:-tripdog/backend}"
DOCKER_CONTAINER_NAME="${DOCKER_CONTAINER_NAME:-tripdog-backend}"

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi

    print_info "Docker环境检查通过"
}

# 创建必要的目录
create_directories() {
    print_info "创建必要的目录..."
    mkdir -p logs
    mkdir -p sql
    print_info "目录创建完成"
}

# 检查端口是否被占用
check_ports() {
    local mysql_port=${MYSQL_PORT:-3306}
    local app_port=${APP_PORT:-7979}
    local ports=($mysql_port $app_port)

    for port in "${ports[@]}"; do
        if netstat -tuln | grep ":$port " > /dev/null 2>&1; then
            print_warning "端口 $port 已被占用，请确保相关服务已停止或修改端口配置"
        fi
    done
}

# 构建Docker镜像
build_image() {
    print_info "开始构建Docker镜像..."
    docker build -t ${DOCKER_IMAGE_NAME}:latest .
    print_info "Docker镜像构建完成"
}

# 停止旧容器
stop_containers() {
    print_info "停止现有容器..."
    docker-compose down 2>/dev/null || true
    print_info "容器停止完成"
}

# 启动服务
start_services() {
    print_info "启动服务..."
    docker-compose up -d
    print_info "服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_info "等待服务启动..."

    # 等待MySQL就绪
    print_info "等待MySQL服务就绪..."
    local mysql_ready=false
    for i in {1..30}; do
        if docker-compose exec mysql mysqladmin ping -h"localhost" --silent; then
            mysql_ready=true
            break
        fi
        echo -n "."
        sleep 2
    done

    if [ "$mysql_ready" = true ]; then
        print_info "MySQL服务已就绪"
    else
        print_warning "MySQL服务启动超时，请检查日志"
    fi

    # 等待应用就绪
    print_info "等待应用服务就绪..."
    local app_port=${APP_PORT:-7979}
    local app_ready=false
    for i in {1..60}; do
        if curl -f http://localhost:${app_port}/actuator/health > /dev/null 2>&1; then
            app_ready=true
            break
        fi
        echo -n "."
        sleep 3
    done

    if [ "$app_ready" = true ]; then
        print_info "应用服务已就绪"
    else
        print_warning "应用服务启动超时，请检查日志"
    fi
}

# 显示部署状态
show_status() {
    echo ""
    print_info "========== 部署状态 =========="
    docker-compose ps
    echo ""
    print_info "========== 服务访问地址 =========="
    local app_port=${APP_PORT:-7979}
    local mysql_port=${MYSQL_PORT:-3306}
    echo "应用服务: http://localhost:${app_port}"
    echo "健康检查: http://localhost:${app_port}/actuator/health"
    echo "MySQL: localhost:${mysql_port}"
    echo ""
    print_info "========== 常用命令 =========="
    echo "查看日志: docker-compose logs -f"
    echo "查看应用日志: docker-compose logs -f app"
    echo "重启服务: docker-compose restart"
    echo "停止服务: docker-compose down"
    echo ""
}

# 主函数
main() {
    print_info "开始部署 ${PROJECT_NAME}..."

    # 检查环境
    check_docker
    check_ports

    # 创建目录
    create_directories

    # 停止旧容器
    stop_containers

    # 构建镜像
    build_image

    # 启动服务
    start_services

    # 等待服务就绪
    wait_for_services

    # 显示状态
    show_status

    print_info "部署完成！"
}

# 处理命令参数
case "${1:-deploy}" in
    logs)
        docker-compose logs -f
        ;;
    stop)
        print_info "停止所有服务..."
        docker-compose down
        print_info "服务已停止"
        ;;
    restart)
        print_info "重启所有服务..."
        docker-compose restart
        print_info "服务已重启"
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        echo "TripDog Backend 部署脚本使用说明："
        echo ""
        echo "基本命令："
        echo "  ./deploy.sh              - 执行完整部署 (默认prod环境)"
        echo "  ./deploy.sh prod         - 执行生产环境部署"
        echo "  ./deploy.sh dev          - 执行开发环境部署 (ai profile)"
        echo "  ./deploy.sh --profile=ai - 指定特定的Spring Profile"
        echo ""
        echo "管理命令："
        echo "  ./deploy.sh logs         - 查看实时日志"
        echo "  ./deploy.sh stop         - 停止所有服务"
        echo "  ./deploy.sh restart      - 重启所有服务"
        echo "  ./deploy.sh status       - 查看服务状态"
        echo ""
        echo "环境变量："
        echo "  配置文件: env-vars.sh 或 .env"
        echo "  当前Profile: ${SPRING_PROFILES_ACTIVE:-ai,prod}"
        echo ""
        ;;
    deploy|prod|dev|--profile=*)
        # 执行主函数
        main
        ;;
    *)
        print_warning "未知参数: $1"
        print_info "使用 './deploy.sh help' 查看帮助信息"
        exit 1
        ;;
esac
