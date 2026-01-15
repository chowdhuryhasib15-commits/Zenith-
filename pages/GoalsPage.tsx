
import React, { useState, useMemo } from 'react';
import { Goal, GoalCategory, RecurrenceType } from '../types';
import { ICONS } from '../constants';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  Target,
  Repeat,
  BookOpen,
  User,
  Rocket,
  Heart
} from 'lucide-react';

interface GoalsPageProps {
  goals: Goal[];
  onAdd: (g: Goal) => void;
  onToggle: (id: string, date?: string) => void;
  onDelete: (id: string) => void;
}

const CATEGORIES: { id: GoalCategory; label: string; icon: any; color: string; bg: string }[] = [
  { id: 'Study', label: 'Study', icon: <BookOpen size={14} />, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'Personal', label: 'Personal', icon: <User size={14} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'Project', label: 'Project', icon: <Rocket size={14} />, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'Health', label: 'Health', icon: <Heart size={14} />, color: 'text-rose-600', bg: 'bg-rose-50' },
];

const RECURRENCE_OPTIONS: { id: RecurrenceType; label: string }[] = [
  { id: 'none', label: 'One-time' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

const GoalsPage: React.FC<GoalsPageProps> = ({ goals, onAdd, onToggle, onDelete }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goalText, setGoalText] = useState('');
  const [category, setCategory] = useState<GoalCategory>('Study');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  // Calendar Helpers
  const { days, monthName, year } = useMemo(() => {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    
    const daysArray = [];
    for (let i = 0; i < firstDay; i++) daysArray.push(null);
    for (let i = 1; i <= daysInMonth; i++) daysArray.push(new Date(y, m, i));
    
    return {
      days: daysArray,
      monthName: viewDate.toLocaleString('default', { month: 'long' }),
      year: y
    };
  }, [viewDate]);

  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const jumpToToday = () => {
    const today = new Date();
    setViewDate(today);
    setSelectedDate(today);
  };

  const isGoalActiveOnDate = (goal: Goal, targetDate: Date) => {
    const gDate = new Date(goal.date);
    // Reset times for date-only comparison
    const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const start = new Date(gDate.getFullYear(), gDate.getMonth(), gDate.getDate());

    if (target < start) return false;

    switch (goal.recurrence) {
      case 'none':
        return target.getTime() === start.getTime();
      case 'daily':
        return true;
      case 'weekly':
        return target.getDay() === start.getDay();
      case 'monthly':
        return target.getDate() === start.getDate();
      default:
        return false;
    }
  };

  const getGoalsForDate = (date: Date) => {
    return goals.filter(g => isGoalActiveOnDate(g, date));
  };

  const selectedDayGoals = useMemo(() => getGoalsForDate(selectedDate), [goals, selectedDate]);
  const dateStr = selectedDate.toISOString().split('T')[0];

  const handleAddGoal = () => {
    if (!goalText.trim()) return;
    onAdd({
      id: Date.now().toString(),
      text: goalText,
      date: selectedDate.toISOString(),
      isDone: false,
      category,
      recurrence,
      completedDates: []
    });
    setGoalText('');
  };

  const getCategoryStyles = (catId: string) => {
    return CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Target className="text-indigo-600" size={32} />
            Study Planner
          </h1>
          <p className="text-slate-500">Plan habits and milestones to keep your momentum high.</p>
        </div>
        <button 
          onClick={jumpToToday}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          Jump to Today
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Full-Month Calendar View */}
        <div className="lg:col-span-7 bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-slate-900">{monthName}</h2>
              <span className="text-sm font-medium text-slate-400">{year}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-600 shadow-sm border border-slate-200">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-600 shadow-sm border border-slate-200">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center pb-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;
                
                const isSelected = selectedDate.toDateString() === date.toDateString();
                const isToday = new Date().toDateString() === date.toDateString();
                const dayGoals = getGoalsForDate(date);
                const hasGoals = dayGoals.length > 0;
                const ds = date.toISOString().split('T')[0];
                const allDone = hasGoals && dayGoals.every(g => 
                  g.recurrence === 'none' ? g.isDone : g.completedDates?.includes(ds)
                );

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      aspect-square flex flex-col items-center justify-center rounded-2xl transition-all relative group
                      ${isSelected ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105 z-10' : 'hover:bg-slate-50 text-slate-700'}
                      ${isToday && !isSelected ? 'ring-2 ring-indigo-100 ring-offset-2' : ''}
                    `}
                  >
                    <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{date.getDate()}</span>
                    
                    {hasGoals && (
                      <div className="absolute bottom-2 flex gap-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-200' : allDone ? 'bg-emerald-500' : 'bg-indigo-400'}`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Day Goals Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl text-white">
                  <CalendarIcon size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">{selectedDayGoals.length} Tasks planned</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              {selectedDayGoals.map(goal => {
                const isDone = goal.recurrence === 'none' ? goal.isDone : (goal.completedDates?.includes(dateStr));
                const cat = getCategoryStyles(goal.category);
                
                return (
                  <div key={goal.id} className="p-4 rounded-2xl border border-slate-100 bg-white flex items-center gap-4 group transition-all hover:border-indigo-100 hover:shadow-sm">
                    <button 
                      onClick={() => onToggle(goal.id, dateStr)}
                      className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 text-white' : 'border-2 border-slate-200 hover:border-indigo-400'}`}
                    >
                      {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} className="text-slate-200" />}
                    </button>
                    <div className="flex-1 flex flex-col gap-1">
                      <span className={`text-sm font-semibold ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                        {goal.text}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider ${cat.bg} ${cat.color}`}>
                          {cat.icon}
                          {cat.label}
                        </span>
                        {goal.recurrence !== 'none' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider bg-slate-100 text-slate-500">
                            <Repeat size={10} />
                            {goal.recurrence}
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => onDelete(goal.id)}
                      className="p-1.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      {ICONS.Trash}
                    </button>
                  </div>
                );
              })}
              {selectedDayGoals.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm italic">Nothing planned yet</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
              <input 
                className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                placeholder="What's the plan?"
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GoalCategory)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Repeat</label>
                  <select 
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 outline-none"
                  >
                    {RECURRENCE_OPTIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleAddGoal}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {ICONS.Plus}
                Schedule Goal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
