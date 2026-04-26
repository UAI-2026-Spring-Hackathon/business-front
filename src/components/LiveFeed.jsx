import React, { useEffect, useRef, useMemo } from 'react';

export default function LiveFeed({ transactions, teams }) {
  const listRef = useRef(null);
  const knownIdsRef = useRef(new Set());
  const isInitialLoad = useRef(true);

  // Compute which transaction IDs are genuinely new (not seen before).
  // On the first render we skip all animations so the initial list appears instantly.
  const newIds = useMemo(() => {
    if (isInitialLoad.current) return new Set();
    const result = new Set();
    for (const tx of transactions) {
      if (!knownIdsRef.current.has(tx.id)) result.add(tx.id);
    }
    return result;
  }, [transactions]);

  // After each render, update the known-ID registry and clear the initial-load flag.
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
    knownIdsRef.current = new Set(transactions.map(tx => tx.id));
  }, [transactions]);

  // Only scroll to top when there are genuinely new entries.
  useEffect(() => {
    if (newIds.size > 0 && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [newIds]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--:--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toTimeString().split(' ')[0];
  };

  const getTeamName = (id) => {
    const team = teams?.find(t => t.id === id);
    return team ? team.name : id;
  };

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar font-['Inter'] p-4 space-y-3" ref={listRef}>
      {transactions.length === 0 && (
        <div className="text-zinc-600 text-[10px] text-center py-20 uppercase tracking-[0.3em] font-black italic">
          Waiting for market activity...
        </div>
      )}
      {transactions.map((tx) => {
        const isKU = tx.investor_society === 'KU';
        const isYU = tx.investor_society === 'YU';
        const accentColor = isKU ? 'bg-red-600' : isYU ? 'bg-blue-600' : 'bg-zinc-700';
        const textColor = isKU ? 'text-red-500' : isYU ? 'text-blue-500' : 'text-zinc-400';
        const universityShort = isKU ? 'KU' : isYU ? 'YU' : 'EXT';
        const isNew = newIds.has(tx.id);

        return (
          <div
            key={tx.id}
            className={`bg-zinc-900/40 border border-zinc-800/50 p-4 relative group hover:bg-zinc-900/60 transition-colors ${isNew ? 'animate-slide-in' : ''}`}
          >
            {/* Top Row: Time & Multiplier */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-black text-zinc-600 font-mono tracking-widest">{formatTime(tx.timestamp)}</span>
              {tx.multiplier > 1.0 && (
                <span className="text-[8px] font-black bg-blue-600/20 text-blue-500 px-1.5 py-0.5 rounded-sm italic">
                  STRATEGIC ×{tx.multiplier}
                </span>
              )}
            </div>

            {/* Content Row */}
            <div className="flex items-start space-x-3">
              <div className={`mt-1 w-1.5 h-1.5 rounded-full ${accentColor}`}></div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] leading-relaxed">
                  <span className={`font-black ${textColor} tracking-tight uppercase`}>{universityShort} INVESTOR</span>
                  <span className="text-zinc-500"> ALLOCATED </span>
                  <span className="text-white font-black">{tx.coins} COINS</span>
                  <span className="text-zinc-500"> TO </span>
                  <span className="text-white font-black uppercase tracking-tighter truncate block">{getTeamName(tx.target_team_id)}</span>
                </div>
              </div>
            </div>

            {/* Bottom Progress Indicator */}
            <div className="absolute bottom-0 left-0 h-[1px] bg-zinc-800 w-full"></div>
            <div className={`absolute bottom-0 left-0 h-[1px] ${accentColor} w-0 group-hover:w-full transition-all duration-700`}></div>
          </div>
        );
      })}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-in {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}
