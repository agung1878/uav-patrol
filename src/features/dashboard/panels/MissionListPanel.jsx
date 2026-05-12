import React, { useState, useEffect } from 'react';
import { missionService } from '../../../services/api';

const StatBox = ({ count, label }) => (
    <div className="flex flex-col items-center justify-center bg-[#1c222c] rounded-[12px] border border-[#2a3240] w-[186px] h-[62px] shadow-lg">
        <span className="text-white text-[18px] font-bold tracking-wider leading-none">{count}</span>
        <span className="text-gray-400 text-[11px] mt-1">{label}</span>
    </div>
);

export default function MissionListPanel() {
    const [missions, setMissions] = useState([]);
    const [stats, setStats] = useState({ total: 0, waiting: 0, completed: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchMissions = async () => {
            try {
                const data = await missionService.getMissions(1, 50);
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
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const formattedDate = date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
            const formattedTime = date.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
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

                {/* Table Header */}
                <div className="grid grid-cols-[1.2fr_3fr_1fr_1.2fr] text-[11px] font-semibold text-gray-400 border-b border-[#2a3240] pb-2 mb-2 uppercase tracking-wider">
                    <div className="text-left">Date</div>
                    <div className="text-left">Mission</div>
                    <div className="text-center">Waypoints</div>
                    <div className="text-right pr-2">Status</div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-[2px] custom-scrollbar">
                    {isLoading ? (
                        <div className="text-gray-400 text-xs py-2 px-1">Loading missions...</div>
                    ) : errorMsg ? (
                        <div className="text-red-400 text-xs py-2 px-1 flex flex-col items-center justify-center h-full text-center">
                            <span>Oops, error loading missions:</span>
                            <span className="opacity-80 mt-1">{errorMsg}</span>
                        </div>
                    ) : missions.length === 0 ? (
                        <div className="text-gray-400 text-xs py-2 px-1 flex items-center justify-center h-full italic">No missions found.</div>
                    ) : (
                        missions.map((mission) => {
                            const active = mission.status === 'In Progress';
                            return (
                                <div
                                    key={mission.id}
                                    className={`grid grid-cols-[1.2fr_3fr_1fr_1.2fr] items-center text-xs py-2 px-1 rounded transition-colors ${active ? 'bg-[#202834]' : 'hover:bg-[#202834]/50'}`}
                                >
                                    <div className="text-gray-300 leading-tight whitespace-pre-line text-[10px] text-left">
                                        {formatDate(mission.schedule)}
                                    </div>
                                    <div className={`font-medium text-left ${active ? 'text-[#3b82f6] border-b border-[#3b82f6] w-max' : 'text-gray-200'} truncate mr-2`}>
                                        {mission.mission_name}
                                    </div>
                                    <div className="text-gray-300 text-center">
                                        {mission.waypoint_count}
                                    </div>
                                    <div className="text-gray-300 text-right pr-2">
                                        {mission.status}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            </div>

        </div>
    );
}
