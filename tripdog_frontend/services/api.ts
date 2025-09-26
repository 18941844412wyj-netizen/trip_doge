// services/api.ts
import { 
  BaseResponse, 
  UserInfoVO, 
  RoleInfoVO, 
  ChatHistoryDO, 
  RegisterRequest, 
  LoginRequest, 
  SendEmailRequest, 
  ChatRequest
} from '@/types';

// API基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7979';

// 创建API请求的基础函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<BaseResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    credentials: 'include', // 确保携带cookie进行认证
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  return response.json();
}

// 用户相关API
export const userApi = {
  // 用户注册
  register: (data: RegisterRequest): Promise<BaseResponse<UserInfoVO>> => {
    return apiRequest('/user/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 用户登录
  login: (data: LoginRequest): Promise<BaseResponse<UserInfoVO>> => {
    return apiRequest('/user/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 发送邮箱验证码
  sendEmail: (data: SendEmailRequest): Promise<BaseResponse<{ code: string }>> => {
    return apiRequest('/user/sendEmail', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 用户登出
  logout: (): Promise<BaseResponse<null>> => {
    return apiRequest('/user/logout', {
      method: 'POST',
    });
  },

  // 获取当前用户信息
  getInfo: (): Promise<BaseResponse<UserInfoVO>> => {
    return apiRequest('/user/info', {
      method: 'GET',
    });
  },
};

// 角色相关API
export const rolesApi = {
  // 获取角色列表
  list: (): Promise<BaseResponse<RoleInfoVO[]>> => {
    return apiRequest('/roles/list', {
      method: 'POST',
    });
  },
};

// 聊天相关API
export const chatApi = {
  // 使用fetch API处理流式响应的聊天接口
  chatStream: async (roleId: number, data: ChatRequest, onMessage: (data: string) => void, onDone?: () => void, onError?: (error: Error) => void) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/${roleId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        if (onError) {
          onError(error);
        }
        return;
      }

      if (!response.body) {
        const error = new Error('ReadableStream not supported');
        if (onError) {
          onError(error);
        }
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          // 解析SSE格式数据
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const eventData = line.slice(6);
              if (eventData === '{"type":"end"}') {
                if (onDone) {
                  onDone();
                }
                return;
              }
              onMessage(eventData);
            }
          }
        }
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
    }
  },

  // 重置会话上下文
  reset: (roleId: number): Promise<BaseResponse<null>> => {
    return apiRequest(`/chat/${roleId}/reset`, {
      method: 'POST',
    });
  },

  // 获取会话历史
  history: (roleId: number): Promise<BaseResponse<ChatHistoryDO[]>> => {
    return apiRequest(`/chat/${roleId}/history`, {
      method: 'POST',
    });
  },
};