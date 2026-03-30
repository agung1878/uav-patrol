import React, { useState, useRef, useEffect } from 'react';

const SatelliteIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M13 7 9 3 5 7l4 4" /><path d="m17 11 4 4-4 4-4-4" /><path d="m8 12 4 4 6-6-4-4Z" /><path d="m16 8 3-3" /><path d="M9 21a6 6 0 0 0-6-6" />
    </svg>
);

const SettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const SignalRender = ({ level, label }) => {
    const heights = ['h-1/4', 'h-2/4', 'h-3/4', 'h-full'];
    return (
        <div className="flex items-center justify-end space-x-2 min-w-[3rem] text-white">
            <span className="text-[11px] font-bold text-gray-100">{label}</span>
            <div className="flex items-end space-x-[2px] h-[14px]">
                {[1, 2, 3, 4].map((bar, idx) => (
                    <div
                        key={bar}
                        className={`w-[3px] rounded-[0.5px] ${heights[idx]} ${bar <= level ? 'bg-white' : 'bg-[#566070]'}`}
                    />
                ))}
            </div>
        </div>
    );
};

const BatteryVertical = ({ level = 80 }) => (
    <div className="flex flex-col items-center justify-end h-7 w-4">
        <div className="w-[6px] h-[2px] bg-gray-300 rounded-t-[1px]" />
        <div className="w-[16px] h-[22px] border-[1.5px] border-gray-300 rounded-[2px] p-[1.5px] flex flex-col justify-end">
            <div
                className="w-full bg-white rounded-[1px]"
                style={{ height: `${level}%` }}
            />
        </div>
    </div>
);

import { NavLink } from 'react-router-dom';

const navLinkStyles = ({ isActive }) =>
    isActive
        ? "px-5 py-[6px] border border-[#ea580c] text-[#ea580c] bg-[#1d232c] text-[11px] font-bold uppercase tracking-widest rounded-sm transition-colors"
        : "px-5 py-[6px] text-gray-100 bg-[#1d232c] text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#252b36] transition-colors border border-transparent";

export default function AppHeader() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        function handleClickOutside(event) {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setIsSettingsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [settingsRef]);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const dayStr = days[currentTime.getDay()];
    const dateStr = `${currentTime.getDate()} ${months[currentTime.getMonth()]}`;

    return (
        <header className="flex flex-row items-center justify-between px-4 py-2 bg-[#2c3340] h-[104px] shadow-sm select-none relative z-50">

            {/* Left Section - Branding and Navigation */}
            <div className="flex items-center space-x-10 h-full">
                {/* Branding */}
                <div className="flex items-center space-x-3">
                    <img src="/src/assets/img_logo.png" alt="Logo" className="w-[107.5px] h-[59.9px]" />
                    <div className="flex flex-col mb-1 text-[#ea580c] font-black tracking-widest leading-[1.1] uppercase">
                        <span className="text-[15px]">UAV</span>
                        <span className="text-[15px]">PATROL</span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center space-x-2 h-full">
                    <NavLink to="/dashboard" className={navLinkStyles}>
                        DASHBOARD
                    </NavLink>
                    <NavLink to="/missions" className={navLinkStyles}>
                        MISSIONS
                    </NavLink>
                    <NavLink to="/history" className={navLinkStyles}>
                        HISTORY
                    </NavLink>
                    <div className="relative" ref={settingsRef}>
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className={`p-[7px] bg-[#1d232c] rounded-sm transition-colors flex items-center justify-center ml-1
                                ${isSettingsOpen ? 'text-[#ea580c] bg-[#252b36]' : 'text-gray-100 hover:bg-[#252b36]'}`}
                        >
                            <SettingsIcon />
                        </button>

                        {/* Settings Dropdown Menu */}
                        {isSettingsOpen && (
                            <div className="absolute right-0 top-[calc(100%+8px)] w-[180px] bg-[#1a212b] border border-[#2a3240] rounded shadow-xl py-2 flex flex-col z-[100]">
                                <NavLink
                                    to="/about"
                                    onClick={() => setIsSettingsOpen(false)}
                                    className={({ isActive }) => `
                                        px-4 py-3 text-[13px] font-semibold tracking-wide transition-colors border-l-2
                                        ${isActive ? 'text-[#ea580c] bg-[#252b36]/50 border-[#ea580c]' : 'text-gray-200 hover:bg-[#252b36] border-transparent hover:text-white'}
                                    `}
                                >
                                    About
                                </NavLink>
                                <div className="h-[1px] bg-[#2a3240] mx-4 my-1"></div>
                                <NavLink
                                    to="/user-management"
                                    onClick={() => setIsSettingsOpen(false)}
                                    className={({ isActive }) => `
                                        px-4 py-3 text-[13px] font-semibold tracking-wide transition-colors text-left border-l-2
                                        ${isActive ? 'text-[#ea580c] bg-[#252b36]/50 border-[#ea580c]' : 'text-gray-200 hover:bg-[#252b36] border-transparent hover:text-white'}
                                    `}
                                >
                                    User Management
                                </NavLink>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Section - Status, Telemetry and Clock */}
            <div className="flex items-center space-x-8 h-full">

                {/* GNSS */}
                <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] font-semibold text-gray-100 tracking-wider font-sans">GNSS+</span>
                    <div className="flex items-center space-x-1 mt-[1px]">
                        <SatelliteIcon />
                        <span className="text-[13px] font-bold text-white tracking-widest">31</span>
                    </div>
                </div>

                {/* Signals */}
                <div className="flex flex-col justify-center space-y-1">
                    <SignalRender level={3} label="RC" />
                    <SignalRender level={4} label="4G" />
                </div>

                {/* Battery */}
                <div className="flex items-center space-x-2">
                    <span className="text-[22px] font-semibold tracking-tighter text-white">80%</span>
                    <BatteryVertical level={80} />
                    <div className="flex flex-col text-[10px] font-semibold text-gray-100 leading-[1.15] space-y-[1px] ml-1">
                        <span>25°C</span>
                        <span>51.8V</span>
                    </div>
                </div>

                {/* Clock */}
                <div className="ml-2 flex flex-row items-center bg-[#171c24] border border-[#3b4353] rounded px-3 py-[6px] min-w-[130px]">
                    <span className="text-[26px] font-light text-white tracking-wider font-sans leading-none mt-1">
                        {timeStr}
                    </span>
                    <div className="flex flex-col text-[9px] uppercase tracking-wider text-gray-300 leading-[1.2] ml-3 mt-1">
                        <span>{dayStr}</span>
                        <span>{dateStr}</span>
                    </div>
                </div>

            </div>

        </header>
    );
}
