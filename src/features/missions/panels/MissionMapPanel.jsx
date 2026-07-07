import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icon for Drone and Dock (Optional visually for now, keeping it basic)
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
            <img src="/src/assets/ic_drone.png" alt="Drone" class="w-24 h-24 object-contain" />
        </div>
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

// Component to handle map clicks for adding waypoints
function MapClickHandler({ onAddWaypoint, circleCenter, maxRange, showToast }) {
    useMapEvents({
        click(e) {
            if (circleCenter) {
                const centerLatLng = L.latLng(circleCenter[0], circleCenter[1]);
                const distance = e.latlng.distanceTo(centerLatLng);
                if (distance > maxRange) {
                    if (showToast) showToast('warning', `Cannot add a waypoint outside the fence`);
                    return;
                }
            }
            onAddWaypoint(e.latlng);
        },
    });
    return null;
}

// Component to re-center map when drone position becomes available
function MapCenterUpdater({ dronePosition, homePosition }) {
    const map = useMap();
    const hasCentered = useRef(false);

    useEffect(() => {
        if (hasCentered.current) return;
        const target = dronePosition || homePosition;
        if (target) {
            map.flyTo(target, 16, { duration: 1.5 });
            hasCentered.current = true;
        }
    }, [dronePosition, homePosition, map]);

    return null;
}

// const TelemetryOverlay = ({ telemetry }) => {
//     const location = telemetry?.location || {};
//     const vehicleState = telemetry?.vehicle_state || {};

//     const altitude = location.altitude != null ? location.altitude.toFixed(1) : '--';
//     const speed = location.ground_speed != null ? location.ground_speed.toFixed(1) : '--';
//     const flightMode = vehicleState.mode || 'UNKNOWN';

//     return (
//         <div className="absolute bottom-4 left-4 z-[400] bg-[#151a25]/90 backdrop-blur border border-[#2a3240] rounded-[12px] p-3 flex gap-4 shadow-lg pointer-events-none">
//             <div className="flex flex-col items-center min-w-[40px]">
//                 <span className="text-gray-400 text-[9px] uppercase tracking-wider">Alt</span>
//                 <span className="text-white font-mono text-[13px] font-bold">{altitude}<span className="text-[10px] ml-0.5 text-gray-500">m</span></span>
//             </div>
//             <div className="w-[1px] bg-[#2a3240]"></div>
//             <div className="flex flex-col items-center min-w-[40px]">
//                 <span className="text-gray-400 text-[9px] uppercase tracking-wider">Speed</span>
//                 <span className="text-white font-mono text-[13px] font-bold">{speed}<span className="text-[10px] ml-0.5 text-gray-500">m/s</span></span>
//             </div>
//             <div className="w-[1px] bg-[#2a3240]"></div>
//             <div className="flex flex-col items-center min-w-[50px]">
//                 <span className="text-gray-400 text-[9px] uppercase tracking-wider">Mode</span>
//                 <span className="text-[#ea580c] font-bold text-[11px] mt-0.5 uppercase tracking-wide truncate max-w-[80px]">{flightMode}</span>
//             </div>
//         </div>
//     );
// };

export default function MissionMapPanel({ waypoints, onAddWaypoint, isViewMode = true, telemetry, trajectory, homePosition, selectedDrone, selectedMission }) {
    const defaultCenter = [-6.200000, 106.816666]; // Jakarta fallback
    const mapRef = useRef(null);

    // Toast notification state
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const showToast = (type, message, duration = 4000) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ type, message });
        toastTimer.current = setTimeout(() => setToast(null), duration);
    };

    // --- Mission detail computations (from selectedMission API response) ---
    const missionWaypoints = selectedMission?.waypoints || [];
    const missionFlightDistanceM = (() => {
        if (missionWaypoints.length < 2) return 0;
        let total = 0;
        for (let i = 0; i < missionWaypoints.length - 1; i++) {
            total += L.latLng(missionWaypoints[i].latitude, missionWaypoints[i].longitude)
                .distanceTo(L.latLng(missionWaypoints[i + 1].latitude, missionWaypoints[i + 1].longitude));
        }
        return total;
    })();
    // Flight area: bounding box diagonal of all waypoints
    const missionFlightAreaM = (() => {
        if (missionWaypoints.length < 2) return 0;
        const lats = missionWaypoints.map(w => w.latitude);
        const lngs = missionWaypoints.map(w => w.longitude);
        return L.latLng(Math.min(...lats), Math.min(...lngs))
            .distanceTo(L.latLng(Math.max(...lats), Math.max(...lngs)));
    })();
    // Total action duration across all waypoints
    const totalActionDuration = missionWaypoints.reduce((sum, w) => sum + (w.action_duration || 0), 0);
    // Estimate flight time: distance / assumed speed (5 m/s default) + action durations
    const missionFlightTimeSec = (() => {
        if (missionFlightDistanceM <= 0) return 0;
        const speed = telemetry?.vehicle_state?.flight_speed || 5;
        return Math.round(missionFlightDistanceM / speed) + totalActionDuration;
    })();
    const formatTime = (totalSec) => {
        if (totalSec <= 0) return '--';
        const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
        const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
        const s = String(totalSec % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    };
    const formatSchedule = (schedule) => {
        if (!schedule) return '';
        const d = new Date(schedule);
        if (isNaN(d.getTime())) return schedule;
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}  ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // Get drone position from telemetry
    const location = telemetry?.location || {};
    const hasLocation = location.latitude != null && location.longitude != null;
    const dronePosition = hasLocation ? [location.latitude, location.longitude] : null;
    const heading = location.heading ?? 0;
    const flightMode = telemetry?.vehicle_state?.mode || 'UNKNOWN';

    // --- Drone Condition: live telemetry values ---
    // Battery from telemetry metric "battery"
    const battery = telemetry?.battery || {};
    const batteryPercent = battery.percent != null ? Math.round(battery.percent) : null;
    const batteryLabel = batteryPercent != null
        ? `${batteryPercent}% (${batteryPercent >= 60 ? 'Good' : batteryPercent >= 30 ? 'Fair' : 'Low'})`
        : '--';

    // Drone speed from telemetry metric "vehicle_state" (flight_speed in m/s)
    const vehicleState = telemetry?.vehicle_state || {};
    const flightSpeed = vehicleState.flight_speed != null ? vehicleState.flight_speed : null;
    const speedLabel = flightSpeed != null ? `${flightSpeed.toFixed(1)} m/s` : '--';

    // Flight distance: sum of Leaflet distances between sequential waypoints
    // If drone position is known, include drone → first waypoint
    const flightDistanceM = (() => {
        if (waypoints.length === 0) return 0;
        let total = 0;
        const pts = waypoints.map(wp => L.latLng(wp.lat, wp.lng));
        // Drone to first waypoint
        if (dronePosition) {
            total += L.latLng(dronePosition[0], dronePosition[1]).distanceTo(pts[0]);
        }
        // Between waypoints
        for (let i = 0; i < pts.length - 1; i++) {
            total += pts[i].distanceTo(pts[i + 1]);
        }
        return total;
    })();
    const distanceLabel = flightDistanceM > 0 ? `${Math.round(flightDistanceM)} m` : '--';

    // Flight time estimation: distance / speed
    const flightTimeLabel = (() => {
        if (flightDistanceM <= 0 || !flightSpeed || flightSpeed <= 0) return '--';
        const totalSec = Math.round(flightDistanceM / flightSpeed);
        const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
        const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
        const s = String(totalSec % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    })();

    // Home/dock position from telemetry (first known location)
    const dockPosition = homePosition || null;

    // Drone home from API (available before telemetry connects)
    const droneHome = selectedDrone?.home_latitude && selectedDrone?.home_longitude
        ? [selectedDrone.home_latitude, selectedDrone.home_longitude]
        : null;

    // Map center priority: drone > telemetry home > API home > default
    const mapCenter = dronePosition || dockPosition || droneHome || defaultCenter;

    // Extract lat/lng pairs for the waypoint polyline
    const linePositions = waypoints.map(wp => [wp.lat, wp.lng]);

    // Connect drone to the first waypoint (only if drone position is known)
    const allLines = waypoints.length > 0 && dronePosition
        ? [dronePosition, ...linePositions]
        : (waypoints.length > 0 ? linePositions : []);

    // Max range circle (use drone max_range or default 1800m)
    const maxRange = selectedDrone?.max_range_meter || 1800;
    const circleCenter = dockPosition || dronePosition;

    return (
        <div className="relative w-full h-full bg-[#181d25]">

            {hasLocation && (
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 z-[10000] text-[9px] font-mono text-gray-300 flex gap-3">
                    <span>ALT {Number(location.altitude ?? 0).toFixed(1)}m</span>
                    <span>SPD {Number(location.ground_speed ?? 0).toFixed(1)}m/s</span>
                    <span>HDG {Number(heading).toFixed(0)}°</span>
                    <span>MODE {(flightMode)}</span>
                </div>
            )}

            <MapContainer
                ref={mapRef}
                center={mapCenter}
                zoom={dronePosition ? 16 : 14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                scrollWheelZoom={true}
                maxZoom={22}
            >
                <MapCenterUpdater dronePosition={dronePosition} homePosition={dockPosition || droneHome} />
                {/* Esri Satellite tile layer */}
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Tiles &copy; Esri"
                    maxZoom={22}
                    maxNativeZoom={19}
                />

                <MapClickHandler onAddWaypoint={onAddWaypoint} circleCenter={circleCenter} maxRange={maxRange} showToast={showToast} />

                {/* Max Radius Circle */}
                {circleCenter && (
                    <Circle center={circleCenter} radius={maxRange} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 1, dashArray: '4, 8' }} />
                )}

                {/* Trajectory trail — cyan line showing where drone has flown */}
                {trajectory && trajectory.length > 1 && (
                    <Polyline
                        positions={trajectory}
                        color="#06b6d4"
                        weight={3}
                        opacity={0.7}
                    />
                )}

                {/* Waypoint route lines */}
                {allLines.length > 1 && (
                    <Polyline positions={allLines} color="#ea580c" weight={2} dashArray="4, 6" />
                )}

                {/* Home/Dock Marker — from telemetry first position */}
                {dockPosition && (
                    <Marker position={dockPosition} icon={dockIcon} />
                )}

                {/* Drone Marker — live from telemetry */}
                {dronePosition && (
                    <Marker position={dronePosition} icon={createDroneIcon(heading)} />
                )}

                {/* Waypoints (add-mode) */}
                {waypoints.map((wp, index) => (
                    <Marker key={wp.id} position={[wp.lat, wp.lng]} icon={createWaypointIcon(index + 1)} />
                ))}

                {/* Mission waypoints from selected mission (view-mode) */}
                {isViewMode && missionWaypoints.length > 0 && (
                    <>
                        <Polyline
                            positions={missionWaypoints.map(wp => [wp.latitude, wp.longitude])}
                            color="#ea580c"
                            weight={2}
                            dashArray="6, 8"
                            opacity={0.6}
                        />
                        {missionWaypoints.map((wp, index) => (
                            <Marker
                                key={`mission-wp-${wp.id || index}`}
                                position={[wp.latitude, wp.longitude]}
                                icon={createWaypointIcon(wp.sequence_order || index + 1)}
                            />
                        ))}
                    </>
                )}
            </MapContainer>

            {/* Map Custom Controls (Zoom/Location) */}
            <div className="absolute top-[60vh] left-4 z-[400] flex flex-col bg-[#1c222c]/90 backdrop-blur border border-[#2a3240] rounded-xl overflow-hidden shadow-lg">
                <button
                    onClick={() => {
                        if (mapRef.current) {
                            if (dronePosition) {
                                mapRef.current.flyTo(dronePosition, 16, { duration: 1.5 });
                            } else if (dockPosition || droneHome) {
                                mapRef.current.flyTo(dockPosition || droneHome, 16, { duration: 1.5 });
                            } else {
                                mapRef.current.flyTo(defaultCenter, 14, { duration: 1.5 });
                            }
                        }
                    }}
                    className="p-3 hover:bg-[#202834] transition flex items-center justify-center border-b border-[#2a3240]"
                    title="Find Current Location"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <polygon points="12 2 15 13 22 13 16 16 18 22 12 18 6 22 8 16 2 13 9 13 12 2" fill="currentColor"></polygon>
                    </svg>
                </button>
                <button
                    onClick={() => mapRef.current?.zoomIn()}
                    className="p-3 hover:bg-[#202834] transition flex items-center justify-center border-b border-[#2a3240]"
                    title="Zoom In"
                >
                    <span className="text-white text-lg font-mono leading-none">+</span>
                </button>
                <button
                    onClick={() => mapRef.current?.zoomOut()}
                    className="p-3 hover:bg-[#202834] transition flex items-center justify-center"
                    title="Zoom Out"
                >
                    <span className="text-white text-lg font-mono leading-none">-</span>
                </button>
            </div>

            {/* Conditionally Render Overlays */}
            {isViewMode ? (
                <>
                    {/* View Mode: Detail Overlay */}
                    <div className="absolute top-4 right-4 z-[400] bg-[#1c222c]/90 backdrop-blur border border-[#2a3240] rounded-xl p-5 w-[280px] shadow-lg pointer-events-none">
                        <div className="flex items-center space-x-2 mb-4">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                <path d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            <span className="text-white text-[13px] font-bold tracking-wide">Detail</span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-5 gap-x-2">
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px] mb-1">Flight Estimation (min)</span>
                                <span className="text-white text-xs font-mono">{formatTime(missionFlightTimeSec)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px] mb-1">Status</span>
                                <span className={`text-xs font-bold ${selectedMission?.status === 'Completed' ? 'text-green-400' :
                                    selectedMission?.status === 'In Progress' ? 'text-blue-400' :
                                        selectedMission?.status === 'Waiting' ? 'text-amber-400' : 'text-white'
                                    }`}>{selectedMission?.status || '--'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px] mb-1">Flight Distance (meter)</span>
                                <span className="text-white text-xs font-bold">{missionFlightDistanceM > 0 ? `${Math.round(missionFlightDistanceM)} Meter` : '--'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px] mb-1">Flight Area</span>
                                <span className="text-white text-xs font-bold">{missionFlightAreaM > 0 ? `${Math.round(missionFlightAreaM)} Meter` : '--'}</span>
                            </div>
                        </div>
                    </div>

                    {/* View Mode: Mission Waypoints List */}
                    <div className="absolute bottom-4 right-4 z-[400] bg-[#1c222c]/90 backdrop-blur border border-[#2a3240] rounded-xl p-4 w-[340px] shadow-lg pointer-events-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                <div>
                                    <h3 className="text-white text-[13px] font-bold">{selectedMission?.mission_name || 'No Mission Selected'}</h3>
                                    <p className="text-gray-400 text-[10px] mt-0.5">{formatSchedule(selectedMission?.schedule)}</p>
                                </div>
                            </div>
                            <div className="border border-gray-500 rounded-full px-3 py-1 bg-[#171c24]">
                                <span className="text-gray-300 text-[10px] font-semibold">{missionWaypoints.length} Waypoint</span>
                            </div>
                        </div>

                        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {missionWaypoints.length > 0 ? missionWaypoints.map((wp, i) => (
                                <div key={wp.id || i} className="bg-[#171c24] border border-[#2a3240] rounded-lg p-3 relative">
                                    <h4 className="text-white text-xs font-bold mb-2 tracking-wide">Point {wp.sequence_order || i + 1}</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-400 text-[9px] uppercase">Altitude (M)</span>
                                            <span className="text-white text-[11px] font-mono pl-1">{wp.altitude ?? '--'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-400 text-[9px] uppercase">Duration</span>
                                            <span className="text-white text-[11px] font-mono pl-1">{wp.action_duration ?? '--'}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-gray-400 text-[9px] uppercase">Action</span>
                                            <span className="text-white text-[11px] pl-1">{wp.action || '--'}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-gray-500 text-xs italic text-center py-4">Click a mission to view waypoints</div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Add Mode: Drone Condition Overlay */}
                    <div className="absolute top-4 left-4 z-[400] bg-[#1c222c]/90 backdrop-blur border border-[#2a3240] rounded-xl p-4 w-[280px] shadow-lg pointer-events-none">
                        <div className="flex items-center space-x-2 mb-4">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            <span className="text-white text-xs font-bold tracking-wide">Drone Condition</span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-4">
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px] mb-1">Battery Level</span>
                                <span className={`text-[11px] font-semibold ${batteryPercent != null ? (batteryPercent >= 60 ? 'text-green-400' : batteryPercent >= 30 ? 'text-amber-400' : 'text-red-400') : 'text-white'}`}>{batteryLabel}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px] mb-1">Flight Time Estimation</span>
                                <span className="text-white text-[11px] font-mono">{flightTimeLabel}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px] mb-1">Drone Speed</span>
                                <span className="text-white text-[11px] font-semibold">{speedLabel}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px] mb-1">Flight Distance Estimation</span>
                                <span className="text-white text-[11px] font-mono">{distanceLabel}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-gray-400 text-[10px]">Weather Condition</span>
                            <div className="bg-[#171c24] border border-[#2a3240] rounded-lg p-3">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-xl shadow-inner shadow-yellow-500/50 relative">☁️</div>
                                    <div className="flex-1 flex justify-between items-center">
                                        <span className="text-white text-sm font-bold">Cloudy</span>
                                        <span className="text-white text-lg font-bold">31°C</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400">
                                    <div className="flex space-x-1"><span>Gust</span><span className="text-white font-mono">6 m/s</span></div>
                                    <div className="flex space-x-1"><span>Wind</span><span className="text-white font-mono">6 m/s</span></div>
                                    <div className="flex space-x-1"><span>Humid</span><span className="text-white font-mono">6 m/s</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add Mode: Legend Overlay */}
                    <div className="absolute top-4 right-4 z-[400] bg-[#1c222c]/90 backdrop-blur border border-[#2a3240] rounded-xl p-4 w-[240px] shadow-lg pointer-events-none">
                        <div className="flex items-center space-x-2 mb-3">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            <span className="text-white text-xs font-bold tracking-wide">Legend</span>
                        </div>

                        <div className="grid grid-cols-2 gap-y-3">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full border border-blue-400 bg-blue-400/20"></div>
                                <span className="text-gray-300 text-[10px] font-medium">Max Radius</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#d4af37] text-black text-[7px] font-bold flex items-center justify-center">H</div>
                                <span className="text-gray-300 text-[10px] font-medium">Dock</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#ea580c] flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>
                                <span className="text-gray-300 text-[10px] font-medium">Drone</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="flex space-x-[2px] text-[#3b82f6] text-[10px] font-bold font-mono">
                                    <span>1</span><span>/</span><span>2</span><span>/</span><span>3</span>
                                </div>
                                <span className="text-gray-300 text-[10px] font-medium ml-1">Waypoint</span>
                            </div>
                        </div>
                    </div>

                    {/* Add Mode: Bottom Controls Overlay */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] flex flex-col items-center">
                        <div className="flex space-x-4 mt-2">
                            <button className="bg-transparent hover:brightness-110 transition flex items-center space-x-2">
                                <img src="/src/assets/btn_cancel_mission.png" alt="" />
                            </button>
                            <button className="bg-transparent hover:brightness-110 transition">
                                <img src="/src/assets/btn_set_schedule.png" alt="" />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* <TelemetryOverlay telemetry={telemetry} /> */}

            {/* Custom Toast Notification */}
            {toast && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] animate-[slideDown_0.35s_ease-out]"
                    style={{ animation: 'slideDown 0.35s ease-out' }}>
                    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-md min-w-[320px] max-w-[480px] ${toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 shadow-emerald-900/40' :
                        toast.type === 'error' ? 'bg-red-950/90 border-red-500/40 shadow-red-900/40' :
                            'bg-amber-950/90 border-amber-500/40 shadow-amber-900/40'
                        }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-emerald-500/20' :
                            toast.type === 'error' ? 'bg-red-500/20' :
                                'bg-amber-500/20'
                            }`}>
                            {toast.type === 'success' && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            )}
                            {toast.type === 'error' && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            )}
                            {toast.type === 'warning' && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className={`text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${toast.type === 'success' ? 'text-emerald-400' :
                                toast.type === 'error' ? 'text-red-400' :
                                    'text-amber-400'
                                }`}>
                                {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Warning'}
                            </div>
                            <div className="text-[13px] text-gray-200 leading-snug">{toast.message}</div>
                        </div>

                        <button
                            onClick={() => { if (toastTimer.current) clearTimeout(toastTimer.current); setToast(null); }}
                            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0"
                        >
                            <svg width="12" height="12" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-400">
                                <path d="M2 2L8 8M8 2L2 8" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </div>
    );
}
