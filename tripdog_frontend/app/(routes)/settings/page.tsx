"use client";

import { Button, Card, Typography, message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const { Title } = Typography;

export default function Setting() {
    const { logout, user } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            message.success('登出成功');
            router.push('/login');
        } catch {
            message.error('登出失败');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-6">
            <div className="max-w-2xl mx-auto pt-12">
                <Card className="shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
                    <Title level={2} className="text-center mb-8">设置</Title>
                    
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                        <h3 className="font-semibold text-lg mb-2">当前用户</h3>
                        <p className="text-gray-700">昵称: {user?.nickname}</p>
                        <p className="text-gray-700">邮箱: {user?.email}</p>
                    </div>
                    
                    <div className="flex justify-center">
                        <Button 
                            type="primary" 
                            danger
                            onClick={handleLogout}
                            className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 border-0"
                        >
                            登出
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}