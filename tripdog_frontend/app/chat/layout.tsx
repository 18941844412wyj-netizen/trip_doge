// app/chat/layout.tsx
"use client";

import React, {useEffect, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Layout, Menu, message} from 'antd';
import {
    MessageCircle,
    History as HistoryIcon,
    Settings,
    FileText
} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';
import Characters from "@/components/characters/Characters";
import {rolesApi} from "@/services/api";
import {RoleInfoVO} from "@/types";

const {Content} = Layout;

export default function ChatLayout({children,}: { children: React.ReactNode; }) {
    const pathname = usePathname();
    const {user, isLoading} = useAuth();
    const [contacts, setContacts] = useState<RoleInfoVO[]>([]);

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            const response = await rolesApi.list();

            if (response.success) {
                setContacts(response.data);
            } else {
                message.error(response.message || '获取角色列表失败');
            }
        } catch  {
            message.error('网络错误，请稍后重试');
        }
    };

    // 如果用户未认证，则不显示菜单
    if (isLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
                <div className="text-xl font-bold text-orange-600">加载中...</div>
            </div>
        );
    }

    if (!user) {
        // 不显示菜单，直接渲染子组件
        return (
            <Layout className="!min-h-screen">
                <Content className="bg-gradient-to-br from-yellow-50 to-orange-50">
                    {children}
                </Content>
            </Layout>
        );
    }

    const menuItems = [
        {
            key: '/chat',
            icon: <MessageCircle className="w-4 h-4"/>,
            label: <Link href="/chat">开始对话</Link>,
        },
        {
            key: '/files',
            icon: <FileText className="w-4 h-4"/>,
            label: <Link href="/files">文件管理</Link>,
        },
        {
            key: '/history',
            icon: <HistoryIcon className="w-4 h-4"/>,
            label: <Link href="/history">历史记录</Link>,
        },
        {
            key: '/settings',
            icon: <Settings className="w-4 h-4"/>,
            label: <Link href="/settings">设置</Link>,
        },
    ];

    const SideMenu = () => (
        <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            className="!border-r-0 !bg-orange-100"
            style={{fontSize: '16px'}}
        />
    );


    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* 左侧导航栏 */}
            <div className="w-47 hidden md:flex bg-orange-100 flex-col items-center py-4 space-y-4">
                <div className="p-4 w-full text-center">
                    <div className="text-4xl mb-2">🐕</div>
                    <h2 className="text-xl font-bold text-orange-600">
                        TripDoge
                    </h2>
                </div>
                <div className="flex-1 w-full overflow-y-auto">
                    <SideMenu/>
                </div>
            </div>

            {/* 助手列表侧边栏 */}
            <div className="w-60 hidden md:flex flex-col bg-orange-100">
                <Characters contacts={contacts}/>
            </div>

            {/* 主内容区域 */}
            <div className="flex-1 bg-gradient-to-br from-yellow-50 to-orange-50">
                {children}
            </div>
        </div>
    );
}