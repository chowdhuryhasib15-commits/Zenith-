
import React from 'react';
import { Subject } from '../types';
import { ICONS } from '../constants';
import { MinusCircle } from 'lucide-react';

interface RevisionPageProps {
  subjects: Subject[];
  setSubjects: (s: Subject[]) => void;
}

const REVISION_INTERVALS = [1, 3, 7, 14, 30];

const RevisionPage: React.FC<RevisionPageProps> = ({ subjects, setSubjects }) => {
  const now = new Date();

  // Spaced Repetition Logic: 
  // Next Due = Last Event Date + Required Interval (based on current revisions)
  const chaptersToRevise = subjects.flatMap(s => 
    s.chapters
      .filter(c => {
        if (!c.isCompleted || (!c.completedAt && !c.lastRevisedAt)) return false;
        const lastEventDate = new Date(c.lastRevisedAt || c.completedAt!).getTime();
        const daysSinceLastEvent = (now.getTime() - lastEventDate) / (1000 * 3600 * 24);
        const requiredInterval = REVISION_INTERVALS[c.revisions] || 30;
        return daysSinceLastEvent >= requiredInterval;
      })
      .map(c => ({ 
        ...c, 
        subjectName: s.name, 
        subjectId: s.id, 
        color: s.color,
        nextInterval: REVISION_INTERVALS[c.revisions] || 30
      }))
  );

  const updateRevision = (subId: string, chapId: string, delta: number) => {
    setSubjects(subjects.map(s => {
      if (s.id === subId) {
        return {
          ...s,
          chapters: s.chapters.map(c => 
            c.id === chapId ? { 
              ...c, 
              revisions: Math.max(0, (c.revisions || 0) + delta),
              lastRevisedAt: delta > 0 ? new Date().toISOString() : c.lastRevisedAt
            } : c
          )
        };
      }
      return s;
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Cognitive Revision Lab</h1>
        <p className="text-slate-500">Intelligent spaced repetition based on your mastery levels.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chaptersToRevise.length > 0 ? chaptersToRevise.map((chap, i) => (
          <div key={`${chap.subjectId}-${chap.id}`} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col">
             <div 
              className="absolute top-0 left-0 w-1.5 h-full" 
              style={{ backgroundColor: chap.color }} 
            />
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 mr-4">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-slate-100 text-slate-600 rounded-md mb-2 inline-block">
                  {chap.subjectName}
                </span>
                <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{chap.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  <RotateCcw size={14} />
                  <span className="text-sm font-bold">Lvl {chap.revisions}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 mb-6 mt-auto">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Last Sync: {new Date(chap.lastRevisedAt || chap.completedAt!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                Current Cycle: {chap.nextInterval} Days
              </p>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => updateRevision(chap.subjectId, chap.id, 1)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all group shadow-lg shadow-indigo-100"
              >
                <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                Reinforce Memory
              </button>
              
              <button 
                onClick={() => updateRevision(chap.subjectId, chap.id, -1)}
                disabled={(chap.revisions || 0) === 0}
                className="p-3 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 hover:text-slate-600 transition-all disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-slate-400"
                title="Revert level"
              >
                <MinusCircle size={20} />
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full bg-slate-100 p-12 rounded-3xl text-center">
            <h3 className="text-lg font-bold text-slate-600">Memory Buffer is Clean</h3>
            <p className="text-slate-400">All completed topics are currently in their retention window.</p>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">{ICONS.Trend}</span>
          Spaced Repetition Architecture
        </h3>
        <p className="text-slate-600 leading-relaxed max-w-2xl">
          Zenith uses an expanding interval algorithm (1-3-7-14-30). Each time you "Reinforce Memory", 
          the next reminder is scheduled further out. This technique exploits the "spacing effect" 
          to minimize cognitive effort while maximizing long-term recall reliability.
        </p>
      </div>
    </div>
  );
};

const RotateCcw = ({ size, className }: { size: number, className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
);

export default RevisionPage;
