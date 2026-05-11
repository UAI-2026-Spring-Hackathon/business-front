import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

export default function TechRafflePage() {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  const [participants, setParticipants] = useState(null);
  const [winners, setWinners] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rollingName, setRollingName] = useState("");
  const [lastWinner, setLastWinner] = useState(null);

  useEffect(() => {
    if (isDemo) {
      setParticipants([
        { id: "user_team_01_01", name: "최규호", team_id: "team_01" },
        { id: "user_team_01_02", name: "민한성", team_id: "team_01" },
        { id: "user_team_02_01", name: "오지훈", team_id: "team_02" },
        { id: "user_team_02_02", name: "송인보", team_id: "team_02" },
        { id: "user_team_03_01", name: "김용주", team_id: "team_03" },
      ]);
      return;
    }
    const fetchParticipants = async () => {
      try {
        const res = await fetch(`${API_BASE}/tech-raffle/participants`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setParticipants(data.participants || []);
      } catch (err) {
        console.error("Failed to fetch tech participants", err);
        setParticipants([]);
      }
    };
    fetchParticipants();
  }, [isDemo]);

  const winnerIds = useMemo(() => new Set(winners.map((w) => w.id)), [winners]);
  const remainingPool = useMemo(
    () => (participants || []).filter((p) => !winnerIds.has(p.id)),
    [participants, winnerIds]
  );

  const totalParticipants = participants?.length || 0;
  const remainingCount = remainingPool.length;

  const drawWinner = () => {
    if (remainingPool.length === 0 || isDrawing) return;

    setIsDrawing(true);
    setLastWinner(null);

    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * remainingPool.length);
      setRollingName(remainingPool[randomIdx].name);
      counter++;

      if (counter > 30) {
        clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * remainingPool.length);
        const picked = remainingPool[finalIdx];
        setLastWinner(picked);
        setWinners((prev) => [...prev, picked]);
        setIsDrawing(false);
      }
    }, 100);
  };

  const resetDraws = () => {
    if (isDrawing) return;
    setWinners([]);
    setLastWinner(null);
    setRollingName("");
  };

  if (!participants) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-[10px] font-black text-zinc-600 tracking-[0.5em] uppercase">
            Loading Tech Participants...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Inter'] flex flex-col p-12">
      <header className="flex justify-between items-end mb-20">
        <div>
          <div className="text-[10px] font-black text-emerald-500 tracking-[0.5em] uppercase mb-2">
            Tech Track Lucky Draw
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">
            Tech Raffle
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black text-zinc-600 tracking-[0.2em] uppercase mb-1">
            Eligible Participants
          </div>
          <div className="text-2xl font-black font-mono">
            {remainingCount} / {totalParticipants}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-12 items-stretch justify-center">
        {/* Raffle Display */}
        <div className="flex-1 w-full max-w-2xl flex flex-col gap-8">
          <div className="bg-zinc-950 border border-zinc-800 p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]"></div>

            {isDrawing ? (
              <div className="relative z-10 space-y-4">
                <div className="text-[10px] font-black text-emerald-500 tracking-[0.5em] uppercase animate-pulse">
                  Scanning Pool...
                </div>
                <div className="text-6xl font-black font-mono tracking-widest text-zinc-400 truncate">
                  {rollingName}
                </div>
              </div>
            ) : lastWinner ? (
              <div className="relative z-10 animate-slide-up">
                <div className="text-[10px] font-black text-emerald-400 tracking-[0.5em] uppercase mb-6">
                  ★ DRAW COMPLETE ★
                </div>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter uppercase italic leading-tight mb-4 drop-shadow-[0_0_40px_rgba(16,185,129,0.4)] break-all max-w-full px-4">
                  {lastWinner.name}
                </h2>
                <div className="text-[10px] font-black text-zinc-500 tracking-widest uppercase mb-6">
                  {lastWinner.team_id}
                </div>
                {remainingCount > 0 && (
                  <button
                    onClick={drawWinner}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 font-black uppercase text-xs tracking-[0.3em] transition-all active:scale-95"
                  >
                    DRAW NEXT WINNER
                  </button>
                )}
                {remainingCount === 0 && (
                  <div className="text-[10px] font-black text-amber-500 tracking-[0.3em] uppercase mt-4">
                    POOL EXHAUSTED
                  </div>
                )}
              </div>
            ) : (
              <div className="relative z-10">
                <div className="text-[10px] font-black text-zinc-700 tracking-[0.5em] uppercase mb-8 italic">
                  {remainingCount > 0 ? "Ready for Draw" : "No Participants Available"}
                </div>
                {remainingCount > 0 && (
                  <button
                    onClick={drawWinner}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-6 font-black uppercase text-sm tracking-[0.3em] transition-all active:scale-95"
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
                    key={`${w.id}-${idx}`}
                    className="flex justify-between items-center text-[11px] font-bold border-b border-zinc-900 pb-2"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-600 font-mono italic">
                        #{String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="text-white">{w.name}</span>
                    </div>
                    <span className="text-zinc-600 font-mono">{w.team_id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pool Statistics */}
        <div className="w-full max-w-sm space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-800 p-8">
            <h3 className="text-[10px] font-black text-zinc-500 tracking-widest uppercase mb-4 italic">
              Pool Statistics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-zinc-400">TOTAL PARTICIPANTS</span>
                <span className="text-xl font-black font-mono">{totalParticipants}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-zinc-400">REMAINING IN POOL</span>
                <span className="text-xl font-black font-mono text-emerald-500">
                  {remainingCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-zinc-400">WIN PROBABILITY</span>
                <span className="text-xl font-black font-mono text-emerald-500">
                  1 / {remainingCount || "---"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 p-8 h-[400px] overflow-y-auto no-scrollbar">
            <h3 className="text-[10px] font-black text-zinc-500 tracking-widest uppercase mb-6 italic">
              Active Pool
            </h3>
            <div className="space-y-3">
              {remainingPool.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center text-[11px] font-bold"
                >
                  <span className="text-zinc-300">{p.name}</span>
                  <span className="text-zinc-600 font-mono">{p.team_id}</span>
                </div>
              ))}
              {remainingPool.length === 0 && (
                <div className="text-[11px] font-bold text-zinc-700 italic">
                  All participants have been drawn.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 flex justify-between items-end border-t border-zinc-900 pt-8">
        <div className="text-[9px] font-black text-zinc-800 tracking-[0.3em] uppercase">
          Tech Raffle Protocol v1.0 · Uniform Distribution
        </div>
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="text-[9px] font-black text-zinc-600 hover:text-white transition-colors tracking-widest uppercase"
        >
          ← Return to Base
        </button>
      </footer>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `,
        }}
      />
    </div>
  );
}
