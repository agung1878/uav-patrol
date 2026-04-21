import React from 'react';

export default function WaypointSelectionPanel({
    waypoints,
    waypointsData = {},
    onWaypointDataChange,
    onCancel
}) {
    const getPointData = (id) => waypointsData[id] || { altitude: 150, action: 'hold', action_duration: 5 };

    return (
        <div className="w-full h-full bg-[#1c222c] p-5 flex flex-col select-none">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-white text-[18px] font-bold tracking-wide">Waypoint Selection</h2>
                    <p className="text-gray-400 text-[11px] mt-1">{waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''} added</p>
                </div>
                <div className="flex items-center gap-2">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="text-gray-400 hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded border border-[#2a3240] hover:border-gray-500 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Waypoints List */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {waypoints.length === 0 ? (
                    <p className="text-gray-500 text-xs italic text-center mt-10">Click on the map to add waypoints</p>
                ) : (
                    waypoints.map((wp, i) => {
                        const data = getPointData(wp.id);
                        return (
                            <div key={wp.id} className="bg-[#171c24] border border-[#2a3240] rounded-lg p-3 relative">
                                <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-red-600"></div>
                                <h3 className="text-white text-xs font-bold mb-2 tracking-wide">Point {i + 1}</h3>
                                <div className="text-[9px] text-gray-500 font-mono mb-3">
                                    {wp.lat.toFixed(6)}, {wp.lng.toFixed(6)}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-gray-400 text-[9px] uppercase">Altitude (M)</span>
                                        <div className="h-[28px] bg-[#1c222c] border border-[#2a3240] rounded px-2 flex items-center">
                                            <input
                                                type="number"
                                                className="bg-transparent text-white text-[11px] outline-none w-full"
                                                value={data.altitude}
                                                onChange={(e) => onWaypointDataChange(wp.id, 'altitude', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-gray-400 text-[9px] uppercase">Duration (s)</span>
                                        <div className="h-[28px] bg-[#1c222c] border border-[#2a3240] rounded px-2 flex items-center">
                                            <input
                                                type="number"
                                                className="bg-transparent text-white text-[11px] outline-none w-full"
                                                value={data.action_duration ?? 5}
                                                onChange={(e) => onWaypointDataChange(wp.id, 'action_duration', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-gray-400 text-[9px] uppercase">Action</span>
                                        <div className="h-[28px] bg-[#1c222c] border border-[#2a3240] rounded px-2 flex items-center relative">
                                            <select
                                                className="bg-transparent text-white text-[11px] outline-none w-full appearance-none cursor-pointer"
                                                value={data.action}
                                                onChange={(e) => onWaypointDataChange(wp.id, 'action', e.target.value)}
                                            >
                                                <option value="hold" className="bg-[#1c222c]">Hold</option>
                                                <option value="take_photo" className="bg-[#1c222c]">Take Photo</option>
                                                <option value="video_record" className="bg-[#1c222c]">Video Record</option>
                                                <option value="survey" className="bg-[#1c222c]">Survey</option>
                                            </select>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 pointer-events-none absolute right-2">
                                                <path d="M6 9l6 6 6-6" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
