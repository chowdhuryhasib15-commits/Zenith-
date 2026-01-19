
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Exam, Subject } from '../types';
import { ICONS, COLORS } from '../constants';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getExamPerformanceAnalysis } from '../services/geminiService';
import { Sparkles, Calendar, Plus, X, Trash2, Trophy, Clock, AlertCircle, Tag, BookOpen, ChevronDown, ShieldAlert, Award, Check, History, Search, Filter, ArrowLeft } from 'lucide-react';

interface ExamsPageProps {
  exams: Exam[];
  subjects: Subject[];
  customTypes: string[];
  onAddExam: (e: Exam) => void;
  onDeleteExam: (id: string) => void;
  onUpdateExam: (id: string, updates: Partial<Exam>) => void;
}

const ExamsPage: React.FC<ExamsPageProps> = ({ 
  exams, subjects, customTypes, onAddExam, onDeleteExam, onUpdateExam 
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'results'>('schedule');
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [gradingExamId, setGradingExamId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<string[]>([]);
  
  // Custom Dropdown States
  const [isDomainOpen, setIsDomainOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

  const [examForm, setExamForm] = useState({
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    type: ''
  });

  const [gradeForm, setGradeForm] = useState({
    totalMarks: 100,
    obtainedMarks: 0
  });

  const cleanSubName = (name: string) => name.replace(/\s*(1st|2nd)?\s*Paper/gi, '').trim();

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (exams.some(e => e.isGraded)) {
        setLoadingAnalysis(true);
        const res = await getExamPerformanceAnalysis(exams, subjects);
        setAnalysis(res);
        setLoadingAnalysis(false);
      }
    };
    fetchAnalysis();
  }, [exams.filter(e => e.isGraded).length, exams, subjects]);

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.subjectId || !examForm.type) return;
    
    const subject = subjects.find(s => s.id === examForm.subjectId);
    const generatedTitle = `${subject?.name || 'Unknown'} ${examForm.type}`;

    onAddExam({
      id: Date.now().toString(),
      title: generatedTitle,
      ...examForm,
      isCompleted: false,
      isGraded: false
    });
    setExamForm({ subjectId: '', date: new Date().toISOString().split('T')[0], priority: 'Medium', type: '' });
    setIsAddingExam(false);
  };

  const handleGradeExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingExamId) return;
    onUpdateExam(gradingExamId, {
      ...gradeForm,
      isCompleted: true,
      isGraded: true
    });
    setGradingExamId(null);
    setGradeForm({ totalMarks: 100, obtainedMarks: 0 });
  };

  const upcomingExams = useMemo(() => 
    exams.filter(e => !e.isGraded).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), 
    [exams]
  );

  const gradedExams = useMemo(() => 
    exams.filter(e => e.isGraded).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [exams]
  );

  const filteredHistory = useMemo(() => {
    if (!historySearch) return gradedExams;
    return gradedExams.filter(e => 
      e.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      e.type.toLowerCase().includes(historySearch.toLowerCase()) ||
      subjects.find(s => s.id === e.subjectId)?.name.toLowerCase().includes(historySearch.toLowerCase())
    );
  }, [gradedExams, historySearch, subjects]);

  const chartData = gradedExams
    .slice().reverse()
    .map(r => ({
      date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      percentage: Math.round(((r.obtainedMarks || 0) / (r.totalMarks || 1)) * 100),
      subject: cleanSubName(subjects.find(s => s.id === r.subjectId)?.name || 'Deleted')
    }));

  const averagePerformance = useMemo(() => {
    if (gradedExams.length === 0) return 0;
    return Math.round((gradedExams.reduce((acc, r) => acc + ((r.obtainedMarks || 0) / (r.totalMarks || 1)), 0) / gradedExams.length) * 100);
  }, [gradedExams]);

  const currentSelectedSubject = subjects.find(s => s.id === examForm.subjectId);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Exams & Results</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-3">Mission control for academic excellence.</p>
        </div>
        <div className="flex bg-slate-100/50 p-1.5 rounded-[24px] border border-slate-200 shadow-inner">
           <button onClick={() => setActiveTab('schedule')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'schedule' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Timeline</button>
           <button onClick={() => setActiveTab('results')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'results' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Analytics</button>
        </div>
      </header>

      {activeTab === 'schedule' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 stagger-child-reveal px-4">
          <div className="lg:col-span-8 space-y-8">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Calendar className="text-indigo-600" /> Strategic Schedule</h2>
                <button onClick={() => setIsAddingExam(true)} className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-slate-900 transition-all active:scale-95"><Plus size={20} /></button>
             </div>
             
             <div className="space-y-4">
                {upcomingExams.length > 0 ? upcomingExams.map((exam) => {
                  const sub = subjects.find(s => s.id === exam.subjectId);
                  const daysLeft = Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                  const isPast = daysLeft <= 0;

                  return (
                    <div key={exam.id} className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 hover:shadow-2xl transition-all duration-500">
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-[24px] flex items-center justify-center text-white text-xl font-black shadow-lg" style={{ backgroundColor: sub?.color || '#cbd5e1' }}>
                             {sub?.name.charAt(0) || '?'}
                          </div>
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{cleanSubName(sub?.name || 'Unknown')}</p>
                               <span className="text-[8px] px-2 py-0.5 bg-slate-100 text-slate-500 font-black rounded-full uppercase tracking-widest">{exam.type}</span>
                             </div>
                             <h4 className="text-lg font-black text-slate-900 leading-tight">
                                {cleanSubName(sub?.name || 'Unknown')} {exam.type}
                             </h4>
                             <div className="flex items-center gap-3 mt-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${exam.priority === 'High' ? 'bg-rose-100 text-rose-600' : exam.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>{exam.priority}</span>
                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Clock size={12} /> {new Date(exam.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="text-right mr-4 hidden sm:block">
                             <p className={`text-xl font-black leading-none ${isPast ? 'text-amber-500' : daysLeft < 3 ? 'text-rose-500 animate-pulse' : 'text-slate-900'}`}>{isPast ? 'Past' : `${daysLeft}D`}</p>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{isPast ? 'Due' : 'Remaining'}</p>
                          </div>
                          <button 
                            onClick={() => setGradingExamId(exam.id)} 
                            className={`p-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 ${isPast ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                          >
                            <Trophy size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Grade</span>
                          </button>
                          <button onClick={() => onDeleteExam(exam.id)} className="p-4 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100">{ICONS.Trash}</button>
                       </div>
                    </div>
                  );
                }) : (
                  <div className="py-24 text-center bg-slate-50/50 rounded-[56px] border-4 border-dashed border-slate-100">
                     <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto text-slate-200 mb-6 shadow-sm"><AlertCircle size={40} /></div>
                     <p className="text-sm font-black text-slate-300 uppercase tracking-[0.4em] italic">No missions scheduled</p>
                  </div>
                )}
             </div>
          </div>
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-slate-900 text-white p-10 rounded-[56px] shadow-2xl relative overflow-hidden group h-fit">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-[3s]"><Sparkles size={120} /></div>
                <div className="relative z-10">
                   <h3 className="text-3xl font-black tracking-tighter leading-none mb-4">Strategic <br /><span className="text-indigo-400">Analysis.</span></h3>
                   <p className="text-slate-400 text-xs font-medium leading-relaxed uppercase tracking-widest mb-10">AI Deployment Logic</p>
                   <div className="space-y-6">
                      <div className="flex items-center gap-4"><div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400"><Trophy size={20} /></div><div className="text-sm font-bold">Peak Average: {averagePerformance}%</div></div>
                      <div className="flex items-center gap-4"><div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400"><Award size={20} /></div><div className="text-sm font-bold">Current Ops: {upcomingExams.length} Missions</div></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 px-4">
           <div className="bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 text-white p-10 rounded-[56px] shadow-2xl relative overflow-hidden border border-white/5">
              <div className="absolute top-0 right-0 p-12 opacity-10 animate-float"><Sparkles size={160} /></div>
              <div className="relative z-10">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl"><Sparkles className="text-indigo-300" size={24} /></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-300">AI Performance Advisor</span>
                 </div>
                 <h2 className="text-4xl font-black tracking-tighter mb-10">Neural Performance Vault</h2>
                 {loadingAnalysis ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                       {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-[32px]" />)}
                    </div>
                 ) : gradedExams.length === 0 ? (
                    <p className="text-indigo-200/50 italic text-sm tracking-widest uppercase font-black">Archive graded missions to initialize the intelligence protocol.</p>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {analysis.map((item, i) => (
                          <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[32px] backdrop-blur-md group hover:bg-white/10 transition-all">
                             <span className="text-[9px] font-black text-indigo-400 mb-4 block uppercase tracking-widest">Observation 0{i+1}</span>
                             <p className="text-sm font-bold text-indigo-50 leading-relaxed">{item}</p>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-white p-10 rounded-[56px] border border-slate-100 shadow-sm">
                 <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Performance Trajectory</h3>
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mastery Level</span>
                    </div>
                 </div>
                 <div className="h-72">
                    {chartData.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                             <defs><linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                             <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} domain={[0, 100]} />
                             <Tooltip cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.2)' }} />
                             <Area type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#scoreGrad)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    ) : <div className="h-full flex items-center justify-center italic text-slate-300 font-black uppercase tracking-widest text-sm">Waiting for graded missions...</div>}
                 </div>
              </div>
              <div className="lg:col-span-4 bg-white p-10 rounded-[56px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Graded Mission Log</h3>
                    <button 
                      onClick={() => setIsHistoryOpen(true)}
                      className="text-[9px] font-black text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-full hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5"
                    >
                      <History size={10} /> Full Archive
                    </button>
                 </div>
                 <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-2">
                    {gradedExams.slice(0, 10).map(res => {
                       const sub = subjects.find(s => s.id === res.subjectId);
                       const perc = Math.round(((res.obtainedMarks || 0) / (res.totalMarks || 1)) * 100);
                       return (
                          <div key={res.id} className="p-5 bg-slate-50/50 rounded-[32px] border border-transparent hover:border-slate-200 transition-all flex items-center justify-between group">
                             <div className="flex items-center gap-4">
                                <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: sub?.color || '#cbd5e1' }} />
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cleanSubName(sub?.name || 'Deleted')}</p>
                                  <h5 className="text-sm font-black text-slate-800 tracking-tight line-clamp-1">{res.title}</h5>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{res.type}</span>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className={`text-sm font-black ${perc >= 80 ? 'text-emerald-500' : perc >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{perc}%</p>
                                <button onClick={() => onDeleteExam(res.id)} className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Purge</button>
                             </div>
                          </div>
                       );
                    })}
                    {gradedExams.length === 0 && <p className="text-center py-10 text-slate-300 italic font-black text-[10px] uppercase">Archive Clear</p>}
                    {gradedExams.length > 10 && (
                      <button onClick={() => setIsHistoryOpen(true)} className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                        + {gradedExams.length - 10} More in Archive
                      </button>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: FULL HISTORY ARCHIVE */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white p-10 lg:p-14 rounded-[64px] shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500">
              <button onClick={() => setIsHistoryOpen(false)} className="absolute top-10 right-10 p-4 hover:bg-slate-100 rounded-[28px] transition-transform active:scale-90"><X size={32} /></button>
              
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="mb-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-indigo-600 transition-colors w-fit group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Analytics
              </button>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-[24px] flex items-center justify-center shadow-xl"><History size={32} /></div>
                    <div>
                       <h2 className="text-4xl font-black tracking-tighter text-slate-900">Academic History</h2>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mt-1">Full performance archive</p>
                    </div>
                 </div>
                 
                 <div className="relative group min-w-[300px]">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input 
                      className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[28px] outline-none font-black text-slate-700 focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                      placeholder="Search history..."
                      value={historySearch}
                      onChange={e => setHistorySearch(e.target.value)}
                    />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-8 border border-slate-100 rounded-[40px] bg-slate-50/30">
                 <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100">
                       <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                          <th className="px-10 py-6">Date</th>
                          <th className="px-10 py-6">Domain</th>
                          <th className="px-10 py-6">Mission</th>
                          <th className="px-10 py-6">Category</th>
                          <th className="px-10 py-6">Score</th>
                          <th className="px-10 py-6">Mastery</th>
                          <th className="px-10 py-6 text-right">Ops</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                       {filteredHistory.map(res => {
                          const sub = subjects.find(s => s.id === res.subjectId);
                          const perc = Math.round(((res.obtainedMarks || 0) / (res.totalMarks || 1)) * 100);
                          return (
                             <tr key={res.id} className="group hover:bg-white transition-all">
                                <td className="px-10 py-6 text-sm font-bold text-slate-500">{new Date(res.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                <td className="px-10 py-6">
                                   <div className="flex items-center gap-3">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sub?.color }} />
                                      <span className="text-sm font-black text-slate-700">{cleanSubName(sub?.name || 'Unknown')}</span>
                                   </div>
                                </td>
                                <td className="px-10 py-6 text-sm font-bold text-slate-900">{res.title}</td>
                                <td className="px-10 py-6"><span className="px-3 py-1 bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-full">{res.type}</span></td>
                                <td className="px-10 py-6 text-sm font-black text-slate-800">{res.obtainedMarks} / {res.totalMarks}</td>
                                <td className="px-10 py-6">
                                   <div className={`text-sm font-black ${perc >= 80 ? 'text-emerald-500' : perc >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{perc}%</div>
                                </td>
                                <td className="px-10 py-6 text-right">
                                   <button onClick={() => onDeleteExam(res.id)} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100">{ICONS.Trash}</button>
                                </td>
                             </tr>
                          );
                       })}
                       {filteredHistory.length === 0 && (
                          <tr>
                             <td colSpan={7} className="py-24 text-center italic text-slate-300 font-black uppercase tracking-widest">Archive Empty</td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: ADD EXAM (Schedule) */}
      {isAddingExam && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white p-12 rounded-[56px] shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 overflow-visible">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />
              <button onClick={() => setIsAddingExam(false)} className="absolute top-10 right-10 p-3 hover:bg-slate-100 rounded-2xl transition-transform active:scale-90"><X size={24} /></button>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-10">Strategic Mission Setup</h2>
              <form onSubmit={handleAddExam} className="space-y-6">
                 
                 {/* Scientific Domain - Custom Zenith Dropdown */}
                 <div className="relative">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Scientific Domain</label>
                    <button 
                      type="button"
                      onClick={() => { setIsDomainOpen(!isDomainOpen); setIsPriorityOpen(false); }}
                      className={`w-full bg-slate-50 border-2 rounded-[24px] px-6 py-4 flex items-center gap-4 transition-all hover:bg-white focus:ring-4 focus:ring-indigo-500/5 ${isDomainOpen ? 'border-indigo-500 bg-white ring-4 ring-indigo-500/5' : 'border-slate-100'}`}
                    >
                      <BookOpen size={18} className={isDomainOpen ? 'text-indigo-600' : 'text-slate-300'} />
                      <div className="flex-1 flex items-center gap-2 overflow-hidden">
                        {currentSelectedSubject ? (
                          <>
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: currentSelectedSubject.color }} />
                            <span className="font-black text-slate-900 truncate">{cleanSubName(currentSelectedSubject.name)}</span>
                          </>
                        ) : (
                          <span className="font-bold text-slate-400 italic">Select Domain...</span>
                        )}
                      </div>
                      <ChevronDown size={16} className={`text-slate-300 transition-transform duration-300 ${isDomainOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                    </button>
                    {isDomainOpen && (
                      <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 rounded-[32px] shadow-2xl p-2 z-[250] animate-in zoom-in-95 fade-in duration-200">
                        <div className="max-h-56 overflow-y-auto custom-scrollbar pr-1">
                          {subjects.map(s => (
                            <button 
                              key={s.id} 
                              type="button"
                              onClick={() => { setExamForm({...examForm, subjectId: s.id}); setIsDomainOpen(false); }}
                              className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl transition-all group hover:bg-indigo-50/50 ${examForm.subjectId === s.id ? 'bg-indigo-50' : ''}`}
                            >
                              <div className="w-2.5 h-2.5 rounded-full shadow-sm group-hover:scale-125 transition-transform" style={{ backgroundColor: s.color }} />
                              <span className={`text-sm font-black truncate ${examForm.subjectId === s.id ? 'text-indigo-600' : 'text-slate-600'}`}>{cleanSubName(s.name)}</span>
                              {examForm.subjectId === s.id && <Check size={14} className="ml-auto text-indigo-600" />}
                            </button>
                          ))}
                          {subjects.length === 0 && <p className="p-4 text-xs font-bold text-slate-400 text-center italic">No domains registered</p>}
                        </div>
                      </div>
                    )}
                 </div>

                 {/* Mission Category (Custom Type) */}
                 <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Mission Category</label>
                    <div className="relative group">
                      <Tag className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors pointer-events-none" size={18} />
                      <input 
                        required
                        list="exam-types"
                        className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none font-black text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all text-sm" 
                        placeholder="e.g. Weekly Assessment, Semester Final..." 
                        value={examForm.type} 
                        onChange={e => setExamForm({...examForm, type: e.target.value})} 
                      />
                      <datalist id="exam-types">
                        {customTypes.map(t => <option key={t} value={t} />)}
                      </datalist>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    {/* Threat Priority - Custom Zenith Dropdown */}
                    <div className="relative">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Threat Priority</label>
                       <button 
                         type="button"
                         onClick={() => { setIsPriorityOpen(!isPriorityOpen); setIsDomainOpen(false); }}
                         className={`w-full bg-slate-50 border-2 rounded-[24px] px-6 py-4 flex items-center gap-4 transition-all hover:bg-white focus:ring-4 focus:ring-indigo-500/5 ${isPriorityOpen ? 'border-rose-500 bg-white ring-4 ring-rose-500/5' : 'border-slate-100'}`}
                       >
                         <ShieldAlert size={18} className={examForm.priority === 'High' ? 'text-rose-500' : examForm.priority === 'Medium' ? 'text-amber-500' : 'text-emerald-500'} />
                         <span className="font-black text-slate-900 flex-1 text-left text-xs uppercase tracking-widest">{examForm.priority}</span>
                         <ChevronDown size={14} className={`text-slate-300 transition-transform duration-300 ${isPriorityOpen ? 'rotate-180 text-rose-500' : ''}`} />
                       </button>
                       {isPriorityOpen && (
                         <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 rounded-[32px] shadow-2xl p-2 z-[250] animate-in zoom-in-95 fade-in duration-200">
                           {(['High', 'Medium', 'Low'] as const).map(p => (
                             <button 
                               key={p} 
                               type="button"
                               onClick={() => { setExamForm({...examForm, priority: p}); setIsPriorityOpen(false); }}
                               className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl transition-all group hover:bg-slate-50 ${examForm.priority === p ? 'bg-slate-50' : ''}`}
                             >
                               <div className={`w-2 h-2 rounded-full ${p === 'High' ? 'bg-rose-500' : p === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                               <span className={`text-[10px] font-black uppercase tracking-widest ${examForm.priority === p ? 'text-slate-900' : 'text-slate-400'}`}>{p}</span>
                               {examForm.priority === p && <Check size={12} className="ml-auto text-slate-900" />}
                             </button>
                           ))}
                         </div>
                       )}
                    </div>

                    {/* Execution Date */}
                    <div>
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Execution Date</label>
                       <div className="relative group">
                         <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors pointer-events-none" size={18} />
                         <input 
                           type="date" 
                           className="w-full pl-16 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none font-black text-slate-700 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all text-xs" 
                           value={examForm.date} 
                           onChange={e => setExamForm({...examForm, date: e.target.value})} 
                         />
                       </div>
                    </div>
                 </div>

                 <button className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all mt-4">Initialize Mission Protocol</button>
              </form>
           </div>
        </div>
      )}

      {/* MODAL: GRADE EXAM (Post-Mission) */}
      {gradingExamId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white p-12 rounded-[56px] shadow-2xl max-md w-full relative animate-in zoom-in-95 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 to-indigo-500" />
              <button onClick={() => setGradingExamId(null)} className="absolute top-10 right-10 p-3 hover:bg-slate-100 rounded-2xl transition-transform active:scale-90"><X size={24} /></button>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Grade Archive</h2>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-10">Mission: {exams.find(e => e.id === gradingExamId)?.title}</p>
              <form onSubmit={handleGradeExam} className="space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Obtained Score</label>
                       <input type="number" step="any" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[28px] outline-none font-black text-2xl text-slate-900 focus:ring-4 focus:ring-indigo-500/5 transition-all" value={gradeForm.obtainedMarks} onChange={e => setGradeForm({...gradeForm, obtainedMarks: Number(e.target.value)})} />
                    </div>
                    <div>
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Points</label>
                       <input type="number" step="any" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[28px] outline-none font-black text-2xl text-slate-500 focus:ring-4 focus:ring-indigo-500/5 transition-all" value={gradeForm.totalMarks} onChange={e => setGradeForm({...gradeForm, totalMarks: Number(e.target.value)})} />
                    </div>
                 </div>
                 <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 text-center">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Calculated Performance</p>
                    <p className="text-5xl font-black text-indigo-600 mt-2">{Math.round((gradeForm.obtainedMarks / (gradeForm.totalMarks || 1)) * 100)}%</p>
                 </div>
                 <button className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-600 transition-all">Lock Record into Vault</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default ExamsPage;
