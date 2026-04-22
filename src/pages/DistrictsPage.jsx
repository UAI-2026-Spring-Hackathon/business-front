import React from "react";
import { useData } from "../context/DataContext";
import Layout from "../components/Layout";
import TeamGrid from "../components/TeamGrid";

export default function DistrictsPage() {
  const { teams, timeLeft, totalVolume } = useData();

  return (
    <Layout totalVolume={totalVolume} timeLeft={timeLeft}>
      <div className="p-8">
        <header className="mb-8">
          <div className="text-[10px] font-black text-blue-500 tracking-[0.4em] uppercase mb-2">Operation Area</div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Electoral Districts</h1>
          <p className="text-zinc-500 text-xs font-bold mt-2 uppercase tracking-widest">Performance monitoring for all competing academic societies</p>
        </header>

        <div className="bg-zinc-950 border border-zinc-800 shadow-2xl">
          <TeamGrid teams={teams} />
        </div>
      </div>
    </Layout>
  );
}
