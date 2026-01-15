
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Subject, PomodoroLog } from '../types';
import { 
  History, BarChart2, Calendar, Clock as ClockIcon, 
  RotateCcw, Play, Pause, SkipForward, 
  Volume2, VolumeX, Sparkles, Brain, Coffee, Plus, Minus, Settings2,
  CheckCircle2, X, BookOpen
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
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (type === 'success' ? 0.5 : 0.3));
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

  const radius = 150;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const currentSubject = subjects.find(s => s.id === selectedSub);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 flex flex-col items-center max-w-6xl mx-auto pb-40">
      
      <div className={`fixed inset-0 pointer-events-none transition-all duration-1000 z-0 ${isActive ? 'opacity-20' : 'opacity-0'}`}>
        <div className={`absolute inset-0 ${mode === 'focus' ? 'bg-indigo-600/10' : 'bg-emerald-600/10'} blur-[140px] scale-150`} />
      </div>

      <header className="w-full flex flex-col items-center text-center space-y-4 relative z-10">
        <div className={`flex items-center gap-3 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-lg transition-all duration-500 ${isActive ? 'scale-95 opacity-60' : 'scale-100'}`}>
          <Sparkles size={14} className={mode === 'focus' ? 'text-indigo-500' : 'text-emerald-500'} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Flow State Active</span>
        </div>
      </header>

      <div className="w-full flex flex-col items-center gap-6 relative z-10">
        <div className="relative scale-90">
          <div className={`absolute inset-0 blur-[100px] rounded-full transition-all duration-1000 ${isActive ? 'scale-125 opacity-40' : 'scale-75 opacity-0'} ${mode === 'focus' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
          <div className="relative flex items-center justify-center">
            <svg className="w-[360px] h-[360px] transform -rotate-90">
              <circle cx="180" cy="180" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100/50" />
              <circle cx="180" cy="180" r={radius} stroke={mode === 'focus' ? '#6366f1' : '#10b981'} strokeWidth="10" fill="transparent" strokeDasharray={circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }} strokeLinecap="round" className={isActive ? 'animate-pulse' : ''} />
            </svg>
            <div className={`absolute flex flex-col items-center transition-all duration-700 ${isActive ? 'scale-110' : 'scale-100'}`}>
              <div className="text-[90px] font-black text-slate-900 tracking-tighter tabular-nums leading-none flex items-baseline">
                {String(minutes).padStart(2, '0')}
                <span className={`text-3xl mx-1 transition-opacity ${seconds % 2 === 0 || !isActive ? 'opacity-100' : 'opacity-10'}`}>:</span>
                {String(seconds).padStart(2, '0')}
              </div>
              <div className="mt-3 flex flex-col items-center gap-2.5">
                <div className={`px-4 py-1 rounded-full border text-[8px] font-black uppercase tracking-[0.4em] ${mode === 'focus' ? 'bg-indigo-50 border-indigo-100 text-indigo-500' : 'bg-emerald-50 border-emerald-100 text-emerald-500'}`}>
                   {isActive ? (mode === 'focus' ? 'Concentration' : 'Recovery') : 'Idle'}
                </div>
                {!isActive && (
                  <button onClick={() => setShowSubjectPrompt(true)} className="flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-lg hover:bg-white transition-all shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentSubject?.color || '#cbd5e1' }} />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{currentSubject?.name || 'Set Topic'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/60 backdrop-blur-2xl p-4 rounded-[36px] border border-white shadow-xl shadow-slate-200/40">
          <button onClick={() => setIsMuted(!isMuted)} className="p-2.5 text-slate-300 hover:text-indigo-600 transition-all">{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
          <button onClick={() => setShowSettings(true)} className="p-2.5 text-slate-300 hover:text-indigo-600 transition-all"><Settings2 size={18} /></button>
          <button onClick={isActive ? pauseTimer : startTimer} className={`w-16 h-16 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center ${mode === 'focus' ? 'bg-slate-900 text-white shadow-indigo-200' : 'bg-emerald-600 text-white shadow-emerald-200'}`}>{isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="ml-1" fill="currentColor" />}</button>
          <button onClick={handleFinishEarly} className={`p-2.5 transition-all ${mode === 'focus' ? 'text-indigo-400 hover:text-indigo-600' : 'text-emerald-400 hover:text-emerald-600'}`} title="Log & Break"><CheckCircle2 size={22} /></button>
          <button onClick={() => handleModeChange(mode === 'focus' ? 'break' : 'focus')} className="p-2.5 text-slate-300 hover:text-indigo-600 transition-all"><SkipForward size={18} /></button>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-5 pt-8 border-t border-slate-100">
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Focus Distribution</h3>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Rolling Weekly Average</p>
            </div>
            <BarChart2 size={16} className="text-indigo-500" />
          </div>
          <div className="space-y-3">
            {weeklyAnalytics.length > 0 ? weeklyAnalytics.map((sub) => (
              <div key={sub.id}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sub.color }} />
                     <span className="text-[10px] font-bold text-slate-700 truncate max-w-[140px]">{sub.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-900">{sub.minutes}<span className="text-[7px] text-slate-400 ml-0.5 uppercase">m</span></span>
                </div>
                <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-[1s]" style={{ width: `${Math.min(100, (sub.minutes / 500) * 100)}%`, backgroundColor: sub.color }} />
                </div>
              </div>
            )) : <p className="text-[9px] text-slate-300 text-center py-4 font-black uppercase tracking-widest">No focus cycles detected</p>}
          </div>
        </div>

        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex flex-col max-h-[250px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Recent Sessions</h3>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Chronological Log</p>
            </div>
            <History size={16} className="text-slate-300" />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
            {logs.length > 0 ? [...logs].reverse().map((log) => {
              const sub = subjects.find(s => s.id === log.subjectId);
              return (
                <div key={log.id} className="flex items-center justify-between p-2.5 bg-slate-50/50 hover:bg-white border border-transparent hover:border-slate-100 rounded-lg transition-all">
                  <div className="flex items-center gap-2">
                    <div className="w-0.5 h-6 rounded-full" style={{ backgroundColor: sub?.color || '#cbd5e1' }} />
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-800 leading-none truncate max-w-[100px]">{sub?.name || 'Quick Flow'}</h4>
                      <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-900">{log.duration}<span className="text-[7px] text-slate-400 ml-0.5">m</span></span>
                </div>
              );
            }) : <p className="text-[9px] text-slate-300 text-center py-4 font-black uppercase tracking-widest italic">The log is empty</p>}
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-50"><X size={20} /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Settings2 size={20} /></div>
              <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">Session Setup</h3>
            </div>
            <div className="space-y-5">
              {[ { l: 'Concentration', v: focusDuration, t: 'focus' }, { l: 'Recovery', v: breakDuration, t: 'break' } ].map(item => (
                <div key={item.t} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                   <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">{item.l}</span>
                   <div className="flex items-center gap-3">
                      <button onClick={() => adjustTime(item.t as any, -1)} className="p-1 text-slate-400 hover:text-indigo-600"><Minus size={16} /></button>
                      <span className="text-lg font-black text-slate-900 w-8 text-center">{item.v}</span>
                      <button onClick={() => adjustTime(item.t as any, 1)} className="p-1 text-slate-400 hover:text-indigo-600"><Plus size={16} /></button>
                   </div>
                </div>
              ))}
              <button onClick={() => setShowSettings(false)} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all">Lock Configurations</button>
            </div>
          </div>
        </div>
      )}

      {showSubjectPrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-3xl z-[110] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[40px] w-full max-w-xl p-8 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-6 shrink-0">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-indigo-600 text-white rounded-xl"><BookOpen size={20} /></div>
                 <div>
                   <h2 className="text-xl font-black text-slate-900 tracking-tighter">Mission Selection</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select focus objective</p>
                 </div>
               </div>
               <button onClick={() => setShowSubjectPrompt(false)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
               <button onClick={() => { setSelectedSub(''); setShowSubjectPrompt(false); startTimer(); }} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${!selectedSub ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 hover:border-indigo-200 hover:bg-slate-50'}`}>
                 <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm"><Sparkles size={16} /></div>
                 <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">General Sync</span>
               </button>
               {subjects.map(s => (
                 <button key={s.id} onClick={() => { setSelectedSub(s.id); setShowSubjectPrompt(false); startTimer(); }} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${selectedSub === s.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-50 hover:border-indigo-200 hover:bg-slate-50'}`}>
                   <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-md shrink-0" style={{ backgroundColor: s.color }}>{s.name.charAt(0)}</div>
                   <div className="text-left overflow-hidden">
                     <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest truncate">{s.name}</p>
                     <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">{s.chapters.length} Topics</p>
                   </div>
                 </button>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroPage;
