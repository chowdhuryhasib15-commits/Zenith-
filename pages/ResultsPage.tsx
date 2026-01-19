
import React, { useState, useEffect } from 'react';
import { Exam, Subject } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getExamPerformanceAnalysis } from '../services/geminiService';
import { Sparkles, Plus, Trash2, X, TrendingUp } from 'lucide-react';

interface ResultsPageProps {
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
        const res = await getExamPerformanceAnalysis(results, subjects);
        setAnalysis(res);
        setLoadingAnalysis(false);
      }
    };
    fetchAnalysis();
  }, [results.length, results, subjects]);

  const chartData = results
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(r => ({
      date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      percentage: Math.round(((r.obtainedMarks || 0) / (r.totalMarks || 1)) * 100),
      subject: subjects.find(s => s.id === r.subjectId)?.name || 'Unknown'
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectId) return;
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Performance Results</h1>
          <p className="text-slate-500">Keep track of your exam scores and watch your growth.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
        >
          <Plus size={18} />
          Log Result
        </button>
      </header>

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
            </div>
          ) : results.length === 0 ? (
            <p className="text-indigo-200/80 italic">Start logging your results to unlock AI insights.</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analysis.map((item, i) => (
                <li key={i} className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-sm">
                  <p className="text-sm leading-relaxed text-indigo-50 font-medium">{item}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
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
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                  <TrendingUp size={32} className="text-slate-200" />
                  <p>Log a few test results to see your performance trend line.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-md p-10 shadow-2xl relative">
            <button onClick={() => setIsAdding(false)} className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold mb-8">Log New Result</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <button className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-bold text-lg">
                Add to History
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;
