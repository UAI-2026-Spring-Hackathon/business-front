import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc } from "firebase/firestore";
import { db } from "../firebase/config";

const DataContext = createContext();
const API_BASE = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

function formatDuration(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const hrs = String(Math.floor(safe / 3600)).padStart(2, "0");
  const mins = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const secs = String(safe % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

function parseDateLike(value) {
  if (!value) return null;
  if (value?.toDate) return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function DataProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settlement, setSettlement] = useState(null);
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const [status, setStatus] = useState({ is_investment_open: false, investment_end_time_utc: null });
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, "Teams"), (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.weighted_valuation || 0) - (a.weighted_valuation || 0));
      setTeams(data);
    });

    const unsubSettlement = onSnapshot(doc(db, "Settlement_Results", "latest"), (snap) => {
      if (snap.exists()) {
        setSettlement(snap.data());
      } else {
        // Clear stale settlement UI when reset deletes Settlement_Results/latest.
        setSettlement(null);
      }
    });

    const txQuery = query(
      collection(db, "Transactions"),
      orderBy("timestamp", "desc"),
      limit(500)
    );
    const unsubTx = onSnapshot(txQuery, (snap) => {
      const txData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTransactions(txData);
    });

    const unsubConfig = onSnapshot(doc(db, "SystemConfig", "status"), (snap) => {
      if (snap.exists()) {
        setStatus(snap.data());
      }
    });

    return () => {
      unsubTeams();
      unsubTx();
      unsubSettlement();
      unsubConfig();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const syncServerClock = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/status`);
        const data = await res.json();
        const serverNow = parseDateLike(data.server_time_utc);
        if (mounted && serverNow) {
          setServerOffsetMs(serverNow.getTime() - Date.now());
        }
      } catch (e) {
        // Keep last known offset if network is unstable.
      }
    };

    syncServerClock();
    const timer = setInterval(syncServerClock, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const updateTimeLeft = () => {
      if (!status?.is_investment_open) {
        setTimeLeft("HALTED");
        return;
      }

      const endTime = parseDateLike(status.investment_end_time_utc);
      if (!endTime) {
        setTimeLeft("00:00:00");
        return;
      }

      const remainingMs = endTime.getTime() - (Date.now() + serverOffsetMs);
      if (remainingMs <= 0) {
        setTimeLeft("00:00:00");
        return;
      }
      setTimeLeft(formatDuration(remainingMs / 1000));
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [status, serverOffsetMs]);

  const totalVolume = teams.reduce((sum, t) => sum + (t.total_invested_coins || 0), 0);

  return (
    <DataContext.Provider value={{ teams, transactions, settlement, timeLeft, totalVolume }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
