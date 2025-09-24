// components/ClayCard.tsx
import React from 'react';
import './ClayCard.css'; // 假设样式在单独的 CSS 文件中

interface ClayCardProps {
    children: React.ReactNode;
    className?: string;
    elevation?: number; // 控制阴影层级
    color?: string;     // 主色调，用于背景或渐变
}

const ClayCard: React.FC<ClayCardProps> = ({
                                               children,
                                               className = '',
                                               elevation = 1,
                                               color = '#6a1b9a'
                                           }) => {
    return (
        <div
            className={`clay-card ${className}`}
            style={{
                backgroundColor: color,
                boxShadow: getShadow(elevation),
                borderRadius: '24px',
                overflow: 'hidden',
                transition: 'all 0.2s ease-in-out',
            }}
        >
            {children}
        </div>
    );
};

// 根据 elevation 生成不同的阴影
const getShadow = (level: number) => {
    const shadows = [
        '0 2px 8px rgba(0,0,0,0.1), inset 0 -1px 3px rgba(255,255,255,0.2)',
        '0 4px 12px rgba(0,0,0,0.15), inset 0 -2px 6px rgba(255,255,255,0.25)',
        '0 8px 20px rgba(0,0,0,0.2), inset 0 -3px 10px rgba(255,255,255,0.3)',
    ];
    return shadows[level - 1] || shadows[0];
};

export default ClayCard;
