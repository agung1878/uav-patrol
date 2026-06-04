import React, { useRef, useEffect, useState } from 'react';

const CompassWidget = ({ heading = 0 }) => (
    <div className="absolute bottom-6 right-6 w-32 h-32 rounded-full bg-black/40 flex items-center justify-center">
        <div className="relative w-full h-full rounded-full border border-gray-400/50 flex items-center justify-center">
            {/* Compass Marks */}
            <span className="absolute top-2 text-[11px] text-gray-200 font-bold uppercase tracking-widest">N</span>
            <span className="absolute right-2 text-[11px] text-gray-200 font-bold uppercase tracking-widest">E</span>
            <span className="absolute bottom-2 text-[11px] text-gray-200 font-bold uppercase tracking-widest">S</span>
            <span className="absolute left-2 text-[11px] text-gray-200 font-bold uppercase tracking-widest">W</span>
            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-gray-500/50"></div>
            <div className="absolute h-full w-[1px] bg-gray-500/50"></div>
            {/* Center Arrow */}
            <img
                src="/src/assets/icon_nav_up.png"
                alt="Compass"
                className="absolute w-8 h-8 object-contain transition-transform duration-300"
                style={{ transform: `rotate(${heading}deg)` }}
            />
            {/* Outer grid circles */}
            <div className="absolute w-[60%] h-[60%] rounded-full border border-gray-500/50"></div>
            <div className="absolute w-[30%] h-[30%] rounded-full border border-gray-500/50"></div>

            {/* Angle markers */}
            {[...Array(12)].map((_, i) => (
                <div key={i} className="absolute w-full h-[2px] flex justify-between px-1" style={{ transform: `rotate(${i * 30}deg)` }}>
                    <div className="w-1.5 h-full bg-gray-400"></div>
                    <div className="w-1.5 h-full bg-gray-400"></div>
                </div>
            ))}
        </div>
    </div>
);

/**
 * Format elapsed seconds into HH:MM:SS
 */
function formatElapsed(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

export default function MainVideoFeedPanel({ videoStream, isStreaming, isConnecting, streamError, heading = 0 }) {
    const videoRef = useRef(null);
    const [elapsed, setElapsed] = useState(0);

    // Attach the MediaStream to the <video> element when it arrives
    useEffect(() => {
        if (videoRef.current && videoStream) {
            videoRef.current.srcObject = videoStream;
        }
    }, [videoStream]);

    // Elapsed timer while streaming
    useEffect(() => {
        if (!isStreaming) {
            setElapsed(0);
            return;
        }
        const interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
        return () => clearInterval(interval);
    }, [isStreaming]);

    return (
        <div className="relative w-full h-full bg-[#1c222c] rounded-2xl border border-[#2a3240] overflow-hidden shadow-lg select-none">

            {/* === Live WebRTC Video === */}
            {(isStreaming || isConnecting) && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />
            )}

            {/* === Placeholder (shown when NOT streaming) === */}
            {!isStreaming && !isConnecting && (
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url('/src/assets/img_dummy.png')` }}
                />
            )}

            {/* === Connecting Overlay === */}
            {isConnecting && !isStreaming && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
                    <div className="w-10 h-10 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                    <span className="text-gray-300 text-[13px] font-medium tracking-wide">Connecting to stream...</span>
                </div>
            )}

            {/* === Error Overlay === */}
            {streamError && !isStreaming && !isConnecting && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-80">
                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span className="text-red-400 text-[12px] font-medium max-w-[60%] text-center">{streamError}</span>
                </div>
            )}

            {/* === Top Left Badge === */}
            <div className="absolute top-4 left-4 z-20 bg-black/60 border border-gray-500 px-3 py-1.5 rounded uppercase flex items-center justify-center gap-2">
                <span className="text-[#ea580c] text-[11px] font-bold tracking-widest">DRONE CAM</span>
                {isStreaming && (
                    <div className="flex items-center gap-1.5 ml-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-emerald-400 text-[9px] font-bold tracking-wider">LIVE</span>
                    </div>
                )}
            </div>

            {/* === Top Center Badge === */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 border border-[#ea580c] px-3 py-1.5 rounded flex items-center justify-center">
                <div className="flex items-center space-x-2 text-[#ea580c]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[11px] font-bold tracking-widest uppercase">ZOOM 2.3X</span>
                </div>
            </div>

            {/* === Top Right Recording Badge === */}
            <div className="absolute top-4 right-4 z-20 bg-black/50 border border-gray-500 px-3 py-1 rounded flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isStreaming ? 'bg-red-600 animate-pulse' : 'bg-gray-600'} mt-[1px]`}></div>
                    <span className="text-gray-100 text-[11px] font-bold uppercase tracking-wider">
                        {isStreaming ? 'Recording' : 'Standby'}
                    </span>
                </div>
                <span className="text-gray-100 text-[11px] font-mono font-bold tracking-widest pt-[2px]">
                    {formatElapsed(elapsed)}
                </span>
            </div>

            {/* === Bottom Left Status === */}
            <div className="absolute bottom-5 left-5 z-20 flex flex-col items-start bg-black/30 px-2 py-1 rounded">
                <span className="text-gray-300 text-[10px] uppercase font-bold tracking-wider drop-shadow-md">Camera Status</span>
                <span className={`text-[13px] font-semibold tracking-wide drop-shadow-md mt-0.5 ${isStreaming ? 'text-emerald-400' : isConnecting ? 'text-amber-400' : 'text-gray-400'}`}>
                    {isStreaming ? 'Live Stream' : isConnecting ? 'Connecting...' : 'Offline'}
                </span>
            </div>

            {/* === Bottom Right Compass === */}
            <CompassWidget heading={heading} />
        </div>
    );
}
