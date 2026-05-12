import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

export default function InvestPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Auth State
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // App State
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // Load Data
  useEffect(() => {
    const q = query(collection(db, "Teams"), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(data);
    });
    return unsub;
  }, []);

  // DEMO MODE MOCK TEAMS
  useEffect(() => {
    if (user?.isDemo && teams.length === 0) {
      setTeams([
        { id: "team_01", name: "Project Antonio", society: "KU", pitch: "AI-driven proactive status tracking.", weighted_valuation: 15000, total_invested_coins: 45 },
        { id: "team_02", name: "Nexus Dynamics", society: "YU", pitch: "Neural network infrastructure.", weighted_valuation: 12000, total_invested_coins: 30 },
        { id: "team_03", name: "Alpha Stream", society: "KU", pitch: "High-frequency intelligence.", weighted_valuation: 9000, total_invested_coins: 15 },
      ]);
    }
  }, [user, teams]);

  // Handle Team from URL
  useEffect(() => {
    const t = searchParams.get("team");
    if (t) setTeamId(t);
  }, [searchParams]);

  // Derived Data
  const selectedTeam = useMemo(() => teams.find(t => t.id === teamId), [teams, teamId]);
  const isOpposing = user && selectedTeam && user.society !== selectedTeam.society;
  const multiplier = isOpposing ? 1.2 : 1.0;
  const projectedValIncrease = investAmount * multiplier * 10000000;

  const clampInvestAmount = (value, { enforceMax = true, enforceMin = true } = {}) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 1;
    const integer = Math.floor(parsed);
    const minBounded = enforceMin ? Math.max(integer, 1) : integer;
    return enforceMax ? Math.min(minBounded, user?.balance || 1) : minBounded;
  };

  // Actions
  async function handleLogin(e) {
    e.preventDefault();
    setIsLoggingIn(true);
    
    if (pin === "000000") {
      setTimeout(() => {
        setUser({
          user_id: "demo_user",
          name: "Demo Investor",
          society: "KU",
          balance: 10,
          pin: "000000",
          isDemo: true
        });
        setIsLoggingIn(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/invest/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser({ ...data, pin });
      } else {
        alert(data.detail || "LOGIN FAILED");
      }
    } catch (e) {
      alert("NETWORK ERROR - TRY PIN '000000'");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleInvest() {
    if (loading) return;
    const normalizedAmount = clampInvestAmount(investAmount);
    setInvestAmount(normalizedAmount);
    
    // Check if investment is open
    try {
      const statusRes = await fetch(`${API_BASE}/admin/status`);
      const statusData = await statusRes.json();
      if (statusData.is_investment_open === false) {
        alert("INVESTMENT IS CURRENTLY HALTED BY ADMIN");
        return;
      }
    } catch (e) {
      console.error("Could not verify system status");
    }

    setLoading(true);
    setStatus(null);

    if (user?.isDemo) {
      setTimeout(() => {
        setUser(prev => ({ ...prev, balance: prev.balance - investAmount }));
        setTeams(prev =>
          prev.map(team =>
            team.id === teamId
              ? {
                  ...team,
                  total_invested_coins: (team.total_invested_coins || 0) + investAmount,
                  weighted_valuation: (team.weighted_valuation || 0) + investAmount * multiplier,
                }
              : team
          )
        );
        setStatus({ ok: true, message: `DEMO: TRADE EXECUTED` });
        setTimeout(() => {
          setIsDrawerOpen(false);
          setStatus(null);
          setInvestAmount(1);
        }, 1500);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/invest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investor_pin: user.pin,
          target_team_id: teamId,
          coins: Number(normalizedAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ ok: false, message: data.detail || "ERROR" });
      } else {
        setUser(prev => ({ ...prev, balance: data.remaining_balance }));
        setTeams(prev =>
          prev.map(team =>
            team.id === teamId
              ? {
                  ...team,
                  total_invested_coins: (team.total_invested_coins || 0) + normalizedAmount,
                  weighted_valuation: (team.weighted_valuation || 0) + normalizedAmount * multiplier,
                }
              : team
          )
        );
        setStatus({ ok: true, message: `TRADE EXECUTED` });
        setTimeout(() => {
          setIsDrawerOpen(false);
          setStatus(null);
          setInvestAmount(1);
        }, 1500);
      }
    } catch {
      setStatus({ ok: false, message: "NETWORK ERROR" });
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-['Inter']">
        <div className="w-full max-w-xs space-y-12">
          <div className="text-center">
            <div className="text-[10px] font-black text-zinc-600 tracking-[0.5em] uppercase mb-4">ACCESS KEY REQUIRED</div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Secure Vault</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="password"
              placeholder="••••••"
              className="w-full bg-black border border-zinc-800 text-center py-6 text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-blue-600"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              required
            />
            <button className="w-full bg-white text-black py-5 font-black uppercase text-xs tracking-widest active:bg-zinc-200 transition-colors">
              {isLoggingIn ? "VERIFYING..." : "UNLOCK WALLET"}
            </button>
            <div className="text-center">
              <span className="text-[9px] font-black text-zinc-700 tracking-widest uppercase">Dev Hint: Use 000000</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white font-['Inter'] flex flex-col select-none overflow-x-hidden">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-6 sticky top-0 bg-[#0d0d0f] z-50 border-b border-zinc-900">
        <button className="w-12 h-12 -ml-3 flex items-center justify-center active:bg-zinc-900 transition-colors" onClick={() => teamId ? setTeamId("") : navigate('/dashboard')}>
          <span className="material-symbols-outlined text-2xl">{teamId ? 'close' : 'arrow_back'}</span>
        </button>
        <div className="text-[10px] font-black tracking-[0.3em] text-zinc-600 uppercase">
          {selectedTeam ? `DISTRICT 0${teams.indexOf(selectedTeam) + 1}` : "ASSET SELECTION"}
        </div>
        <div className="bg-zinc-950 px-4 py-2 border border-zinc-800 flex items-center space-x-2">
          {user.isDemo && <span className="text-[8px] font-black bg-blue-600 text-white px-1 py-0.5 rounded-sm mr-1">DEMO</span>}
          <span className="text-[10px]">💰</span>
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-black font-mono tracking-tighter text-white">₩ {(user.balance * 10000000).toLocaleString()}</span>
            <span className="text-[8px] font-bold text-zinc-600 uppercase leading-none">{user.balance} COINS LEFT</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 relative overflow-y-auto overflow-x-hidden">
        {!selectedTeam ? (
          <div className="h-full min-h-0 flex flex-col p-6 space-y-6 pt-20">
            <div className="flex justify-between items-end px-4">
              <div>
                <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Discover</h1>
                <p className="text-[10px] font-black text-zinc-600 tracking-widest uppercase mt-1">Market Intelligence Map</p>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col md:flex-row md:items-center gap-5 md:gap-8 px-1 md:px-8 md:-mx-6 pb-24">
              {teams.map((t, i) => (
                <TeamCard 
                  key={t.id} 
                  team={t} 
                  index={i} 
                  total={teams.length} 
                  onClick={() => setTeamId(t.id)} 
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 md:p-6 animate-fade-in pb-32 max-w-lg mx-auto">
            <section className="mb-12">
              <div className="text-[9px] md:text-[10px] font-black text-zinc-500 tracking-[0.4em] uppercase mb-2">District Asset</div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-8 leading-none wrap-break-word">{selectedTeam.name}</h1>
              
              <div className="grid grid-cols-2 gap-4 mb-12">
                <div className="bg-zinc-900/50 p-4 border border-zinc-800">
                  <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">MARKET VALUE</div>
                  <div className="text-xl font-black font-mono tracking-tighter text-white uppercase">
                    ₩ {(selectedTeam.weighted_valuation * 10000000).toLocaleString()}
                  </div>
                </div>
                <div className="bg-zinc-900/50 p-4 border border-zinc-800">
                  <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">TOTAL FUNDING</div>
                  <div className="text-xl font-black font-mono tracking-tighter text-white uppercase">
                    {selectedTeam.total_invested_coins || 0} COINS
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Mini Stat Graph */}
                <div className="bg-zinc-900/30 p-6 border border-zinc-800">
                   <div className="flex justify-between items-end mb-4">
                     <h3 className="text-[10px] font-black text-zinc-600 tracking-widest uppercase">Valuation Composition</h3>
                     <span className="text-[10px] font-black text-blue-500 uppercase">Strategic Focus</span>
                   </div>
                   <div className="h-2 w-full bg-zinc-800 flex overflow-hidden">
                     <div
                      className={`${selectedTeam.society === 'KU' ? 'bg-red-600' : 'bg-blue-600'} h-full transition-all duration-1000`}
                      style={{ width: `${Math.min(100, (selectedTeam.weighted_valuation / 120) * 100)}%` }}
                     ></div>
                   </div>
                   <div className="flex justify-between mt-2 text-[8px] font-black text-zinc-700 uppercase tracking-widest">
                     <span>Seed</span>
                     <span>Series A</span>
                     <span>Unicorn</span>
                   </div>
                </div>

                <div className="bg-zinc-900/30 p-6 border border-zinc-800">
                   <h3 className="text-[10px] font-black text-zinc-600 tracking-widest uppercase mb-3">Vision Pitch</h3>
                   <p className="text-zinc-400 text-sm font-bold leading-relaxed uppercase tracking-wider">
                     {selectedTeam.pitch || "Next-generation AI operations infrastructure for decentralized academic intelligence networks."}
                   </p>
                </div>

                {isOpposing && (
                  <div className="bg-blue-600 p-6 text-center">
                    <span className="text-[11px] font-black text-white tracking-[0.2em] uppercase italic">
                      🔥 1.2x Cross-Investment Multiplier Active
                    </span>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Sticky Button */}
      {selectedTeam && (
        <div className="fixed bottom-0 left-0 right-0 p-0 bg-black z-40 border-t border-zinc-900">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className={`w-full py-8 font-black uppercase text-xs tracking-[0.3em] active:brightness-90 transition-all ${
              selectedTeam.society === 'KU' ? 'bg-red-600' : 'bg-blue-600'
            }`}
          >
            INVEST IN {selectedTeam.name}
          </button>
        </div>
      )}

      {/* Bottom Sheet */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => !loading && setIsDrawerOpen(false)}></div>
          <div className="relative bg-zinc-950 border-t border-zinc-800 p-10 space-y-10 animate-slide-up">
            <div className="w-12 h-1 bg-zinc-900 rounded-full mx-auto -mt-6 mb-6"></div>
            <header className="flex justify-between items-end">
              <div>
                <div className="text-[9px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1 md:mb-2">ALLOCATION</div>
                <div className="text-3xl md:text-5xl font-black font-mono tracking-tighter text-white">
                  {investAmount}<span className="text-sm md:text-lg text-zinc-800 ml-2">COINS</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">PROJECTED IMPACT</div>
                <div className="text-sm font-black text-blue-500 uppercase italic">+₩{(projectedValIncrease).toLocaleString()}</div>
              </div>
            </header>
            <div className="grid grid-cols-3 gap-px bg-zinc-800 border border-zinc-800">
              <button onClick={() => setInvestAmount(prev => clampInvestAmount(prev - 1))} className="bg-black py-5 font-black text-xs active:bg-zinc-900 transition-colors">-1</button>
              <button onClick={() => setInvestAmount(prev => clampInvestAmount(prev - 5))} className="bg-black py-5 font-black text-xs active:bg-zinc-900 transition-colors">-5</button>
              <button onClick={() => setInvestAmount(user.balance)} className="bg-black py-5 font-black text-xs active:bg-zinc-900 transition-colors">MAX</button>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 flex items-center justify-between gap-3">
              <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500">Custom Coins</span>
              <input
                type="number"
                min={1}
                max={user.balance}
                value={investAmount}
                onChange={(e) => setInvestAmount(clampInvestAmount(e.target.value, { enforceMax: false }))}
                onBlur={() => setInvestAmount(clampInvestAmount(investAmount))}
                className="w-28 bg-black border border-zinc-700 text-right py-2 px-3 text-sm font-black font-mono tracking-wider focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-px bg-zinc-800 border border-zinc-800">
              <button onClick={() => setInvestAmount(prev => clampInvestAmount(prev + 1))} className="bg-black py-5 font-black text-xs active:bg-zinc-900 transition-colors">+1</button>
              <button onClick={() => setInvestAmount(prev => clampInvestAmount(prev + 5))} className="bg-black py-5 font-black text-xs active:bg-zinc-900 transition-colors">+5</button>
            </div>
            <div className="space-y-4">
              {status ? (
                <div className={`py-6 text-center text-xs font-black uppercase tracking-widest ${status.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{status.message}</div>
              ) : (
                <button 
                  onClick={handleInvest}
                  className={`w-full py-7 font-black uppercase text-xs tracking-[0.3em] transition-all relative ${selectedTeam.society === 'KU' ? 'bg-red-600' : 'bg-blue-600'}`}
                  disabled={loading || investAmount < 1 || investAmount > user.balance}
                >
                  {loading ? "TRANSMITTING..." : "Tap to Execute Trade"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  );
}

function TeamCard({ team, index, total, onClick }) {
  const bgColor = team.society === 'KU' ? 'bg-[#dc2626]' : 'bg-[#2563eb]';
  
  // Mock trend data for "Stock Chart" look
  const trendData = useMemo(() => {
    const points = [40, 35, 45, 30, 55, 50, 65, 60, 80];
    return points.map(p => p + (Math.random() * 10 - 5));
  }, []);
  
  return (
    <div 
      onClick={onClick}
      className={`${bgColor} w-full md:min-w-[280px] md:max-w-[300px] md:h-[520px] rounded-[24px] md:rounded-[40px] p-6 md:p-10 flex flex-col justify-between relative cursor-pointer transform transition-all duration-500 active:scale-[0.98] md:active:scale-95 group z-10 shadow-none`}
    >
      <div className="relative z-10">
        <div className="text-[9px] md:text-[10px] font-black text-white/50 tracking-[0.4em] uppercase mb-4">District {index + 1}</div>
        <h2 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase leading-tight mb-6 wrap-break-word">{team.name}</h2>
        <div className="w-10 h-1 bg-white/20 mb-8 group-hover:w-20 transition-all duration-500"></div>
        
        {/* Real-time Stats on Card */}
        <div className="space-y-6">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Market Cap</span>
            <span className="text-2xl font-black text-white font-mono tracking-tighter italic">₩ {(team.weighted_valuation * 10000000).toLocaleString()}</span>
          </div>

          {/* Stock Style Trend Chart */}
          <div className="h-20 w-full relative group-hover:scale-105 transition-transform duration-500">
            <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
              <path
                d={`M ${trendData.map((p, i) => `${(i / (trendData.length - 1)) * 100},${40 - (p / 100) * 40}`).join(' L ')}`}
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-40 group-hover:opacity-100 transition-opacity"
              />
              <path
                d={`M ${trendData.map((p, i) => `${(i / (trendData.length - 1)) * 100},${40 - (p / 100) * 40}`).join(' L ')} L 100,40 L 0,40 Z`}
                className="fill-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Funding Progress</span>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-black text-white">{team.total_invested_coins || 0} COINS</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(100, (team.total_invested_coins / 100) * 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex justify-between items-center mt-auto">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Affiliation</span>
          <span className="text-sm font-black text-white tracking-tighter uppercase">{team.society === 'KU' ? 'Korea Univ.' : 'Yonsei Univ.'}</span>
        </div>
        <div className="w-14 h-14 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-all duration-500 backdrop-blur-md border border-white/10">
          <span className="material-symbols-outlined text-white text-2xl group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">north_east</span>
        </div>
      </div>
    </div>
  );
}
