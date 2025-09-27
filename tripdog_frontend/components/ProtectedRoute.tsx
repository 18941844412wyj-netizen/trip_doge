// components/ProtectedRoute.tsx
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Spin } from 'antd';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  console.log('ProtectedRoute - 用户状态:', { user, isLoading });

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('重定向到登录页面');
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4 text-xl font-bold text-orange-600">加载中...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}