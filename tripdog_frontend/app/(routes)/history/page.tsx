"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Typography, Spin, List, Avatar, Button, Empty, Tag } from 'antd';
import { HistoryOutlined, UserOutlined, RobotOutlined, DeleteOutlined } from '@ant-design/icons';
import { useChatStore } from '@/stores/chatStore';
import { chatApi } from '@/services/api';
import { ChatHistoryDO } from '@/types';

const { Title, Text } = Typography;

export default function History() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { currentCharacter } = useChatStore();
  const [history, setHistory] = useState<ChatHistoryDO[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // 检查用户是否已登录
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 获取历史记录
  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentCharacter?.id) return;
      
      try {
        setLoading(true);
        const response = await chatApi.history(currentCharacter.id);
        if (response.code === 0) {
          setHistory(response.data);
        }
      } catch (error) {
        console.error('获取历史记录失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentCharacter]);

  // 删除历史记录
  const handleClearHistory = async () => {
    if (!currentCharacter?.id) return;
    
    try {
      setDeleting(true);
      const response = await chatApi.reset(currentCharacter.id);
      if (response.code === 0) {
        setHistory([]);
      }
    } catch (error) {
      console.error('清空历史记录失败:', error);
    } finally {
      setDeleting(false);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  // 如果用户未登录，显示加载状态
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-sm mb-6 text-center">
          <Title level={2} className="!mb-2 text-gray-800 flex items-center justify-center">
            <HistoryOutlined className="mr-2" />
            对话历史
          </Title>
          <Text type="secondary" className="!text-gray-600">
            {currentCharacter ? `与 ${currentCharacter.name} 的对话记录` : '请选择角色查看历史记录'}
          </Text>
        </Card>

        {/* 操作栏 */}
        {currentCharacter && history.length > 0 && (
          <Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-sm mb-6">
            <div className="flex justify-between items-center">
              <Text className="text-gray-700">
                共 {history.length} 条记录
              </Text>
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={handleClearHistory}
                loading={deleting}
                className="rounded-xl bg-gradient-to-br from-red-400 to-red-500 text-white border-0 shadow-[0_4px_12px_rgba(239,68,68,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_24px_rgba(239,68,68,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 transform active:scale-95"
              >
                清空历史
              </Button>
            </div>
          </Card>
        )}

        {/* 历史记录列表 */}
        <Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spin size="large" />
            </div>
          ) : history.length > 0 ? (
            <List
              dataSource={history}
              renderItem={item => (
                <List.Item
                  className="border-b border-white/30 last:border-b-0 py-4"
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={item.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                        className={item.role === 'user' 
                          ? "bg-gradient-to-br from-blue-400 to-blue-500 text-white border-0 shadow-[0_4px_12px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]" 
                          : "bg-gradient-to-br from-purple-400 to-purple-500 text-white border-0 shadow-[0_4px_12px_rgba(147,51,234,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]"
                        }
                      />
                    }
                    title={
                      <div className="flex justify-between items-center">
                        <Text className="font-bold text-gray-800">
                          {item.role === 'user' ? '您' : currentCharacter?.name || 'AI角色'}
                        </Text>
                        <Tag 
                          color={item.role === 'user' ? 'blue' : 'purple'} 
                          className="rounded-full"
                        >
                          {formatTime(item.createdAt)}
                        </Tag>
                      </div>
                    }
                    description={
                      <div className="mt-2 bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]">
                        <Text className="text-gray-700">{item.content}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                currentCharacter 
                  ? "暂无对话历史" 
                  : "请先选择一个角色开始对话"
              }
              className="py-12"
            >
              {currentCharacter ? (
                <Button
                  type="primary"
                  onClick={() => router.push('/chat')}
                  className="rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 text-white border-0 shadow-[0_4px_12px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 transform active:scale-95"
                >
                  开始对话
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={() => router.push('/characters')}
                  className="rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 text-white border-0 shadow-[0_4px_12px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 transform active:scale-95"
                >
                  选择角色
                </Button>
              )}
            </Empty>
          )}
        </Card>
      </div>
    </div>
  );
}