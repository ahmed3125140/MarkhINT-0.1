
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, AppMode, AspectRatio } from '../types';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string, isDeepResearch?: boolean, isThinking?: boolean) => void;
  isLoading: boolean;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isPrivacyMode?: boolean;
  hasVeoKey?: boolean;
  onOpenKeyPicker?: () => void;
  aspectRatio?: AspectRatio;
  setAspectRatio?: (ratio: AspectRatio) => void;
}

export const StealthMarkhorLogo = ({ className }: { className?: string }) => (
  <div className={`relative ${className} flex items-center justify-center`}>
    <svg className="w-full h-full relative z-10" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.6))' }}>
      <path d="M100 180C100 180 140 140 140 90C140 60 120 40 100 40C80 40 60 60 60 90C60 140 100 180 100 180Z" fill="#10B981" fill-opacity="0.15"/>
      <path d="M100 40V180M60 90C60 40 80 20 100 20C120 20 140 40 140 90M65 85C65 45 35 35 25 65C15 95 45 105 65 85ZM135 85C135 45 165 35 175 65C185 95 155 105 135 85Z" stroke="#10B981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M80 120L100 140L120 120" stroke="#10B981" stroke-width="4" stroke-linecap="round"/>
    </svg>
  </div>
);

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  mode, 
  isPrivacyMode, 
  hasVeoKey, 
  onOpenKeyPicker,
  aspectRatio = "1:1",
  setAspectRatio
}) => {
  const [input, setInput] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isDeepResearch, setIsDeepResearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input, isDeepResearch, isThinking);
    setInput('');
  };

  const lastImage = [...messages].reverse().find(m => m.metadata?.imageUrl);
  const isEditMode = mode === AppMode.IMAGE_GEN && !!lastImage;

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative overflow-hidden">
       {/* Top Status Bar */}
       {(mode === AppMode.IMAGE_GEN || mode === AppMode.VIDEO_GEN) && (
          <div className="absolute top-0 left-0 right-0 z-30 p-4 lg:p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-widest mono ${isEditMode ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
                   {mode === AppMode.IMAGE_GEN ? (isEditMode ? 'Edit Mode Protocol' : 'Creation Mode Active') : 'Motion Synth Active'}
                </div>
                {mode === AppMode.VIDEO_GEN && !hasVeoKey && (
                   <button onClick={onOpenKeyPicker} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg">
                      <i className="fa-solid fa-key mr-2"></i> Select Key
                   </button>
                )}
             </div>
             
             <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mono mr-2">Aspect Ratio</span>
                <div className="flex bg-black/40 border border-white/5 rounded-xl overflow-hidden p-1 gap-1">
                   {(mode === AppMode.IMAGE_GEN ? ["1:1", "4:3", "3:4", "16:9", "9:16"] : ["16:9", "9:16"]).map(ratio => (
                      <button 
                        key={ratio}
                        onClick={() => setAspectRatio?.(ratio as AspectRatio)}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black mono transition-all ${aspectRatio === ratio ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                      >
                         {ratio}
                      </button>
                   ))}
                </div>
             </div>
          </div>
       )}

       <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-10 pt-20 lg:pt-24 space-y-10 custom-scrollbar relative z-10">
          {messages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center space-y-12">
                <div className="relative group">
                   <div className="absolute inset-0 bg-emerald-500/10 blur-[140px] rounded-full scale-150 group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
                   <div className="relative animate-float">
                      <StealthMarkhorLogo className="w-64 h-64 lg:w-80 lg:h-80 relative z-10 animate-pulse-slow" />
                   </div>
                </div>
                <div className="text-center space-y-6">
                   <p className="text-[14px] font-black uppercase tracking-[2em] text-emerald-500/60 mono pl-[2em]">Neural Network Standby</p>
                   <div className="flex flex-col items-center justify-center gap-4">
                      <div className="h-[1px] w-48 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent"></div>
                      <p className="text-slate-700 text-[10px] uppercase mono font-bold tracking-[0.6em]">Awaiting Strategic Protocol Initiation</p>
                   </div>
                </div>
             </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 lg:gap-8 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                 <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border ${msg.role === 'user' ? 'bg-slate-900 border-white/10' : 'bg-black/60 border-emerald-500/20 shadow-2xl overflow-hidden'}`}>
                    {msg.role === 'user' ? <i className="fa-solid fa-user-shield text-slate-500"></i> : <StealthMarkhorLogo className="w-12 h-12" />}
                 </div>
                 <div className={`max-w-[85%] lg:max-w-[75%] space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`p-6 lg:p-8 rounded-[2.5rem] border backdrop-blur-3xl shadow-2xl markdown-content ${msg.role === 'user' ? 'bg-white/5 text-slate-100 border-white/10' : 'bg-black/40 text-slate-200 border-white/5'}`}>
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                       {msg.metadata?.imageUrl && (
                          <div className="mt-6 relative group">
                             <img src={msg.metadata.imageUrl} className="rounded-3xl border border-white/5 w-full shadow-2xl transition-transform group-hover:scale-[1.01]" />
                             <div className="absolute inset-0 rounded-3xl bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                          </div>
                       )}
                       {msg.metadata?.videoUrl && <video src={msg.metadata.videoUrl} controls className="mt-6 rounded-3xl border border-white/5 w-full shadow-2xl" />}
                    </div>
                 </div>
              </div>
            ))
          )}
          {isLoading && (
             <div className="flex gap-4 lg:gap-8 opacity-50 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-slate-900"></div>
                <div className="flex-1 space-y-4">
                   <div className="h-4 bg-white/5 rounded-full w-2/3"></div>
                   <div className="h-32 bg-white/5 rounded-[2.5rem] w-full"></div>
                </div>
             </div>
          )}
       </div>

       <div className="p-4 lg:p-10 bg-gradient-to-t from-black via-transparent to-transparent z-20">
          <div className="max-w-4xl mx-auto">
             <form onSubmit={handleSubmit} className="relative">
                <div className={`relative flex items-center gap-4 bg-[#0a0f0d]/90 backdrop-blur-3xl border rounded-[3.5rem] p-3 transition-all duration-500 ${isThinking ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-white/10'}`}>
                   <button type="button" onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-emerald-500 transition-colors"><i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-plus'}`}></i></button>
                   {isMenuOpen && (
                     <div className="absolute bottom-full left-0 mb-6 w-72 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 z-[100] animate-in fade-in slide-in-from-bottom-4 shadow-2xl">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 px-2">Operation Mode</p>
                        <button type="button" onClick={() => { setIsDeepResearch(!isDeepResearch); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isDeepResearch ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:bg-white/5'}`}><i className="fa-solid fa-bolt-lightning"></i><span className="text-[11px] font-black uppercase tracking-widest">Deep Recon</span></button>
                        <button type="button" onClick={() => { setIsThinking(!isThinking); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${isThinking ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:bg-white/5'}`}><i className="fa-solid fa-microchip"></i><span className="text-[11px] font-black uppercase tracking-widest">Think Mode</span></button>
                     </div>
                   )}
                   <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    placeholder={mode === AppMode.IMAGE_GEN ? (isEditMode ? "Describe edits (e.g., Add a retro filter)..." : "Describe image to synthesize...") : mode === AppMode.VIDEO_GEN ? "Describe video sequence..." : "Direct neural query..."} 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-white font-bold text-sm lg:text-lg px-2 mono" 
                   />
                   <button type="submit" disabled={isLoading || !input.trim()} className={`w-12 h-12 lg:w-16 lg:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all disabled:opacity-30 ${isEditMode ? 'bg-amber-700 hover:bg-amber-600' : 'bg-emerald-700 hover:bg-emerald-600'} text-white`}>
                      <i className={`fa-solid ${isLoading ? 'fa-spinner fa-spin' : (mode === AppMode.VIDEO_GEN ? 'fa-film' : 'fa-paper-plane')}`}></i>
                   </button>
                </div>
             </form>
          </div>
       </div>
       <style>{`
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
          @keyframes pulse-slow { 0%, 100% { opacity: 0.8; filter: drop-shadow(0 0 15px rgba(16, 185, 129, 0.4)); } 50% { opacity: 1; filter: drop-shadow(0 0 35px rgba(16, 185, 129, 0.6)); } }
          .animate-float { animation: float 6s infinite ease-in-out; }
          .animate-pulse-slow { animation: pulse-slow 4s infinite ease-in-out; }
       `}</style>
    </div>
  );
};

export default ChatWindow;
