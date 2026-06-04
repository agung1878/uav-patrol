import React from 'react';

export default function StreamButtonPanel({ onLaunchClick, isStreaming }) {
    return (
        <div
            className={`w-full h-full bg-[#1c222c] rounded-[24px] border flex flex-col items-center justify-center select-none shadow-lg transition-all ${
                isStreaming
                    ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'border-[#2a3240] cursor-pointer hover:bg-[#252b36] active:scale-[0.98]'
            }`}
            onClick={isStreaming ? undefined : onLaunchClick}
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
