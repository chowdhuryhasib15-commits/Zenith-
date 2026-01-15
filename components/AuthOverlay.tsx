
import React, { useState } from 'react';
import { User } from '../types';
import { 
  Sparkles, ShieldCheck, Globe, 
  ArrowRight, Fingerprint, Loader2, Key
} from 'lucide-react';

interface AuthOverlayProps {
  onLogin: (user: User) => void;
}

const AuthOverlay: React.FC<AuthOverlayProps> = ({ onLogin }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleGuestLogin = () => {
    setIsAuthenticating(true);
    
    // Simulate local secure session initiation
    setTimeout(() => {
      const guestUser: User = {
        id: 'guest-' + Math.random().toString(36).substr(2, 9),
        name: 'Zenith Guest',
        email: 'guest@zenith.local',
        age: 20,
        education: 'Independent Researcher',
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=ZenithGuest`,
        joinedAt: new Date().toISOString()
      };

      onLogin(guestUser);
      setIsAuthenticating(null as any);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex items-center justify-center p-4 overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse opacity-50" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-violet-600/20 blur-[120px] rounded-full animate-pulse opacity-50" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center gap-12 lg:gap-24 animate-in fade-in zoom-in-95 duration-1000">
        
        {/* Brand/Marketing Side */}
        <div className="hidden lg:flex flex-col flex-1 text-left space-y-8 max-w-lg">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl">
            <Sparkles className="text-indigo-400" size={32} />
          </div>
          <div>
            <h1 className="text-7xl font-black text-white tracking-tighter leading-[0.9] uppercase">
              ZENITH <br />
              <span className="text-indigo-500">STUDIO.</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium mt-6 leading-relaxed">
              Your academic potential, quantified. Experience a new standard of cognitive focus and study management.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-4">
                <Globe size={20} />
              </div>
              <p className="text-white font-bold">Local Sync</p>
              <p className="text-slate-500 text-xs mt-1">Browser-level persistence.</p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-4">
                <ShieldCheck size={20} />
              </div>
              <p className="text-white font-bold">Privacy First</p>
              <p className="text-slate-500 text-xs mt-1">No cloud tracking.</p>
            </div>
          </div>
        </div>

        {/* Action Side */}
        <div className="w-full max-w-md bg-white p-8 lg:p-12 rounded-[56px] shadow-2xl border border-slate-100 relative overflow-hidden">
          {/* Subtle Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />
          
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              Initiate Session
            </h2>
            <p className="text-base text-slate-500 font-medium mt-2">
              Welcome to the private study laboratory.
            </p>
          </div>

          <div className="space-y-8">
            <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                <Key size={32} />
              </div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Guest Access Mode</h3>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                All data is encrypted and stored locally in your browser. No registration required.
              </p>
            </div>

            <button 
              onClick={handleGuestLogin}
              disabled={isAuthenticating}
              className="w-full bg-slate-900 text-white py-6 px-8 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 group shadow-2xl shadow-indigo-100"
            >
              {isAuthenticating ? (
                <Loader2 className="animate-spin text-white" size={24} />
              ) : (
                <>
                  <span className="text-lg tracking-tight uppercase tracking-[0.2em]">Enter Studio</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">System Secure & Local</span>
            </div>
          </div>
        </div>

        {/* Mobile Branding Footer */}
        <div className="lg:hidden text-center space-y-4 pb-8">
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase">ZENITH.</h1>
            <div className="flex justify-center gap-6">
               <ShieldCheck className="text-slate-500" size={24} />
               <Globe className="text-slate-500" size={24} />
               <Fingerprint className="text-slate-500" size={24} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthOverlay;
