import React, { useState } from 'react';

// Icons
const CloseIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
);

const ChevronDownIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
);

export default function MissionDetailPanel({
    waypointsCount = 0,
    onClearWaypoints,
    drones = [],
    selectedUavId,
    onSelectUav,
    onSubmit,
    isSubmitting = false,
    submitError = '',
    submitSuccess = ''
}) {
    const [missionName, setMissionName] = useState('');
    const [timeMode, setTimeMode] = useState('Later');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    // Recurrent fields
    const [recurrentType, setRecurrentType] = useState('Monthly');
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [selectedWeeks, setSelectedWeeks] = useState([]);
    const [selectedDays, setSelectedDays] = useState([]);
    const [isIntervalEnabled, setIsIntervalEnabled] = useState(false);
    const [recurrenceInterval, setRecurrenceInterval] = useState('2');

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const toggleSelection = (setter, itemIndex) => {
        setter(prev => prev.includes(itemIndex) ? prev.filter(i => i !== itemIndex) : [...prev, itemIndex]);
    };

    const handleSubmit = () => {
        let schedule = null;
        let isRecurring = false;
        let recurrenceUnit = null;
        let recInterval = null;

        // Format as local datetime string: "2026-04-07 13:10:00"
        const formatSchedule = (date, time) => {
            if (date && time) return `${date} ${time}:00`;
            if (date) return `${date} 00:00:00`;
            // Fallback: current local time
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        };

        if (timeMode === 'Now') {
            schedule = formatSchedule(null, null);
        } else if (timeMode === 'Later') {
            schedule = formatSchedule(scheduleDate, scheduleTime);
        } else if (timeMode === 'Recurrent') {
            isRecurring = true;
            recurrenceUnit = recurrentType.toLowerCase();
            recInterval = isIntervalEnabled ? parseInt(recurrenceInterval) || 1 : 1;
            schedule = formatSchedule(scheduleDate, scheduleTime);
        }

        onSubmit?.({
            missionName,
            timeMode,
            schedule,
            isRecurring,
            recurrenceUnit,
            recurrenceInterval: recInterval
        });
    };

    return (
        <div className="w-auto h-full p-5 flex flex-col select-none bg-[#242c38] rounded-tl-lg border border-[#3b4452] shadow-2xl overflow-y-auto no-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 border-[#3b4452]">
                <div>
                    <h2 className="text-white text-[24px] font-bold tracking-wide">Create Mission</h2>
                    <p className="text-gray-400 text-[13px] mt-[2px]">{waypointsCount} Waypoint{waypointsCount !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={onClearWaypoints}
                    className="bg-[#da5049] hover:bg-[#c6443e] transition-colors rounded-[4px] px-[18px] py-[10px] text-black text-[13px] font-bold flex items-center shadow-md active:scale-[0.98]"
                >
                    <CloseIcon />
                    Clear Mission
                </button>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-5 w-full pr-8">

                {/* UAV Selection */}
                <div className="flex flex-col">
                    <label className="text-gray-400 text-[11px] mb-2 pl-1 shadow-black drop-shadow-sm font-medium">Select UAV</label>
                    <div className="h-[40px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-4 relative focus-within:border-gray-400 transition-colors">
                        <select
                            value={selectedUavId || ''}
                            onChange={(e) => onSelectUav(parseInt(e.target.value))}
                            className="bg-transparent text-gray-100 text-[13px] outline-none w-full appearance-none cursor-pointer"
                        >
                            {drones.length === 0 && <option value="" className="bg-[#2d3745]">Loading UAVs...</option>}
                            {drones.map(drone => (
                                <option key={drone.id} value={drone.id} className="bg-[#2d3745]">
                                    {drone.name || `DRONE ${drone.id}`}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute right-4 text-gray-400">
                            <ChevronDownIcon />
                        </div>
                    </div>
                </div>

                {/* Mission Name */}
                <div className="flex flex-col">
                    <label className="text-gray-400 text-[11px] mb-2 pl-1 shadow-black drop-shadow-sm font-medium">Mission Name</label>
                    <div className="h-[40px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-4 focus-within:border-gray-400 transition-colors">
                        <input
                            type="text"
                            className="bg-transparent text-gray-100 text-[13px] outline-none w-full"
                            placeholder="Enter mission name"
                            value={missionName}
                            onChange={(e) => setMissionName(e.target.value)}
                        />
                    </div>
                </div>

                {/* Time Mode */}
                <div className="flex flex-col">
                    <label className="text-gray-400 text-[11px] mb-2 pl-1 shadow-black drop-shadow-sm font-medium">Time Mode</label>
                    <div className="h-[40px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-4 relative focus-within:border-gray-400 transition-colors">
                        <select
                            value={timeMode}
                            onChange={(e) => setTimeMode(e.target.value)}
                            className="bg-transparent text-gray-100 text-[13px] outline-none w-full appearance-none cursor-pointer"
                        >
                            <option value="Now" className="bg-[#2d3745]">Now</option>
                            <option value="Later" className="bg-[#2d3745]">Later</option>
                            <option value="Recurrent" className="bg-[#2d3745]">Recurrent</option>
                        </select>
                        <div className="pointer-events-none absolute right-4 text-gray-400">
                            <ChevronDownIcon />
                        </div>
                    </div>
                </div>

                {/* Later Mode Fields */}
                {timeMode === 'Later' && (
                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex flex-col relative w-full">
                            <label className="text-gray-400 text-[11px] mb-2 pl-1 shadow-black drop-shadow-sm font-medium">Date</label>
                            <div className="h-[38px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3 focus-within:border-gray-400 transition-colors w-full">
                                <input
                                    type="date"
                                    className="bg-transparent text-gray-100 text-[12px] outline-none w-full"
                                    style={{ colorScheme: 'dark' }}
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col relative w-full">
                            <label className="text-gray-400 text-[11px] mb-2 pl-1 shadow-black drop-shadow-sm font-medium">Start Time</label>
                            <div className="h-[38px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3 focus-within:border-gray-400 transition-colors w-full">
                                <input
                                    type="time"
                                    className="bg-transparent text-gray-100 text-[12px] outline-none w-full"
                                    style={{ colorScheme: 'dark' }}
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Recurrent Mode Fields */}
                {timeMode === 'Recurrent' && (
                    <div className="bg-[#242c38] rounded-xl flex flex-col gap-4 w-full">
                        {/* Type Row */}
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-400 text-[11px] pl-1 font-medium">Type</span>
                            <div className="h-[28px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3 relative w-[100px] cursor-pointer hover:border-gray-400 transition-colors">
                                <select
                                    value={recurrentType}
                                    onChange={(e) => setRecurrentType(e.target.value)}
                                    className="bg-transparent text-gray-400 text-[11px] outline-none w-full appearance-none cursor-pointer"
                                >
                                    <option value="Monthly" className="bg-[#2d3745]">Monthly</option>
                                    <option value="Weekly" className="bg-[#2d3745]">Weekly</option>
                                    <option value="Daily" className="bg-[#2d3745]">Daily</option>
                                </select>
                                <div className="pointer-events-none absolute right-2 text-gray-400">
                                    <ChevronDownIcon />
                                </div>
                            </div>
                        </div>

                        {/* Selection Grid */}
                        {recurrentType === 'Monthly' && (
                            <div className="grid grid-cols-12 rounded-[6px] overflow-hidden border border-[#3b4452]">
                                {months.map((month, idx) => (
                                    <button
                                        key={month}
                                        onClick={() => toggleSelection(setSelectedMonths, idx)}
                                        className={`py-[6px] text-[9.5px] font-bold tracking-wide transition-colors ${selectedMonths.includes(idx)
                                            ? 'bg-[#ea580c] text-white'
                                            : 'bg-[#2d3745] text-gray-400 hover:bg-[#3b4452] hover:text-gray-200'
                                            } ${idx !== 11 ? 'border-r border-[#3b4452]' : ''}`}
                                    >
                                        {month}
                                    </button>
                                ))}
                            </div>
                        )}
                        {recurrentType === 'Weekly' && (
                            <div className="grid grid-cols-5 rounded-[6px] overflow-hidden border border-[#3b4452]">
                                {weeks.map((week, idx) => (
                                    <button
                                        key={week}
                                        onClick={() => toggleSelection(setSelectedWeeks, idx)}
                                        className={`py-[6px] text-[11px] font-bold tracking-wide transition-colors ${selectedWeeks.includes(idx)
                                            ? 'bg-[#ea580c] text-white'
                                            : 'bg-[#2d3745] text-gray-400 hover:bg-[#3b4452] hover:text-gray-200'
                                            } ${idx !== 4 ? 'border-r border-[#3b4452]' : ''}`}
                                    >
                                        {week}
                                    </button>
                                ))}
                            </div>
                        )}
                        {recurrentType === 'Daily' && (
                            <div className="grid grid-cols-7 rounded-[6px] overflow-hidden border border-[#3b4452]">
                                {days.map((day, idx) => (
                                    <button
                                        key={day}
                                        onClick={() => toggleSelection(setSelectedDays, idx)}
                                        className={`py-[6px] text-[11px] font-bold tracking-wide transition-colors ${selectedDays.includes(idx)
                                            ? 'bg-[#ea580c] text-white'
                                            : 'bg-[#2d3745] text-gray-400 hover:bg-[#3b4452] hover:text-gray-200'
                                            } ${idx !== 6 ? 'border-r border-[#3b4452]' : ''}`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Date/Time Inputs Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-[38px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3 focus-within:border-gray-400 transition-colors w-full relative">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mr-2 shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                <input
                                    type="date"
                                    className="bg-transparent text-gray-400 text-[12px] outline-none w-full flex-1"
                                    style={{ colorScheme: 'dark' }}
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                />
                            </div>
                            <div className="h-[38px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3 focus-within:border-gray-400 transition-colors w-full relative">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mr-2 shrink-0"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                <input
                                    type="time"
                                    className="bg-transparent text-gray-400 text-[12px] outline-none w-full flex-1"
                                    style={{ colorScheme: 'dark' }}
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Interval Section */}
                        <div className="mt-2 text-gray-200">
                            <label className="flex items-center cursor-pointer group w-fit mb-4" onClick={() => setIsIntervalEnabled(!isIntervalEnabled)}>
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center mr-2 transition-colors ${isIntervalEnabled ? 'border-gray-400' : 'border-gray-500'}`}>
                                    {isIntervalEnabled && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                                <span className={`text-[12px] font-medium transition-colors ${isIntervalEnabled ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-400'}`}>Interval</span>
                            </label>

                            {isIntervalEnabled && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className="text-gray-500 text-[11px] mb-2 pl-1 font-medium">Interval</label>
                                        <div className="h-[38px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3 focus-within:border-gray-400 transition-colors w-full">
                                            <input
                                                type="text"
                                                value={recurrenceInterval}
                                                onChange={(e) => setRecurrenceInterval(e.target.value)}
                                                className="bg-transparent text-gray-300 text-[12px] outline-none w-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-gray-500 text-[11px] mb-2 pl-1 font-medium">End Time</label>
                                        <div className="h-[38px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3 focus-within:border-gray-400 transition-colors w-full relative">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mr-2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            <input
                                                type="time"
                                                defaultValue="14:00"
                                                className="bg-transparent text-gray-300 text-[12px] outline-none w-full"
                                                style={{ colorScheme: 'dark' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Error / Success Messages */}
                {submitError && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-[12px] px-4 py-2.5 rounded">
                        {submitError}
                    </div>
                )}
                {submitSuccess && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-400 text-[12px] px-4 py-2.5 rounded">
                        {submitSuccess}
                    </div>
                )}

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || waypointsCount === 0}
                    className={`w-full h-[44px] rounded-[4px] text-white text-[14px] font-bold tracking-wide shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                        isSubmitting || waypointsCount === 0
                            ? 'bg-gray-600 cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-b from-[#ea580c] to-[#9c3804] hover:brightness-110'
                    }`}
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Submitting...
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                            </svg>
                            Register Mission
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
