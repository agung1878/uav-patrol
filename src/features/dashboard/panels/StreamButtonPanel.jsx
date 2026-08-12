import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StreamButtonPanel({ onLaunchClick, isStreaming, upcomingMission, activeMission, selectedTelemetry }) {
    const navigate = useNavigate();
    
    // States: 'idle', 'countdown', 'waiting_drone', 'streaming'
    const [panelState, setPanelState] = useState(() => {
        const runtime = selectedTelemetry?.mission_status?.runtime_status;
        const hasRunningMission = activeMission || (runtime && runtime !== 'Completed' && runtime !== 'PreparingDock' && runtime !== 'Idle' && runtime !== 'Waiting');
        if (hasRunningMission) return 'streaming';
        return 'idle';
    });
    const [countdown, setCountdown] = useState(null);

    // Watch telemetry events for state changes
    useEffect(() => {
        const missionStatus = selectedTelemetry?.mission_status;
        const missionEvent = selectedTelemetry?.mission_event;
        const runtime = missionStatus?.runtime_status;

        if (runtime === 'Completed') {
            setPanelState('idle');
        } else if (missionEvent?.event === 'takeoff') {
            setPanelState('streaming');
        } else if (activeMission || (runtime && runtime !== 'Completed' && runtime !== 'PreparingDock' && runtime !== 'Idle' && runtime !== 'Waiting')) {
            // Restore streaming state if remounted while mission is already running
            setPanelState('streaming');
        }
    }, [selectedTelemetry?.mission_status?.runtime_status, selectedTelemetry?.mission_event?.event, activeMission]);

    // Handle isStreaming prop fallback
    useEffect(() => {
        if (isStreaming && panelState !== 'streaming') {
            const runtime = selectedTelemetry?.mission_status?.runtime_status;
            const hasRunningMission = activeMission || (runtime && runtime !== 'Completed' && runtime !== 'PreparingDock' && runtime !== 'Idle' && runtime !== 'Waiting');
            if (hasRunningMission) {
                setPanelState('streaming');
            }
        }
    }, [isStreaming, panelState, activeMission, selectedTelemetry]);

    // Handle countdown timer
    useEffect(() => {
        // Only run countdown logic if idle or already counting down
        if (panelState === 'streaming' || panelState === 'waiting_drone') {
             return;
        }

        if (!upcomingMission || !upcomingMission.run_at) {
            if (panelState === 'countdown') {
                setPanelState('idle');
            }
            return;
        }
        
        const runAtTime = new Date(upcomingMission.run_at).getTime();
        
        const updateCountdown = () => {
            const now = new Date().getTime();
            const diff = Math.floor((runAtTime - now) / 1000);
            
            if (diff > 0 && diff <= 60) {
                if (panelState !== 'countdown') setPanelState('countdown');
                setCountdown(diff);
            } else if (diff <= 0) {
                if (panelState === 'countdown' || panelState === 'idle') {
                    setPanelState('waiting_drone');
                }
            }
        };
        
        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        
        return () => clearInterval(interval);
    }, [upcomingMission, panelState]);

    const handleClick = () => {
        if (panelState === 'countdown' || panelState === 'waiting_drone') return; // Disable click
        if (panelState === 'streaming') {
            navigate('/missions/active');
        } else {
            onLaunchClick?.();
        }
    };

    if (panelState === 'countdown') {
        return (
            <div className="w-full h-full bg-[#1c222c] rounded-[24px] border border-amber-500/50 flex flex-col items-center justify-center select-none shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all">
                <div className="text-amber-500 text-[64px] font-black tracking-tighter leading-none mb-2 tabular-nums">
                    {String(countdown).padStart(2, '0')}
                </div>
                <h3 className="text-amber-400/80 text-[14px] font-bold uppercase tracking-widest text-center px-4 truncate w-full">
                    {upcomingMission?.mission_name || 'Mission Run'}
                </h3>
                <div className="text-amber-500/50 text-[10px] font-bold uppercase tracking-widest mt-1 animate-pulse">
                    Taking Off Soon
                </div>
            </div>
        );
    }

    if (panelState === 'waiting_drone') {
        return (
            <div className="w-full h-full bg-[#1c222c] rounded-[24px] border border-amber-500/50 flex flex-col items-center justify-center select-none shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all">
                <div className="text-amber-500 text-[64px] font-black tracking-tighter leading-none mb-2 tabular-nums animate-pulse">
                    00
                </div>
                <h3 className="text-amber-400/80 text-[14px] font-bold uppercase tracking-widest text-center px-4 truncate w-full">
                    {upcomingMission?.mission_name || 'Mission Run'}
                </h3>
                <div className="text-amber-500/50 text-[10px] font-bold uppercase tracking-widest mt-1 animate-bounce">
                    Waiting Drone ...
                </div>
            </div>
        );
    }

    const isStreamActive = panelState === 'streaming';

    return (
        <div
            className={`w-full h-full bg-[#1c222c] rounded-[24px] border flex flex-col items-center justify-center select-none shadow-lg transition-all cursor-pointer ${isStreamActive
                ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:bg-[#1e2a2e] active:scale-[0.98]'
                : 'border-[#2a3240] hover:bg-[#252b36] active:scale-[0.98]'
                }`}
            onClick={handleClick}
        >

            <img
                src="/images/btn_launch.png"
                alt="Stream"
                className={`flex-1 pt-8 w-auto h-auto min-h-0 max-h-[281px] object-contain drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] transition-all pb-2 ${isStreamActive ? 'opacity-90 saturate-[1.5] hue-rotate-[130deg] scale-[1.02] animate-pulse' : ''
                    }`}
            />

            <h2 className={`text-[20px] pb-4 2xl:text-[28px] font-black mt-2 tracking-widest transition-colors ${isStreamActive
                ? 'text-emerald-500 drop-shadow-[0_2px_10px_rgba(16,185,129,0.4)]'
                : 'text-[#ea580c] drop-shadow-[0_2px_10px_rgba(234,88,12,0.3)]'
                }`}>
                {isStreamActive ? 'STREAMING' : 'Quick Launch'}
            </h2>

        </div>
    );
}
