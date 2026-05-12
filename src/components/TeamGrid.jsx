import React from 'react';

export default function TeamGrid({ teams }) {
  return (
    <div className="p-base md:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h2 className="font-['Inter'] text-xl sm:text-2xl font-black uppercase tracking-tighter">TEAM PERFORMANCE</h2>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-ku-red"></div>
            <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">KU TEAMS</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yu-blue"></div>
            <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">YU TEAMS</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter bg-zinc-800 border border-zinc-800">
        {teams.map((team, index) => {
          const isKU = team.society === 'KU';
          const isYU = team.society === 'YU';
          
          // Use varying shades of red/blue based on index to match reference feel
          const kuColors = ['bg-red-600', 'bg-red-700', 'bg-red-800', 'bg-red-900', 'bg-red-500'];
          const yuColors = ['bg-blue-600', 'bg-blue-700', 'bg-blue-800', 'bg-blue-900', 'bg-blue-500'];
          
          const bgColor = isKU 
            ? kuColors[index % kuColors.length] 
            : isYU 
              ? yuColors[index % yuColors.length] 
              : 'bg-zinc-700';

          return (
            <div key={team.id} className={`${bgColor} p-6 flex flex-col justify-between aspect-square text-white`}>
              <div>
                <div className="text-[10px] font-black opacity-60 uppercase">
                  {team.society ? `${team.society} - DISTRICT ${String(index + 1).padStart(2, '0')}` : `DISTRICT ${String(index + 1).padStart(2, '0')}`}
                </div>
                <div className="text-xl font-black leading-tight mt-1 wrap-break-word">
                  {team.name || team.id}
                </div>
                {/* User mentioned society is just metadata, so maybe show it here if it's not the same as the main battle ID */}
                {team.society_name && (
                  <div className="text-[9px] font-bold mt-1 opacity-80 uppercase">
                    {team.society_name}
                  </div>
                )}
              </div>
              <div className="text-2xl font-black">
                {(team.weighted_valuation || 0).toLocaleString()}
              </div>
            </div>
          );
        })}
        {/* Placeholder for unassigned slots if needed to fill the grid, matching the reference */}
        {teams.length < 4 && Array.from({ length: 4 - teams.length }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-zinc-700 p-6 flex flex-col justify-between aspect-square text-zinc-400">
            <div>
              <div className="text-[10px] font-black opacity-60 uppercase">UNASSIGNED</div>
              <div className="text-xl font-black leading-tight mt-1">EMPTY SLOT</div>
            </div>
            <div className="text-2xl font-black">0</div>
          </div>
        ))}
      </div>
    </div>
  );
}
