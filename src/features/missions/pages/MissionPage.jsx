import React, { useState, useEffect } from 'react';
import MissionMapPanel from '../panels/MissionMapPanel';
import WaypointSelectionPanel from '../panels/WaypointSelectionPanel';
import MissionListPanel from '../panels/MissionListPanel';
import DroneCamPanel from '../panels/DroneCamPanel';
import MissionDetailPanel from '../panels/MissionDetailPanel';
import { uavService, missionService } from '../../../services/api';
import useTelemetry from '../../../shared/hooks/useTelemetry';

export default function MissionPage() {
    const [isAddingMission, setIsAddingMission] = useState(false);
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
    const [submitSuccess, setSubmitSuccess] = useState('');

    // Fetch drones on mount
    useEffect(() => {
        const fetchDrones = async () => {
            try {
                const data = await uavService.getMyUavsDropdown();
                if (data && data.length > 0) {
                    setDrones(data);
                    setSelectedUavId(data[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch drones:', err);
            }
        };
        fetchDrones();
    }, []);

    // Telemetry — subscribe to all drone IDs
    const uavIds = drones.map(d => d.id);
    const { telemetry, positionHistory, homePositions } = useTelemetry(uavIds);

    // Get telemetry for the selected drone
    const selectedDroneObj = drones.find(d => d.id === selectedUavId) || null;
    const selectedTelemetry = selectedUavId ? telemetry[selectedUavId] : null;
    const selectedTrajectory = selectedUavId ? positionHistory[selectedUavId] : null;
    const selectedHome = selectedUavId ? homePositions[selectedUavId] : null;

    const handleAddWaypoint = (latlng) => {
        if (!isAddingMission) return;
        setWaypoints((prev) => [...prev, { id: prev.length + 1, lat: latlng.lat, lng: latlng.lng }]);
    };

    const handleWaypointDataChange = (id, field, value) => {
        setWaypointsData(prev => ({
            ...prev,
            [id]: { ...(prev[id] || { altitude: 150, action: 'hold', action_duration: 5 }), [field]: value }
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

    const handleSubmitMission = async ({ missionName, timeMode, schedule, isRecurring, recurrenceUnit, recurrenceInterval }) => {
        if (!selectedUavId) {
            setSubmitError('Please select a UAV');
            return;
        }
        if (waypoints.length === 0) {
            setSubmitError('Please add at least one waypoint');
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');
        setSubmitSuccess('');

        try {
            // Build waypoints array for the API
            const waypointPayloads = waypoints.map((wp, index) => {
                const data = waypointsData[wp.id] || {};
                return {
                    sequence_order: index + 1,
                    latitude: wp.lat,
                    longitude: wp.lng,
                    altitude: parseFloat(data.altitude) || 10.0,
                    action: data.action || 'hold',
                    action_duration: parseInt(data.action_duration) || 5
                };
            });

            // Build schedule based on time mode
            let missionSchedule;
            if (timeMode === 'Now') {
                missionSchedule = new Date().toISOString();
            } else {
                missionSchedule = schedule || new Date().toISOString();
            }

            const missionData = {
                uav_id: selectedUavId,
                mission_name: missionName || 'Untitled Mission',
                schedule: missionSchedule,
                is_recurring: isRecurring || false,
                recurrence_unit: isRecurring ? recurrenceUnit : null,
                recurrence_interval: isRecurring ? recurrenceInterval : null,
                status: 'Waiting',
                waypoints: waypointPayloads
            };

            console.log('[Mission] Registering mission:', missionData);
            const result = await missionService.registerMission(missionData);
            console.log('[Mission] Registration result:', result);

            setSubmitSuccess('Mission registered successfully!');
            // Reset after a short delay
            setTimeout(() => {
                handleCancelAddMission();
            }, 1500);

        } catch (err) {
            console.error('[Mission] Registration failed:', err);
            setSubmitError(err.message || 'Failed to register mission');
        } finally {
            setIsSubmitting(false);
        }
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
                            <MissionListPanel onAddMission={() => setIsAddingMission(true)} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
