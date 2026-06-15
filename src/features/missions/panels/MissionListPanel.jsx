import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService } from '../../../services/api';

export default function MissionListPanel({ onAddMission, onSelectMission, refreshKey = 0 }) {
    const navigate = useNavigate();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalMissions, setTotalMissions] = useState(0);

    useEffect(() => {
        const fetchMissions = async () => {
            try {
                setLoading(true);
                const data = await missionService.getMissionRuns(1, 50, 'today');

                // Format missions for the table
                const formattedMissions = (data.items || []).map(m => {

                    const formatDt = (dateString) => {
                        if (!dateString) return '';
                        try {
                            const d = new Date(dateString);
                            return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}\n${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`;
                        } catch (e) {
                            return dateString;
                        }
                    };

                    return {
                        id: m.mission_id,
                        runAt: m.run_at,
                        createdDate: formatDt(m.mission_created_at),
                        runDate: formatDt(m.run_at),
                        name: m.mission_name,
                        status: m.status,
                        scheduleType: (m.schedule_type || '').replace('_', ' '),
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
    }, [refreshKey]);

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

            {/* Horizontal Scroll Wrapper */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
                <div className="min-w-[600px] h-full flex flex-col">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1.5fr_2fr_1fr_1.5fr_1.5fr] gap-2 text-[10px] font-bold text-gray-500 border-b border-[#2a3240] pb-3 mb-2 uppercase tracking-widest px-2">
                        <div className="text-left">Created Date</div>
                        <div className="text-left">Mission Name</div>
                        <div className="text-center">Status</div>
                        <div className="text-left">Run At</div>
                        <div className="text-right pr-2">Type</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar pb-2">
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
                                    key={mission.id + '_' + mission.runAt}
                                    className={`grid grid-cols-[1.5fr_2fr_1fr_1.5fr_1.5fr] gap-2 items-center text-xs py-2.5 px-2 rounded-lg transition-all cursor-pointer ${mission.active ? 'bg-[#3b82f6]/10 border border-[#3b82f6]/30' : 'hover:bg-[#202834]'}`}
                                    onClick={() => handleRowClick(mission)}
                                >
                                    <div className="text-gray-400 leading-relaxed whitespace-pre-line text-[10px] text-left">
                                        {mission.createdDate}
                                    </div>
                                    <div className={`font-semibold text-left ${mission.active ? 'text-[#3b82f6]' : 'text-gray-100'} truncate`}>
                                        {mission.name}
                                    </div>
                                    <div className={`text-[11px] text-center font-medium ${mission.status === 'Skipped' || mission.status === 'Failed' ? 'text-red-400' : 'text-gray-300'}`}>
                                        {mission.status}
                                    </div>
                                    <div className="text-gray-400 leading-relaxed whitespace-pre-line text-[10px] text-left">
                                        {mission.runDate}
                                    </div>
                                    <div className="text-gray-500 text-[10px] uppercase font-bold text-right pr-2 tracking-wider">
                                        {mission.scheduleType}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
