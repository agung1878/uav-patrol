import { hide } from '@tauri-apps/api/app';
import React, { useState } from 'react';

export default function DroneInfoPanel({
    drones = [],
    selectedDrone = null,
    onSelectDrone,
    isLoading = true,
    errorMsg = '',
    telemetry = null,
    isTelemetryConnected = false
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Extract telemetry from metric-keyed structure
    const location = telemetry?.location || {};
    const batteryData = telemetry?.battery || {};
    const gps = telemetry?.gps || {};
    const vehicleState = telemetry?.vehicle_state || {};
    const attitude = telemetry?.attitude || {};
    const link = telemetry?.link || {};
    const missionProgress = telemetry?.mission_progress || {};

    const battery = batteryData.percent ?? null;
    const altitude = location.altitude ?? null;
    const speed = location.ground_speed ?? null;
    const heading = location.heading ?? null;
    const climbRate = location.climb_rate ?? null;
    const latitude = location.latitude ?? null;
    const longitude = location.longitude ?? null;
    const satellites = gps.satellites ?? null;
    const fixLabel = gps.fix_type_label ?? null;
    const flightMode = vehicleState.mode ?? null;
    const isArmed = vehicleState.armed ?? null;
    const landedState = vehicleState.landed_state ?? null;
    const rssi = link.rssi ?? null;
    const voltage = batteryData.voltage ?? null;

    // Determine battery status
    const getBatteryStatus = (level) => {
        if (level === null || level === undefined) return { text: '--', color: 'text-gray-500', label: 'No Data', width: '0%', barColor: '#4b5563' };
        if (level >= 60) return { text: `${level}%`, color: 'text-[#1ab394]', label: 'Safe to Fly', width: `${level}%`, barColor: '#1ab394' };
        if (level >= 30) return { text: `${level}%`, color: 'text-[#f0ad4e]', label: 'Moderate', width: `${level}%`, barColor: '#f0ad4e' };
        return { text: `${level}%`, color: 'text-[#ea580c]', label: 'Low Battery', width: `${level}%`, barColor: '#ea580c' };
    };

    const batteryStatus = getBatteryStatus(battery);

    return (
        <div className="w-full h-full bg-[#1c222c] rounded-2xl border border-[#2a3240] p-5 shadow-lg flex flex-col gap-4 select-none">

            {/* Header Section */}
            <div className="flex justify-between items-start">
                <div className="flex flex-col text-left relative h-10 w-[70%]" onMouseLeave={() => setIsDropdownOpen(false)}>
                    {isLoading ? (
                        <h2 className="text-white text-[18px] font-bold tracking-wide">Loading...</h2>
                    ) : errorMsg ? (
                        <h2 className="text-red-400 text-[18px] font-bold tracking-wide text-sm">{errorMsg}</h2>
                    ) : (
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <h2 className="text-white text-[18px] font-bold tracking-wide truncate max-w-[90%]">
                                {selectedDrone?.name || 'DRONE 1'}
                            </h2>
                            {drones.length > 1 && (
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            )}
                        </div>
                    )}

                    {/* Dropdown Menu */}
                    {isDropdownOpen && drones.length > 1 && (
                        <div className="absolute top-8 left-0 w-full bg-[#252b36] border border-[#3b4353] rounded-md shadow-xl z-50 py-1 overflow-hidden mt-1 max-h-[150px] overflow-y-auto">
                            {drones.map((drone) => (
                                <div
                                    key={drone.id}
                                    className={`px-3 py-2 text-[14px] cursor-pointer hover:bg-[#1a212b] transition-colors ${selectedDrone?.id === drone.id ? 'text-[#ea580c] font-bold bg-[#1a212b]' : 'text-gray-200'}`}
                                    onClick={() => {
                                        onSelectDrone(drone);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <div className="truncate">{drone.name || `DRONE ${drone.id}`}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && !errorMsg && (
                        <div className="flex items-center gap-2 mt-[2px]">
                            <a href="#" className="text-[#ea580c] text-[10px] font-semibold tracking-wider hover:underline w-fit">
                                View Detail
                            </a>
                            {/* Telemetry connection indicator */}
                            <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${isTelemetryConnected ? 'bg-[#1ab394] animate-pulse' : 'bg-gray-600'}`}></div>
                                <span className={`text-[9px] font-mono ${isTelemetryConnected ? 'text-[#1ab394]' : 'text-gray-600'}`}>
                                    {isTelemetryConnected ? 'LIVE' : 'OFFLINE'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
                <img src="/src/assets/ic_drone.png" alt="Drone" className="h-10 w-auto object-contain drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] invert brightness-75 sepia-[0.5] hue-rotate-180 saturate-50" />
            </div>

            {/* Battery Section */}
            <div className="flex flex-col gap-2 text-left">
                <h3 className="text-gray-200 text-xs font-semibold tracking-wide">Battery</h3>
                <div className="flex justify-between items-center bg-[#171c24] border border-[#2a3240] rounded-xl p-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-4 border-[1.5px] border-gray-400 rounded-[2px] p-[1.5px] relative">
                            <div
                                className="h-full rounded-[1px] transition-all duration-500"
                                style={{ width: batteryStatus.width, backgroundColor: batteryStatus.barColor }}
                            ></div>
                            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-[2px] h-2 bg-gray-400 rounded-r-[1px]"></div>
                        </div>
                        <span className="text-white text-sm font-bold tracking-wider font-mono">{batteryStatus.text}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className={`text-[11px] font-bold tracking-wide ${batteryStatus.color}`}>
                            {battery !== null ? (battery >= 60 ? 'Good' : battery >= 30 ? 'Moderate' : 'Low') : '--'}
                        </span>
                        <span className={`text-[9px] font-medium tracking-wide ${batteryStatus.color}`}>
                            {voltage !== null ? `${voltage.toFixed(1)}V` : batteryStatus.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Weather Section */}
            <div className="flex flex-col gap-2 text-left">
                <h3 className="text-gray-200 text-xs font-semibold tracking-wide">Weather</h3>
                <div className="flex flex-col bg-[#171c24] border border-[#2a3240] rounded-xl p-4">

                    {/* Weather Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="relative mt-1">
                                <div className="w-6 h-6 rounded-full bg-[#fcd34d] absolute -left-1 -top-1"></div>
                                <div className="w-8 h-4 bg-white rounded-full relative z-10 shadow-sm before:absolute before:w-3.5 before:h-3.5 before:bg-white before:rounded-full before:-top-2 before:left-1 after:absolute after:w-4.5 after:h-4.5 after:bg-white after:rounded-full after:-top-2.5 after:right-0.5"></div>
                            </div>
                            <span className="text-white text-2xl font-bold tracking-wider font-sans">31°C</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-white text-[13px] font-bold tracking-wide leading-tight">Cijantung</span>
                            <span className="text-gray-300 text-[10px] font-mono tracking-wide mt-[2px]">11:30</span>
                        </div>
                    </div>

                    {/* Weather Stats Table */}
                    <div className="flex flex-col text-[10px] text-gray-400 mt-4">
                        <div className="h-[1px] w-full bg-[#2a3240] my-1.5 opacity-60"></div>
                        <div className="flex justify-between px-1">
                            <div className="flex w-1/2 justify-between pr-4"><span>Gust</span><span className="text-gray-200 font-mono">6 m/s</span></div>
                            <div className="flex w-1/2 justify-between pl-4"><span>Wind</span><span className="text-gray-200 font-mono">4 m/s</span></div>
                        </div>
                        <div className="h-[1px] w-full bg-[#2a3240] my-1.5 opacity-60"></div>
                        <div className="flex justify-between px-1">
                            <div className="flex w-1/2 justify-between pr-4"><span>Humid</span><span className="text-gray-200 font-mono">72%</span></div>
                            <div className="flex w-1/2 justify-between pl-4"><span>Visibility</span><span className="text-gray-200 font-mono">10 km</span></div>
                        </div>
                        <div className="h-[1px] w-full bg-[#2a3240] my-1.5 opacity-60"></div>
                    </div>

                    {/* Weather Footer */}
                    <div className="flex justify-center mt-2">
                        <span className="text-[#1ab394] text-[10px] font-medium tracking-wide">Good Condition for flight</span>
                    </div>

                </div>
            </div>

            {/* Telemetry Stats Section */}
            <div className="flex flex-col gap-2 flex-1 text-left" style={{ display: 'none' }}>
                <h3 className="text-gray-200 text-xs font-semibold tracking-wide">Telemetry</h3>
                <div className="flex flex-col flex-1 justify-between bg-[#171c24] border border-[#2a3240] rounded-xl p-4">

                    {/* Flight Info Grid */}
                    <div className="flex flex-col text-[10px] text-gray-400">
                        <div className="flex justify-between px-1">
                            <div className="flex w-1/2 justify-between pr-4">
                                <span>Altitude</span>
                                <span className="text-gray-200 font-mono">{altitude !== null ? `${Number(altitude).toFixed(1)} m` : '-- m'}</span>
                            </div>
                            <div className="flex w-1/2 justify-between pl-4">
                                <span>Speed</span>
                                <span className="text-gray-200 font-mono">{speed !== null ? `${Number(speed).toFixed(1)} m/s` : '-- m/s'}</span>
                            </div>
                        </div>
                        <div className="h-[1px] w-full bg-[#2a3240] my-1.5 opacity-60"></div>
                        <div className="flex justify-between px-1">
                            <div className="flex w-1/2 justify-between pr-4">
                                <span>Heading</span>
                                <span className="text-gray-200 font-mono">{heading !== null ? `${Number(heading).toFixed(0)}°` : '--°'}</span>
                            </div>
                            <div className="flex w-1/2 justify-between pl-4">
                                <span>Climb</span>
                                <span className="text-gray-200 font-mono">{climbRate !== null ? `${Number(climbRate).toFixed(1)} m/s` : '-- m/s'}</span>
                            </div>
                        </div>
                        <div className="h-[1px] w-full bg-[#2a3240] my-1.5 opacity-60"></div>
                        <div className="flex justify-between px-1">
                            <div className="flex w-1/2 justify-between pr-4">
                                <span>Sat</span>
                                <span className="text-gray-200 font-mono">{satellites !== null ? `${satellites} (${fixLabel || '?'})` : '--'}</span>
                            </div>
                            <div className="flex w-1/2 justify-between pl-4">
                                <span>RSSI</span>
                                <span className="text-gray-200 font-mono">{rssi !== null ? rssi : '--'}</span>
                            </div>
                        </div>
                        <div className="h-[1px] w-full bg-[#2a3240] my-1.5 opacity-60"></div>
                        <div className="flex justify-between px-1">
                            <div className="flex w-1/2 justify-between pr-4">
                                <span>Lat</span>
                                <span className="text-gray-200 font-mono">{latitude !== null ? Number(latitude).toFixed(6) : '--'}</span>
                            </div>
                            <div className="flex w-1/2 justify-between pl-4">
                                <span>Lng</span>
                                <span className="text-gray-200 font-mono">{longitude !== null ? Number(longitude).toFixed(6) : '--'}</span>
                            </div>
                        </div>
                        <div className="h-[1px] w-full bg-[#2a3240] my-1.5 opacity-60"></div>
                    </div>

                    {/* Flight Mode Footer */}
                    <div className="flex justify-between items-center mt-2 px-1">
                        <span className={`text-[10px] font-medium tracking-wide ${isTelemetryConnected ? 'text-[#1ab394]' : 'text-gray-600'}`}>
                            {flightMode
                                ? `${flightMode}${isArmed ? ' • Armed' : ' • Disarmed'}`
                                : (isTelemetryConnected ? 'Awaiting data...' : 'Disconnected')}
                        </span>
                        {landedState && (
                            <span className="text-[9px] font-mono text-gray-500">{landedState}</span>
                        )}
                    </div>

                </div>
            </div>

        </div>
    );
}
