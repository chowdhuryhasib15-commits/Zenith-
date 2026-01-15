
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Subject, PomodoroLog, AppState } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid
} from 'recharts';
import { 
  Play, Pause, X, 
  Settings2, CheckCircle2, Flame, Trophy, Clock, Trash2, 
  Download, Upload, RefreshCw, Lock, ChevronDown, Volume2, VolumeX
} from 'lucide-react';

interface PomodoroPageProps {
  subjects: Subject[];
  onComplete: (log: PomodoroLog) => void;
  logs: PomodoroLog[];
  fullState: AppState;
  onRestore: (state: AppState) => void;
}

const PomodoroPage: React.FC<PomodoroPageProps> = ({ subjects, onComplete, logs, fullState, onRestore }) => {
  const [focusDuration, setFocusDuration] = useState(52);
  const [breakDuration, setBreakDuration] = useState(17);
  const [minutes, setMinutes] = useState(52);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [hasTriedToStart, setHasTriedToStart] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter subjects to remove "Papers" and deduplicate for a cleaner UI
  const pomodoroSubjects = useMemo(() => {
    const seen = new Set<string>();
    const result: Subject[] = [];
    
    subjects.forEach(s => {
      // Strip "1st Paper", "2nd Paper", "Paper" etc.
      const baseName = s.name.replace(/\s*(1st|2nd)?\s*Paper/gi, '').trim();
      if (!seen.has(baseName)) {
        seen.add(baseName);
        result.push({ ...s, name: baseName });
      }
    });
    return result;
  }, [subjects]);

  const totalSeconds = (mode === 'focus' ? focusDuration : breakDuration) * 60;
  const currentSeconds = minutes * 60 + seconds;
  const progress = ((totalSeconds - currentSeconds) / totalSeconds) * 100;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isActive) {
      setMinutes(mode === 'focus' ? focusDuration : breakDuration);
      setSeconds(0);
    }
  }, [focusDuration, breakDuration, mode, isActive]);

  const playSound = (type: 'complete' | 'transition') => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      if (type === 'complete') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      }
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) { console.warn("Audio blocked", e); }
  };

  const startTimer = () => {
    if (!selectedSub) {
      setHasTriedToStart(true);
      setTimeout(() => setHasTriedToStart(false), 2000);
      return;
    }
    setIsActive(true);
    playSound('transition');
  };

  const pauseTimer = () => {
    setIsActive(false);
    playSound('transition');
  };

  const cancelSession = () => {
    if (window.confirm("Abort this focus session? Progress will not be saved.")) {
      setIsActive(false);
      resetTimer();
    }
  };

  const resetTimer = (newMode?: 'focus' | 'break') => {
    setIsActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const m = newMode || mode;
    setMinutes(m === 'focus' ? focusDuration : breakDuration);
    setSeconds(0);
  };

  const handleModeChange = (newMode: 'focus' | 'break') => {
    setMode(newMode);
    playSound('transition');
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
      playSound('complete');
      handleModeChange('break');
    } else {
      handleModeChange('focus');
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullState));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `zenith_vault_pomodoro_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (window.confirm("CRITICAL: This will overwrite current data. Continue?")) {
          onRestore(importedData);
          alert("Vault restored successfully.");
        }
      } catch (error) {
        alert("Invalid vault file.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (window.confirm("FINAL WARNING: This will permanently DELETE all study data. Purge system?")) {
      localStorage.clear();
      window.location.reload();
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
          playSound('complete');
          if (mode === 'focus') {
            onComplete({ id: Date.now().toString(), subjectId: selectedSub, duration: focusDuration, timestamp: new Date().toISOString() });
            handleModeChange('break');
          } else {
            handleModeChange('focus');
          }
        }
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, minutes, seconds, mode, selectedSub, focusDuration]);

  const streakCount = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter(l => new Date(l.timestamp).toDateString() === today).length;
  }, [logs]);

  const totalFocusMinutes = useMemo(() => logs.reduce((acc, l) => acc + l.duration, 0), [logs]);

  const dailyData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    return last7Days.map(dateStr => {
      const dayLogs = logs.filter(l => new Date(l.timestamp).toDateString() === dateStr);
      const total = dayLogs.reduce((acc, l) => acc + l.duration, 0);
      return { 
        name: dateStr.split(' ')[0], 
        minutes: total 
      };
    });
  }, [logs]);

  const radius = 130;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const currentSubject = subjects.find(s => s.id === selectedSub);
  const currentDisplaySubject = pomodoroSubjects.find(s => s.id === selectedSub);

  return (
    <div className={`min-h-[85vh] flex flex-col transition-all duration-1000 ${isActive ? 'items-center justify-center' : 'space-y-12'}`}>
      
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
                    {pomodoroSubjects.length === 0 ? (
                      <div className="p-4 text-center text-xs font-bold text-theme-secondary uppercase tracking-widest italic opacity-50">
                        No subjects found
                      </div>
                    ) : (
                      pomodoroSubjects.map(s => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedSub(s.id);
                            setIsDropdownOpen(false);
                            setHasTriedToStart(false);
                          }}
                          className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-left group hover:bg-indigo-50/50 ${selectedSub === s.id ? 'bg-indigo-50' : ''}`}
                        >
                          <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: s.color }} />
                          <span className={`text-xs font-black uppercase tracking-widest truncate ${selectedSub === s.id ? 'text-indigo-600' : 'text-theme'}`}>
                            {s.name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="relative flex items-center justify-center p-6 w-[340px] h-[340px]">
          {isActive && (
            <div className={`absolute inset-0 rounded-full blur-[100px] transition-all duration-[2000ms] animate-pulse ${mode === 'focus' ? 'bg-indigo-500/20' : 'bg-emerald-500/20'}`} />
          )}
          
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle cx="170" cy="170" r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-100/50" />
            <circle 
              cx="170" cy="170" r={radius} 
              stroke="currentColor" 
              strokeWidth={strokeWidth} 
              fill="transparent" 
              strokeDasharray={circumference} 
              style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }} 
              strokeLinecap="round" 
              className={mode === 'focus' ? 'text-indigo-600' : 'text-emerald-500'}
            />
          </svg>

          <div className="flex flex-col items-center justify-center text-center pointer-events-none z-10">
            {isActive && currentDisplaySubject && (
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4">
                {currentDisplaySubject.name}
              </span>
            )}
            <div className={`text-[84px] font-black tracking-tighter tabular-nums leading-none transition-colors ${!selectedSub && !isActive ? 'text-slate-200' : 'text-slate-900'}`}>
              {String(minutes).padStart(2, '0')}
              <span className={`transition-opacity duration-300 ${seconds % 2 === 0 || !isActive ? 'opacity-100' : 'opacity-20'}`}>:</span>
              {String(seconds).padStart(2, '0')}
            </div>
            <p className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-400 mt-6 ml-2">
              {mode === 'focus' ? 'Deep Work' : 'Restoration'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8 mt-16 bg-white/80 backdrop-blur-xl p-4 rounded-[40px] border border-slate-100 shadow-2xl transition-all">
          {!isActive ? (
            <button 
              onClick={startTimer} 
              className={`w-20 h-20 rounded-[28px] flex items-center justify-center shadow-2xl transition-all group active:scale-90 ${!selectedSub ? 'bg-slate-100 text-slate-300 border border-slate-200' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
            >
              {!selectedSub ? <Lock size={28} /> : <Play size={32} fill="currentColor" className="ml-1 group-hover:scale-110 transition-transform" />}
            </button>
          ) : (
            <>
              <button onClick={pauseTimer} className="w-20 h-20 rounded-[28px] bg-slate-900 text-white flex items-center justify-center shadow-xl hover:bg-indigo-600 active:scale-90 transition-all group">
                <Pause size={32} fill="currentColor" />
              </button>
              <button onClick={cancelSession} className="w-20 h-20 rounded-[28px] bg-white text-rose-500 border-2 border-rose-50 flex items-center justify-center shadow-sm hover:bg-rose-50 active:scale-90 transition-all">
                <X size={32} />
              </button>
            </>
          )}
          {isActive && (
            <button onClick={handleFinishEarly} className="p-5 text-emerald-600 hover:bg-emerald-50 rounded-[24px] transition-all group">
              <CheckCircle2 size={28} />
            </button>
          )}
          {!isActive && (
             <button onClick={() => setShowSettings(true)} className="p-6 text-slate-400 hover:text-indigo-600 transition-all hover:bg-indigo-50 rounded-[24px] group">
                <Settings2 size={28} />
             </button>
          )}
        </div>
      </section>

      {!isActive && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 max-w-7xl mx-auto w-full px-4">
          <div className="lg:col-span-8 bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm flex flex-col h-[300px]">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Clock size={20} /></div>
              <div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Focus Momentum</h3>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">7 Day Velocity</p>
              </div>
            </div>
            <div className="flex-1 w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 15px 20px -5px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  />
                  <Bar dataKey="minutes" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-6">
            <div className="bg-slate-900 text-white p-7 rounded-[40px] flex items-center gap-5 shadow-2xl relative overflow-hidden group h-full">
              <Flame className="text-orange-500 relative z-10" size={24} />
              <div className="relative z-10">
                <p className="text-3xl font-black tabular-nums leading-none">{streakCount}</p>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Daily Streak</p>
              </div>
            </div>
            <div className="bg-indigo-600 text-white p-7 rounded-[40px] flex items-center gap-5 shadow-xl relative overflow-hidden group h-full">
              <Trophy className="text-indigo-200 relative z-10" size={24} />
              <div className="relative z-10">
                <p className="text-3xl font-black tabular-nums leading-none">{Math.round(totalFocusMinutes / 60)}h</p>
                <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mt-1">Total Focus</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {showSettings && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[20px] z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[64px] w-full max-w-5xl p-12 lg:p-16 shadow-2xl relative animate-in zoom-in-95 overflow-hidden">
             <div className="flex items-center justify-between mb-16 relative z-10">
                <div>
                  <h3 className="text-5xl font-black tracking-tighter text-slate-900">System Tuning</h3>
                  <p className="text-slate-400 text-xs font-black uppercase tracking-[0.4em] mt-2">Zenith Engine Configuration</p>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-4 hover:bg-slate-100 rounded-[28px] transition-transform active:scale-90"><X size={32} /></button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
                <div className="space-y-10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] flex items-center gap-3"><Clock size={16} /> Phase Cycles</h4>
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isMuted ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}
                    >
                      {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      {isMuted ? 'Muted' : 'Audio On'}
                    </button>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Focus Pulse (Min)</label>
                        <span className="text-xs font-black text-indigo-600">{focusDuration}m</span>
                      </div>
                      <input type="range" min="1" max="90" value={focusDuration} onChange={e => setFocusDuration(Number(e.target.value))} className="w-full accent-indigo-600 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Rest Cycle (Min)</label>
                        <span className="text-xs font-black text-emerald-600">{breakDuration}m</span>
                      </div>
                      <input type="range" min="1" max="30" value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))} className="w-full accent-emerald-500 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer" />
                    </div>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="w-full bg-slate-900 text-white py-7 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                    <RefreshCw size={16} /> Update Params
                  </button>
                </div>
                <div className="bg-slate-50/80 border border-slate-100 rounded-[48px] p-10 space-y-8">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3"><Download size={16} /> Data Operations</h4>
                  <div className="grid grid-cols-1 gap-5">
                    <button onClick={handleExportData} className="flex items-center justify-between p-7 bg-white border-2 border-transparent hover:border-indigo-100 rounded-[32px] transition-all group shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Download size={24} /></div>
                        <div className="text-left"><p className="text-sm font-black text-slate-900">Secure Backup</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Export Vault</p></div>
                      </div>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-between p-7 bg-white border-2 border-transparent hover:border-emerald-100 rounded-[32px] transition-all group shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Upload size={24} /></div>
                        <div className="text-left"><p className="text-sm font-black text-slate-900">Restore Vault</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Import JSON</p></div>
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportData} />
                    </button>
                    <div className="h-px bg-slate-200 my-4" />
                    <button onClick={handleClearAllData} className="w-full bg-rose-50 text-rose-500 border-2 border-rose-100 rounded-[32px] py-7 font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-rose-100 transition-all active:scale-95">
                      <Trash2 size={20} /> Purge Study Data
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
