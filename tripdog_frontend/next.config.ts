import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    transpilePackages: ['@lobehub/tts', '@lobehub/ui'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'trip-doge-backend.zeabur.app',
            }
        ],
    },
};

export default nextConfig;