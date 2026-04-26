import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import Layout from "../components/Layout";

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  
  const [settlement, setSettlement] = useState(null);
  const [showWinner, setShowWinner] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setSettlement({
        winner_team_id: "team_demo",
        rankings: [
          { team_id: "team_demo", team_name: "Project Antonio", total_score: 98.5, weighted_valuation: 15000 },
          { team_id: "team_02", team_name: "Nexus Dynamics", total_score: 85.2, weighted_valuation: 12000 },
          { team_id: "team_03", team_name: "Alpha Stream", total_score: 78.9, weighted_valuation: 9000 },
        ]
      });
      setTimeout(() => setShowWinner(true), 500);
      return;
    }

    const unsub = onSnapshot(doc(db, "Settlement_Results", "latest"), (snap) => {
      if (snap.exists()) {
        setSettlement(snap.data());
        // Delay winner reveal for dramatic effect
        setTimeout(() => setShowWinner(true), 1000);
      }
    });
    return unsub;
  }, []);

  if (!settlement) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-[10px] font-black text-zinc-600 tracking-[0.5em] uppercase">Calculating Final Valuation...</div>
        </div>
      </div>
    );
  }

  const winner = settlement.rankings?.[0];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Inter'] overflow-hidden selection:bg-blue-600">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[160px] rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col p-6 md:p-12">
        <header className="flex justify-between items-center mb-10 md:mb-20 animate-fade-in">
          <div>
            <div className="text-[10px] font-black text-blue-500 tracking-[0.5em] uppercase mb-2">Final Settlement Report</div>
            <h2 className="text-xl font-black italic tracking-tighter uppercase">Ceremony Phase</h2>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-zinc-600 tracking-[0.2em] uppercase">Node ID</div>
            <div className="text-xs font-mono text-zinc-400">KUYU-SETTLEMENT-2024</div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center">
          {/* Winner Section */}
          <div className={`transition-all duration-1000 transform ${showWinner ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="text-center mb-8 px-4">
              <span className="inline-block px-4 py-1 bg-blue-600 text-[8px] md:text-[10px] font-black tracking-[0.5em] uppercase italic mb-6">The Unicorn</span>
              <h1 className="text-5xl sm:text-7xl md:text-[120px] leading-none font-black tracking-tighter uppercase italic text-white drop-shadow-[0_0_50px_rgba(37,99,235,0.4)] break-words">
                {winner?.team_name}
              </h1>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-20 mt-12">
              <div className="text-center">
                <div className="text-[9px] md:text-[10px] font-black text-zinc-600 tracking-widest uppercase mb-2">Final Composite Score</div>
                <div className="text-4xl md:text-6xl font-black text-white font-mono">{winner?.total_score}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] md:text-[10px] font-black text-zinc-600 tracking-widest uppercase mb-2">Market Capitalization</div>
                <div className="text-4xl md:text-6xl font-black text-white font-mono italic">₩ {(winner?.weighted_valuation * 10000).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className={`mt-32 w-full max-w-4xl transition-all duration-1000 delay-500 transform ${showWinner ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-900 border border-zinc-900">
              {settlement.rankings?.slice(1, 7).map((r, i) => (
                <div key={r.team_id} className="bg-[#0a0a0a] p-6 flex justify-between items-center group hover:bg-zinc-950 transition-colors">
                  <div className="flex items-center space-x-6">
                    <span className="text-xl font-black text-zinc-800 italic">0{i + 2}</span>
                    <span className="text-lg font-black text-zinc-300 uppercase tracking-tighter group-hover:text-white transition-colors">{r.team_name}</span>
                  </div>
                  <span className="text-xl font-black text-zinc-600 font-mono italic">{r.total_score}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="mt-20 flex flex-col md:flex-row justify-between items-center md:items-end border-t border-zinc-900 pt-8 gap-8 animate-fade-in">
          <div className="text-[9px] font-black text-zinc-700 tracking-[0.3em] uppercase order-2 md:order-1">KU vs YU AI Hackathon © 2026</div>
          <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-12 order-1 md:order-2 w-full md:w-auto">
            <button 
              onClick={() => window.location.href = '/raffle'}
              className="w-full sm:w-auto text-[10px] font-black text-green-500 hover:text-white transition-colors tracking-widest uppercase border border-green-500/30 px-6 py-4 md:py-3"
            >
              Go to Lucky Draw →
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="text-[10px] font-black text-blue-500 hover:text-white transition-colors tracking-widest uppercase"
            >
              Back to Base Dashboard →
            </button>
          </div>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 1s ease-out; }
      `}} />
    </div>
  );
}
