
import React, { useState, useMemo, useEffect } from 'react';
import { Subject, Chapter } from '../types';
import { ICONS, COLORS } from '../constants';
// Added Plus to the import list from lucide-react
import { GraduationCap, Sparkles, CheckCircle, Palette, GripVertical, Plus } from 'lucide-react';
import { generateSubjectChapters } from '../services/geminiService';
import { HSC_SYLLABUS_PRESET } from '../constants/hscSyllabus';

interface SubjectsPageProps {
  subjects: Subject[];
  setSubjects: (s: Subject[]) => void;
}

const SubjectsPage: React.FC<SubjectsPageProps> = ({ subjects, setSubjects }) => {
  const [newSubName, setNewSubName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ subId: string; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<{ subId: string; index: number } | null>(null);

  // For initial staggered animation
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const addSubject = (name: string, color: string) => {
    if (!name.trim()) return;
    const newSub: Subject = {
      id: Date.now().toString(),
      name,
      color,
      chapters: [],
    };
    setSubjects([...subjects, newSub]);
    setNewSubName('');
    setSelectedColor(COLORS[(subjects.length + 1) % COLORS.length]);
    setIsAdding(false);
  };

  const updateSubjectColor = (id: string, color: string) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, color } : s));
    setEditingColorId(null);
  };

  const loadHscPreset = () => {
    if (subjects.length > 0 && !window.confirm("This will add the full HSC syllabus. Are you sure?")) {
      return;
    }

    // Logic to group colors by subject family (e.g. Physics 1st & 2nd match)
    const colorMap: Record<string, string> = {};
    let nextColorIdx = 0;

    const newSubjects: Subject[] = HSC_SYLLABUS_PRESET.map((preset, index) => {
      // Extract base family name (e.g. "Physics 1st Paper" -> "Physics")
      const familyName = preset.name.replace(/\s*(1st|2nd)\s+Paper/i, '').trim();
      
      if (!colorMap[familyName]) {
        colorMap[familyName] = COLORS[nextColorIdx % COLORS.length];
        nextColorIdx++;
      }

      return {
        id: `hsc-${index}-${Date.now()}`,
        name: preset.name,
        color: colorMap[familyName],
        chapters: preset.chapters.map((chapName, chapIndex) => ({
          id: `hsc-chap-${index}-${chapIndex}-${Date.now()}`,
          name: chapName,
          isCompleted: false,
          revisions: 0
        }))
      };
    });

    setSubjects([...subjects, ...newSubjects]);
  };

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const addChapter = (subId: string, name: string) => {
    if (!name.trim()) return;
    setSubjects(subjects.map(s => {
      if (s.id === subId) {
        return {
          ...s,
          chapters: [...s.chapters, { id: Date.now().toString(), name, isCompleted: false, revisions: 0 }]
        };
      }
      return s;
    }));
  };

  const toggleChapter = (subId: string, chapId: string) => {
    setSubjects(subjects.map(s => {
      if (s.id === subId) {
        return {
          ...s,
          chapters: s.chapters.map(c => {
            if (c.id === chapId) {
              const becomingCompleted = !c.isCompleted;
              return { 
                ...c, 
                isCompleted: becomingCompleted, 
                completedAt: becomingCompleted ? new Date().toISOString() : undefined 
              };
            }
            return c;
          })
        };
      }
      return s;
    }));
  };

  const handleSmartChapters = async (sub: Subject) => {
    setGeneratingFor(sub.id);
    const chapters = await generateSubjectChapters(sub.name);
    setSubjects(subjects.map(s => {
      if (s.id === sub.id) {
        const newChapters: Chapter[] = chapters.map((name: string) => ({
          id: Math.random().toString(36).substr(2, 9),
          name,
          isCompleted: false,
          revisions: 0
        }));
        return { ...s, chapters: [...s.chapters, ...newChapters] };
      }
      return s;
    }));
    setGeneratingFor(null);
  };

  const handleDragStart = (e: React.DragEvent, subId: string, index: number) => {
    setDraggedItem({ subId, index });
    e.dataTransfer.effectAllowed = 'move';
    const target = e.target as HTMLElement;
    target.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, subId: string, index: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.subId !== subId) return;
    setDragOverIndex({ subId, index });
  };

  const handleDrop = (e: React.DragEvent, subId: string, targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.subId !== subId) {
      setDragOverIndex(null);
      return;
    }
    const newSubjects = [...subjects];
    const subIdx = newSubjects.findIndex(s => s.id === subId);
    if (subIdx === -1) return;
    const chapters = [...newSubjects[subIdx].chapters];
    const [movedChapter] = chapters.splice(draggedItem.index, 1);
    chapters.splice(targetIndex, 0, movedChapter);
    newSubjects[subIdx] = { ...newSubjects[subIdx], chapters };
    setSubjects(newSubjects);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const categorizedSubjects = useMemo(() => {
    const general = subjects.filter(s => /bangla|english|ict/i.test(s.name) || /বাংলা|ইংরেজি|আইসিটি/i.test(s.name));
    const science = subjects.filter(s => !general.includes(s));
    const sortPapers = (list: Subject[]) => [...list].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
    return { general: sortPapers(general), science: sortPapers(science) };
  }, [subjects]);

  const renderSubjectGrid = (title: string, list: Subject[]) => {
    if (list.length === 0) return null;
    return (
      <section className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">{title}</h2>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {list.map((sub, sIdx) => {
            const progress = sub.chapters.length === 0 ? 0 : Math.round((sub.chapters.filter(c => c.isCompleted).length / sub.chapters.length) * 100);
            return (
              <div key={sub.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:border-indigo-200 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) group">
                <div className="p-8 pb-4 flex items-start justify-between">
                  <div className="flex items-center gap-5">
                    <div className="relative group/color">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover/color:rotate-12 group-hover/color:scale-110" style={{ backgroundColor: sub.color }}>
                        <span className="font-black text-xl">{sub.name.charAt(0)}</span>
                      </div>
                      <button onClick={() => setEditingColorId(editingColorId === sub.id ? null : sub.id)} className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all z-10 hover:rotate-90"><Palette size={14} /></button>
                      {editingColorId === sub.id && (
                        <div className="absolute top-16 left-0 bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 z-50 grid grid-cols-4 gap-3 w-44 animate-in zoom-in duration-300">
                          {COLORS.map(c => <button key={c} onClick={() => updateSubjectColor(sub.id, c)} className={`w-7 h-7 rounded-full border-4 transition-transform hover:scale-125 ${sub.color === c ? 'border-slate-400 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}
                        </div>
                      )}
                    </div>
                    <div><h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{sub.name}</h3><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{sub.chapters.length} Chapters</p></div>
                  </div>
                  <button onClick={() => deleteSubject(sub.id)} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-90">{ICONS.Trash}</button>
                </div>
                <div className="px-8 py-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Mastery Score</span>
                    {/* Animated Percentage Text */}
                    <span className="text-xs font-black text-slate-900 transition-all duration-300 tabular-nums">
                      {isMounted ? progress : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner relative">
                    {/* Progress Bar Inner with Shimmer, Fill, and Sparkle Animation */}
                    <div 
                      className="h-full animate-shimmer liquid-progress progress-bar-fill relative" 
                      style={{ 
                        width: isMounted ? `${progress}%` : '0%', 
                        backgroundColor: sub.color,
                        // Stagger the fill start slightly based on index
                        animationDelay: `${sIdx * 0.1}s` 
                      }} 
                    >
                      {/* Leading Edge Spark/Glow */}
                      {progress > 0 && (
                        <div className="progress-spark" style={{ backgroundColor: 'white', boxShadow: `0 0 10px 2px ${sub.color}` }} />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-1 px-8 py-4 overflow-y-auto max-h-72 custom-scrollbar space-y-3 pb-6">
                  {sub.chapters.map((chap, index) => {
                    const isDraggingOver = dragOverIndex?.subId === sub.id && dragOverIndex?.index === index;
                    return (
                      <div key={chap.id} draggable onDragStart={(e) => handleDragStart(e, sub.id, index)} onDragEnd={handleDragEnd} onDragOver={(e) => handleDragOver(e, sub.id, index)} onDrop={(e) => handleDrop(e, sub.id, index)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-500 ease-out cursor-default relative group/chap ${isDraggingOver ? 'border-indigo-400 bg-indigo-50/50 -translate-y-2 shadow-lg scale-[1.03]' : ''} ${chap.isCompleted ? 'bg-slate-50 border-transparent text-slate-400 opacity-60 scale-[0.98]' : 'bg-white border-slate-100 text-slate-700 shadow-sm hover:border-indigo-200 hover:shadow-md opacity-100 scale-100'}`}>
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors shrink-0 opacity-0 group-hover/chap:opacity-100"><GripVertical size={16} /></div>
                          <button onClick={() => toggleChapter(sub.id, chap.id)} className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${chap.isCompleted ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'border-2 border-slate-200 hover:border-indigo-400 bg-white'}`}>{chap.isCompleted && <CheckCircle size={16} className="animate-in zoom-in duration-300" />}</button>
                          <span className={`text-sm font-bold tracking-tight truncate transition-all duration-500 ${chap.isCompleted ? 'line-through' : ''}`}>{chap.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-8 bg-slate-50/80 mt-auto border-t border-slate-100 backdrop-blur-sm">
                  <div className="flex gap-3">
                    <input placeholder="New chapter sequence..." className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm" onKeyDown={(e) => { if (e.key === 'Enter') { addChapter(sub.id, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} />
                    <button onClick={() => handleSmartChapters(sub)} disabled={generatingFor === sub.id} className="p-4 bg-white text-indigo-600 border border-indigo-100 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90 disabled:opacity-50">{generatingFor === sub.id ? <span className="animate-spin block">⚙️</span> : ICONS.AI}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div><h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Subjects</h1><p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-3">Architect your academic universe.</p></div>
        <div className="flex items-center gap-4">
          <button onClick={loadHscPreset} className="flex items-center gap-3 bg-indigo-50 text-indigo-600 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95 shadow-sm border border-indigo-100"><GraduationCap size={18} />HSC Preset</button>
          {/* Fixed "Plus" missing icon error by adding it to lucide-react imports */}
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-100 active:scale-95 border border-transparent"><Plus size={18} />Add Subject</button>
        </div>
      </header>
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[56px] shadow-2xl max-w-lg w-full relative animate-in zoom-in-95 duration-500 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <div className="flex items-center justify-between mb-10">
               <div>
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight">New Domain</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Classify academic material</p>
               </div>
               <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-transform active:scale-90"><Sparkles size={24} className="text-indigo-400" /></button>
            </div>
            <div className="space-y-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Subject Label</label>
                <input autoFocus className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[32px] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-black text-slate-700 shadow-inner text-lg" placeholder="e.g. Astrophysics" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubject(newSubName, selectedColor)} />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Domain Branding</label>
                <div className="grid grid-cols-4 gap-4">{COLORS.map(c => <button key={c} onClick={() => setSelectedColor(c)} className={`h-12 rounded-2xl border-4 transition-all ${selectedColor === c ? 'border-slate-300 scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />)}</div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => addSubject(newSubName, selectedColor)} className="flex-1 bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all">Initialize</button>
                <button onClick={() => setIsAdding(false)} className="flex-1 bg-slate-50 text-slate-400 border border-slate-200 py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] hover:bg-white transition-all active:scale-95">Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {subjects.length > 0 ? <div className="space-y-24 px-4">{renderSubjectGrid("Foundational Humanities & Logic", categorizedSubjects.general)}{renderSubjectGrid("Advanced Sciences & Math", categorizedSubjects.science)}</div> : (
        <div className="py-32 text-center space-y-10 px-4">
          <div className="w-32 h-32 bg-indigo-100 rounded-[40px] flex items-center justify-center mx-auto text-indigo-600 shadow-inner animate-float"><GraduationCap size={64} /></div>
          <div className="space-y-4 max-w-xl mx-auto">
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Initiate Your HSC Mission</h3>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">Your academic universe is currently empty. Synchronize with the HSC standard preset to begin your evolution.</p>
          </div>
          <button onClick={loadHscPreset} className="inline-flex items-center gap-4 bg-slate-900 text-white px-10 py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 group"><Sparkles size={24} className="group-hover:rotate-12 transition-transform" />Inject HSC Curriculum</button>
        </div>
      )}
    </div>
  );
};

export default SubjectsPage;
