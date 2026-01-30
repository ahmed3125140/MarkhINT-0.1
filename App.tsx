
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import LiveInterface from './components/LiveInterface';
import AdminDashboard from './components/AdminDashboard';
import AuthProtocol from './components/AuthProtocol';
import PersonalizationDialog from './components/PersonalizationDialog';
import { AppMode, ChatSession, Message, PersonalizationSettings, AspectRatio } from './types';
import { geminiService } from './services/geminiService';
import { dbService } from './services/databaseService';

const STORAGE_KEY = 'markhint_sessions_v1';
const USER_KEY = 'markhint_operator_name';
const SETTINGS_KEY = 'markhint_personalization';

const DEFAULT_SETTINGS: PersonalizationSettings = {
  baseStyle: 'Stoic',
  warmth: 'Default',
  enthusiasm: 'Less',
  headersLists: 'Default',
  emoji: 'Less',
  customInstructions: 'Sigma male'
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [privacySession, setPrivacySession] = useState<ChatSession | null>(null);
  const [hasVeoKey, setHasVeoKey] = useState<boolean>(true);
  const [personalization, setPersonalization] = useState<PersonalizationSettings>(DEFAULT_SETTINGS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");

  const filteredSessions = useMemo(() => sessions.filter(s => s.appMode === mode), [sessions, mode]);

  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) try { setPersonalization(JSON.parse(savedSettings)); } catch (e) {}
  }, []);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 800);
      }
    }, 2500);

    const checkVeoKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasVeoKey(hasKey);
      }
    };
    checkVeoKey();

    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) { 
      setUserName(savedUser); 
      setIsAuthorized(true); 
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const revived = JSON.parse(saved).map((s: any) => ({
          ...s, 
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setSessions(revived);
        
        const firstInMode = revived.find((s: any) => s.appMode === mode);
        if (firstInMode) setCurrentSessionId(firstInMode.id);
        else if (revived.length > 0) setCurrentSessionId(revived[0].id);
      } catch (e) { 
        console.error("Session Revive Error", e);
      }
    }
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    
    if (isPrivacyMode) { 
      handleNewPrivacySession(); 
      return; 
    }

    const modeSessions = sessions.filter(s => s.appMode === mode);
    if (modeSessions.length === 0) {
      handleNewChat(mode);
    } else {
      const exists = modeSessions.find(s => s.id === currentSessionId);
      if (!exists) {
        setCurrentSessionId(modeSessions[0].id);
      }
    }
  }, [mode, isPrivacyMode, isAuthorized, sessions.length]);

  useEffect(() => {
    if (!isPrivacyMode && userName && isAuthorized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      const active = sessions.find(s => s.id === currentSessionId);
      if (active) dbService.saveSession(active, userName);
    }
  }, [sessions, currentSessionId, userName, isPrivacyMode, isAuthorized]);

  const handleDeleteSession = (id: string) => {
    if (window.confirm("Confirm data erasure? This action cannot be undone.")) {
      setSessions(prev => {
        const updated = prev.filter(s => s.id !== id);
        if (id === currentSessionId) {
          const modeSessions = updated.filter(s => s.appMode === mode);
          if (modeSessions.length > 0) setCurrentSessionId(modeSessions[0].id);
          else setCurrentSessionId('');
        }
        return updated;
      });
      dbService.deleteSession(id);
    }
  };

  const handleSaveSettings = (newSettings: PersonalizationSettings) => {
    setPersonalization(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const handleNewPrivacySession = () => {
    const newSession: ChatSession = {
      id: 'privacy-' + uuidv4(),
      title: 'Stealth Protocol Active',
      messages: [],
      updatedAt: new Date(),
      appMode: mode
    };
    (newSession as any).isPrivate = true;
    setPrivacySession(newSession);
    setCurrentSessionId(newSession.id);
  };

  const handleNewChat = useCallback((targetMode?: AppMode) => {
    if (isPrivacyMode) { 
      handleNewPrivacySession(); 
      return; 
    }
    const activeMode = targetMode || mode;
    const newSession: ChatSession = {
      id: uuidv4(),
      title: activeMode === AppMode.IMAGE_GEN ? 'Visual Recon' : activeMode === AppMode.VIDEO_GEN ? 'Cine Intel' : 'Strategic Ops',
      messages: [], 
      updatedAt: new Date(), 
      appMode: activeMode
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  }, [mode, isPrivacyMode]);

  const openKeyPicker = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasVeoKey(true);
    }
  };

  const sendMessage = async (text: string, isDeepResearch: boolean = false, isThinking: boolean = false) => {
    if (!currentSessionId) return;
    const currentSession = isPrivacyMode ? privacySession : sessions.find(s => s.id === currentSessionId);
    if (!currentSession) return;

    if (mode === AppMode.VIDEO_GEN && !hasVeoKey) {
       await openKeyPicker();
    }

    const userMsg: Message = { id: uuidv4(), role: 'user', content: text, timestamp: new Date(), type: 'text' };
    const updatedMessages = [...currentSession.messages, userMsg];
    
    if (isPrivacyMode) setPrivacySession({ ...currentSession, messages: updatedMessages });
    else setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: updatedMessages, title: s.messages.length === 0 ? text.substring(0, 40) : s.title } : s));

    setIsLoading(true);
    try {
      let aiMsg: Message;
      if (mode === AppMode.IMAGE_GEN) {
        const lastImage = [...currentSession.messages].reverse().find(m => m.metadata?.imageUrl);
        const imageUrl = await geminiService.generateImage(text, aspectRatio, lastImage?.metadata?.imageUrl);
        aiMsg = { id: uuidv4(), role: 'model', content: lastImage ? 'Visual asset updated.' : 'Visual asset synthesized.', timestamp: new Date(), type: 'image', metadata: { imageUrl } };
      } else if (mode === AppMode.VIDEO_GEN) {
        const videoRatio = (aspectRatio === "9:16" ? "9:16" : "16:9") as "16:9" | "9:16";
        const videoUrl = await geminiService.generateVideo(text, videoRatio);
        aiMsg = { id: uuidv4(), role: 'model', content: 'Motion sequence complete.', timestamp: new Date(), type: 'video', metadata: { videoUrl } };
      } else {
        const systemInstruction = isDeepResearch ? "Comprehensive Google Search Research Mode." : undefined;
        const response = await geminiService.generateChatResponse(text, 'gemini-3-pro-preview', systemInstruction, personalization, isThinking);
        aiMsg = {
          id: uuidv4(), role: 'model', content: response.text || '', timestamp: new Date(), type: 'text',
          metadata: { groundingUrls: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({ title: c.web?.title || 'Source', uri: c.web?.uri || '#' })) }
        };
      }
      if (isPrivacyMode) setPrivacySession(prev => prev ? { ...prev, messages: [...prev.messages, aiMsg] } : null);
      else setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, aiMsg], updatedAt: new Date() } : s));
    } catch (error: any) {
      if (error.message?.includes("Requested entity was not found")) {
        setHasVeoKey(false);
      }
      const errorMsg: Message = { id: uuidv4(), role: 'model', content: `Protocol error: ${error.message || 'Unknown link failure.'}`, timestamp: new Date(), type: 'text' };
      if (isPrivacyMode) setPrivacySession(prev => prev ? { ...prev, messages: [...prev.messages, errorMsg] } : null);
      else setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
    } finally { setIsLoading(false); }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-transparent">
      {!isAuthorized && <AuthProtocol onAuthorize={(name) => { setUserName(name); localStorage.setItem(USER_KEY, name); setIsAuthorized(true); }} />}
      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
      {showPersonalization && <PersonalizationDialog settings={personalization} onSave={handleSaveSettings} onClose={() => setShowPersonalization(false)} />}
      <Sidebar 
        mode={mode} 
        setMode={(m) => { setMode(m); if (m === AppMode.VIDEO_GEN) setAspectRatio("16:9"); }} 
        sessions={filteredSessions} 
        currentSessionId={currentSessionId} 
        onSelectSession={setCurrentSessionId} 
        onNewChat={() => handleNewChat()} 
        onDeleteSession={handleDeleteSession} 
        onClearAll={() => { setSessions(prev => prev.filter(s => s.appMode !== mode)); handleNewChat(); }}
        onOpenAdmin={() => setShowAdmin(true)}
        onOpenPersonalization={() => setShowPersonalization(true)}
        isPrivacyMode={isPrivacyMode}
        setIsPrivacyMode={setIsPrivacyMode}
        userName={userName}
        onLogout={() => { localStorage.removeItem(USER_KEY); window.location.reload(); }}
        onUpgrade={openKeyPicker}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="lg:hidden absolute top-4 left-4 z-40">
           <button onClick={() => setIsSidebarOpen(true)} className="w-12 h-12 bg-slate-950/80 backdrop-blur-md border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500 shadow-2xl"><i className="fa-solid fa-bars-staggered"></i></button>
        </div>
        {mode === AppMode.LIVE ? <LiveInterface /> : (
          <ChatWindow 
            messages={isPrivacyMode ? privacySession?.messages || [] : sessions.find(s => s.id === currentSessionId)?.messages || []} 
            onSendMessage={sendMessage} 
            isLoading={isLoading} 
            mode={mode} 
            setMode={setMode} 
            isPrivacyMode={isPrivacyMode} 
            hasVeoKey={hasVeoKey} 
            onOpenKeyPicker={openKeyPicker}
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
          />
        )}
      </main>
    </div>
  );
};

export default App;
