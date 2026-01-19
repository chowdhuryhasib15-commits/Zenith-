
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, Subject, Chapter, StudyTask, Goal } from '../types';
import { ICONS } from '../constants';
import { getStudyInsights, getDailyStudyPlan, getDynamicGreeting } from '../services/geminiService';
import { Timer, Edit2, X, AlertCircle, Zap, Brain, ChevronRight, Sparkles, GraduationCap, UserCircle, Download, ShieldCheck, RefreshCw, ListTodo, Clock, Sprout, Flower2, Leaf, Target, TrendingUp, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onNavigate: (id: string) => void;
  onUpdateDeadline: (date: string) => void;
  onSetStudyPlan: (plan: StudyTask[]) => void;
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

// High-Fidelity Plant Visualizer
export const NeuralGarden = ({ streak, isWilted, scale = 1 }: { streak: number; isWilted: boolean; scale?: number }) => {
  const levels = streak >= 12 ? 5 : streak >= 8 ? 4 : streak >= 4 ? 3 : streak >= 1 ? 2 : 1;
  
  return (
    <div className="relative w-full h-56 flex flex-col justify-end items-center perspective-1000 overflow-visible">
      {/* UI Labels */}
      <div className="absolute top-0 left-8 z-30 text-left pointer-events-none">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Zenith Arboreatum</p>
        <p className={`text-xl font-black ${isWilted ? 'text-amber-700' : 'text-slate-900'} tracking-tighter whitespace-nowrap`}>
          {isWilted ? 'Dormant' : levels === 5 ? 'Zenith Bloom' : levels === 4 ? 'Flourishing' : levels === 3 ? 'Resilient' : levels === 2 ? 'Robust Growth' : 'New Sprout'}
        </p>
      </div>

      {/* Scalable Plant Graphics */}
      <div 
        className="relative w-full h-40 flex items-end justify-center transition-transform duration-1000 origin-bottom"
        style={{ transform: `scale(${scale})` }}
      >
        <div className="absolute inset-x-0 bottom-0 h-4 bg-slate-900/10 blur-xl rounded-full scale-x-50 mx-auto" />
        
        {/* Soil / Ground */}
        <div className={`w-32 h-6 rounded-[100%] absolute bottom-2 transition-all duration-1000 ${isWilted ? 'bg-amber-900/30' : 'bg-slate-200 shadow-inner'}`} />

        {/* The Plant */}
        <div className="relative flex flex-col items-center transition-all duration-1000">
          {isWilted ? (
            <div className="flex flex-col items-center animate-in fade-in duration-1000 mb-2">
              <div className="w-1.5 h-16 bg-amber-800/40 rounded-full rotate-[25deg] origin-bottom transition-all duration-1000 shadow-sm" />
              <Leaf size={24} className="text-amber-900/30 -rotate-45 -translate-x-6 translate-y-4 opacity-50" />
              <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest mt-6 bg-amber-50 px-2 py-0.5 rounded-full">Growth Halted</p>
            </div>
          ) : (
            <div className="flex flex-col items-center mb-2">
               {levels >= 5 && (
                 <div className="relative animate-bounce duration-[4s] mb-[-6px] z-20">
                   <Flower2 size={40} className="text-violet-600 drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]" />
                   <div className="absolute -inset-4 bg-violet-500/10 blur-2xl rounded-full -z-10 animate-pulse" />
                 </div>
               )}
               
               {levels >= 4 && (
                 <div className="relative flex gap-2 mb-[-4px] z-10 animate-in zoom-in slide-in-from-bottom-4 duration-1000">
                   <Flower2 size={24} className="text-indigo-400 opacity-60 -rotate-12" />
                   <Flower2 size={24} className="text-indigo-400 opacity-60 rotate-12" />
                 </div>
               )}

               {levels >= 3 && (
                 <div className="flex gap-2 animate-in zoom-in slide-in-from-bottom-2 duration-700">
                    <Leaf size={24} className="text-indigo-400 rotate-45 translate-x-2" />
                    <Leaf size={24} className="text-indigo-500 -rotate-45 -translate-x-2 translate-y-2" />
                 </div>
               )}

               {levels >= 2 && (
                 <div className="w-2 h-20 bg-gradient-to-t from-slate-200 to-indigo-500 rounded-full shadow-inner relative">
                    <div className="absolute top-4 -left-5 rotate-[-45deg] scale-90 opacity-80"><Leaf size={18} className="text-indigo-300" /></div>
                    <div className="absolute top-10 -right-5 rotate-[45deg] scale-90 opacity-80"><Leaf size={18} className="text-indigo-300" /></div>
                 </div>
               )}

               {levels === 1 && (
                 <div className="animate-pulse mb-2">
                   <Sprout size={36} className="text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]" />
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const REVISION_INTERVALS = [1, 3, 7, 14, 30];

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate, onUpdateDeadline, onSetStudyPlan }) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [tempDeadline, setTempDeadline] = useState(state.syllabusDeadline || '');
  const [timeLeft, setTimeLeft] = useState<{ mo: number; d: number; h: number } | null>(null);
  const [dynamicGreeting, setDynamicGreeting] = useState<string>('');

  useEffect(() => {
    const fetchGreeting = async () => {
      if (state.user) {
        const greet = await getDynamicGreeting(state.user);
        setDynamicGreeting(greet);
      }
    };
    fetchGreeting();
    
    const fetchInsights = async () => {
      setLoadingInsights(true);
      const res = await getStudyInsights(state);
      setInsights(res);
      setLoadingInsights(false);
    };
    fetchInsights();
  }, [state.pomodoroLogs.length, state.exams.length, state.user]);

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
              subjectName: sub.name.replace(/\s*(1st|2nd)?\s*Paper/gi, '').trim(),
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

  const pendingGoals = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStr = now.toISOString().split('T')[0];

    return state.goals.filter(goal => {
      const gDate = new Date(goal.date);
      gDate.setHours(0, 0, 0, 0);
      const gDateStr = gDate.toISOString().split('T')[0];

      // CRITICAL: Hide future tasks from the dashboard
      if (gDate > now) return false;

      const isToday = gDateStr === todayStr;

      if (goal.recurrence === 'none') {
        // Show if not done (either today or from previous days)
        return !goal.isDone;
      } else {
        // Recurring Goals
        const alreadyDoneToday = goal.completedDates?.includes(todayStr);
        if (alreadyDoneToday) return false;

        // Only show if it's due today based on its recurrence type
        if (goal.recurrence === 'daily') return true;
        if (goal.recurrence === 'weekly') return now.getDay() === gDate.getDay();
        if (goal.recurrence === 'monthly') return now.getDate() === gDate.getDate();
        
        return false;
      }
    }).map(goal => ({
      ...goal,
      isOverdue: new Date(goal.date).setHours(0,0,0,0) < now.getTime() && goal.recurrence === 'none'
    })).slice(0, 8);
  }, [state.goals]);

  const totalChapters = state.subjects.reduce((acc, s) => acc + s.chapters.length, 0);
  const completedChapters = state.subjects.reduce((acc, s) => acc + s.chapters.filter(c => c.isCompleted).length, 0);
  const progressPercent = totalChapters === 0 ? 0 : Math.round((completedChapters / totalChapters) * 100);
  const totalFocusMinutes = state.pomodoroLogs.reduce((acc, l) => acc + l.duration, 0);
  
  const gradedExams = state.exams.filter(e => e.isGraded);
  const averageResult = gradedExams.length === 0 ? 0 : Math.round((gradedExams.reduce((acc, r) => acc + ((r.obtainedMarks || 0) / (r.totalMarks || 1)), 0) / gradedExams.length) * 100);

  const isWilted = useMemo(() => {
    if (!state.goalLastUpdated) return false;
    return state.gardenStreak === 0 && !!state.dailyFocusGoal;
  }, [state.gardenStreak, state.dailyFocusGoal]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between px-6 py-4 bg-white/40 backdrop-blur-md rounded-[32px] border border-slate-100 shadow-sm mb-4">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center text-white shadow-lg">
               <ZenithIcon className="w-6 h-6" />
            </div>
            <div>
               <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Neural Dashboard</h2>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time Cognitive Tracking</p>
            </div>
         </div>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <ShieldCheck size={14} className="text-emerald-500" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vault Secure</span>
            </div>
            {state.lastSyncedAt && (
               <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
                  <Download size={12} className="text-indigo-400" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(state.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
            )}
         </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 stagger-child-reveal">
        <div className="lg:col-span-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[360px]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="mb-6 max-w-2xl group/quote border-l-4 border-indigo-100 pl-5 py-1 min-h-[48px]">
              {dynamicGreeting ? (
                <h2 className="text-xl font-black text-indigo-600 tracking-tight animate-in fade-in slide-in-from-left-4 duration-1000">
                  {dynamicGreeting}
                </h2>
              ) : (
                <div className="h-6 w-48 bg-slate-100 rounded-full animate-pulse" />
              )}
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2 opacity-60">AI Greeting initialized — Zenith Protocol</p>
            </div>
            <div className="flex items-center gap-6 mb-2">
               <div className="relative shrink-0">
                 <img src={state.user?.photoURL} className="w-20 h-20 rounded-3xl shadow-xl border-4 border-white ring-1 ring-slate-100 object-cover" alt="User" />
                 <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg" />
               </div>
               <div className="flex-1">
                 <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-2">Welcome, {state.user?.name.split(' ')[0]}</h1>
                 <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-wider"><GraduationCap size={12} /> {state.user?.education || 'Student'}</div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-wider"><UserCircle size={12} /> {state.user?.age || '--'} Years</div>
                 </div>
                 <p className="text-sm text-slate-500 font-medium mt-3">Overall Progress: <span className="text-indigo-600 font-bold">{progressPercent}% Locked</span></p>
               </div>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="bg-slate-900 text-white rounded-[32px] p-6 flex items-center justify-between shadow-2xl">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-300 backdrop-blur-md"><Timer size={20} /></div>
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Target Date</p><button onClick={() => setIsEditingDeadline(true)} className="text-sm font-black text-white hover:text-indigo-400 transition-colors flex items-center gap-2 mt-1">{state.syllabusDeadline ? new Date(state.syllabusDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Set Deadline'}<Edit2 size={12} /></button></div>
               </div>
               <div className="text-right">{timeLeft && <div className="flex flex-col items-end"><p className="text-xl font-black leading-none">{timeLeft.mo}M {timeLeft.d}D</p><p className="text-[9px] text-slate-500 uppercase font-black mt-1">Countdown</p></div>}</div>
            </div>
            <button onClick={() => onNavigate('revision')} className={`rounded-[32px] p-6 flex items-center justify-between transition-all hover:scale-[1.02] active:scale-95 ${revisionQueue.length > 0 ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}>
               <div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${revisionQueue.length > 0 ? 'bg-white/20 shadow-inner' : 'bg-slate-200'}`}><Zap size={20} /></div><div className="text-left"><p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Memory Sync</p><p className="text-sm font-black mt-1">{revisionQueue.length > 0 ? `${revisionQueue.length} Due` : 'Optimized'}</p></div></div><ChevronRight size={20} className="opacity-40" /></button>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col justify-between items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -z-0 opacity-40 transition-transform group-hover:scale-110 duration-700" />
          
          <button onClick={() => onNavigate('garden')} className="w-full text-left flex flex-col items-center group/garden hover:opacity-90 transition-opacity overflow-visible">
            <NeuralGarden streak={state.gardenStreak} isWilted={isWilted} />
            <div className="mt-4 px-6 py-4 bg-slate-50/50 rounded-3xl border border-slate-100 w-full flex items-center gap-4 group/goal">
               <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover/goal:scale-110 ${state.hasAchievedGoalToday ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300'}`}>
                  <Target size={20} />
               </div>
               <div className="flex-1 overflow-hidden">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">Today's Focus</p>
                  <p className={`text-xs font-bold text-left truncate transition-colors ${state.hasAchievedGoalToday ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {state.dailyFocusGoal || "Choose focus goal..."}
                  </p>
               </div>
               <ChevronRight size={16} className="text-slate-300 group-hover/garden:translate-x-1 transition-transform" />
            </div>
          </button>

          <div className="grid grid-cols-2 gap-3 w-full relative z-10 mt-6">
            <div className="bg-slate-50 p-3.5 rounded-[24px] border border-slate-100"><p className="text-lg font-black text-slate-900 leading-none">{Math.floor(totalFocusMinutes / 60)}h</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Study Time</p></div>
            <div className="bg-slate-50 p-3.5 rounded-[24px] border border-slate-100"><p className="text-lg font-black text-slate-900 leading-none">{averageResult}%</p><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Exam Avg</p></div>
          </div>
        </div>
      </section>

      {/* PENDING GOALS SECTION - Filtered for today and past incomplete only */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 stagger-child-reveal" style={{ animationDelay: '0.1s' }}>
        <div className="lg:col-span-12 bg-white rounded-[48px] border border-slate-100 shadow-sm p-10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-[3s]"><ListTodo size={120} className="text-indigo-600" /></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
             <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 animate-float"><Target size={28} /></div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Active Objectives</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-1">Incomplete Missions: Today & History</p>
                </div>
             </div>
             <button onClick={() => onNavigate('goals')} className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg">
                View Full Planner
                <ChevronRight size={16} />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
             {pendingGoals.length > 0 ? pendingGoals.map((goal: any) => (
               <button 
                 key={goal.id} 
                 onClick={() => onNavigate('goals')}
                 className="bg-slate-50/50 hover:bg-white p-6 rounded-[32px] border border-transparent hover:border-indigo-100 transition-all hover:shadow-xl hover:shadow-indigo-100/20 group/task text-left flex flex-col justify-between min-h-[140px]"
               >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${goal.category === 'Study' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {goal.category}
                       </span>
                       <div className={`transition-colors ${goal.isOverdue ? 'text-amber-500' : 'text-slate-200 group-hover/task:text-indigo-200'}`}>
                          {goal.isOverdue ? <AlertTriangle size={18} /> : <Circle size={20} />}
                       </div>
                    </div>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed line-clamp-2">{goal.text}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-400 group-hover/task:text-indigo-500 transition-colors">
                       <Clock size={10} />
                       <span className="text-[9px] font-black uppercase tracking-widest">
                         {goal.recurrence === 'none' ? (goal.isOverdue ? 'Overdue' : 'Due Today') : `${goal.recurrence} Loop`}
                       </span>
                    </div>
                    {goal.isOverdue && <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter bg-amber-50 px-2 py-0.5 rounded-full">Pending Archive</span>}
                  </div>
               </button>
             )) : (
               <div className="col-span-full text-center py-16 bg-slate-50/50 rounded-[40px] border-4 border-dashed border-slate-100">
                  <CheckCircle2 size={40} className="mx-auto text-emerald-300 mb-4 opacity-50" />
                  <p className="text-sm font-black text-slate-300 uppercase tracking-[0.4em] italic">All objectives cleared</p>
               </div>
             )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 stagger-child-reveal" style={{ animationDelay: '0.2s' }}>
        <div className="lg:col-span-7 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-100 text-violet-600 rounded-2xl shadow-sm"><Brain size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Revision Queue</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Spaced Repetition Schedule</p>
              </div>
            </div>
            <button onClick={() => onNavigate('revision')} className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">Lab</button>
          </div>
          <div className="space-y-4">
            {revisionQueue.length > 0 ? revisionQueue.map((chap) => (
              <div key={`${chap.subjectId}-${chap.id}`} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-3xl hover:bg-white border border-transparent hover:border-violet-100 hover:shadow-xl hover:shadow-violet-100/20 transition-all duration-300">
                <div className="flex items-center gap-5 min-w-0"><div className="w-2 h-10 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: chap.color }} /><div className="truncate"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{chap.subjectName}</span><h4 className="text-lg font-bold text-slate-800 tracking-tight truncate mt-1">{chap.name}</h4></div></div><div className="text-right shrink-0"><p className="text-[10px] font-black text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-full">{chap.intervalName}</p><p className="text-[9px] font-bold text-slate-400 mt-2">Level {chap.revisions + 1}</p></div></div>
            )) : <div className="py-16 text-center bg-slate-50/50 rounded-[40px] border-4 border-dashed border-slate-100"><p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] italic">Buffer Clean</p></div>}
          </div>
        </div>
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 text-white p-9 rounded-[48px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-[2s]"><Sparkles size={80} /></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8"><div className="p-2.5 bg-white/10 rounded-xl text-indigo-300 shadow-inner">{ICONS.AI}</div><h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-300">Zenith AI</h3></div>
              {loadingInsights ? <div className="space-y-5 animate-pulse"><div className="h-2.5 bg-white/10 rounded-full w-full" /><div className="h-2.5 bg-white/10 rounded-full w-4/5" /></div> : <ul className="space-y-6">{insights.map((insight, i) => <li key={i} className="flex gap-5 text-sm font-medium text-slate-300 leading-relaxed group/item hover:translate-x-2 transition-transform"><div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0 shadow-lg" />{insight}</li>)}</ul>}
            </div>
          </div>
        </div>
      </div>
      {isEditingDeadline && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] w-full max-md p-12 shadow-2xl relative animate-in zoom-in-95 duration-500">
            <button onClick={() => setIsEditingDeadline(false)} className="absolute top-10 right-10 p-3 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"><X size={24} /></button>
            <div className="flex items-center gap-5 mb-10"><div className="p-4 bg-indigo-100 text-indigo-600 rounded-3xl"><AlertCircle size={32} /></div><h2 className="text-3xl font-black tracking-tight text-slate-900">Final Target</h2></div>
            <form onSubmit={(e) => { e.preventDefault(); onUpdateDeadline(tempDeadline); setIsEditingDeadline(false); }} className="space-y-8">
              <div><label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-1">Deadline</label><input type="date" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-5 outline-none font-black text-slate-700 shadow-inner" value={tempDeadline} onChange={e => setTempDeadline(e.target.value)} /></div>
              <button className="w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black text-xl shadow-2xl shadow-indigo-100 active:scale-95 transition-all">Lock Milestone</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
