#!/bin/bash
# TripDog 环境变量配置脚本
# 在部署脚本中执行: source env-vars.sh

# 数据库配置
export MYSQL_ROOT_PASSWORD=123123
export MYSQL_DATABASE=trip_dog
export MYSQL_USERNAME=root
export MYSQL_PASSWORD=123123

# 邮件配置
export MAIL_HOST=smtp.qq.com
export MAIL_PORT=465
export MAIL_USERNAME=2023321332@qq.com
export MAIL_PASSWORD=slxmzmxmmwyvcejf

# 应用配置
export SERVER_PORT=7979
export SPRING_PROFILES_ACTIVE=ai,prod

# 端口映射配置
export MYSQL_PORT=3306
export APP_PORT=7979
export DASHSCOPE_API_KEY=sk-1d5e7f37d77f405a87108fc3b2a876fa

# JVM配置
export JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

# 打印配置信息
echo "✅ 环境变量已设置完成"
echo "🐕 TripDog 生产环境配置:"
echo "   - 数据库: ${MYSQL_DATABASE} (端口: ${MYSQL_PORT})"
echo "   - 应用端口: ${APP_PORT}"