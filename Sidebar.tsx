
import React, { useState, useRef, useEffect } from 'react';
import { AppMode, ChatSession } from '../types';

interface SidebarProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onOpenAdmin: () => void;
  onOpenPersonalization: () => void;
  isPrivacyMode: boolean;
  setIsPrivacyMode: (val: boolean) => void;
  userName: string;
  onLogout: () => void;
  onUpgrade: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const MarkhorLogoImg = ({ className }: { className?: string }) => (
  <div className={`relative ${className} flex items-center justify-center`}>
    <div className="absolute inset-0 bg-emerald-500/10 blur-[8px] rounded-full animate-pulse"></div>
    <svg className="w-full h-full relative z-10" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' }}>
      <path d="M100 180C100 180 140 140 140 90C140 60 120 40 100 40C80 40 60 60 60 90C60 140 100 180 100 180Z" fill="#10B981" fill-opacity="0.2"/>
      <path d="M100 40V180M60 90C60 40 80 20 100 20C120 20 140 40 140 90M65 85C65 45 35 35 25 65C15 95 45 105 65 85ZM135 85C135 45 165 35 175 65C185 95 155 105 135 85Z" stroke="#10B981" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M80 120L100 140L120 120" stroke="#10B981" stroke-width="6" stroke-linecap="round"/>
    </svg>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  mode, 
  setMode, 
  sessions, 
  currentSessionId, 
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll,
  onOpenAdmin,
  onOpenPersonalization,
  isPrivacyMode,
  setIsPrivacyMode,
  userName,
  onLogout,
  onUpgrade,
  isOpen = true,
  onClose
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const operatorId = userName ? `@${userName.toLowerCase().replace(/\s/g, '')}` : '@operator01';

  return (
    <div className={`fixed lg:static inset-y-0 left-0 w-72 border-r border-white/5 flex flex-col h-screen transition-all duration-500 ease-in-out z-[60] ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isPrivacyMode ? 'bg-[#000201]' : 'bg-[#010203]/95 backdrop-blur-3xl'}`}>
      
      <button onClick={onClose} className="lg:hidden absolute top-6 right-4 text-slate-500 hover:text-white p-2">
        <i className="fa-solid fa-chevron-left"></i>
      </button>

      <div className="p-8">
        <div className="relative mb-8" ref={userMenuRef}>
          <button 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`w-full text-left bg-white/5 p-4 rounded-3xl border transition-all ${isUserMenuOpen ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/5 hover:border-emerald-500/20'}`}
          >
             <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center overflow-hidden">
                   <MarkhorLogoImg className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mono">ID Protocol</p>
                  <p className="text-sm font-black text-white uppercase truncate">{userName || 'OPERATOR'}</p>
                </div>
             </div>
             <div className="flex items-center justify-between px-1">
                <span className="text-[7px] font-bold text-emerald-900 uppercase tracking-widest mono">Clearance: Omega</span>
                <i className={`fa-solid fa-chevron-down text-[8px] text-slate-600 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}></i>
             </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full left-0 mt-3 w-72 bg-[#070a09] border border-white/10 rounded-[2rem] shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200">
               <div className="p-5 border-b border-white/5 bg-white/5">
                  <p className="text-sm font-black text-white">{userName || 'Operator'}</p>
                  <p className="text-[10px] text-slate-500 mono">{operatorId}</p>
               </div>
               <div className="p-2 space-y-1">
                  <MenuOption icon="fa-sliders" label="Neural Persona" onClick={() => { onOpenPersonalization(); setIsUserMenuOpen(false); }} />
                  <MenuOption icon="fa-right-from-bracket" label="Disconnect" isDanger onClick={() => { onLogout(); setIsUserMenuOpen(false); }} />
               </div>
            </div>
          )}
        </div>

        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl bg-emerald-700 border border-emerald-500/40 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg"
        >
          <i className="fa-solid fa-plus"></i>
          <span>New Mission</span>
        </button>
      </div>

      <nav className="px-4 space-y-1 mb-6">
        <NavButton active={mode === AppMode.CHAT} onClick={() => setMode(AppMode.CHAT)} icon="fa-brain" label="Neural Recon" />
        <NavButton active={mode === AppMode.IMAGE_GEN} onClick={() => setMode(AppMode.IMAGE_GEN)} icon="fa-fingerprint" label="Visual Synth" />
        <NavButton active={mode === AppMode.VIDEO_GEN} onClick={() => setMode(AppMode.VIDEO_GEN)} icon="fa-clapperboard" label="Motion Intel" />
        <NavButton active={mode === AppMode.LIVE} onClick={() => setMode(AppMode.LIVE)} icon="fa-satellite-dish" label="Tactical Link" isLive />
      </nav>

      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mono px-5 py-4">Tactical Logs</p>
        <div className="space-y-1">
          {sessions.map(session => (
            <div key={session.id} className="group relative">
              <button
                onClick={() => onSelectSession(session.id)}
                className={`w-full text-left px-5 py-3 rounded-2xl transition-all relative truncate pr-12 ${
                  currentSessionId === session.id ? 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20' : 'text-slate-500 hover:bg-white/5'
                }`}
              >
                <span className="text-[12px] font-bold">{session.title || 'Mission Record'}</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }} 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-red-500 opacity-20 group-hover:opacity-100 transition-all z-10 hover:scale-125"
                title="Erase mission log"
              >
                <i className="fa-solid fa-trash-can text-[10px]"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 mt-auto">
        <button 
          onClick={onOpenAdmin}
          className="w-full flex items-center gap-5 p-5 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group bg-black/40 shadow-xl"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center border border-white/10 group-hover:bg-emerald-600 transition-colors">
            <MarkhorLogoImg className="w-10 h-10 opacity-80 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-black text-white uppercase tracking-widest mono leading-none">Command Hub</p>
            <p className="text-[9px] text-slate-700 mt-1 uppercase mono">Global Oversight</p>
          </div>
        </button>
      </div>
    </div>
  );
};

const MenuOption: React.FC<{ icon: string; label: string; onClick: () => void; isDanger?: boolean }> = ({ icon, label, onClick, isDanger }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all group ${isDanger ? 'text-red-900 hover:bg-red-500/10 hover:text-red-500' : 'text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400'}`}>
    <i className={`fa-solid ${icon} w-5 text-center text-sm opacity-60`}></i>
    <span className="text-[13px] font-bold">{label}</span>
  </button>
);

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string; isLive?: boolean }> = ({ active, onClick, icon, label, isLive }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-5 px-6 py-4 rounded-2xl transition-all font-black text-[11px] relative uppercase tracking-[0.1em] ${active ? 'bg-emerald-500/10 text-white border border-emerald-500/20 shadow-inner' : 'text-slate-700 hover:text-slate-300'}`}>
    <i className={`fa-solid ${icon} w-6 text-center text-lg ${active ? 'text-emerald-500' : 'text-slate-800'}`}></i>
    <span>{label}</span>
    {isLive && <span className="absolute right-5 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
  </button>
);

export default Sidebar;
