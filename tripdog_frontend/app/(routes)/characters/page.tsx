// app/(routes)/characters/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { Card, Row, Col, Typography, Badge } from 'antd';
import { Star } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { motion } from 'framer-motion';

const { Title, Paragraph } = Typography;

export default function CharactersPage() {
    const router = useRouter();
    const { characters, currentCharacter, setCurrentCharacter, createSession } = useChatStore();

    const handleSelectCharacter = (character: typeof characters[0]) => {
        setCurrentCharacter(character);
        createSession(character.id);
        router.push('/chat');
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="text-center mb-8">
                <Title level={2} className="text-orange-600 mb-2">
                    <span className="font-comic">选择您的旅行伙伴 🎭</span>
                </Title>
                <Paragraph className="text-gray-600">
                    每个角色都有独特的个性和专长，选择一个开始您的旅程吧！
                </Paragraph>
            </div>

            <Row gutter={[24, 24]}>
                {characters.map((character, index) => (
                    <Col xs={24} sm={12} lg={8} key={character.id}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Badge.Ribbon
                                text={currentCharacter?.id === character.id ? "当前选择" : ""}
                                color="orange"
                                style={{
                                    display: currentCharacter?.id === character.id ? 'block' : 'none',
                                }}
                            >
                                <Card
                                    hoverable
                                    onClick={() => handleSelectCharacter(character)}
                                    className="h-full transform transition-all hover:scale-105"
                                    style={{
                                        borderRadius: '20px',
                                        border: '3px solid #FFA500',
                                        background: `linear-gradient(135deg, ${character.bgGradient.replace('from-', '').replace('to-', ',')}`,
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                        transition: 'all 0.2s ease-in-out',
                                    }}
                                    styles={{body:{ padding: '24px' }}}
                                >
                                    <div className="text-center">
                                        <div className="text-6xl mb-4">
                                            {character.avatar}
                                        </div>
                                        <Title level={4} className="mb-2 text-white font-comic">
                                            {character.name}
                                        </Title>
                                        <Paragraph className="text-white/90 text-sm">
                                            {character.description}
                                        </Paragraph>
                                        <div className="mt-4 flex justify-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={20}
                                                    className={i < 4 ? 'fill-yellow-300 text-yellow-300' : 'text-yellow-300'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            </Badge.Ribbon>
                        </motion.div>
                    </Col>
                ))}
            </Row>
        </div>
    );
}