// app/stores/chatStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Character, Message, ChatSession, RoleInfoVO } from '@/types';
import { rolesApi } from '@/services/api';

interface ChatStore {
    // 角色相关
    characters: Character[];
    currentCharacter: Character | null;
    setCurrentCharacter: (character: Character) => void;
    loadCharacters: () => Promise<void>;

    // 会话相关
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    createSession: (characterId: string) => void;
    loadSession: (sessionId: string) => void;

    // 消息相关
    addMessage: (message: Message) => void;
    updateMessage: (messageId: string, content: string, isStreaming?: boolean) => void;
    clearCurrentSession: () => void;

    // 设置相关
    autoPlay: boolean;
    setAutoPlay: (value: boolean) => void;
}

export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            characters: [],
            currentCharacter: null,
            sessions: [],
            currentSession: null,
            autoPlay: true,

            setCurrentCharacter: (character) => set({ currentCharacter: character }),

            loadCharacters: async () => {
                try {
                    const response = await rolesApi.list();
                    if (response.code === 0) {
                        // 将RoleInfoVO转换为Character类型
                        const characters: Character[] = response.data.map((role: RoleInfoVO) => ({
                            id: role.id.toString(),
                            name: role.name,
                            avatar: role.avatarUrl || '👤',
                            description: role.description || '',
                            systemPrompt: role.roleSetting || '',
                            voiceId: 'zh-CN-XiaoxiaoNeural', // 默认语音ID
                            primaryColor: '#3B82F6', // 默认颜色
                            bgGradient: 'from-blue-400 to-blue-600', // 默认渐变色
                        }));
                        set({ characters });
                    }
                } catch (error) {
                    console.error('加载角色列表失败:', error);
                }
            },

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

            updateMessage: (messageId, content, isStreaming = true) => {
                set(state => {
                    if (!state.currentSession) return state;

                    const updatedMessages = state.currentSession.messages.map(m =>
                        m.id === messageId ? { ...m, content, isStreaming } : m
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