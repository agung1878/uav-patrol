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

export default function MapViewPanel() {
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

    return (
        <div className="relative w-full h-full bg-[#181d25] rounded-[24px] border border-[#2a3240] overflow-hidden select-none">
            {/* Switch Button */}
            <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#202834] border border-[#2a3240] flex items-center justify-center cursor-pointer hover:bg-[#2c3645] transition-colors z-[400]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
                    <path d="M17 11V3M17 3L21 7M17 3L13 7M7 13V21M7 21L3 17M7 21L11 17" />
                </svg>
            </div>

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

                {/* Draw lines between points */}
                <Polyline positions={allLines} color="#ea580c" weight={2} dashArray="4, 6" />

                {/* Dock Marker */}
                <Marker position={dockPosition} icon={dockIcon} />

                {/* Drone Marker */}
                <Marker position={dronePosition} icon={droneIcon} />

                {/* Waypoints */}
                {waypoints.map((wp, index) => (
                    <Marker key={index} position={[wp.lat, wp.lng]} icon={createWaypointIcon(index + 1)} />
                ))}
            </MapContainer>
        </div>
    );
}
