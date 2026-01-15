
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { NAV_ITEMS } from '../constants';
import { User, AppTheme, AppState } from '../types';
import { GoogleGenAI } from "@google/genai";
import { getSyncReport } from '../services/geminiService';
import { 
  Menu, X, LogOut, ChevronUp, 
  Palette, Check, Sparkles, Wand2, 
  Smile, Frown, Angry, Zap, Laugh, User as UserIcon, Loader2, Upload,
  Book, Info, ExternalLink, Mail, Github, Heart, Cloud,
  BookOpen, Timer, Target, Instagram, Facebook, Monitor, Download, Key, Shield
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [cloudKeyInput, setCloudKeyInput] = useState('');
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFullAvatarUrl = (seed: string, expressionId: string) => {
    const expr = EXPRESSIONS.find(e => e.id === expressionId) || EXPRESSIONS[0];
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&${expr.params}`;
  };

  const currentPreviewUrl = useMemo(() => {
    if (tempProfile.customUrl && (tempProfile.customUrl.startsWith('data:image') || !tempProfile.customUrl.includes('dicebear'))) {
       return tempProfile.customUrl;
    }
    return getFullAvatarUrl(tempProfile.seed, tempProfile.expression);
  }, [tempProfile.seed, tempProfile.expression, tempProfile.customUrl]);

  const handleSync = async () => {
    setIsSyncing(true);
    onSyncStart();
    setSyncMessage(null);
    
    // Simulate Neural Uplink
    await new Promise(r => setTimeout(r, 2000));
    
    const report = await getSyncReport(state);
    setSyncMessage(report);
    onSyncComplete();
    setIsSyncing(false);
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `zenith_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const getCloudKey = () => {
    const encrypted = btoa(JSON.stringify(state));
    navigator.clipboard.writeText(encrypted);
    alert("Cloud Key copied to clipboard. Paste this on any device to restore your data.");
  };

  const restoreFromKey = () => {
    try {
      const decoded = JSON.parse(atob(cloudKeyInput));
      if (window.confirm("This will overwrite your current local data. Continue?")) {
        onRestore(decoded);
        setCloudKeyInput('');
        alert("Restoration complete. Welcome back.");
      }
    } catch (e) {
      alert("Invalid Cloud Key. Please check the string and try again.");
    }
  };

  const handleGenerateMagicAvatar = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = "A 3D Disney-Pixar style character render of a young person, creative, academic, expressive eyes, studio lighting, soft background, high quality.";
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setTempProfile(prev => ({ ...prev, customUrl: `data:image/png;base64,${part.inlineData.data}` }));
          break;
        }
      }
    } catch (error) {
      alert("Magic generation failed. Please try a standard avatar.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempProfile(prev => ({ ...prev, customUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const applyChanges = () => {
    if (user) {
      onUpdateUser({ 
        ...user, 
        name: tempProfile.name,
        age: tempProfile.age,
        education: tempProfile.education,
        photoURL: currentPreviewUrl 
      });
      setIsPickerOpen(false);
    }
  };

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card backdrop-blur-md border-b border-theme flex items-center px-4 justify-between z-50">
        <h1 className="font-black text-xl tracking-tighter text-indigo-600 uppercase">Zenith</h1>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 text-theme-secondary hover:bg-slate-50 rounded-xl transition-transform active:scale-90">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-card border-r border-theme z-50 transition-transform duration-300
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col p-6 overflow-hidden">
          <div className="mb-10 flex items-center gap-3 shrink-0 group">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12">
                <Sparkles size={20} />
             </div>
             <h1 className="font-black text-2xl tracking-tighter text-theme uppercase">Zenith</h1>
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
                  <Cloud size={16} className="text-indigo-500" /> Cloud Sync
                </button>
                <button onClick={() => { setIsPickerOpen(true); setPickerTab('theme'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-indigo-50 text-theme-secondary font-bold text-xs transition-all">
                  <Monitor size={16} className="text-indigo-500" /> Interface Theme
                </button>
                <button onClick={() => { setIsPickerOpen(true); setPickerTab('manual'); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-indigo-50 text-theme-secondary font-bold text-xs transition-all">
                  <Book size={16} className="text-indigo-500" /> Operating Manual
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
                 <div className="p-4 bg-indigo-600 text-white rounded-2xl animate-float">
                   {pickerTab === 'sync' ? <Cloud size={24} /> : <Wand2 size={24} />}
                 </div>
                 <div>
                   <h2 className="text-3xl font-black text-theme tracking-tight">
                     {pickerTab === 'profile' ? 'Identity Studio' : pickerTab === 'manual' ? 'Operating Manual' : pickerTab === 'theme' ? 'Interface Theme' : pickerTab === 'sync' ? 'Cloud Sync & Data' : 'The Creator'}
                   </h2>
                   <p className="text-xs font-bold text-theme-secondary uppercase tracking-widest mt-1">Zenith Intelligence Portal</p>
                 </div>
               </div>
               <button onClick={() => setIsPickerOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl text-theme-secondary transition-transform active:scale-90"><X size={24} /></button>
            </div>

            <div className="flex gap-4 mb-8 shrink-0 border-b border-theme pb-4 overflow-x-auto no-scrollbar pr-4">
               {[
                 { id: 'profile', label: 'Profile', icon: <UserIcon size={16} /> },
                 { id: 'sync', label: 'Cloud Sync', icon: <Cloud size={16} /> },
                 { id: 'theme', label: 'Theme', icon: <Monitor size={16} /> },
                 { id: 'manual', label: 'Manual', icon: <Book size={16} /> },
                 { id: 'about', label: 'Author', icon: <Info size={16} /> }
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
                       <div className="w-48 h-48 bg-white rounded-3xl shadow-2xl border-4 border-white mb-6 overflow-hidden relative group">
                         {isGenerating && (
                           <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-sm">
                             <Loader2 className="animate-spin text-indigo-600" size={40} />
                           </div>
                         )}
                         <img src={currentPreviewUrl} className="w-full h-full object-cover" />
                       </div>
                       <div className="w-full space-y-3">
                         <button onClick={handleGenerateMagicAvatar} disabled={isGenerating} className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                           <Sparkles size={16} /> Magic Gen Avatar
                         </button>
                         <button onClick={() => fileInputRef.current?.click()} className="w-full bg-white text-slate-700 border border-slate-200 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                           <Upload size={16} /> Import Image
                         </button>
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                       </div>
                    </div>
                    <div className="space-y-4">
                      <input className="w-full bg-slate-50 border border-theme rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white" placeholder="Full Name" value={tempProfile.name} onChange={e => setTempProfile({...tempProfile, name: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4">
                        <input type="number" className="w-full bg-slate-50 border border-theme rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 outline-none" placeholder="Age" value={tempProfile.age} onChange={e => setTempProfile({...tempProfile, age: parseInt(e.target.value) || 0})} />
                        <input className="w-full bg-slate-50 border border-theme rounded-2xl px-4 py-4 text-sm font-bold text-slate-700 outline-none" placeholder="Level" value={tempProfile.education} onChange={e => setTempProfile({...tempProfile, education: e.target.value})} />
                      </div>
                    </div>
                    <button onClick={applyChanges} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm transition-all hover:bg-indigo-600 shadow-xl">Save Identity</button>
                  </div>
                  <div className="lg:col-span-8 overflow-y-auto custom-scrollbar pr-2 bg-slate-50 rounded-[40px] p-8 border border-theme shadow-inner">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                      {AVATAR_SEEDS.map((seed, idx) => (
                        <button key={idx} onClick={() => setTempProfile({...tempProfile, seed, customUrl: ''})} className={`aspect-square p-2 rounded-2xl border-2 transition-all ${tempProfile.seed === seed && !tempProfile.customUrl.includes('data:image') ? 'border-indigo-600 bg-white ring-4 ring-indigo-50 shadow-md' : 'border-transparent bg-white/50 hover:bg-white hover:border-indigo-200'}`}>
                          <img src={getFullAvatarUrl(seed, tempProfile.expression)} className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : pickerTab === 'sync' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 py-4 space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-slate-900 rounded-[48px] p-10 text-white relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-bl-[100px] -z-0 pointer-events-none group-hover:scale-125 transition-transform" />
                         <div className="relative z-10 flex flex-col h-full justify-between min-h-[300px]">
                            <div>
                               <div className="p-4 bg-white/10 rounded-3xl w-fit mb-6 backdrop-blur-md">
                                  <Cloud size={32} className="text-indigo-400" />
                               </div>
                               <h3 className="text-3xl font-black tracking-tighter">Zenith Cloud</h3>
                               <p className="text-slate-400 font-medium mt-2 leading-relaxed">Simulate a neural uplink to secure your data in the academic cloud. Merges local state with remote backup.</p>
                            </div>
                            
                            <div className="space-y-4">
                               {syncMessage && (
                                 <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 animate-in slide-in-from-bottom-2">
                                    {syncMessage}
                                 </div>
                               )}
                               <button onClick={handleSync} disabled={isSyncing} className="w-full bg-white text-slate-900 py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-400 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                                  {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <Zap size={16} />}
                                  {isSyncing ? 'Establishing Uplink...' : 'Synchronize Now'}
                               </button>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="p-8 bg-slate-50 border border-theme rounded-[40px] space-y-6">
                            <h4 className="text-xs font-black text-theme-secondary uppercase tracking-[0.3em] flex items-center gap-2">
                               <Shield size={14} /> Vault Portability
                            </h4>
                            <div className="space-y-4">
                               <button onClick={exportData} className="w-full flex items-center justify-between p-6 bg-white border border-theme rounded-3xl hover:border-indigo-500 transition-all group">
                                  <div className="flex items-center gap-4">
                                     <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><Download size={20} /></div>
                                     <div className="text-left"><p className="text-sm font-black text-slate-900">Export Backup</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Local JSON File</p></div>
                                  </div>
                                  <ChevronUp size={20} className="rotate-90 text-slate-300" />
                               </button>
                               <button onClick={getCloudKey} className="w-full flex items-center justify-between p-6 bg-white border border-theme rounded-3xl hover:border-indigo-500 transition-all group">
                                  <div className="flex items-center gap-4">
                                     <div className="p-3 bg-slate-900 text-white rounded-2xl group-hover:scale-110 transition-transform"><Key size={20} /></div>
                                     <div className="text-left"><p className="text-sm font-black text-slate-900">Generate Cloud Key</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Clipboard Base64</p></div>
                                  </div>
                                  <ChevronUp size={20} className="rotate-90 text-slate-300" />
                               </button>
                            </div>
                         </div>

                         <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[40px] space-y-6">
                            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                               <Target size={14} /> Device Recovery
                            </h4>
                            <div className="relative">
                               <input 
                                  value={cloudKeyInput}
                                  onChange={e => setCloudKeyInput(e.target.value)}
                                  className="w-full bg-white border border-indigo-200 rounded-3xl px-6 py-5 pr-32 text-[10px] font-bold text-indigo-900 placeholder:text-indigo-200 outline-none focus:ring-4 focus:ring-indigo-100 transition-all" 
                                  placeholder="Paste Cloud Key here..." 
                               />
                               <button onClick={restoreFromKey} className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95">Restore</button>
                            </div>
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
              ) : pickerTab === 'manual' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 bg-slate-50 rounded-[32px] border border-theme space-y-4">
                         <h4 className="text-lg font-black text-theme flex items-center gap-3"><Cloud size={20} className="text-indigo-600" /> Hybrid Sync</h4>
                         <p className="text-sm text-theme-secondary leading-relaxed font-medium">Zenith uses a <b>Local-First</b> architecture. Your data stays on your device for speed and privacy, but can be synced to our simulated cloud or exported via <b>Cloud Keys</b> for seamless mobility.</p>
                      </div>
                      <div className="p-8 bg-slate-50 rounded-[32px] border border-theme space-y-4">
                         <h4 className="text-lg font-black text-theme flex items-center gap-3"><Zap size={20} className="text-indigo-600" /> Spaced Repetition</h4>
                         <p className="text-sm text-theme-secondary leading-relaxed font-medium">The <b>Revision Lab</b> schedules reminders using the scientific 1-3-7-14-30 day algorithm. Level up topics to extend retention windows indefinitely.</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-4 text-center">
                   <div className="space-y-4 max-w-2xl px-6">
                      <h3 className="text-6xl font-black text-theme tracking-tighter leading-tight">Hasib Chowdhury</h3>
                      <p className="text-indigo-600 font-black text-sm uppercase tracking-[0.5em]">Developer & Aesthetic Visionary</p>
                      <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-violet-500 mx-auto rounded-full my-6" />
                      <p className="text-xl text-theme-secondary font-medium italic">"Zenith is a personal laboratory for growth. We merge AI with high-end interfaces to make studying actually enjoyable."</p>
                      <div className="flex justify-center items-center gap-10 pt-10">
                         <a href="https://www.instagram.com/drip.hasib/" target="_blank" className="p-4 bg-white border border-theme rounded-3xl text-slate-400 hover:text-indigo-500 hover:scale-110 transition-all"><Instagram size={24} /></a>
                         <a href="https://www.facebook.com/hasib.chowdhury.355138/" target="_blank" className="p-4 bg-white border border-theme rounded-3xl text-slate-400 hover:text-indigo-500 hover:scale-110 transition-all"><Facebook size={24} /></a>
                         <a href="https://github.com" target="_blank" className="p-4 bg-white border border-theme rounded-3xl text-slate-400 hover:text-indigo-500 hover:scale-110 transition-all"><Github size={24} /></a>
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
