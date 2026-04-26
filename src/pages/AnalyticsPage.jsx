import React, { useMemo } from "react";
import { useData } from "../context/DataContext";
import Layout from "../components/Layout";
import ValuationChart from "../components/ValuationChart";

export default function AnalyticsPage() {
  const { teams, timeLeft, totalVolume } = useData();

  const analytics = useMemo(() => {
    if (teams.length === 0) return null;
    
    // Find most strategic team (highest multiplier)
    const teamsWithIndex = teams.map(t => ({
      ...t,
      index: (t.total_invested_coins || 0) > 0 ? (t.weighted_valuation / t.total_invested_coins) : 1
    }));
    
    const mostStrategic = [...teamsWithIndex].sort((a, b) => b.index - a.index)[0];
    const avgIndex = teamsWithIndex.reduce((sum, t) => sum + t.index, 0) / teams.length;
    const totalBonus = teams.reduce((sum, t) => sum + (t.weighted_valuation - (t.total_invested_coins || 0)), 0);

    return { mostStrategic, avgIndex, totalBonus };
  }, [teams]);

  return (
    <Layout totalVolume={totalVolume} timeLeft={timeLeft}>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 md:space-y-12 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="text-[9px] md:text-[10px] font-black text-blue-500 tracking-[0.4em] uppercase mb-2">Statistical Analysis</div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">Market Intelligence</h1>
            <p className="text-zinc-500 text-[10px] md:text-xs font-bold mt-2 uppercase tracking-widest">Comparative valuation metrics & strategic weight analysis</p>
          </div>

          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-zinc-950 border border-zinc-800 p-4 min-w-[120px] md:min-w-[140px]">
                <div className="text-[8px] md:text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">TOTAL BONUS</div>
                <div className="text-lg md:text-xl font-black text-green-500 tracking-tighter">+{analytics.totalBonus.toLocaleString()}</div>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-4 min-w-[120px] md:min-w-[140px]">
                <div className="text-[8px] md:text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">AVG STRAT INDEX</div>
                <div className="text-lg md:text-xl font-black text-blue-500 tracking-tighter">{analytics.avgIndex.toFixed(3)}x</div>
              </div>
              <div className="bg-blue-600 p-4 min-w-[120px] md:min-w-[140px] col-span-2 md:col-span-1">
                <div className="text-[8px] md:text-[9px] font-black text-blue-200 uppercase tracking-widest mb-1">MOST STRATEGIC</div>
                <div className="text-base md:text-lg font-black text-white tracking-tighter uppercase truncate">{analytics.mostStrategic.name}</div>
              </div>
            </div>
          )}
        </header>

        <div className="bg-zinc-950 border border-zinc-800 p-4 md:p-12 shadow-2xl relative overflow-hidden">
          {/* Decorative background scanline */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,24,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.02),rgba(0,255,0,0.02))] bg-[length:100%_4px,3px_100%] pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full -mr-48 -mt-48 pointer-events-none"></div>
          
          <div className="relative z-10 overflow-x-auto">
            <div className="min-w-[600px] md:min-w-0">
              <ValuationChart teams={teams} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
          <div className="bg-zinc-900/20 border border-zinc-800 p-6">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">What is Strategic Index?</h3>
            <p className="text-zinc-500 text-[11px] leading-relaxed uppercase">
              The Strategic Index measures the quality of investment beyond simple student fandom. 
              A score above 1.0 indicates the team has successfully attracted "cross-border" funding 
              from the opposing university's students, granting them a 1.2x valuation multiplier 
              per coin invested.
            </p>
          </div>
          <div className="bg-zinc-900/20 border border-zinc-800 p-6">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Valuation Logic</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-zinc-500">INTERNAL (SAME SCHOOL)</span>
                <span className="text-white">1.0x MULTIPLIER</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-blue-500">STRATEGIC (CROSS SCHOOL)</span>
                <span className="text-blue-500">1.2x MULTIPLIER</span>
              </div>
              <div className="pt-3 border-t border-zinc-800 text-[9px] text-zinc-600">
                FINAL SCORE = (MARKET VALUATION * 0.5) + (JUDGE SCORE * 0.5)
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
      `}} />
    </Layout>
  );
}
