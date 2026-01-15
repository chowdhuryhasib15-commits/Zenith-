
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NAV_ITEMS } from '../constants';
import { User, AppTheme, AppState } from '../types';
import { 
  Menu, X, LogOut, ChevronUp, 
  Palette, Check, Sparkles, Wand2, 
  Smile, Frown, Angry, Zap, Laugh, User as UserIcon, Loader2, Upload,
  Book, Info, ExternalLink, Mail, Github, Heart, Cloud,
  BookOpen, Timer, Target, Instagram, Facebook, Monitor, Download, Key, Shield,
  RefreshCw, FileJson, History, AlertTriangle, Trash2, Power
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

const AVATAR_SEEDS = Array.from({ length: 50 }, (_, i) => `ZenithUser_${i + 1}`);

const EXPRESSIONS = [
  { id: 'smiling', label: 'Smiling', icon: <Smile size={16} />, params: 'eyes=happy&mouth=smile' },
  { id: 'confident', label: 'Confident', icon: <Zap size={16} />, params: 'eyes=squint&mouth=serious' },
  { id: 'funny', label: 'Funny', icon: <Laugh size={16} />, params: 'eyes=winkWacky&mouth=tongue' },
  { id: 'nervous', label: 'Nervous', icon: <Frown size={16} />, params: 'eyes=close&mouth=concerned' },
  { id: 'mad', label: 'Mad/Angry', icon: <Angry size={16} />, params: 'eyes=angry&mouth=grimace' },
];

const THEMES: { id: AppTheme; label: string; color: string; desc: string }[] = [
  { id: 'light', label: 'Classic Light', color: 'bg-slate-50', desc: 'Minimalist & Airy' },
  { id: 'dark', label: 'Deep Midnight', color: 'bg-slate-900', desc: 'Focus-oriented Dark' },
  { id: 'obsidian', label: 'True Obsidian', color: 'bg-black', desc: 'Pure Black High-Contrast' },
  { id: 'rose', label: 'Rose Quartz', color: 'bg-rose-100', desc: 'Soft & Inspiring' },
  { id: 'ocean', label: 'Oceanic Blue', color: 'bg-sky-100', desc: 'Calm & Intellectual' },
];

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, setActiveTab, user, onLogout, onUpdateUser, theme, onUpdateTheme, 
  state, onSyncStart, onSyncComplete, onRestore
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pickerTab, setPickerTab] = useState<'profile' | 'manual' | 'about' | 'theme' | 'sync'>('profile');
  
  const [tempProfile, setTempProfile] = useState({
    name: user?.name || '',
    age: user?.age || 18,
    education: user?.education || '',
    seed: 'ZenithUser_1',
    expression: 'smiling',
    customUrl: user?.photoURL || ''
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && isPickerOpen) {
      setTempProfile({
        name: user.name,
        age: user.age || 18,
        education: user.education || '',
        seed: 'ZenithUser_1',
        expression: 'smiling',
        customUrl: user.photoURL
      });
    }
  }, [user, isPickerOpen]);

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
        photoURL: tempProfile.customUrl || getFullAvatarUrl(tempProfile.seed, tempProfile.expression)
      });
      setIsPickerOpen(false);
    }
  };

  const factoryReset = () => {
    if (window.confirm("FINAL WARNING: This will permanently DELETE all study data, subjects, goals, and history. There is no undo. Purge system?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const getFullAvatarUrl = (seed: string, expressionId: string) => {
    const expr = EXPRESSIONS.find(e => e.id === expressionId) || EXPRESSIONS[0];
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&${expr.params}`;
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
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12">
                  <Shield size={20} />
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
                <button onClick={() => { setIsPickerOpen(true); setPickerTab('sync'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-indigo-50 text-theme-secondary font-bold text-xs transition-all">
                  <RefreshCw size={16} className="text-indigo-500" /> Sync & Vault
                </button>
                <button onClick={() => { setIsPickerOpen(true); setPickerTab('theme'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-indigo-50 text-theme-secondary font-bold text-xs transition-all">
                  <Monitor size={16} className="text-indigo-500" /> Interface Theme
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
                 <div className={`p-4 rounded-2xl animate-float bg-indigo-600 text-white`}>
                   {pickerTab === 'sync' ? <RefreshCw size={24} /> : <Wand2 size={24} />}
                 </div>
                 <div>
                   <h2 className="text-3xl font-black text-theme tracking-tight">
                     {pickerTab === 'profile' ? 'Identity Studio' : pickerTab === 'manual' ? 'Operating Manual' : pickerTab === 'theme' ? 'Interface Theme' : pickerTab === 'sync' ? 'Sync & Vault' : 'The Creator'}
                   </h2>
                   <p className="text-xs font-bold text-theme-secondary uppercase tracking-widest mt-1">Zenith Intelligence Portal</p>
                 </div>
               </div>
               <button onClick={() => setIsPickerOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-theme-secondary transition-transform active:scale-90"><X size={24} /></button>
            </div>

            <div className="flex gap-4 mb-8 shrink-0 border-b border-theme pb-4 overflow-x-auto no-scrollbar pr-4">
               {[
                 { id: 'profile', label: 'Profile', icon: <UserIcon size={16} /> },
                 { id: 'sync', label: 'Vault', icon: <RefreshCw size={16} /> },
                 { id: 'theme', label: 'Theme', icon: <Monitor size={16} /> },
                 { id: 'manual', label: 'Manual', icon: <Book size={16} /> }
               ].map(tab => (
                 <button key={tab.id} onClick={() => setPickerTab(tab.id as any)} className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all whitespace-nowrap ${pickerTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-theme-secondary hover:bg-slate-200'}`}>
                   {tab.icon} {tab.label}
                 </button>
               ))}
            </div>

            <div className="flex-1 overflow-hidden">
              {pickerTab === 'profile' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 overflow-hidden">
                  <div className="lg:col-span-4 space-y-8 overflow-y-auto custom-scrollbar pr-4">
                    <div className="flex flex-col items-center bg-slate-50 rounded-[40px] p-8 border border-theme shadow-inner">
                       <div className="w-48 h-48 bg-white rounded-3xl shadow-2xl border-4 border-white mb-6 overflow-hidden relative">
                         <img src={tempProfile.customUrl || getFullAvatarUrl(tempProfile.seed, tempProfile.expression)} className="w-full h-full object-cover" />
                       </div>
                       <input className="w-full bg-white border border-theme rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none" placeholder="Display Name" value={tempProfile.name} onChange={e => setTempProfile({...tempProfile, name: e.target.value})} />
                    </div>
                    <button onClick={applyChanges} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm transition-all hover:bg-indigo-600 shadow-xl">Apply Identity</button>
                  </div>
                  <div className="lg:col-span-8 overflow-y-auto custom-scrollbar pr-2 bg-slate-50 rounded-[40px] p-8 border border-theme shadow-inner">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                      {AVATAR_SEEDS.map((seed, idx) => (
                        <button key={idx} onClick={() => setTempProfile({...tempProfile, seed, customUrl: ''})} className={`aspect-square p-2 rounded-2xl border-2 transition-all ${tempProfile.seed === seed ? 'border-indigo-600 bg-white shadow-md' : 'border-transparent bg-white/50 hover:bg-white'}`}>
                          <img src={getFullAvatarUrl(seed, tempProfile.expression)} className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : pickerTab === 'sync' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 py-4 space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {/* Export */}
                      <div className="bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-bl-[100px] -z-0 pointer-events-none group-hover:scale-125 transition-transform" />
                         <div className="relative z-10 flex flex-col h-full justify-between min-h-[300px]">
                            <div>
                               <div className="p-4 bg-white/10 rounded-3xl w-fit mb-6 backdrop-blur-md">
                                  <Download size={32} className="text-indigo-400" />
                               </div>
                               <h3 className="text-3xl font-black tracking-tighter">Export Vault</h3>
                               <p className="text-slate-400 font-medium mt-2 leading-relaxed text-sm">Save your entire Zenith state to a portable JSON file for external backup.</p>
                            </div>
                            <button onClick={exportVault} disabled={isSyncing} className="w-full bg-white text-slate-900 py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-400 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                               {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <Download size={16} />}
                               {isSyncing ? 'Packaging...' : 'Sync Out'}
                            </button>
                         </div>
                      </div>

                      {/* Import */}
                      <div className="bg-slate-50 rounded-[48px] p-10 border border-slate-200 relative overflow-hidden group">
                         <div className="relative z-10 flex flex-col h-full justify-between min-h-[300px]">
                            <div>
                               <div className="p-4 bg-indigo-100 rounded-3xl w-fit mb-6">
                                  <Upload size={32} className="text-indigo-600" />
                               </div>
                               <h3 className="text-3xl font-black tracking-tighter text-slate-900">Restore Vault</h3>
                               <p className="text-slate-500 font-medium mt-2 leading-relaxed text-sm">Import a previously exported Zenith file to restore your academic progress.</p>
                            </div>
                            <div>
                               <button onClick={() => importInputRef.current?.click()} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                                  <Upload size={16} />
                                  Sync In
                               </button>
                               <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportVault} />
                            </div>
                         </div>
                      </div>

                      {/* Delete / Clear */}
                      <div className="bg-rose-50 rounded-[48px] p-10 border border-rose-100 relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col h-full justify-between min-h-[300px]">
                           <div>
                              <div className="p-4 bg-rose-100 rounded-3xl w-fit mb-6 text-rose-600">
                                 <Trash2 size={32} />
                              </div>
                              <h3 className="text-3xl font-black tracking-tighter text-rose-900">Delete Data</h3>
                              <p className="text-rose-600/70 font-medium mt-2 leading-relaxed text-sm">Permanently wipe all local progress and reset your study laboratory.</p>
                           </div>
                           <button onClick={factoryReset} className="w-full bg-rose-600 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all flex items-center justify-center gap-3">
                              <Power size={18} />
                              Clear Everything
                           </button>
                        </div>
                      </div>
                   </div>
                </div>
              ) : pickerTab === 'theme' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 py-4">
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {THEMES.map((t) => (
                        <button key={t.id} onClick={() => onUpdateTheme(t.id)} className={`flex flex-col text-left p-6 rounded-[32px] border-2 transition-all relative group overflow-hidden ${theme === t.id ? 'border-indigo-600 bg-indigo-50/50 shadow-xl' : 'border-theme bg-white hover:bg-slate-50'}`}>
                          <div className={`w-12 h-12 rounded-2xl mb-4 shadow-inner ${t.color}`} />
                          <h4 className="text-sm font-black text-theme tracking-tight uppercase">{t.label}</h4>
                          <p className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest mt-1">{t.desc}</p>
                          {theme === t.id && <div className="absolute top-4 right-4 text-indigo-600 animate-in zoom-in"><Check size={20} strokeWidth={3} /></div>}
                        </button>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8 py-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-slate-50 rounded-[32px] border border-theme space-y-4">
                         <h4 className="text-lg font-black text-theme flex items-center gap-3"><FileJson size={20} className="text-indigo-600" /> Vault Sync</h4>
                         <p className="text-sm text-theme-secondary leading-relaxed font-medium">Zenith uses a manual "Sync Out/In" model. Export your Vault to save progress externally, then Import it on any device to synchronize your sessions.</p>
                      </div>
                      <div className="p-8 bg-slate-50 rounded-[32px] border border-theme space-y-4">
                         <h4 className="text-lg font-black text-theme flex items-center gap-3"><History size={20} className="text-indigo-600" /> Restoration</h4>
                         <p className="text-sm text-theme-secondary leading-relaxed font-medium">Importing a Vault will overwrite your current local state. It is recommended to Export a backup before restoring an older file.</p>
                      </div>
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
