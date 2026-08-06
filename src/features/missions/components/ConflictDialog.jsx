import React from 'react';

/**
 * Format an RFC3339 timestamp into a readable date/time string.
 */
function formatRunAt(isoString) {
    try {
        const d = new Date(isoString);
        return d.toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    } catch {
        return isoString;
    }
}

/**
 * Build conflict_resolutions from user selections. (Kept for backward compatibility)
 */
function buildResolutions(conflicts, selections) {
    return conflicts.map((conflict, idx) => {
        const choice = selections[idx];
        const resolution = { candidate_run_at: conflict.candidate_run_at };

        if (choice === 'candidate') {
            resolution.winner = { source: 'candidate' };
        } else if (choice && choice.startsWith('existing_')) {
            const parts = choice.split('_');
            const missionId = parseInt(parts[1], 10);
            const runAt = parts.slice(2).join('_');
            
            resolution.winner = {
                source: 'existing',
                mission_id: missionId,
                run_at: runAt
            };
        }

        return resolution;
    });
}

export default function ConflictDialog({ conflictData, scheduleType, newMissionName, onConfirm, onCancel, isSubmitting }) {
    if (!conflictData) return null;

    const { conflicts = [] } = conflictData;

    const handleConfirm = () => {
        // "Replace existing mission" means candidate wins for all conflicts
        const resolutions = conflicts.map(conflict => ({
            candidate_run_at: conflict.candidate_run_at,
            winner: { source: 'candidate' }
        }));
        onConfirm(resolutions);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1c222c] border border-[#2a3240] rounded-2xl shadow-2xl w-[500px] flex flex-col overflow-hidden max-h-[85vh]">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-[#2a3240]">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-white text-[16px] font-bold">Scheduling Conflict Detected</h3>
                        </div>
                    </div>
                    <p className="text-gray-400 text-[13px] leading-relaxed">
                        The new mission <span className="text-white font-semibold">"{newMissionName || 'New Mission'}"</span> conflicts with existing scheduled missions. Would you like to replace the existing mission(s) with this new mission?
                    </p>
                </div>

                {/* Conflict Details List */}
                <div className="px-6 py-4 overflow-y-auto space-y-3 bg-[#181d25]/50 custom-scrollbar">
                    <p className="text-gray-400 text-[11px] uppercase tracking-wider font-bold mb-2">Missions to be replaced:</p>
                    {conflicts.map((conflict, idx) => (
                        <div key={idx} className="bg-[#242c38] border border-[#3b4452] rounded-xl p-3">
                            <p className="text-gray-300 text-[11px] font-semibold mb-2 flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                Conflict at {formatRunAt(conflict.candidate_run_at)}
                            </p>
                            <div className="flex flex-col gap-1.5 pl-5">
                                {conflict.conflicting_occurrences.map((occ, j) => (
                                    <div key={j} className="flex items-center gap-2 text-[12px] bg-[#1c222c] px-3 py-2 rounded-lg border border-[#2a3240]">
                                        <span className="text-amber-400 font-bold tracking-wide">Replaces:</span>
                                        <span className="text-white font-semibold truncate flex-1">{occ.mission_name}</span>
                                        <span className="text-gray-500 font-mono text-[10px]">ID: {occ.mission_id}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 flex items-center justify-end gap-3 bg-[#181d25] border-t border-[#2a3240]">
                    <button
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-lg border border-[#3b4452] text-gray-300 text-[12px] font-semibold hover:bg-[#2d3745] transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 rounded-lg bg-gradient-to-b from-[#ea580c] to-[#9c3804] text-white text-[12px] font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Replacing...
                            </>
                        ) : (
                            'Replace Existing Mission'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export { buildResolutions };
