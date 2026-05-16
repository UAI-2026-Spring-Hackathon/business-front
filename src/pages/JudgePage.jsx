import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebase/config";

const API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";
const PAGE_SHELL = "min-h-screen bg-[#0f0d13] flex items-center justify-center p-6 font-['Inter']";

export default function JudgePage() {
  const [searchParams] = useSearchParams();
  const judgeId = searchParams.get("id") || "";

  const [teams, setTeams] = useState([]);
  const [myScores, setMyScores] = useState({});
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [finalScore, setFinalScore] = useState(0);
  const [scoreInput, setScoreInput] = useState("0");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");

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
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTeams(data);
    });
    return unsub;
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated || !judgeId) return;
    const q = query(collection(db, "Judge_Scores"), where("judge_id", "==", judgeId));
    const unsub = onSnapshot(q, (snap) => {
      const map = {};
      snap.docs.forEach((doc) => {
        const d = doc.data();
        if (d.team_id != null) {
          map[d.team_id] = d.total ?? 0;
        }
      });
      setMyScores(map);
    });
    return unsub;
  }, [authenticated, judgeId]);

  const editingTeam = useMemo(
    () => teams.find((t) => t.id === editingTeamId),
    [teams, editingTeamId]
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

  const scoredCount = useMemo(
    () => teams.filter((t) => myScores[t.id] != null).length,
    [teams, myScores]
  );

  function clampScore(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.min(50, Math.max(0, Math.round(n)));
  }

  function handleScoreInputChange(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length > 2) return;
    setScoreInput(digits);
    if (digits === "") return;
    const n = Number(digits);
    if (n <= 50) setFinalScore(n);
  }

  function openScoreForm(teamId) {
    setStatus(null);
    setEditingTeamId(teamId);
    const initial = myScores[teamId] ?? 0;
    setFinalScore(initial);
    setScoreInput(String(initial));
  }

  function closeScoreForm() {
    setEditingTeamId(null);
    setStatus(null);
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editingTeamId) return;
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(`${API_BASE}/judge/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judge_id: judgeId,
          pin,
          team_id: editingTeamId,
          total_score: Number(finalScore),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setAuthenticated(false);
          setPin("");
          setAuthError(data.detail || "Re-authentication required.");
          closeScoreForm();
        }
        setStatus({ ok: false, message: data.detail || "오류가 발생했습니다." });
      } else {
        setStatus({ ok: true, message: `Saved: ${data.total_score} / 50` });
        setTimeout(() => closeScoreForm(), 600);
      }
    } catch {
      setStatus({ ok: false, message: "Server connection failed" });
    } finally {
      setLoading(false);
    }
  }

  if (!judgeId) {
    return (
      <div className={PAGE_SHELL}>
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

  if (!authenticated) {
    return (
      <div className={PAGE_SHELL}>
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-zinc-950 border border-zinc-800 p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -ml-16 -mt-16" />
          <div className="relative z-10">
            <div className="text-[10px] font-black text-blue-500 tracking-[0.4em] uppercase mb-2">Restricted Access</div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase italic mb-2">Judge Authentication</h1>
            <p className="text-zinc-500 text-xs mb-6 uppercase tracking-widest">{judgeId}</p>
            {authError && (
              <p className="text-red-500 text-xs font-bold mb-4 uppercase">{authError}</p>
            )}
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="PIN"
              className="w-full bg-zinc-900 border border-zinc-800 px-4 py-4 text-center text-lg font-mono tracking-widest text-white mb-4 focus:outline-none focus:border-blue-600"
              required
            />
            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 uppercase tracking-widest text-xs"
            >
              {authLoading ? "Verifying..." : "Authenticate"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={PAGE_SHELL}>
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 p-8 md:p-10 shadow-2xl relative overflow-hidden">
        <header className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="text-[10px] font-black text-blue-500 tracking-[0.4em] uppercase mb-2">Final Score Entry</div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Judge Console</h1>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-2">50-point scale · Re-submit overwrites</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2">
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Progress</div>
            <div className="text-xs font-black text-zinc-300 uppercase">
              {scoredCount} / {teams.length} teams
            </div>
            <div className="text-[9px] text-zinc-500 mt-1">{authName ? `${authName} · ` : ""}{judgeId}</div>
          </div>
        </header>

        <input
          value={teamSearch}
          onChange={(e) => setTeamSearch(e.target.value)}
          placeholder="Search teams..."
          className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white mb-4 focus:outline-none focus:border-blue-600"
        />

        <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {filteredTeams.map((team) => {
            const scored = myScores[team.id] != null;
            const scoreVal = myScores[team.id];
            return (
              <li key={team.id}>
                <button
                  type="button"
                  onClick={() => openScoreForm(team.id)}
                  className="w-full flex items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 hover:border-blue-600/50 px-4 py-4 text-left transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-white uppercase tracking-tight truncate">{team.name}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                      {team.society} · {team.id}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {scored ? (
                      <>
                        <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Scored</div>
                        <div className="text-lg font-black text-white tabular-nums">{scoreVal} / 50</div>
                      </>
                    ) : (
                      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Tap to score</div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {editingTeamId && editingTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-zinc-950 border border-zinc-800 p-8 shadow-2xl animate-slide-up"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="text-[10px] font-black text-blue-500 tracking-[0.4em] uppercase mb-1">Final Score</div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">{editingTeam.name}</h2>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{editingTeam.society} · {editingTeam.id}</p>
              </div>
              <button type="button" onClick={closeScoreForm} className="text-zinc-500 hover:text-white text-xs font-bold uppercase">
                Close
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-end justify-between gap-4 mb-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Score (0–50)</span>
                <div className="flex items-baseline gap-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={scoreInput}
                    onChange={(e) => handleScoreInputChange(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onBlur={() => {
                      const clamped = clampScore(scoreInput === "" ? 0 : scoreInput);
                      setFinalScore(clamped);
                      setScoreInput(String(clamped));
                    }}
                    className="w-20 bg-zinc-900 border border-zinc-700 text-right text-3xl font-black text-white tabular-nums px-2 py-1 focus:outline-none focus:border-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-sm font-bold text-zinc-500">/ 50</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={finalScore}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setFinalScore(v);
                  setScoreInput(String(v));
                }}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[9px] text-zinc-600 font-bold uppercase mt-1">
                <span>0</span>
                <span>50</span>
              </div>
            </div>

            {status && (
              <p className={`text-xs font-bold mb-4 uppercase ${status.ok ? "text-emerald-500" : "text-red-500"}`}>
                {status.message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 uppercase tracking-widest text-xs"
            >
              {loading ? "Saving..." : myScores[editingTeamId] != null ? "Update Score" : "Submit Score"}
            </button>
          </form>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
      ` }} />
    </div>
  );
}
