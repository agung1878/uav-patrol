import React from 'react';

export default function AboutPage() {
    return (
        <div
            className="w-full h-[calc(100vh-104px)] overflow-hidden flex items-center justify-center p-[28px]"
            style={{ backgroundImage: `url('/src/assets/img_background.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            <div className="w-full max-w-[1200px] flex items-center justify-between gap-[100px]">

                {/* LEFT SIDE: Logo & Name */}
                <div className="flex flex-col items-center justify-center flex-1">
                    <img
                        src="/src/assets/icon_app.png"
                        alt="UAV Patrol Logo"
                        className="w-[300px] h-[200px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] filter brightness-110"
                    />
                    <h1 className="text-[#ea580c] text-[48px] font-black tracking-[0.15em] uppercase mt-4 text-center select-none" style={{ textShadow: '0px 4px 15px rgba(234, 88, 12, 0.4)' }}>
                        UAV PATROL
                    </h1>
                </div>

                {/* RIGHT SIDE: License Info Pane */}
                <div className="flex-1">
                    <div className="bg-[#151a25]/60 backdrop-blur-md rounded-[16px] border border-[#2a3240] p-10 shadow-[0_15px_50px_rgba(0,0,0,0.6)] w-full max-w-[550px]">
                        <h2 className="text-white text-[28px] font-extralight tracking-widest mb-10 select-none">
                            License
                        </h2>

                        <div className="flex flex-col gap-5">
                            {/* Docking LicenseRow */}
                            <div className="bg-[#1f2937]/50 rounded-[8px] border border-[#374151] px-6 py-4 flex items-center justify-between hover:bg-[#252b36] transition-colors">
                                <span className="text-gray-300 font-medium text-[15px]">Docking</span>
                                <span className="text-white font-bold tracking-wider text-[15px]">2345-2345-2452-3452</span>
                            </div>

                            {/* Drone AI LicenseRow */}
                            <div className="bg-[#1f2937]/50 rounded-[8px] border border-[#374151] px-6 py-4 flex items-center justify-between hover:bg-[#252b36] transition-colors">
                                <span className="text-gray-300 font-medium text-[15px]">Drone AI</span>
                                <span className="text-white font-bold tracking-wider text-[15px]">2345-2345-2452-3452</span>
                            </div>

                            {/* Drone LicenseRow */}
                            <div className="bg-[#1f2937]/50 rounded-[8px] border border-[#374151] px-6 py-4 flex items-center justify-between hover:bg-[#252b36] transition-colors">
                                <span className="text-gray-300 font-medium text-[15px]">Drone</span>
                                <span className="text-white font-bold tracking-wider text-[15px]">2345-2345-2452-3452</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
