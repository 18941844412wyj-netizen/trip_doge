# TripDog Backend API 接口文档

## 基础信息

- **服务器地址**: `http://localhost:7979`
- **API前缀**: `/api`
- **完整基础URL**: `http://localhost:7979/api`
- **版本**: v1.0.0
- **更新时间**: 2025年9月24日

## 通用响应格式

所有接口都返回统一的响应格式：

```json
{
  "code": 0,           // 状态码：0-成功，非0-失败
  "message": "success", // 响应消息
  "data": {}           // 响应数据，具体结构见各接口说明
}
```

---

## 1. 用户模块 `/api/user`

### 1.1 用户注册

- **接口地址**: `POST /api/user/register`
- **接口描述**: 用户通过邮箱注册账号
- **是否需要登录**: 否
- **请求头**: `Content-Type: application/json`

**请求参数**:

```json
{
  "email": "test@example.com",     // string, 邮箱地址，必填，需符合邮箱格式
  "password": "123456",            // string, 密码，必填
  "nickname": "测试用户",           // string, 昵称，必填
  "code": "123456"                // string, 邮箱验证码，必填
}
```

**响应数据**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,                                    // number, 用户ID
    "email": "test@example.com",                // string, 邮箱地址
    "nickname": "测试用户",                      // string, 昵称
    "avatarUrl": "http://example.com/avatar.jpg", // string, 头像URL
    "status": 1                                 // number, 状态：1-激活，0-禁用
  }
}
```

### 1.2 用户登录

- **接口地址**: `POST /api/user/login`
- **接口描述**: 用户通过邮箱密码登录
- **是否需要登录**: 否
- **请求头**: `Content-Type: application/json`

**请求参数**:

```json
{
  "email": "test@example.com",     // string, 邮箱地址，必填，需符合邮箱格式
  "password": "123456"             // string, 密码，必填
}
```

**响应数据**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "email": "test@example.com",
    "nickname": "测试用户",
    "avatarUrl": "http://example.com/avatar.jpg",
    "status": 1
  }
}
```

### 1.3 发送邮箱验证码

- **接口地址**: `POST /api/user/sendEmail`
- **接口描述**: 向指定邮箱发送验证码
- **是否需要登录**: 否
- **请求头**: `Content-Type: application/json`

**请求参数**:

```json
{
  "email": "test@example.com"      // string, 邮箱地址，必填，需符合邮箱格式
}
```

**响应数据**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "code": "123456"               // string, 验证码内容（开发环境会返回，生产环境不返回）
  }
}
```

**注意事项**:

- 验证码有效期为5分钟
- 每次请求都会生成新的验证码
- 验证码为6位数字

### 1.4 用户登出

- **接口地址**: `POST /api/user/logout`
- **接口描述**: 用户退出登录，清除session
- **是否需要登录**: 否（但有session时会清除）

**请求参数**: 无

**响应数据**:

```json
{
  "code": 0,
  "message": "退出登录成功",
  "data": null
}
```

### 1.5 获取当前用户信息

- **接口地址**: `GET /api/user/info`
- **接口描述**: 获取当前登录用户的信息
- **是否需要登录**: 是

**请求参数**: 无

**响应数据**:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "email": "test@example.com",
    "nickname": "测试用户",
    "avatarUrl": "http://example.com/avatar.jpg",
    "status": 1
  }
}
```

---

## 2. 角色模块 `/api/roles`

### 2.1 获取角色列表

- **接口地址**: `POST /api/roles/list`
- **接口描述**: 获取用户可对话的角色列表，自动创建会话
- **是否需要登录**: 是

**请求参数**: 无

**响应数据**:

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,                                    // number, 角色ID
      "code": "xiaochai",                         // string, 角色代码
      "name": "小柴",                             // string, 角色名称
      "avatarUrl": "http://example.com/xiaochai.jpg", // string, 头像URL
      "description": "活泼可爱的柴犬少女",          // string, 角色描述
      "roleSetting": "你是一只可爱的柴犬少女...",   // string, 角色设定
      "conversationId": "uuid-string-here"        // string, 会话ID（UUID格式）
    }
  ]
}
```

**注意事项**:

- 如果用户与某个角色还没有会话，会自动创建会话并返回conversationId
- conversationId用于后续聊天接口的调用

---

## 3. 聊天模块 `/api/chat`

### 3.1 与角色聊天

- **接口地址**: `POST /api/chat/{roleId}`
- **接口描述**: 与指定角色进行聊天对话（SSE流式响应）
- **是否需要登录**: 是
- **请求头**: `Content-Type: application/json`
- **响应头**: `Content-Type: text/event-stream;charset=UTF-8`

**请求参数**:

- **路径参数**: `roleId` - number, 角色ID，必填
- **请求体**:

```json
{
  "message": "你好，小柴！"         // string, 用户消息内容，必填
}
```

**响应格式**: Server-Sent Events (SSE)

**响应数据示例**:

```
data: 你
id: 1727123456789
event: message

data: 好
id: 1727123456790
event: message

data: ，
id: 1727123456791
event: message

data: 很
id: 1727123456792
event: message

data: 高
id: 1727123456793
event: message

data: 兴
id: 1727123456794
event: message

data: 认
id: 1727123456795
event: message

data: 识
id: 1727123456796
event: message

data: 你
id: 1727123456797
event: message

data: ！
id: 1727123456798
event: message

data: [DONE]
id: 1727123456799
event: done
```

**客户端使用示例**:

```javascript
const eventSource = new EventSource('/api/chat/1', {
  method: 'POST',
  body: JSON.stringify({ message: '你好，小柴！' }),
  headers: {
    'Content-Type': 'application/json'
  }
});

eventSource.onmessage = function(event) {
  if (event.data === '[DONE]') {
    eventSource.close();
    console.log('对话完成');
  } else {
    console.log('收到消息片段:', event.data);
    // 将消息片段追加到显示区域
  }
};

eventSource.onerror = function(event) {
  console.error('SSE连接错误:', event);
  eventSource.close();
};
```

### 3.2 重置会话上下文

- **接口地址**: `POST /api/chat/{roleId}/reset`
- **接口描述**: 重置与指定角色的会话上下文，清除聊天历史
- **是否需要登录**: 是

**请求参数**:

- **路径参数**: `roleId` - number, 角色ID，必填
- **查询参数**: `userId` - number, 用户ID，必填

**响应数据**:

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

**错误响应**:

```json
{
  "code": 50002,
  "message": "会话不存在",
  "data": null
}
```

### 3.3 获取会话历史

- **接口地址**: `POST /api/chat/{roleId}/history`
- **接口描述**: 获取与指定角色的聊天历史记录
- **是否需要登录**: 是

**请求参数**:

- **路径参数**: `roleId` - number, 角色ID，必填

**响应数据**:

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,                              // number, 消息ID
      "conversationId": "uuid-string-here", // string, 会话ID
      "role": "user",                       // string, 消息角色：user/assistant/system
      "content": "你好，小柴！",             // string, 消息内容
      "createdAt": "2025-09-24T10:30:00"    // string, 创建时间（ISO格式）
    },
    {
      "id": 2,
      "conversationId": "uuid-string-here",
      "role": "assistant",
      "content": "汪汪！你好呀～主人！很高兴见到你！",
      "createdAt": "2025-09-24T10:30:05"
    }
  ]
}
```

**注意事项**:

- 消息按时间倒序排列（最新的在前）
- role字段说明：
  - `user`: 用户消息
  - `assistant`: AI助手消息
  - `system`: 系统消息（如重置标记）
- 如果会话不存在，返回空数组

---

## 4. 认证说明

### Session认证机制

- 登录后用户信息会保存在服务端Session中
- Session有效期为浏览器会话期间
- 需要登录的接口会通过拦截器验证Session
- 拦截路径: `/api/**`（排除登录、注册、发送验证码等公开接口）

### 需要登录的接口

- `GET /api/user/info` - 获取当前用户信息
- `POST /api/roles/list` - 获取角色列表
- `POST /api/chat/{roleId}` - 与角色聊天
- `POST /api/chat/{roleId}/reset` - 重置会话上下文
- `POST /api/chat/{roleId}/history` - 获取会话历史

### 无需登录的接口

- `POST /api/user/register` - 用户注册
- `POST /api/user/login` - 用户登录
- `POST /api/user/sendEmail` - 发送邮箱验证码
- `POST /api/user/logout` - 用户登出

### 认证失败处理

当访问需要登录的接口但未登录时，返回：

```json
{
  "code": 40100,
  "message": "请先登录",
  "data": null
}
```

---

## 5. 错误码说明

### 通用错误码

| 错误码 | 错误信息 | 说明 |
|-------|---------|------|
| 0 | success | 成功 |
| 40001 | 参数错误 | 请求参数不正确 |
| 40100 | 请先登录 | 未登录或登录已过期 |
| 50000 | 系统内部错误 | 服务器内部错误 |

### 业务错误码

| 错误码 | 错误信息 | 说明 |
|-------|---------|------|
| 50001 | 邮件发送失败 | 邮箱验证码发送失败 |
| 50002 | 会话不存在 | 指定的会话不存在 |
| 50003 | 角色不存在 | 指定的角色不存在 |
| 50004 | 验证码错误或已过期 | 邮箱验证码验证失败 |
| 50005 | 邮箱已被注册 | 注册时邮箱已存在 |
| 50006 | 邮箱或密码错误 | 登录时邮箱或密码不正确 |

---

## 6. 数据类型说明

### 用户信息 (UserInfoVO)

```typescript
interface UserInfoVO {
  id: number;           // 用户ID
  email: string;        // 邮箱地址
  nickname: string;     // 昵称
  avatarUrl?: string;   // 头像URL，可为空
  status: number;       // 状态：1-激活，0-禁用
}
```

### 角色信息 (RoleInfoVO)

```typescript
interface RoleInfoVO {
  id: number;              // 角色ID
  code: string;            // 角色代码
  name: string;            // 角色名称
  avatarUrl?: string;      // 头像URL，可为空
  description?: string;    // 角色描述，可为空
  roleSetting?: string;    // 角色设定，可为空
  conversationId: string;  // 会话ID（UUID格式）
}
```

### 聊天历史 (ChatHistoryDO)

```typescript
interface ChatHistoryDO {
  id: number;              // 消息ID
  conversationId: string;  // 会话ID
  role: 'user' | 'assistant' | 'system';  // 消息角色
  content: string;         // 消息内容
  createdAt: string;       // 创建时间（ISO格式）
}
```

---

## 7. 使用注意事项

### 7.1 邮箱验证码

- 验证码有效期为5分钟
- 每次请求都会生成新的验证码，旧验证码会失效
- 验证码为6位数字
- 开发环境会在响应中返回验证码，生产环境不返回

### 7.2 聊天接口

- 使用SSE（Server-Sent Events）实现流式响应
- 前端需要支持EventSource API
- 接收到 `[DONE]` 标识时表示对话完成
- 连接断开时需要重新建立连接

### 7.3 会话管理

- 每个用户与每个角色只有一个持久会话
- 会话会自动创建，无需手动创建
- 重置会话会插入重置标记，但不删除历史记录

## 8. 更新日志

### v1.0.0 (2025-09-24)

- 初始版本发布
- 完成用户注册、登录、登出功能
- 完成邮箱验证码发送和验证
- 完成角色管理和列表查询
- 完成聊天对话功能（支持流式响应）
- 完成会话历史查询和重置功能
- 基于Session的认证机制
