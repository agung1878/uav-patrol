import React, { useState } from 'react';

// Icons for the Mission Types
const LaunchIcon = () => (
    <img src="/src/assets/icon_launch.png" alt="Launch" width="64" height="64" />
);

const ROIIcon = () => (
    <img src="/src/assets/icon_roi.png" alt="ROI" width="64" height="64" />
);

const SpiralIcon = () => (
    <img src="/src/assets/icon_spiral.png" alt="Spiral" width="64" height="64" />
);


export default function QuickLaunchDialog({ isOpen, onClose, onConfirm }) {
    const [selectedType, setSelectedType] = useState('ROI');

    if (!isOpen) return null;

    const missionTypes = [
        { id: 'Launch', label: 'Launch', icon: <LaunchIcon /> },
        { id: 'ROI', label: 'ROI', icon: <ROIIcon /> },
        { id: 'Spiral', label: 'Spiral', icon: <SpiralIcon /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0f18]/80 backdrop-blur-sm">
            <div className="bg-[#151a25]/95 rounded-[12px] border border-[#2a3240] shadow-[0_0_50px_rgba(0,0,0,0.8)] w-[680px] overflow-hidden flex flex-col p-8 backdrop-blur-md">

                {/* Header */}
                <h2 className="text-center text-white text-[18px] tracking-widest font-light uppercase mb-8">
                    Select Mission Type
                </h2>

                {/* Mission Type Selection Grid */}
                <div className="flex justify-center gap-6 mb-10">
                    {missionTypes.map((type) => {
                        const isSelected = selectedType === type.id;
                        return (
                            <div
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`
                                    w-[160px] h-[140px] rounded-[8px] flex flex-col items-center justify-center cursor-pointer transition-all border
                                    ${isSelected
                                        ? 'bg-gradient-to-b from-[#1f2937]/50 to-[#ea580c]/10 border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.3)] text-white'
                                        : 'bg-[#1e2532]/50 border-[#374151] hover:border-gray-400 hover:bg-[#252b36]/80 text-gray-400'
                                    }
                                `}
                            >
                                <div className={`transition-transform duration-300 ${isSelected ? 'scale-110' : 'scale-100 opacity-70'}`}>
                                    {type.icon}
                                </div>
                                <span className={`text-[16px] font-medium tracking-wider ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                    {type.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Actions */}
                <div className="flex gap-6 mt-auto">
                    <button
                        onClick={onClose}
                        className="flex-1 hover:from-red-500 hover:to-red-700"
                    >
                        <img src="/src/assets/btn_cancel_mission_2.png" alt="Cancel" />
                    </button>
                    <button
                        onClick={() => onConfirm(selectedType)}
                        className="flex-1 hover:from-orange-400 hover:to-orange-600"
                    >
                        <img src="/src/assets/btn_set_mission.png" alt="Set Mission" />
                    </button>
                </div>

            </div>
        </div>
    );
}
