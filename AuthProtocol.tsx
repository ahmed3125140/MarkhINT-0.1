
import React, { useState, useEffect } from 'react';

interface AuthProtocolProps {
  onAuthorize: (callsign: string) => void;
}

const StealthMarkhorLogo = ({ className }: { className?: string }) => (
  <img 
    src="https://i.ibb.co/LhyYv3m/markhor-head.png" 
    alt="Neural Protocol Identity" 
    className={`${className} object-contain`}
    style={{ filter: 'drop-shadow(0 0 15px rgba(148, 163, 184, 0.3)) contrast(1.1)' }}
  />
);

const AuthProtocol: React.FC<AuthProtocolProps> = ({ onAuthorize }) => {
  const [callsign, setCallsign] = useState('');
  const [stage, setStage] = useState<'IDLE' | 'SCANNING' | 'AUTHORIZED'>('IDLE');
  const [progress, setProgress] = useState(0);

  const handleAuthorize = () => {
    if (!callsign.trim()) return;
    setStage('SCANNING');
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 20;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => {
          setStage('AUTHORIZED');
          setTimeout(() => onAuthorize(callsign), 800);
        }, 500);
      }
      setProgress(p);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      
      <div className="relative w-full max-w-xl animate-in zoom-in duration-700">
        <div className={`p-16 rounded-[4rem] border transition-all duration-1000 ${stage === 'SCANNING' ? 'border-emerald-500/50 shadow-[0_0_100px_rgba(16,185,129,0.2)]' : 'border-white/5 bg-white/5 backdrop-blur-3xl shadow-2xl'}`}>
          
          <div className="flex flex-col items-center text-center space-y-12">
            <div className="relative">
              <div className={`absolute inset-0 blur-[60px] transition-colors duration-1000 ${stage === 'SCANNING' ? 'bg-emerald-500/40' : 'bg-slate-500/20'}`}></div>
              <StealthMarkhorLogo className={`w-36 h-36 relative transition-all duration-1000 ${stage === 'SCANNING' ? 'scale-110 brightness-125' : ''}`} />
            </div>

            <div className="space-y-4">
              <h2 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Access <span className="text-emerald-500">Grid</span></h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.6em] mono">Tactical Link Calibration</p>
            </div>

            {stage === 'IDLE' ? (
              <div className="w-full space-y-6">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Enter Operator Callsign" 
                  value={callsign}
                  onChange={(e) => setCallsign(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuthorize()}
                  className="w-full bg-black/40 border border-white/10 rounded-3xl px-10 py-8 text-white font-bold placeholder-slate-700 text-xl focus:outline-none focus:border-emerald-500/40 transition-all uppercase tracking-widest text-center mono"
                />
                <button 
                  onClick={handleAuthorize}
                  className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-black py-8 rounded-3xl transition-all shadow-2xl text-xs uppercase tracking-[0.4em] active:scale-95 flex items-center justify-center gap-4"
                >
                  <i className="fa-solid fa-fingerprint text-xl"></i>
                  Initialize Mission
                </button>
              </div>
            ) : (
              <div className="w-full space-y-8 py-10">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mono animate-pulse">Bio-Metric Scan...</span>
                  <span className="text-sm font-black text-white mono">{Math.floor(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div className="h-full bg-gradient-to-r from-slate-400 to-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthProtocol;
