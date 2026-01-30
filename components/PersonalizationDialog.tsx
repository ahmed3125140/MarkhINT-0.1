
import React, { useState, useEffect } from 'react';
import { PersonalizationSettings } from '../types';

interface PersonalizationDialogProps {
  settings: PersonalizationSettings;
  onSave: (settings: PersonalizationSettings) => void;
  onClose: () => void;
}

const PersonalizationDialog: React.FC<PersonalizationDialogProps> = ({ settings, onSave, onClose }) => {
  const [localSettings, setLocalSettings] = useState<PersonalizationSettings>(settings);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Typewriter cursor effect for the textarea
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const levels = ['MORE', 'DEFAULT', 'LESS'] as const;

  const handleChange = (key: keyof PersonalizationSettings, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#080c0a] border border-[#10b981]/20 rounded-[3rem] p-12 shadow-[0_0_120px_rgba(0,0,0,0.8),0_0_60px_rgba(16,185,129,0.05)] relative overflow-hidden">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-12">
           <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
                <svg className="w-8 h-8 text-[#10b981]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <line x1="4" y1="21" x2="4" y2="14" />
                   <line x1="4" y1="10" x2="4" y2="3" />
                   <line x1="12" y1="21" x2="12" y2="12" />
                   <line x1="12" y1="8" x2="12" y2="3" />
                   <line x1="20" y1="21" x2="20" y2="16" />
                   <line x1="20" y1="12" x2="20" y2="3" />
                   <line x1="2" y1="14" x2="6" y2="14" />
                   <line x1="10" y1="8" x2="14" y2="8" />
                   <line x1="18" y1="16" x2="22" y2="16" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Interface Calibration</h2>
           </div>
           <button onClick={onClose} className="p-2 text-slate-700 hover:text-white transition-colors">
              <i className="fa-solid fa-xmark text-2xl"></i>
           </button>
        </div>

        <div className="space-y-10 max-h-[60vh] overflow-y-auto px-2 custom-scrollbar pr-6">
          {/* Base Style Section */}
          <div className="space-y-2">
             <div className="flex justify-between items-center">
                <div className="space-y-1">
                   <label className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Base style and tone</label>
                   <p className="text-[10px] text-slate-600 font-medium">Defines how the terminal speaks to you.</p>
                </div>
                <div className="relative group">
                  <select 
                    value={localSettings.baseStyle}
                    onChange={(e) => handleChange('baseStyle', e.target.value)}
                    className="appearance-none bg-[#0d1310] border border-white/5 rounded-2xl px-8 py-3.5 text-xs font-bold text-slate-300 outline-none focus:border-[#10b981]/30 transition-all cursor-pointer min-w-[140px]"
                  >
                     <option value="Default">Default</option>
                     <option value="Professional">Professional</option>
                     <option value="Creative">Creative</option>
                     <option value="Stoic">Stoic</option>
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-slate-600 pointer-events-none group-hover:text-[#10b981] transition-colors"></i>
                </div>
             </div>
          </div>

          <div className="h-px bg-[#10b981]/5"></div>

          {/* Behavioral Metrics Section */}
          <div className="space-y-8">
             <label className="text-[10px] font-black text-[#10b981]/40 uppercase tracking-[0.5em] mono block mb-6">Behavioral Metrics</label>
             
             <MetricRow 
                label="Warm" 
                value={localSettings.warmth.toUpperCase()} 
                onChange={(val) => handleChange('warmth', val)} 
                options={levels}
             />
             <MetricRow 
                label="Enthusiastic" 
                value={localSettings.enthusiasm.toUpperCase()} 
                onChange={(val) => handleChange('enthusiasm', val)} 
                options={levels}
             />
             <MetricRow 
                label="Headers & Lists" 
                value={localSettings.headersLists.toUpperCase()} 
                onChange={(val) => handleChange('headersLists', val)} 
                options={levels}
             />
             <MetricRow 
                label="Emoji Usage" 
                value={localSettings.emoji.toUpperCase()} 
                onChange={(val) => handleChange('emoji', val)} 
                options={levels}
             />
          </div>

          <div className="h-px bg-[#10b981]/5"></div>

          {/* Custom Instructions (Typewriter Touch) */}
          <div className="space-y-6">
             <label className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Custom Instructions</label>
             <div className="relative group">
                <textarea 
                  value={localSettings.customInstructions}
                  onChange={(e) => handleChange('customInstructions', e.target.value)}
                  placeholder="Sigma male..."
                  rows={4}
                  className="w-full bg-[#050807] border border-[#10b981]/15 rounded-[2rem] p-8 text-sm font-bold text-slate-200 focus:outline-none focus:border-[#10b981]/40 transition-all resize-none shadow-inner mono tracking-tight"
                />
                {/* Blinking Cursor Logic */}
                <div className="absolute left-8 top-8 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity flex items-start">
                   <div className="text-transparent pointer-events-none whitespace-pre-wrap max-w-full">
                      {localSettings.customInstructions}
                      <span className={`inline-block w-[8px] h-[18px] bg-[#10b981] ml-[2px] align-middle ${cursorVisible ? 'opacity-100' : 'opacity-0'}`}></span>
                   </div>
                </div>
             </div>
             <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.3em] text-center mono">These protocols override standard AI behavior.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-14 flex gap-6">
           <button 
             onClick={onClose}
             className="flex-1 py-5 rounded-[1.5rem] border border-white/5 text-slate-600 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-white/5 hover:text-slate-300 transition-all active:scale-95"
           >
              Abort
           </button>
           <button 
             onClick={() => { onSave(localSettings); onClose(); }}
             className="flex-1 py-5 bg-[#0d6e4d] hover:bg-[#10b981] rounded-[1.5rem] text-white font-black text-[11px] uppercase tracking-[0.4em] transition-all shadow-xl shadow-[#10b981]/10 active:scale-95 border border-white/5"
           >
              Commit Calibration
           </button>
        </div>
      </div>
    </div>
  );
};

const MetricRow: React.FC<{ label: string, value: string, onChange: (val: any) => void, options: readonly string[] }> = ({ label, value, onChange, options }) => (
  <div className="flex justify-between items-center group/row">
    <span className="text-[13px] font-bold text-slate-400 group-hover/row:text-slate-200 transition-colors">{label}</span>
    <div className="relative">
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value.charAt(0) + e.target.value.slice(1).toLowerCase())}
        className="appearance-none bg-transparent border-none text-[11px] font-black text-[#10b981] outline-none cursor-pointer focus:ring-0 text-right uppercase tracking-[0.2em] mono pr-4 group-hover/row:brightness-125"
      >
        {options.map(opt => <option key={opt} value={opt} className="bg-[#0a0f0d] text-white">{opt}</option>)}
      </select>
      <i className="fa-solid fa-chevron-down absolute -right-1 top-1/2 -translate-y-1/2 text-[7px] text-[#10b981]/40 group-hover/row:text-[#10b981] transition-colors"></i>
    </div>
  </div>
);

export default PersonalizationDialog;
