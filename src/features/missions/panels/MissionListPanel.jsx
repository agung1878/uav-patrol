import React from 'react';
import { useNavigate } from 'react-router-dom';

const missions = [
    { id: 1, date: '12/12/2025\n16:34:00', name: 'Patrol on 3 Site', action: 'Video Record', status: 'Waiting' },
    { id: 2, date: '12/12/2025\n16:34:00', name: 'Inspection on 5 Site', action: 'Audio Record', status: 'Completed' },
    { id: 3, date: '12/12/2025\n16:34:00', name: 'Follow-up on 2 Site', action: 'Video Record', status: 'In Progress', active: true },
    { id: 4, date: '12/12/2025\n16:34:00', name: 'Maintenance on 1 Site', action: 'No Record', status: 'Scheduled' },
    { id: 5, date: '12/12/2025\n16:34:00', name: 'Emergency Response', action: 'Video Record', status: 'Resolved' },
    { id: 6, date: '12/12/2025\n16:34:00', name: 'Debriefing on 6 Site', action: 'Audio Record', status: 'Pending' }
];

export default function MissionListPanel({ onAddMission }) {
    const navigate = useNavigate();

    const handleRowClick = (mission) => {
        if (mission.status === 'In Progress') {
            navigate('/missions/active');
        }
    };

    return (
        <div className="w-full h-full p-5 flex flex-col select-none">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                    <h2 className="text-white text-[18px] font-bold tracking-wide">Mission List</h2>
                    <span className="text-gray-400 text-[11px] font-semibold mt-1">34 Mission</span>
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
            <div className="grid grid-cols-[1fr_2fr_1.5fr_1fr] text-[10px] font-semibold text-gray-400 border-b border-[#2a3240] pb-2 mb-2 uppercase tracking-wider">
                <div>Date</div>
                <div>Mission</div>
                <div>Action</div>
                <div>Status</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                {missions.map((mission) => (
                    <div
                        key={mission.id}
                        className={`grid grid-cols-[1fr_2fr_1.5fr_1fr] items-center text-xs py-2 px-1 rounded transition-colors ${
                            mission.active ? 'bg-[#202834]' : 'hover:bg-[#202834]/50'
                        } ${mission.status === 'In Progress' ? 'cursor-pointer' : ''}`}
                        onClick={() => handleRowClick(mission)}
                    >
                        <div className="text-gray-300 leading-tight whitespace-pre-line text-[10px]">
                            {mission.date}
                        </div>
                        <div className={`text-[11px] font-medium ${mission.active ? 'text-[#3b82f6]' : 'text-gray-200'}`}>
                            {mission.name}
                        </div>
                        <div className="text-gray-300 text-[11px]">
                            {mission.action}
                        </div>
                        <div className="text-gray-300 text-[11px]">
                            {mission.status}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
