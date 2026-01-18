
import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { NeuralGarden } from './Dashboard';
import { Sprout, Target, CheckCircle2, Trophy, Clock, Zap, Leaf, Flower2, ChevronRight, Brain, Sparkles, Flame, History, AlertCircle, X, Trash2, Plus } from 'lucide-react';

interface GardenPageProps {
  state: AppState;
  onUpdate: (updates: Partial<AppState>) => void;
}

const GardenPage: React.FC<GardenPageProps> = ({ state, onUpdate }) => {
  const [isChoosing, setIsChoosing] = useState(false);
  const [newObjective, setNewObjective] = useState('');

  const isWilted = useMemo(() => {
    // Dormant if streak is 0 and a goal was set
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

  const handleAddObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjective.trim()) return;
    const objective = { id: Date.now().toString(), label: newObjective.trim() };
    onUpdate({
      gardenObjectives: [...state.gardenObjectives, objective]
    });
    setNewObjective('');
  };

  const handleDeleteObjective = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onUpdate({
      gardenObjectives: state.gardenObjectives.filter(obj => obj.id !== id)
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24 max-w-7xl mx-auto px-4">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Zenith Garden</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-3">A digital habitat reflecting your academic consistency.</p>
        </div>
        <div className="flex bg-slate-900 p-1.5 rounded-[24px] shadow-2xl border border-white/5">
           <div className="flex items-center gap-3 px-6 py-2 text-white">
              <Flame size={20} className="text-orange-500" />
              <span className="text-2xl font-black tabular-nums">{state.gardenStreak}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Day Streak</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Garden Visualizer */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[56px] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col min-h-[550px] justify-between group">
           <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none" />
           <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform duration-[4s] group-hover:rotate-0"><Flower2 size={160} className="text-indigo-600" /></div>

           <div className="relative z-10 flex flex-col items-center flex-1 justify-center pt-8">
              <NeuralGarden streak={state.gardenStreak} isWilted={isWilted} scale={1.8} />
           </div>

           <div className="relative z-10 p-8 bg-slate-50/90 rounded-[40px] border border-slate-100 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-8 mt-12">
              <div className="flex items-center gap-6">
                 <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-xl transition-all ${state.hasAchievedGoalToday ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300'}`}>
                    <Target size={32} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Daily Objective</h3>
                    <p className={`text-sm font-bold mt-1 transition-colors ${state.hasAchievedGoalToday ? 'text-emerald-600' : 'text-slate-500'}`}>
                       {state.dailyFocusGoal || "Protocol offline. Select focus goal to begin growth."}
                    </p>
                 </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                 {!state.dailyFocusGoal ? (
                   <button onClick={() => setIsChoosing(true)} className="flex-1 md:flex-none px-10 py-5 bg-slate-900 text-white rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">Select Goal</button>
                 ) : !state.hasAchievedGoalToday ? (
                   <>
                     <button onClick={achieveGoal} className="flex-1 md:flex-none px-10 py-5 bg-emerald-600 text-white rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                        <CheckCircle2 size={18} /> Objective Achieved
                     </button>
                     <button onClick={() => setIsChoosing(true)} className="p-5 bg-white border border-slate-200 text-slate-400 rounded-[28px] hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-90 shadow-sm"><Target size={20} /></button>
                   </>
                 ) : (
                   <div className="px-10 py-5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[28px] font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-inner">
                      <Sparkles size={18} /> Synchronized
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
                 <h3 className="text-3xl font-black tracking-tighter leading-none mb-6">Arboreatum <br /><span className="text-indigo-400">Intelligence.</span></h3>
                 <p className="text-slate-400 text-xs font-medium leading-relaxed uppercase tracking-widest mb-10">Neural Reflection Protocol</p>
                 <div className="space-y-8">
                    <div className="flex items-start gap-5 group/item">
                       <div className="p-3 bg-white/10 rounded-2xl text-indigo-400 group-hover/item:scale-110 transition-transform"><Zap size={20} /></div>
                       <div>
                          <p className="text-sm font-black text-white">Consistent Pulse</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest leading-relaxed">Achieve your focus goal daily to trigger evolutionary growth signals.</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-5 group/item">
                       <div className="p-3 bg-white/10 rounded-2xl text-emerald-400 group-hover/item:scale-110 transition-transform"><Trophy size={20} /></div>
                       <div>
                          <p className="text-sm font-black text-white">Mastery Cycles</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest leading-relaxed">Plants evolve through 5 distinct stages as your streak matures.</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-5 group/item">
                       <div className="p-3 bg-white/10 rounded-2xl text-rose-400 group-hover/item:scale-110 transition-transform"><AlertCircle size={20} /></div>
                       <div>
                          <p className="text-sm font-black text-white">Dormancy Risk</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest leading-relaxed">Missing your target for 24 hours forces the flora into a dormant state.</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-10 rounded-[56px] border border-slate-100 shadow-sm relative overflow-hidden">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Evolutionary Metrics</h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-600">Maturity Progress</span>
                    <span className="text-sm font-black text-indigo-600">{Math.min(100, Math.round((state.gardenStreak / 12) * 100))}%</span>
                 </div>
                 <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${Math.min(100, (state.gardenStreak / 12) * 100)}%` }} />
                 </div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mt-4">Next Evolution: {Math.ceil((state.gardenStreak + 1) / 4) * 4} Successful Days</p>
              </div>
           </div>
        </div>
      </div>

      {/* Goal Selector Modal */}
      {isChoosing && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white p-10 lg:p-12 rounded-[56px] shadow-2xl max-w-xl w-full relative animate-in zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />
              <button onClick={() => setIsChoosing(false)} className="absolute top-10 right-10 p-3 hover:bg-slate-100 rounded-2xl transition-transform active:scale-90"><X size={24} className="text-slate-400" /></button>
              
              <div className="mb-8 shrink-0">
                 <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Focus Objectives</h2>
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">Daily Protocol Management</p>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-8 space-y-3">
                 {state.gardenObjectives.map((goal) => (
                    <button 
                      key={goal.id}
                      onClick={() => selectGoal(goal.label)}
                      className={`w-full p-6 rounded-[32px] border-2 transition-all flex items-center justify-between group active:scale-[0.98] ${state.dailyFocusGoal === goal.label ? 'border-indigo-600 bg-indigo-50 shadow-xl' : 'border-slate-50 bg-slate-50 hover:border-indigo-100 hover:bg-white'}`}
                    >
                       <div className="flex items-center gap-5">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${state.dailyFocusGoal === goal.label ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-300 group-hover:text-indigo-600'}`}>
                             <Target size={18} />
                          </div>
                          <span className={`text-sm font-black text-left leading-tight pr-4 ${state.dailyFocusGoal === goal.label ? 'text-indigo-900' : 'text-slate-600'}`}>{goal.label}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => handleDeleteObjective(e, goal.id)}
                            className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                             <Trash2 size={16} />
                          </button>
                          <ChevronRight size={18} className={`transition-all ${state.dailyFocusGoal === goal.label ? 'text-indigo-600 translate-x-1' : 'text-slate-200'}`} />
                       </div>
                    </button>
                 ))}
                 
                 {state.gardenObjectives.length === 0 && (
                   <p className="text-center py-10 text-slate-400 italic text-sm">No objectives defined. Create one below.</p>
                 )}
              </div>

              <form onSubmit={handleAddObjective} className="shrink-0 p-6 bg-slate-50 rounded-[40px] border border-slate-100 flex gap-3">
                 <input 
                   className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner"
                   placeholder="Enter custom objective..."
                   value={newObjective}
                   onChange={e => setNewObjective(e.target.value)}
                 />
                 <button 
                   type="submit"
                   className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 transition-all active:scale-95 shadow-xl"
                 >
                   <Plus size={20} />
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default GardenPage;
