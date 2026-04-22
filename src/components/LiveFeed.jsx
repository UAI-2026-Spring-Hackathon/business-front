import React, { useEffect, useRef } from 'react';

export default function LiveFeed({ transactions, teams }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [transactions]);

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

        return (
          <div 
            key={tx.id} 
            className="bg-zinc-900/40 border border-zinc-800/50 p-4 relative group animate-slide-in hover:bg-zinc-900/60 transition-colors"
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
              <div className={`mt-1 w-1.5 h-1.5 rounded-full ${accentColor} shadow-[0_0_8px_${isKU ? 'rgba(220,38,38,0.5)' : 'rgba(37,99,235,0.5)'}]`}></div>
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

            {/* Bottom Progress Indicator (Visual Fluff) */}
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
