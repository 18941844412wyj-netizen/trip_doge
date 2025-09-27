"use client";

import React, {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/contexts/AuthContext';
import {Button, Form, Input, Card, Typography, Space, App} from 'antd';
import {MailOutlined, LockOutlined, UserOutlined, SafetyCertificateOutlined} from '@ant-design/icons';
import Link from 'next/link';

const {Title, Text} = Typography;

function Countdown({value, format, onFinish}: { value: number, format: string, onFinish: () => void }) {
    const [remaining, setRemaining] = useState(Math.max(0, Math.floor((value - Date.now()) / 1000)));

    useEffect(() => {
        if (remaining <= 0) {
            onFinish();
            return;
        }

        const timer = setInterval(() => {
            setRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onFinish();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [remaining, onFinish]);

    return <span>{remaining}秒后重试</span>;
}

export default function SignupPage() {
    const {message} = App.useApp();
    const [form] = Form.useForm();
    const router = useRouter();
    const {register, sendEmailCode, isLoading, user} = useAuth();
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isSendingCode, setIsSendingCode] = useState(false);

    // 如果用户已经登录，重定向到聊天页面
    useEffect(() => {
        if (user) {
            router.push('/chat');
        }
    }, [user, router]);

    const onFinish = async (values: { email: string; password: string; nickname: string; code: string }) => {
        try {
            const result = await register(values.email, values.password, values.nickname, values.code);
            if (result.success) {
                message.success(result.message);
                router.push('/chat');
            } else {
                setError(result.message);
            }
        } catch {
            setError('注册过程中发生错误');
        }
    };

    const onSendCode = async () => {
        try {
            setIsSendingCode(true); // 开始发送验证码时设置为 true
            const email = form.getFieldValue('email');
            if (!email) {
                message.error('请输入邮箱地址');
                return;
            }
            const emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailValidation.test(email)) {
                message.error('请输入有效的邮箱地址');
                return;
            }
            const result = await sendEmailCode(email);
            if (result.success) {
                message.success(result.message);
                setCountdown(Date.now() + 60000); // 60秒倒计时
            } else {
                message.error(result.message);
            }
        } catch (err) {
            message.error('发送验证码失败');
        } finally {
            setIsSendingCode(false); // 无论成功失败都重置状态
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-4">
            <Card
                className="w-full max-w-md !rounded-2xl border border-white/30 bg-white/80 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]">
                <div className="text-center mb-8">
                    <Title level={2} className="!mb-2 !text-gray-800">创建账户</Title>
                    <Text type="secondary" className="!text-gray-600">填写信息开始您的旅程</Text>
                </div>

                {error && (
                    <div
                        className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]">
                        {error}
                    </div>
                )}

                <Form
                    form={form}
                    name="register"
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
                        name="nickname"
                        rules={[{required: true, message: '请输入昵称'}]}
                    >
                        <Input
                            prefix={<UserOutlined className="text-gray-400"/>}
                            placeholder="昵称"
                            size="large"
                            className="rounded-xl border border-white/30 bg-white/70 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]"
                        />
                    </Form.Item>

                    <Form.Item
                        name="code"
                        rules={[{required: true, message: '请输入验证码'}]}
                    >
                        <Space.Compact style={{width: '100%'}}>
                            <Input
                                prefix={<SafetyCertificateOutlined className="text-gray-400"/>}
                                placeholder="验证码"
                                size="large"
                                className="rounded-l-xl flex-1 border border-white/30 bg-white/70 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]"
                            />
                            <Button
                                size="large"
                                htmlType="button"
                                onClick={onSendCode}
                                disabled={countdown > Date.now() || isSendingCode} // 添加 isSendingCode 条件
                                loading={isSendingCode} // 添加 loading 状态
                                className="rounded-r-xl bg-gradient-to-br from-blue-400 to-blue-500 text-white border-0 shadow-[0_4px_12px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.5),inset_0_2px_4px_rgba(255,255,255,0.4)]"
                            >
                                {countdown > Date.now() ? (
                                    <Countdown
                                        value={countdown}
                                        format="s秒后重试"
                                        onFinish={() => setCountdown(0)}
                                    />
                                ) : '发送验证码'}
                            </Button>
                        </Space.Compact>
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            {required: true, message: '请输入密码'},
                            {min: 6, message: '密码至少6位'}
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-gray-400"/>}
                            placeholder="密码"
                            size="large"
                            className="rounded-xl border border-white/30 bg-white/70 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.8)]"
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirm"
                        dependencies={['password']}
                        rules={[
                            {required: true, message: '请确认密码'},
                            ({getFieldValue}) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次输入的密码不一致'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="text-gray-400"/>}
                            placeholder="确认密码"
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
                            注册
                        </Button>
                    </Form.Item>
                </Form>

                <div className="text-center mt-6">
                    <Text type="secondary" className="!text-gray-600">已有账户？</Text>{' '}
                    <Link href="/login">
                        立即登录
                    </Link>
                </div>
            </Card>
        </div>
    );
}