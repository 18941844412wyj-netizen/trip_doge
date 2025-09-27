// app/types/index.ts
export interface Character {
    id: string;
    name: string;
    avatar: string;
    description: string;
    systemPrompt: string;
    voiceId: string;
    primaryColor: string;
    bgGradient: string;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    characterId?: string;
    isStreaming?: boolean;
}

export interface ChatSession {
    id: string;
    characterId: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

// API文档中定义的类型
export interface UserInfoVO {
    id: number;
    email: string;
    nickname: string;
    avatarUrl?: string;
}

export interface RoleInfoVO {
    id: number;
    code: string;
    name: string;
    avatarUrl?: string;
    description?: string;
    roleSetting?: string;
    conversationId: string;
}

export interface RoleDetailVO {
    id: number;
    code: string;
    name: string;
    avatarUrl?: string;
    description?: string;
    personality?: string[];
    specialties?: string[];
    sortOrder?: number;
}

export interface ChatHistoryDO {
    id: number;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    enhancedContent?: string;
    createdAt: string;
}

// 请求参数类型
export interface RegisterRequest {
    email: string;
    password: string;
    nickname: string;
    code: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface SendEmailRequest {
    email: string;
}

export interface ChatRequest {
    message: string;
}

export interface UploadDTO {
    roleId?: number;
    file?: File;
}

// API响应基础类型
export interface BaseResponse<T> {
    code: number;
    message: string;
    data: T;
    timestamp?: number;
    success?: boolean;
}