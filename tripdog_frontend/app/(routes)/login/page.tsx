"use client";

import React, {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/contexts/AuthContext';
import {Button, Form, Input, Card, Typography, Spin, App} from 'antd';
import {MailOutlined, LockOutlined} from '@ant-design/icons';
import Link from 'next/link';

const {Title, Text} = Typography;

export default function LoginPage() {
    const {message} = App.useApp();
    const [form] = Form.useForm();
    const router = useRouter();
    const {login, isLoading, user} = useAuth();

    // 如果用户已经登录，重定向到聊天页面
    useEffect(() => {
        if (user) {
            router.push('/chat');
        }
    }, [user, router]);

    const onFinish = async (values: { email: string; password: string }) => {
        try {
            const result = await login(values.email, values.password);
            if (result.success) {
                message.success(result.message);
                router.push('/chat');
            } else {
                message.error(result.message);
            }
        } catch {
            message.error('登录过程中发生错误');
        }
    };

    // 如果用户已经登录，显示加载状态直到重定向
    if (user) {
        return (
            <div
                className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-4">
                <Spin size="large"/>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-4">
            <Card
                className="w-full max-w-md !rounded-2xl border border-white/30 bg-white/80 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]">
                <div className="text-center mb-8">
                    <Title level={2} className="!mb-2 !text-gray-800">欢迎回来</Title>
                    <Text type="secondary" className="!text-gray-600">登录您的账户以继续</Text>
                </div>

                <Form
                    form={form}
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                    requiredMark={false}
                >
                    <Form.Item
                        name="email"
                        rules={[
                            {required: true, message: '请输入邮箱地址'},
                            {type: 'email', message: '请输入有效的邮箱地址'}
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined className="text-gray-400"/>}
                            placeholder="邮箱地址"
                            size="large"
                            className="rounded-xl border border-white/30 bg-white/70 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{required: true, message: '请输入密码'}]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-gray-400"/>}
                            placeholder="密码"
                            size="large"
                            className="rounded-xl border border-white/30 bg-white/70 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={isLoading}
                            className="w-full rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 text-white border-0 shadow-[0_4px_12px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)] hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 transform active:scale-95"
                        >
                            登录
                        </Button>
                    </Form.Item>
                </Form>

                <div className="text-center mt-6">
                    <Text type="secondary" className="!text-gray-600">还没有账户？</Text>{' '}
                    <Link href="/signup">
                        立即注册
                    </Link>
                </div>
            </Card>
        </div>
    );
}