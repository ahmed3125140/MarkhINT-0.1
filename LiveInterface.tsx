
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const LiveInterface: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  
  const sessionRef = useRef<any>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);
  const frameIntervalRef = useRef<number | null>(null);

  const startSession = async () => {
    setErrorMsg(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let stream: MediaStream;

      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: true, 
          video: { width: 640, height: 480 } 
        });
        setHasCamera(true);
      } catch (videoError) {
        console.warn("Camera init failed, falling back to audio-only...", videoError);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setHasCamera(false);
        } catch (audioError: any) {
          if (audioError.name === 'NotFoundError' || audioError.name === 'DevicesNotFoundError') {
            throw new Error("MICROPHONE_NOT_FOUND");
          } else if (audioError.name === 'NotAllowedError' || audioError.name === 'PermissionDeniedError') {
            throw new Error("PERMISSION_DENIED");
          } else {
            throw audioError;
          }
        }
      }
      
      if (videoRef.current && stream.getVideoTracks().length > 0) {
        videoRef.current.srcObject = stream;
      }

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputAudioContext;
      outputAudioCtxRef.current = outputAudioContext;

      const analyser = inputAudioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            source.connect(analyser);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);

            if (stream.getVideoTracks().length > 0) {
              frameIntervalRef.current = window.setInterval(() => {
                if (videoRef.current && hiddenCanvasRef.current) {
                  const video = videoRef.current;
                  const canvas = hiddenCanvasRef.current;
                  canvas.width = 320;
                  canvas.height = 240;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
                    sessionPromise.then((session) => {
                      session.sendRealtimeInput({
                        media: { data: base64Data, mimeType: 'image/jpeg' }
                      });
                    });
                  }
                }
              }, 1000);
            }

            drawVisualizer();
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.outputTranscription) {
               setTranscripts(prev => [...prev.slice(-4), msg.serverContent!.outputTranscription!.text]);
            }
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioCtxRef.current) {
              const ctx = outputAudioCtxRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (msg.serverContent?.interrupted) {
              for (const source of sourcesRef.current) source.stop();
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (err) => {
            console.error("Live Link Failure", err);
            setErrorMsg("Neural link lost. Checking connection...");
          },
          onclose: () => {
            setIsActive(false);
            if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
            cancelAnimationFrame(animationRef.current);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: "You are Aura, an elite AI with vision and search capabilities. Keep responses concise and use Google Search for any facts."
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Neural Initialization Error:", err.message);
      if (err.message === "MICROPHONE_NOT_FOUND") {
        setErrorMsg("No microphone detected. Please connect a mic and try again.");
      } else if (err.message === "PERMISSION_DENIED") {
        setErrorMsg("Mic/Camera permission was denied. Please allow access in Chrome settings.");
      } else {
        setErrorMsg("System error. Please check your hardware and refresh.");
      }
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 60;
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const percent = value / 255;
        const angle = (i / bufferLength) * Math.PI * 2;
        const length = radius + (percent * 40);
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * length;
        const y2 = centerY + Math.sin(angle) * length;
        ctx.strokeStyle = `hsla(${240 + (percent * 60)}, 70%, 60%, ${0.2 + percent})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };
    draw();
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
    if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    cancelAnimationFrame(animationRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsActive(false);
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 space-y-8 overflow-hidden">
      <div className="w-full max-w-3xl aspect-video bg-slate-900 rounded-[2.5rem] border border-white/5 relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] group">
        
        {hasCamera ? (
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className={`w-full h-full object-cover mirror transition-all duration-1000 ${isActive ? 'opacity-90' : 'opacity-10'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-950/50">
             <i className="fa-solid fa-microphone-lines text-slate-800 text-6xl opacity-20"></i>
          </div>
        )}
        
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-8 left-8 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`}></div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                {isActive ? 'Neural Link Active' : 'System Standby'}
              </span>
           </div>
           
           <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={800} height={450} />
        </div>

        {!isActive && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center">
             <div className="text-center space-y-8 animate-in zoom-in duration-700">
                {errorMsg && (
                  <div className="mb-6 p-6 bg-red-600/10 border border-red-500/20 rounded-3xl text-red-400 text-sm font-bold animate-in fade-in slide-in-from-top-4">
                    <i className="fa-solid fa-triangle-exclamation mr-3"></i>
                    {errorMsg}
                  </div>
                )}
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full"></div>
                  <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl relative border border-white/10 group-hover:scale-110 transition-transform cursor-pointer" onClick={startSession}>
                    <i className="fa-solid fa-headset text-4xl text-white"></i>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter">Initiate High-Frequency Link</h3>
                  <p className="text-slate-500 text-sm mt-2 font-medium">Connect via {hasCamera ? 'Voice & Vision' : 'Voice (No Camera Detected)'}</p>
                </div>
                <button 
                  onClick={startSession}
                  className="px-12 py-5 bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-[0.2em] text-[10px] shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95"
                >
                  Go Live Now
                </button>
             </div>
          </div>
        )}

        {isActive && (
          <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-8">
            <button 
              onClick={stopSession}
              className="w-16 h-16 bg-red-600 hover:bg-red-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all active:scale-90"
            >
              <i className="fa-solid fa-phone-slash text-2xl"></i>
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-3xl space-y-4">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Real-time Transcription</h4>
          </div>
        </div>
        
        <div className="bg-[#0d1017]/80 border border-white/5 rounded-[2rem] p-10 min-h-[160px] backdrop-blur-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-600 to-purple-600"></div>
          {transcripts.length > 0 ? (
            <div className="space-y-4">
              {transcripts.map((t, i) => (
                <p key={i} className={`text-sm leading-relaxed transition-all duration-500 ${i === transcripts.length - 1 ? 'text-white font-bold translate-x-2' : 'text-slate-500 scale-95 opacity-50 origin-left'}`}>
                  {t}
                </p>
              ))}
            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center opacity-10 py-4">
                <i className="fa-solid fa-brain text-4xl mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Waiting for audio input...</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveInterface;
