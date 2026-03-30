import React from 'react';

export default function StreamButtonPanel({ onLaunchClick }) {
    return (
        <div
            className="w-full h-full bg-[#1c222c] rounded-[24px] border border-[#2a3240] flex flex-col items-center justify-center select-none shadow-lg cursor-pointer hover:bg-[#252b36] transition-colors active:scale-[0.98]"
            onClick={onLaunchClick}
        >

            <img src="/src/assets/btn_launch.png" alt="Stream" className="h-[281px] w-[246px] object-contain drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]" />

            <h2 className="text-[#ea580c] text-[28px] font-black mt-4 tracking-widest drop-shadow-[0_2px_10px_rgba(234,88,12,0.3)]">
                Quick Launch
            </h2>

        </div>
    );
}
