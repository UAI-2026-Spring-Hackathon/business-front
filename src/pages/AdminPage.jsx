import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useData } from "../context/DataContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();
  const { timeLeft, totalVolume } = useData();

  useEffect(() => {
    if (isAdmin) fetchStatus();
  }, [isAdmin]);

  async function fetchStatus() {
    try {
      const res = await fetch(`${API_BASE}/admin/status`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch admin status:", err);
      setStatus({ is_investment_open: false });
    }
  }

  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === "BOSS99") {
      setIsAdmin(true);
    } else {
      alert("UNAUTHORIZED ACCESS");
    }
  };

  const toggleInvestment = async () => {
    const nextState = !status.is_investment_open;
    setLoading(true);
    try {
      await fetch(`${API_BASE}/admin/toggle-investment?status=${nextState}`, {
        method: "POST",
      });
      await fetchStatus();
      setMsg(`System: Investment is now ${nextState ? "OPEN" : "CLOSED"}`);
    } catch (e) {
      setMsg("Error toggling investment status");
    } finally {
      setLoading(false);
    }
  };

  const resetSystem = async () => {
    if (!window.confirm("CAUTION: This will delete ALL transactions and reset valuations. Proceed?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/reset`, { method: "POST" });
      const data = await res.json();
      setMsg(`System: ${data.message}`);
      await fetchStatus();
    } catch (e) {
      setMsg("Error resetting system");
    } finally {
      setLoading(false);
    }
  };

  const runSettlement = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settlement/run`, { method: "POST" });
      const data = await res.json();
      setMsg(`System: Settlement complete. Winner ID: ${data.winner_team_id}`);
      setTimeout(() => navigate("/results"), 2000);
    } catch (e) {
      setMsg("Error running settlement");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-xs space-y-12">
          <div className="text-center">
            <div className="text-[10px] font-black text-zinc-600 tracking-[0.5em] uppercase mb-4">Command Center</div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Admin Access</h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="password"
              placeholder="••••••"
              className="w-full bg-black border border-zinc-800 text-center py-6 text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-red-600"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
            />
            <button className="w-full bg-red-600 text-white py-5 font-black uppercase text-xs tracking-widest active:bg-red-700 transition-colors">
              AUTHENTICATE
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (status === null) {
    return (
      <Layout timeLeft={timeLeft} totalVolume={totalVolume}>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="text-[10px] font-black text-zinc-600 tracking-[0.4em] uppercase">Loading System Status...</div>
          </div>
        </div>
      </Layout>
    );
  }

  const isOpen = status.is_investment_open;
  const endTimeRaw = status.investment_end_time_utc;
  const endTimeDisplay = endTimeRaw ? new Date(endTimeRaw).toLocaleTimeString() : null;

  return (
    <Layout timeLeft={timeLeft} totalVolume={totalVolume}>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 md:space-y-12 animate-fade-in">
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none wrap-break-word">Command Center</h1>
            <p className="text-[9px] md:text-[10px] font-black text-zinc-600 tracking-[0.25em] md:tracking-[0.4em] uppercase mt-3 md:mt-4 italic">
              Strategic Operations & Control
            </p>
          </div>
          <div className="text-left md:text-right space-y-1">
            <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">SYSTEM STATUS</div>
            <div className={`text-xs font-black uppercase ${isOpen ? "text-green-500" : "text-red-500"}`}>
              ● {isOpen ? "INVESTMENT ACTIVE" : "INVESTMENT HALTED"}
            </div>
            {isOpen && endTimeDisplay && (
              <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
                CLOSES AT {endTimeDisplay}
              </div>
            )}
          </div>
        </header>

        {msg && (
          <div className="bg-zinc-900 border-l-4 border-blue-600 p-4 md:p-6 flex items-start md:items-center space-x-3 md:space-x-4 animate-slide-up">
            <span className="text-blue-500 font-black text-lg">!</span>
            <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.08em] md:tracking-widest text-zinc-300 wrap-break-word">{msg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Investment Switch */}
          <div className="bg-zinc-950 border border-zinc-800 p-8 space-y-6">
            <h3 className="text-[10px] font-black text-zinc-600 tracking-widest uppercase">Phase Control</h3>
            <div className="space-y-4">
              <p className="text-zinc-500 text-[11px] font-bold uppercase leading-relaxed">
                Toggle the investment window. When closed, users cannot execute trades.
              </p>
              {isOpen && (
                <div className="bg-zinc-900 border border-zinc-800 p-4 flex justify-between items-center">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Time Remaining</span>
                  <span className="text-lg font-black font-mono text-blue-500">{timeLeft}</span>
                </div>
              )}
              <button
                onClick={toggleInvestment}
                disabled={loading}
                className={`w-full py-5 font-black uppercase text-xs tracking-widest transition-all disabled:opacity-50 ${
                  isOpen
                    ? "bg-red-600/10 text-red-600 border border-red-600/50 hover:bg-red-600 hover:text-white"
                    : "bg-green-600 text-white"
                }`}
              >
                {loading ? "UPDATING..." : isOpen ? "HALT INVESTMENT" : "START INVESTMENT"}
              </button>
            </div>
          </div>

          {/* Settlement Trigger */}
          <div className="bg-zinc-950 border border-zinc-800 p-8 space-y-6">
            <h3 className="text-[10px] font-black text-zinc-600 tracking-widest uppercase">Settlement Engine</h3>
            <div className="space-y-4">
              <p className="text-zinc-500 text-[11px] font-bold uppercase leading-relaxed">
                Run the final valuation conversion. This determines the unicorn and calculates raffle tickets.
              </p>
              <button
                onClick={runSettlement}
                disabled={loading}
                className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50"
              >
                EXECUTE FINAL SETTLEMENT
              </button>
            </div>
          </div>

          {/* System Reset */}
          <div className="bg-zinc-950 border border-red-900/50 p-8 space-y-6 md:col-span-2">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black text-red-600 tracking-widest uppercase">Danger Zone</h3>
              <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">RESTRICTED</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <p className="text-zinc-500 text-[11px] font-bold uppercase leading-relaxed max-w-md">
                Wipe all transaction history and reset team valuations to zero. Investment phase will be forced to HALT.
                Use this to clear test data before the official event starts.
              </p>
              <button
                onClick={resetSystem}
                disabled={loading}
                className="py-5 px-12 border border-red-600 text-red-600 font-black uppercase text-xs tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
              >
                FACTORY RESET
              </button>
            </div>
          </div>
        </div>

        <footer className="pt-8 md:pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between md:items-center gap-2 text-zinc-700">
          <div className="text-[9px] font-black uppercase tracking-widest">KU vs YU AI Hackathon © 2026</div>
          <div className="text-[9px] font-black uppercase tracking-widest">Strategic Ops v1.0</div>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
      `}} />
    </Layout>
  );
}
