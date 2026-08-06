import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { missionService } from '../../../services/api';
import CustomDialog from '../../../shared/components/CustomDialog';

export default function MissionListPanel({ onAddMission, onSelectMission, refreshKey = 0 }) {
    const navigate = useNavigate();
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalMissions, setTotalMissions] = useState(0);
    const [activeTab, setActiveTab] = useState('today');
    const [localRefresh, setLocalRefresh] = useState(0);
    const [dialogState, setDialogState] = useState({ isOpen: false, type: '', mission: null, message: '', runAt: '' });

    useEffect(() => {
        const fetchMissions = async () => {
            try {
                setLoading(true);
                const data = await missionService.getMissionRuns(1, 50, activeTab);

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
    }, [refreshKey, activeTab, localRefresh]);

    const handleRowClick = (mission) => {
        if (mission.status === 'In Progress') {
            navigate('/missions/active');
        }
        // Notify parent to fetch & display mission detail on map
        if (onSelectMission) {
            onSelectMission(mission.id);
        }
    };

    const handleDeleteClick = (e, mission) => {
        e.stopPropagation();
        setDialogState({
            isOpen: true,
            type: 'confirm_delete',
            mission: mission,
            message: `Are you sure you want to delete occurrence for mission "${mission.name}" at ${mission.runDate}?`
        });
    };

    const confirmDelete = async () => {
        const { mission } = dialogState;
        try {
            const res = await missionService.deleteMissionOccurrence(mission.id, mission.runAt);
            setDialogState({
                isOpen: true,
                type: 'delete_success',
                mission: null,
                message: res.message,
                runAt: res.run_at
            });
            setLocalRefresh(prev => prev + 1);
        } catch (err) {
            setDialogState({
                isOpen: true,
                type: 'delete_error',
                mission: null,
                message: err.message
            });
        }
    };

    return (
        <div className="w-full h-full p-5 flex flex-col select-none">
            {/* Header */}
            <div className="flex justify-between items-end mb-4">
                <div className="flex flex-col space-y-1 border-b border-[#2a3240] w-full mr-4 pb-[1px] relative">
                    <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-white text-[18px] font-bold tracking-wide">Mission List</h2>
                        <span className="text-gray-400 text-[11px] font-semibold mt-1 bg-[#252b36] px-2 py-0.5 rounded-full">{totalMissions} Missions</span>
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('today')}
                            className={`text-[8px] font-bold tracking-widest uppercase transition-colors px-1 py-1 border-b-2 ${activeTab === 'today' ? 'text-[#ea580c] border-[#ea580c]' : 'text-gray-500 hover:text-gray-300 border-transparent'}`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setActiveTab('later')}
                            className={`text-[8px] font-bold tracking-widest uppercase transition-colors px-1 py-1 border-b-2 ${activeTab === 'later' ? 'text-[#ea580c] border-[#ea580c]' : 'text-gray-500 hover:text-gray-300 border-transparent'}`}
                        >
                            Upcoming
                        </button>
                    </div>
                </div>
                <button
                    onClick={onAddMission}
                    className="shrink-0 bg-gradient-to-b from-[#ea580c] to-[#9c3804] border border-[#ea580c] rounded-lg px-5 py-2.5 text-white text-[13px] font-bold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center space-x-2"
                >
                    <span className="text-lg leading-none">+</span>
                    <span>Add Mission</span>
                </button>
            </div>

            {/* Horizontal Scroll Wrapper */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-[#1c222c] border border-[#2a3240] rounded-xl p-3">
                <div className="min-w-[650px] h-full flex flex-col">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1.5fr_2fr_1fr_1.5fr_1fr_30px] gap-2 text-[10px] font-bold text-gray-500 border-b border-[#2a3240] pb-2 mb-2 uppercase tracking-widest px-2">
                        <div className="text-left">Created Date</div>
                        <div className="text-left">Mission Name</div>
                        <div className="text-center">Status</div>
                        <div className="text-left">Run At</div>
                        <div className="text-right">Type</div>
                        <div></div>
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
                                    className={`grid grid-cols-[1.5fr_2fr_1fr_1.5fr_1fr_30px] gap-2 items-center text-xs py-2.5 px-2 rounded-lg transition-all cursor-pointer ${mission.active ? 'bg-[#3b82f6]/10 border border-[#3b82f6]/30' : 'hover:bg-[#202834]'}`}
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
                                    <div className="text-gray-500 text-[10px] uppercase font-bold text-right tracking-wider">
                                        {mission.scheduleType}
                                    </div>
                                    <div className="flex justify-center items-center">
                                        {mission.status === 'Waiting' && (
                                            <button
                                                onClick={(e) => handleDeleteClick(e, mission)}
                                                className="text-gray-500 hover:text-red-500 transition-colors p-1 rounded hover:bg-[#2a3240]"
                                                title="Delete Occurrence"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"></polyline>
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Dialogs */}
            <CustomDialog
                isOpen={dialogState.isOpen}
                onClose={() => setDialogState({ isOpen: false, type: '', mission: null, message: '', runAt: '' })}
                title={
                    dialogState.type === 'confirm_delete' ? 'Confirm Delete' :
                    dialogState.type === 'delete_success' ? 'Success' :
                    'Error'
                }
                footer={
                    dialogState.type === 'confirm_delete' ? (
                        <>
                            <button
                                onClick={() => setDialogState({ ...dialogState, isOpen: false })}
                                className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-semibold bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 rounded transition-colors"
                            >
                                Delete
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setDialogState({ isOpen: false, type: '', mission: null, message: '', runAt: '' })}
                            className="px-4 py-2 text-sm font-semibold bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/50 hover:bg-[#3b82f6]/20 rounded transition-colors"
                        >
                            OK
                        </button>
                    )
                }
            >
                <div className="flex flex-col gap-2">
                    <p>{dialogState.message}</p>
                    {dialogState.runAt && (
                        <p className="text-sm text-gray-400 font-mono mt-1">Run At: {dialogState.runAt}</p>
                    )}
                </div>
            </CustomDialog>
        </div>
    );
}
