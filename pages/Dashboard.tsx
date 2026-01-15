
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Subject, Chapter } from '../types';
import { ICONS } from '../constants';
import { getStudyInsights } from '../services/geminiService';
import { Timer, Edit2, X, AlertCircle, Zap, Brain, ChevronRight, Sparkles, GraduationCap, UserCircle, Download, ShieldCheck, Target } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onNavigate: (id: string) => void;
  onUpdateDeadline: (date: string) => void;
}

const ZenithIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <div className={`relative ${className} flex items-center justify-center`}>
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]">
      <path d="M12 3L4 19H20L12 3Z" className="fill-white/20 stroke-white" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 3L8 19H16L12 3Z" className="fill-white/40 stroke-white" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 1L13.5 4.5L17 6L13.5 7.5L12 11L10.5 7.5L7 6L10.5 4.5L12 1Z" fill="white" />
    </svg>
  </div>
);

const REVISION_INTERVALS = [1, 3, 7, 14, 30];

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate, onUpdateDeadline }) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [tempDeadline, setTempDeadline] = useState(state.syllabusDeadline || '');
  const [timeLeft, setTimeLeft] = useState<{ mo: number; d: number; h: number } | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoadingInsights(true);
      const res = await getStudyInsights(state);
      setInsights(res);
      setLoadingInsights(false);
    };
    fetchInsights();
  }, [state.pomodoroLogs.length, state.results.length]);

  useEffect(() => {
    if (!state.syllabusDeadline) {
      setTimeLeft(null);
      return;
    }
    const calculateTime = () => {
      const target = new Date(state.syllabusDeadline!).getTime();
      const now = new Date().getTime();
      const difference = target - now;
      if (difference <= 0) {
        setTimeLeft({ mo: 0, d: 0, h: 0 });
        return;
      }
      const totalHours = Math.floor(difference / (1000 * 60 * 60));
      const totalDays = Math.floor(totalHours / 24);
      const mo = Math.floor(totalDays / 30);
      const d = totalDays % 30;
      const h = totalHours % 24;
      setTimeLeft({ mo, d, h });
    };
    calculateTime();
    const interval = setInterval(calculateTime, 1000 * 60);
    return () => clearInterval(interval);
  }, [state.syllabusDeadline]);

  const revisionQueue = useMemo(() => {
    const now = new Date().getTime();
    const queue: (Chapter & { subjectName: string; subjectId: string; color: string; dueInDays: number; intervalName: string })[] = [];
    state.subjects.forEach(sub => {
      sub.chapters.forEach(chap => {
        if (chap.isCompleted && (chap.lastRevisedAt || chap.completedAt)) {
          const lastEventDate = new Date(chap.lastRevisedAt || chap.completedAt!).getTime();
          const daysSinceLastEvent = (now - lastEventDate) / (1000 * 3600 * 24);
          const currentRevCount = chap.revisions || 0;
          const requiredInterval = REVISION_INTERVALS[currentRevCount] || 30;

          if (daysSinceLastEvent >= requiredInterval) {
            queue.push({
              ...chap,
              subjectName: sub.name,
              subjectId: sub.id,
              color: sub.color,
              dueInDays: Math.floor(daysSinceLastEvent),
              intervalName: currentRevCount === 0 ? "Initial Review" : 
                            currentRevCount === 1 ? "Retention Sync" :
                            currentRevCount === 2 ? "Long-Term Lock" : "Mastery Review"
            });
          }
        }
      });
    });
    return queue.sort((a, b) => b.dueInDays - a.dueInDays).slice(0, 5);
  }, [state.subjects]);

  const totalChapters = state.subjects.reduce((acc, s) => acc + s.chapters.length, 0);
  const completedChapters = state.subjects.reduce((acc, s) => acc + s.chapters.filter(c => c.isCompleted).length, 0);
  const progressPercent = totalChapters === 0 ? 0 : Math.round((completedChapters / totalChapters) * 100);
  const totalFocusMinutes = state.pomodoroLogs.reduce((acc, l) => acc + l.duration, 0);
  const averageResult = state.results.length === 0 ? 0 : Math.round((state.results.reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks), 0) / state.results.length) * 100);

  const radius = 72;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="space-y-6 stagger-fade-in max-w-7xl mx-auto pb-12">
      
      {/* Detail Achievement Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/40 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-sm mb-4">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center text-white shadow-lg">
               <ZenithIcon className="w-6 h-6" />
            </div>
            <div>
               <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global Progress</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Academic Trajectory Analysis</p>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <ShieldCheck size={14} className="text-emerald-500" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Local Data Vault Secure</span>
            </div>
            {state.lastSyncedAt && (
               <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                  <Download size={12} className="text-indigo-400" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Last Export: {new Date(state.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
            )}
         </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[360px]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <div className="mb-6 max-w-2xl group/quote border-l-4 border-indigo-100 pl-5 py-1">
              <p className="text-[11px] font-medium text-slate-400 italic leading-relaxed">
                "Success is not final, failure is not fatal: it is the courage to continue that counts."
              </p>
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-2 opacity-60">— Winston Churchill</p>
            </div>

            <div className="flex items-center gap-6 mb-2">
               <div className="relative shrink-0">
                 <img src={state.user?.photoURL} className="w-20 h-20 rounded-3xl shadow-xl border-4 border-white ring-1 ring-slate-100 object-cover" alt="User" />
                 <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg" />
               </div>
               <div className="flex-1">
                 <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">Welcome, {state.user?.name.split(' ')[0]}</h1>
                 <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                       <GraduationCap size={12} /> {state.user?.education || 'Student'}
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-wider">
                       <UserCircle size={12} /> {state.user?.age || '--'} Years
                    </div>
                 </div>
                 <p className="text-sm text-slate-500 font-medium mt-3">
                   Achievement Score: <span className="text-indigo-600 font-bold">{progressPercent}% Mastery</span>
                 </p>
               </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="bg-slate-900 text-white rounded-[32px] p-6 flex items-center justify-between shadow-2xl">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-300 backdrop-blur-md"><Timer size={20} /></div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Target Date</p>
                    <button onClick={() => setIsEditingDeadline(true)} className="text-sm font-black text-white hover:text-indigo-400 transition-colors flex items-center gap-2 mt-1">
                      {state.syllabusDeadline ? new Date(state.syllabusDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Set Deadline'}
                      <Edit2 size={12} />
                    </button>
                  </div>
               </div>
               <div className="text-right">
                  {timeLeft && (
                    <div className="flex flex-col items-end">
                      <p className="text-xl font-black leading-none">{timeLeft.mo}M {timeLeft.d}D</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black mt-1">Countdown</p>
                    </div>
                  )}
               </div>
            </div>

            <button 
              onClick={() => onNavigate('revision')}
              className={`rounded-[32px] p-6 flex items-center justify-between transition-all hover:scale-[1.02] active:scale-95 ${revisionQueue.length > 0 ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}
            >
               <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${revisionQueue.length > 0 ? 'bg-white/20 shadow-inner' : 'bg-slate-200'}`}><Zap size={20} /></div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Spaced Repetition</p>
                    <p className="text-sm font-black mt-1">{revisionQueue.length > 0 ? `${revisionQueue.length} Due for Sync` : 'Optimal Retention'}</p>
                  </div>
               </div>
               <ChevronRight size={20} className="opacity-40" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -z-0 opacity-40 transition-transform group-hover:scale-110 duration-700" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 relative z-10">Academic Syllabus</h3>
          
          <div className="relative w-44 h-44 flex items-center justify-center my-6 z-10">
            <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full -rotate-90">
              <defs>
                <linearGradient id="circle_grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <circle cx="80" cy="80" r={radius} stroke="#f8fafc" strokeWidth={strokeWidth} fill="none" />
              <circle 
                cx="80" cy="80" r={radius} 
                stroke="url(#circle_grad)" 
                strokeWidth={strokeWidth} 
                fill="none" 
                strokeDasharray={circumference} 
                strokeDashoffset={dashOffset} 
                strokeLinecap="round" 
                className="transition-all duration-[1.5s] ease-[cubic-bezier(0.34,1.56,0.64,1)]" 
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-5xl font-black text-slate-900 leading-none tracking-tighter">{progressPercent}%</span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">Completed</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full relative z-10">
            <div className="bg-slate-50 p-3.5 rounded-[24px] border border-slate-100">
              <p className="text-lg font-black text-slate-900 leading-none">{Math.floor(totalFocusMinutes / 60)}h</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Study Time</p>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-[24px] border border-slate-100">
              <p className="text-lg font-black text-slate-900 leading-none">{averageResult}%</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Exam Avg</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-100 text-violet-600 rounded-2xl shadow-sm"><Brain size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Revision Queue</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Spaced Repetition Schedule</p>
              </div>
            </div>
            <button onClick={() => onNavigate('revision')} className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">Lab Studio</button>
          </div>
          
          <div className="space-y-4">
            {revisionQueue.length > 0 ? revisionQueue.map((chap) => (
              <div key={`${chap.subjectId}-${chap.id}`} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl hover:bg-white border border-transparent hover:border-violet-100 hover:shadow-xl hover:shadow-violet-100/20 transition-all duration-300">
                <div className="flex items-center gap-5 min-w-0">
                  <div className="w-2 h-10 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: chap.color }} />
                  <div className="truncate">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{chap.subjectName}</span>
                    <h4 className="text-lg font-bold text-slate-800 tracking-tight truncate mt-1">{chap.name}</h4>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-full">{chap.intervalName}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-2">Cycle #{chap.revisions + 1}</p>
                </div>
              </div>
            )) : (
              <div className="py-16 text-center bg-slate-50/50 rounded-[40px] border-4 border-dashed border-slate-100">
                <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] italic">Knowledge Retained</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 text-white p-9 rounded-[48px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-[2s]"><Sparkles size={80} /></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 bg-white/10 rounded-xl text-indigo-300 shadow-inner">{ICONS.AI}</div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-300">Zenith AI Insights</h3>
              </div>
              {loadingInsights ? (
                <div className="space-y-5 animate-pulse">
                  <div className="h-2.5 bg-white/10 rounded-full w-full" />
                  <div className="h-2.5 bg-white/10 rounded-full w-4/5" />
                  <div className="h-2.5 bg-white/10 rounded-full w-3/4" />
                </div>
              ) : (
                <ul className="space-y-6">
                  {insights.map((insight, i) => (
                    <li key={i} className="flex gap-5 text-sm font-medium text-slate-300 leading-relaxed group/item hover:translate-x-2 transition-transform">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0 shadow-lg shadow-indigo-500/50" />
                      {insight}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white p-9 rounded-[48px] border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Study Stream</h3>
               <button onClick={() => onNavigate('pomodoro')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Open Timer</button>
             </div>
             <div className="space-y-4">
              {state.pomodoroLogs.slice(-2).reverse().map((log, i) => {
                const sub = state.subjects.find(s => s.id === log.subjectId);
                return (
                  <div key={i} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl border border-transparent hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: sub?.color || '#cbd5e1' }} />
                      <span className="text-sm font-bold text-slate-700 tracking-tight">{sub?.name || 'Quick Sync'}</span>
                    </div>
                    <span className="text-xs font-black text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">{log.duration}m</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isEditingDeadline && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] w-full max-md p-12 shadow-2xl relative animate-in zoom-in-95 duration-500">
            <button onClick={() => setIsEditingDeadline(false)} className="absolute top-10 right-10 p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"><X size={24} /></button>
            <div className="flex items-center gap-5 mb-10"><div className="p-4 bg-indigo-100 text-indigo-600 rounded-3xl"><AlertCircle size={32} /></div><h2 className="text-3xl font-black tracking-tight text-slate-900">Final Target</h2></div>
            <form onSubmit={(e) => { e.preventDefault(); onUpdateDeadline(tempDeadline); setIsEditingDeadline(false); }} className="space-y-8">
              <div><label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-1">Syllabus Completion Date</label><input type="date" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-black text-slate-700 shadow-inner" value={tempDeadline} onChange={e => setTempDeadline(e.target.value)} /></div>
              <button className="w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black text-xl shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Lock Milestone</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
