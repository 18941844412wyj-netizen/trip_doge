"use client";

import React, {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/contexts';
import {Button, Form, Input, Card, Typography, Space, App} from 'antd';
import {MailOutlined, LockOutlined, UserOutlined, SafetyCertificateOutlined} from '@ant-design/icons';
import Link from 'next/link';
import ModalSliderCaptcha from '@/components/ModalSliderCaptcha';

const {Title, Text} = Typography;

function Countdown({value, format, onFinish}: { value: number, format: string, onFinish: () => void }) {
    const [remaining, setRemaining] = useState(0);
    
    useEffect(() => {
        setRemaining(Math.max(0, Math.floor((value - Date.now()) / 1000)));
    }, [value]);

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
    const [showCaptcha, setShowCaptcha] = useState(false); // 控制滑动验证码弹窗显示

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

    const handleSendCode = async () => {
        const email = form.getFieldValue('email');
        if (!email) {
            message.error('请输入邮箱地址');
            return;
        }

        // 显示滑动验证码
        setShowCaptcha(true);
    };

    // 滑动验证码验证通过后的回调
    const handleCaptchaSuccess = async () => {
        // 关闭滑动验证码弹窗
        setShowCaptcha(false);
        
        try {
            setIsSendingCode(true);
            const email = form.getFieldValue('email');
            const result = await sendEmailCode(email);
            if (result.success) {
                message.success('验证码已发送，请查收邮箱');
                setCountdown(Date.now() + 60 * 1000); // 60秒倒计时
            } else {
                message.error(result.message);
            }
        } catch {
            message.error('发送验证码失败');
        } finally {
            setIsSendingCode(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-4">
            <Card className="w-full max-w-md shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
                <div className="text-center mb-6">
                    <Title level={2}>用户注册</Title>
                    <Text type="secondary">欢迎加入TripDoge</Text>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <Form
                    form={form}
                    name="signup"
                    onFinish={onFinish}
                    layout="vertical"
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
                            placeholder="邮箱"
                            size="large"
                            className="rounded-xl"
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
                            className="rounded-xl"
                        />
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
                            className="rounded-xl"
                        />
                    </Form.Item>

                    <Form.Item
                        name="code"
                        rules={[{required: true, message: '请输入验证码'}]}
                    >
                        <Input
                            prefix={<SafetyCertificateOutlined className="text-gray-400"/>}
                            placeholder="验证码"
                            size="large"
                            className="rounded-xl"
                            suffix={
                                <Button
                                    onClick={handleSendCode}
                                    disabled={!!countdown || isSendingCode}
                                    loading={isSendingCode}
                                    size="small"
                                    className="rounded-lg"
                                >
                                    {countdown ? <Countdown value={countdown} format="ss" onFinish={() => setCountdown(0)}/> : '发送'}
                                </Button>
                            }
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isLoading}
                            size="large"
                            className="w-full rounded-xl bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 border-0"
                        >
                            注册
                        </Button>
                    </Form.Item>
                </Form>

                <div className="text-center mt-4">
                    <Space>
                        <Text type="secondary">已有账户?</Text>
                        <Link href="/login" className="text-orange-500 hover:text-orange-600 font-medium">
                            立即登录
                        </Link>
                    </Space>
                </div>
            </Card>

            {/* 滑动验证码弹窗 */}
            <ModalSliderCaptcha
                open={showCaptcha}
                onCancel={() => setShowCaptcha(false)}
                onVerify={async () => {
                    handleCaptchaSuccess();
                    return Promise.resolve(true);
                }}
            />
        </div>
    );
}