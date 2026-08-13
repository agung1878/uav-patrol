import React, { useState, useEffect, useRef } from 'react';
import MissionMapPanel from '../panels/MissionMapPanel';
import WaypointSelectionPanel from '../panels/WaypointSelectionPanel';
import MissionListPanel from '../panels/MissionListPanel';
import DroneCamPanel from '../panels/DroneCamPanel';
import MissionDetailPanel from '../panels/MissionDetailPanel';
import ConflictDialog from '../components/ConflictDialog';
import CustomDialog from '../../../shared/components/CustomDialog';
import { uavService, missionService } from '../../../services/api';
import useTelemetry from '../../../shared/hooks/useTelemetry';

export default function MissionPage() {
    const [isAddingMission, setIsAddingMission] = useState(false);
    // Selected mission detail (when user clicks a mission in the list)
    const [selectedMission, setSelectedMission] = useState(null);
    // Shared state for waypoints between the map and the waypoint list
    const [waypoints, setWaypoints] = useState([]);
    // Per-waypoint metadata (altitude, action, etc.) keyed by waypoint id
    const [waypointsData, setWaypointsData] = useState({});

    // Drone list for UAV selection
    const [drones, setDrones] = useState([]);
    const [selectedUavId, setSelectedUavId] = useState(null);

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Conflict preview state
    const [conflictData, setConflictData] = useState(null);
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const pendingMissionData = useRef(null);
    // History guard state
    const [showHistoryGuard, setShowHistoryGuard] = useState(false);
    const [historyGuardData, setHistoryGuardData] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState('');

    // Import guard state
    const [importDialogState, setImportDialogState] = useState({ isOpen: false, message: '' });
    // Export state
    const [exportDialogState, setExportDialogState] = useState({ isOpen: false, fileName: '' });

    // Fetch drones on mount
    useEffect(() => {
        const fetchDrones = async () => {
            try {
                const data = await uavService.getUav();
                if (data && data.id) {
                    const drone = { ...data, name: 'DRONE 1' };
                    setDrones([drone]);
                    setSelectedUavId(drone.id);
                }
            } catch (err) {
                console.error('Failed to fetch drones:', err);
            }
        };
        fetchDrones();
    }, []);

    // Telemetry — subscribe to all drone IDs
    const uavIds = drones.map(d => d.id);
    const { telemetry, positionHistory, homePositions, missionStatusVersion } = useTelemetry(uavIds);

    // Get telemetry for the selected drone
    const selectedDroneObj = drones.find(d => d.id === selectedUavId) || null;
    const selectedTelemetry = selectedUavId ? telemetry[selectedUavId] : null;
    const selectedTrajectory = selectedUavId ? positionHistory[selectedUavId] : null;
    const selectedHome = selectedUavId ? homePositions[selectedUavId] : null;

    const handleAddWaypoint = (latlng) => {
        if (!isAddingMission) return;
        setWaypoints((prev) => [...prev, { id: prev.length + 1, lat: latlng.lat, lng: latlng.lng }]);
    };

    // Fetch mission detail when user clicks a mission in the list
    const handleSelectMission = async (missionId) => {
        try {
            const detail = await missionService.getMissionDetail(missionId);
            setSelectedMission(detail);
        } catch (err) {
            console.error('Failed to fetch mission detail:', err);
        }
    };

    const handleWaypointDataChange = (id, field, value) => {
        setWaypointsData(prev => ({
            ...prev,
            [id]: { ...(prev[id] || { altitude: 50, action: 'Take Picture', action_duration: 5 }), [field]: value }
        }));
    };

    const handleRemoveWaypoint = (id) => {
        setWaypoints(prev => prev.filter(wp => wp.id !== id));
        setWaypointsData(prev => {
            const newData = { ...prev };
            delete newData[id];
            return newData;
        });
    };

    const handleClearWaypoints = () => {
        setWaypoints([]);
        setWaypointsData({});
    };

    const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // metres
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const handleImportWaypoints = (importedData) => {
        if (!Array.isArray(importedData)) {
            setImportDialogState({ isOpen: true, message: "JSON must be an array of waypoints" });
            return;
        }

        const maxRange = selectedDroneObj?.max_range_meter || 1800;
        const dronePosition = selectedTelemetry?.location ? [selectedTelemetry.location.latitude, selectedTelemetry.location.longitude] : null;
        const dockPosition = selectedHome || null;
        const droneHome = selectedDroneObj?.home_latitude != null ? [selectedDroneObj.home_latitude, selectedDroneObj.home_longitude] : null;
        const circleCenter = dockPosition || dronePosition || droneHome;

        const newWaypoints = [];
        const newWaypointsData = {};
        let currentId = 1;
        
        for (const wp of importedData) {
            if (wp.latitude !== undefined && wp.longitude !== undefined) {
                if (circleCenter) {
                    const distance = getDistanceFromLatLonInMeters(circleCenter[0], circleCenter[1], wp.latitude, wp.longitude);
                    if (distance > maxRange) {
                        setImportDialogState({ 
                            isOpen: true, 
                            message: `Import failed: Waypoint ${currentId} is outside the allowed drone range fence (${Math.round(distance)}m > ${maxRange}m).`
                        });
                        return; // Stop import entirely
                    }
                }

                newWaypoints.push({ id: currentId, lat: wp.latitude, lng: wp.longitude });
                newWaypointsData[currentId] = {
                    altitude: wp.altitude ?? 50,
                    camera_tilt: wp.camera_tilt ?? -45,
                    camera_yaw: wp.camera_yaw ?? 0,
                    action: wp.action || 'Take Picture',
                    action_duration: wp.action_duration ?? 5
                };
                currentId++;
            }
        }
        
        setWaypoints(newWaypoints);
        setWaypointsData(newWaypointsData);
    };

    const handleExportWaypoints = () => {
        setExportDialogState({ isOpen: true, fileName: `waypoints_${Date.now()}` });
    };

    const confirmExportWaypoints = () => {
        const exportData = waypoints.map((wp) => {
            const data = waypointsData[wp.id] || {};
            return {
                latitude: wp.lat,
                longitude: wp.lng,
                altitude: parseFloat(data.altitude) || 50.0,
                camera_tilt: data.camera_tilt !== undefined ? parseFloat(data.camera_tilt) : -45.0,
                camera_yaw: data.camera_yaw !== undefined ? parseFloat(data.camera_yaw) : 0.0,
                action: data.action || 'Take Picture',
                action_duration: parseInt(data.action_duration) || 5
            };
        });
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const finalName = exportDialogState.fileName.trim() || 'waypoints';
        a.download = finalName.endsWith('.json') ? finalName : `${finalName}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setExportDialogState({ isOpen: false, fileName: '' });
    };

    const handleCancelAddMission = () => {
        setIsAddingMission(false);
        handleClearWaypoints();
        setSubmitError('');
        setSubmitSuccess('');
    };

    /**
     * Build the mission API payload from form data.
     */
    const buildMissionPayload = (formData) => {
        const {
            missionName, takeoffAltitude, takeoffHoldDuration, timeMode,
            scheduleDate, scheduleTime,
            recurrentType,
            dailyRepeatTimes, dailyStartDate, dailyEndDate,
            selectedDays, weeklyRepeatTimes, weeklyWeeks,
            selectedMonthDays, monthlyRepeatTimes, monthlyMonths,
            roiLatitude, roiLongitude,
        } = formData;

        const pad = (n) => String(n).padStart(2, '0');
        const offset = new Date().getTimezoneOffset();
        const sign = offset <= 0 ? '+' : '-';
        const tzOffset = `${sign}${String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')}:${String(Math.abs(offset) % 60).padStart(2, '0')}`;

        const waypointPayloads = waypoints.map((wp, index) => {
            const data = waypointsData[wp.id] || {};
            return {
                sequence_order: index + 1,
                latitude: wp.lat,
                longitude: wp.lng,
                altitude: parseFloat(data.altitude) || 50.0,
                camera_tilt: data.camera_tilt !== undefined ? parseFloat(data.camera_tilt) : -45.0,
                camera_yaw: data.camera_yaw !== undefined ? parseFloat(data.camera_yaw) : 0.0,
                action: data.action || 'Take Picture',
                action_duration: parseInt(data.action_duration) || 5
            };
        });

        const missionData = {
            mission_name: missionName || 'Untitled Mission',
            takeoff_altitude: parseFloat(takeoffAltitude) || 50,
            status: 'Waiting',
            schedule_timezone: 'Asia/Jakarta',
            waypoints: waypointPayloads
        };

        // Optional takeoff_hold_duration
        const holdDur = parseFloat(takeoffHoldDuration);
        if (!isNaN(holdDur) && holdDur >= 0) {
            missionData.takeoff_hold_duration = holdDur;
        }

        // Optional ROI
        const roiLat = parseFloat(roiLatitude);
        const roiLng = parseFloat(roiLongitude);
        if (!isNaN(roiLat) && !isNaN(roiLng)) {
            missionData.roi = { latitude: roiLat, longitude: roiLng };
        }

        if (timeMode === 'Now') {
            const now = new Date(Date.now() + 2 * 60 * 1000);
            const runAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00${tzOffset}`;
            missionData.schedule_type = 'one_time';
            missionData.schedule_config = { run_at: runAt };
        } else if (timeMode === 'One time') {
            const runAt = `${scheduleDate}T${scheduleTime || '00:00'}:00${tzOffset}`;
            missionData.schedule_type = 'one_time';
            missionData.schedule_config = { run_at: runAt };
        } else if (timeMode === 'Recurrent') {
            missionData.schedule_type = recurrentType;
            if (recurrentType === 'daily') {
                const today = new Date();
                const startDate = dailyStartDate || `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
                missionData.schedule_config = {
                    start_date: startDate,
                    end_date: dailyEndDate || '',
                    times: dailyRepeatTimes && dailyRepeatTimes.length > 0 ? dailyRepeatTimes : ['09:00']
                };
            } else if (recurrentType === 'weekly') {
                // Convert 0-indexed (Mon=0) to ISO weekday (Mon=1)
                const weekdays = selectedDays.map(d => d + 1);
                missionData.schedule_config = {
                    weeks: weeklyWeeks || 1,
                    weekdays: weekdays,
                    times: weeklyRepeatTimes && weeklyRepeatTimes.length > 0 ? weeklyRepeatTimes : ['09:00']
                };
            } else if (recurrentType === 'monthly') {
                missionData.schedule_config = {
                    months: monthlyMonths || 1,
                    month_days: selectedMonthDays && selectedMonthDays.length > 0 ? selectedMonthDays : [1],
                    times: monthlyRepeatTimes && monthlyRepeatTimes.length > 0 ? monthlyRepeatTimes : ['09:00']
                };
            }
        }

        return missionData;
    };

    /**
     * Step 1: Validate, build payload, preview conflicts, then create or show dialog.
     */
    const handleSubmitMission = async (formData) => {
        const {
            timeMode, scheduleDate, recurrentType,
            dailyStartDate, dailyEndDate, selectedDays, selectedMonthDays,
        } = formData;

        if (!selectedUavId) { setSubmitError('Please select a UAV'); return; }
        if (waypoints.length === 0) { setSubmitError('Please add at least one waypoint'); return; }
        
        const parsedTakeoff = parseFloat(formData.takeoffAltitude);
        if (isNaN(parsedTakeoff) || parsedTakeoff < 50) {
            setSubmitError('Takeoff altitude must be at least 50m');
            return;
        }

        const invalidWp = waypoints.find(wp => {
            const data = waypointsData[wp.id] || {};
            const wpAlt = parseFloat(data.altitude) || 50.0;
            return wpAlt < 50;
        });
        if (invalidWp) {
            setSubmitError(`Waypoint ${invalidWp.id} altitude must be at least 50m`);
            return;
        }

        if (timeMode === 'One time' && !scheduleDate) { setSubmitError('Please select a date for one-time schedule'); return; }
        if (timeMode === 'Recurrent') {
            if (recurrentType === 'daily' && !dailyStartDate) { setSubmitError('Please select a start date for daily schedule'); return; }
            if (recurrentType === 'daily' && !dailyEndDate) { setSubmitError('Please select an end date for daily schedule'); return; }
            if (recurrentType === 'weekly' && (!selectedDays || selectedDays.length === 0)) { setSubmitError('Please select at least one weekday'); return; }
            if (recurrentType === 'monthly' && (!selectedMonthDays || selectedMonthDays.length === 0)) { setSubmitError('Please select at least one day of month'); return; }
        }

        setIsSubmitting(true);
        setSubmitError('');
        setSubmitSuccess('');

        try {
            const missionData = buildMissionPayload(formData);
            pendingMissionData.current = missionData;

            console.log('[Mission] Previewing conflicts:', JSON.stringify(missionData, null, 2));

            // Step 1: Preview conflicts
            const previewPayload = {
                mission_name: missionData.mission_name,
                schedule_type: missionData.schedule_type,
                schedule_timezone: missionData.schedule_timezone,
                schedule_config: missionData.schedule_config,
                priority: 100,
                window_days: 30
            };

            const preview = await missionService.previewConflicts(previewPayload);
            console.log('[Mission] Conflict preview result:', preview);

            if (preview.has_conflict) {
                // Show conflict dialog — user decides
                setConflictData(preview);
                setShowConflictDialog(true);
                setIsSubmitting(false);
                return;
            }

            // No conflict — create directly
            await createMission(missionData);

        } catch (err) {
            console.error('[Mission] Preview/Submit failed:', err);
            setSubmitError(err.message || 'Failed to create mission');
            setIsSubmitting(false);
        }
    };

    /**
     * Create the mission, handling conflict and history guard responses.
     */
    const createMission = async (missionData, extraFields = {}) => {
        setIsSubmitting(true);
        setSubmitError('');

        try {
            const payload = { ...missionData, ...extraFields };
            console.log('[Mission] Registering mission:', JSON.stringify(payload, null, 2));

            const result = await missionService.registerMission(payload);
            console.log('[Mission] Registration result:', result);

            // Handle structured error responses from registerMission
            if (result.error) {
                if (result.code === 'mission_schedule_conflict') {
                    // Backend returned conflict on create — show dialog
                    setConflictData(result);
                    setShowConflictDialog(true);
                    setIsSubmitting(false);
                    return;
                }
                if (result.code === 'mission_recent_history_guard') {
                    // History guard — show confirm dialog
                    setHistoryGuardData(result);
                    setShowHistoryGuard(true);
                    setIsSubmitting(false);
                    return;
                }
                throw new Error(result.error || 'Failed to register mission');
            }

            setSubmitSuccess('Mission registered successfully!');
            setShowConflictDialog(false);
            setConflictData(null);
            setTimeout(() => { handleCancelAddMission(); }, 1500);

        } catch (err) {
            console.error('[Mission] Registration failed:', err);
            setSubmitError(err.message || 'Failed to register mission');
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * User confirmed conflict resolution — create with conflict_resolutions.
     */
    const handleConflictConfirm = async (resolutions) => {
        if (!pendingMissionData.current) return;
        setShowConflictDialog(false);
        await createMission(pendingMissionData.current, { conflict_resolutions: resolutions });
    };

    const handleConflictCancel = () => {
        setShowConflictDialog(false);
        setConflictData(null);
    };

    /**
     * User confirmed history guard — retry with confirm flag.
     */
    const handleHistoryGuardConfirm = async () => {
        if (!pendingMissionData.current) return;
        setShowHistoryGuard(false);
        setHistoryGuardData(null);
        await createMission(pendingMissionData.current, { confirm_recent_history_guard: true });
    };

    return (
        <div
            className="p-[28px] flex flex-row gap-[28px] w-full h-[calc(100vh-104px)] overflow-hidden"
            style={{ backgroundImage: `url('/images/img_background.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            {/* Left Column - Map Area & Mission Detail */}
            <div className="flex-1 flex flex-col gap-[28px] min-w-0">
                <div className="flex-1 rounded-[24px] border border-[#2a3240] overflow-hidden shadow-lg relative bg-[#181d25]">
                    <MissionMapPanel
                        waypoints={waypoints}
                        onAddWaypoint={handleAddWaypoint}
                        isViewMode={!isAddingMission}
                        telemetry={selectedTelemetry}
                        trajectory={selectedTrajectory}
                        homePosition={selectedHome}
                        selectedDrone={selectedDroneObj}
                        selectedMission={selectedMission}
                    />
                </div>
            </div>

            {/* Right Column - Controls & Lists */}
            <div className="w-[440px] shrink-0 flex flex-col gap-[28px]">
                {isAddingMission ? (
                    <>
                        {/* Waypoint Selection Form */}
                        <div className="flex-1 bg-[#27313D] rounded-[24px] border border-[#2a3240] overflow-hidden shadow-lg min-h-0">
                            <WaypointSelectionPanel
                                waypoints={waypoints}
                                waypointsData={waypointsData}
                                onWaypointDataChange={handleWaypointDataChange}
                                onRemoveWaypoint={handleRemoveWaypoint}
                                onCancel={handleCancelAddMission}
                                onImportWaypoints={handleImportWaypoints}
                            />
                        </div>
                        {/* Mission Detail Panel */}
                        <div className="h-[480px] shrink-0 rounded-[24px] border border-[#2a3240] overflow-hidden shadow-lg">
                            <MissionDetailPanel
                                waypointsCount={waypoints.length}
                                onClearWaypoints={handleClearWaypoints}
                                drones={drones}
                                selectedUavId={selectedUavId}
                                onSelectUav={setSelectedUavId}
                                onSubmit={handleSubmitMission}
                                isSubmitting={isSubmitting}
                                submitError={submitError}
                                submitSuccess={submitSuccess}
                                onExportWaypoints={handleExportWaypoints}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        {/* Drone Cam View */}
                        <div className="h-[280px] shrink-0 rounded-[24px] overflow-hidden">
                            <DroneCamPanel />
                        </div>
                        {/* Mission List */}
                        <div className="flex-1 bg-[#27313D] rounded-[24px] border border-[#2a3240] overflow-hidden shadow-lg min-h-0">
                            <MissionListPanel onAddMission={() => setIsAddingMission(true)} onSelectMission={handleSelectMission} refreshKey={missionStatusVersion} />
                        </div>
                    </>
                )}
            </div>
            {/* Conflict Dialog */}
            {showConflictDialog && (
                <ConflictDialog
                    conflictData={conflictData}
                    scheduleType={pendingMissionData.current?.schedule_type}
                    newMissionName={pendingMissionData.current?.mission_name}
                    onConfirm={handleConflictConfirm}
                    onCancel={handleConflictCancel}
                    isSubmitting={isSubmitting}
                />
            )}

            {/* History Guard Dialog */}
            {showHistoryGuard && historyGuardData && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1c222c] border border-[#2a3240] rounded-2xl shadow-2xl w-[440px] p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                            </div>
                            <h3 className="text-white text-[15px] font-bold">Recent Mission Activity</h3>
                        </div>
                        <p className="text-gray-400 text-[12px] mb-2">
                            A recent mission <span className="text-white font-semibold">"{historyGuardData.recent_history?.mission_name}"</span> finished recently.
                        </p>
                        <p className="text-gray-500 text-[11px] mb-4">
                            Earliest available at: <span className="text-amber-400 font-mono">{new Date(historyGuardData.recent_history?.available_at).toLocaleString()}</span>
                        </p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setShowHistoryGuard(false); setHistoryGuardData(null); }} className="px-4 py-2 rounded-lg border border-[#3b4452] text-gray-300 text-[12px] font-semibold hover:bg-[#2d3745]">
                                Cancel
                            </button>
                            <button onClick={handleHistoryGuardConfirm} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-gradient-to-b from-[#ea580c] to-[#9c3804] text-white text-[12px] font-bold hover:brightness-110 disabled:opacity-50">
                                {isSubmitting ? 'Creating...' : 'Create Anyway'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Guard Dialog */}
            <CustomDialog
                isOpen={importDialogState.isOpen}
                onClose={() => setImportDialogState({ isOpen: false, message: '' })}
                title="Import Blocked"
                footer={
                    <button
                        onClick={() => setImportDialogState({ isOpen: false, message: '' })}
                        className="px-4 py-2 text-sm font-semibold bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/50 hover:bg-[#3b82f6]/20 rounded transition-colors"
                    >
                        OK
                    </button>
                }
            >
                <div className="flex items-start gap-3">
                    <div className="mt-1 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div>
                        <p className="text-gray-200">{importDialogState.message}</p>
                        <p className="text-xs text-gray-500 mt-2">Please edit your JSON file to keep all waypoints within the drone's operational radius.</p>
                    </div>
                </div>
            </CustomDialog>
            {/* Export Guard Dialog */}
            <CustomDialog
                isOpen={exportDialogState.isOpen}
                onClose={() => setExportDialogState({ isOpen: false, fileName: '' })}
                title="Export Waypoints"
                footer={
                    <div className="flex gap-2 justify-end w-full">
                        <button
                            onClick={() => setExportDialogState({ isOpen: false, fileName: '' })}
                            className="px-4 py-2 text-sm font-semibold bg-transparent text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmExportWaypoints}
                            className="px-4 py-2 text-sm font-semibold bg-[#ea580c] hover:bg-[#ff782e] text-white rounded transition-colors"
                        >
                            Save
                        </button>
                    </div>
                }
            >
                <div className="flex flex-col gap-3">
                    <p className="text-gray-300 text-sm">Please enter a name for the JSON file:</p>
                    <div className="h-[40px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3 focus-within:border-[#ea580c] transition-colors w-full">
                        <input
                            type="text"
                            value={exportDialogState.fileName}
                            onChange={(e) => setExportDialogState({ ...exportDialogState, fileName: e.target.value })}
                            className="bg-transparent text-gray-100 text-[13px] outline-none w-full"
                            placeholder="waypoints_name"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') confirmExportWaypoints();
                            }}
                        />
                    </div>
                </div>
            </CustomDialog>
        </div>
    );
}
