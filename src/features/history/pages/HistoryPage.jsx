import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { missionService, recordingService } from '../../../services/api';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createWaypointIcon = (number) => new L.DivIcon({
    className: 'custom-waypoint-icon',
    html: `<div class="w-5 h-5 rounded-full bg-[#3b5374] border border-[#587fae] text-white text-[10px] font-bold flex items-center justify-center shadow-lg">${number}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const homeIcon = new L.DivIcon({
    className: 'custom-home-icon',
    html: `<div class="w-5 h-5 rounded-full bg-[#d4af37] text-black text-[10px] font-bold flex items-center justify-center shadow-lg border-2 border-[#d4af37]/50">H</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const DownloadIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#3b82f6] opacity-80">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
);

const formatDate = (dateString) => {
    if (!dateString) return '--';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}\n${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const formatDuration = (startedAt, completedAt) => {
    if (!startedAt || !completedAt) return '--';
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diffSec = Math.round((end - start) / 1000);
    if (diffSec < 0) return '--';
    const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
    const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
    const s = String(diffSec % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
};

const formatScheduleShort = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = (n) => String(n).padStart(2, '0');
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
};

const StatusBadge = ({ status, failureReason, onShowTooltip, onHideTooltip }) => {
    const colorMap = {
        'Completed': 'text-green-400',
        'Failed': 'text-red-400',
        'In Progress': 'text-blue-400',
        'Waiting': 'text-amber-400',
    };
    const handleMouseEnter = (e) => {
        if (status === 'Failed' && failureReason && onShowTooltip) {
            const rect = e.currentTarget.getBoundingClientRect();
            onShowTooltip({ text: failureReason, x: rect.left + rect.width / 2, y: rect.top });
        }
    };
    return (
        <span
            className={`font-semibold ${colorMap[status] || 'text-gray-300'} ${status === 'Failed' && failureReason ? 'cursor-default' : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onHideTooltip}
        >
            {status || '--'}
        </span>
    );
};

export default function HistoryPage() {
    const [historyItems, setHistoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, total_pages: 1, has_next: false, has_prev: false });
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [failureTooltip, setFailureTooltip] = useState(null);
    const limit = 20;

    // Recording state
    const [recordingUrl, setRecordingUrl] = useState(null);
    const [recordingLoading, setRecordingLoading] = useState(false);
    const [recordingError, setRecordingError] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef(null);
    const containerRef = useRef(null);

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

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setErrorMsg('');
                const data = await missionService.getMissionHistory(page, limit);
                setHistoryItems(data.items || []);
                setPagination({
                    total: data.total || 0,
                    total_pages: data.total_pages || 1,
                    has_next: data.has_next || false,
                    has_prev: data.has_prev || false,
                });
                // Auto-select first item if none selected
                if (!selectedItem && data.items?.length > 0) {
                    setSelectedItem(data.items[0]);
                }
            } catch (err) {
                console.error('Failed to fetch mission history:', err);
                setErrorMsg(err.message || 'Failed to load history');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [page]);

    // Fetch recording when a mission is selected
    useEffect(() => {
        if (!selectedItem) {
            setRecordingUrl(null);
            setRecordingError(null);
            return;
        }

        const missionId = selectedItem.mission_id || selectedItem.id;
        if (!missionId) return;

        const fetchRecording = async () => {
            setRecordingLoading(true);
            setRecordingUrl(null);
            setRecordingError(null);
            setIsPlaying(false);
            setCurrentTime(0);
            setDuration(0);
            try {
                const data = await recordingService.getMissionRecording(missionId);
                if (data && data.recording_url) {
                    setRecordingUrl(data.recording_url);
                    console.log('[History] Recording found:', data.recording_url);
                } else {
                    setRecordingError('No recording available');
                }
            } catch (err) {
                console.error('[History] Failed to fetch recording:', err);
                setRecordingError(err.message || 'Failed to load recording');
            } finally {
                setRecordingLoading(false);
            }
        };
        fetchRecording();
    }, [selectedItem?.id, selectedItem?.mission_id]);

    const handlePlayPause = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e) => {
        if (!videoRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        videoRef.current.currentTime = percent * duration;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Filtered items by search
    const filteredItems = searchQuery
        ? historyItems.filter(item =>
            item.mission_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.task_summary?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : historyItems;

    // Selected item trajectory data
    const selectedWaypoints = selectedItem?.mission_snapshot?.waypoints || [];
    const homePosition = selectedItem?.uav_home_latitude && selectedItem?.uav_home_longitude
        ? [selectedItem.uav_home_latitude, selectedItem.uav_home_longitude]
        : null;
    const waypointPositions = selectedWaypoints.map(wp => [wp.latitude, wp.longitude]);
    const mapCenter = waypointPositions.length > 0
        ? waypointPositions[0]
        : (homePosition || [-6.200000, 106.816666]);

    return (
        <>
        <div
            className="p-[28px] flex gap-[20px] w-full h-[calc(100vh-104px)] overflow-hidden"
            style={{ backgroundImage: `url('/src/assets/img_background.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            {/* LEFT PANE: Mission History List */}
            <div className="w-[60%] flex flex-col gap-5 rounded-[24px] border border-[#2a3240] shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-[#151a25]/95 backdrop-blur p-6">

                {/* Header/Controls Area */}
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-[45%] text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input
                                type="text"
                                placeholder="Search mission..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[#1e2532] text-sm text-gray-200 placeholder-gray-500 rounded-[8px] pl-10 pr-4 py-2.5 w-[300px] border border-[#2a3240] focus:outline-none focus:border-orange-500/50 transition-colors"
                            />
                        </div>
                        <button className="h-[42px] px-3.5 bg-[#1e2532] hover:bg-[#252b36] border border-[#2a3240] rounded-[8px] flex items-center justify-center text-gray-300 transition-colors shadow-sm">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Pagination info */}
                        <span className="text-gray-400 text-[11px] font-medium">
                            {pagination.total} record{pagination.total !== 1 ? 's' : ''} · Page {page}/{pagination.total_pages}
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={!pagination.has_prev}
                                className="h-[36px] px-3 bg-[#1e2532] hover:bg-[#252b36] border border-[#2a3240] rounded-[6px] text-gray-300 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                ‹ Prev
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={!pagination.has_next}
                                className="h-[36px] px-3 bg-[#1e2532] hover:bg-[#252b36] border border-[#2a3240] rounded-[6px] text-gray-300 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                Next ›
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                <div className="flex-1 bg-[#1e2532] rounded-[12px] border border-[#2a3240] overflow-hidden flex flex-col shadow-inner">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1.8fr_1fr_0.8fr_1.5fr_0.8fr_0.8fr_1.2fr] gap-4 px-6 py-4 bg-[#1e2532] border-b border-[#2a3240] text-[13px] font-bold text-gray-100 tracking-wide sticky top-0 z-10">
                        <div>Mission</div>
                        <div>Schedule</div>
                        <div>Waypoints</div>
                        <div>Task</div>
                        <div>Duration</div>
                        <div>Status</div>
                        <div>Media</div>
                    </div>

                    {/* Table Body (Scrollable) */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-2">
                        {loading ? (
                            <div className="flex items-center justify-center h-20 text-gray-400 text-xs">
                                <svg className="animate-spin mr-2 h-4 w-4 text-orange-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                Loading history...
                            </div>
                        ) : errorMsg ? (
                            <div className="flex items-center justify-center h-20 text-red-400 text-xs">{errorMsg}</div>
                        ) : filteredItems.length === 0 ? (
                            <div className="flex items-center justify-center h-20 text-gray-500 text-xs italic">No history records found</div>
                        ) : (
                            filteredItems.map((row) => (
                                <div
                                    key={row.id}
                                    className={`grid grid-cols-[1.8fr_1fr_0.8fr_1.5fr_0.8fr_0.8fr_1.2fr] gap-4 px-6 py-3.5 border-b border-[#2a3240]/50 hover:bg-[#252b36] transition-colors items-center text-[12px] cursor-pointer ${selectedItem?.id === row.id ? 'bg-[#252b36] border-l-2 border-l-orange-500' : ''}`}
                                    onClick={() => setSelectedItem(row)}
                                >
                                    <div className="text-gray-200 font-medium">{row.mission_name}</div>
                                    <div className="text-gray-300 leading-tight whitespace-pre-line text-[10px]">{formatDate(row.scheduled_run_at)}</div>
                                    <div className="text-gray-300">{row.waypoint_count ?? '--'}</div>
                                    <div className="text-gray-300 truncate" title={row.task_summary}>{row.task_summary || '--'}</div>
                                    <div className="text-gray-300 font-mono text-[11px]">{formatDuration(row.started_at, row.completed_at)}</div>
                                    <div><StatusBadge status={row.status} failureReason={row.failure_reason} onShowTooltip={setFailureTooltip} onHideTooltip={() => setFailureTooltip(null)} /></div>

                                    {/* Media Column */}
                                    <div className="flex items-center gap-2">
                                        {row.media_count > 0 ? (
                                            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                                                <DownloadIcon />
                                                <div className="flex flex-col leading-tight">
                                                    <span className="text-[#3b82f6] underline decoration-[#3b82f6]/40 underline-offset-2">Download</span>
                                                    <span className="text-[10px] text-gray-500">{row.media_count} Media</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500 text-[11px] italic">No media</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT PANE: Trajectory & Detail */}
            <div className="flex-1 flex flex-col gap-[20px]">
                {/* Top: Trajectory Map */}
                <div className="flex-1 rounded-[24px] border border-[#2a3240] overflow-hidden shadow-lg bg-[#111827] relative">
                    {selectedItem ? (
                        <MapContainer
                            key={selectedItem.id}
                            center={mapCenter}
                            zoom={16}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                            />

                            {/* Waypoint route line */}
                            {waypointPositions.length > 1 && (
                                <Polyline
                                    positions={waypointPositions}
                                    color="#ea580c"
                                    weight={2}
                                    dashArray="6, 8"
                                    opacity={0.6}
                                />
                            )}

                            {/* Home marker */}
                            {homePosition && (
                                <Marker position={homePosition} icon={homeIcon} />
                            )}

                            {/* Waypoint markers */}
                            {selectedWaypoints.map((wp, index) => (
                                <Marker
                                    key={`wp-${wp.id || index}`}
                                    position={[wp.latitude, wp.longitude]}
                                    icon={createWaypointIcon(wp.sequence_order || index + 1)}
                                />
                            ))}
                        </MapContainer>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                            Select a mission to view trajectory
                        </div>
                    )}

                    {/* Trajectory label */}
                    <div className="absolute top-4 left-4 z-[400] bg-orange-600/90 backdrop-blur-sm px-4 py-1.5 rounded-[8px] text-[12px] font-bold text-white uppercase tracking-wider border border-orange-500 shadow-md">
                        Trajectory
                    </div>

                    {/* Bottom Info Card */}
                    {selectedItem && (
                        <div className="absolute bottom-4 left-4 right-4 z-[400] bg-[#151a25]/90 backdrop-blur border border-[#2a3240] rounded-[16px] p-4 flex items-center justify-between shadow-lg">
                            <div className="flex flex-col">
                                <div className="text-orange-500 font-bold text-[14px]">{selectedItem.mission_name}</div>
                                <div className="text-gray-400 text-[11px] mt-1">{formatScheduleShort(selectedItem.scheduled_run_at)}</div>
                            </div>
                            <div className="flex items-center gap-4 text-[11px]">
                                <div className="flex flex-col items-center">
                                    <span className="text-gray-400 text-[9px] uppercase">Waypoints</span>
                                    <span className="text-white font-bold">{selectedItem.waypoint_count ?? '--'}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-gray-400 text-[9px] uppercase">Duration</span>
                                    <span className="text-white font-mono">{formatDuration(selectedItem.started_at, selectedItem.completed_at)}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-gray-400 text-[9px] uppercase">Status</span>
                                    <StatusBadge status={selectedItem.status} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom: Video Player */}
                <div ref={containerRef} className="flex-1 rounded-[24px] border border-[#2a3240] overflow-hidden shadow-lg bg-black relative group">

                    {/* Video element */}
                    {recordingUrl ? (
                        <video
                            ref={videoRef}
                            src={recordingUrl}
                            className="absolute inset-0 w-full h-full object-cover z-0"
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                            playsInline
                        />
                    ) : (
                        <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: `url('/src/assets/dock_cam_placeholder.png')` }}></div>
                    )}

                    {/* Loading overlay */}
                    {recordingLoading && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                            <svg className="animate-spin h-8 w-8 text-orange-500 mb-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            <span className="text-gray-300 text-[12px] font-medium">Loading recording...</span>
                        </div>
                    )}

                    {/* Error overlay */}
                    {recordingError && !recordingLoading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" className="mb-2 opacity-60">
                                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" />
                            </svg>
                            <span className="text-gray-400 text-[12px]">{recordingError}</span>
                        </div>
                    )}

                    {/* Media label */}
                    <div className="absolute top-4 left-4 z-20 bg-orange-600/90 backdrop-blur-sm px-4 py-1.5 rounded-[8px] text-[12px] font-bold text-white uppercase tracking-wider border border-orange-500 shadow-md">
                        Media
                    </div>

                    {/* Fullscreen Button */}
                    <div className="absolute top-4 right-4 z-20">
                        <button 
                            onClick={toggleFullscreen}
                            className="bg-black/50 hover:bg-black/70 border border-gray-500 px-2.5 py-1.5 rounded flex items-center justify-center transition-colors shadow-md"
                            title="Toggle Fullscreen"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-200">
                                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                            </svg>
                        </button>
                    </div>

                    {/* Play/Pause Button Overlay */}
                    {recordingUrl && !recordingLoading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10" onClick={handlePlayPause}>
                            {!isPlaying && (
                                <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-orange-500/80 hover:border-orange-400 transition-all cursor-pointer">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="translate-x-0.5"><path d="M5 3l14 9-14 9V3z" /></svg>
                                </div>
                            )}
                        </div>
                    )}

                    {/* No recording placeholder play button */}
                    {!recordingUrl && !recordingLoading && !recordingError && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="translate-x-0.5 opacity-40"><path d="M5 3l14 9-14 9V3z" /></svg>
                            </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {recordingUrl && (
                        <div
                            className="absolute bottom-6 left-6 right-6 z-20 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                            {/* Time elapsed */}
                            <span className="text-white text-[10px] font-mono min-w-[40px] text-right">{formatTime(currentTime)}</span>

                            {/* Seekable bar */}
                            <div
                                className="flex-1 h-1.5 bg-[#2a3240] rounded-full overflow-visible cursor-pointer relative shadow-[0_0_10px_rgba(0,0,0,0.8)]"
                                onClick={handleSeek}
                            >
                                {/* Filled */}
                                <div className="absolute top-0 left-0 h-full bg-orange-500 rounded-full transition-all duration-150" style={{ width: `${progressPercent}%` }}></div>
                                {/* Playhead */}
                                <div
                                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_4px_rgba(0,0,0,0.5)] border-2 border-orange-500 transition-all duration-150"
                                    style={{ left: `${progressPercent}%` }}
                                ></div>
                            </div>

                            {/* Time remaining */}
                            <span className="text-white text-[10px] font-mono min-w-[40px]">{formatTime(duration)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

            {/* Fixed-position failure reason tooltip (rendered outside scroll container) */}
            {failureTooltip && (
                <div
                    className="fixed z-[9999] px-3 py-2 bg-[#1c222c] border border-[#2a3240] rounded-lg shadow-xl text-[11px] text-red-300 w-[240px] leading-relaxed pointer-events-none"
                    style={{ left: failureTooltip.x, top: failureTooltip.y, transform: 'translate(-50%, -100%) translateY(-10px)' }}
                >
                    <div className="font-semibold text-red-400 mb-1 text-[10px] uppercase tracking-wider">Failure Reason</div>
                    {failureTooltip.text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1c222c] border-r border-b border-[#2a3240] rotate-45 -mt-1"></div>
                </div>
            )}
        </>
    );
}
