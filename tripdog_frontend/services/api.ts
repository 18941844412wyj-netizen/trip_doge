// services/api.ts
import {
    BaseResponse,
    UserInfoVO,
    RoleInfoVO,
    RoleDetailVO,
    ChatHistoryDO,
    RegisterRequest,
    LoginRequest,
    SendEmailRequest,
    ChatRequest,
} from '@/types';

// API基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7979';

// 获取当前token的函数
export const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

// 创建API请求的基础函数
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true
): Promise<BaseResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = new Headers({
        'Content-Type': 'application/json',
        ...options.headers,
    });

    // 如果需要认证，添加Authorization头
    if (requireAuth) {
        const token = getToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }

    const config: RequestInit = {
        headers,
        ...options,
    };

    const response = await fetch(url, config);
    return response.json();
}

// 用户相关API
export const userApi = {
    // 用户注册
    register: (data: RegisterRequest): Promise<BaseResponse<UserInfoVO>> => {
        return apiRequest('/api/user/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }, false); // 注册不需要认证
    },

    // 用户登录
    login: (data: LoginRequest): Promise<BaseResponse<{ userInfo: UserInfoVO; token: string }>> => {
        return apiRequest('/api/user/login', {
            method: 'POST',
            body: JSON.stringify(data),
        }, false); // 登录不需要认证
    },

    // 发送邮箱验证码
    sendEmail: (data: SendEmailRequest): Promise<BaseResponse<{ code: string }>> => {
        return apiRequest('/api/user/sendEmail', {
            method: 'POST',
            body: JSON.stringify(data),
        }, false); // 发送验证码不需要认证
    },

    // 用户登出
    logout: (): Promise<BaseResponse<null>> => {
        return apiRequest('/api/user/logout', {
            method: 'POST',
        }, true); // 登出需要认证
    },

    // 获取当前用户信息
    getInfo: (): Promise<BaseResponse<UserInfoVO>> => {
        return apiRequest('/api/user/info', {
            method: 'POST',
        }, true); // 获取用户信息需要认证
    },
};

// 角色相关API
export const rolesApi = {
    // 获取角色列表
    list: (): Promise<BaseResponse<RoleInfoVO[]>> => {
        return apiRequest('/api/roles/list', {
            method: 'POST',
        }, true); // 获取角色列表需要认证
    },
    
    // 获取角色详情
    detail: (roleId: number): Promise<BaseResponse<RoleDetailVO>> => {
        return apiRequest(`/api/roles/${roleId}/detail`, {
            method: 'POST',
        }, true); // 获取角色详情需要认证
    },
};

// 聊天相关API
export const chatApi = {
    // 与AI角色对话
    chat: (roleId: number, data: ChatRequest): Promise<Response> => {
        const token = getToken();
        const headers = new Headers({
            'Content-Type': 'application/json',
        });
        
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        return fetch(`${API_BASE_URL}/api/chat/${roleId}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
        });
    },

    // 重置会话上下文
    reset: (roleId: number): Promise<BaseResponse<null>> => {
        return apiRequest(`/api/chat/${roleId}/reset`, {
            method: 'POST',
        }, true); // 重置会话需要认证
    },

    // 获取会话历史
    history: (roleId: number): Promise<BaseResponse<ChatHistoryDO[]>> => {
        return apiRequest(`/api/chat/${roleId}/history`, {
            method: 'POST',
        }, true); // 获取历史需要认证
    },
};

// 文档相关API
export const docApi = {
    // 文档上传并解析
    upload: async (file: File, roleId?: number): Promise<BaseResponse<string>> => {
        const formData = new FormData();
        formData.append('file', file);
        
        if (roleId !== undefined) {
            formData.append('roleId', roleId.toString());
        }

        const token = getToken();
        const headers = new Headers();
        
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const response = await fetch(`${API_BASE_URL}/api/doc/parse`, {
            method: 'POST',
            headers,
            body: formData,
        });

        return response.json();
    },
};