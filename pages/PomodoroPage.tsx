
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Subject, PomodoroLog } from '../types';
import { 
  History, BarChart2, Clock as ClockIcon, 
  Play, Pause, SkipForward, 
  Volume2, VolumeX, Sparkles, Brain, Coffee, Plus, Minus, Settings2,
  CheckCircle2, X, BookOpen, Zap, Target, Flame, Lightbulb
} from 'lucide-react';

interface PomodoroPageProps {
  subjects: Subject[];
  onComplete: (log: PomodoroLog) => void;
  logs: PomodoroLog[];
}

const PomodoroPage: React.FC<PomodoroPageProps> = ({ subjects, onComplete, logs }) => {
  const [focusDuration, setFocusDuration] = useState(52);
  const [breakDuration, setBreakDuration] = useState(17);
  const [minutes, setMinutes] = useState(52);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubjectPrompt, setShowSubjectPrompt] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = (mode === 'focus' ? focusDuration : breakDuration) * 60;
  const currentSeconds = minutes * 60 + seconds;
  const progress = ((totalSeconds - currentSeconds) / totalSeconds) * 100;

  useEffect(() => {
    if (!isActive) {
      setMinutes(mode === 'focus' ? focusDuration : breakDuration);
      setSeconds(0);
    }
  }, [focusDuration, breakDuration, mode, isActive]);

  const playSound = (type: 'success' | 'transition') => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      if (type === 'success') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.3);
      }
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (type === 'success' ? 0.5 : 0.3));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (type === 'success' ? 0.5 : 0.3));
    } catch (e) { console.warn("Audio blocked", e); }
  };

  const startTimer = () => {
    if (isActive) return;
    if (!selectedSub && mode === 'focus') {
      setShowSubjectPrompt(true);
      return;
    }
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetTimer = (newMode?: 'focus' | 'break') => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const m = newMode || mode;
    setMinutes(m === 'focus' ? focusDuration : breakDuration);
    setSeconds(0);
  };

  const handleModeChange = (newMode: 'focus' | 'break', silent = false) => {
    setMode(newMode);
    if (!silent) playSound('transition');
    resetTimer(newMode);
  };

  const handleFinishEarly = () => {
    if (mode === 'focus') {
      const elapsedSeconds = (focusDuration * 60) - (minutes * 60 + seconds);
      const elapsedMinutes = Math.max(1, Math.floor(elapsedSeconds / 60));
      onComplete({
        id: Date.now().toString(),
        subjectId: selectedSub,
        duration: elapsedMinutes,
        timestamp: new Date().toISOString()
      });
      playSound('success');
      handleModeChange('break', true);
    } else {
      handleModeChange('focus', true);
    }
  };

  const adjustTime = (type: 'focus' | 'break', amount: number) => {
    if (type === 'focus') {
      setFocusDuration(prev => Math.max(1, prev + amount));
    } else {
      setBreakDuration(prev => Math.max(1, prev + amount));
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(prev => prev - 1);
        } else if (minutes > 0) {
          setMinutes(prev => prev - 1);
          setSeconds(59);
        } else {
          pauseTimer();
          playSound('success');
          if (mode === 'focus') {
            onComplete({ id: Date.now().toString(), subjectId: selectedSub, duration: focusDuration, timestamp: new Date().toISOString() });
            setTimeout(() => handleModeChange('break', true), 1500);
          } else {
            setTimeout(() => handleModeChange('focus', true), 1500);
          }
        }
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, minutes, seconds, mode, selectedSub, focusDuration]);

  const weeklyAnalytics = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const subjectMinutes: Record<string, number> = {};
    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      if (logDate >= weekAgo) {
        subjectMinutes[log.subjectId] = (subjectMinutes[log.subjectId] || 0) + log.duration;
      }
    });
    return Object.entries(subjectMinutes)
      .map(([id, mins]) => ({
        id,
        name: subjects.find(s => s.id === id)?.name || 'Quick Session',
        color: subjects.find(s => s.id === id)?.color || '#cbd5e1',
        minutes: mins
      }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [logs, subjects]);

  const streakCount = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter(l => new Date(l.timestamp).toDateString() === today).length;
  }, [logs]);

  // High Precision Circular Progress Logic
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const angle = (progress / 100) * 360 - 90;
  const tipX = 210 + radius * Math.cos((angle * Math.PI) / 180);
  const tipY = 210 + radius * Math.sin((angle * Math.PI) / 180);

  const currentSubject = subjects.find(s => s.id === selectedSub);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 flex flex-col items-center max-w-6xl mx-auto pb-40 relative">
      
      {/* Immersive Background System */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-[3000ms] z-0 overflow-hidden`}>
        {/* Dynamic Gradients */}
        <div className={`absolute inset-0 transition-opacity duration-[3000ms] ${mode === 'focus' ? 'opacity-15' : 'opacity-0'} bg-gradient-to-tr from-indigo-600 via-purple-700 to-slate-900 scale-150 blur-[180px]`} />
        <div className={`absolute inset-0 transition-opacity duration-[3000ms] ${mode === 'break' ? 'opacity-15' : 'opacity-0'} bg-gradient-to-tr from-emerald-500 via-teal-700 to-slate-900 scale-150 blur-[180px]`} />
        
        {/* Animated Particles */}
        <div className="absolute inset-0 opacity-40">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i}
              className={`absolute rounded-full blur-3xl mix-blend-screen animate-pulse`}
              style={{
                width: `${Math.random() * 300 + 200}px`,
                height: `${Math.random() * 300 + 200}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: mode === 'focus' ? '#6366f1' : '#10b981',
                animationDelay: `${i * 2}s`,
                animationDuration: `${Math.random() * 5 + 5}s`,
                opacity: 0.2
              }}
            />
          ))}
        </div>
      </div>

      {/* Floating Header Stats */}
      <header className="w-full flex justify-between items-start relative z-10 px-4">
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm">
            <Flame size={16} className={streakCount > 0 ? "text-orange-500 animate-bounce" : "text-slate-300"} />
            <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{streakCount} Daily Flow Streak</span>
          </div>
          {currentSubject && (
            <div className="flex items-center gap-2 px-4 py-1.5 mt-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 animate-in slide-in-from-left-4">
              <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: currentSubject.color }} />
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{currentSubject.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-6 py-2.5 bg-white/40 backdrop-blur-xl rounded-full border border-white/50 shadow-2xl transition-all duration-700">
          <div className={`w-2 h-2 rounded-full animate-pulse ${mode === 'focus' ? 'bg-indigo-600' : 'bg-emerald-600'}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
            {mode === 'focus' ? 'Deep Flow Active' : 'Biological Recovery'}
          </span>
        </div>
      </header>

      <div className="w-full flex flex-col items-center gap-16 relative z-10 mt-8">
        
        {/* Main Timer Visual */}
        <div className={`relative transition-all duration-1000 ${isActive ? 'scale-110' : 'scale-100'}`}>
          <div className={`absolute inset-[-60px] blur-[140px] rounded-full transition-all duration-[2s] ${isActive ? 'opacity-40 scale-125' : 'opacity-0 scale-75'} ${mode === 'focus' ? 'bg-indigo-600' : 'bg-emerald-500'}`} />
          
          <div className="relative flex items-center justify-center">
            <svg className="w-[420px] h-[420px] transform -rotate-90 filter drop-shadow-[0_0_50px_rgba(0,0,0,0.05)]">
              <defs>
                <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="breakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              <circle cx="210" cy="210" r={radius + 30} stroke="#cbd5e1" strokeWidth="1" fill="transparent" strokeDasharray="2 12" className="opacity-20 animate-[spin_60s_linear_infinite]" />
              <circle cx="210" cy="210" r={radius} stroke="#f1f5f9" strokeWidth="12" fill="transparent" className="text-slate-100/40" />
              <circle 
                cx="210" cy="210" r={radius} 
                stroke={mode === 'focus' ? 'url(#focusGrad)' : 'url(#breakGrad)'} 
                strokeWidth="16" 
                fill="transparent" 
                strokeDasharray={circumference} 
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }} 
                strokeLinecap="round" 
                filter="url(#ringGlow)"
              />
              {progress > 0 && (
                <circle 
                  cx={tipX} cy={tipY} r="10" 
                  fill="white" 
                  className="transition-all duration-1000 shadow-2xl" 
                  style={{ transition: 'cx 1s linear, cy 1s linear' }}
                />
              )}
            </svg>

            <div className={`absolute flex flex-col items-center transition-all duration-1000 ${isActive ? 'scale-105' : 'scale-100'}`}>
              <div className="relative group">
                <div className={`absolute -inset-8 bg-white/40 blur-3xl rounded-full transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                <div className="text-[120px] font-black text-slate-900 tracking-tighter tabular-nums leading-none flex items-baseline drop-shadow-xl relative z-10">
                  {String(minutes).padStart(2, '0')}
                  <span className={`text-5xl mx-2 transition-opacity duration-300 ${seconds % 2 === 0 || !isActive ? 'opacity-100' : 'opacity-10'} ${mode === 'focus' ? 'text-indigo-600' : 'text-emerald-600'}`}>:</span>
                  {String(seconds).padStart(2, '0')}
                </div>
              </div>
              
              <div className="mt-8 flex flex-col items-center gap-5 relative z-10">
                <div className={`px-6 py-2 rounded-2xl border-2 text-[10px] font-black uppercase tracking-[0.6em] shadow-lg transition-all duration-700 ${mode === 'focus' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-emerald-600 border-emerald-400 text-white'}`}>
                   {isActive ? (mode === 'focus' ? 'Flowing' : 'Resting') : 'Standby'}
                </div>
                
                {!isActive && (
                  <button 
                    onClick={() => setShowSubjectPrompt(true)} 
                    className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-2xl border border-white rounded-[24px] hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-200/40 group/btn"
                  >
                    <div className="w-3 h-3 rounded-full shadow-inner group-hover/btn:scale-125 transition-transform" style={{ backgroundColor: currentSubject?.color || '#e2e8f0' }} />
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{currentSubject?.name || 'Target Subject'}</span>
                    <Plus size={16} className="text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 bg-white/80 backdrop-blur-3xl p-8 rounded-[56px] border border-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] transition-all hover:shadow-[0_50px_120px_-30px_rgba(0,0,0,0.15)] relative">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className={`p-4 rounded-3xl transition-all hover:scale-110 active:scale-90 ${isMuted ? 'text-slate-300 bg-slate-50' : 'text-indigo-500 bg-indigo-50/50'}`}
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            <button 
              onClick={() => setShowSettings(true)} 
              className="p-4 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-3xl transition-all hover:scale-110 active:scale-90"
            >
              <Settings2 size={24} />
            </button>
          </div>
          <div className="h-12 w-px bg-slate-100" />
          <button 
            onClick={isActive ? pauseTimer : startTimer} 
            className={`w-24 h-24 rounded-[40px] shadow-3xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center group relative overflow-hidden ${mode === 'focus' ? 'bg-slate-950 text-white' : 'bg-emerald-600 text-white'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} className="ml-2" fill="currentColor" />}
          </button>
          <div className="h-12 w-px bg-slate-100" />
          <div className="flex items-center gap-2">
            <button 
              onClick={handleFinishEarly} 
              className={`p-4 rounded-3xl transition-all hover:scale-110 active:scale-90 ${mode === 'focus' ? 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50' : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50'}`} 
            >
              <CheckCircle2 size={32} />
            </button>
            <button 
              onClick={() => handleModeChange(mode === 'focus' ? 'break' : 'focus')} 
              className="p-4 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-3xl transition-all hover:scale-110 active:scale-90"
            >
              <SkipForward size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xl relative z-10 px-4">
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-[32px] flex items-center gap-5 shadow-sm">
           <div className={`p-4 rounded-2xl ${mode === 'focus' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'}`}>
              {mode === 'focus' ? <Brain size={24} /> : <Lightbulb size={24} />}
           </div>
           <div className="text-left">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scientific Tip</p>
              <p className="text-sm font-bold text-slate-700 leading-relaxed mt-1">
                {mode === 'focus' ? "Focus is a muscle. Avoid switching tasks to maintain metabolic efficiency in your prefrontal cortex." : "Recovery is productive. Your brain consolidates knowledge better when you step away from the screen."}
              </p>
           </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pt-20 relative z-10">
        <div className="lg:col-span-7 bg-white p-10 rounded-[56px] border border-slate-100 shadow-xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/20 rounded-bl-full -z-0 pointer-events-none transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl">
                <BarChart2 size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cognitive Load</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Intensity Heatmap</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <Target size={16} className="text-indigo-600" />
              <span className="text-[10px] font-black text-slate-500 uppercase">Goal: 4h/day</span>
            </div>
          </div>
          <div className="space-y-8 relative z-10 flex-1 flex flex-col justify-center">
            {weeklyAnalytics.length > 0 ? weeklyAnalytics.map((sub) => (
              <div key={sub.id} className="group/item">
                <div className="flex justify-between items-end mb-3">
                  <div className="flex items-center gap-4">
                     <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: sub.color }} />
                     <span className="text-sm font-black text-slate-800 uppercase tracking-wider group-hover/item:text-indigo-600 transition-colors">{sub.name}</span>
                  </div>
                  <span className="text-lg font-black text-slate-900 leading-none">{sub.minutes}<span className="text-[9px] text-slate-400 ml-1.5 uppercase font-bold tracking-widest">Minutes</span></span>
                </div>
                <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full rounded-full transition-all duration-[2s] ease-[cubic-bezier(0.34,1.56,0.64,1)]" style={{ width: `${Math.min(100, (sub.minutes / 500) * 100)}%`, backgroundColor: sub.color }} />
                </div>
              </div>
            )) : (
              <div className="py-20 text-center flex flex-col items-center">
                <Brain size={64} className="text-slate-100 mb-6" />
                <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em]">Awaiting Knowledge input</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-10 rounded-[56px] border border-slate-100 shadow-xl flex flex-col h-[600px] group">
          <div className="flex items-center justify-between mb-10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl shadow-sm group-hover:rotate-12 transition-transform">
                <History size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Flow Log</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Recent Cycles</p>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-3">
            {logs.length > 0 ? [...logs].reverse().map((log) => {
              const sub = subjects.find(s => s.id === log.subjectId);
              return (
                <div key={log.id} className="flex items-center justify-between p-6 bg-slate-50/40 hover:bg-white border-2 border-transparent hover:border-slate-100 rounded-[32px] transition-all group/log">
                  <div className="flex items-center gap-5">
                    <div className="w-2 h-12 rounded-full transition-all group-hover/log:h-16 group-hover/log:w-2.5" style={{ backgroundColor: sub?.color || '#e2e8f0' }} />
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight truncate max-w-[180px] uppercase tracking-wide">{sub?.name || 'Quick Sync'}</h4>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <ClockIcon size={12} />
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-slate-900">{log.duration}<span className="text-[10px] text-slate-400 ml-1.5 uppercase font-bold">min</span></span>
                    <p className={`text-[8px] font-black uppercase tracking-widest mt-1.5 ${log.duration > 45 ? 'text-indigo-600' : 'text-slate-400'}`}>
                      {log.duration > 45 ? 'Deep focus' : 'Session'}
                    </p>
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center h-full opacity-20">
                <Brain size={48} className="text-slate-900" />
                <p className="mt-4 font-black uppercase tracking-[0.3em] text-xs">No Sessions Identified</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-3xl z-[150] flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="bg-white rounded-[64px] w-full max-w-md p-12 shadow-2xl relative animate-in zoom-in-95 duration-500">
            <button onClick={() => setShowSettings(false)} className="absolute top-12 right-12 p-4 text-slate-400 hover:text-slate-900 rounded-[24px] hover:bg-slate-50 transition-all"><X size={28} /></button>
            <div className="flex items-center gap-6 mb-12">
              <div className="p-5 bg-indigo-50 text-indigo-600 rounded-[32px] shadow-sm"><Settings2 size={32} /></div>
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Focus Setup</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure your performance profile</p>
              </div>
            </div>
            <div className="space-y-10">
              {[ { l: 'Concentration Phase', v: focusDuration, t: 'focus', icon: <Zap size={18} />, color: 'indigo' }, { l: 'Recovery Interval', v: breakDuration, t: 'break', icon: <Coffee size={18} />, color: 'emerald' } ].map(item => (
                <div key={item.t} className="space-y-4">
                   <div className="flex justify-between px-3">
                     <span className={`text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 ${item.color === 'indigo' ? 'text-indigo-600' : 'text-emerald-600'}`}>
                       {item.icon} {item.l}
                     </span>
                     <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{item.v} Minutes</span>
                   </div>
                   <div className="flex items-center justify-between bg-slate-50/50 p-6 rounded-[36px] border border-slate-100 shadow-inner">
                      <button onClick={() => adjustTime(item.t as any, -1)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all shadow-sm"><Minus size={24} /></button>
                      <span className="text-4xl font-black text-slate-900 w-20 text-center tabular-nums">{item.v}</span>
                      <button onClick={() => adjustTime(item.t as any, 1)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-2xl transition-all shadow-sm"><Plus size={24} /></button>
                   </div>
                </div>
              ))}
              <button 
                onClick={() => setShowSettings(false)} 
                className="w-full bg-slate-950 text-white py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 mt-6"
              >
                Apply Engine Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubjectPrompt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-3xl z-[160] flex items-center justify-center p-4 animate-in fade-in duration-500">
          <div className="bg-white rounded-[72px] w-full max-w-3xl p-12 lg:p-16 shadow-2xl animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-10 shrink-0">
               <div className="flex items-center gap-6">
                 <div className="p-5 bg-indigo-600 text-white rounded-[32px] shadow-2xl shadow-indigo-100 animate-float"><Target size={32} /></div>
                 <div>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tight">Target Objective</h2>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Which domain are we conquering?</p>
                 </div>
               </div>
               <button onClick={() => setShowSubjectPrompt(false)} className="p-4 hover:bg-slate-50 rounded-3xl text-slate-400 transition-all"><X size={28} /></button>
            </div>
            
            <div className="flex-1 min-h-0 relative">
              <div className="absolute inset-0 overflow-y-auto custom-scrollbar pr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pb-8">
                  <button 
                    onClick={() => { setSelectedSub(''); setShowSubjectPrompt(false); startTimer(); }} 
                    className={`flex items-center gap-6 p-6 rounded-[36px] border-4 transition-all group ${!selectedSub ? 'border-indigo-600 bg-indigo-50/50 shadow-2xl' : 'border-slate-50 bg-white hover:border-indigo-200 hover:shadow-xl'}`}
                  >
                    <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center text-slate-300 shadow-sm group-hover:scale-110 transition-transform"><Sparkles size={28} /></div>
                    <div className="text-left">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Open Lab Flow</span>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Unassigned Session</p>
                    </div>
                  </button>
                  
                  {subjects.map(s => (
                    <button 
                      key={s.id} 
                      onClick={() => { setSelectedSub(s.id); setShowSubjectPrompt(false); startTimer(); }} 
                      className={`flex items-center gap-6 p-6 rounded-[36px] border-4 transition-all group ${selectedSub === s.id ? 'border-indigo-600 bg-indigo-50/50 shadow-2xl' : 'border-slate-50 bg-white hover:border-indigo-200 hover:shadow-xl'}`}
                    >
                      <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-white font-black text-xl shadow-xl shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: s.color }}>
                        {s.name.charAt(0)}
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] truncate">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{s.chapters.length} Modules Available</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroPage;
