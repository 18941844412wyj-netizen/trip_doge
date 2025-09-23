// app/(routes)/layout.tsx
"use client";

import React, {useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Layout, Menu, Button, Drawer} from 'antd';
import {
    MessageCircle,
    Users,
    History as HistoryIcon,
    Settings,
    Menu as MenuIcon,
} from 'lucide-react';

const {Header, Sider, Content} = Layout;

export default function RoutesLayout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    const [collapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const pathname = usePathname();

    const menuItems = [
        {
            key: '/characters',
            icon: <Users className="w-4 h-4"/>,
            label: <Link href="/characters">选择角色</Link>,
        },
        {
            key: '/chat',
            icon: <MessageCircle className="w-4 h-4"/>,
            label: <Link href="/chat">开始对话</Link>,
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
            className="border-r-0 bg-transparent"
            style={{fontSize: '16px'}}
        />
    );

    return (
        <Layout className="!h-screen">
            {/* 桌面端侧边栏 */}
            <Sider
                className="hidden md:block !h-full"
                theme="light"
                style={{
                    borderRight: '2px solid #FFA500',
                }}
            >
                <div className="p-4 text-center"
                     style={{background: 'linear-gradient(180deg, #FFE5B4 0%, #FFDAB9 100%)',}}>
                    <div className="text-4xl mb-2">🐕</div>
                    {!collapsed && (
                        <h2 className="text-xl font-bold text-orange-600 font-comic">
                            TripDoge
                        </h2>
                    )}
                </div>
                <SideMenu/>
            </Sider>

            {/* 移动端抽屉 */}
            <Drawer
                placement="left"
                open={mobileDrawerOpen}
                onClose={() => setMobileDrawerOpen(false)}
                width={250}
                className="md:hidden"
                styles={{
                    body: {
                        padding: 0,
                        background: 'linear-gradient(180deg, #FFE5B4 0%, #FFDAB9 100%)',
                    },
                }}
            >
                <div className="p-4 text-center">
                    <div className="text-4xl mb-2">🐕</div>
                    <h2 className="text-xl font-bold text-orange-600 font-comic">
                        TripDoge
                    </h2>
                </div>
                <SideMenu/>
            </Drawer>

            <Layout>
                {/* 顶部导航栏 */}
                <Header className="bg-white shadow-sm px-4 flex items-center justify-between md:hidden">
                    <Button
                        type="text"
                        icon={<MenuIcon className="w-5 h-5"/>}
                        onClick={() => setMobileDrawerOpen(true)}
                    />
                    <h1 className="text-lg font-bold text-orange-600 font-comic">
                        TripDoge
                    </h1>
                    <div className="w-10"/>
                </Header>

                {/* 主内容区 */}
                <Content className="bg-gradient-to-br from-yellow-50 to-orange-50">
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}