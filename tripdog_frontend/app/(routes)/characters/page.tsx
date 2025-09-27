// app/(routes)/characters/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { Row, Col, Typography, Spin } from 'antd';
import { useChatStore } from '@/stores/chatStore';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Image from "next/image";
import { useMediaQuery } from 'react-responsive';
import Characters from '@/components/characters/Characters';

const { Title, Paragraph } = Typography;

export default function CharactersPage() {
  const router = useRouter();
  const { characters, currentCharacter, setCurrentCharacter, createSession, loadCharacters } = useChatStore();
  const { user, isLoading: authLoading } = useAuth();
  const [isClient, setIsClient] = useState(false);

  const isMobile = useMediaQuery({ maxWidth: 768 });

  // 加载角色列表
  useEffect(() => {
    loadCharacters();
    setIsClient(true);
  }, [loadCharacters]);

  // 检查用户是否已登录
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // 移动端使用新的粘土风格组件
  if (isClient && isMobile) {
    return <Characters />;
  }

  const handleSelectCharacter = (character: typeof characters[0]) => {
    setCurrentCharacter(character);
    createSession(character.id);
    router.push('/chat');
  };



  return (
    <div className="p-6 md:p-12 max-w-6xl mx-auto">
      {/* 头部区域 - 粘土风格美化 */}
      <div className="text-center mb-12">
        <div
          className="inline-block p-6 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg shadow-purple-200/50 mb-6 border border-white/50">
          <Title level={2}
            className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            <span className="font-bold text-3xl">选择您的旅行伙伴 🎭</span>
          </Title>
          <Paragraph className="text-gray-600 text-lg">
            每个角色都有独特的个性和专长，选择一个开始您的旅程吧！
          </Paragraph>
        </div>
      </div>

      {/* 角色卡片网格 - 粘土风格美化 */}
      <Row gutter={[32, 32]}>
        {characters.map((character, index) => (
          <Col xs={24} sm={12} lg={8} key={character.id}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              {/* 当前选择的徽章 */}
              {currentCharacter?.id === character.id && (
                <div className="relative mb-4">
                  <div className="absolute -top-2 -right-2 z-10">
                    <div
                      className="bg-gradient-to-r from-orange-400 to-pink-400 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-orange-200">
                      ✨ 当前选择
                    </div>
                  </div>
                </div>
              )}

              {/* 主卡片 - 粘土风格美化 */}
              <div
                onClick={() => handleSelectCharacter(character)}
                className={`
                  relative cursor-pointer group h-full
                  bg-white/90 backdrop-blur-sm
                  rounded-3xl p-8
                  shadow-xl shadow-purple-200/30
                  hover:shadow-2xl hover:shadow-purple-300/40
                  transform transition-all duration-300 ease-out
                  border border-white/50
                  ${currentCharacter?.id === character.id
                    ? 'ring-4 ring-orange-300/50 bg-gradient-to-br from-orange-50 to-pink-50'
                    : 'hover:scale-105'
                  }
                `}
              >
                {/* 角色内容 */}
                <div className="text-center">
                  {/* 头像容器 - 粘土风格美化 */}
                  <div
                    className="mb-6 w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center shadow-inner border border-white/30">
                    {character.avatarUrl ? (<Image src={character.avatarUrl} alt={character.name}
                      className="text-5xl group-hover:scale-110 transition-transform duration-300 rounded-full" width={96} height={96} />) :
                      <div
                        className="text-5xl group-hover:scale-110 transition-transform duration-300">
                        {character.name[0]}
                      </div>}
                  </div>
                  {/* 角色名称 - 粘土风格美化 */}
                  <Title level={4}
                    className="mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-xl">
                    {character.name}
                  </Title>

                  {/* 描述 - 粘土风格美化 */}
                  <Paragraph className="text-gray-600 text-base leading-relaxed mb-6">
                    {character.description}
                  </Paragraph>

                  {/* 选择按钮 - 粘土风格美化 */}
                  <div className="mt-6">
                    <div className={`
                      inline-block px-6 py-3 rounded-2xl font-semibold text-sm
                      transition-all duration-300
                      bg-gradient-to-r from-purple-500 to-indigo-500 text-white 
                      shadow-lg shadow-purple-200 group-hover:from-purple-600 group-hover:to-indigo-600
                      border border-white/30 backdrop-blur-sm
                      ${currentCharacter?.id === character.id
                        ? 'bg-gradient-to-r from-orange-400 to-pink-400 text-white shadow-lg shadow-orange-200'
                        : ''
                      }
                    `}>
                      {currentCharacter?.id === character.id ? '已选择' : '选择角色'}
                    </div>
                  </div>
                </div>

                {/* 卡片光泽效果 */}
                <div
                  className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-3xl pointer-events-none"></div>
              </div>
            </motion.div>
          </Col>
        ))}
      </Row>
    </div>
  );
}