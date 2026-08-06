import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useTelemetry from '../hooks/useTelemetry';
import { uavService, authService, notificationService } from '../../services/api';

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

const BellIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
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

const navLinkStyles = ({ isActive }) =>
    isActive
        ? "px-5 py-[6px] border border-[#ea580c] text-[#ea580c] bg-[#1d232c] text-[11px] font-bold uppercase tracking-widest rounded-sm transition-colors"
        : "px-5 py-[6px] text-gray-100 bg-[#1d232c] text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#252b36] transition-colors border border-transparent";

export default function AppHeader() {
    const navigate = useNavigate();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef(null);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);
    
    const [currentTime, setCurrentTime] = useState(new Date());
    const [uavIds, setUavIds] = useState([]);
    
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

    const handleLogout = async () => {
        setIsSettingsOpen(false);
        await authService.logout();
        navigate('/login');
    };

    // Fetch UAV on mount to get ID for telemetry subscription
    useEffect(() => {
        const fetchUav = async () => {
            try {
                const data = await uavService.getUav();
                if (data && data.id) setUavIds([data.id]);
            } catch (err) {
                console.error('[AppHeader] Failed to fetch UAV:', err);
            }
        };
        fetchUav();
    }, []);

    // Subscribe to telemetry
    const { telemetry } = useTelemetry(uavIds);
    const uavTelemetry = uavIds.length > 0 ? telemetry[uavIds[0]] || {} : {};

    // GPS metric: { sat_count, fix_type, rtk_type, ... }
    const gps = uavTelemetry.gps || {};
    const satCount = gps.satellites ?? '--';
    const rtkType = gps.fix_type_label || gps.fix_type_label || 'N/A';

    // Battery metric: { percent, voltage, temperature, ... }
    const battery = uavTelemetry.battery || {};
    const batteryPercent = battery.percent != null ? Math.round(battery.percent) : '--';
    const batteryVoltage = battery.voltage != null ? battery.voltage.toFixed(1) : '--';
    const batteryTemp = battery.temperature != null ? `${Math.round(battery.temperature)}°C` : '--';

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Notification fetching
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await notificationService.getUnreadCount();
                if (res) setUnreadCount(res.unread_count || 0);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isNotifOpen) {
            setIsLoadingNotifs(true);
            notificationService.getNotifications(1, 5)
                .then(res => {
                    if (res && res.items) setNotifications(res.items);
                    const unreadIds = res?.items?.filter(n => !n.is_read).map(n => n.id) || [];
                    if (unreadIds.length > 0) {
                        notificationService.markRead(unreadIds).catch(console.error);
                        setUnreadCount(prev => Math.max(0, prev - unreadIds.length));
                        
                        setNotifications(prev => prev.map(n => 
                            unreadIds.includes(n.id) ? { ...n, is_read: true } : n
                        ));
                    }
                })
                .catch(console.error)
                .finally(() => setIsLoadingNotifs(false));
        }
    }, [isNotifOpen]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setIsSettingsOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [settingsRef, notifRef]);

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
                    <img src="/images/img_logo.png" alt="Logo" className="w-[107.5px] h-[59.9px]" />
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
                                {/* <div className="h-[1px] bg-[#2a3240] mx-4 my-1"></div> */}
                                {/* <NavLink
                                    to="/docking-panel"
                                    onClick={() => setIsSettingsOpen(false)}
                                    className={({ isActive }) => `
                                        px-4 py-3 text-[13px] font-semibold tracking-wide transition-colors text-left border-l-2
                                        ${isActive ? 'text-[#ea580c] bg-[#252b36]/50 border-[#ea580c]' : 'text-gray-200 hover:bg-[#252b36] border-transparent hover:text-white'}
                                    `}
                                >
                                    Docking Panel
                                </NavLink> */}
                                <div className="h-[1px] bg-[#2a3240] mx-4 my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-3 text-[13px] font-semibold tracking-wide transition-colors text-left text-red-400 hover:bg-[#252b36] hover:text-red-300"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Section - Status, Telemetry and Clock */}
            <div className="flex items-center space-x-8 h-full">

                {/* GNSS / RTK */}
                <div className="flex flex-col items-center justify-center">
                    <span className="text-[10px] font-semibold text-gray-100 tracking-wider font-sans">{rtkType}</span>
                    <div className="flex items-center space-x-1 mt-[1px]">
                        <SatelliteIcon />
                        <span className="text-[13px] font-bold text-white tracking-widest">{satCount}</span>
                    </div>
                </div>

                {/* Signals */}
                <div className="flex flex-col justify-center space-y-1">
                    <SignalRender level={3} label="RC" />
                </div>

                {/* Battery */}
                <div className="flex items-center space-x-2">
                    <span className="text-[22px] font-semibold tracking-tighter text-white">{batteryPercent !== '--' ? `${batteryPercent}%` : '--%'}</span>
                    <BatteryVertical level={typeof batteryPercent === 'number' ? batteryPercent : 0} />
                    <div className="flex flex-col text-[10px] font-semibold text-gray-100 leading-[1.15] space-y-[1px] ml-1">
                        <span>{batteryTemp}</span>
                        <span>{batteryVoltage !== '--' ? `${batteryVoltage}V` : '--'}</span>
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
                        {/* <span>Wed</span>
                        <span>20 May</span> */}
                    </div>
                </div>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`p-[7px] bg-[#1d232c] rounded-sm transition-colors flex items-center justify-center relative border border-transparent
                            ${isNotifOpen ? 'text-[#ea580c] bg-[#252b36] border-[#ea580c]/50' : 'text-gray-100 hover:bg-[#252b36]'}`}
                    >
                        <BellIcon />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#2c3340] shadow-sm">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown Menu */}
                    {isNotifOpen && (
                        <div className="absolute right-0 top-[calc(100%+8px)] w-[360px] bg-[#1a212b] border border-[#2a3240] rounded shadow-xl flex flex-col z-[100] overflow-hidden">
                            <div className="px-5 py-3 border-b border-[#2a3240] flex justify-between items-center bg-[#1d232c]">
                                <h3 className="text-white text-sm font-bold tracking-wide">Notifications</h3>
                            </div>
                            <div className="flex flex-col max-h-[380px] overflow-y-auto custom-scrollbar bg-[#1a212b]">
                                {isLoadingNotifs ? (
                                    <div className="p-6 text-center text-xs text-gray-400">Loading...</div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-gray-400">No new notifications</div>
                                ) : (
                                    notifications.map(notif => (
                                        <div key={notif.id} className="p-4 border-b border-[#2a3240] hover:bg-[#252b36] transition-colors cursor-default">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-xs font-bold ${notif.type === 'mission_terminal' && notif.status === 'Failed' ? 'text-red-400' : 'text-[#ea580c]'}`}>
                                                    {notif.title}
                                                </h4>
                                                {/* <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-2 mt-[2px]">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span> */}
                                            </div>
                                            <p className="text-[11px] text-gray-300 leading-relaxed mb-2">{notif.body}</p>
                                            <span className="text-[9px] text-gray-500 font-mono">
                                                {new Date(notif.created_at).toLocaleString('en-US', { hour12: false })}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-2 border-t border-[#2a3240] bg-[#1d232c]">
                                <button
                                    className="w-full py-2 text-[11px] text-[#ea580c] font-semibold hover:bg-[#252b36] rounded transition-colors"
                                    onClick={() => { setIsNotifOpen(false); /* navigate('/notifications') */ }}
                                >
                                    Show all notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

        </header>
    );
}
