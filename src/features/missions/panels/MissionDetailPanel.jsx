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
    const [takeoffAltitude, setTakeoffAltitude] = useState('');
    const [takeoffHoldDuration, setTakeoffHoldDuration] = useState('');
    const [timeMode, setTimeMode] = useState('One time');
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    // ROI fields
    const [roiLatitude, setRoiLatitude] = useState('');
    const [roiLongitude, setRoiLongitude] = useState('');

    // Recurrent fields
    const [recurrentType, setRecurrentType] = useState('daily');
    const [recurrenceInterval, setRecurrenceInterval] = useState('1');

    // Daily fields
    const [dailyStartDate, setDailyStartDate] = useState('');
    const [dailyEndDate, setDailyEndDate] = useState('');
    const [dailyRepeatTimes, setDailyRepeatTimes] = useState(['09:00']);

    // Weekly fields
    const [selectedDays, setSelectedDays] = useState([1]);
    const [weeklyRepeatTimes, setWeeklyRepeatTimes] = useState(['09:00']);

    // Monthly fields
    const [selectedMonthDays, setSelectedMonthDays] = useState([1]);
    const [monthlyRepeatTimes, setMonthlyRepeatTimes] = useState(['09:00']);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const toggleSelection = (setter, itemIndex) => {
        setter(prev => prev.includes(itemIndex) ? prev.filter(i => i !== itemIndex) : [...prev, itemIndex]);
    };

    // Add/remove/update time helpers (reusable across daily/weekly/monthly)
    const addTime = (setter) => {
        setter(prev => [...prev, '09:00']);
    };

    const removeTime = (setter, index) => {
        setter(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
    };

    const updateTime = (setter, index, value) => {
        setter(prev => prev.map((item, i) => (i === index ? value : item)));
    };

    const handleSubmit = () => {
        onSubmit?.({
            missionName,
            takeoffAltitude,
            takeoffHoldDuration,
            timeMode,
            // ROI
            roiLatitude,
            roiLongitude,
            // One-time fields
            scheduleDate,
            scheduleTime,
            // Recurrent common
            recurrentType,
            // Daily fields
            dailyRepeatTimes: dailyRepeatTimes.filter(Boolean),
            dailyStartDate,
            dailyEndDate,
            // Weekly fields
            selectedDays,
            weeklyRepeatTimes: weeklyRepeatTimes.filter(Boolean),
            weeklyWeeks: parseInt(recurrenceInterval, 10) || 1,
            // Monthly fields
            selectedMonthDays,
            monthlyRepeatTimes: monthlyRepeatTimes.filter(Boolean),
            monthlyMonths: parseInt(recurrenceInterval, 10) || 1,
        });
    };

    // Reusable time-list component
    const renderTimeList = (times, setTimes, label = 'Start Time') => (
        <>
            <div className="flex items-center justify-between">
                <label className="text-gray-400 text-[11px] pl-1 font-medium">{label}</label>
                <button
                    type="button"
                    onClick={() => addTime(setTimes)}
                    className="text-[11px] text-[#ea580c] font-semibold hover:underline"
                >
                    + Add Time
                </button>
            </div>
            <div className="flex flex-col gap-2">
                {times.map((time, index) => (
                    <div key={`${index}-${time}`} className="flex items-center gap-2">
                        <div className="h-[38px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3 flex-1">
                            <input
                                type="time"
                                className="bg-transparent text-gray-100 text-[12px] outline-none w-full"
                                style={{ colorScheme: 'dark' }}
                                value={time}
                                onChange={(e) => updateTime(setTimes, index, e.target.value)}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeTime(setTimes, index)}
                            className="h-[38px] px-3 bg-[#2d3745] border border-[#3b4452] rounded text-gray-300 hover:text-white disabled:opacity-50"
                            disabled={times.length <= 1}
                        >
                            -
                        </button>
                    </div>
                ))}
            </div>
        </>
    );

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
                {/* <div className="flex flex-col">
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
                                    {drone.name} {drone.camera_spec ? `(${drone.camera_spec})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div> */}

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="text-gray-400 text-[11px] mb-2 pl-1 shadow-black drop-shadow-sm font-medium">Drone</label>
                        <div className="h-[40px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-4 focus-within:border-gray-400 transition-colors">
                            <select
                                value={selectedUavId || ''}
                                onChange={(e) => onSelectUav(parseInt(e.target.value))}
                                className="bg-transparent text-gray-100 text-[13px] outline-none w-full appearance-none cursor-pointer"
                            >
                                {drones.length === 0 && <option value="" className="bg-[#2d3745]">Loading UAVs...</option>}
                                {drones.map(drone => (
                                    <option key={drone.id} value={drone.id} className="bg-[#2d3745]">
                                        {drone.name} {drone.camera_spec ? `(${drone.camera_spec})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-gray-400 text-[11px] mb-2 pl-1 shadow-black drop-shadow-sm font-medium">TakeOff Altitude</label>
                        <div className="h-[40px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-4 relative focus-within:border-gray-400 transition-colors">
                            <input
                                type="number"
                                className="bg-transparent text-gray-100 text-[13px] outline-none w-full"
                                placeholder="15"
                                value={takeoffAltitude}
                                onChange={(e) => setTakeoffAltitude(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Mission name + time mode row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="text-gray-400 text-[11px] mb-2 pl-1 shadow-black drop-shadow-sm font-medium">Mission Name</label>
                        <div className="h-[40px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-4 focus-within:border-gray-400 transition-colors">
                            <input
                                type="text"
                                className="bg-transparent text-gray-100 text-[13px] outline-none w-full"
                                placeholder="Mission 1"
                                value={missionName}
                                onChange={(e) => setMissionName(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-gray-400 text-[11px] mb-2 pl-1 shadow-black drop-shadow-sm font-medium">Time Mode</label>
                        <div className="h-[40px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-4 relative focus-within:border-gray-400 transition-colors">
                            <select
                                value={timeMode}
                                onChange={(e) => setTimeMode(e.target.value)}
                                className="bg-transparent text-gray-100 text-[13px] outline-none w-full appearance-none cursor-pointer"
                            >
                                <option value="One time" className="bg-[#2d3745]">One time</option>
                                <option value="Now" className="bg-[#2d3745]">Now</option>
                                <option value="Recurrent" className="bg-[#2d3745]">Recurrent</option>
                            </select>
                            <div className="pointer-events-none absolute right-4 text-gray-400">
                                <ChevronDownIcon />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Takeoff Hold Duration + ROI row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                        <label className="text-gray-400 text-[11px] mb-2 pl-1 shadow-black drop-shadow-sm font-medium">Hold Duration (s) <span className="text-gray-500">optional</span></label>
                        <div className="h-[40px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-4 focus-within:border-gray-400 transition-colors">
                            <input
                                type="number"
                                className="bg-transparent text-gray-100 text-[13px] outline-none w-full"
                                placeholder="0"
                                min="0"
                                value={takeoffHoldDuration}
                                onChange={(e) => setTakeoffHoldDuration(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-gray-400 text-[11px] mb-2 pl-1 shadow-black drop-shadow-sm font-medium">ROI <span className="text-gray-500">lat, lng</span></label>
                        <div className="h-[40px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-1 gap-1 focus-within:border-gray-400 transition-colors">
                            <input
                                type="number"
                                step="any"
                                className="bg-transparent text-gray-100 text-[12px] outline-none w-1/2 px-2"
                                placeholder="Lat"
                                value={roiLatitude}
                                onChange={(e) => setRoiLatitude(e.target.value)}
                            />
                            <div className="w-px h-5 bg-[#3b4452]"></div>
                            <input
                                type="number"
                                step="any"
                                className="bg-transparent text-gray-100 text-[12px] outline-none w-1/2 px-2"
                                placeholder="Lng"
                                value={roiLongitude}
                                onChange={(e) => setRoiLongitude(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* One-time fields */}
                {timeMode === 'One time' && (
                    <div className="grid grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex flex-col">
                                <label className="text-gray-400 text-[11px] mb-2 pl-1 font-medium">Type</label>
                                <div className="h-[38px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3 relative cursor-pointer hover:border-gray-400 transition-colors">
                                    <select
                                        value={recurrentType}
                                        onChange={(e) => setRecurrentType(e.target.value)}
                                        className="bg-transparent text-gray-100 text-[12px] outline-none w-full appearance-none cursor-pointer"
                                    >
                                        <option value="daily" className="bg-[#2d3745]">Daily</option>
                                        <option value="weekly" className="bg-[#2d3745]">Weekly</option>
                                        <option value="monthly" className="bg-[#2d3745]">Monthly</option>
                                    </select>
                                    <div className="pointer-events-none absolute right-2 text-gray-400">
                                        <ChevronDownIcon />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {recurrentType === 'daily' && (
                            <>
                                {renderTimeList(dailyRepeatTimes, setDailyRepeatTimes)}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <label className="text-gray-400 text-[11px] mb-2 pl-1 font-medium">Start Date</label>
                                        <div className="h-[38px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3">
                                            <input
                                                type="date"
                                                className="bg-transparent text-gray-100 text-[12px] outline-none w-full"
                                                style={{ colorScheme: 'dark' }}
                                                value={dailyStartDate}
                                                onChange={(e) => setDailyStartDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-gray-400 text-[11px] mb-2 pl-1 font-medium">End Date</label>
                                        <div className="h-[38px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3">
                                            <input
                                                type="date"
                                                className="bg-transparent text-gray-100 text-[12px] outline-none w-full"
                                                style={{ colorScheme: 'dark' }}
                                                value={dailyEndDate}
                                                onChange={(e) => setDailyEndDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {recurrentType === 'weekly' && (
                            <>
                                <div className="grid grid-cols-7 rounded-[6px] overflow-hidden border border-[#3b4452]">
                                    {days.map((day, idx) => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleSelection(setSelectedDays, idx)}
                                            className={`py-[7px] text-[10px] font-bold tracking-wide transition-colors ${selectedDays.includes(idx)
                                                ? 'bg-[#ea580c] text-white'
                                                : 'bg-[#2d3745] text-gray-400 hover:bg-[#3b4452] hover:text-gray-200'
                                                } ${idx !== 6 ? 'border-r border-[#3b4452]' : ''}`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                                {renderTimeList(weeklyRepeatTimes, setWeeklyRepeatTimes)}
                                <div className="flex flex-col">
                                    <label className="text-gray-400 text-[11px] mb-2 pl-1 font-medium">Ends after (weeks)</label>
                                    <div className="h-[38px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3">
                                        <input
                                            type="number"
                                            min="1"
                                            value={recurrenceInterval}
                                            onChange={(e) => setRecurrenceInterval(e.target.value)}
                                            className="bg-transparent text-gray-100 text-[12px] outline-none w-full"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {recurrentType === 'monthly' && (
                            <>
                                <div className="flex flex-col">
                                    <label className="text-gray-400 text-[11px] mb-2 pl-1 font-medium">Select Days of Month</label>
                                    <div className="grid grid-cols-7 gap-1">
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleSelection(setSelectedMonthDays, day)}
                                                className={`py-[5px] text-[10px] font-bold rounded transition-colors ${selectedMonthDays.includes(day)
                                                    ? 'bg-[#ea580c] text-white'
                                                    : 'bg-[#2d3745] text-gray-400 hover:bg-[#3b4452] hover:text-gray-200'
                                                    } border border-[#3b4452]`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {renderTimeList(monthlyRepeatTimes, setMonthlyRepeatTimes)}
                                <div className="flex flex-col">
                                    <label className="text-gray-400 text-[11px] mb-2 pl-1 font-medium">Ends after (months)</label>
                                    <div className="h-[38px] bg-[#2d3745] border border-[#3b4452] rounded shadow-inner flex items-center px-3">
                                        <input
                                            type="number"
                                            min="1"
                                            value={recurrenceInterval}
                                            onChange={(e) => setRecurrenceInterval(e.target.value)}
                                            className="bg-transparent text-gray-100 text-[12px] outline-none w-full"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
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
                    className={`w-full h-[44px] rounded-[4px] text-white text-[14px] font-bold tracking-wide shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isSubmitting || waypointsCount === 0
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
