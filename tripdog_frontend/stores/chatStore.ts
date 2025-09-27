// app/stores/chatStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {RoleInfoVO} from '@/types';
import {rolesApi} from '@/services/api';

interface ChatStore {
    characters: RoleInfoVO[];
    currentCharacter: RoleInfoVO | null;
    loading: boolean;
    error: string | null;
    loadCharacters: () => Promise<void>;
    setCurrentCharacter: (character: RoleInfoVO | null) => void;
    createSession: (characterId: number) => void;
}

export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            characters: [],
            currentCharacter: null,
            loading: false,
            error: null,

            loadCharacters: async () => {
                set({loading: true, error: null});
                try {
                    const response = await rolesApi.list();
                    if (response.code === 0) {
                        set({characters: response.data});
                    } else {
                        set({error: response.message});
                    }
                } catch (error) {
                    set({error: (error as Error).message});
                } finally {
                    set({loading: false});
                }
            },

            setCurrentCharacter: (character) => set({currentCharacter: character}),

            createSession: (characterId) => {
                // 实现创建会话的逻辑
                console.log('Creating session for character:', characterId);
            },
        }),
        {
            name: 'chat-storage',
            partialize: (state) => ({currentCharacter: state.currentCharacter}),
        }
    )
);