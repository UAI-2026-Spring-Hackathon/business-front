import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, doc } from "firebase/firestore";
import { db } from "../firebase/config";

const DataContext = createContext();

export function DataProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settlement, setSettlement] = useState(null);
  const [timeLeft, setTimeLeft] = useState("02:14:55");

  useEffect(() => {
    const unsubTeams = onSnapshot(collection(db, "Teams"), (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.weighted_valuation || 0) - (a.weighted_valuation || 0));
      setTeams(data);
    });

    const unsubSettlement = onSnapshot(doc(db, "Settlement_Results", "latest"), (snap) => {
      if (snap.exists()) {
        setSettlement(snap.data());
      }
    });

    const txQuery = query(
      collection(db, "Transactions"),
      orderBy("timestamp", "desc"),
      limit(50) // Increased limit for dedicated ticker page
    );
    const unsubTx = onSnapshot(txQuery, (snap) => {
      const txData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (txData.length === 0) {
        setTransactions([
          { id: "tx_mock_1", investor_society: "KU", coins: 5, target_team_id: "team_01", multiplier: 1.0, timestamp: new Date() },
          { id: "tx_mock_2", investor_society: "YU", coins: 10, target_team_id: "team_02", multiplier: 1.2, timestamp: new Date(Date.now() - 60000) },
          { id: "tx_mock_3", investor_society: "KU", coins: 2, target_team_id: "team_02", multiplier: 1.2, timestamp: new Date(Date.now() - 120000) },
          { id: "tx_mock_4", investor_society: "YU", coins: 7, target_team_id: "team_03", multiplier: 1.0, timestamp: new Date(Date.now() - 180000) },
          { id: "tx_mock_5", investor_society: "KU", coins: 15, target_team_id: "team_01", multiplier: 1.0, timestamp: new Date(Date.now() - 240000) },
        ]);
      } else {
        setTransactions(txData);
      }
    });

    const unsubConfig = onSnapshot(doc(db, "SystemConfig", "status"), (snap) => {
      if (snap.exists()) {
        const config = snap.data();
        if (config.is_investment_open === false) {
          setTimeLeft("HALTED");
        }
      }
    });

    return () => {
      unsubTeams();
      unsubTx();
      unsubSettlement();
      unsubConfig();
    };
  }, []);

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
