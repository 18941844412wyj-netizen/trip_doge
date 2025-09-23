import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {default: "人生只需一场旅行", template: "%s | TripDoge"},
    description: "我们来自“七牛云官方队”由前端、后端、产品三位伙伴共同完成该AI虚拟角色产品。",
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
    keywords: "nextjs, react, AI, Trip, TripDoge"
};

export default function RootLayout({children,}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        {children}
        </body>
        </html>
    );
}
