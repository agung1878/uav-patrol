import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons
const dockIcon = new L.DivIcon({
    className: 'custom-dock-icon',
    html: `<div class="w-6 h-6 rounded-full bg-[#d4af37] text-black text-[10px] font-bold flex items-center justify-center shadow-lg border-2 border-[#d4af37]/50">H</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const droneIcon = new L.DivIcon({
    className: 'custom-drone-icon',
    html: `
        <img src="/src/assets/icon_drone.png" alt="Drone" class="w-24 h-24 object-contain" />
    `,
    iconSize: [96, 96],
    iconAnchor: [48, 48]
});

const createWaypointIcon = (number) => new L.DivIcon({
    className: 'custom-waypoint-icon',
    html: `<div class="w-5 h-5 rounded-full bg-[#3b5374] border border-[#587fae] text-white text-[10px] font-bold flex items-center justify-center shadow-lg">${number}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

export default function QuickLaunchDialogForm({ isOpen, missionType, onClose, onLaunch }) {
    if (!isOpen) return null;

    const center = [-6.200000, 106.816666]; // Jakarta coordinates
    const dockPosition = [-6.195, 106.81];
    const dronePosition = [-6.198, 106.805];

    const waypoints = [
        { lat: -6.190, lng: 106.815 },
        { lat: -6.185, lng: 106.820 },
        { lat: -6.180, lng: 106.810 }
    ];

    const linePositions = waypoints.map(wp => [wp.lat, wp.lng]);
    const allLines = [dronePosition, ...linePositions];

    // Based on User mockup, 'Spiral' has 3 fields, 'ROI'/'Launch' have 1 field.
    const isSpiral = missionType === 'Spiral';

    // Determine the label shown at the very top left
    const titleLabel = missionType === 'Launch' || missionType === 'ROI' ? 'ROI/Launch' : 'Spiral';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0a0f18]/80 backdrop-blur-sm select-none">

            {/* Main Form Container */}
            <div className="w-[840px] flex flex-col relative">

                {/* Floating Title (Top Left) */}
                <div className="absolute -top-7 left-0 text-gray-400 text-[13px] font-medium tracking-wide">
                    {titleLabel}
                </div>

                {/* Dialog Body */}
                <div className="bg-[#151a25]/95 rounded-[12px] border border-[#2a3240] shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 backdrop-blur-md flex flex-col gap-6 w-full relative">

                    {/* Map Area */}
                    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border border-[#2a3240] pointer-events-auto z-10">
                        <MapContainer
                            center={center}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                            scrollWheelZoom={true}
                        >
                            {/* Dark CartoDB Matter tile layer */}
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />

                            {/* Max Radius Circle */}
                            <Circle center={dockPosition} radius={1800} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1, dashArray: '4, 8' }} />

                            {/* Dock Marker */}
                            <Marker position={dockPosition} icon={dockIcon} />

                            {/* Drone Marker */}
                            <Marker position={dronePosition} icon={droneIcon} />
                        </MapContainer>

                        {/* Top Label over Map */}
                        <div className="absolute top-4 left-0 right-0 text-center text-gray-200 text-[13px] tracking-wide pointer-events-none">
                            Choose a location
                        </div>

                        {/* White Brackets (SVG) */}
                        <svg className="absolute inset-4 pointer-events-none w-[calc(100%-32px)] h-[calc(100%-32px)] z-10">
                            {/* Top Left */}
                            <path d="M 12 0 L 6 0 Q 0 0 0 6 L 0 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            {/* Top Right */}
                            <path d="M calc(100% - 12px) 0 L calc(100% - 6px) 0 Q 100% 0 100% 6 L 100% 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            {/* Bottom Left */}
                            <path d="M 0 calc(100% - 12px) L 0 calc(100% - 6px) Q 0 100% 6 100% L 12 100%" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            {/* Bottom Right */}
                            <path d="M 100% calc(100% - 12px) L 100% calc(100% - 6px) Q 100% 100% calc(100% - 6px) 100% L calc(100% - 12px) 100%" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>

                        {/* Zoom Controls */}
                        <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-30">
                            <button className="w-10 h-10 bg-[#1a202c]/90 text-white rounded-md flex items-center justify-center hover:bg-[#2d3748] border border-[#2d3748] text-xl font-bold transition-colors">
                                +
                            </button>
                            <button className="w-10 h-10 bg-[#1a202c]/90 text-white rounded-md flex items-center justify-center hover:bg-[#2d3748] border border-[#2d3748] text-xl font-bold transition-colors">
                                -
                            </button>
                        </div>

                        {/* Conditionally Rendered Parameters Overlay */}
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[400] pointer-events-auto">
                            <div className="flex gap-4 items-end justify-center">
                                {/* Base Takeoff Altitude -> Present in all modes */}
                                <div className="flex flex-col">
                                    <label className="text-gray-400 text-[10px] text-center mb-2 px-2 shadow-black drop-shadow-md">Takeoff Altitude (M)</label>
                                    <input
                                        type="number"
                                        className="w-[180px] h-[32px] bg-[#1a202c]/90 border border-[#2d3748] rounded px-3 text-white text-[12px] outline-none text-left focus:border-gray-400 transition-colors placeholder-gray-500"
                                        placeholder="150"
                                        defaultValue="150"
                                    />
                                </div>

                                {/* Extra Fields for Spiral Mode */}
                                {isSpiral && (
                                    <>
                                        <div className="flex flex-col">
                                            <label className="text-gray-400 text-[10px] text-center mb-2 px-2 shadow-black drop-shadow-md">Flight Altitude (M)</label>
                                            <input
                                                type="number"
                                                className="w-[180px] h-[32px] bg-[#1a202c]/90 border border-[#2d3748] rounded px-3 text-white text-[12px] outline-none text-left focus:border-gray-400 transition-colors placeholder-gray-500"
                                                placeholder="150"
                                                defaultValue="150"
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <label className="text-gray-400 text-[10px] text-center mb-2 px-2 shadow-black drop-shadow-md">Radius (M)</label>
                                            <input
                                                type="number"
                                                className="w-[180px] h-[32px] bg-[#1a202c]/90 border border-[#2d3748] rounded px-3 text-white text-[12px] outline-none text-left focus:border-gray-400 transition-colors placeholder-gray-500"
                                                placeholder="200"
                                                defaultValue="200"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex gap-6 mt-1">
                        {/* Red Cancel Button */}
                        <button
                            onClick={onClose}
                            className="flex-1 h-[48px] rounded flex items-center justify-center transition-all hover:from-[#dc2626] hover:to-[#991b1b] relative overflow-hidden"
                        >
                            <img src="/src/assets/btn_cancel_mission_2.png" alt="Cancel" />
                        </button>

                        {/* Orange Launch Button */}
                        <button
                            onClick={() => onLaunch(missionType)}
                            className="flex-1 h-[48px] rounded flex items-center justify-center transition-all hover:from-[#f97316] hover:to-[#c2410c] relative overflow-hidden"
                        >
                            <img src="/src/assets/btn_launch_dg.png" alt="Launch" />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
