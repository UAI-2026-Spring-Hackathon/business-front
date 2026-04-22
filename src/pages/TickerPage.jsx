import React, { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import Layout from "../components/Layout";

export default function TickerPage() {
  const { transactions, timeLeft, totalVolume } = useData();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchFilter = filter === "ALL" || tx.investor_society === filter;
      const matchSearch = tx.target_team_id?.toLowerCase().includes(search.toLowerCase()) || 
                          tx.target_society?.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [transactions, filter, search]);

  const stats = useMemo(() => {
    const totalCount = filteredTransactions.length;
    const maxTrade = totalCount > 0 ? Math.max(...filteredTransactions.map(t => t.coins)) : 0;
    const kuVolume = transactions.filter(t => t.investor_society === 'KU').reduce((sum, t) => sum + t.coins, 0);
    const yuVolume = transactions.filter(t => t.investor_society === 'YU').reduce((sum, t) => sum + t.coins, 0);
    
    return { totalCount, maxTrade, kuVolume, yuVolume };
  }, [filteredTransactions, transactions]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--:--';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour12: false });
  };

  return (
    <Layout totalVolume={totalVolume} timeLeft={timeLeft}>
      <div className="flex flex-col h-full bg-[#0d0d0f]">
        <header className="p-8 border-b border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="text-[10px] font-black text-blue-500 tracking-[0.4em] uppercase mb-2">Real-time Transmission</div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Market Ticker</h1>
            <p className="text-zinc-500 text-xs font-bold mt-2 uppercase tracking-widest">Live transaction log of all academic funding activities</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="TOTAL TRADES" value={stats.totalCount} />
            <StatBox label="MAX VOLUME" value={stats.maxTrade.toLocaleString()} />
            <StatBox label="KU FLOW" value={stats.kuVolume.toLocaleString()} color="text-red-500" />
            <StatBox label="YU FLOW" value={stats.yuVolume.toLocaleString()} color="text-blue-500" />
          </div>
        </header>

        {/* Controls */}
        <div className="bg-zinc-900/50 p-4 border-b border-zinc-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex bg-zinc-950 border border-zinc-800 p-1">
            {["ALL", "KU", "YU"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-1.5 text-[10px] font-black tracking-widest transition-all ${
                  filter === f ? "bg-blue-600 text-white" : "text-zinc-600 hover:text-zinc-400"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <div className="relative w-full md:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-sm">search</span>
            <input
              type="text"
              placeholder="SEARCH BY TEAM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-white pl-10 pr-4 py-2 text-[10px] font-bold tracking-widest focus:outline-none focus:border-blue-600 transition-colors uppercase"
            />
          </div>
        </div>

        {/* Ticker Table */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="grid grid-cols-6 bg-zinc-950 px-8 py-3 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] border-b border-zinc-800">
            <div className="col-span-1">TIMESTAMP</div>
            <div className="col-span-1">ORIGIN</div>
            <div className="col-span-2">TRANSACTION DETAILS</div>
            <div className="col-span-1 text-right">VOLUME</div>
            <div className="col-span-1 text-right">BOOST</div>
          </div>
          
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredTransactions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-700 text-xs font-bold uppercase tracking-[0.3em]">
                No matching transmissions detected
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <div key={tx.id} className="grid grid-cols-6 px-8 py-4 border-b border-zinc-900/50 hover:bg-white/[0.02] transition-colors items-center group">
                  <div className="col-span-1 text-[11px] font-mono text-zinc-500">{formatTime(tx.timestamp)}</div>
                  <div className="col-span-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm ${
                      tx.investor_society === 'KU' ? 'bg-red-600/10 text-red-500' : 
                      tx.investor_society === 'YU' ? 'bg-blue-600/10 text-blue-500' : 
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {tx.investor_society || 'EXT'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[11px] font-bold text-white uppercase group-hover:text-blue-400 transition-colors">
                      {tx.target_team_id}
                    </div>
                    <div className="text-[9px] font-bold text-zinc-600 uppercase mt-0.5">
                      DISTRICT: {tx.target_society || 'UNASSIGNED'}
                    </div>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className="text-sm font-black text-white tracking-tighter italic">
                      {tx.coins.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className={`text-[10px] font-black ${tx.multiplier > 1.0 ? 'text-green-500' : 'text-zinc-700'}`}>
                      x{tx.multiplier?.toFixed(1) || '1.0'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatBox({ label, value, color = "text-white" }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 p-3 min-w-[100px]">
      <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-sm font-black tracking-tighter ${color}`}>{value}</div>
    </div>
  );
}
