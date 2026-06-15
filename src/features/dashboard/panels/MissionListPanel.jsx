import React, { useState, useEffect } from 'react';
import { missionService } from '../../../services/api';

const StatBox = ({ count, label }) => (
    <div className="flex flex-col items-center justify-center bg-[#1c222c] rounded-[12px] border border-[#2a3240] w-[186px] h-[62px] shadow-lg">
        <span className="text-white text-[18px] font-bold tracking-wider leading-none">{count}</span>
        <span className="text-gray-400 text-[11px] mt-1">{label}</span>
    </div>
);

export default function MissionListPanel({ refreshKey = 0 }) {
    const [missions, setMissions] = useState([]);
    const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchMissions = async () => {
            try {
                const data = await missionService.getMissionRuns(1, 50, 'today');
                if (data && data.items) {
                    setMissions(data.items);

                    const waiting = data.items.filter(m => m.status === 'Waiting').length;
                    const completed = data.items.filter(m => m.status === 'Completed').length;

                    setStats({
                        total: data.total || data.items.length,
                        waiting: waiting,
                        completed: completed
                    });
                }
            } catch (error) {
                console.error("Error fetching missions:", error);
                setErrorMsg(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMissions();
    }, [refreshKey]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const formattedDate = date.toLocaleDateString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
            const formattedTime = date.toLocaleTimeString('en-GB', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            });
            return `${formattedDate}\n${formattedTime}`;
        } catch (e) {
            return dateString;
        }
    };

    return (
        <div className="w-full h-full flex flex-row gap-[16px] select-none">

            {/* Left Column - Stats */}
            <div className="w-[186px] shrink-0 flex flex-col justify-between h-full">
                <StatBox count={stats.total} label="Total Mission" />
                <StatBox count={stats.waiting} label="Waiting" />
                <StatBox count={stats.completed} label="Completed" />
            </div>

            {/* Right Column - Mission Table */}
            <div className="flex-1 overflow-hidden bg-[#1c222c] rounded-2xl border border-[#2a3240] shadow-lg flex flex-col p-4">
                
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
                        <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar pb-2">
                            {isLoading ? (
                                <div className="text-gray-400 text-xs py-4 px-2 flex justify-center">Loading missions...</div>
                            ) : errorMsg ? (
                                <div className="text-red-400 text-xs py-4 px-2 flex flex-col items-center justify-center h-full text-center">
                                    <span>Oops, error loading missions:</span>
                                    <span className="opacity-80 mt-1">{errorMsg}</span>
                                </div>
                            ) : missions.length === 0 ? (
                                <div className="text-gray-400 text-xs py-4 px-2 flex items-center justify-center h-full italic">No missions found.</div>
                            ) : (
                                missions.map((mission) => {
                                    const active = mission.status === 'In Progress';
                                    return (
                                        <div
                                            key={mission.mission_id + '_' + mission.run_at}
                                            className={`grid grid-cols-[1.5fr_2fr_1fr_1.5fr_1.5fr] gap-2 items-center text-xs py-2.5 px-2 rounded-lg transition-all ${active ? 'bg-[#3b82f6]/10 border border-[#3b82f6]/30' : 'hover:bg-[#202834]'}`}
                                        >
                                            <div className="text-gray-400 leading-relaxed whitespace-pre-line text-[10px] text-left">
                                                {formatDate(mission.mission_created_at)}
                                            </div>
                                            <div className={`font-semibold text-left ${active ? 'text-[#3b82f6]' : 'text-gray-100'} truncate`}>
                                                {mission.mission_name}
                                            </div>
                                            <div className={`text-[11px] text-center font-medium ${mission.status === 'Skipped' || mission.status === 'Failed' ? 'text-red-400' : 'text-gray-300'}`}>
                                                {mission.status}
                                            </div>
                                            <div className="text-gray-400 leading-relaxed whitespace-pre-line text-[10px] text-left">
                                                {formatDate(mission.run_at)}
                                            </div>
                                            <div className="text-gray-500 text-[10px] uppercase font-bold text-right pr-2 tracking-wider">
                                                {mission.schedule_type.replace('_', ' ')}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
}
