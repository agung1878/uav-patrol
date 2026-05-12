import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService } from '../../../services/api';

export default function MissionListPanel({ onAddMission, onSelectMission }) {
    const navigate = useNavigate();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalMissions, setTotalMissions] = useState(0);

    useEffect(() => {
        const fetchMissions = async () => {
            try {
                setLoading(true);
                const data = await missionService.getMissions(1, 50);

                // Format missions for the table
                const formattedMissions = (data.items || []).map(m => {
                    const scheduleDate = new Date(m.schedule);
                    const formattedDate = scheduleDate.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    });
                    const formattedTime = scheduleDate.toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    });

                    return {
                        id: m.id,
                        date: `${formattedDate}\n${formattedTime}`,
                        name: m.mission_name,
                        wps: m.waypoint_count,
                        status: m.status,
                        active: m.status === 'In Progress'
                    };
                });

                setMissions(formattedMissions);
                setTotalMissions(data.total || 0);
            } catch (err) {
                console.error('Failed to fetch missions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMissions();
    }, []);

    const handleRowClick = (mission) => {
        if (mission.status === 'In Progress') {
            navigate('/missions/active');
        }
        // Notify parent to fetch & display mission detail on map
        if (onSelectMission) {
            onSelectMission(mission.id);
        }
    };

    return (
        <div className="w-full h-full p-5 flex flex-col select-none">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                    <h2 className="text-white text-[18px] font-bold tracking-wide">Mission List</h2>
                    <span className="text-gray-400 text-[11px] font-semibold mt-1">{totalMissions} Mission</span>
                </div>
                <button
                    onClick={onAddMission}
                    className="bg-gradient-to-b from-[#ea580c] to-[#9c3804] border border-[#ea580c] rounded px-4 py-1.5 text-white text-xs font-bold shadow-lg hover:brightness-110 transition flex items-center space-x-1"
                >
                    <span className="text-lg leading-none mb-[2px]">+</span>
                    <span>Add Mission</span>
                </button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[1.2fr_2fr_1fr_1.2fr] text-[10px] font-semibold text-gray-400 border-b border-[#2a3240] pb-2 mb-2 uppercase tracking-wider">
                <div className="text-left">Date</div>
                <div className="text-left">Mission</div>
                <div className="text-center">Waypoints</div>
                <div className="text-right pr-2">Status</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                {loading ? (
                    <div className="flex justify-center items-center h-20 text-gray-400 text-xs">
                        Loading missions...
                    </div>
                ) : missions.length === 0 ? (
                    <div className="flex justify-center items-center h-20 text-gray-500 text-xs italic">
                        No missions found
                    </div>
                ) : (
                    missions.map((mission) => (
                        <div
                            key={mission.id}
                            className={`grid grid-cols-[1.2fr_2fr_1fr_1.2fr] items-center text-xs py-2 px-1 rounded transition-colors cursor-pointer ${mission.active ? 'bg-[#202834]' : 'hover:bg-[#202834]/50'}`}
                            onClick={() => handleRowClick(mission)}
                        >
                            <div className="text-gray-300 leading-tight whitespace-pre-line text-[10px] text-left">
                                {mission.date}
                            </div>
                            <div className={`text-[11px] font-medium text-left ${mission.active ? 'text-[#3b82f6]' : 'text-gray-200'}`}>
                                {mission.name}
                            </div>
                            <div className="text-gray-300 text-[11px] text-center">
                                {mission.wps}
                            </div>
                            <div className="text-gray-300 text-[11px] text-right pr-2">
                                {mission.status}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
