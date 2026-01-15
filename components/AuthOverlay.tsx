
import React, { useState } from 'react';
import { User } from '../types';
import { 
  Sparkles, ShieldCheck, Globe, 
  UserCircle, GraduationCap, Calendar, 
  Mail, ArrowRight, UserPlus, LogIn,
  Fingerprint
} from 'lucide-react';

interface AuthOverlayProps {
  onLogin: (user: User) => void;
}

const REGISTERED_USERS_KEY = 'zenith_registered_users';

const AuthOverlay: React.FC<AuthOverlayProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [isAuthenticating, setIsAuthenticating] = useState<'email' | 'google' | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    education: '',
    email: ''
  });

  const getRegisteredUsers = (): User[] => {
    const saved = localStorage.getItem(REGISTERED_USERS_KEY);
    return saved ? JSON.parse(saved) : [];
  };

  const saveUser = (user: User) => {
    const users = getRegisteredUsers();
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([...users, user]));
  };

  const handleEmailAuth = () => {
    if (!formData.email.trim()) return;

    setIsAuthenticating('email');
    
    setTimeout(() => {
      const users = getRegisteredUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());

      if (mode === 'signup') {
        if (!formData.name.trim()) {
          alert("Please enter your name to complete registration.");
          setIsAuthenticating(null);
          return;
        }

        if (existingUser) {
          alert("Account already exists. Try signing in.");
          setMode('signin');
          setIsAuthenticating(null);
          return;
        }

        const newUser: User = {
          id: 'user-' + Math.random().toString(36).substr(2, 9),
          name: formData.name,
          email: formData.email,
          age: parseInt(formData.age) || 18,
          education: formData.education || 'Academic',
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
          joinedAt: new Date().toISOString()
        };

        saveUser(newUser);
        onLogin(newUser);
      } else {
        if (existingUser) {
          onLogin(existingUser);
        } else {
          alert("No account found. Let's create one!");
          setMode('signup');
        }
      }
      setIsAuthenticating(null);
    }, 1200);
  };

  const handleGoogleAuth = () => {
    setIsAuthenticating('google');
    setTimeout(() => {
      const users = getRegisteredUsers();
      const googleEmail = formData.email || "google.pioneer@gmail.com";
      const existingUser = users.find(u => u.email.toLowerCase() === googleEmail.toLowerCase());

      if (existingUser) {
        onLogin(existingUser);
      } else {
        const googleUser: User = {
          id: 'google-' + Math.random().toString(36).substr(2, 9),
          name: "Zenith Voyager",
          email: googleEmail,
          age: 20,
          education: 'University',
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleAuth${Math.random()}`,
          joinedAt: new Date().toISOString()
        };
        saveUser(googleUser);
        onLogin(googleUser);
      }
      setIsAuthenticating(null);
    }, 1500);
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
              <p className="text-white font-bold">Cloud Sync</p>
              <p className="text-slate-500 text-xs mt-1">Across all devices.</p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mb-4">
                <ShieldCheck size={20} />
              </div>
              <p className="text-white font-bold">End-to-End</p>
              <p className="text-slate-500 text-xs mt-1">Privacy by design.</p>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full max-w-md bg-white p-8 lg:p-12 rounded-[56px] shadow-2xl border border-slate-100 relative overflow-hidden">
          {/* Subtle Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />
          
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              {mode === 'signup' ? 'Get Started' : 'Welcome Back'}
            </h2>
            <p className="text-base text-slate-500 font-medium mt-2">
              Join thousands of high-achievers today.
            </p>
          </div>

          <div className="space-y-6">
            {/* Primary Social Auth - Top of Hierarchy */}
            <button 
              onClick={handleGoogleAuth}
              disabled={!!isAuthenticating}
              className="w-full bg-slate-900 text-white py-6 px-8 rounded-[32px] font-black flex items-center justify-center gap-4 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-200 group"
            >
              {isAuthenticating === 'google' ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="tracking-tight text-lg">Continue with Google</span>
                </>
              )}
            </button>

            {/* Visual Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[12px] font-black text-slate-300 uppercase tracking-widest">or email</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* Secondary Email Auth Flow */}
            <div className="space-y-5">
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  type="email"
                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-8 py-6 text-base font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300"
                  placeholder="name@email.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              {/* Only show extra info for Sign Up */}
              <div className={`space-y-5 transition-all duration-500 overflow-hidden ${mode === 'signup' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                <div className="relative group">
                  <UserCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-8 py-6 text-base font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-14 pr-4 py-6 text-base font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300"
                      placeholder="Age"
                      value={formData.age}
                      onChange={e => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                  <div className="relative group">
                    <GraduationCap className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                    <input 
                      className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-14 pr-4 py-6 text-base font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 transition-all placeholder:text-slate-300"
                      placeholder="Level"
                      value={formData.education}
                      onChange={e => setFormData({...formData, education: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleEmailAuth}
                disabled={!!isAuthenticating}
                className="w-full bg-slate-100 text-slate-900 py-6 px-8 rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 group"
              >
                {isAuthenticating === 'email' ? (
                  <div className="w-6 h-6 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-lg tracking-tight uppercase tracking-widest">{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-10 text-center">
            <button 
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-sm font-black text-slate-400 hover:text-indigo-600 transition-colors inline-flex items-center gap-3 group"
            >
              {mode === 'signin' ? "Don't have an account? Sign Up" : "Already a member? Sign In"}
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                {mode === 'signin' ? <UserPlus size={12} /> : <LogIn size={12} />}
              </div>
            </button>
          </div>
        </div>

        {/* Mobile-only Branding Footer */}
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
