import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children, totalVolume, timeLeft, onRunSettlement, loadingSettlement }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'DASHBOARD', path: '/dashboard', icon: 'grid_view' },
    { name: 'DISTRICTS', path: '/districts', icon: 'map' },
    { name: 'TICKER', path: '/ticker', icon: 'list_alt' },
    { name: 'ANALYTICS', path: '/analytics', icon: 'query_stats' },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#0f0d13] text-[#e6e0e9] font-['Inter']">
      {/* TopAppBar */}
      <header className="bg-zinc-950 text-zinc-50 font-['Inter'] uppercase tracking-tighter font-black docked full-width top-0 border-b border-zinc-800 flex justify-between items-center px-6 h-16 w-full z-50">
        <div className="text-lg font-black tracking-widest text-zinc-50 cursor-pointer" onClick={() => navigate('/dashboard')}>
          2-UNIVERSITY LIVE FUNDING DASHBOARD
        </div>
        <div className="flex items-center space-x-8">
          {onRunSettlement && (
            <button 
              className={`text-[10px] font-bold border border-zinc-800 px-3 py-1 hover:bg-zinc-800 transition-colors ${loadingSettlement ? 'opacity-50' : ''}`}
              onClick={onRunSettlement}
              disabled={loadingSettlement}
            >
              {loadingSettlement ? 'PROCESSING...' : 'RUN SETTLEMENT'}
            </button>
          )}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em]">TOTAL VOLUME</span>
            <span className="text-xl font-black">{totalVolume?.toLocaleString() || 0} COINS</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-zinc-500 font-bold tracking-[0.2em]">TIME LEFT</span>
              <span className="text-xl font-black text-blue-500">{timeLeft || "00:00:00"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SideNavBar */}
        <nav className="bg-zinc-950 text-zinc-50 font-['Inter'] text-xs font-bold uppercase tracking-widest fixed left-0 top-16 bottom-8 flex flex-col z-40 w-64 border-r border-zinc-800 hidden lg:flex">
          <div className="p-6 border-b border-zinc-800">
            <div className="text-xl font-black text-zinc-50">STRATEGIC OPS</div>
            <div className="text-[10px] text-zinc-500 tracking-[0.3em] mt-1 uppercase">LIVE DASHBOARD</div>
          </div>
          <div className="flex-1">
            {navItems.map((item) => (
              <div 
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`${location.pathname === item.path ? 'bg-zinc-900 text-white border-l-4 border-blue-600' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'} flex items-center px-6 py-4 transition-all duration-100 cursor-pointer`}
              >
                <span className="material-symbols-outlined mr-4">{item.icon}</span>
                {item.name}
              </div>
            ))}
          </div>
          <div className="p-6 border-t border-zinc-800 text-zinc-600 text-[9px] leading-relaxed uppercase">
            SYSTEM STATUS: ACTIVE<br />
            ENCRYPTION: AES-256<br />
            LATENCY: 14MS
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 overflow-y-auto no-scrollbar relative">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="h-8 bg-zinc-950 border-t border-zinc-800 px-6 flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest z-50">
        <div className="flex items-center space-x-6">
          <span className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-green-500"></span> 
            <span>Network Stable</span>
          </span>
          <span>API: v2.4.0-PRIME</span>
        </div>
        <div>
          NODE-ID: KU-YU-HACK-2024-OXD7
        </div>
      </footer>
    </div>
  );
}
