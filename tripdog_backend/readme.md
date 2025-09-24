# TripDog Backend

基于 Spring Boot 3 + JDK 17 + Maven 的后端项目

## 技术栈

- **Java**: 17
- **Spring Boot**: 3.1.4
- **数据库**: MySQL (生产环境) / H2 (测试环境)
- **构建工具**: Maven
- **主要依赖**:
  - Spring Boot Web
  - Spring Boot Data JPA
  - Spring Boot Security
  - Spring Boot Validation
  - Lombok
  - MySQL Connector

## 项目结构

```
src/
├── main/
│   ├── java/com/tripdog/
│   │   ├── TripdogBackendApplication.java    # 主启动类
│   │   ├── controller/                       # 控制器层
│   │   │   └── HealthController.java
│   │   ├── service/                          # 服务层
│   │   │   └── UserService.java
│   │   ├── repository/                       # 数据访问层
│   │   │   └── UserRepository.java
│   │   ├── entity/                           # 实体类
│   │   │   └── User.java
│   │   ├── dto/                              # 数据传输对象
│   │   │   ├── UserCreateDto.java
│   │   │   └── UserResponseDto.java
│   │   ├── config/                           # 配置类
│   │   │   └── SecurityConfig.java
│   │   └── exception/                        # 异常处理
│   │       └── GlobalExceptionHandler.java
│   └── resources/
│       └── application.properties            # 应用配置
└── test/
    ├── java/com/tripdog/
    │   ├── TripdogBackendApplicationTests.java
    │   └── controller/
    │       └── HealthControllerTest.java
    └── resources/
        └── application-test.properties       # 测试环境配置
```

## 快速开始

### 前置要求

- JDK 17
- Maven 3.6+
- MySQL 8.0+ (生产环境)

### 运行应用

1. 克隆项目到本地
2. 配置数据库连接 (修改 `application.properties`)
3. 运行应用:

```bash
mvn spring-boot:run
```

4. 访问健康检查接口: http://localhost:8080/api/health

### 运行测试

```bash
mvn test
```

## 配置说明

- **生产环境**: 使用 MySQL 数据库，配置在 `application.properties`
- **测试环境**: 使用 H2 内存数据库，配置在 `application-test.properties`

## API 接口

- `GET /api/health` - 健康检查接口

## 开发规范

- 使用 Lombok 减少样板代码
- 统一异常处理
- 分层架构: Controller -> Service -> Repository -> Entity
- 使用 DTO 进行数据传输
- 单元测试覆盖
