import React, { useState, useEffect } from 'react';
import { uavService } from '../../../services/api';

export default function DroneInfoPanel() {
    const [drones, setDrones] = useState([]);
    const [selectedDrone, setSelectedDrone] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    useEffect(() => {
        const fetchDroneInfo = async () => {
            try {
                const data = await uavService.getMyUavsDropdown();
                if (data && data.length > 0) {
                    setDrones(data);
                    setSelectedDrone(data[0]);
                } else {
                    setErrorMsg('No UAVs Available');
                }
            } catch (error) {
                console.error("Error fetching drone info:", error);
                if (error.message === 'No authentication token found') {
                    setErrorMsg('Not Authenticated');
                } else {
                    setErrorMsg('Error Loading Data');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchDroneInfo();
    }, []);

    return (
        <div className="w-full h-full bg-[#1c222c] rounded-2xl border border-[#2a3240] p-5 shadow-lg flex flex-col gap-6 select-none">

            {/* Header Section */}
            <div className="flex justify-between items-start">
                <div className="flex flex-col text-left relative h-10 w-[70%]" onMouseLeave={() => setIsDropdownOpen(false)}>
                    {isLoading ? (
                        <h2 className="text-white text-[18px] font-bold tracking-wide">Loading...</h2>
                    ) : errorMsg ? (
                        <h2 className="text-red-400 text-[18px] font-bold tracking-wide text-sm">{errorMsg}</h2>
                    ) : (
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <h2 className="text-white text-[18px] font-bold tracking-wide truncate max-w-[90%]">
                                {selectedDrone?.name || 'Select UAV'}
                            </h2>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    )}

                    {/* Dropdown Menu */}
                    {isDropdownOpen && drones.length > 1 && (
                        <div className="absolute top-8 left-0 w-full bg-[#252b36] border border-[#3b4353] rounded-md shadow-xl z-50 py-1 overflow-hidden mt-1 max-h-[150px] overflow-y-auto">
                            {drones.map((drone) => (
                                <div
                                    key={drone.id}
                                    className={`px-3 py-2 text-[14px] cursor-pointer hover:bg-[#1a212b] transition-colors ${selectedDrone?.id === drone.id ? 'text-[#ea580c] font-bold bg-[#1a212b]' : 'text-gray-200'}`}
                                    onClick={() => {
                                        setSelectedDrone(drone);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    <div className="truncate">{drone.name}</div>
                                    {drone.camera_spec && <div className="text-[10px] text-gray-500 font-mono mt-[1px]">{drone.camera_spec}</div>}
                                </div>
                            ))}
                        </div>
                    )}

                    {!isLoading && !errorMsg && (
                        <a href="#" className="text-[#ea580c] text-[10px] font-semibold tracking-wider hover:underline mt-[2px] w-fit">
                            {selectedDrone?.camera_spec ? `Spec: ${selectedDrone.camera_spec}` : 'View Detail'}
                        </a>
                    )}
                </div>
                <img src="/src/assets/icon_drone.png" alt="Drone" className="h-10 w-auto object-contain drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] invert brightness-75 sepia-[0.5] hue-rotate-180 saturate-50" />
            </div>

            {/* Battery Section */}
            <div className="flex flex-col gap-2 text-left">
                <h3 className="text-gray-200 text-xs font-semibold tracking-wide">Battery</h3>
                <div className="flex justify-between items-center bg-[#171c24] border border-[#2a3240] rounded-xl p-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-4 border-[1.5px] border-gray-400 rounded-[2px] p-[1.5px] relative">
                            <div className="h-full bg-[#ea580c] w-[82%] rounded-[1px]"></div>
                            <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-[2px] h-2 bg-gray-400 rounded-r-[1px]"></div>
                        </div>
                        <span className="text-white text-sm font-bold tracking-wider font-mono">82%</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[#1ab394] text-[11px] font-bold tracking-wide">Good</span>
                        <span className="text-[#1ab394] text-[9px] font-medium tracking-wide">Safe to Fly</span>
                    </div>
                </div>
            </div>

            {/* Weather Section */}
            <div className="flex flex-col gap-2 flex-1 text-left">
                <h3 className="text-gray-200 text-xs font-semibold tracking-wide">Wheater</h3>
                <div className="flex flex-col flex-1 justify-between bg-[#171c24] border border-[#2a3240] rounded-xl p-4">

                    {/* Weather Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="relative mt-1">
                                <div className="w-6 h-6 rounded-full bg-[#fcd34d] absolute -left-1 -top-1"></div>
                                <div className="w-8 h-4 bg-white rounded-full relative z-10 shadow-sm before:absolute before:w-3.5 before:h-3.5 before:bg-white before:rounded-full before:-top-2 before:left-1 after:absolute after:w-4.5 after:h-4.5 after:bg-white after:rounded-full after:-top-2.5 after:right-0.5"></div>
                            </div>
                            <span className="text-white text-2xl font-bold tracking-wider font-sans">31°C</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-white text-[13px] font-bold tracking-wide leading-tight">Cijantung</span>
                            <span className="text-gray-300 text-[10px] font-mono tracking-wide mt-[2px]">11:30</span>
                        </div>
                    </div>

                    {/* Weather Stats Table */}
                    <div className="flex flex-col text-[10px] text-gray-400 mt-5">
                        <div className="h-[1px] w-full bg-[#2a3240] my-1.5 opacity-60"></div>
                        <div className="flex justify-between px-1">
                            <div className="flex w-1/2 justify-between pr-4"><span>Gust</span><span className="text-gray-200 font-mono">6 m/s</span></div>
                            <div className="flex w-1/2 justify-between pl-4"><span>Gust</span><span className="text-gray-200 font-mono">6 m/s</span></div>
                        </div>
                        <div className="h-[1px] w-full bg-[#2a3240] my-1.5 opacity-60"></div>
                        <div className="flex justify-between px-1">
                            <div className="flex w-1/2 justify-between pr-4"><span>Humid</span><span className="text-gray-200 font-mono">6 m/s</span></div>
                            <div className="flex w-1/2 justify-between pl-4"><span>Humid</span><span className="text-gray-200 font-mono">6 m/s</span></div>
                        </div>
                        <div className="h-[1px] w-full bg-[#2a3240] my-1.5 opacity-60"></div>
                    </div>

                    {/* Weather Footer */}
                    <div className="flex justify-center mt-3">
                        <span className="text-[#1ab394] text-[10px] font-medium tracking-wide">Good Condition for flight</span>
                    </div>

                </div>
            </div>

        </div>
    );
}
