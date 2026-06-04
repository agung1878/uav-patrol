import React, { useState, useEffect, useRef } from 'react';
import MainVideoFeedPanel from '../panels/MainVideoFeedPanel';
import MapViewPanel from '../panels/MapViewPanel';
import MissionListPanel from '../panels/MissionListPanel';
import DroneInfoPanel from '../panels/DroneInfoPanel';
import StreamButtonPanel from '../panels/StreamButtonPanel';
import QuickLaunchDialog from '../components/QuickLaunchDialog';
import QuickLaunchDialogForm from '../components/QuickLaunchDialogForm';
import { uavService, missionService } from '../../../services/api';
import useTelemetry from '../../../shared/hooks/useTelemetry';
import useStreamManager from '../../../shared/hooks/useStreamManager';

export default function DashboardPage() {
    const [isLaunchDialogOpen, setIsLaunchDialogOpen] = useState(false);
    const [isLaunchFormOpen, setIsLaunchFormOpen] = useState(false);
    const [selectedLaunchType, setSelectedLaunchType] = useState('ROI');

    // Toast notification state
    const [toast, setToast] = useState(null); // { type: 'success'|'error'|'warning', message: string }
    const toastTimer = useRef(null);
    const showToast = (type, message, duration = 4000) => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setToast({ type, message });
        toastTimer.current = setTimeout(() => setToast(null), duration);
    };

    // Drone state (lifted up from DroneInfoPanel)
    const [drones, setDrones] = useState([]);
    const [selectedDrone, setSelectedDrone] = useState(null);
    const [isDronesLoading, setIsDronesLoading] = useState(true);
    const [dronesError, setDronesError] = useState('');

    // Fetch drone
    useEffect(() => {
        const fetchDrones = async () => {
            try {
                const data = await uavService.getUav();
                if (data && data.id) {
                    const drone = { ...data, name: 'DRONE 1' };
                    setDrones([drone]);
                    setSelectedDrone(drone);
                } else {
                    setDronesError('No UAVs Available');
                }
            } catch (error) {
                console.error("Error fetching drone info:", error);
                if (error.message === 'No authentication token found') {
                    setDronesError('Not Authenticated');
                } else {
                    setDronesError('Error Loading Data');
                }
            } finally {
                setIsDronesLoading(false);
            }
        };
        fetchDrones();
    }, []);

    // Telemetry — subscribe to all drone IDs from the fetched list
    const uavIds = drones.map(d => d.id);
    const { telemetry, isConnected: isTelemetryConnected, error: telemetryError, positionHistory, homePositions } = useTelemetry(uavIds);

    // Get telemetry for the selected drone
    const selectedTelemetry = selectedDrone ? telemetry[selectedDrone.id] : null;
    const selectedTrajectory = selectedDrone ? positionHistory[selectedDrone.id] : null;
    const selectedHome = selectedDrone ? homePositions[selectedDrone.id] : null;

    // Fetch active mission waypoints for the selected drone
    const [missionWaypoints, setMissionWaypoints] = useState(null);
    const [activeMission, setActiveMission] = useState(null);
    useEffect(() => {
        if (!selectedDrone) return;
        const fetchActiveMission = async () => {
            try {
                const data = await missionService.getMissions(1, 50, selectedDrone.id);
                const found = data?.items?.find(m => m.status === 'In Progress');
                if (found) {
                    const detail = await missionService.getMissionDetail(found.id);
                    setMissionWaypoints(detail?.waypoints || null);
                    setActiveMission(found);
                } else {
                    setMissionWaypoints(null);
                    setActiveMission(null);
                }
            } catch (err) {
                console.error('[Dashboard] Failed to fetch mission waypoints:', err);
                setMissionWaypoints(null);
                setActiveMission(null);
            }
        };
        fetchActiveMission();
        // Re-check every 30 seconds
        const interval = setInterval(fetchActiveMission, 30000);
        return () => clearInterval(interval);
    }, [selectedDrone?.id]);

    // Stream manager — watches vehicle_state and auto-starts/stops stream + WebRTC
    const { videoStream, isStreaming, isConnecting, streamError } = useStreamManager(selectedDrone?.id, selectedTelemetry);

    // Heading for compass widget
    const droneHeading = selectedTelemetry?.location?.heading || 0;

    return (
        <>
        <div
            className="p-[28px] flex flex-row gap-[28px] w-full h-[calc(100vh-104px)] overflow-hidden"
            style={{ backgroundImage: `url('/src/assets/img_background.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            {/* Column 1 */}
            <div className="flex-1 flex flex-col gap-[28px] min-w-0">
                {/* Video Frame */}
                <div className="flex-1 rounded-[24px] border border-[#2a3240] overflow-hidden shadow-lg min-h-0">
                    <MainVideoFeedPanel
                        videoStream={videoStream}
                        isStreaming={isStreaming}
                        isConnecting={isConnecting}
                        streamError={streamError}
                        heading={droneHeading}
                    />
                </div>
                {/* Bottom Container View */}
                <div className="h-[240px] flex flex-row p-[14px] gap-[16px] shrink-0 bg-[#27313D] border border-[#2a3240] rounded-[24px] shadow-lg overflow-hidden">
                    <div className={`w-[413px] h-full shrink-0 ${(isLaunchDialogOpen || isLaunchFormOpen) ? 'invisible' : ''}`}>
                        <MapViewPanel telemetry={selectedTelemetry} selectedDrone={selectedDrone} trajectory={selectedTrajectory} homePosition={selectedHome} missionWaypoints={missionWaypoints} />
                    </div>
                    <div className="flex-1 h-full min-w-0">
                        <MissionListPanel />
                    </div>
                </div>
            </div>

            {/* Column 2 */}
            <div className="w-[440px] shrink-0 flex flex-col gap-[28px]">
                {/* Drone Info */}
                <div className="flex-1 min-h-0">
                    <DroneInfoPanel
                        drones={drones}
                        selectedDrone={selectedDrone}
                        onSelectDrone={setSelectedDrone}
                        isLoading={isDronesLoading}
                        errorMsg={dronesError}
                        telemetry={selectedTelemetry}
                        isTelemetryConnected={isTelemetryConnected}
                    />
                </div>
                {/* Button Stream */}
                <div className="h-[360px] shrink-0">
                    <StreamButtonPanel 
                        onLaunchClick={() => setIsLaunchDialogOpen(true)} 
                        isStreaming={isStreaming || isConnecting}
                    />
                </div>
            </div>

            {/* Dialogs */}
            <QuickLaunchDialog
                isOpen={isLaunchDialogOpen}
                onClose={() => setIsLaunchDialogOpen(false)}
                onConfirm={(selectedType) => {
                    setSelectedLaunchType(selectedType);
                    setIsLaunchDialogOpen(false);
                    setIsLaunchFormOpen(true);
                }}
            />

            <QuickLaunchDialogForm
                isOpen={isLaunchFormOpen}
                missionType={selectedLaunchType}
                telemetry={selectedTelemetry}
                homePosition={selectedHome}
                selectedDrone={selectedDrone}
                onClose={() => setIsLaunchFormOpen(false)}
                onLaunch={async (launchData) => {
                    const { type, takeoffAltitude, flightAltitude, holdDuration, roiPosition, spiralWaypoints } = launchData;
                    console.log('[QuickLaunch] Launching:', JSON.stringify(launchData, null, 2));

                    // Build "now" schedule (2 minutes from now)
                    const pad = (n) => String(n).padStart(2, '0');
                    const offset = new Date().getTimezoneOffset();
                    const sign = offset <= 0 ? '+' : '-';
                    const tzOffset = `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
                    const now = new Date(Date.now() + 2 * 60 * 1000);
                    const runAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00${tzOffset}`;

                    const missionData = {
                        mission_name: `Quick ${type} ${pad(now.getHours())}${pad(now.getMinutes())}`,
                        takeoff_altitude: takeoffAltitude || 15,
                        status: 'Waiting',
                        schedule_timezone: 'Asia/Jakarta',
                        schedule_type: 'one_time',
                        schedule_config: { run_at: runAt },
                    };

                    if (type === 'Launch') {
                        // Launch mission: simple takeoff → hold → land, no waypoints or ROI
                        missionData.takeoff_hold_duration = holdDuration || 30;
                        missionData.waypoints = [];
                    } else if (type === 'ROI') {
                        // ROI mission: waypoint at takeoff/home position, ROI field for camera target
                        if (!roiPosition) {
                            showToast('warning', 'Please set an ROI point on the map first.');
                            return;
                        }
                        // Use home/dock position for the waypoint (takeoff coordinates)
                        const homeLat = selectedHome ? selectedHome[0] : (selectedTelemetry?.location?.latitude || roiPosition.lat);
                        const homeLng = selectedHome ? selectedHome[1] : (selectedTelemetry?.location?.longitude || roiPosition.lng);
                        missionData.waypoints = [{
                            sequence_order: 1,
                            latitude: homeLat,
                            longitude: homeLng,
                            altitude: takeoffAltitude || 15,
                            action: 'Take Picture',
                            action_duration: 5,
                        }];
                        missionData.roi = {
                            latitude: roiPosition.lat,
                            longitude: roiPosition.lng,
                        };
                    } else if (type === 'Spiral') {
                        // Spiral mission: waypoints from generated spiral points
                        if (!spiralWaypoints || spiralWaypoints.length === 0) {
                            showToast('warning', 'Please generate spiral waypoints first.');
                            return;
                        }
                        missionData.waypoints = spiralWaypoints.map((wp, i) => ({
                            sequence_order: i + 1,
                            latitude: wp.lat,
                            longitude: wp.lng,
                            altitude: flightAltitude || takeoffAltitude || 15,
                            action: 'Take Picture',
                            action_duration: 5,
                        }));
                    }

                    try {
                        console.log('[QuickLaunch] Registering mission:', JSON.stringify(missionData, null, 2));
                        const result = await missionService.registerMission(missionData);
                        console.log('[QuickLaunch] Result:', result);

                        if (result.error) {
                            showToast('error', `Mission creation failed: ${result.error}`);
                            return;
                        }

                        setIsLaunchFormOpen(false);
                        showToast('success', 'Mission launched successfully!');
                    } catch (err) {
                        console.error('[QuickLaunch] Error:', err);
                        showToast('error', `Failed to launch mission: ${err.message}`);
                    }
                }}
            />
        </div>

            {/* Custom Toast Notification */}
            {toast && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] animate-[slideDown_0.35s_ease-out]"
                     style={{ animation: 'slideDown 0.35s ease-out' }}>
                    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-md min-w-[320px] max-w-[480px] ${
                        toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 shadow-emerald-900/40' :
                        toast.type === 'error' ? 'bg-red-950/90 border-red-500/40 shadow-red-900/40' :
                        'bg-amber-950/90 border-amber-500/40 shadow-amber-900/40'
                    }`}>
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            toast.type === 'success' ? 'bg-emerald-500/20' :
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

                        {/* Message */}
                        <div className="flex-1">
                            <div className={`text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${
                                toast.type === 'success' ? 'text-emerald-400' :
                                toast.type === 'error' ? 'text-red-400' :
                                'text-amber-400'
                            }`}>
                                {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Warning'}
                            </div>
                            <div className="text-[13px] text-gray-200 leading-snug">{toast.message}</div>
                        </div>

                        {/* Close button */}
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

            {/* Toast slide-down animation */}
            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translate(-50%, -20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </>
    );
}

