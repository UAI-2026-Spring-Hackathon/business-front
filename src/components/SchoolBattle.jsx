import React from 'react';

const SCHOOL_CONFIG = {
  KU: { label: "KOREA UNIVERSITY", short: "KU", color: "bg-ku-red", text: "text-ku-red" },
  YU: { label: "YONSEI UNIVERSITY", short: "YU", color: "bg-yu-blue", text: "text-yu-blue" },
};

export default function SchoolBattle({ teams }) {
  const kuTeams = teams.filter(t => t.society === 'KU');
  const yuTeams = teams.filter(t => t.society === 'YU');

  const kuValuation = kuTeams.reduce((sum, t) => sum + (t.weighted_valuation || 0), 0);
  const yuValuation = yuTeams.reduce((sum, t) => sum + (t.weighted_valuation || 0), 0);

  const kuLiquidity = kuTeams.reduce((sum, t) => sum + (t.total_invested_coins || 0), 0);
  const yuLiquidity = yuTeams.reduce((sum, t) => sum + (t.total_invested_coins || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-auto md:h-64 border-b border-zinc-800">
      {/* Korea University Block */}
      <div className="bg-ku-red p-8 flex flex-col justify-between text-white border-b md:border-b-0 md:border-r border-zinc-800">
        <div>
          <div className="text-[11px] font-bold tracking-[0.3em] opacity-80 uppercase">KOREA UNIVERSITY</div>
          <div className="text-3xl md:text-5xl font-black mt-2 tracking-tighter uppercase">
            VALUATION: {kuValuation.toLocaleString()}
          </div>
        </div>
        <div className="flex justify-between items-end mt-8 md:mt-0">
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-black">{kuLiquidity.toLocaleString()} COINS</span>
            <span className="text-[10px] font-bold opacity-60 uppercase">CURRENT LIQUIDITY</span>
          </div>
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-black">{kuTeams.length}</div>
            <div className="text-[10px] font-bold opacity-60 uppercase">Districts Secured</div>
          </div>
        </div>
      </div>

      {/* Yonsei University Block */}
      <div className="bg-yu-blue p-8 flex flex-col justify-between text-white">
        <div>
          <div className="text-[11px] font-bold tracking-[0.3em] opacity-80 uppercase">YONSEI UNIVERSITY</div>
          <div className="text-3xl md:text-5xl font-black mt-2 tracking-tighter uppercase">
            VALUATION: {yuValuation.toLocaleString()}
          </div>
        </div>
        <div className="flex justify-between items-end mt-8 md:mt-0">
          <div className="flex flex-col">
            <span className="text-2xl md:text-3xl font-black">{yuLiquidity.toLocaleString()} COINS</span>
            <span className="text-[10px] font-bold opacity-60 uppercase">CURRENT LIQUIDITY</span>
          </div>
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-black">{yuTeams.length}</div>
            <div className="text-[10px] font-bold opacity-60 uppercase">Districts Secured</div>
          </div>
        </div>
      </div>
    </div>
  );
}
