
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Subject, PomodoroLog, AppState } from '../types';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, AreaChart, Area
} from 'recharts';
import { 
  Play, Pause, X, 
  Settings2, CheckCircle2, Flame, Trophy, Clock, Trash2, 
  Download, RefreshCw, Lock, ChevronDown, Volume2, VolumeX,
  TrendingUp, Activity, CloudRain, Music, Wind, Youtube, Disc, ListMusic, ChevronRight, ShieldCheck, 
  Radio, Volume1, Signal, Zap, SignalHigh, SignalMedium, SignalLow
} from 'lucide-react';

interface PomodoroPageProps {
  subjects: Subject[];
  onComplete: (log: PomodoroLog) => void;
  logs: PomodoroLog[];
  fullState: AppState;
  onRestore: (state: AppState) => void;
}

const AMBIENT_PRESETS = [
  { id: 'lofi', label: 'Lo-Fi Focus', icon: <Music size={20} />, ytId: 'jfKfPfyJRdk' }, 
  { id: 'rain', label: 'Deep Rain', icon: <CloudRain size={20} />, ytId: 'mPZkdNFkNps' }, 
  { id: 'noise', label: 'White Noise', icon: <Wind size={20} />, ytId: 'nMfPqeZjc2c' }, 
];

// Reactive Visualizer Component - Physically tied to volume/signal
const Visualizer = ({ isActive, volume, isMuted, color = "bg-indigo-400" }: { isActive: boolean; volume: number; isMuted: boolean; color?: string }) => {
  const intensity = isMuted ? 0 : volume / 100;
  
  return (
    <div 
      className="flex items-end gap-[3px] h-6 px-1" 
      style={{ '--intensity': intensity } as React.CSSProperties}
    >
      {[...Array(10)].map((_, i) => (
        <div 
          key={i}
          className={`w-[3px] rounded-full transition-all duration-300 ${color} ${isActive && intensity > 0 ? 'animate-reactive-pomo' : 'h-[3px] opacity-10'}`}
          style={{ 
            animationDelay: `${i * 0.05}s`,
            opacity: isActive ? 0.1 + (0.9 * intensity) : 0.1,
            animationDuration: `${0.3 + (0.7 * (1 - intensity))}s`
          }}
        />
      ))}
      <style>{`
        @keyframes reactive-pomo {
          0%, 100% { height: 3px; }
          50% { height: calc(100% * var(--intensity)); }
        }
        .animate-reactive-pomo {
          animation: reactive-pomo var(--duration, 0.6s) ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>
    </div>
  );
};

const DynamicSignalIcon = ({ volume, isMuted }: { volume: number, isMuted: boolean }) => {
  if (isMuted || volume === 0) return <VolumeX size={14} className="text-rose-500" />;
  if (volume > 75) return <SignalHigh size={14} className="text-indigo-400" />;
  if (volume > 40) return <SignalMedium size={14} className="text-indigo-400/80" />;
  return <SignalLow size={14} className="text-amber-400" />;
};

const PomodoroPage: React.FC<PomodoroPageProps> = ({ subjects, onComplete, logs, fullState, onRestore }) => {
  // Timer State
  const [focusDuration, setFocusDuration] = useState(52);
  const [breakDuration, setBreakDuration] = useState(17);
  const [minutes, setMinutes] = useState(52);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [showSettings, setShowSettings] = useState(false);
  const [hasTriedToStart, setHasTriedToStart] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Audio Hub State
  const [activeTab, setActiveTab] = useState<'stats' | 'audio'>('stats');
  const [selectedAmbient, setSelectedAmbient] = useState<string | null>(null);
  const [customYtUrl, setCustomYtUrl] = useState('');
  const [playingYtId, setPlayingYtId] = useState<string | null>(null);
  const [hubVolume, setHubVolume] = useState(80);
  const [isHubMuted, setIsHubMuted] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pomodoroSubjects = useMemo(() => {
    const seen = new Set<string>();
    const result: Subject[] = [];
    subjects.forEach(s => {
      const baseName = s.name.replace(/\s*(1st|2nd)?\s*Paper/gi, '').trim();
      if (!seen.has(baseName)) {
        seen.add(baseName);
        result.push({ ...s, name: baseName });
      }
    });
    return result;
  }, [subjects]);

  const currentSubject = subjects.find(s => s.id === selectedSub);
  const currentDisplaySubject = pomodoroSubjects.find(s => s.id === selectedSub);

  useEffect(() => {
    if (isActive) {
      const modeEmoji = mode === 'focus' ? '🎯' : '☕';
      const modeStr = mode === 'focus' ? 'Focus' : 'Break';
      const separator = seconds % 2 === 0 ? ':' : ' ';
      const timeDisplay = `${String(minutes).padStart(2, '0')}${separator}${String(seconds).padStart(2, '0')}`;
      document.title = `${timeDisplay} ${modeEmoji} ${modeStr}`;
    } else {
      document.title = 'ZENITH - Reach Your Peak';
    }
    return () => { document.title = 'ZENITH - Reach Your Peak'; };
  }, [isActive, minutes, seconds, mode]);

  const totalSeconds = (mode === 'focus' ? focusDuration : breakDuration) * 60;
  const progress = (((totalSeconds - (minutes * 60 + seconds)) / totalSeconds) * 100);

  useEffect(() => {
    if (!isActive) {
      setMinutes(mode === 'focus' ? focusDuration : breakDuration);
      setSeconds(0);
    }
  }, [focusDuration, breakDuration, mode, isActive]);

  const streakCount = useMemo(() => {
    if (logs.length === 0) return 0;
    const uniqueDates: number[] = Array.from<number>(new Set(logs.map(log => {
      const d = new Date(log.timestamp);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    }))).sort((a, b) => b - a);
    const todayMidnight = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
    const yesterdayMidnight = todayMidnight - (24 * 60 * 60 * 1000);
    if (uniqueDates[0] < yesterdayMidnight) return 0;
    let streak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      if (uniqueDates[i] - uniqueDates[i + 1] === (24 * 60 * 60 * 1000)) streak++;
      else break;
    }
    return streak;
  }, [logs]);

  const totalFocusMinutes = useMemo(() => logs.reduce((acc, l) => acc + l.duration, 0), [logs]);

  const dailyData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();
    return last7Days.map(dateStr => {
      const total = logs.filter(l => new Date(l.timestamp).toDateString() === dateStr).reduce((acc, l) => acc + l.duration, 0);
      return { name: dateStr.split(' ')[0], minutes: total };
    });
  }, [logs]);

  const startTimer = () => {
    if (!selectedSub) {
      setHasTriedToStart(true);
      setTimeout(() => setHasTriedToStart(false), 2000);
      return;
    }
    setIsActive(true);
  };

  const pauseTimer = () => setIsActive(false);

  const resetTimer = (newMode?: 'focus' | 'break') => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setMinutes((newMode || mode) === 'focus' ? focusDuration : breakDuration);
    setSeconds(0);
  };

  const handleModeChange = (newMode: 'focus' | 'break') => {
    setMode(newMode);
    resetTimer(newMode);
  };

  const handleFinishEarly = () => {
    pauseTimer();
    if (mode === 'focus') {
      onComplete({ 
        id: Date.now().toString(), 
        subjectId: selectedSub, 
        duration: focusDuration, 
        timestamp: new Date().toISOString() 
      });
      handleModeChange('break');
    } else {
      handleModeChange('focus');
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds > 0) setSeconds(prev => prev - 1);
        else if (minutes > 0) { setMinutes(prev => prev - 1); setSeconds(59); }
        else {
          pauseTimer();
          if (mode === 'focus') {
            onComplete({ id: Date.now().toString(), subjectId: selectedSub, duration: focusDuration, timestamp: new Date().toISOString() });
            handleModeChange('break');
          } else handleModeChange('focus');
        }
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, minutes, seconds, mode, selectedSub, focusDuration]);

  // Audio Hub Helpers
  const handleCustomYtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = customYtUrl.match(regExp);
    if (match && match[2].length === 11) {
      setPlayingYtId(match[2]);
      setSelectedAmbient('custom');
    } else {
      alert("Invalid YouTube URL. Please use a full watch URL or share link.");
    }
  };

  const selectAmbient = (id: string, ytId: string) => {
    if (selectedAmbient === id) {
      setSelectedAmbient(null);
      setPlayingYtId(null);
    } else {
      setSelectedAmbient(id);
      setPlayingYtId(ytId);
    }
  };

  const radius = 130;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const signalQuality = useMemo(() => {
    if (isHubMuted || hubVolume === 0) return "DISCONNECTED";
    if (hubVolume > 85) return "CRYSTAL CLEAR";
    if (hubVolume > 60) return "STABLE FEED";
    if (hubVolume > 30) return "WEAK SIGNAL";
    return "CRITICAL DEPTH";
  }, [hubVolume, isHubMuted]);

  return (
    <div className={`min-h-[85vh] flex flex-col transition-all duration-1000 ${isActive ? 'items-center justify-center' : 'space-y-12 pb-24'}`}>
      
      <section className={`flex flex-col items-center justify-center transition-all duration-1000 ${isActive ? 'scale-110 flex-1' : ''}`}>
        {!isActive && (
          <div className={`mb-12 w-full max-w-sm animate-in fade-in slide-in-from-top-6 transition-all duration-500 ${hasTriedToStart ? 'scale-105' : ''}`}>
            <label className={`block text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-center transition-colors ${hasTriedToStart ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
              {hasTriedToStart ? 'Domain Selection Required' : 'Current Domain'}
            </label>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full bg-card border-2 rounded-[32px] px-8 py-5 text-sm font-bold outline-none flex items-center justify-center gap-4 transition-all shadow-lg active:scale-95 ${hasTriedToStart ? 'border-rose-300 ring-4 ring-rose-500/10' : 'border-theme hover:border-indigo-400'}`}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: currentSubject?.color || (hasTriedToStart ? '#f43f5e' : 'var(--text-secondary)') }} />
                <span className={`truncate ${!selectedSub ? 'text-theme-secondary opacity-50' : 'text-theme'}`}>
                  {currentDisplaySubject?.name || 'Select Subject'}
                </span>
                <ChevronDown size={16} className={`text-theme-secondary transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-[calc(100%+12px)] left-0 right-0 glass rounded-[32px] border border-theme shadow-2xl p-2 z-[100] animate-in slide-in-from-top-4 fade-in duration-200 overflow-hidden">
                  <div className="max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {pomodoroSubjects.map(s => (
                      <button key={s.id} onClick={() => { setSelectedSub(s.id); setIsDropdownOpen(false); setHasTriedToStart(false); }} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-left group hover:bg-indigo-50/50 ${selectedSub === s.id ? 'bg-indigo-50' : ''}`}>
                        <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: s.color }} />
                        <span className={`text-xs font-black uppercase tracking-widest truncate ${selectedSub === s.id ? 'text-indigo-600' : 'text-theme'}`}>{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="relative flex items-center justify-center p-6 w-[340px] h-[340px]">
          {isActive && <div className={`absolute inset-0 rounded-full blur-[100px] transition-all duration-[2000ms] animate-pulse ${mode === 'focus' ? 'bg-indigo-500/20' : 'bg-emerald-500/20'}`} />}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle cx="170" cy="170" r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-100/50" />
            <circle cx="170" cy="170" r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 1s linear' }} strokeLinecap="round" className={mode === 'focus' ? 'text-indigo-600' : 'text-emerald-500'} />
          </svg>
          <div className="flex flex-col items-center justify-center text-center pointer-events-none z-10">
            {isActive && currentDisplaySubject && <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4">{currentDisplaySubject.name}</span>}
            <div className={`text-[84px] font-black tracking-tighter tabular-nums leading-none transition-colors ${!selectedSub && !isActive ? 'text-slate-200' : 'text-slate-900'}`}>
              {String(minutes).padStart(2, '0')}<span className={`transition-opacity duration-300 ${seconds % 2 === 0 || !isActive ? 'opacity-100' : 'opacity-20'}`}>:</span>{String(seconds).padStart(2, '0')}
            </div>
            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-400 mt-6 ml-2">{mode === 'focus' ? 'Deep Work' : 'Restoration'}</p>
          </div>
        </div>

        <div className="flex items-center gap-8 mt-16 bg-white/80 backdrop-blur-xl p-4 rounded-[40px] border border-slate-100 shadow-2xl transition-all">
          {!isActive ? (
            <button onClick={startTimer} className={`w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl transition-all group active:scale-90 ${!selectedSub ? 'bg-slate-100 text-slate-300 border border-slate-200' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>
              {!selectedSub ? <Lock size={28} /> : <Play size={32} fill="currentColor" className="ml-1 group-hover:scale-110 transition-transform" />}
            </button>
          ) : (
            <><button onClick={pauseTimer} className="w-20 h-20 rounded-[28px] bg-slate-900 text-white flex items-center justify-center shadow-xl hover:bg-indigo-600 active:scale-90 transition-all group"><Pause size={32} fill="currentColor" /></button>
            <button onClick={() => { if(window.confirm("Abort?")) resetTimer(); }} className="w-20 h-20 rounded-[28px] bg-white text-rose-500 border-2 border-rose-50 flex items-center justify-center shadow-sm hover:bg-rose-50 active:scale-90 transition-all"><X size={32} /></button></>
          )}
          {isActive && <button onClick={() => { if(mode === 'focus') handleFinishEarly(); else handleModeChange('focus'); }} className="p-5 text-emerald-600 hover:bg-emerald-50 rounded-[24px] transition-all group"><CheckCircle2 size={28} /></button>}
          {!isActive && <button onClick={() => setShowSettings(true)} className="p-6 text-slate-400 hover:text-indigo-600 transition-all hover:bg-indigo-50 rounded-[24px] group"><Settings2 size={28} /></button>}
        </div>
      </section>

      {/* Acoustic Hub Layer */}
      {playingYtId && (
        <div className="fixed top-2 right-2 w-[1px] h-[1px] opacity-[0.01] pointer-events-none z-[-100] overflow-hidden">
          <iframe 
            key={`${playingYtId}-${isHubMuted}`}
            width="100" 
            height="100" 
            src={`https://www.youtube.com/embed/${playingYtId}?autoplay=1&mute=${isHubMuted ? 1 : 0}&loop=1&playlist=${playingYtId}&controls=0&modestbranding=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`} 
            title="Zenith Acoustic Hub" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}

      {!isActive && (
        <section className="max-w-7xl mx-auto w-full px-4 space-y-12">
          
          <div className="flex gap-4 p-2 bg-slate-100/50 w-fit mx-auto rounded-[24px] border border-slate-200 shadow-inner">
            <button onClick={() => setActiveTab('stats')} className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <Activity size={16} /> Performance
            </button>
            <button onClick={() => setActiveTab('audio')} className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'audio' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
              <Disc size={16} /> Acoustic Hub
            </button>
          </div>

          <div className="stagger-child-reveal">
            {activeTab === 'stats' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-white p-10 rounded-[56px] border border-slate-100 shadow-sm h-[400px]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4"><div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Activity size={24} /></div><div><h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Focus Velocity</h3><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Rolling 7-Day Performance</p></div></div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest"><TrendingUp size={14} /> Active</div>
                  </div>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dailyData}>
                        <defs><linearGradient id="pomoGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                        <YAxis hide />
                        <Tooltip cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#pomoGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lg:col-span-4 grid grid-cols-1 gap-6">
                  <div className="bg-slate-900 text-white p-10 rounded-[48px] flex items-center gap-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-700"><Flame size={120} /></div>
                    <Flame className="text-orange-500 relative z-10" size={32} />
                    <div className="relative z-10"><p className="text-5xl font-black tabular-nums leading-none tracking-tighter">{streakCount}</p><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Daily Streak</p></div>
                  </div>
                  <div className="bg-indigo-600 text-white p-10 rounded-[48px] flex items-center gap-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute bottom-0 right-0 p-12 opacity-10 group-hover:rotate-12 transition-transform duration-700"><Trophy size={120} /></div>
                    <Trophy className="text-indigo-200 relative z-10" size={32} />
                    <div className="relative z-10"><p className="text-5xl font-black tabular-nums leading-none tracking-tighter">{Math.round(totalFocusMinutes / 60)}h</p><p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mt-2">Total Focus</p></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="lg:col-span-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {AMBIENT_PRESETS.map((p) => (
                      <button 
                        key={p.id} 
                        onClick={() => selectAmbient(p.id, p.ytId)}
                        className={`group p-8 rounded-[40px] border-2 transition-all flex flex-col items-center text-center gap-4 active:scale-95 ${selectedAmbient === p.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl scale-105' : 'bg-white border-slate-100 hover:border-indigo-100 text-slate-600'}`}
                      >
                        <div className={`p-5 rounded-3xl transition-all ${selectedAmbient === p.id ? 'bg-white/20' : 'bg-slate-50 text-indigo-600 group-hover:scale-110'}`}>{p.icon}</div>
                        <span className="text-xs font-black uppercase tracking-widest">{p.label}</span>
                        {selectedAmbient === p.id && (
                          <div className="mt-2 h-4 flex items-center justify-center">
                            <Visualizer isActive={true} volume={hubVolume} isMuted={isHubMuted} color="bg-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><ListMusic size={24} /></div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Custom Engine</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Inject YouTube Playlists or Tracks</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="relative flex-1 group">
                        <Youtube className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" size={20} />
                        <input 
                          className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-14 pr-6 py-5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                          placeholder="Paste YouTube URL..."
                          value={customYtUrl}
                          onChange={(e) => setCustomYtUrl(e.target.value)}
                        />
                      </div>
                      <button 
                        onClick={handleCustomYtSubmit}
                        className="bg-slate-900 text-white px-8 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95"
                      >
                        Initiate
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-6 leading-relaxed flex items-center gap-2">
                      <ShieldCheck size={14} className="text-indigo-400" />
                      Studio audio feed optimized for persistent background playback.
                    </p>
                  </div>
                </div>
                <div className="lg:col-span-4 bg-slate-900 rounded-[56px] p-10 text-white relative overflow-hidden group flex flex-col justify-between">
                  <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 -z-0 scale-125 transition-transform group-hover:rotate-0 duration-[3s]"><Disc size={120} /></div>
                  <div className="relative z-10">
                    <h3 className="text-4xl font-black tracking-tighter leading-none mb-4">Acoustic <br /><span className="text-indigo-400">Environment.</span></h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">High-fidelity ambient masking reduces cognitive friction and improves focus retention.</p>
                  </div>

                  {selectedAmbient ? (
                    <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 mt-12">
                      <div className="p-6 bg-white/10 rounded-[32px] border border-white/10 backdrop-blur-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center animate-spin duration-[8000ms]"><Radio size={24} /></div>
                             <div>
                               <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                                 <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> Live Feed
                               </p>
                               <p className="text-sm font-bold truncate max-w-[140px]">{selectedAmbient === 'custom' ? 'Custom Input' : AMBIENT_PRESETS.find(p => p.id === selectedAmbient)?.label}</p>
                             </div>
                           </div>
                           <Visualizer isActive={true} volume={hubVolume} isMuted={isHubMuted} />
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setIsHubMuted(!isHubMuted)}
                              className={`p-3 rounded-xl transition-all ${isHubMuted ? 'bg-rose-500/20 text-rose-500' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                            >
                              {isHubMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                            <div className="flex-1 space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase text-white/40">
                                <span className="flex items-center gap-1">
                                  <DynamicSignalIcon volume={hubVolume} isMuted={isHubMuted} />
                                  Signal Strength
                                </span>
                                <span className={isHubMuted ? 'text-rose-400' : 'text-indigo-400'}>{signalQuality}</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={hubVolume} 
                                onChange={(e) => setHubVolume(Number(e.target.value))}
                                className={`w-full h-1.5 rounded-full appearance-none cursor-pointer transition-all ${isHubMuted ? 'bg-rose-900/40 accent-rose-500' : 'bg-white/10 accent-indigo-400 hover:bg-white/20'}`}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                             <button className="py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-2">
                               <Zap size={14} className="text-amber-400" /> Boost
                             </button>
                             <button 
                                onClick={() => { setSelectedAmbient(null); setPlayingYtId(null); }} 
                                className="py-3 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20 transition-all flex items-center justify-center gap-2"
                              >
                                <X size={14} /> Kill
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-white/5 rounded-[32px] border border-white/5 text-center italic text-slate-500 text-xs mt-12 flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-full border border-dashed border-slate-700 flex items-center justify-center animate-spin duration-[10s]">
                        <Disc size={20} />
                      </div>
                      Awaiting sonic initiation...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[20px] z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[64px] w-full max-w-5xl p-12 lg:p-16 shadow-2xl relative animate-in zoom-in-95 overflow-hidden">
             <div className="flex items-center justify-between mb-16 relative z-10">
                <div><h3 className="text-5xl font-black tracking-tighter text-slate-900">System Tuning</h3><p className="text-slate-400 text-xs font-black uppercase tracking-[0.4em] mt-2">Zenith Engine Configuration</p></div>
                <button onClick={() => setShowSettings(false)} className="p-4 hover:bg-slate-100 rounded-[28px] transition-transform active:scale-90"><X size={32} /></button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
                <div className="space-y-10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-3"><Clock size={16} /> Phase Cycles</h4>
                    <button onClick={() => setIsHubMuted(!isHubMuted)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isHubMuted ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>{isHubMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}{isHubMuted ? 'Muted' : 'Audio On'}</button>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-4"><div className="flex justify-between items-center ml-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Focus Pulse (Min)</label><span className="text-xs font-black text-indigo-600">{focusDuration}m</span></div><input type="range" min="1" max="90" value={focusDuration} onChange={e => setFocusDuration(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer" /></div>
                    <div className="space-y-4"><div className="flex justify-between items-center ml-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Rest Cycle (Min)</label><span className="text-xs font-black text-emerald-600">{breakDuration}m</span></div><input type="range" min="1" max="30" value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))} className="w-full accent-emerald-500 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer" /></div>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="w-full bg-slate-900 text-white py-7 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3"><RefreshCw size={16} /> Update Params</button>
                </div>
                <div className="bg-slate-50/80 border border-slate-100 rounded-[48px] p-10 space-y-8">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">Vault Control</h4>
                  <div className="grid grid-cols-1 gap-5">
                    <button onClick={() => { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullState)); const dl = document.createElement('a'); dl.setAttribute("href", dataStr); dl.setAttribute("download", `zenith_vault_${new Date().toISOString().split('T')[0]}.json`); dl.click(); }} className="flex items-center justify-between p-7 bg-white border-2 border-transparent hover:border-indigo-100 rounded-[32px] transition-all group shadow-sm">
                      <div className="flex items-center gap-5"><div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Download size={24} /></div><div className="text-left"><p className="text-sm font-black text-slate-900">Secure Backup</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Export Vault</p></div></div>
                    </button>
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
