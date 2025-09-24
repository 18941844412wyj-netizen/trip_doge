// app/stores/chatStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Character, Message, ChatSession } from '@/types';

interface ChatStore {
    // 角色相关
    characters: Character[];
    currentCharacter: Character | null;
    setCurrentCharacter: (character: Character) => void;

    // 会话相关
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    createSession: (characterId: string) => void;
    loadSession: (sessionId: string) => void;

    // 消息相关
    addMessage: (message: Message) => void;
    updateMessage: (messageId: string, content: string) => void;
    clearCurrentSession: () => void;

    // 设置相关
    autoPlay: boolean;
    setAutoPlay: (value: boolean) => void;
}

export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            characters: [
                {
                    id: 'assistant',
                    name: '旅行助手',
                    avatar: '🦮',
                    description: '您的智能旅行伙伴',
                    systemPrompt: '你是一个友好的旅行助手，帮助用户规划旅行路线、推荐景点和解答旅行相关问题。',
                    voiceId: 'zh-CN-YunxiaNeural',
                    primaryColor: '#3B82F6',
                    bgGradient: 'from-blue-400 to-blue-600',
                },
                {
                    id: 'guide',
                    name: '导游小美',
                    avatar: '👩‍🦰',
                    description: '专业导游，带您游遍世界',
                    systemPrompt: '你是一位经验丰富的导游，用生动有趣的方式介绍景点历史和文化。',
                    voiceId: 'zh-CN-XiaoxiaoNeural',
                    primaryColor: '#EC4899',
                    bgGradient: 'from-pink-400 to-pink-600',
                },
                {
                    id: 'foodie',
                    name: '美食家阿宝',
                    avatar: '🧑‍🍳',
                    description: '发现各地美食文化',
                    systemPrompt: '你是一位美食专家，热衷于介绍各地特色美食和餐厅推荐。',
                    voiceId: 'zh-CN-YunjianNeural',
                    primaryColor: '#F97316',
                    bgGradient: 'from-orange-400 to-orange-600',
                },
            ],
            currentCharacter: null,
            sessions: [],
            currentSession: null,
            autoPlay: true,

            setCurrentCharacter: (character) => set({ currentCharacter: character }),

            createSession: (characterId) => {
                const newSession: ChatSession = {
                    id: `session-${Date.now()}`,
                    characterId,
                    messages: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                set(state => ({
                    sessions: [...state.sessions, newSession],
                    currentSession: newSession,
                }));
            },

            loadSession: (sessionId) => {
                const session = get().sessions.find(s => s.id === sessionId);
                if (session) {
                    set({ currentSession: session });
                }
            },

            addMessage: (message) => {
                set(state => {
                    if (!state.currentSession) return state;

                    const updatedSession = {
                        ...state.currentSession,
                        messages: [...state.currentSession.messages, message],
                        updatedAt: new Date(),
                    };

                    return {
                        currentSession: updatedSession,
                        sessions: state.sessions.map(s =>
                            s.id === updatedSession.id ? updatedSession : s
                        ),
                    };
                });
            },

            updateMessage: (messageId, content) => {
                set(state => {
                    if (!state.currentSession) return state;

                    const updatedMessages = state.currentSession.messages.map(m =>
                        m.id === messageId ? { ...m, content } : m
                    );

                    const updatedSession = {
                        ...state.currentSession,
                        messages: updatedMessages,
                    };

                    return {
                        currentSession: updatedSession,
                        sessions: state.sessions.map(s =>
                            s.id === updatedSession.id ? updatedSession : s
                        ),
                    };
                });
            },

            clearCurrentSession: () => {
                set(state => {
                    if (!state.currentSession) return state;

                    const clearedSession = {
                        ...state.currentSession,
                        messages: [],
                        updatedAt: new Date(),
                    };

                    return {
                        currentSession: clearedSession,
                        sessions: state.sessions.map(s =>
                            s.id === clearedSession.id ? clearedSession : s
                        ),
                    };
                });
            },

            setAutoPlay: (value) => set({ autoPlay: value }),
        }),
        {
            name: 'chat-storage',
        }
    )
);