import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

export default function ValuationChart({ teams }) {
  // 가중치 분석을 위한 데이터 가공
  const data = teams.map((t) => {
    const raw = t.total_invested_coins || 0;
    const weighted = t.weighted_valuation || 0;
    const bonus = Math.max(0, weighted - raw);
    const strategicIndex = raw > 0 ? (weighted / raw).toFixed(2) : "1.00";

    return {
      name: t.name || t.id,
      base: raw,
      bonus: bonus,
      total: weighted,
      index: strategicIndex,
      society: t.society,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-950 border border-zinc-800 p-4 shadow-2xl">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{label}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-8 items-center">
              <span className="text-[9px] font-bold text-zinc-400 uppercase">BASE VALUE</span>
              <span className="text-sm font-black text-white">{data.base.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-8 items-center">
              <span className="text-[9px] font-bold text-green-500 uppercase">STRATEGIC BONUS</span>
              <span className="text-sm font-black text-green-500">+{data.bonus.toLocaleString()}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-zinc-800 flex justify-between gap-8 items-center">
              <span className="text-[10px] font-black text-blue-500 uppercase">TOTAL WEIGHTED</span>
              <span className="text-lg font-black text-white">{data.total.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 bg-blue-600/10 px-2 py-1 text-center">
            <span className="text-[9px] font-black text-blue-400 uppercase">STRATEGIC INDEX: {data.index}x</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12">
      {/* Chart Section */}
      <div className="h-[500px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 60, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={140} 
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#71717a", fontSize: 10, fontWeight: 900 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Legend 
              verticalAlign="top" 
              align="right"
              iconType="square"
              formatter={(value) => <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mr-4">{value}</span>}
            />
            {/* Base Value Bar */}
            <Bar dataKey="base" name="Base Investment" stackId="a" fill="#27272a" radius={[0, 0, 0, 0]} barSize={24} />
            {/* Bonus Value Bar */}
            <Bar dataKey="bonus" name="Strategic Bonus" stackId="a" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={24}>
              {data.map((entry, i) => (
                <Cell 
                  key={i} 
                  fill={entry.society === 'KU' ? '#dc2626' : entry.society === 'YU' ? '#2563eb' : '#3f3f46'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Intelligence Grid */}
      <div className="grid grid-cols-1 gap-4">
        <div className="flex px-6 py-3 text-[9px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-800">
          <div className="w-12">RANK</div>
          <div className="flex-1">TEAM / DISTRICT</div>
          <div className="w-32 text-right">BASE VAL</div>
          <div className="w-32 text-right">STRATEGIC BONUS</div>
          <div className="w-32 text-right">TOTAL (WEIGHTED)</div>
          <div className="w-24 text-right">INDEX</div>
        </div>
        
        {data.map((team, i) => (
          <div key={team.name} className="flex items-center px-6 py-4 bg-zinc-900/20 border border-zinc-800/50 hover:bg-zinc-900/40 hover:border-zinc-700 transition-all group">
            <div className="w-12 text-lg font-black text-zinc-700 italic group-hover:text-blue-500 transition-colors">
              {String(i + 1).padStart(2, '0')}
            </div>
            
            <div className="flex-1">
              <div className="text-sm font-black text-white uppercase tracking-tighter">{team.name}</div>
              <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{team.society || 'EXTERNAL'} DISTRICT</div>
            </div>

            <div className="w-32 text-right text-[11px] font-bold text-zinc-400">
              {team.base.toLocaleString()}
            </div>

            <div className="w-32 text-right text-[11px] font-black text-green-500">
              +{team.bonus.toLocaleString()}
            </div>

            <div className="w-32 text-right text-base font-black text-white tracking-tighter italic">
              {team.total.toLocaleString()}
            </div>

            <div className="w-24 text-right">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm ${
                parseFloat(team.index) > 1.1 ? 'bg-blue-600/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {team.index}x
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
