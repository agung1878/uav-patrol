import React from 'react';

/**
 * Build conflict_resolutions array from the preview response.
 * Each conflict item gets a resolution based on its recommended_winner_source.
 */
function buildResolutions(conflicts) {
    return conflicts.map(conflict => {
        const resolution = { candidate_run_at: conflict.candidate_run_at };

        if (conflict.recommended_winner_source === 'candidate') {
            resolution.winner = { source: 'candidate' };
        } else if (conflict.recommended_winner_source === 'existing' && conflict.recommended_winner) {
            resolution.winner = {
                source: 'existing',
                mission_id: conflict.conflicting_occurrences[0]?.mission_id,
                run_at: conflict.conflicting_occurrences[0]?.run_at
            };
        } else {
            // 'manual' or unknown — default to candidate
            resolution.winner = { source: 'candidate' };
        }

        return resolution;
    });
}

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

export default function ConflictDialog({ conflictData, onConfirm, onCancel, isSubmitting }) {
    if (!conflictData) return null;

    const { conflicts = [], minimum_gap_minutes } = conflictData;
    const resolutions = buildResolutions(conflicts);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1c222c] border border-[#2a3240] rounded-2xl shadow-2xl w-[520px] max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in">

                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-[#2a3240]">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-white text-[16px] font-bold">Schedule Conflict Detected</h3>
                            <p className="text-gray-400 text-[11px] mt-0.5">
                                Minimum gap between missions: <span className="text-amber-400 font-semibold">{minimum_gap_minutes} min</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Conflict List */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
                    {conflicts.map((conflict, idx) => (
                        <div key={idx} className="bg-[#242c38] border border-[#3b4452] rounded-xl p-4">
                            {/* Candidate occurrence */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-blue-400" />
                                <span className="text-gray-400 text-[10px] uppercase tracking-wide font-semibold">Your Mission</span>
                            </div>
                            <div className="ml-4 mb-3">
                                <p className="text-white text-[12px] font-mono">
                                    {formatRunAt(conflict.candidate_run_at)}
                                </p>
                                <p className="text-gray-500 text-[10px]">Priority: {conflict.candidate_priority}</p>
                            </div>

                            {/* Conflicting occurrences */}
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                <span className="text-gray-400 text-[10px] uppercase tracking-wide font-semibold">Conflicts With</span>
                            </div>
                            {conflict.conflicting_occurrences.map((occ, oi) => (
                                <div key={oi} className="ml-4 mb-2">
                                    <p className="text-white text-[12px]">
                                        <span className="font-semibold">{occ.mission_name}</span>
                                        <span className="text-gray-400 text-[11px] ml-2 font-mono">{formatRunAt(occ.run_at)}</span>
                                    </p>
                                    <p className="text-gray-500 text-[10px]">Mission #{occ.mission_id} · Priority: {occ.priority}</p>
                                </div>
                            ))}

                            {/* Recommendation */}
                            <div className="mt-3 pt-3 border-t border-[#3b4452]/60 flex items-center gap-2">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span className="text-[11px]">
                                    {conflict.recommended_winner_source === 'candidate' && (
                                        <span className="text-green-400">Recommended: <span className="font-semibold">Your mission wins</span></span>
                                    )}
                                    {conflict.recommended_winner_source === 'existing' && (
                                        <span className="text-amber-400">Recommended: <span className="font-semibold">Existing mission wins</span></span>
                                    )}
                                    {conflict.recommended_winner_source === 'manual' && (
                                        <span className="text-gray-400">Recommendation: <span className="font-semibold">Manual decision needed</span> (will default to your mission)</span>
                                    )}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#2a3240] flex items-center justify-between gap-3">
                    <p className="text-gray-500 text-[10px] flex-1">
                        {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} found. Creating will apply recommended resolutions.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-lg border border-[#3b4452] text-gray-300 text-[12px] font-semibold hover:bg-[#2d3745] transition-colors disabled:opacity-50"
                        >
                            Go Back
                        </button>
                        <button
                            onClick={() => onConfirm(resolutions)}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-lg bg-gradient-to-b from-[#ea580c] to-[#9c3804] text-white text-[12px] font-bold hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Anyway'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { buildResolutions };
