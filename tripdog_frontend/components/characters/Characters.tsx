// components/characters/Characters.tsx
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { rolesApi } from '@/services/api';
import { RoleInfoVO } from '@/types';
import { Spin, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/stores/chatStore';
import Image from 'next/image';

export default function Characters() {
  const [contacts, setContacts] = useState<RoleInfoVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setCurrentCharacter, createSession } = useChatStore();

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await rolesApi.list();
      
      if (response.success) {
        setContacts(response.data);
      } else {
        setError(response.message || '获取角色列表失败');
        message.error(response.message || '获取角色列表失败');
      }
    } catch (err) {
      setError('网络错误，请稍后重试');
      message.error('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacter = (contact: RoleInfoVO) => {
    setCurrentCharacter(contact);
    createSession(contact.id);
    router.push('/chat');
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.description && contact.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-700">加载失败: {error}</p>
          <button 
            onClick={loadRoles}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* 搜索框 - 粘土风格 */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索联系人..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-2xl shadow-inner shadow-purple-100/50 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-700 placeholder-gray-400 text-sm"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
      </div>

      {/* 联系人列表 */}
      <div className="space-y-3">
        {filteredContacts.map((contact, index) => (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -3 }}
            onClick={() => handleSelectCharacter(contact)}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg shadow-purple-200/30 border border-white/50 hover:shadow-xl hover:shadow-purple-300/40 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center">
              {/* 头像 */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-lg shadow-inner">
                  {contact.avatarUrl ? (
                    <Image 
                      src={contact.avatarUrl} 
                      alt={contact.name} 
                      width={48} 
                      height={48} 
                      className="rounded-full object-cover"
                      onError={(e) => {
                        // 如果图片加载失败，显示默认头像
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{contact.name[0]}</span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500"></div>
              </div>

              {/* 联系人信息 */}
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-start min-w-0">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 truncate">{contact.name}</h3>
                    <p className="text-purple-600 text-xs truncate">{contact.code}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-xs mt-1 truncate">
                  {contact.description || '暂无描述'}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg shadow-purple-200/30 border border-white/50 inline-block">
            <p className="text-gray-600">
              {searchTerm ? '未找到匹配的联系人' : '暂无联系人'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}