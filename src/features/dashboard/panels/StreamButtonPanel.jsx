import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function StreamButtonPanel({ onLaunchClick, isStreaming }) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (isStreaming) {
            // Navigate to active mission page when streaming
            navigate('/missions/active');
        } else {
            onLaunchClick?.();
        }
    };

    return (
        <div
            className={`w-full h-full bg-[#1c222c] rounded-[24px] border flex flex-col items-center justify-center select-none shadow-lg transition-all cursor-pointer ${
                isStreaming
                    ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:bg-[#1e2a2e] active:scale-[0.98]'
                    : 'border-[#2a3240] hover:bg-[#252b36] active:scale-[0.98]'
            }`}
            onClick={handleClick}
        >

            <img 
                src="/src/assets/btn_launch.png" 
                alt="Stream" 
                className={`h-[281px] w-[246px] object-contain drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] transition-all ${
                    isStreaming ? 'opacity-90 saturate-[1.5] hue-rotate-[130deg] scale-[1.02] animate-pulse' : ''
                }`} 
            />

            <h2 className={`text-[28px] font-black mt-4 tracking-widest transition-colors ${
                isStreaming
                    ? 'text-emerald-500 drop-shadow-[0_2px_10px_rgba(16,185,129,0.4)]'
                    : 'text-[#ea580c] drop-shadow-[0_2px_10px_rgba(234,88,12,0.3)]'
            }`}>
                {isStreaming ? 'STREAMING' : 'Quick Launch'}
            </h2>

        </div>
    );
}
