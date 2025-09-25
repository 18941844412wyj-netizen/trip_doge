"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
          router.push('/chat');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50">
      <div className="text-center">
        <div className="text-4xl font-bold text-gray-800 mb-4">TripDoge</div>
        <div className="text-gray-600">正在重定向...</div>
      </div>
    </div>
  );
}