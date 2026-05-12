import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

export default function JudgePage() {
  const [searchParams] = useSearchParams();
  const judgeId = searchParams.get("id") || "";

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [scores, setScores] = useState({ ai_moat: 0, bm_validity: 0, demo_completeness: 0 });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");

  // PIN-gated 인증 상태 — PIN은 컴포넌트 state에만 보관(URL/스토리지 미저장)
  const [pin, setPin] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!authenticated) return;
    const q = query(collection(db, "Teams"), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(data);
      setSelectedTeam(prev => (prev || (data.length > 0 ? data[0].id : "")));
    });
    return unsub;
  }, [authenticated]);

  if (!judgeId) {
    return (
      <div className="min-h-screen bg-[#0f0d13] flex items-center justify-center p-6 font-['Inter']">
        <div className="w-full max-w-md bg-zinc-950 border border-red-900/50 p-12 text-center shadow-2xl">
          <div className="text-6xl mb-6">🚫</div>
          <h2 className="text-red-500 font-black text-xl uppercase tracking-tighter mb-4">Unauthorized Access</h2>
          <p className="text-zinc-500 text-xs font-bold leading-relaxed uppercase tracking-widest">
            Please use the secure link provided to authenticated judges only.
          </p>
        </div>
      </div>
    );
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/judge/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judge_id: judgeId, pin: pinInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.detail || "Authentication failed");
        return;
      }
      setPin(pinInput);
      setAuthName(data.name || "");
      setAuthenticated(true);
      setPinInput("");
    } catch {
      setAuthError("Server connection failed");
    } finally {
      setAuthLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0f0d13] flex items-center justify-center p-6 font-['Inter']">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-zinc-950 border border-zinc-800 p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -ml-16 -mt-16"></div>
          <div className="relative z-10">
            <div className="text-[10px] font-black text-blue-500 tracking-[0.4em] uppercase mb-2">Restricted Access</div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase italic mb-6">Judge Authentication</h1>

            <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 mb-6">
              <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Judge ID</div>
              <div className="text-xs font-black text-zinc-300 uppercase">{judgeId}</div>
            </div>

            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">PIN</label>
            <input
              autoFocus
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.trim())}
              placeholder="Enter your secure PIN"
              className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-4 text-sm font-bold tracking-widest focus:outline-none focus:border-blue-600 mb-6"
            />

            {authError && (
              <div className="mb-6 p-3 text-[11px] font-bold uppercase tracking-widest text-center bg-red-600/20 text-red-500 border border-red-600/50">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading || pinInput.length < 6}
              className="w-full bg-blue-600 hover:bg-transparent border-2 border-blue-600 text-white font-black py-4 uppercase text-xs tracking-[0.3em] transition-all duration-300 disabled:opacity-50"
            >
              {authLoading ? "Verifying..." : "Authenticate"}
            </button>

            <p className="mt-6 text-[10px] text-zinc-600 uppercase tracking-widest text-center">
              PIN is held in memory only · Never persisted
            </p>
          </div>
        </form>
      </div>
    );
  }

  function setScore(field, max, value) {
    const v = Math.min(max, Math.max(0, Number(value)));
    setScores((prev) => ({ ...prev, [field]: v }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(`${API_BASE}/judge/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judge_id: judgeId,
          pin,
          team_id: selectedTeam,
          ...scores,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // PIN 변조/만료 시 재인증 유도
        if (res.status === 403) {
          setAuthenticated(false);
          setPin("");
          setAuthError(data.detail || "Re-authentication required.");
        }
        setStatus({ ok: false, message: data.detail || "오류가 발생했습니다." });
      } else {
        setStatus({ ok: true, message: `Evaluation complete! Total: ${data.total_score} / 50` });
      }
    } catch {
      setStatus({ ok: false, message: "Server connection failed" });
    } finally {
      setLoading(false);
    }
  }

  const total = scores.ai_moat + scores.bm_validity + scores.demo_completeness;
  const selectedTeamObj = useMemo(
    () => teams.find((t) => t.id === selectedTeam),
    [teams, selectedTeam]
  );
  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(
      (t) =>
        (t.name || "").toLowerCase().includes(q) ||
        (t.id || "").toLowerCase().includes(q) ||
        (t.society || "").toLowerCase().includes(q)
    );
  }, [teams, teamSearch]);

  function handleSelectTeam(teamId) {
    setSelectedTeam(teamId);
    setIsTeamModalOpen(false);
    setTeamSearch("");
  }

  return (
    <div className="min-h-screen bg-[#0f0d13] flex flex-col items-center justify-center p-6 font-['Inter']">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -ml-16 -mt-16"></div>
        
        <header className="relative z-10 mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <div className="text-[10px] font-black text-blue-500 tracking-[0.4em] uppercase mb-2">Internal Assessment</div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic">Judge Console</h1>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-sm">
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Authenticated</div>
            <div className="text-xs font-black text-zinc-300 uppercase">{authName ? `${authName} · ${judgeId}` : judgeId}</div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-10">
          <div>
            <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Target Entity for Evaluation</label>
            <button
              type="button"
              onClick={() => setIsTeamModalOpen(true)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white px-4 py-4 text-left text-sm font-bold focus:outline-none focus:border-blue-600 transition-colors hover:border-zinc-700"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white truncate">
                    {selectedTeamObj ? `${selectedTeamObj.name || selectedTeamObj.id}` : "Select a team"}
                  </div>
                  {selectedTeamObj && (
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">
                      {selectedTeamObj.id} · {selectedTeamObj.society || "?"}
                    </div>
                  )}
                </div>
                <span className="material-symbols-outlined text-zinc-400">expand_more</span>
              </div>
            </button>
          </div>

          <div className="space-y-8">
            <ScoreInput
              label="AI Moat (Technical Advantage)"
              max={20}
              value={scores.ai_moat}
              onChange={(v) => setScore("ai_moat", 20, v)}
            />
            <ScoreInput
              label="BM Validity (Business Logic)"
              max={15}
              value={scores.bm_validity}
              onChange={(v) => setScore("bm_validity", 15, v)}
            />
            <ScoreInput
              label="Demo Completeness (Execution)"
              max={15}
              value={scores.demo_completeness}
              onChange={(v) => setScore("demo_completeness", 15, v)}
            />
          </div>

          <div className="flex items-center justify-between py-6 border-y border-zinc-900">
            <div className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Aggregated Performance Score</div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tighter">{total}</span>
              <span className="text-lg font-black text-zinc-700">/ 50</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-transparent border-2 border-blue-600 text-white font-black py-5 uppercase text-xs tracking-[0.3em] transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Transmitting..." : "Submit Final Score"}
          </button>
        </form>

        {status && (
          <div className={`relative z-10 mt-8 p-4 text-[11px] font-bold uppercase tracking-widest text-center ${status.ok ? 'bg-green-600/20 text-green-500 border border-green-600/50' : 'bg-red-600/20 text-red-500 border border-red-600/50'}`}>
            {status.message}
          </div>
        )}
      </div>

      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 shadow-2xl">
            <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Entity</div>
                <h2 className="text-lg font-black text-white tracking-tight">Select Team</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTeamModalOpen(false);
                  setTeamSearch("");
                }}
                className="w-9 h-9 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              >
                ✕
              </button>
            </div>

            <div className="p-5 border-b border-zinc-900">
              <input
                autoFocus
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="Search by name / id / society"
                className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {filteredTeams.length === 0 ? (
                <div className="p-10 text-center text-zinc-500 text-sm">No teams found.</div>
              ) : (
                filteredTeams.map((team) => {
                  const isSelected = team.id === selectedTeam;
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => handleSelectTeam(team.id)}
                      className={`w-full text-left p-4 border-b border-zinc-900 hover:bg-zinc-900/70 transition-colors ${
                        isSelected ? "bg-blue-600/10" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-white font-bold truncate">{team.name || team.id}</div>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">
                            {team.id} · {team.society || "?"}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Selected</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreInput({ label, max, value, onChange }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
        <span className="text-sm font-black text-blue-500">{value} <span className="text-zinc-700 mx-1">/</span> {max}</span>
      </div>
      <input
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
}
