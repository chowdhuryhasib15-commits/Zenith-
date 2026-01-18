
import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { NeuralGarden } from './Dashboard';
// Added missing X icon to lucide-react imports
import { Sprout, Target, CheckCircle2, Trophy, Clock, Zap, Leaf, Flower2, ChevronRight, Brain, Sparkles, Flame, History, AlertCircle, X } from 'lucide-react';

interface GardenPageProps {
  state: AppState;
  onUpdate: (updates: Partial<AppState>) => void;
}

const FOCUS_GOALS = [
  { id: 'focus_4h', label: 'Achieve 4 Hours of Deep Work', icon: <Clock size={16} /> },
  { id: 'rev_sync', label: 'Complete All Pending Revision Syncs', icon: <Zap size={16} /> },
  { id: 'exam_prep', label: 'Master 3 Chapters for Upcoming Exam', icon: <Target size={16} /> },
  { id: 'course_mastery', label: 'Finish 2 Course Lectures', icon: <Brain size={16} /> },
  { id: 'habit_streak', label: 'Hit All Today\'s Routine Goals', icon: <History size={16} /> },
];

const GardenPage: React.FC<GardenPageProps> = ({ state, onUpdate }) => {
  const [isChoosing, setIsChoosing] = useState(false);

  const isWilted = useMemo(() => {
    // Basic wilted logic for display
    return state.gardenStreak === 0 && !!state.dailyFocusGoal;
  }, [state.gardenStreak, state.dailyFocusGoal]);

  const selectGoal = (goal: string) => {
    onUpdate({ 
      dailyFocusGoal: goal, 
      hasAchievedGoalToday: false,
      goalLastUpdated: new Date().toISOString().split('T')[0]
    });
    setIsChoosing(false);
  };

  const achieveGoal = () => {
    if (state.hasAchievedGoalToday) return;
    onUpdate({ 
      hasAchievedGoalToday: true, 
      gardenStreak: state.gardenStreak + 1,
      goalLastUpdated: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24 max-w-7xl mx-auto px-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Zenith Arboreatum</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-3">The biological mirror of your academic consistency.</p>
        </div>
        <div className="flex bg-slate-900 p-1.5 rounded-[24px] shadow-2xl">
           <div className="flex items-center gap-3 px-6 py-2 text-white">
              <Flame size={20} className="text-orange-500" />
              <span className="text-2xl font-black tabular-nums">{state.gardenStreak}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Day Streak</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Garden Visualizer */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[56px] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col min-h-[500px] justify-between group">
           <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent pointer-events-none" />
           <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform duration-[4s] group-hover:rotate-0"><Flower2 size={160} className="text-indigo-600" /></div>

           <div className="relative z-10 flex flex-col items-center flex-1 justify-center">
              <div className="scale-[2] mb-12">
                 <NeuralGarden streak={state.gardenStreak} isWilted={isWilted} />
              </div>
           </div>

           <div className="relative z-10 p-8 bg-slate-50/80 rounded-[40px] border border-slate-100 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                 <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-xl transition-all ${state.hasAchievedGoalToday ? 'bg-emerald-500 text-white animate-pulse' : 'bg-white text-slate-300'}`}>
                    <Target size={32} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Today's Bio-Objective</h3>
                    <p className={`text-sm font-bold mt-1 transition-colors ${state.hasAchievedGoalToday ? 'text-emerald-600' : 'text-slate-500'}`}>
                       {state.dailyFocusGoal || "Protocol Offline. Select goal to initialize growth."}
                    </p>
                 </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                 {!state.dailyFocusGoal ? (
                   <button onClick={() => setIsChoosing(true)} className="flex-1 md:flex-none px-10 py-5 bg-slate-900 text-white rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">Initialize Phase</button>
                 ) : !state.hasAchievedGoalToday ? (
                   <>
                     <button onClick={achieveGoal} className="flex-1 md:flex-none px-10 py-5 bg-emerald-600 text-white rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                        <CheckCircle2 size={18} /> Confirm Completion
                     </button>
                     <button onClick={() => setIsChoosing(true)} className="p-5 bg-white border border-slate-200 text-slate-400 rounded-[28px] hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-90"><Target size={20} /></button>
                   </>
                 ) : (
                   <div className="px-10 py-5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[28px] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-inner">
                      <Sparkles size={18} /> Daily Quota Met
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-slate-900 text-white p-10 rounded-[56px] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-[3s]"><Leaf size={120} /></div>
              <div className="relative z-10">
                 <h3 className="text-3xl font-black tracking-tighter leading-none mb-6">Arboreatum <br /><span className="text-indigo-400">Logic.</span></h3>
                 <p className="text-slate-400 text-xs font-medium leading-relaxed uppercase tracking-widest mb-10">Atomic Habit Visualization</p>
                 <div className="space-y-8">
                    <div className="flex items-start gap-5 group/item">
                       <div className="p-3 bg-white/10 rounded-2xl text-indigo-400 group-hover/item:scale-110 transition-transform"><Zap size={20} /></div>
                       <div>
                          <p className="text-sm font-black text-white">Daily Consistency</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest leading-relaxed">Achieve your daily focus goal to trigger neural growth.</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-5 group/item">
                       <div className="p-3 bg-white/10 rounded-2xl text-emerald-400 group-hover/item:scale-110 transition-transform"><Trophy size={20} /></div>
                       <div>
                          <p className="text-sm font-black text-white">Evolution Stages</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest leading-relaxed">Plants evolve every 4 days of consistent streaks.</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-5 group/item">
                       <div className="p-3 bg-white/10 rounded-2xl text-rose-400 group-hover/item:scale-110 transition-transform"><AlertCircle size={20} /></div>
                       <div>
                          <p className="text-sm font-black text-white">Wilt Consequence</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest leading-relaxed">Missing 24 hours resets your plant to a dormant state.</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[56px] border border-slate-100 shadow-sm relative overflow-hidden">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Arboreatum Mastery</h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600">Growth Progress</span>
                    <span className="text-sm font-black text-indigo-600">{Math.min(100, Math.round((state.gardenStreak / 12) * 100))}%</span>
                 </div>
                 <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${Math.min(100, (state.gardenStreak / 12) * 100)}%` }} />
                 </div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mt-4">Next Evolution at {Math.ceil((state.gardenStreak + 1) / 4) * 4} Days</p>
              </div>
           </div>
        </div>
      </div>

      {/* Goal Selector Modal */}
      {isChoosing && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white p-12 rounded-[56px] shadow-2xl max-w-lg w-full relative animate-in zoom-in-95">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />
              <button onClick={() => setIsChoosing(false)} className="absolute top-10 right-10 p-3 hover:bg-slate-100 rounded-2xl transition-transform active:scale-90"><X size={24} className="text-slate-400" /></button>
              
              <div className="mb-10">
                 <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Choose Focus</h2>
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">Initialize today's bio-objective</p>
              </div>

              <div className="space-y-4">
                 {FOCUS_GOALS.map((goal) => (
                    <button 
                      key={goal.id}
                      onClick={() => selectGoal(goal.label)}
                      className={`w-full p-6 rounded-[32px] border-2 transition-all flex items-center justify-between group active:scale-95 ${state.dailyFocusGoal === goal.label ? 'border-indigo-600 bg-indigo-50 shadow-xl' : 'border-slate-50 bg-slate-50 hover:border-indigo-100 hover:bg-white'}`}
                    >
                       <div className="flex items-center gap-5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${state.dailyFocusGoal === goal.label ? 'bg-indigo-600 text-white' : 'bg-white text-slate-300 group-hover:text-indigo-600'}`}>
                             {goal.icon}
                          </div>
                          <span className={`text-sm font-black text-left leading-tight ${state.dailyFocusGoal === goal.label ? 'text-indigo-900' : 'text-slate-600'}`}>{goal.label}</span>
                       </div>
                       <ChevronRight size={18} className={`transition-all ${state.dailyFocusGoal === goal.label ? 'text-indigo-600 translate-x-1' : 'text-slate-200'}`} />
                    </button>
                 ))}

                 <div className="pt-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-10 leading-relaxed">
                       Achieving this quota will increment your Arboreatum streak and evolve your floral mirror.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GardenPage;
