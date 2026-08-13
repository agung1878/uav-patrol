import React, { useState, useEffect, useRef } from 'react';

// --- Icons ---
const PowerIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
);

const DoorIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <path d="M9 12h-2" />
        <path d="M17 12h-2" />
    </svg>
);

const LifterIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 5v14" />
        <path d="M19 12l-7 7-7-7" />
        <path d="M19 5l-7-7-7 7" />
    </svg>
);

const CenterIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 12h16" />
        <path d="M16 8l4 4-4 4" />
        <path d="M8 8l-4 4 4 4" />
    </svg>
);

const ACIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

const ChargeIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
        <line x1="22" y1="11" x2="22" y2="13" />
        <polygon points="11 7 8 12 12 12 10 17 14 12 10 12 11 7" />
    </svg>
);

const ArrowUpIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
    </svg>
);

const ArrowDownIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 5v14" />
        <path d="M19 12l-7 7-7-7" />
    </svg>
);

const ArrowLeftIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
    </svg>
);

const ArrowRightIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14" />
        <path d="M12 5l7 7-7 7" />
    </svg>
);

export default function DockingPanelPage() {
    const [logs, setLogs] = useState([
        { time: '15.40.30', text: 'Executing manual system synchronization', isSys: true },
        { time: '15.42.30', text: 'System dashboard Initialized. API Ready', isSys: true },
        { time: '16.40.30', text: 'Error system not Detected', isError: true },
        { time: '16.40.30', text: 'System drone management Initialized. API Ready to deploy', isSys: true }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const terminalRef = useRef(null);

    // Local UI States for toggles
    const [powerState, setPowerState] = useState('on');
    const [doorState, setDoorState] = useState('open');
    const [acState, setAcState] = useState(true);
    const [chargingState, setChargingState] = useState(false);

    const handleAction = async (actionName) => {
        setIsLoading(true);
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;

        let endpoint = '';
        let method = 'POST';

        switch (actionName) {
            case 'start_charging': endpoint = '/drone/charge/start'; break;
            case 'emergency_stop': endpoint = '/drone/charge/stop'; break;
            case 'roof_open': endpoint = '/docking/roof/open'; break;
            case 'roof_close': endpoint = '/docking/roof/close'; break;
            case 'roof_stop': endpoint = '/docking/roof/stop'; break;
            case 'lifter_up': endpoint = '/docking/lifter/up'; break;
            case 'lifter_down': endpoint = '/docking/lifter/down'; break;
            case 'lifter_stop': endpoint = '/docking/lifter/stop'; break;
            case 'centering_estop': endpoint = '/docking/centering/stop'; break;
            case 'right_motor_in': endpoint = '/docking/centering/right-in'; break;
            case 'right_motor_out': endpoint = '/docking/centering/right-out'; break;
            case 'left_motor_in': endpoint = '/docking/centering/left-in'; break;
            case 'left_motor_out': endpoint = '/docking/centering/left-out'; break;
            case 'hvac_pwr_on': endpoint = '/ac/power?state=ON'; break;
            case 'hvac_pwr_off': endpoint = '/ac/power?state=OFF'; break;
            case 'psu_enable': endpoint = '/docking/psu/on'; break;
            case 'psu_disable': endpoint = '/docking/psu/off'; break;
            default:
                console.warn(`Unknown action: ${actionName}`);
                setIsLoading(false);
                return;
        }

        setLogs(prev => [...prev, { time: timeStr, text: `Executing ${method} ${endpoint}...`, isSys: true }]);

        let timeoutMs = 25000;
        if (['roof_open', 'roof_close', 'lifter_up', 'lifter_down'].includes(actionName)) {
            timeoutMs = 60000;
        } else if (['right_motor_in', 'right_motor_out', 'left_motor_in', 'left_motor_out'].includes(actionName)) {
            timeoutMs = 30000;
        }

        try {
            const url = import.meta.env.VITE_API_BASE_URL_DOCKING || 'http://api-docking.kumalabs.tech';

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(`${url}${endpoint}`, {
                method,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json().catch(() => ({}));
            const endNow = new Date();
            const timeStrSuccess = `${String(endNow.getHours()).padStart(2, '0')}.${String(endNow.getMinutes()).padStart(2, '0')}.${String(endNow.getSeconds()).padStart(2, '0')}`;

            if (response.ok) {
                setLogs(prev => [...prev, {
                    time: timeStrSuccess,
                    text: `Success: ${endpoint} executed.`,
                    raw: data,
                    isSys: true
                }]);
            } else {
                setLogs(prev => [...prev, {
                    time: timeStrSuccess,
                    text: `Error: ${response.status} ${response.statusText}`,
                    raw: data,
                    isError: true
                }]);
            }
        } catch (error) {
            const errNow = new Date();
            const errTimeStr = `${String(errNow.getHours()).padStart(2, '0')}.${String(errNow.getMinutes()).padStart(2, '0')}.${String(errNow.getSeconds()).padStart(2, '0')}`;
            setLogs(prev => [...prev, {
                time: errTimeStr,
                text: error.name === 'AbortError' ? `Timeout Error: Request exceeded ${timeoutMs / 1000}s` : `Error system not Detected: ${error.message}`,
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="p-8 w-full h-[calc(100vh-104px)] overflow-hidden flex justify-center font-sans bg-[#111319] text-gray-200">
            <div className="w-full max-w-[1400px] h-full flex gap-6 overflow-hidden">

                {/* LEFT COLUMN */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-8">

                    {/* POWER */}
                    <div className={`p-6 rounded-2xl flex items-center justify-between border shadow-lg transition-all ${powerState === 'on' ? 'bg-[#151c20] border-emerald-500/20' : 'bg-[#1c1516] border-red-500/20'}`}>
                        <div className="flex items-center gap-4">
                            <PowerIcon className={`w-8 h-8 ${powerState === 'on' ? 'text-emerald-400' : 'text-red-400'}`} />
                            <h2 className="text-3xl font-bold tracking-wide">Power</h2>
                        </div>
                        <div className="flex gap-3 bg-[#1e232e] p-1.5 rounded-lg border border-[#2a303c]">
                            <button
                                onClick={() => { setPowerState('on'); handleAction('psu_enable'); }}
                                className={`px-10 py-2.5 rounded-md font-bold text-sm tracking-widest transition-all ${powerState === 'on' ? 'bg-emerald-400 text-black shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'text-gray-400 hover:text-white'}`}
                            >
                                On
                            </button>
                            <button
                                onClick={() => { setPowerState('off'); handleAction('psu_disable'); }}
                                className={`px-10 py-2.5 rounded-md font-bold text-sm tracking-widest transition-all ${powerState === 'off' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-gray-400 hover:text-white'}`}
                            >
                                Off
                            </button>
                        </div>
                    </div>

                    {/* DOCKING MECHANICS */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-gray-100 tracking-wide pl-1">Docking Mechanics</h3>
                        <div className="bg-[#1a1d24] border border-[#262b36] rounded-2xl p-6 flex flex-col gap-6 shadow-xl">

                            {/* Door Docking */}
                            <div className="bg-[#1d222b] border border-[#2a2f3a] rounded-xl p-5 flex items-center justify-between shadow-inner">
                                <div className="flex items-center gap-3">
                                    <DoorIcon className="w-5 h-5 text-gray-400" />
                                    <span className="font-bold text-[15px] tracking-wide">Door Docking</span>
                                </div>
                                <div className="flex bg-[#14171d] border border-[#1e232e] rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => { setDoorState('open'); handleAction('roof_open'); }}
                                        className={`px-6 py-2.5 font-bold text-xs tracking-wider transition-all ${doorState === 'open' ? 'bg-[#f39c12] text-black shadow-[0_0_10px_rgba(243,156,18,0.3)]' : 'text-gray-400 hover:bg-[#1a1d24]'}`}
                                    >
                                        Open
                                    </button>
                                    <button
                                        onClick={() => { setDoorState('stop'); handleAction('roof_stop'); }}
                                        className={`px-6 py-2.5 font-bold text-xs tracking-wider transition-all ${doorState === 'stop' ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-gray-400 hover:bg-[#1a1d24]'}`}
                                    >
                                        Stop
                                    </button>
                                    <button
                                        onClick={() => { setDoorState('close'); handleAction('roof_close'); }}
                                        className={`px-6 py-2.5 font-bold text-xs tracking-wider transition-all ${doorState === 'close' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-[#1a1d24]'}`}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            {/* Lifter */}
                            <div className="bg-[#1d222b] border border-[#2a2f3a] rounded-xl p-5 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <ArrowUpIcon className="w-5 h-5 text-gray-400" />
                                        <span className="font-bold text-[15px] tracking-wide">Lifter</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAction('lifter_up')} className="w-10 h-10 bg-[#252a35] hover:bg-[#2a303d] border border-[#313745] rounded-lg flex items-center justify-center transition-all">
                                            <ArrowUpIcon className="w-4 h-4 text-gray-300" />
                                        </button>
                                        <button onClick={() => handleAction('lifter_stop')} className="w-10 h-10 bg-[#252a35] hover:bg-[#2a303d] border border-[#313745] rounded-lg flex items-center justify-center transition-all group">
                                            <div className="w-3.5 h-3.5 border-2 border-red-500 rounded-sm group-hover:bg-red-500/20 transition-all"></div>
                                        </button>
                                        <button onClick={() => handleAction('lifter_down')} className="w-10 h-10 bg-[#252a35] hover:bg-[#2a303d] border border-[#313745] rounded-lg flex items-center justify-center transition-all">
                                            <ArrowDownIcon className="w-4 h-4 text-gray-300" />
                                        </button>
                                    </div>
                                </div>
                                {/* Lift Position Progress Bar Commented Out
                                <div className="flex items-center gap-4 mt-4">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider shrink-0">Lift position</span>
                                    <div className="flex-1 h-2 bg-[#111319] rounded-full overflow-hidden border border-[#2a2f3a]">
                                        <div className="h-full bg-blue-400/60 w-[42%] rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold tracking-wider">42%</span>
                                </div>
                                */}
                            </div>

                            {/* Centering Motors */}
                            <div className="bg-[#1d222b] border border-[#2a2f3a] rounded-xl p-5 shadow-inner">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <CenterIcon className="w-5 h-5 text-gray-400" />
                                        <span className="font-bold text-[15px] tracking-wide">Centering System</span>
                                    </div>
                                    <button onClick={() => handleAction('centering_estop')} className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-500 rounded-lg text-xs font-bold tracking-wider transition-all">
                                        ESTOP ALL
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#14171d] border border-[#1e232e] rounded-lg p-3">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 text-center">Left Motor</div>
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => handleAction('left_motor_in')} className="flex-1 py-2 bg-[#252a35] hover:bg-[#2a303d] border border-[#313745] rounded flex justify-center transition-all">IN</button>
                                            <button onClick={() => handleAction('left_motor_out')} className="flex-1 py-2 bg-[#252a35] hover:bg-[#2a303d] border border-[#313745] rounded flex justify-center transition-all">OUT</button>
                                        </div>
                                    </div>
                                    <div className="bg-[#14171d] border border-[#1e232e] rounded-lg p-3">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 text-center">Right Motor</div>
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => handleAction('right_motor_in')} className="flex-1 py-2 bg-[#252a35] hover:bg-[#2a303d] border border-[#313745] rounded flex justify-center transition-all">IN</button>
                                            <button onClick={() => handleAction('right_motor_out')} className="flex-1 py-2 bg-[#252a35] hover:bg-[#2a303d] border border-[#313745] rounded flex justify-center transition-all">OUT</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* POWER & ENVIRONMENT */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-gray-100 tracking-wide pl-1">Power & Environment</h3>
                        <div className="bg-[#1a1d24] border border-[#262b36] rounded-2xl p-6 shadow-xl grid grid-cols-2 gap-6">

                            {/* AC */}
                            <div className="bg-[#1d222b] border border-[#2a2f3a] rounded-xl p-5 flex flex-col justify-between shadow-inner h-[120px]">
                                <div className="flex items-center gap-3">
                                    <ACIcon className="w-4 h-4 text-gray-400" />
                                    <span className="font-bold text-[14px] tracking-wide">Air Conditioner (AC)</span>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2 mt-4">
                                        <button
                                            onClick={() => { setAcState(!acState); handleAction(acState ? 'hvac_pwr_off' : 'hvac_pwr_on'); }}
                                            className={`relative w-[48px] h-[24px] rounded-full transition-colors duration-300 ${acState ? 'bg-[#34D399]' : 'bg-[#3A4150]'}`}
                                        >
                                            <div className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full shadow transition-transform duration-300 ${acState ? 'translate-x-[24px]' : 'translate-x-0'}`}></div>
                                        </button>
                                        <span className={`text-[11px] font-bold tracking-widest uppercase ${acState ? 'text-emerald-400' : 'text-gray-500'}`}>{acState ? 'ON' : 'OFF'}</span>
                                    </div>
                                    <div className="text-[9px] text-gray-500 leading-tight">ⓘ Controls the cabin air conditioning system. Adjusts temperature automatically.</div>
                                </div>
                            </div>

                            {/* Charging */}
                            <div className="bg-[#1d222b] border border-[#2a2f3a] rounded-xl p-5 flex flex-col justify-between shadow-inner h-[120px]">
                                <div className="flex items-center gap-3">
                                    <ChargeIcon className="w-4 h-4 text-gray-400" />
                                    <span className="font-bold text-[14px] tracking-wide">Charging</span>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2 mt-4">
                                        <button
                                            onClick={() => { setChargingState(!chargingState); handleAction(chargingState ? 'emergency_stop' : 'start_charging'); }}
                                            className={`relative w-[48px] h-[24px] rounded-full transition-colors duration-300 ${chargingState ? 'bg-[#34D399]' : 'bg-[#3A4150]'}`}
                                        >
                                            <div className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full shadow transition-transform duration-300 ${chargingState ? 'translate-x-[24px]' : 'translate-x-0'}`}></div>
                                        </button>
                                        <span className={`text-[11px] font-bold tracking-widest uppercase ${chargingState ? 'text-emerald-400' : 'text-red-400'}`}>{chargingState ? 'ON' : 'OFF'}</span>
                                    </div>
                                    <div className="text-[9px] text-gray-500 leading-tight">ⓘ Manages vehicle battery charging. Toggle to start or stop charging session.</div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN - Raw Response */}
                <div className="w-[420px] shrink-0 bg-[#1a1d24] border border-[#262b36] rounded-2xl flex flex-col shadow-xl">
                    <div className="px-6 py-5 flex justify-between items-center border-b border-[#262b36]">
                        <h3 className="font-bold text-gray-100 tracking-wide text-lg">Raw Response</h3>
                        <button onClick={() => setLogs([])} className="text-xs font-bold text-gray-400 hover:text-white transition-colors tracking-wide">
                            Clear
                        </button>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-mono text-[11px] leading-[1.6]" ref={terminalRef}>
                        {logs.length === 0 ? (
                            <div className="text-gray-600 italic">No output...</div>
                        ) : (
                            logs.map((log, i) => (
                                <div key={i} className="mb-2.5 break-words">
                                    <span className="text-gray-500 mr-3">[{log.time}]</span>
                                    <span className={log.isError ? 'text-red-400' : (log.isSys ? 'text-emerald-400/90' : 'text-gray-300')}>
                                        {log.text}
                                    </span>
                                    {log.raw && (
                                        <div className="pl-[72px] mt-1 text-gray-500 text-[10px]">
                                            {JSON.stringify(log.raw)}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
