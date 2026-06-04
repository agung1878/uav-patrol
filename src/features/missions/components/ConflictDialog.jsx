import React, { useState, useEffect } from 'react';

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
 * Build conflict_resolutions from user selections.
 */
function buildResolutions(conflicts, selections) {
    return conflicts.map((conflict, idx) => {
        const choice = selections[idx];
        const resolution = { candidate_run_at: conflict.candidate_run_at };

        if (choice === 'candidate') {
            resolution.winner = { source: 'candidate' };
        } else if (choice && choice.startsWith('existing_')) {
            // Parse existing_<mission_id>_<run_at>
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

export default function ConflictDialog({ conflictData, scheduleType, onConfirm, onCancel, isSubmitting }) {
    if (!conflictData) return null;

    const { conflicts = [], minimum_gap_minutes } = conflictData;

    // Per-conflict winner selection state — default to recommended or 'candidate'
    const [selections, setSelections] = useState(() =>
        conflicts.map(c => {
            if (c.recommended_winner_source === 'candidate') return 'candidate';
            if (c.recommended_winner_source === 'existing') {
                // If backend recommended existing, try to use its recommendation, otherwise default to first
                const rec = c.recommended_winner || c.conflicting_occurrences[0];
                return `existing_${rec.mission_id}_${rec.run_at}`;
            }
            return ''; // 'manual' — force user to pick
        })
    );

    const [confirmNoActive, setConfirmNoActive] = useState(false);

    const handleSelect = (idx, value) => {
        setSelections(prev => {
            const next = [...prev];
            next[idx] = value;
            return next;
        });
    };

    // All conflicts must have a selection before confirming
    const allResolved = selections.every(s => s === 'candidate' || s.startsWith('existing_'));

    // Check if one_time mission will have no occurrences left
    const isOneTimeEmpty = scheduleType === 'one_time' && selections.every(s => s.startsWith('existing_'));
    const canConfirm = allResolved && (!isOneTimeEmpty || confirmNoActive);

    // Reset checkbox if they switch back to candidate
    useEffect(() => {
        if (!isOneTimeEmpty) setConfirmNoActive(false);
    }, [isOneTimeEmpty]);

    const handleConfirm = () => {
        const resolutions = buildResolutions(conflicts, selections);
        onConfirm(resolutions);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1c222c] border border-[#2a3240] rounded-2xl shadow-2xl w-[600px] max-h-[85vh] flex flex-col overflow-hidden">

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
                            <h3 className="text-white text-[16px] font-bold">Scheduling conflict detected</h3>
                        </div>
                    </div>
                    <p className="text-gray-400 text-[12px] leading-relaxed mt-2">
                        The new mission conflicts with existing missions at these times. For each candidate run, choose whether the new mission or an existing mission should take precedence. 
                        <br/><span className="text-amber-400 font-semibold">Note:</span> if you pick an existing mission for every occurrence of a one-time mission, creation will fail.
                    </p>
                </div>

                {/* Conflict List */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
                    {conflicts.map((conflict, idx) => {
                        const selected = selections[idx];
                        const isManual = conflict.recommended_winner_source === 'manual';

                        return (
                            <div key={idx} className="bg-[#242c38] border border-[#3b4452] rounded-xl p-4">
                                {/* Header label */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">
                                        Candidate Occurrence: {formatRunAt(conflict.candidate_run_at)}
                                    </span>
                                    {isManual && !selected && (
                                        <span className="text-amber-400 text-[10px] font-semibold animate-pulse">
                                            ← Choose a winner
                                        </span>
                                    )}
                                </div>

                                {/* Option A: New mission wins */}
                                <label
                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all mb-2 ${
                                        selected === 'candidate'
                                            ? 'border-blue-500/60 bg-blue-500/10'
                                            : 'border-[#3b4452]/60 hover:border-[#3b4452] hover:bg-[#2d3745]/50'
                                    }`}
                                    onClick={() => handleSelect(idx, 'candidate')}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                                        selected === 'candidate' ? 'border-blue-400' : 'border-gray-500'
                                    }`}>
                                        {selected === 'candidate' && (
                                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-blue-400 text-[12px] font-bold tracking-wide">Keep this new mission (candidate wins)</span>
                                            {conflict.recommended_winner_source === 'candidate' && (
                                                <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-semibold">RECOMMENDED</span>
                                            )}
                                        </div>
                                    </div>
                                </label>

                                {/* Option B: Existing mission wins */}
                                {conflict.conflicting_occurrences.map((occ, oi) => {
                                    const occValue = `existing_${occ.mission_id}_${occ.run_at}`;
                                    return (
                                        <label
                                            key={oi}
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                                selected === occValue
                                                    ? 'border-amber-500/60 bg-amber-500/10'
                                                    : 'border-[#3b4452]/60 hover:border-[#3b4452] hover:bg-[#2d3745]/50'
                                            }`}
                                            onClick={() => handleSelect(idx, occValue)}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors ${
                                                selected === occValue ? 'border-amber-400' : 'border-gray-500'
                                            }`}>
                                                {selected === occValue && (
                                                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-amber-400 text-[12px] font-bold tracking-wide">Use existing mission #{occ.mission_id} (existing wins)</span>
                                                    {conflict.recommended_winner_source === 'existing' && (
                                                        <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-semibold">RECOMMENDED</span>
                                                    )}
                                                </div>
                                                <p className="text-white text-[12px]">
                                                    <span className="font-semibold">{occ.mission_name}</span>
                                                    <span className="text-gray-400 ml-2 font-mono text-[11px]">{formatRunAt(occ.run_at)}</span>
                                                </p>
                                                <p className="text-gray-500 text-[10px] mt-0.5">Priority: {occ.priority}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>

                {/* Warning for one_time empty */}
                {isOneTimeEmpty && (
                    <div className="px-6 py-3 bg-red-950/30 border-t border-red-900/50">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={confirmNoActive}
                                onChange={(e) => setConfirmNoActive(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500 focus:ring-offset-gray-800"
                            />
                            <p className="text-red-400 text-[12px] leading-snug">
                                <span className="font-bold">Warning:</span> If you choose an existing mission as winner for every occurrence, this new mission will have no active runs and creation will be blocked (or saved but inactive).
                                <br />
                                <span className="text-white font-semibold mt-1 inline-block">Also confirm saving mission without any active occurrences</span>
                            </p>
                        </label>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#2a3240] flex items-center justify-between gap-3 bg-[#181d25]">
                    <p className="text-gray-500 text-[10px] flex-1">
                        {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} found.
                        {!allResolved && <span className="text-amber-400 ml-1">Resolve all conflicts to continue.</span>}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 rounded-lg border border-[#3b4452] text-gray-300 text-[12px] font-semibold hover:bg-[#2d3745] transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSubmitting || !canConfirm}
                            className={`px-5 py-2.5 rounded-lg text-white text-[12px] font-bold transition-all flex items-center gap-2 ${
                                canConfirm 
                                    ? 'bg-gradient-to-b from-[#ea580c] to-[#9c3804] hover:brightness-110 active:scale-[0.98]' 
                                    : 'bg-[#3b4452] text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save mission and conflict resolutions'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { buildResolutions };
