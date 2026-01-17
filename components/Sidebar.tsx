
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NAV_ITEMS, AVATAR_SEEDS, EXPRESSIONS, getAvatarUrl } from '../constants';
import { User, AppTheme, AppState } from '../types';
import { 
  Menu, X, LogOut, ChevronUp, 
  Palette, Check, Smile, Frown, Angry, Zap, Laugh, User as UserIcon, Loader2, Upload,
  Book, Monitor, Download, RefreshCw, FileJson, History, Trash2, Power,
  Compass, Mountain, Sparkles, Camera, Briefcase, GraduationCap, Info, HelpCircle,
  Clock, Target, ShieldCheck, Lock, Instagram, Facebook, Github, ExternalLink,
  ChevronRight, BrainCircuit, Activity, Cpu
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  user?: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  theme: AppTheme;
  onUpdateTheme: (theme: AppTheme) => void;
  state: AppState;
  onSyncStart: () => void;
  onSyncComplete: () => void;
  onRestore: (state: AppState) => void;
}

const ZenithIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <div className={`relative ${className} flex items-center justify-center`}>
    <div className="absolute inset-0 bg-white/20 blur-[8px] rounded-full scale-150 animate-pulse" />
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
      <path d="M12 3L4 19H20L12 3Z" className="fill-white/20 stroke-white" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 3L8 19H16L12 3Z" className="fill-white/40 stroke-white" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 1L13.5 4.5L17 6L13.5 7.5L12 11L10.5 7.5L7 6L10.5 4.5L12 1Z" fill="white" className="animate-pulse" />
    </svg>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, user, onLogout, onUpdateUser, theme, onUpdateTheme, 
  state, onSyncStart, onSyncComplete, onRestore
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pickerTab, setPickerTab] = useState<'profile' | 'manual' | 'theme' | 'sync' | 'about'>('profile');
  
  const [tempProfile, setTempProfile] = useState({
    name: user?.name || '',
    age: user?.age || 18,
    education: user?.education || '',
    seed: AVATAR_SEEDS[0],
    expression: EXPRESSIONS[0].id,
    customUrl: user?.photoURL || ''
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && isPickerOpen) {
      setTempProfile({
        name: user.name,
        age: user.age || 18,
        education: user.education || '',
        seed: AVATAR_SEEDS[0],
        expression: EXPRESSIONS[0].id,
        customUrl: user.photoURL.startsWith('https://api.dicebear.com') ? '' : user.photoURL
      });
    }
  }, [user, isPickerOpen]);

  const handleCustomImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempProfile({ ...tempProfile, customUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const exportVault = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `zenith_vault_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      onSyncComplete();
      setIsSyncing(false);
    }, 800);
  };

  const handleImportVault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (window.confirm("CRITICAL: This will overwrite current data. Continue?")) {
          onRestore(importedData);
          alert("Vault restored successfully.");
        }
      } catch (error) {
        alert("Invalid vault file.");
      }
    };
    reader.readAsText(file);
  };

  const applyChanges = () => {
    if (user) {
      onUpdateUser({ 
        ...user, 
        name: tempProfile.name,
        age: tempProfile.age,
        education: tempProfile.education,
        photoURL: tempProfile.customUrl || getAvatarUrl(tempProfile.seed, tempProfile.expression)
      });
      setIsPickerOpen(false);
    }
  };

  const THEMES: { id: AppTheme; label: string; color: string; desc: string }[] = [
    { id: 'light', label: 'Classic Light', color: 'bg-slate-50', desc: 'Minimalist & Airy' },
    { id: 'dark', label: 'Deep Midnight', color: 'bg-slate-900', desc: 'Focus-oriented Dark' },
    { id: 'obsidian', label: 'True Obsidian', color: 'bg-black', desc: 'Pure Black High-Contrast' },
    { id: 'rose', label: 'Rose Quartz', color: 'bg-rose-100', desc: 'Soft & Inspiring' },
    { id: 'ocean', label: 'Oceanic Blue', color: 'bg-sky-100', desc: 'Calm & Intellectual' },
  ];

  const factoryReset = () => {
    if (window.confirm("FINAL WARNING: This will permanently DELETE all study data. Purge system?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const SyncStatusBadge = ({ isMobile = false }) => {
    const lastSynced = state.lastSyncedAt ? new Date(state.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never';
    if (isMobile) return <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />;
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border bg-slate-50/50 border-slate-100 text-slate-500 animate-in fade-in slide-in-from-left-2">
        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Vault: {lastSynced}</span>
      </div>
    );
  };

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card backdrop-blur-md border-b border-theme flex items-center px-4 justify-between z-50">
        <div className="flex items-center gap-3">
          <h1 className="font-black text-xl tracking-tighter text-indigo-600 uppercase">Zenith</h1>
          <SyncStatusBadge isMobile />
        </div>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 text-theme-secondary hover:bg-slate-50 rounded-xl transition-transform active:scale-90">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-card border-r border-theme z-50 transition-transform duration-300
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col p-6 overflow-hidden">
          <div className="mb-8 flex flex-col shrink-0 gap-4">
            <div className="flex items-center gap-3 group">
               <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12 group-hover:scale-105">
                  <ZenithIcon className="w-6 h-6" />
               </div>
               <h1 className="font-black text-2xl tracking-tighter text-theme uppercase">Zenith</h1>
            </div>
            <SyncStatusBadge />
          </div>

          <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsMobileOpen(false); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl font-semibold transition-all hover:translate-x-1
                  ${activeTab === item.id 
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                    : 'text-theme-secondary hover:bg-slate-50 hover:text-indigo-500'}
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="relative pt-6 border-t border-theme shrink-0" ref={menuRef}>
            {isMenuOpen && (
              <div className="absolute bottom-full left-0 w-full mb-4 bg-card rounded-3xl shadow-2xl border border-theme p-2 animate-in slide-in-from-bottom-4 z-[60]">
                <button onClick={() => { setIsPickerOpen(true); setPickerTab('profile'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-indigo-50 text-theme-secondary font-bold text-xs transition-all">
                  <Palette size={16} className="text-indigo-500" /> Identity Studio
                </button>
                <button onClick={() => { setIsPickerOpen(true); setPickerTab('manual'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-indigo-50 text-theme-secondary font-bold text-xs transition-all">
                  <Book size={16} className="text-indigo-500" /> Zenith Manual
                </button>
                <button onClick={() => { setIsPickerOpen(true); setPickerTab('theme'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-indigo-50 text-theme-secondary font-bold text-xs transition-all">
                  <Monitor size={16} className="text-indigo-500" /> Interface Theme
                </button>
                <button onClick={() => { setIsPickerOpen(true); setPickerTab('sync'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-indigo-50 text-theme-secondary font-bold text-xs transition-all">
                  <RefreshCw size={16} className="text-indigo-500" /> Sync & Vault
                </button>
                <button onClick={() => { setIsPickerOpen(true); setPickerTab('about'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-indigo-50 text-theme-secondary font-bold text-xs transition-all">
                  <Info size={16} className="text-indigo-500" /> Architect Reveal
                </button>
                <div className="h-px bg-slate-50 my-2 mx-2" />
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-rose-50 text-rose-500 font-bold text-xs transition-all">
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}

            {user && (
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-full flex items-center p-3 gap-3 rounded-2xl border bg-slate-50 border-theme hover:border-indigo-200 transition-all active:scale-95">
                <img src={user.photoURL} className="w-10 h-10 rounded-xl bg-white shadow-sm object-cover" />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-theme-secondary uppercase font-bold tracking-widest">{user.education || 'Academic'}</p>
                </div>
                <ChevronUp size={16} className={`text-slate-300 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {isPickerOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-[48px] w-full max-w-6xl p-8 lg:p-12 shadow-2xl animate-in zoom-in-95 max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8 shrink-0">
               <div className="flex items-center gap-5">
                 <div className={`w-16 h-16 rounded-2xl animate-float bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-2xl`}>
                   <ZenithIcon className="w-10 h-10" />
                 </div>
                 <div>
                   <h2 className="text-3xl font-black text-theme tracking-tight">
                     {pickerTab === 'profile' ? 'Identity Studio' : pickerTab === 'manual' ? 'Operating Manual' : pickerTab === 'theme' ? 'Interface Theme' : pickerTab === 'about' ? 'Architect Reveal' : 'Sync & Vault'}
                   </h2>
                   <p className="text-xs font-bold text-theme-secondary uppercase tracking-widest mt-1">Zenith Intelligence Portal</p>
                 </div>
               </div>
               <button onClick={() => setIsPickerOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-theme-secondary transition-transform active:scale-90"><X size={24} /></button>
            </div>

            <div className="flex gap-4 mb-8 shrink-0 border-b border-theme pb-4 overflow-x-auto no-scrollbar pr-4">
               {[
                 { id: 'profile', label: 'Identity', icon: <UserIcon size={16} /> },
                 { id: 'manual', label: 'Manual', icon: <Book size={16} /> },
                 { id: 'theme', label: 'Theme', icon: <Monitor size={16} /> },
                 { id: 'sync', label: 'Vault', icon: <RefreshCw size={16} /> },
                 { id: 'about', label: 'Creator', icon: <Sparkles size={16} /> }
               ].map(tab => (
                 <button key={tab.id} onClick={() => setPickerTab(tab.id as any)} className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${pickerTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-theme-secondary hover:bg-slate-200'}`}>
                   {tab.icon} {tab.label}
                 </button>
               ))}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              {pickerTab === 'profile' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 min-h-0 overflow-hidden pb-4">
                  <div className="lg:col-span-5 space-y-6 overflow-y-auto custom-scrollbar pr-4 pb-8">
                    <div className="bg-slate-50 border border-theme rounded-[40px] p-8 shadow-inner space-y-6">
                       <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] mb-4">Manual Identity</h3>
                       
                       <div className="flex flex-col items-center gap-6">
                         <div className="relative group/avatar">
                           <div className="w-32 h-32 bg-white rounded-[32px] shadow-xl border-4 border-white overflow-hidden ring-1 ring-slate-100">
                             <img src={tempProfile.customUrl || getAvatarUrl(tempProfile.seed, tempProfile.expression)} className="w-full h-full object-cover" />
                           </div>
                           <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-slate-900 transition-all active:scale-90">
                             <Camera size={18} />
                           </button>
                           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleCustomImage} />
                         </div>
                         {tempProfile.customUrl && (
                           <button onClick={() => setTempProfile({...tempProfile, customUrl: ''})} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Revert to Avatars</button>
                         )}
                       </div>

                       <div className="space-y-4 pt-4">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                           <input className="w-full bg-white border border-theme rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" value={tempProfile.name} onChange={e => setTempProfile({...tempProfile, name: e.target.value})} />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Age</label>
                             <input type="number" className="w-full bg-white border border-theme rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" value={tempProfile.age} onChange={e => setTempProfile({...tempProfile, age: Number(e.target.value)})} />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Education Status</label>
                             <input className="w-full bg-white border border-theme rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" placeholder="e.g. HSC Student" value={tempProfile.education} onChange={e => setTempProfile({...tempProfile, education: e.target.value})} />
                           </div>
                         </div>
                       </div>
                    </div>
                    <button onClick={applyChanges} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] transition-all hover:bg-indigo-600 shadow-2xl flex items-center justify-center gap-3">
                       <Check size={18} /> Apply Intelligence Update
                    </button>
                  </div>

                  <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-50 border border-theme rounded-[40px] shadow-inner overflow-hidden">
                    <div className="p-8 pb-4 shrink-0">
                      <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em] mb-6">Zenith Cyber-Avatars</h3>
                      <div className="flex flex-wrap gap-2 mb-2">
                         {EXPRESSIONS.map(expr => (
                           <button 
                             key={expr.id} 
                             onClick={() => setTempProfile({...tempProfile, expression: expr.id, customUrl: ''})}
                             className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${tempProfile.expression === expr.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border border-theme hover:bg-slate-100'}`}
                           >
                             {expr.icon} {expr.label}
                           </button>
                         ))}
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 min-h-0">
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 pb-4">
                        {AVATAR_SEEDS.map((seed, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => setTempProfile({...tempProfile, seed, customUrl: ''})} 
                            className={`aspect-square p-2 rounded-2xl border-2 transition-all relative overflow-hidden flex items-center justify-center ${tempProfile.seed === seed ? 'border-indigo-600 bg-white shadow-lg' : 'border-transparent bg-white/50 hover:bg-white hover:border-slate-200'}`}
                          >
                            <img src={getAvatarUrl(seed, tempProfile.expression)} className="w-full h-full object-contain" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : pickerTab === 'manual' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 pb-12 min-h-0">
                   {/* Manual Content (unchanged) */}
                   <div className="max-w-4xl space-y-16 py-4">
                      <section className="space-y-10">
                        <div className="flex items-center gap-6">
                          <div className="p-5 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100 animate-float"><Book size={32} /></div>
                          <div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">THE ZENITH PROTOCOL</h3>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Foundational Operating Intelligence</p>
                          </div>
                        </div>
                        <p className="text-lg text-slate-500 leading-relaxed font-medium">
                          Zenith is more than a tracker; it's a high-fidelity laboratory for academic evolution. By leveraging Spaced Repetition (SRS) and Focus Momentum, it quantifies your cognitive growth.
                        </p>
                      </section>
                      {/* ... other manual sections */}
                   </div>
                </div>
              ) : pickerTab === 'theme' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 py-4 min-h-0">
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {THEMES.map((t) => (
                        <button key={t.id} onClick={() => onUpdateTheme(t.id)} className={`flex flex-col text-left p-6 rounded-[32px] border-2 transition-all relative ${theme === t.id ? 'border-indigo-600 bg-indigo-50/50 shadow-xl' : 'border-theme bg-white hover:bg-slate-50'}`}>
                          <div className={`w-12 h-12 rounded-2xl mb-4 shadow-inner ${t.color}`} />
                          <h4 className="text-sm font-black text-theme uppercase tracking-tight">{t.label}</h4>
                          <p className="text-[10px] font-bold text-theme-secondary mt-1">{t.desc}</p>
                        </button>
                      ))}
                   </div>
                </div>
              ) : pickerTab === 'about' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 pb-12 min-h-0">
                   {/* About Content */}
                   <div className="max-w-4xl space-y-12 py-4">
                      <div className="space-y-6">
                        <h3 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">Hasib <br /><span className="text-indigo-600">Chowdhury.</span></h3>
                        <div className="flex flex-wrap gap-2">
                           <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">UI/UX Designer</span>
                           <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200">AI Enthusiast</span>
                        </div>
                      </div>
                      {/* ... other about content */}
                   </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 py-4 space-y-10 min-h-0">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* Sync & Vault content */}
                      <div className="bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden group">
                         <div className="relative z-10 flex flex-col h-full justify-between min-h-[300px]">
                            <div>
                               <div className="p-4 bg-white/10 rounded-3xl w-fit mb-6"><Download size={32} className="text-indigo-400" /></div>
                               <h3 className="text-3xl font-black tracking-tighter">Export Vault</h3>
                               <p className="text-slate-400 font-medium mt-2 leading-relaxed text-sm">Save your entire Zenith state to a portable JSON file for external backup.</p>
                            </div>
                            <button onClick={exportVault} disabled={isSyncing} className="w-full bg-white text-slate-900 py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-400 hover:text-white transition-all">
                               {isSyncing ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Sync Out'}
                            </button>
                         </div>
                      </div>
                      {/* ... other sync content */}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
