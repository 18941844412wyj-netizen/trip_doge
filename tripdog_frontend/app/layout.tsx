import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {AuthProvider} from '@/contexts/AuthContext';
import {App as AntApp} from 'antd';
import React from "react";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "你身边的AI宠物伙伴 | TripDoge",
    description: "一个永不离开、持续成长、高度个性化的AI宠物伙伴",
    authors: [
        {
            name: "netizen",
            url: "https://github.com/18941844412wyj-netizen"
        },
        {
            name: "kson",
            url: "https://github.com/"
        },
        {
            name: "LuckyFish",
            url: "https://github.com/lijiajunply"
        },
    ],
    keywords: "nextjs, react, AI, Trip, TripDoge",
};

export default function RootLayout({children,}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        <AuthProvider>
            <AntApp>
                {children}
            </AntApp>
        </AuthProvider>
        </body>
        </html>
    );
}
