import React, { useState, useEffect } from 'react';
import MainVideoFeedPanel from '../panels/MainVideoFeedPanel';
import MapViewPanel from '../panels/MapViewPanel';
import MissionListPanel from '../panels/MissionListPanel';
import DroneInfoPanel from '../panels/DroneInfoPanel';
import StreamButtonPanel from '../panels/StreamButtonPanel';
import QuickLaunchDialog from '../components/QuickLaunchDialog';
import QuickLaunchDialogForm from '../components/QuickLaunchDialogForm';
import { uavService, missionService } from '../../../services/api';
import useTelemetry from '../../../shared/hooks/useTelemetry';

export default function DashboardPage() {
    const [isLaunchDialogOpen, setIsLaunchDialogOpen] = useState(false);
    const [isLaunchFormOpen, setIsLaunchFormOpen] = useState(false);
    const [selectedLaunchType, setSelectedLaunchType] = useState('ROI');

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
    useEffect(() => {
        if (!selectedDrone) return;
        const fetchActiveMission = async () => {
            try {
                const data = await missionService.getMissions(1, 50, selectedDrone.id);
                const activeMission = data?.items?.find(m => m.status === 'In Progress');
                if (activeMission) {
                    const detail = await missionService.getMissionDetail(activeMission.id);
                    setMissionWaypoints(detail?.waypoints || null);
                } else {
                    setMissionWaypoints(null);
                }
            } catch (err) {
                console.error('[Dashboard] Failed to fetch mission waypoints:', err);
                setMissionWaypoints(null);
            }
        };
        fetchActiveMission();
        // Re-check every 30 seconds
        const interval = setInterval(fetchActiveMission, 30000);
        return () => clearInterval(interval);
    }, [selectedDrone?.id]);

    return (
        <div
            className="p-[28px] flex flex-row gap-[28px] w-full h-[calc(100vh-104px)] overflow-hidden"
            style={{ backgroundImage: `url('/src/assets/img_background.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            {/* Column 1 */}
            <div className="flex-1 flex flex-col gap-[28px] min-w-0">
                {/* Video Frame */}
                <div className="flex-1 rounded-[24px] border border-[#2a3240] overflow-hidden shadow-lg min-h-0">
                    <MainVideoFeedPanel />
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
                    <StreamButtonPanel onLaunchClick={() => setIsLaunchDialogOpen(true)} />
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
                onClose={() => setIsLaunchFormOpen(false)}
                onLaunch={(type) => {
                    console.log('Final Launch confirmed with type:', type);
                    setIsLaunchFormOpen(false);
                }}
            />
        </div>
    );
}

