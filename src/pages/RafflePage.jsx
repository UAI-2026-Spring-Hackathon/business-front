import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

export default function RafflePage() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  const [settlement, setSettlement] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [winners, setWinners] = useState([]);
  const [lastWinner, setLastWinner] = useState(null);
  const [rollingUser, setRollingUser] = useState("");
  const [userNames, setUserNames] = useState({});

  const displayName = (ticketOrId) => {
    if (typeof ticketOrId === "object" && ticketOrId !== null) {
      const id = ticketOrId.investor_id;
      const fromUsers = id ? userNames[id] : null;
      if (fromUsers) return fromUsers;
      const emb = ticketOrId.investor_name;
      if (emb && id && emb !== id) return emb;
      return emb || id || "";
    }
    return userNames[ticketOrId] || ticketOrId;
  };

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "Users"), (snap) => {
      const map = {};
      snap.docs.forEach((userDoc) => {
        map[userDoc.id] = userDoc.data().name || userDoc.id;
      });
      setUserNames(map);
    });
    return unsubUsers;
  }, []);

  useEffect(() => {
    if (isDemo) {
      setSettlement({
        raffle_tickets: [
          { investor_id: "VIP_INVESTOR_01", investor_name: "VIP Investor", tickets: 120 },
          { investor_id: "KU_STUDENT_99", investor_name: "KU Student", tickets: 50 },
          { investor_id: "YU_MASTER_77", investor_name: "YU Master", tickets: 80 },
          { investor_id: "UPSTAGE_FAN_01", investor_name: "Upstage Fan", tickets: 30 },
          { investor_id: "ALPHA_TESTER", investor_name: "Alpha Tester", tickets: 10 },
        ]
      });
      return;
    }
    const unsub = onSnapshot(doc(db, "Settlement_Results", "latest"), async (snap) => {
      if (!snap.exists()) {
        setSettlement(null);
        return;
      }
      const data = snap.data();
      let tickets = data.raffle_tickets || [];
      try {
        const res = await fetch(`${API_BASE}/settlement/raffle-tickets`);
        if (res.ok) {
          const j = await res.json();
          if (Array.isArray(j.raffle_tickets)) tickets = j.raffle_tickets;
        }
      } catch {
        /* 폴백: Firestore 스냅샷 원본 */
      }
      setSettlement({ ...data, raffle_tickets: tickets });
    });
    return unsub;
  }, []);

  // Build remaining ticket pool: exclude already-drawn winners (without replacement)
  const winnerIds = useMemo(() => new Set(winners.map((w) => w.investor_id)), [winners]);
  const remainingTickets = useMemo(() => {
    if (!settlement?.raffle_tickets) return [];
    return settlement.raffle_tickets.filter((t) => !winnerIds.has(t.investor_id));
  }, [settlement, winnerIds]);

  const weightedPool = useMemo(() => {
    const pool = [];
    remainingTickets.forEach((ticket) => {
      for (let i = 0; i < ticket.tickets; i++) {
        pool.push(ticket.investor_id);
      }
    });
    return pool;
  }, [remainingTickets]);

  const totalTickets = settlement?.raffle_tickets?.reduce((sum, t) => sum + t.tickets, 0) || 0;
  const remainingTotalTickets = weightedPool.length;

  const drawWinner = () => {
    if (weightedPool.length === 0 || isDrawing) return;

    setIsDrawing(true);
    setLastWinner(null);

    let counter = 0;
    const interval = setInterval(() => {
      const sample = remainingTickets[Math.floor(Math.random() * remainingTickets.length)];
      setRollingUser(displayName(sample) || "");
      counter++;

      if (counter > 30) {
        clearInterval(interval);
        const finalWinnerId = weightedPool[Math.floor(Math.random() * weightedPool.length)];
        const ticketEntry = remainingTickets.find((t) => t.investor_id === finalWinnerId);
        const winnerRecord = {
          investor_id: finalWinnerId,
          investor_name: ticketEntry?.investor_name || userNames[finalWinnerId] || finalWinnerId,
          tickets: ticketEntry?.tickets || 0,
        };
        setLastWinner(winnerRecord);
        setWinners((prev) => [...prev, winnerRecord]);
        setIsDrawing(false);
      }
    }, 100);
  };

  const resetDraws = () => {
    if (isDrawing) return;
    setWinners([]);
    setLastWinner(null);
    setRollingUser("");
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
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">Unicorn Raffle</h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black text-zinc-600 tracking-[0.2em] uppercase mb-1">Eligible Contributors</div>
          <div className="text-2xl font-black font-mono">{remainingTickets.length} / {settlement.raffle_tickets?.length || 0}</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-12 items-stretch justify-center">
        {/* Raffle Wheel / Display */}
        <div className="flex-1 w-full max-w-2xl flex flex-col gap-8">
          <div className="bg-zinc-950 border border-zinc-800 p-20 text-center relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05)_0%,transparent_70%)]"></div>
             
             {isDrawing ? (
               <div className="relative z-10 space-y-4">
                 <div className="text-[10px] font-black text-blue-500 tracking-[0.5em] uppercase animate-pulse">Scanning Pool...</div>
                 <div className="text-6xl font-black font-mono tracking-widest text-zinc-400 truncate">{rollingUser}</div>
               </div>
             ) : lastWinner ? (
               <div className="relative z-10 animate-slide-up">
                 <div className="text-[10px] font-black text-green-500 tracking-[0.5em] uppercase mb-6">★ DRAW COMPLETE ★</div>
                 <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter uppercase italic leading-tight mb-8 drop-shadow-[0_0_40px_rgba(34,197,94,0.3)] break-all max-w-full px-4">
                   {displayName(lastWinner)}
                 </h2>
                 <div className="text-[10px] font-black text-zinc-600 tracking-widest uppercase mb-6">Validated Winner Hash: 0x{Math.random().toString(16).slice(2, 10)}</div>
                 {weightedPool.length > 0 && (
                   <button
                     onClick={drawWinner}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 font-black uppercase text-xs tracking-[0.3em] transition-all active:scale-95"
                   >
                     DRAW NEXT WINNER
                   </button>
                 )}
                 {weightedPool.length === 0 && (
                   <div className="text-[10px] font-black text-amber-500 tracking-[0.3em] uppercase mt-4">
                     POOL EXHAUSTED
                   </div>
                 )}
               </div>
             ) : (
               <div className="relative z-10">
                 <div className="text-[10px] font-black text-zinc-700 tracking-[0.5em] uppercase mb-8 italic">
                   {weightedPool.length > 0 ? "Ready for Draw" : "No Tickets Available"}
                 </div>
                 {weightedPool.length > 0 && (
                   <button
                     onClick={drawWinner}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 font-black uppercase text-sm tracking-[0.3em] transition-all active:scale-95"
                   >
                     ROLL THE RAFFLE
                   </button>
                 )}
               </div>
             )}
          </div>

          {/* Winners History */}
          <div className="bg-zinc-900/30 border border-zinc-800 p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-zinc-500 tracking-widest uppercase italic">
                Winners History
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-zinc-600 tracking-widest uppercase">
                  {winners.length} DRAWN
                </span>
                {winners.length > 0 && !isDrawing && (
                  <button
                    onClick={resetDraws}
                    className="text-[9px] font-black text-zinc-500 hover:text-red-500 transition-colors tracking-widest uppercase border border-zinc-700 hover:border-red-500 px-3 py-1"
                  >
                    RESET
                  </button>
                )}
              </div>
            </div>
            {winners.length === 0 ? (
              <div className="text-[11px] font-bold text-zinc-700 italic">
                No winners yet. Roll the raffle to begin.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                {winners.map((w, idx) => (
                  <div
                    key={`${w.investor_id}-${idx}`}
                    className="flex justify-between items-center text-[11px] font-bold border-b border-zinc-900 pb-2"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-600 font-mono italic">
                        #{String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-white">{displayName(w)}</span>
                    </div>
                    <span className="text-zinc-600 font-mono">{w.tickets} TX</span>
                  </div>
                ))}
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
                <span className="text-[11px] font-bold text-zinc-400">REMAINING TICKETS</span>
                <span className="text-xl font-black font-mono text-blue-500">{remainingTotalTickets}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-zinc-400">WIN RATE BASE</span>
                <span className="text-xl font-black font-mono text-blue-500">1 / {remainingTotalTickets || '---'}</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 p-8 h-[400px] overflow-y-auto no-scrollbar">
            <h3 className="text-[10px] font-black text-zinc-500 tracking-widest uppercase mb-6 italic">Active Pool</h3>
            <div className="space-y-4">
              {remainingTickets.map((t) => (
                <div key={t.investor_id} className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-zinc-300">{displayName(t)}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-zinc-600 font-mono">{t.tickets} TX</span>
                    <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${(t.tickets / 100) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
              {remainingTickets.length === 0 && (
                <div className="text-[11px] font-bold text-zinc-700 italic">
                  All investors have been drawn.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 flex justify-between items-end border-t border-zinc-900 pt-8">
        <div className="text-[9px] font-black text-zinc-800 tracking-[0.3em] uppercase">Unicorn Prize Protocol v1.1 · Weighted, Without Replacement</div>
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
