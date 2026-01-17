
import React, { useState } from 'react';
import { User } from '../types';
import { 
  ShieldCheck, Globe, 
  ArrowRight, Loader2,
  User as UserIcon, GraduationCap, Check,
  ArrowLeft, Sparkles
} from 'lucide-react';
import { AVATAR_SEEDS, EXPRESSIONS, getAvatarUrl } from '../constants';

interface AuthOverlayProps {
  onLogin: (user: User) => void;
}

const ZenithIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
  <div className={`relative ${className} flex items-center justify-center`}>
    <div className="absolute inset-0 bg-indigo-600/40 blur-[20px] rounded-full scale-150 animate-pulse" />
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full h-full drop-shadow-[0_0_15px_rgba(129,140,248,1)]">
      <path d="M12 3L4 19H20L12 3Z" className="fill-indigo-500/30 stroke-white" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 3L8 19H16L12 3Z" className="fill-indigo-500/50 stroke-white" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 1L13.5 4.5L17 6L13.5 7.5L12 11L10.5 7.5L7 6L10.5 4.5L12 1Z" fill="white" className="animate-pulse" />
    </svg>
  </div>
);

const PersonaCard = ({ profile, isSyncing }: { profile: any, isSyncing: boolean }) => (
  <div className="w-[260px] aspect-square bg-slate-950 rounded-[40px] p-8 shadow-2xl border border-white/10 relative overflow-hidden flex flex-col items-center justify-center animate-in zoom-in duration-700">
    <div className="relative z-10 flex flex-col items-center text-center w-full">
      <div className="w-24 h-24 bg-white/5 rounded-[32px] border border-white/10 overflow-hidden mb-6 relative group shadow-inner">
        <img 
          src={getAvatarUrl(profile.seed, profile.expression)} 
          className={`w-full h-full object-cover transition-all duration-700 ${isSyncing ? 'blur-sm grayscale' : 'blur-0'}`} 
          alt="Persona" 
        />
        {isSyncing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="animate-spin text-white" size={24} />
          </div>
        )}
      </div>
      
      <div className="space-y-1 w-full">
        <h3 className="text-lg font-black text-white tracking-tight truncate px-2">
          {profile.name || 'Citizen Alpha'}
        </h3>
        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.3em] truncate opacity-80">
          {profile.education || 'Awaiting Status'}
        </p>
        <div className="pt-3 border-t border-white/10 mt-3">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
             Age: <span className="text-white">{profile.age}</span>
           </p>
        </div>
      </div>
    </div>
  </div>
);

const AuthOverlay: React.FC<AuthOverlayProps> = ({ onLogin }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    age: 18,
    education: '',
    seed: AVATAR_SEEDS[0],
    expression: EXPRESSIONS[0].id
  });

  const nextStep = () => {
    if (step === 1 && (!profile.name || !profile.education)) {
      alert("Please provide your identity details to initialize.");
      return;
    }
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(2);
      setIsTransitioning(false);
    }, 400);
  };

  const handleCompleteSetup = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      const newUser: User = {
        id: 'zenith-' + Math.random().toString(36).substr(2, 9),
        name: profile.name,
        email: `${profile.name.toLowerCase().replace(/\s/g, '.')}@zenith.local`,
        age: profile.age,
        education: profile.education,
        photoURL: getAvatarUrl(profile.seed, profile.expression),
        joinedAt: new Date().toISOString()
      };
      onLogin(newUser);
      setIsAuthenticating(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex items-center justify-center p-4 lg:p-12 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(99,102,241,0.06)_0%,_transparent_100%)]" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[100px] rounded-full opacity-30" />
      
      <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-stretch gap-8 lg:gap-16 animate-in fade-in zoom-in-95 duration-1000">
        
        {/* High Visibility Branding Column */}
        <div className="hidden lg:flex flex-col justify-center w-full max-w-[260px] space-y-12">
          <ZenithIcon className="w-20 h-20" />
          <div className="space-y-6">
            <h1 className="text-7xl font-black text-white tracking-tighter leading-[0.8] uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              ZENITH<br /><span className="text-indigo-500 text-5xl">STUDIO.</span>
            </h1>
            <p className="text-[11px] text-slate-200 font-black leading-relaxed uppercase tracking-[0.3em] opacity-90 border-l-2 border-indigo-500 pl-4">
              Neural patterns initialized locally.
            </p>
          </div>
          <div className="space-y-4 pt-8 border-t border-white/10">
             <div className="flex items-center gap-4 text-white">
               <ShieldCheck size={22} className="text-emerald-400" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Secured Vault</span>
             </div>
             <div className="flex items-center gap-4 text-white">
               <Globe size={22} className="text-indigo-400" />
               <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Global Sync</span>
             </div>
          </div>
        </div>

        {/* Wizard Card */}
        <div className="flex-1 bg-white rounded-[56px] shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col min-h-0">
          <div className="h-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 shrink-0" />
          
          <div className="p-8 lg:p-14 flex flex-col flex-1 overflow-hidden">
            <div className="flex justify-between items-start mb-8 shrink-0">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em]">Protocol Phase 0{step}</p>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                  {step === 1 ? 'Data Acquisition' : 'Neural Persona'}
                </h2>
              </div>
              <div className="flex gap-2.5 pt-2">
                <div className={`h-2 w-8 rounded-full transition-all duration-500 ${step === 1 ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-100'}`} />
                <div className={`h-2 w-8 rounded-full transition-all duration-500 ${step === 2 ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-100'}`} />
              </div>
            </div>

            <div className={`flex-1 flex flex-col lg:flex-row gap-12 min-h-0 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {step === 1 ? (
                  <div className="space-y-4 py-2">
                    {/* Identity Signature Block */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Identity Signature</label>
                      <div className="relative group">
                        <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                          autoFocus
                          className="w-full bg-slate-50 border border-slate-200 rounded-[20px] pl-16 pr-6 py-3.5 text-base font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-300"
                          placeholder="What is your full name?"
                          value={profile.name}
                          onChange={e => setProfile({...profile, name: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Age and Education - Improved Horizontal Space and Visibility */}
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-12 sm:col-span-4 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Age</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-[20px] px-5 py-3.5 text-base font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm"
                          value={profile.age}
                          onChange={e => setProfile({...profile, age: Number(e.target.value)})}
                        />
                      </div>
                      <div className="col-span-12 sm:col-span-8 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Education Status</label>
                        <div className="relative group">
                          <GraduationCap className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                          <input 
                            className="w-full bg-slate-50 border border-slate-200 rounded-[20px] pl-16 pr-6 py-3.5 text-base font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-300"
                            placeholder="e.g. 12th Grade / HSC"
                            value={profile.education}
                            onChange={e => setProfile({...profile, education: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-5 bg-slate-900 rounded-[32px] text-white flex items-center gap-5 relative overflow-hidden group mt-4 shadow-xl">
                       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-1000"><Sparkles size={48} /></div>
                       <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0 border border-white/10 shadow-xl"><ShieldCheck size={20} /></div>
                       <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                         Identification optimizes the <span className="text-white font-black">Neural Mesh</span> for your study cycles.
                       </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 py-2">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Expression state</label>
                      {/* More organized grid for expressions */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {EXPRESSIONS.map(expr => (
                          <button 
                            key={expr.id}
                            onClick={() => setProfile({...profile, expression: expr.id})}
                            className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border ${profile.expression === expr.id ? 'bg-slate-900 text-white shadow-xl border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-200'}`}
                          >
                            {expr.icon} {expr.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Bio-Avatar Matrix</label>
                      {/* Bigger icons with a scrollable container */}
                      <div className="max-h-56 overflow-y-auto custom-scrollbar pr-2 bg-slate-50/30 rounded-3xl p-3 border border-slate-100">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pb-2">
                          {AVATAR_SEEDS.slice(0, 18).map((seed) => (
                            <button 
                              key={seed}
                              onClick={() => setProfile({...profile, seed})}
                              className={`aspect-square p-2.5 rounded-[28px] border-2 transition-all relative overflow-hidden bg-white ${profile.seed === seed ? 'border-indigo-600 scale-105 z-10 shadow-lg' : 'border-transparent hover:border-slate-200 shadow-sm'}`}
                            >
                              <img 
                                src={getAvatarUrl(seed, profile.expression)} 
                                className="w-full h-full object-contain" 
                                alt="Option" 
                              />
                              {profile.seed === seed && (
                                <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-1.5 shadow-md">
                                  <Check size={10} className="text-white" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Minimal Square Preview card */}
              <div className="hidden lg:flex flex-col items-center justify-center shrink-0 border-l border-slate-50 pl-12">
                 <PersonaCard profile={profile} isSyncing={isAuthenticating} />
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] mt-8">Identity Preview</p>
              </div>
            </div>

            <div className="pt-8 mt-auto shrink-0 flex gap-4">
              {step === 2 && (
                <button 
                  onClick={() => setStep(1)}
                  className="px-8 bg-slate-50 text-slate-400 py-5 rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-100 transition-all active:scale-95 flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              )}
              <button 
                onClick={step === 1 ? nextStep : handleCompleteSetup}
                disabled={isAuthenticating}
                className="flex-1 bg-slate-900 text-white py-5 rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3 group"
              >
                {isAuthenticating ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {step === 1 ? 'Configure Persona' : 'Initiate Session'}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthOverlay;
