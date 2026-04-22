import React, { useState } from "react";
import { useData } from "../context/DataContext";
import Layout from "../components/Layout";
import LiveFeed from "../components/LiveFeed";
import SchoolBattle from "../components/SchoolBattle";
import TeamGrid from "../components/TeamGrid";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export default function Dashboard() {
  const { teams, transactions, settlement, timeLeft, totalVolume } = useData();

  return (
    <Layout 
      totalVolume={totalVolume} 
      timeLeft={timeLeft} 
    >
      <div className="grid grid-cols-1 md:grid-cols-12 h-full">
        {/* Left Side: Dashboard Grid (Col 1-9) */}
        <div className="md:col-span-9 border-r border-zinc-800">
          {/* Settlement Results (if available) */}
          {settlement && (
            <div className="bg-tertiary p-8 text-on-tertiary border-b border-zinc-800">
              <div className="text-[11px] font-bold tracking-[0.3em] opacity-80 uppercase mb-2">FINAL SETTLEMENT RANKINGS</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {settlement.rankings.slice(0, 3).map((rank, i) => (
                  <div key={rank.team_id} className="border-l-2 border-on-tertiary pl-4">
                    <div className="text-xs font-bold opacity-60 uppercase">RANK {i + 1}</div>
                    <div className="text-2xl font-black">{rank.team_name}</div>
                    <div className="text-sm font-bold mt-1">
                      TOTAL: {rank.total_score} pt 
                      <span className="mx-2 opacity-40">|</span>
                      MARKET: {rank.market_score} 
                      <span className="mx-2 opacity-40">|</span>
                      JUDGE: {rank.judge_score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* University Headline Blocks */}
          <SchoolBattle teams={teams} />
          
          {/* Electoral Districts Grid */}
          <TeamGrid teams={teams} />
        </div>

        {/* Right Side: Sidebar Ticker (Col 10-12) */}
        <aside className="md:col-span-3 bg-zinc-950 flex flex-col h-full border-t md:border-t-0 border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-800">
            <h3 className="font-['Inter'] text-xs font-black uppercase tracking-[0.2em] text-zinc-500">LIVE TRADE TICKER</h3>
          </div>
          
          <LiveFeed 
            transactions={transactions.slice(0, 20)} 
            teams={teams}
          />
          
          <div className="p-6 bg-zinc-900/50 border-t border-zinc-800 mt-auto">
            <button 
              className="w-full bg-blue-600 text-white font-black py-4 uppercase text-xs tracking-widest hover:bg-transparent hover:border-2 hover:border-blue-600 transition-all"
              onClick={() => window.open('/invest', '_blank')}
            >
              INITIATE INVESTMENT
            </button>
          </div>
        </aside>
      </div>
    </Layout>
  );
}
