import React, { useState, useEffect, useRef } from 'react';
import MissionMapPanel from '../panels/MissionMapPanel';
import WaypointSelectionPanel from '../panels/WaypointSelectionPanel';
import MissionListPanel from '../panels/MissionListPanel';
import DroneCamPanel from '../panels/DroneCamPanel';
import MissionDetailPanel from '../panels/MissionDetailPanel';
import ConflictDialog from '../components/ConflictDialog';
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
            [id]: { ...(prev[id] || { altitude: 15, action: 'hold', action_duration: 5 }), [field]: value }
        }));
    };

    const handleClearWaypoints = () => {
        setWaypoints([]);
        setWaypointsData({});
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
                altitude: parseFloat(data.altitude) || 10.0,
                action: data.action || 'Take Picture',
                action_duration: parseInt(data.action_duration) || 5
            };
        });

        const missionData = {
            mission_name: missionName || 'Untitled Mission',
            takeoff_altitude: parseFloat(takeoffAltitude) || 20,
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
            style={{ backgroundImage: `url('/src/assets/img_background.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
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
                                onCancel={handleCancelAddMission}
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
        </div>
    );
}
