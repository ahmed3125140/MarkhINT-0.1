
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/databaseService';

interface AdminDashboardProps {
  onClose: () => void;
}

const StealthMarkhorLogo = ({ className }: { className?: string }) => (
  <img 
    src="https://i.ibb.co/LhyYv3m/markhor-head.png" 
    alt="High Command Seal" 
    className={`${className} object-contain`}
    style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.4))' }}
  />
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [globalSessions, setGlobalSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [showSql, setShowSql] = useState(false);

  const isConfigured = dbService.isConfigured();

  useEffect(() => {
    if (isConfigured) loadData();
    else setLoading(false);
  }, [isConfigured]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await dbService.getAllSessions();
      setGlobalSessions(data || []);
    } catch (err) {
      console.error("Link Failure", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("CRITICAL: Erase this mission record from the cloud network? This action is irreversible.")) {
      await dbService.deleteSession(id);
      if (selectedSession?.id === id) setSelectedSession(null);
      loadData();
    }
  };

  const sqlCommand = `
CREATE TABLE IF NOT EXISTS aura_sessions (
  id UUID PRIMARY KEY,
  user_name TEXT,
  title TEXT,
  messages JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  app_mode TEXT
);
ALTER TABLE aura_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All Access" ON aura_sessions FOR ALL USING (true) WITH CHECK (true);
  `.trim();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-12 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-300">
      <div className="w-full max-w-7xl h-[92vh] bg-[#020403] border border-white/5 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Top Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
              <StealthMarkhorLogo className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Command Hub</h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1 mono">Global Network Monitor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSql(!showSql)} className="px-5 py-3 bg-slate-900 border border-white/5 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-white transition-all mono">SQL Schema</button>
            <button onClick={onClose} className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-all border border-white/5"><i className="fa-solid fa-xmark text-lg"></i></button>
          </div>
        </div>

        {showSql && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 w-full max-w-3xl z-[210] animate-in fade-in slide-in-from-top-4 p-4">
            <div className="bg-[#050806] border border-emerald-500/30 rounded-[2rem] p-10 shadow-[0_0_100px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-white font-black uppercase tracking-widest text-xs">Database Protocol</h3>
                 <button onClick={() => setShowSql(false)} className="text-slate-500 hover:text-white"><i className="fa-solid fa-times"></i></button>
              </div>
              <pre className="bg-black/50 p-6 rounded-2xl border border-white/5 text-[11px] text-emerald-500 font-mono overflow-x-auto leading-relaxed">
                {sqlCommand}
              </pre>
            </div>
          </div>
        )}

        {!isConfigured ? (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <StealthMarkhorLogo className="w-32 h-32 opacity-10 mb-10" />
            <h3 className="text-4xl font-black text-white mb-6 uppercase">Link Offline</h3>
            <p className="text-slate-600 max-w-lg font-medium text-lg">Supabase credentials required for cloud synchronization.</p>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-white/5 overflow-y-auto p-6 space-y-4 bg-black/20 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-60 opacity-30">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-[9px] font-black uppercase tracking-widest mono">Scanning Grid...</p>
                </div>
              ) : (
                globalSessions.map((s) => (
                  <div key={s.id} className="relative group">
                    <button
                      onClick={() => setSelectedSession(s)}
                      className={`w-full text-left p-6 rounded-[1.5rem] border transition-all ${
                        selectedSession?.id === s.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-transparent hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mono">{s.user_name || 'OPERATOR'}</span>
                        <span className="text-[9px] text-slate-600 font-bold mono">{new Date(s.updated_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-base font-black text-slate-100 truncate pr-10 tracking-tight">{s.title || 'Strategic Ops'}</p>
                    </button>
                    <button 
                      onClick={(e) => deleteSession(e, s.id)} 
                      className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-slate-400 hover:text-red-500 opacity-50 group-hover:opacity-100 transition-all z-10 hover:scale-125"
                      title="Erase mission record"
                    >
                      <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Content View */}
            <div className="flex-1 overflow-y-auto bg-[#000000] p-12 custom-scrollbar">
              {selectedSession ? (
                <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-4">
                  <div className="border-b border-white/5 pb-10 mb-10">
                    <h1 className="text-7xl font-black text-white mb-6 tracking-tighter uppercase leading-none">{selectedSession.title || 'STRATEGIC OPS'}</h1>
                    <div className="flex items-center gap-6">
                      <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mono">Operator: <span className="text-white">{selectedSession.user_name}</span></p>
                      <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                      <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest mono">Status: <span className="text-emerald-500">ARCHIVED</span></p>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    {selectedSession.messages?.length > 0 ? (
                      selectedSession.messages.map((m: any, idx: number) => (
                        <div key={idx} className={`flex gap-6 ${m.role === 'user' ? 'flex-row-reverse text-right' : ''}`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${m.role === 'user' ? 'bg-white/5 border-white/10' : 'bg-slate-900 border-emerald-500/20'}`}>
                             {m.role === 'user' ? <i className="fa-solid fa-user text-slate-600 text-sm"></i> : <StealthMarkhorLogo className="w-8 h-8" />}
                          </div>
                          <div className={`max-w-[85%] p-8 rounded-[2rem] text-base border leading-relaxed ${m.role === 'user' ? 'bg-white/5 text-slate-200 border-white/10' : 'bg-emerald-500/5 text-slate-300 border-emerald-500/10'}`}>
                            {m.content}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center opacity-20">
                         <i className="fa-solid fa-ghost text-4xl mb-4"></i>
                         <p className="text-[10px] font-black uppercase tracking-widest mono">Empty Mission Log</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <StealthMarkhorLogo className="w-40 h-40 mb-8" />
                  <p className="text-[11px] font-black uppercase tracking-[1.2em] text-white mono">Standby Mode</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
