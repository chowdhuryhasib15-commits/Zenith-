
import React, { useState, useMemo } from 'react';
import { Subject, Chapter } from '../types';
import { ICONS, COLORS } from '../constants';
import { GraduationCap, Sparkles, CheckCircle, Palette, GripVertical } from 'lucide-react';
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
    setSubjects(subjects.filter(s => s.id === id));
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
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">{title}</h2>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {list.map(sub => {
            const progress = sub.chapters.length === 0 ? 0 : Math.round((sub.chapters.filter(c => c.isCompleted).length / sub.chapters.length) * 100);
            return (
              <div key={sub.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:border-indigo-100 transition-colors group">
                <div className="p-6 pb-0 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative group/color">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform group-hover/color:scale-105" style={{ backgroundColor: sub.color }}>
                        <span className="font-bold text-lg">{sub.name.charAt(0)}</span>
                      </div>
                      <button onClick={() => setEditingColorId(editingColorId === sub.id ? null : sub.id)} className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full shadow-md border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors z-10"><Palette size={12} /></button>
                      {editingColorId === sub.id && (
                        <div className="absolute top-14 left-0 bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 z-50 grid grid-cols-4 gap-2 w-36 animate-in zoom-in duration-200">
                          {COLORS.map(c => <button key={c} onClick={() => updateSubjectColor(sub.id, c)} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${sub.color === c ? 'border-slate-400 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />)}
                        </div>
                      )}
                    </div>
                    <div><h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{sub.name}</h3><p className="text-sm text-slate-500">{sub.chapters.length} Chapters</p></div>
                  </div>
                  <button onClick={() => deleteSubject(sub.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">{ICONS.Trash}</button>
                </div>
                <div className="px-6 py-4">
                  <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</span><span className="text-xs font-bold text-slate-900">{progress}%</span></div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="h-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: sub.color }} /></div>
                </div>
                <div className="flex-1 px-6 py-4 overflow-y-auto max-h-64 custom-scrollbar space-y-2">
                  {sub.chapters.map((chap, index) => {
                    const isDraggingOver = dragOverIndex?.subId === sub.id && dragOverIndex?.index === index;
                    return (
                      <div key={chap.id} draggable onDragStart={(e) => handleDragStart(e, sub.id, index)} onDragEnd={handleDragEnd} onDragOver={(e) => handleDragOver(e, sub.id, index)} onDrop={(e) => handleDrop(e, sub.id, index)} className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ease-in-out cursor-default relative ${isDraggingOver ? 'border-indigo-400 bg-indigo-50/50 -translate-y-1' : ''} ${chap.isCompleted ? 'bg-slate-50 border-transparent text-slate-400 opacity-60 scale-[0.98]' : 'bg-white border-slate-100 text-slate-700 shadow-sm hover:border-indigo-200 opacity-100 scale-100'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors shrink-0"><GripVertical size={16} /></div>
                          <button onClick={() => toggleChapter(sub.id, chap.id)} className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 shrink-0 ${chap.isCompleted ? 'bg-indigo-600 text-white' : 'border-2 border-slate-200 hover:border-indigo-400'}`}>{chap.isCompleted && <CheckCircle size={14} className="animate-in zoom-in duration-200" />}</button>
                          <span className={`text-sm font-medium truncate transition-all duration-300 ${chap.isCompleted ? 'line-through' : ''}`}>{chap.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-6 bg-slate-50 mt-auto border-t border-slate-100">
                  <div className="flex gap-2">
                    <input placeholder="New chapter..." className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" onKeyDown={(e) => { if (e.key === 'Enter') { addChapter(sub.id, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} />
                    <button onClick={() => handleSmartChapters(sub)} disabled={generatingFor === sub.id} className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-colors disabled:opacity-50">{generatingFor === sub.id ? <span className="animate-spin block">⚙️</span> : ICONS.AI}</button>
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-slate-900">Subjects</h1><p className="text-slate-500">Organize your study material.</p></div>
        <div className="flex items-center gap-3">
          <button onClick={loadHscPreset} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-100 transition-colors"><GraduationCap size={18} />HSC Preset</button>
          <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">{ICONS.Plus}Add Subject</button>
        </div>
      </header>
      {isAdding && (
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl max-w-md mx-auto animate-in zoom-in duration-200">
          <h3 className="text-xl font-bold mb-6">New Subject</h3>
          <div className="space-y-6">
            <input autoFocus className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-semibold" placeholder="Subject Name..." value={newSubName} onChange={(e) => setNewSubName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSubject(newSubName, selectedColor)} />
            <div className="grid grid-cols-4 gap-3">{COLORS.map(c => <button key={c} onClick={() => setSelectedColor(c)} className={`h-10 rounded-xl border-4 transition-all ${selectedColor === c ? 'border-slate-300 scale-105' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />)}</div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => addSubject(newSubName, selectedColor)} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Create</button>
              <button onClick={() => setIsAdding(false)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {subjects.length > 0 ? <div className="space-y-16">{renderSubjectGrid("General Categories", categorizedSubjects.general)}{renderSubjectGrid("Science Stream", categorizedSubjects.science)}</div> : (
        <div className="py-20 text-center space-y-6">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-600"><GraduationCap size={48} /></div>
          <h3 className="text-2xl font-bold text-slate-900">Start your HSC Journey</h3>
          <button onClick={loadHscPreset} className="inline-flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 group"><Sparkles size={20} />Load HSC Syllabus Preset</button>
        </div>
      )}
    </div>
  );
};

export default SubjectsPage;
