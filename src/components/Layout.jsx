import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Layout({ children, totalVolume, timeLeft, onRunSettlement, loadingSettlement }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'DASHBOARD', path: '/dashboard', icon: 'grid_view' },
    { name: 'DISTRICTS', path: '/districts', icon: 'map' },
    { name: 'TICKER', path: '/ticker', icon: 'list_alt' },
    { name: 'ANALYTICS', path: '/analytics', icon: 'query_stats' },
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="flex flex-col h-screen bg-[#0f0d13] text-[#e6e0e9] font-['Inter']">
      {/* TopAppBar */}
      <header className="bg-zinc-950 text-zinc-50 font-['Inter'] uppercase tracking-tighter font-black docked full-width top-0 border-b border-zinc-800 flex justify-between items-center px-4 md:px-6 h-16 w-full z-50">
        <div className="flex items-center">
          <button 
            className="lg:hidden mr-4 text-zinc-400 hover:text-white transition-colors"
            onClick={toggleMobileMenu}
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <div className="text-sm md:text-lg font-black tracking-widest text-zinc-50 cursor-pointer truncate max-w-[180px] md:max-w-none" onClick={() => navigate('/dashboard')}>
            <span className="hidden sm:inline">2-UNIVERSITY LIVE FUNDING DASHBOARD</span>
            <span className="sm:hidden text-blue-500">LIVE DASHBOARD</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 md:space-x-8">
          {onRunSettlement && (
            <button 
              className={`text-[9px] md:text-[10px] font-bold border border-zinc-800 px-2 md:px-3 py-1 hover:bg-zinc-800 transition-colors hidden sm:block ${loadingSettlement ? 'opacity-50' : ''}`}
              onClick={onRunSettlement}
              disabled={loadingSettlement}
            >
              {loadingSettlement ? 'PROCESSING...' : 'RUN SETTLEMENT'}
            </button>
          )}
          <div className="flex flex-col items-end">
            <span className="text-[8px] md:text-[10px] text-zinc-500 font-bold tracking-[0.2em] leading-none mb-1">VOLUME</span>
            <span className="text-sm md:text-xl font-black leading-none">{totalVolume?.toLocaleString() || 0}</span>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="flex flex-col items-end">
              <span className="text-[8px] md:text-[10px] text-zinc-500 font-bold tracking-[0.2em] leading-none mb-1">TIME</span>
              <span className="text-sm md:text-xl font-black text-blue-500 leading-none">{timeLeft || "00:00:00"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Side Drawer */}
      <div className={`fixed top-0 left-0 bottom-0 w-72 bg-zinc-950 z-[70] transform transition-transform duration-300 ease-in-out lg:hidden border-r border-zinc-800 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <div className="text-xl font-black text-zinc-50">STRATEGIC OPS</div>
            <div className="text-[10px] text-zinc-500 tracking-[0.3em] mt-1 uppercase">LIVE DASHBOARD</div>
          </div>
          <button onClick={toggleMobileMenu} className="text-zinc-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="flex-1 mt-4">
          {navItems.map((item) => (
            <div 
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsMobileMenuOpen(false);
              }}
              className={`${location.pathname === item.path ? 'bg-zinc-900 text-white border-l-4 border-blue-600' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'} flex items-center px-6 py-5 transition-all duration-100 cursor-pointer uppercase text-xs font-bold tracking-widest`}
            >
              <span className="material-symbols-outlined mr-4">{item.icon}</span>
              {item.name}
            </div>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-zinc-800 text-zinc-600 text-[9px] leading-relaxed uppercase bg-zinc-950">
          SYSTEM STATUS: ACTIVE<br />
          ENCRYPTION: AES-256<br />
          LATENCY: 14MS
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* SideNavBar (Desktop Only) */}
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
      <footer className="h-8 bg-zinc-950 border-t border-zinc-800 px-4 md:px-6 flex items-center justify-between text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest z-50">
        <div className="flex items-center space-x-4 md:space-x-6">
          <span className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-green-500"></span> 
            <span className="hidden sm:inline">Network Stable</span>
            <span className="sm:hidden">Stable</span>
          </span>
          <span className="hidden xs:inline">API: v2.4.0-PRIME</span>
        </div>
        <div className="truncate ml-4">
          NODE: KU-YU-2026
        </div>
      </footer>
    </div>
  );
}
