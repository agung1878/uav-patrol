import React, { useState, useEffect, useRef, useCallback } from 'react';
import MainVideoFeedPanel from '../../dashboard/panels/MainVideoFeedPanel';
import MapViewPanel from '../../dashboard/panels/MapViewPanel';
import useDetectionStream from '../../../shared/hooks/useDetectionStream';
import useTelemetry from '../../../shared/hooks/useTelemetry';
import { uavService } from '../../../services/api';
import useDockStream from '../../../shared/hooks/useDockStream';

// Mock components for the right sidebar and controls
const DockCamPanel = () => {
    const { videoStream, isStreaming, isConnecting, streamError } = useDockStream();
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && videoStream) {
            videoRef.current.srcObject = videoStream;
        }
    }, [videoStream]);

    return (
        <div className="relative w-full h-full bg-black overflow-hidden rounded-[24px]">
            {/* Live Video */}
            {(isStreaming || isConnecting) && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />
            )}

            {/* Placeholder (shown when NOT streaming) */}
            {!isStreaming && !isConnecting && (
                <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url('/src/assets/dock_cam_placeholder.png')`, backgroundColor: '#111' }} />
            )}

            {/* Connecting Overlay */}
            {isConnecting && !isStreaming && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
                    <div className="w-8 h-8 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-3"></div>
                    <span className="text-gray-300 text-[11px] font-medium tracking-wide">Connecting Dock...</span>
                </div>
            )}

            {/* Error Overlay */}
            {streamError && !isStreaming && !isConnecting && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-80">
                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span className="text-red-400 text-[10px] font-medium max-w-[80%] text-center">{streamError}</span>
                </div>
            )}

            <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/50 border border-orange-500/30 rounded text-[10px] uppercase font-bold text-orange-500 tracking-wider z-20">
                Dock Cam
            </div>
            {isStreaming && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 px-2 py-0.5 rounded border border-emerald-500/30 z-20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-emerald-400 text-[9px] font-bold tracking-wider">LIVE</span>
                </div>
            )}
        </div>
    );
};

const WeatherWidget = () => (
    <div className="p-4 flex flex-col justify-between h-full bg-[#111827]">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="text-yellow-400">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c-2.76 0-5 2.24-5 5 0 .65.13 1.26.36 1.83C7.14 13.92 7.07 14 7 14a4 4 0 1 0 0 8 4 4 0 1 0 0-8c.07 0 .14.01.21.02C7.38 10.36 9.5 8 12 8c.34 0 .67.04 1 .09V6c0-2.43 1.73-4.44 4-4.9V4a3 3 0 0 0-3 3v1h1a5 5 0 0 1 5 5v5h2v-5a7 7 0 0 0-7-7c-1.66 0-3.14.53-4.34 1.43C10.35 6.55 11.16 7 12 7z" /></svg>
                </div>
                <div>
                    <div className="text-white font-semibold text-sm">Cloudy</div>
                </div>
            </div>
            <div className="text-3xl font-light text-white">31°C</div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-400 mt-2">
            <div className="flex justify-between"><span>Wind Speed</span><span className="text-gray-200">6 m/s</span></div>
            <div className="flex justify-between"><span>Wind Blast</span><span className="text-gray-200">6 m/s</span></div>
            <div className="flex justify-between"><span>Wind Gust</span><span className="text-gray-200">6 m/s</span></div>
            <div className="flex justify-between"><span>Precipitation</span><span className="text-gray-200">6 m/s</span></div>
        </div>

        <div className="flex justify-between mt-3 text-[10px] text-gray-400">
            <div className="flex flex-col items-center gap-1"><span>12:00</span><span className="text-yellow-400">☁️</span><span>28°</span></div>
            <div className="flex flex-col items-center gap-1"><span>14:00</span><span className="text-blue-400">🌧️</span><span>32°</span></div>
            <div className="flex flex-col items-center gap-1"><span>15:00</span><span className="text-gray-400">☁️</span><span>31°</span></div>
            <div className="flex flex-col items-center gap-1"><span>16:00</span><span className="text-yellow-400">🌤️</span><span>28°</span></div>
            <div className="flex flex-col items-center gap-1"><span>17:00</span><span className="text-yellow-400">🌤️</span><span>29°</span></div>
            <div className="flex flex-col items-center gap-1"><span>18:00</span><span className="text-yellow-400">☀️</span><span>30°</span></div>
        </div>
    </div>
);

const DPadControl = ({ onZoomIn, onZoomOut, onZoomStop, onArrow, onArrowStop, onJoystickDrag, onJoystickStop, zoomLevel }) => {
    const intervalRef = useRef(null);
    const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragCenter = useRef({ x: 0, y: 0 });
    const MAX_RADIUS = 35; // Max drag distance for the stick

    // -- D-Pad Arrows --
    const startArrow = (direction) => {
        onArrow(direction);
        intervalRef.current = setInterval(() => onArrow(direction), 200);
    };
    const stopArrow = () => {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        onArrowStop?.();
    };

    // -- Joystick Drag --
    const handlePointerDown = (e) => {
        isDragging.current = true;
        dragCenter.current = { x: e.clientX, y: e.clientY };
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current) return;
        const dx = e.clientX - dragCenter.current.x;
        const dy = e.clientY - dragCenter.current.y;

        const distance = Math.sqrt(dx * dx + dy * dy);
        let clampedX = dx;
        let clampedY = dy;

        if (distance > MAX_RADIUS) {
            clampedX = (dx / distance) * MAX_RADIUS;
            clampedY = (dy / distance) * MAX_RADIUS;
        }

        setStickPos({ x: clampedX, y: clampedY });

        // Normalize vector to -1.0 to 1.0 range
        const normalizedX = clampedX / MAX_RADIUS;
        const normalizedY = clampedY / MAX_RADIUS; // positive is down

        // Update gimbal based on joystick vector
        if (onJoystickDrag) {
            onJoystickDrag(normalizedX, normalizedY);
        }
    };

    const handlePointerUp = (e) => {
        isDragging.current = false;
        setStickPos({ x: 0, y: 0 });
        e.target.releasePointerCapture(e.pointerId);
        if (onJoystickStop) onJoystickStop();
    };

    useEffect(() => () => clearInterval(intervalRef.current), []);

    return (
        <div className="w-[340px] h-full flex items-center justify-center gap-10 bg-[#151a25]/95 backdrop-blur rounded-[24px] border border-[#2a3240] shadow-lg shrink-0">
            <div className="flex flex-col gap-4 items-center">
                <button
                    onMouseDown={onZoomIn}
                    onMouseUp={onZoomStop}
                    onMouseLeave={onZoomStop}
                    className="w-[56px] h-[56px] rounded-[16px] bg-[#111827] hover:bg-[#1f2937] flex items-center justify-center text-white text-2xl font-light shadow-md border border-[#374151] active:translate-y-0.5 active:border-orange-500/50 transition-all select-none"
                >
                    +
                </button>
                {zoomLevel != null && (
                    <span className="text-[10px] text-gray-400 font-mono">{Number(zoomLevel).toFixed(1)}x</span>
                )}
                <button
                    onMouseDown={onZoomOut}
                    onMouseUp={onZoomStop}
                    onMouseLeave={onZoomStop}
                    className="w-[56px] h-[56px] rounded-[16px] bg-[#111827] hover:bg-[#1f2937] flex items-center justify-center text-white text-3xl font-light shadow-md border border-[#374151] active:translate-y-0.5 active:border-orange-500/50 transition-all select-none"
                >
                    −
                </button>
            </div>
            <div className="relative w-[140px] h-[140px] rounded-full bg-[#111827] border border-[#2a3240] flex items-center justify-center shadow-inner">
                {/* Center stick */}
                <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className="w-[60px] h-[60px] rounded-full bg-[#1f2937] border border-[#374151] shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_8px_16px_rgba(0,0,0,0.6)] z-10 cursor-grab active:cursor-grabbing hover:border-orange-500/50 touch-none"
                    style={{ transform: `translate(${stickPos.x}px, ${stickPos.y}px)`, transition: isDragging.current ? 'none' : 'transform 0.1s ease-out' }}
                ></div>
                {/* Arrows — press and hold */}
                <div
                    onMouseDown={() => startArrow('up')}
                    onMouseUp={stopArrow}
                    onMouseLeave={stopArrow}
                    className="absolute top-2 left-1/2 -translate-x-1/2 text-orange-500 text-[14px] cursor-pointer hover:text-orange-300 active:scale-125 transition-all select-none p-1"
                >▲</div>
                <div
                    onMouseDown={() => startArrow('down')}
                    onMouseUp={stopArrow}
                    onMouseLeave={stopArrow}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 text-orange-500 text-[14px] cursor-pointer hover:text-orange-300 active:scale-125 transition-all select-none p-1"
                >▼</div>
                <div
                    onMouseDown={() => startArrow('left')}
                    onMouseUp={stopArrow}
                    onMouseLeave={stopArrow}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-orange-500 text-[14px] cursor-pointer hover:text-orange-300 active:scale-125 transition-all select-none p-1"
                >◀</div>
                <div
                    onMouseDown={() => startArrow('right')}
                    onMouseUp={stopArrow}
                    onMouseLeave={stopArrow}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-500 text-[14px] cursor-pointer hover:text-orange-300 active:scale-125 transition-all select-none p-1"
                >▶</div>
            </div>
        </div>
    );
};

export default function ActiveMissionPage() {
    const { videoStream, isStreaming, isConnecting, streamError, detections } = useDetectionStream();
    const [isSwapped, setIsSwapped] = useState(false);

    // Fetch active drones to subscribe to their telemetry
    const [drones, setDrones] = useState([]);
    useEffect(() => {
        const fetchDrones = async () => {
            try {
                const data = await uavService.getUav();
                if (data && data.id) {
                    setDrones([data]);
                }
            } catch (err) {
                console.error('Failed to fetch drones:', err);
            }
        };
        fetchDrones();
    }, []);

    const uavIds = drones.map(d => d.id);
    const { telemetry, positionHistory, homePositions, publish } = useTelemetry(uavIds);

    const selectedDroneObj = drones.length > 0 ? drones[0] : null;
    const selectedUavId = selectedDroneObj?.id;
    const selectedTelemetry = selectedUavId ? telemetry[selectedUavId] : null;
    const selectedTrajectory = selectedUavId ? positionHistory[selectedUavId] : null;
    const selectedHome = selectedUavId ? homePositions[selectedUavId] : null;

    const location = selectedTelemetry?.location || {};
    const vehicleState = selectedTelemetry?.vehicle_state || {};

    // Gimbal & Camera state from telemetry
    const gimbalState = selectedTelemetry?.gimbal_state || {};
    const cameraState = selectedTelemetry?.camera_state || {};

    const longitude = location.longitude != null ? Number(location.longitude).toFixed(7) : 'N/A';
    const latitude = location.latitude != null ? Number(location.latitude).toFixed(7) : 'N/A';
    const heading = location.heading ?? 'N/A';
    const flightMode = vehicleState.mode || 'N/A';
    const altitude = location.altitude != null ? Math.round(location.altitude) : 'N/A';

    // Calculate slider thumb position based on altitude (0 to 100M)
    const altitudePercentage = Math.min(100, Math.max(0, altitude));

    // Gimbal pitch/yaw tracking — use live state as base
    const gimbalPitchRef = useRef(-20);
    const gimbalYawRef = useRef(0);

    // Sync refs with live telemetry when available
    useEffect(() => {
        if (gimbalState.pitch_deg != null) gimbalPitchRef.current = gimbalState.pitch_deg;
        if (gimbalState.yaw_deg != null) gimbalYawRef.current = gimbalState.yaw_deg;
    }, [gimbalState.pitch_deg, gimbalState.yaw_deg]);

    // Photo flash feedback
    const [photoFlash, setPhotoFlash] = useState(false);

    // Recording state from camera_state telemetry
    const isRecording = cameraState.recording_label === 'on' || cameraState.recording_state === 1;

    // --- Command handlers ---

    const GIMBAL_STEP = 5; // degrees per tick
    const PITCH_MIN = -90;
    const PITCH_MAX = 25;

    const handleGimbalArrow = useCallback((direction) => {
        if (!selectedUavId) return;
        let pitch = gimbalPitchRef.current;
        let yaw = gimbalYawRef.current;

        switch (direction) {
            case 'up': pitch = Math.min(PITCH_MAX, pitch + GIMBAL_STEP); break;
            case 'down': pitch = Math.max(PITCH_MIN, pitch - GIMBAL_STEP); break;
            case 'left': yaw -= GIMBAL_STEP; break;
            case 'right': yaw += GIMBAL_STEP; break;
        }

        // Normalize yaw to -180..180
        if (yaw > 180) yaw -= 360;
        if (yaw < -180) yaw += 360;

        gimbalPitchRef.current = pitch;
        gimbalYawRef.current = yaw;

        publish(selectedUavId, 'gimbal_command', {
            command: 'set_pitch_yaw',
            pitch_deg: pitch,
            yaw_deg: yaw,
            mode: 'follow'
        });
    }, [selectedUavId, publish]);

    // Gimbal joystick drag tracking
    const joystickIntervalRef = useRef(null);
    const joystickVectorRef = useRef({ x: 0, y: 0 });

    const handleJoystickDrag = useCallback((nx, ny) => {
        joystickVectorRef.current = { x: nx, y: ny };

        if (!joystickIntervalRef.current) {
            // Start continuous movement while dragged
            joystickIntervalRef.current = setInterval(() => {
                if (!selectedUavId) return;
                let pitch = gimbalPitchRef.current;
                let yaw = gimbalYawRef.current;

                // Max speed factor: multiply the [-1, 1] vector by step size
                const speedMult = GIMBAL_STEP;

                // Note: ny is positive when dragging DOWN, which should pitch DOWN (decrease pitch)
                pitch = pitch - (joystickVectorRef.current.y * speedMult);
                yaw = yaw + (joystickVectorRef.current.x * speedMult);

                pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));

                // Normalize yaw
                if (yaw > 180) yaw -= 360;
                if (yaw < -180) yaw += 360;

                gimbalPitchRef.current = pitch;
                gimbalYawRef.current = yaw;

                publish(selectedUavId, 'gimbal_command', {
                    command: 'set_pitch_yaw',
                    pitch_deg: pitch,
                    yaw_deg: yaw,
                    mode: 'follow'
                });
            }, 100); // 10Hz update while dragging
        }
    }, [selectedUavId, publish]);

    const handleJoystickStop = useCallback(() => {
        if (joystickIntervalRef.current) {
            clearInterval(joystickIntervalRef.current);
            joystickIntervalRef.current = null;
        }
    }, []);

    // Cleanup joystick interval
    useEffect(() => {
        return () => {
            if (joystickIntervalRef.current) clearInterval(joystickIntervalRef.current);
        };
    }, []);

    const handleZoomIn = useCallback(() => {
        if (!selectedUavId) return;
        publish(selectedUavId, 'camera_command', { command: 'zoom_in' });
    }, [selectedUavId, publish]);

    const handleZoomOut = useCallback(() => {
        if (!selectedUavId) return;
        publish(selectedUavId, 'camera_command', { command: 'zoom_out' });
    }, [selectedUavId, publish]);

    const handleZoomStop = useCallback(() => {
        if (!selectedUavId) return;
        publish(selectedUavId, 'camera_command', { command: 'zoom_stop' });
    }, [selectedUavId, publish]);

    const handleToggleRecording = useCallback(() => {
        if (!selectedUavId) return;
        publish(selectedUavId, 'camera_command', { command: 'toggle_recording' });
    }, [selectedUavId, publish]);

    const handleTakePhoto = useCallback(() => {
        if (!selectedUavId) return;
        publish(selectedUavId, 'camera_command', { command: 'take_photo' });
        // Flash feedback
        setPhotoFlash(true);
        setTimeout(() => setPhotoFlash(false), 300);
    }, [selectedUavId, publish]);

    return (
        <div
            className="p-[28px] flex flex-col gap-[20px] w-full h-[calc(100vh-104px)] overflow-hidden"
            style={{ backgroundImage: `url('/src/assets/img_background.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            {/* UPPER AREA: Main Video/Map + Right Sidebar */}
            <div className="flex-1 flex gap-[20px] min-h-0">
                {/* Main Panel (Video or Map depending on swap) */}
                <div className="flex-1 rounded-[24px] border border-[#2a3240] overflow-hidden shadow-lg bg-black relative group">
                    {isSwapped ? (
                        <MapViewPanel
                            telemetry={selectedTelemetry}
                            selectedDrone={selectedDroneObj}
                            trajectory={selectedTrajectory}
                            homePosition={selectedHome}
                        />
                    ) : (
                        <>
                            <MainVideoFeedPanel
                                videoStream={videoStream}
                                isStreaming={isStreaming}
                                isConnecting={isConnecting}
                                streamError={streamError}
                                heading={heading}
                            />
                            {/* Overlay controls for video */}
                            <div className="absolute top-4 left-4 flex gap-2 z-10">
                                <div className="bg-[#1f2937]/80 rounded-md p-1 border border-gray-600 flex text-[10px] font-bold text-gray-300">
                                    <span className="px-3 py-1 bg-orange-500 text-white rounded-sm shadow-sm">Standard</span>
                                    <span className="px-3 py-1 cursor-pointer hover:text-white transition-colors">Nightvision</span>
                                </div>
                            </div>
                            {/* Mission info overlay */}
                            {detections.mission_name && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-black/60 border border-[#2a3240] rounded-lg px-4 py-2 flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-white text-[12px] font-bold">{detections.mission_name}</span>
                                    </div>
                                    <span className="text-gray-400 text-[10px]">ID: {detections.mission_id}</span>
                                </div>
                            )}
                        </>
                    )}
                    {/* Swap button on main panel */}
                    <button
                        onClick={() => setIsSwapped(!isSwapped)}
                        className="absolute bottom-6 left-6 z-[400] bg-black/60 hover:bg-black/80 border border-gray-500 p-2.5 rounded-xl transition-all shadow-lg opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2"
                        title="Swap View"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                            <path d="M8 3L4 7l4 4" />
                            <path d="M4 7h16" />
                            <path d="M16 21l4-4-4-4" />
                            <path d="M20 17H4" />
                        </svg>
                        <span className="text-gray-300 text-[12px] font-bold tracking-wider uppercase">Swap View</span>
                    </button>
                </div>

                {/* Right Sidebar: Dock Cam + Weather */}
                <div className="w-[340px] shrink-0 flex flex-col gap-[20px]">
                    {/* Dock Cam */}
                    <div className="h-[220px] rounded-[24px] border border-[#2a3240] overflow-hidden shadow-lg bg-[#111827]">
                        <DockCamPanel />
                    </div>
                    {/* Weather */}
                    <div className="flex-1 rounded-[24px] border border-[#2a3240] overflow-hidden shadow-lg bg-[#111827]/90 backdrop-blur-sm">
                        <WeatherWidget />
                    </div>
                </div>
            </div>

            {/* BOTTOM AREA: Control Bar */}
            <div className="h-[220px] shrink-0 flex gap-[20px] items-stretch">
                {/* 1 & 2. Map View & Middle Controls */}
                <div className="flex-1 rounded-[24px] border border-[#2a3240] bg-[#151a25]/95 backdrop-blur shadow-lg p-6 flex gap-8">
                    {/* Small panel (Map or Video depending on swap) */}
                    <div className="w-[320px] h-full shrink-0 rounded-[12px] border border-[#2a3240] overflow-hidden bg-[#111827] relative group">
                        {isSwapped ? (
                            <MainVideoFeedPanel
                                videoStream={videoStream}
                                isStreaming={isStreaming}
                                isConnecting={isConnecting}
                                streamError={streamError}
                                heading={heading}
                                isSmallPanel={true}
                            />
                        ) : (
                            <MapViewPanel
                                telemetry={selectedTelemetry}
                                selectedDrone={selectedDroneObj}
                                trajectory={selectedTrajectory}
                                homePosition={selectedHome}
                                isSmallPanel={true}
                            />
                        )}
                        {/* Swap button on small panel */}
                        {/* <button
                            onClick={() => setIsSwapped(!isSwapped)}
                            className="absolute top-3 right-3 z-[400] bg-black/60 hover:bg-black/80 border border-gray-500 p-2 rounded-lg transition-all shadow-md opacity-0 group-hover:opacity-100"
                            title="Swap Video & Map"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                            </svg>
                        </button> */}
                    </div>

                    {/* Camera Controls & Telemetry wrapper */}
                    <div className="flex-1 flex gap-8">
                        {/* Left Side: Camera Controls */}
                        <div className="flex flex-col justify-between w-[40%] pr-6 border-r border-[#2a3240]">
                            {/* Record / Photo */}
                            <div className="flex gap-4">
                                <button
                                    onClick={handleToggleRecording}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] bg-[#111827] border text-white text-[13px] font-bold hover:bg-white/5 transition-colors ${isRecording
                                            ? 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                                            : 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                        }`}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    {isRecording ? 'Stop' : 'Record'}
                                </button>
                                <button
                                    onClick={handleTakePhoto}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] bg-[#111827] border border-[#374151] text-white text-[13px] font-bold hover:bg-white/5 transition-colors shadow-sm active:bg-white/10"
                                >
                                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2" /><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" /></svg>
                                    Photo
                                </button>
                            </div>

                            {/* Storage Capacity */}
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                        <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                                        <line x1="2" y1="10" x2="22" y2="10" />
                                        <line x1="8" y1="14" x2="8.01" y2="14" />
                                        <line x1="12" y1="14" x2="12.01" y2="14" />
                                        <line x1="16" y1="14" x2="16.01" y2="14" />
                                    </svg>
                                    <span className="text-[13px] text-gray-300 font-medium">Storage Capacity</span>
                                </div>
                                <div className="text-white font-bold text-[13px]">
                                    140/1000 GB
                                </div>
                            </div>

                            {/* Abort Mission */}
                            <button className="w-full h-[46px] hover:brightness-110 tracking-[0.05em] text-[14px] rounded-[10px] transition-all active:scale-[0.98] overflow-hidden relative">
                                <img src="/src/assets/btn_abort_mission.png" alt="Abort Mission" className="absolute inset-0 w-full h-full object-cover" />
                            </button>
                        </div>

                        {/* Right Side: Telemetry Data */}
                        <div className="flex flex-col justify-between flex-1 pl-2">
                            {/* 2x2 Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#111827] border border-[#2a3240] rounded-[8px] flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                                        <span className="text-[12px] font-medium text-gray-300">Longitude</span>
                                    </div>
                                    <span className="text-[13px] font-bold text-white">{longitude}</span>
                                </div>
                                <div className="bg-[#111827] border border-[#2a3240] rounded-[8px] flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        <span className="text-[12px] font-medium text-gray-300">People</span>
                                    </div>
                                    <span className="text-[13px] font-bold text-orange-400">{detections?.person_count || 0}</span>
                                </div>
                                <div className="bg-[#111827] border border-[#2a3240] rounded-[8px] flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                                        <span className="text-[12px] font-medium text-gray-300">Latitude</span>
                                    </div>
                                    <span className="text-[13px] font-bold text-white">{latitude}</span>
                                </div>
                                <div className="bg-[#111827] border border-[#2a3240] rounded-[8px] flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><rect x="2" y="8" width="20" height="10" rx="2" ry="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>
                                        <span className="text-[12px] font-medium text-gray-300">Vehicle</span>
                                    </div>
                                    <span className="text-[13px] font-bold text-blue-400">{detections?.vehicle_count || 0}</span>
                                </div>
                            </div>

                            {/* Slider (Altitude) */}
                            <div className="bg-[#111827] border border-[#2a3240] rounded-[8px] px-4 py-3 flex items-center mt-2 h-[46px]">
                                <div className="relative flex-1 h-[2px] bg-[#1f2937] rounded-full mx-2 flex items-center">
                                    {/* Thumb */}
                                    <div
                                        className="absolute w-2.5 h-7 bg-[#f97316] rounded-[2px] shadow-sm transform -translate-x-1/2 cursor-pointer z-10 hover:brightness-110 transition-all duration-300"
                                        style={{ left: `${altitudePercentage}%` }}
                                    ></div>
                                    {/* Tick marks */}
                                    <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                                        <div className="w-px h-2 bg-[#374151]"></div>
                                        <div className="w-px h-2 bg-[#374151]"></div>
                                        <div className="w-px h-2 bg-[#374151]"></div>
                                        <div className="w-px h-2 bg-[#374151]"></div>
                                        <div className="w-px h-2 bg-[#374151]"></div>
                                        <div className="w-px h-2 bg-[#374151]"></div>
                                        <div className="w-px h-2 bg-[#374151]"></div>
                                    </div>
                                </div>
                                <span className="text-[12px] font-bold text-gray-300 ml-6 w-10 text-right">{altitude} M</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. D-Pad (Right) */}
                <DPadControl
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomStop={handleZoomStop}
                    onArrow={handleGimbalArrow}
                    onJoystickDrag={handleJoystickDrag}
                    onJoystickStop={handleJoystickStop}
                    zoomLevel={cameraState.zoom_level}
                />
            </div>

            {/* Photo Flash Overlay */}
            {photoFlash && (
                <div className="fixed inset-0 bg-white/30 z-[9999] pointer-events-none animate-[flashFade_0.3s_ease-out_forwards]" />
            )}
        </div>
    );
}
