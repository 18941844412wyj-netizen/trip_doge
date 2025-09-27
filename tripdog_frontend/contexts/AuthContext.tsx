"use client";

import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {userApi} from '@/services/api';
import {UserInfoVO} from '@/types';

interface AuthContextType {
    user: UserInfoVO | null;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
    register: (email: string, password: string, nickname: string, code: string) => Promise<{
        success: boolean;
        message: string
    }>;
    sendEmailCode: (email: string) => Promise<{ success: boolean; message: string }>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({children}: { children: ReactNode }) {
    const [user, setUser] = useState<UserInfoVO | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 初始化时从localStorage恢复用户信息
    useEffect(() => {
        checkUserStatus();
    }, []);

    const checkUserStatus = async () => {
        try {
            const response = await userApi.getInfo();
            console.log('检查用户状态响应:', response);
            if (response.success) {
                console.log('设置用户状态:', response.data);
                setUser(response.data);
            } else {
                console.log('用户未登录或会话已过期');
                // 清除存储的用户信息
                localStorage.removeItem('user');
            }
        } catch (error) {
            console.error('检查用户状态失败:', error);
            // 清除存储的用户信息
            localStorage.removeItem('user');
        } finally {
            console.log('结束检查用户状态');
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            const response = await userApi.login({email, password});

            if (response.code === 0) {
                setUser(response.data);
                return {success: true, message: '登录成功'};
            } else {
                return {success: false, message: response.message};
            }
        } catch (error) {
            console.error('登录失败:', error);
            return {success: false, message: '登录失败，请稍后重试'};
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await userApi.logout();
            setUser(null);
        } catch (error) {
            console.error('登出失败:', error);
            setUser(null);
            // 即使API调用失败，也清除本地用户状态
            localStorage.removeItem('user');
        }
    };

    const register = async (email: string, password: string, nickname: string, code: string) => {
        try {
            setIsLoading(true);
            const response = await userApi.register({email, password, nickname, code});

            if (response.code === 0) {
                setUser(response.data);
                return {success: true, message: '注册成功'};
            } else {
                return {success: false, message: response.message};
            }
        } catch (error) {
            console.error('注册失败:', error);
            return {success: false, message: '注册失败，请稍后重试'};
        } finally {
            setIsLoading(false);
        }
    };

    const sendEmailCode = async (email: string) => {
        try {
            const response = await userApi.sendEmail({email});

            if (response.code === 0) {
                return {success: true, message: '验证码已发送'};
            } else {
                return {success: false, message: response.message};
            }
        } catch (error) {
            console.error('发送验证码失败:', error);
            return {success: false, message: '发送验证码失败，请稍后重试'};
        }
    };

    const value = {
        user,
        login,
        logout,
        register,
        sendEmailCode,
        isLoading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}