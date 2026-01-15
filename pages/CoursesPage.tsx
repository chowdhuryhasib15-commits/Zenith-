
import React, { useState } from 'react';
import { Subject, Course } from '../types';
import { 
  PlayCircle, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Search, 
  Filter, 
  X, 
  Youtube, 
  Link as LinkIcon,
  Tag
} from 'lucide-react';

interface CoursesPageProps {
  courses: Course[];
  subjects: Subject[];
  onAdd: (c: Course) => void;
  onDelete: (id: string) => void;
}

const CoursesPage: React.FC<CoursesPageProps> = ({ courses, subjects, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    subjectId: '',
    topic: ''
  });

  const getYoutubeEmbedId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url || !formData.subjectId) return;
    
    onAdd({
      id: Date.now().toString(),
      ...formData,
      addedAt: new Date().toISOString()
    });
    
    setFormData({ title: '', url: '', subjectId: '', topic: '' });
    setIsAdding(false);
  };

  const filteredCourses = courses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubject === 'all' || c.subjectId === filterSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Learning Hub</h1>
          <p className="text-slate-500 font-medium">Curate your external learning resources.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-3 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all"
        >
          <Plus size={18} />
          Add Resource
        </button>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input 
            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            placeholder="Search by title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative group min-w-[200px]">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <select 
            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => {
          const sub = subjects.find(s => s.id === course.subjectId);
          const ytId = getYoutubeEmbedId(course.url);
          
          return (
            <div key={course.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:border-indigo-100 transition-all">
              {ytId ? (
                <div className="aspect-video relative overflow-hidden bg-slate-900">
                  <img 
                    src={`https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`} 
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => (e.currentTarget.src = `https://img.youtube.com/vi/${ytId}/0.jpg`)}
                  />
                  <a 
                    href={course.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-indigo-600/10 hover:bg-indigo-600/30 transition-all group/play"
                  >
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 group-hover/play:scale-110 transition-transform">
                      <Youtube size={32} fill="currentColor" />
                    </div>
                  </a>
                </div>
              ) : (
                <div className="aspect-video bg-slate-50 flex items-center justify-center text-slate-200">
                  <LinkIcon size={48} />
                </div>
              )}
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-lg font-black text-slate-900 leading-tight line-clamp-2">{course.title}</h3>
                  <button 
                    onClick={() => onDelete(course.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-auto pt-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-100">
                    <Tag size={10} />
                    {sub?.name || 'General'}
                  </div>
                  {course.topic && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 rounded-full text-[9px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100">
                      {course.topic}
                    </div>
                  )}
                </div>

                <a 
                  href={course.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 shadow-lg hover:shadow-indigo-100 transition-all"
                >
                  <ExternalLink size={14} />
                  Open Resource
                </a>
              </div>
            </div>
          );
        })}
        {filteredCourses.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50 rounded-[48px] border-4 border-dashed border-slate-100">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 shadow-sm">
              <PlayCircle size={40} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Library is Empty</h3>
              <p className="text-slate-500 text-sm font-medium">Add some video lectures or online course links.</p>
            </div>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[48px] w-full max-w-xl p-10 shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setIsAdding(false)} className="absolute top-10 right-10 p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-50"><X size={20} /></button>
            <div className="flex items-center gap-4 mb-8">
               <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><PlayCircle size={24} /></div>
               <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add Learning Material</h2>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Video lectures or PDF resources</p>
               </div>
            </div>

            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resource Title</label>
                <input 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="e.g. Physics 1st Paper - Motion Lecture"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL / Link</label>
                <div className="relative group">
                  <Youtube className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" size={18} />
                  <input 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                    value={formData.subjectId}
                    onChange={e => setFormData({...formData, subjectId: e.target.value})}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Topic (Optional)</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="e.g. Vectors"
                    value={formData.topic}
                    onChange={e => setFormData({...formData, topic: e.target.value})}
                  />
                </div>
              </div>

              <button className="w-full bg-slate-900 text-white py-5 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all mt-4">
                Save to Library
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
