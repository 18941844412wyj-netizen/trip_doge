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