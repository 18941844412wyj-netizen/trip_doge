# 测试指南

## 目录结构

```
__tests__/
├── app/          # 页面组件测试
├── components/   # 可复用组件测试
├── contexts/     # Context测试
├── services/     # 服务层测试
└── stores/       # 状态管理测试
```

## 运行测试

### 运行所有测试

```bash
npm run test
```

### 以监听模式运行测试

```bash
npm run test:watch
```

## 测试类型

### 单元测试
- 测试独立的函数和组件
- 验证输入输出是否符合预期

### 集成测试
- 测试多个组件或模块之间的交互
- 验证数据流和状态管理

### 端到端测试
- 模拟用户操作流程
- 验证完整功能是否正常工作

## 测试工具

- [Jest](https://jestjs.io/) - JavaScript测试框架
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - React组件测试工具
- [Jest DOM](https://github.com/testing-library/jest-dom) - DOM元素断言扩展

## 编写测试

### 基本测试结构

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // 测试前的准备工作
  });

  afterEach(() => {
    // 测试后的清理工作
  });

  it('should do something', () => {
    // 测试内容
  });
});
```

### Mocking

使用 `jest.mock()` 来模拟外部依赖：

```typescript
jest.mock('@/services/api', () => ({
  userApi: {
    login: jest.fn(),
  },
}));
```

## 测试覆盖率

运行测试时会自动生成覆盖率报告，可以通过以下方式查看：

```bash
npm run test -- --coverage
```