import React, { useState, useEffect } from 'react';
import { notificationService } from '../../../services/api';

const BellIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await notificationService.getNotifications(1, 50); // Fetch first 50 notifications
                if (data && data.items) {
                    setNotifications(data.items);
                }
            } catch (error) {
                console.error("Error fetching notifications:", error);
                setErrorMsg(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    // Helper to format date "2026-03-12T13:10:26.748452+07:00" to "12/03/2026 13:10:26"
    const formatDateTime = (isoString) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        return date.toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        }).replace(',', '');
    };

    return (
        <div
            className="p-[28px] w-full h-[calc(100vh-104px)] overflow-hidden flex justify-center"
            style={{ backgroundImage: `url('/images/img_background.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            {/* Main Panel */}
            <div className="w-full flex flex-col gap-5 rounded-[24px] border border-[#2a3240] shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-[#151a25]/95 backdrop-blur p-6 h-full">

                {/* Header/Controls Area */}
                {/* <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-[45%] text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input
                                type="text"
                                placeholder="Search notifications"
                                className="bg-[#1e2532] text-sm text-gray-200 placeholder-gray-500 rounded-[8px] pl-10 pr-4 py-2.5 w-[300px] border border-[#2a3240] focus:outline-none focus:border-orange-500/50 transition-colors"
                            />
                        </div>
                        <button className="h-[42px] px-3.5 bg-[#1e2532] hover:bg-[#252b36] border border-[#2a3240] rounded-[8px] flex items-center justify-center text-gray-300 transition-colors shadow-sm">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                        </button>
                    </div> */}

                {/* <div className="h-[42px] px-5 bg-[#1e2532] border border-[#2a3240] rounded-[8px] flex items-center gap-2 text-[15px] font-semibold text-white shadow-sm tracking-wide">
                        <BellIcon />
                        All Notifications
                    </div> */}
                {/* </div> */}

                {/* Table Container */}
                <div className="flex-1 bg-[#1e2532] rounded-[12px] border border-[#2a3240] overflow-hidden flex flex-col shadow-inner">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1.5fr_3fr_1.5fr_1fr] gap-4 px-6 py-4 bg-[#232b38] border-b border-[#2a3240] text-[14px] font-bold text-gray-100 tracking-wide sticky top-0 z-10">
                        <div>Title</div>
                        <div>Message</div>
                        <div>Date & Time</div>
                        <div className="text-center">Status</div>
                    </div>

                    {/* Table Body (Scrollable) */}
                    <div className="flex-1 overflow-y-auto no-scrollbar pb-2 pt-2">
                        {isLoading ? (
                            <div className="text-gray-400 text-sm px-6 py-4">Loading notifications...</div>
                        ) : errorMsg ? (
                            <div className="text-red-400 text-sm px-6 py-4 flex flex-col">
                                <span>Oops, error loading notifications:</span>
                                <span className="opacity-80 mt-1">{errorMsg}</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-gray-400 text-sm px-6 py-4 italic">No notifications found.</div>
                        ) : (
                            notifications.map((notif) => (
                                <div key={notif.id} className="grid grid-cols-[1.5fr_3fr_1.5fr_1fr] gap-4 px-6 py-4 border-b border-[#2a3240]/50 hover:bg-[#252b36] transition-colors items-center text-[13px] group">
                                    <div className={`font-medium ${notif.type === 'mission_terminal' && notif.status === 'Failed' ? 'text-red-400' : 'text-[#ea580c]'}`}>
                                        {notif.title}
                                    </div>
                                    <div className="text-gray-300 pr-4">{notif.body}</div>
                                    <div className="text-gray-400 font-mono">{formatDateTime(notif.created_at)}</div>
                                    <div className="text-center">
                                        {notif.is_read ? (
                                            <span className="text-[11px] uppercase tracking-wider font-bold text-gray-500 border border-gray-600/50 px-2 py-0.5 rounded-full bg-gray-800/50">Read</span>
                                        ) : (
                                            <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full bg-emerald-500/10">Unread</span>
                                        )}
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
