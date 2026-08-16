import React, { useRef, useEffect, useState } from 'react';

const CompassWidget = ({ heading = 0, isSmallPanel = false }) => (
    <div className={`absolute bottom-6 right-6 rounded-full bg-black/40 flex items-center justify-center ${isSmallPanel ? 'w-20 h-20' : 'w-32 h-32'}`}>
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
                src="/images/icon_nav_up.png"
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

export default function MainVideoFeedPanel({ videoStream, isStreaming, isConnecting, streamError, heading = 0, isSmallPanel = false }) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [elapsed, setElapsed] = useState(0);

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            if (containerRef.current?.requestFullscreen) {
                await containerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            }
        }
    };

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
        <div ref={containerRef} className="relative w-full h-full bg-[#1c222c] rounded-2xl border border-[#2a3240] overflow-hidden shadow-lg select-none">

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
                    style={{ backgroundImage: `url('/images/img_stream_na.png')` }}
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
                <div className="absolute inset-0 bg-[#0f131a]/90 backdrop-blur-md flex flex-col items-center justify-center z-10 p-6">
                    <div className="flex flex-col items-center justify-center bg-[#1c222c] border border-red-500/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.05)] w-full max-w-md relative overflow-hidden">
                        {/* Decorative background elements */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl"></div>

                        {/* Icon */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 flex items-center justify-center mb-5 relative z-10 shadow-inner">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>

                        {/* Title */}
                        <h3 className="text-gray-100 text-[18px] font-bold tracking-wider mb-2 uppercase relative z-10 text-center">
                            Stream Unavailable
                        </h3>

                        {/* Subtitle */}
                        <p className="text-gray-400 text-[13px] text-center mb-6 leading-relaxed relative z-10">
                            The video feed connection could not be established. Please check the drone's status or verify the stream configuration.
                        </p>

                        {/* Error details container */}
                        <div className="w-full bg-black/40 border border-red-500/10 rounded-xl p-4 relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Error Details</span>
                            </div>
                            <div className="font-mono text-red-400/90 text-[11px] break-words leading-relaxed">
                                {(() => {
                                    try {
                                        const match = streamError.match(/\{.*\}/);
                                        if (match) {
                                            const parsed = JSON.parse(match[0]);
                                            return parsed.error || parsed.detail || streamError;
                                        }
                                    } catch (e) {
                                        // fallback
                                    }
                                    return streamError;
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === Top Left Badge === */}
            <div className={`absolute top-4 left-4 z-20 bg-black/60 border border-gray-500 px-3 py-1.5 rounded uppercase flex items-center justify-center gap-2 ${isSmallPanel ? 'scale-[0.8] origin-top-left' : ''}`}>
                <span className="text-[#ea580c] text-[11px] font-bold tracking-widest">DRONE CAM</span>
                {isStreaming && (
                    <div className="flex items-center gap-1.5 ml-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-emerald-400 text-[9px] font-bold tracking-wider">LIVE</span>
                    </div>
                )}
            </div>

            {/* === Top Center Badge === */}
            {/* <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 border border-[#ea580c] px-3 py-1.5 rounded flex items-center justify-center ${isSmallPanel ? 'scale-[0.8] origin-top' : ''}`}>
                <div className="flex items-center space-x-2 text-[#ea580c]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[11px] font-bold tracking-widest uppercase">ZOOM 2.3X</span>
                </div>
            </div> */}

            {/* === Top Right Recording Badge & Fullscreen === */}
            <div className={`absolute top-4 right-4 z-20 flex gap-2 ${isSmallPanel ? 'scale-[0.8] origin-top-right' : ''}`}>
                <div className="bg-black/50 border border-gray-500 px-3 py-1 rounded flex items-center justify-center space-x-4 hidden">
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
                <button
                    onClick={toggleFullscreen}
                    className="bg-black/50 hover:bg-black/70 border border-gray-500 px-2 py-1 rounded flex items-center justify-center transition-colors"
                    title="Toggle Fullscreen"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                    </svg>
                </button>
            </div>

            {/* === Bottom Left Status === */}
            <div className={`absolute bottom-5 left-5 z-20 flex flex-col items-start bg-black/30 px-2 py-1 rounded ${isSmallPanel ? 'scale-[0.8] origin-bottom-left' : ''}`}>
                <span className="text-gray-300 text-[10px] uppercase font-bold tracking-wider drop-shadow-md">Camera Status</span>
                <span className={`text-[13px] font-semibold tracking-wide drop-shadow-md mt-0.5 ${isStreaming ? 'text-emerald-400' : isConnecting ? 'text-amber-400' : 'text-red-400'}`}>
                    {isStreaming ? 'Live Stream' : isConnecting ? 'Connecting...' : 'OFFLINE'}
                </span>
            </div>

            {/* === Bottom Right Compass === */}
            <CompassWidget heading={heading} isSmallPanel={isSmallPanel} />
        </div>
    );
}
