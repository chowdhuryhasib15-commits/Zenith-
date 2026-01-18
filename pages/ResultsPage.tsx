
import React, { useState, useEffect } from 'react';
// Corrected: Module '"../types"' has no exported member 'ExamResult'. Using 'Exam' instead.
import { Exam, Subject } from '../types';
import { ICONS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// Corrected: '"../services/geminiService"' has no exported member named 'getResultPerformanceAnalysis'.
import { getExamPerformanceAnalysis } from '../services/geminiService';
import { Sparkles } from 'lucide-react';

interface ResultsPageProps {
  // Using Exam instead of ExamResult
  results: Exam[];
  subjects: Subject[];
  onAdd: (r: Exam) => void;
  onDelete: (id: string) => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ results, subjects, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [analysis, setAnalysis] = useState<string[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: '',
    type: 'Quiz',
    totalMarks: 100,
    obtainedMarks: 0,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (results.length > 0) {
        setLoadingAnalysis(true);
        // Corrected: Using getExamPerformanceAnalysis
        const res = await getExamPerformanceAnalysis(results, subjects);
        setAnalysis(res);
        setLoadingAnalysis(false);
      }
    };
    fetchAnalysis();
  }, [results.length]); // Re-run when a result is added or removed

  const chartData = results
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(r => ({
      date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      // Corrected: Handling optional marks property from Exam type
      percentage: Math.round(((r.obtainedMarks || 0) / (r.totalMarks || 1)) * 100),
      subject: subjects.find(s => s.id === r.subjectId)?.name || 'Unknown'
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectId) return;
    // Corrected: Provided mandatory fields for Exam interface
    onAdd({
      id: Date.now().toString(),
      title: `Result - ${formData.type}`,
      priority: 'Medium',
      isCompleted: true,
      isGraded: true,
      ...formData
    });
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Performance Results</h1>
          <p className="text-slate-500">Keep track of your exam scores and watch your growth.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
        >
          {ICONS.Plus}
          Log Result
        </button>
      </header>

      {/* AI Performance Analysis Section */}
      <div className="bg-gradient-to-br from-indigo-900 via-violet-900 to-indigo-800 text-white p-8 rounded-[40px] shadow-2xl shadow-indigo-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Sparkles className="text-indigo-300" size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">AI Performance Advisor</span>
          </div>
          
          <h2 className="text-2xl font-bold mb-6">Insightful Analysis</h2>

          {loadingAnalysis ? (
            <div className="space-y-4">
              <div className="h-4 bg-white/10 rounded-full w-full animate-pulse" />
              <div className="h-4 bg-white/10 rounded-full w-4/5 animate-pulse" />
              <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-indigo-200/80 italic">Start logging your results to unlock AI-powered academic insights and personalized improvement strategies.</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analysis.map((item, i) => (
                <li key={i} className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xs mb-3">
                    {i + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-indigo-50 font-medium">{item}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Trend Chart */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Score Trends (%)</h3>
            <div className="h-64">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <ICONS.Trend.type {...ICONS.Trend.props} className="text-slate-200" size={32} />
                  </div>
                  <p>Log a few test results to see your performance trend line.</p>
                </div>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Marks</th>
                  <th className="px-6 py-4">Percentage</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map(res => {
                  const sub = subjects.find(s => s.id === res.subjectId);
                  // Corrected: Handling optional marks
                  const perc = Math.round(((res.obtainedMarks || 0) / (res.totalMarks || 1)) * 100);
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub?.color || '#cbd5e1' }} />
                          <span className="font-semibold text-slate-700">{sub?.name || 'Deleted Subject'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">{res.type}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{res.obtainedMarks}/{res.totalMarks}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${perc >= 80 ? 'bg-emerald-50 text-emerald-600' : perc >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                          {perc}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => onDelete(res.id)} 
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          {ICONS.Trash}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {results.length === 0 && <p className="p-16 text-center text-slate-400">No results logged yet.</p>}
          </div>
        </div>

        {/* Sidebar stats or recent highlights could go here */}
        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
             <h3 className="text-lg font-bold mb-6">Subject Breakdown</h3>
             <div className="space-y-4">
               {subjects.map(sub => {
                 const subResults = results.filter(r => r.subjectId === sub.id);
                 if (subResults.length === 0) return null;
                 // Corrected: Handling optional marks
                 const avg = Math.round(subResults.reduce((acc, r) => acc + ((r.obtainedMarks || 0) / (r.totalMarks || 1)), 0) / subResults.length * 100);
                 return (
                   <div key={sub.id} className="flex items-center justify-between group">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: sub.color }}>
                          {sub.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-600">{sub.name}</span>
                     </div>
                     <span className="text-sm font-bold text-slate-900">{avg}%</span>
                   </div>
                 );
               })}
               {results.length === 0 && <p className="text-sm text-slate-400 italic">No data to display.</p>}
             </div>
           </div>
        </div>

        {/* Modal for Logging Results */}
        <div className={`
          fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-all duration-300
          ${isAdding ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}>
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsAdding(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-8">Log New Result</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Subject</label>
                <select 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  value={formData.subjectId}
                  onChange={e => setFormData({ ...formData, subjectId: e.target.value })}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Exam Type</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    <option>Quiz</option>
                    <option>Midterm</option>
                    <option>Final</option>
                    <option>Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Date</label>
                  <input 
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Score Obtained</label>
                  <input 
                    type="number"
                    required
                    min="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    value={formData.obtainedMarks}
                    onChange={e => setFormData({ ...formData, obtainedMarks: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Total Marks</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    value={formData.totalMarks}
                    onChange={e => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                  />
                </div>
              </div>

              <button className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-bold text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 active:scale-95 transition-all">
                Add to History
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

export default ResultsPage;
