"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Form, Input, message, Card, Typography, Spin } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const router = useRouter();
  const { login, isLoading, user } = useAuth();
  const [error, setError] = useState('');

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
        setError(result.message);
      }
    } catch (err) {
      setError('登录过程中发生错误');
    }
  };

  // 如果用户已经登录，显示加载状态直到重定向
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-4">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
        <div className="text-center mb-8">
          <Title level={2} className="!mb-2">欢迎回来</Title>
          <Text type="secondary">登录您的账户以继续</Text>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

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
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input 
              prefix={<MailOutlined className="text-gray-400" />} 
              placeholder="邮箱地址" 
              size="large"
              className="rounded-xl"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="密码"
              size="large"
              className="rounded-xl"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              loading={isLoading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 border-0"
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-6">
          <Text type="secondary">还没有账户？</Text>{' '}
          <Link href="/signup" className="text-blue-500 hover:text-blue-700 font-medium">
            立即注册
          </Link>
        </div>
      </Card>
    </div>
  );
}