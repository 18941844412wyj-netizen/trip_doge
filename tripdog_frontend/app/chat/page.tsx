// app/(routes)/chat/page.tsx
"use client";

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Empty, Button, Spin} from 'antd';
import {Sparkles} from 'lucide-react';
import {useChatStore} from '@/stores/chatStore';
import VoiceChat from '@/components/chat/VoiceChat';
import {motion} from 'framer-motion';
import {useAuth} from '@/contexts/AuthContext';
import Image from "next/image";

export default function ChatPage() {
    const router = useRouter();
    const {currentCharacter} = useChatStore();
    const {user, isLoading} = useAuth();
    const [showWelcome, setShowWelcome] = useState(true);

    // 检查用户是否已登录
    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        if (!currentCharacter) {
            router.push('/characters');
        } else {
            setTimeout(() => setShowWelcome(false), 2000);
        }
    }, [currentCharacter, router]);

    // 如果用户未登录，显示加载状态
    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spin size="large"/>
            </div>
        );
    }

    if (!currentCharacter) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="请先选择一个角色"
                >
                    <Button
                        type="primary"
                        onClick={() => router.push('/characters')}
                        className="cartoon-button"
                    >
                        选择角色
                    </Button>
                </Empty>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* 欢迎动画 */}
            {showWelcome && (
                <motion.div
                    initial={{opacity: 0, scale: 0.8}}
                    animate={{opacity: 1, scale: 1}}
                    exit={{opacity: 0}}
                    className="min-h-screen fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100"
                >
                    <div className="text-center">
                        <div className="text-8xl mb-4 animate-bounce">
                            {currentCharacter.avatarUrl ? (
                                <Image src={currentCharacter.avatarUrl} width={120} height={120} alt={currentCharacter.name}/>
                            ) : (
                                <span>🤖</span>
                            )}
                        </div>
                        <h2 className="text-3xl font-bold text-orange-600 font-comic mb-2">
                            {currentCharacter.name}
                        </h2>
                        <p className="text-gray-600">正在准备中...</p>
                        <Sparkles className="w-8 h-8 mx-auto mt-4 text-yellow-500 animate-pulse"/>
                    </div>
                </motion.div>
            )}

            {/* 聊天主体 */}
            <VoiceChat character={currentCharacter}/>
        </div>
    );
}