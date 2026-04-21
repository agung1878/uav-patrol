import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from 'react-leaflet';
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

// Drone icon with heading rotation from location telemetry
const createDroneIcon = (heading) => new L.DivIcon({
    className: 'custom-drone-icon',
    html: `
        <div style="transform: rotate(${heading || 0}deg); transition: transform 0.5s ease;">
            <img src="/src/assets/icon_drone.svg" alt="Drone" class="w-24 h-24 object-contain" />
        </div>
    `,
    iconSize: [96, 96],
    iconAnchor: [48, 48]
});

const createWaypointIcon = (number, isActive = false) => new L.DivIcon({
    className: 'custom-waypoint-icon',
    html: `<div class="flex items-center justify-center shadow-lg" style="
        width: 22px; height: 22px; border-radius: 50%;
        background: ${isActive ? '#ea580c' : '#3b5374'};
        border: 2px solid ${isActive ? '#fb923c' : '#587fae'};
        color: white; font-size: 10px; font-weight: bold;
        ${isActive ? 'box-shadow: 0 0 8px rgba(234,88,12,0.6);' : ''}
    ">${number}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
});

// Component to auto-pan the map to follow the drone
function MapFollower({ position, shouldFollow }) {
    const map = useMap();
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (position && shouldFollow) {
            if (!hasInitialized.current) {
                map.setView(position, 16, { animate: false });
                hasInitialized.current = true;
            } else {
                map.panTo(position, { animate: true, duration: 1 });
            }
        }
    }, [position, shouldFollow, map]);

    return null;
}

export default function MapViewPanel({ telemetry, selectedDrone, trajectory, homePosition, missionWaypoints }) {
    const defaultCenter = [-6.200000, 106.816666]; // Jakarta fallback

    // Get drone position from telemetry
    const location = telemetry?.location || {};
    const hasLocation = location.latitude != null && location.longitude != null;
    const dronePosition = hasLocation
        ? [location.latitude, location.longitude]
        : null;
    const heading = location.heading ?? 0;

    // Current waypoint index from mission progress
    const currentWaypoint = telemetry?.mission_progress?.current_waypoint ?? null;

    // Home/dock position: telemetry first-known > drone API data > null
    const dockPosition = homePosition
        || (selectedDrone?.home_latitude && selectedDrone?.home_longitude
            ? [selectedDrone.home_latitude, selectedDrone.home_longitude]
            : (selectedDrone?.dockings?.[0]?.latitude && selectedDrone?.dockings?.[0]?.longitude
                ? [selectedDrone.dockings[0].latitude, selectedDrone.dockings[0].longitude]
                : null));

    // Map center — use drone position, then dock, then default
    const center = dronePosition || dockPosition || defaultCenter;

    // Max range circle (use drone max_range or default 1800m)
    const maxRange = selectedDrone?.max_range_meter || 1800;

    // Build waypoint polyline (waypoint route path)
    const waypointPositions = missionWaypoints?.map(wp => [wp.latitude, wp.longitude]) || [];

    return (
        <div className="relative w-full h-full bg-[#181d25] rounded-[24px] border border-[#2a3240] overflow-hidden select-none">
            {/* Switch Button */}
            <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#202834] border border-[#2a3240] flex items-center justify-center cursor-pointer hover:bg-[#2c3645] transition-colors z-[400]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300">
                    <path d="M17 11V3M17 3L21 7M17 3L13 7M7 13V21M7 21L3 17M7 21L11 17" />
                </svg>
            </div>

            {/* Telemetry HUD overlay */}
            {hasLocation && (
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 z-[400] text-[9px] font-mono text-gray-300 flex gap-3">
                    <span>ALT {Number(location.altitude ?? 0).toFixed(1)}m</span>
                    <span>SPD {Number(location.ground_speed ?? 0).toFixed(1)}m/s</span>
                    <span>HDG {Number(heading).toFixed(0)}°</span>
                </div>
            )}

            <MapContainer
                center={center}
                zoom={hasLocation ? 16 : 13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                scrollWheelZoom={true}
            >
                {/* Dark CartoDB tile layer */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Follow drone position */}
                <MapFollower position={dronePosition} shouldFollow={hasLocation} />

                {/* Max Radius Circle around home */}
                {dockPosition && (
                    <Circle
                        center={dockPosition}
                        radius={maxRange}
                        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1, dashArray: '4, 8' }}
                    />
                )}

                {/* Trajectory trail — cyan line showing flight path */}
                {trajectory && trajectory.length > 1 && (
                    <Polyline
                        positions={trajectory}
                        color="#06b6d4"
                        weight={3}
                        opacity={0.7}
                    />
                )}

                {/* Waypoint route line (dashed orange) */}
                {waypointPositions.length > 1 && (
                    <Polyline
                        positions={waypointPositions}
                        color="#ea580c"
                        weight={2}
                        dashArray="6, 8"
                        opacity={0.5}
                    />
                )}

                {/* Mission Waypoint Markers */}
                {missionWaypoints && missionWaypoints.map((wp, index) => (
                    <Marker
                        key={`wp-${wp.sequence_order || index}`}
                        position={[wp.latitude, wp.longitude]}
                        icon={createWaypointIcon(wp.sequence_order || index + 1, currentWaypoint === wp.sequence_order)}
                    />
                ))}

                {/* Home/Dock Marker */}
                {dockPosition && (
                    <Marker position={dockPosition} icon={dockIcon} />
                )}

                {/* Drone Marker — live from telemetry */}
                {dronePosition && (
                    <Marker
                        position={dronePosition}
                        icon={createDroneIcon(heading)}
                    />
                )}
            </MapContainer>
        </div>
    );
}
