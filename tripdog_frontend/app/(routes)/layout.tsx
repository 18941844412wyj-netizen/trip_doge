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
    FileText
} from 'lucide-react';
import {useAuth} from '@/contexts';
import './layout.css'
import {useMediaQuery} from 'react-responsive';
import {MenuItemType} from "antd/es/menu/interface";


const {Header, Sider, Content} = Layout;

export default function RoutesLayout({children}: {
    children: React.ReactNode;
}) {
    const [collapsed] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const pathname = usePathname();
    const {user, isLoading} = useAuth();
    const isMobile = useMediaQuery({maxWidth: 768});

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

    // 桌面端菜单项（不包含"选择角色"）
    const desktopMenuItems: MenuItemType[] = [
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

    // 移动端菜单项（包含"选择角色"）
    const mobileMenuItems: MenuItemType[] = [
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

    const menuItems = isMobile ? mobileMenuItems : desktopMenuItems;

    const SideMenu = () => (
        <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            className="!border-r-0 md:!bg-orange-100 max-md:!bg-gradient-to-br from-yellow-50 to-orange-50"
            style={{fontSize: '16px'}}
        />
    );

    return (
        <Layout className="!min-h-screen" hasSider>
            {/* 桌面端侧边栏 */}
            <Sider style={{
                overflow: 'auto',
                height: '100vh',
                position: 'sticky',
                insetInlineStart: 0,
                top: 0,
                bottom: 0,
                scrollbarWidth: 'thin',
                scrollbarGutter: 'stable',
            }}
                   className="fixed hidden md:block !bg-orange-100"
                   theme="light"
            >
                <div className="p-4 text-center">
                    <div className="text-4xl mb-2">🐕</div>
                    {!collapsed && (
                        <h2 className="text-xl font-bold text-orange-600">
                            TripDoge
                        </h2>
                    )}
                </div>
                <SideMenu/>
            </Sider>

            <Layout>
                {/* 顶部导航栏 */}
                <Header style={{
                    padding: 0,
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    width: '100%',
                }}
                        className="!bg-gradient-to-br from-yellow-50 to-orange-50 shadow-sm px-4 flex items-center md:hidden">
                    <div className={'flex items-center'}>
                        <div className="w-2"/>
                        <Button
                            type="text"
                            size={'large'}
                            className={'!flex !flex-col !items-center !justify-center'}
                            icon={<MenuIcon size={18}/>}
                            onClick={() => setMobileDrawerOpen(true)}
                        />
                        <div className="w-2"/>
                        <h1 className="text-xl font-bold text-orange-600">
                            TripDoge
                        </h1>
                    </div>
                    <div className="w-10"/>
                </Header>

                {/* 主内容区 */}
                <Content className="bg-gradient-to-br from-yellow-50 to-orange-50">
                    {children}
                </Content>

                {/* 移动端抽屉 */}
                <Drawer
                    placement="left"
                    open={mobileDrawerOpen}
                    onClose={() => setMobileDrawerOpen(false)}
                    width={250}
                    className="!bg-gradient-to-br from-yellow-50 to-orange-50"
                    styles={{
                        body: {
                            padding: 0,
                        },
                    }}
                >
                    <div className="p-4 text-center">
                        <div className="text-4xl mb-2">🐕</div>
                        <h2 className="text-xl font-bold text-orange-600 font-comic">
                            TripDoge
                        </h2>
                    </div>
                    <Menu
                        mode="inline"
                        selectedKeys={[pathname]}
                        items={mobileMenuItems}
                        className="!border-r-0 !bg-gradient-to-br from-yellow-50 to-orange-50"
                        style={{fontSize: '16px'}}
                    />
                </Drawer>
            </Layout>
        </Layout>
    );
}