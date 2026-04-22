import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import Layout from "../components/Layout";

export default function RafflePage() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  const [settlement, setSettlement] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [winner, setWinner] = useState(null);
  const [rollingUser, setRollingUser] = useState("");

  useEffect(() => {
    if (isDemo) {
      setSettlement({
        raffle_tickets: [
          { investor_id: "VIP_INVESTOR_01", tickets: 120 },
          { investor_id: "KU_STUDENT_99", tickets: 50 },
          { investor_id: "YU_MASTER_77", tickets: 80 },
          { investor_id: "UPSTAGE_FAN_01", tickets: 30 },
          { investor_id: "ALPHA_TESTER", tickets: 10 },
        ]
      });
      return;
    }
    const unsub = onSnapshot(doc(db, "Settlement_Results", "latest"), (snap) => {
      if (snap.exists()) {
        setSettlement(snap.data());
      }
    });
    return unsub;
  }, []);

  // Prepare a weighted pool for the draw
  const weightedPool = useMemo(() => {
    if (!settlement?.raffle_tickets) return [];
    const pool = [];
    settlement.raffle_tickets.forEach(ticket => {
      for (let i = 0; i < ticket.tickets; i++) {
        pool.push(ticket.investor_id);
      }
    });
    return pool;
  }, [settlement]);

  const totalTickets = settlement?.raffle_tickets?.reduce((sum, t) => sum + t.tickets, 0) || 0;

  const drawWinner = () => {
    if (weightedPool.length === 0 || isDrawing) return;
    
    setIsDrawing(true);
    setWinner(null);
    
    // Rolling animation
    let counter = 0;
    const interval = setInterval(() => {
      const randomUser = settlement.raffle_tickets[Math.floor(Math.random() * settlement.raffle_tickets.length)];
      setRollingUser(randomUser.investor_id);
      counter++;
      
      if (counter > 30) {
        clearInterval(interval);
        const finalWinnerId = weightedPool[Math.floor(Math.random() * weightedPool.length)];
        setWinner(finalWinnerId);
        setIsDrawing(false);
      }
    }, 100);
  };

  if (!settlement) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-[10px] font-black text-zinc-600 tracking-[0.5em] uppercase">Loading Raffle Pool...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Inter'] flex flex-col p-12">
      <header className="flex justify-between items-end mb-20">
        <div>
          <div className="text-[10px] font-black text-blue-500 tracking-[0.5em] uppercase mb-2">Lucky Draw System</div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic italic">Unicorn Raffle</h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black text-zinc-600 tracking-[0.2em] uppercase mb-1">Eligible Contributors</div>
          <div className="text-2xl font-black font-mono">{settlement.raffle_tickets?.length || 0}</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-12 items-center justify-center">
        {/* Raffle Wheel / Display */}
        <div className="flex-1 w-full max-w-2xl">
          <div className="bg-zinc-950 border border-zinc-800 p-20 text-center relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05)_0%,transparent_70%)]"></div>
             
             {isDrawing ? (
               <div className="relative z-10 space-y-4">
                 <div className="text-[10px] font-black text-blue-500 tracking-[0.5em] uppercase animate-pulse">Scanning Pool...</div>
                 <div className="text-6xl font-black font-mono tracking-widest text-zinc-400 truncate">{rollingUser}</div>
               </div>
             ) : winner ? (
               <div className="relative z-10 animate-slide-up">
                 <div className="text-[10px] font-black text-green-500 tracking-[0.5em] uppercase mb-6">★ DRAW COMPLETE ★</div>
                 <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter uppercase italic leading-tight mb-8 drop-shadow-[0_0_40px_rgba(34,197,94,0.3)] break-all max-w-full px-4">
                   {winner}
                 </h2>
                 <div className="text-[10px] font-black text-zinc-600 tracking-widest uppercase">Validated Winner Hash: 0x{Math.random().toString(16).slice(2, 10)}</div>
               </div>
             ) : (
               <div className="relative z-10">
                 <div className="text-[10px] font-black text-zinc-700 tracking-[0.5em] uppercase mb-8 italic">Ready for Draw</div>
                 <button 
                  onClick={drawWinner}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 font-black uppercase text-sm tracking-[0.3em] transition-all active:scale-95"
                 >
                   ROLL THE RAFFLE
                 </button>
               </div>
             )}
          </div>
        </div>

        {/* Info & Tickets List */}
        <div className="w-full max-w-sm space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800 p-8">
            <h3 className="text-[10px] font-black text-zinc-500 tracking-widest uppercase mb-4 italic">Ticket Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-zinc-400">TOTAL TICKETS</span>
                <span className="text-xl font-black font-mono">{totalTickets}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-zinc-400">WIN RATE BASE</span>
                <span className="text-xl font-black font-mono text-blue-500">1 / {weightedPool.length || '---'}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 p-8 h-[400px] overflow-y-auto no-scrollbar">
            <h3 className="text-[10px] font-black text-zinc-500 tracking-widest uppercase mb-6 italic">Qualified Investors</h3>
            <div className="space-y-4">
              {settlement.raffle_tickets?.map((t) => (
                <div key={t.investor_id} className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-zinc-300">{t.investor_id}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-zinc-600 font-mono">{t.tickets} TX</span>
                    <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${(t.tickets / 100) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 flex justify-between items-end border-t border-zinc-900 pt-8">
        <div className="text-[9px] font-black text-zinc-800 tracking-[0.3em] uppercase">Unicorn Prize Protocol v1.0</div>
        <button 
          onClick={() => window.location.href = '/results'}
          className="text-[9px] font-black text-zinc-600 hover:text-white transition-colors tracking-widest uppercase"
        >
          ← Return to Ceremony
        </button>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}
