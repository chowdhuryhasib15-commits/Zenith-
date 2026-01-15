
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { 
  Sparkles, ShieldCheck, Globe, 
  UserCircle, GraduationCap, Calendar, 
  Mail, ArrowRight, UserPlus, LogIn,
  Fingerprint, Loader2, Settings, X, AlertTriangle, Key, ExternalLink
} from 'lucide-react';

interface AuthOverlayProps {
  onLogin: (user: User) => void;
}

const REGISTERED_USERS_KEY = 'zenith_registered_users';
const SAVED_CLIENT_ID_KEY = 'zenith_google_client_id';

// Default Client ID from your screenshot
const DEFAULT_CLIENT_ID = "293292575999-tt5cvcavbf1cs2ehe0r7n4o2bkg6rp5p.apps.googleusercontent.com";

const AuthOverlay: React.FC<AuthOverlayProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [isAuthenticating, setIsAuthenticating] = useState<'email' | 'google' | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [clientId, setClientId] = useState(() => localStorage.getItem(SAVED_CLIENT_ID_KEY) || DEFAULT_CLIENT_ID);
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    education: '',
    email: ''
  });

  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeGoogle = () => {
      const g = (window as any).google;
      if (typeof g !== 'undefined' && g.accounts && googleButtonRef.current && clientId) {
        try {
          // Clear previous button content if re-initializing
          if (googleButtonRef.current) googleButtonRef.current.innerHTML = '';
          
          g.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          g.accounts.id.renderButton(googleButtonRef.current, {
            type: 'standard',
            shape: 'pill',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            width: 320,
          });
        } catch (err) {
          console.error("Google GSI Init Error:", err);
        }
      } else if (!clientId) {
        console.warn("No Google Client ID configured.");
      } else {
        setTimeout(initializeGoogle, 100);
      }
    };

    initializeGoogle();
  }, [mode, clientId]);

  const saveClientId = (id: string) => {
    const cleanId = id.trim();
    setClientId(cleanId);
    localStorage.setItem(SAVED_CLIENT_ID_KEY, cleanId);
    setShowConfig(false);
    // Give local storage a moment to settle, then reload
    setTimeout(() => window.location.reload(), 100);
  };

  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("JWT Decode Error", e);
      return null;
    }
  };

  const handleGoogleCredentialResponse = (response: any) => {
    setIsAuthenticating('google');
    const payload = decodeJwt(response.credential);
    
    if (payload) {
      setTimeout(() => {
        const users = getRegisteredUsers();
        const existingUser = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());

        if (existingUser) {
          onLogin(existingUser);
        } else {
          const newUser: User = {
            id: 'google-' + payload.sub,
            name: payload.name,
            email: payload.email,
            age: parseInt(formData.age) || 20,
            education: formData.education || 'University Student',
            photoURL: payload.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.name}`,
            joinedAt: new Date().toISOString()
          };
          saveUser(newUser);
          onLogin(newUser);
        }
        setIsAuthenticating(null);
      }, 1000);
    } else {
      setIsAuthenticating(null);
      alert("Google Authentication failed. Please verify that your email is added as a 'Test User' in the Google Cloud Console.");
    }
  };

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

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse opacity-50" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[80%] bg-violet-600/20 blur-[120px] rounded-full animate-pulse opacity-50" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center gap-12 lg:gap-24 animate-in fade-in zoom-in-95 duration-1000">
        
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

        <div className="w-full max-w-md bg-white p-8 lg:p-12 rounded-[56px] shadow-2xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />
          
          <button 
            onClick={() => setShowConfig(true)}
            className="absolute top-8 right-8 p-2 text-slate-300 hover:text-indigo-600 transition-colors"
            title="Configure Google Auth"
          >
            <Settings size={20} />
          </button>

          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">
              {mode === 'signup' ? 'Get Started' : 'Welcome Back'}
            </h2>
            <p className="text-base text-slate-500 font-medium mt-2">
              Join thousands of high-achievers today.
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative group w-full flex flex-col items-center min-h-[50px] justify-center">
              {isAuthenticating === 'google' && (
                <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center rounded-[32px] backdrop-blur-sm">
                   <Loader2 className="animate-spin text-indigo-600" size={24} />
                </div>
              )}
              
              {clientId ? (
                <div ref={googleButtonRef} className="w-full flex justify-center" />
              ) : (
                <button 
                  onClick={() => setShowConfig(true)}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all group"
                >
                  <Key size={18} className="group-hover:rotate-12 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Setup Google Client ID</span>
                </button>
              )}
              
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4">
                Secure Cloud Authentication
              </p>
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[12px] font-black text-slate-300 uppercase tracking-widest">or email login</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

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
      </div>

      {/* Configuration Portal Overlay */}
      {showConfig && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[48px] w-full max-w-2xl p-12 shadow-2xl relative animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
              <button onClick={() => setShowConfig(false)} className="absolute top-10 right-10 p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-5 mb-10 shrink-0">
                <div className="p-4 bg-indigo-100 text-indigo-600 rounded-3xl">
                  <Key size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">Auth Portal</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Google Console Integration</p>
                </div>
              </div>

              <div className="space-y-6 overflow-y-auto custom-scrollbar pr-4 pb-4">
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex flex-col gap-4">
                   <div className="flex items-start gap-3">
                     <AlertTriangle className="text-blue-500 shrink-0 mt-1" size={20} />
                     <div className="space-y-2">
                       <p className="text-sm font-black text-blue-900 uppercase tracking-wide">OAuth Troubleshooting Checklist</p>
                       <ul className="text-xs font-medium text-blue-700 space-y-2 list-disc ml-4">
                         <li>Verify <b>Authorized JavaScript Origins</b> includes this current URL.</li>
                         <li>Add your Gmail address to <b>Test Users</b> in the "OAuth consent screen" tab.</li>
                         <li>Ensure you are using the correct <b>Client ID</b> (Ends in <code>.apps.googleusercontent.com</code>).</li>
                       </ul>
                     </div>
                   </div>
                   <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                   >
                     Open Google Console <ExternalLink size={12} />
                   </a>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Current OAuth Client ID</label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-[10px] text-slate-700 shadow-inner h-24 resize-none"
                    placeholder="Enter Client ID (Ends in .apps.googleusercontent.com)"
                    defaultValue={clientId}
                    id="client-id-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                   <button 
                    onClick={() => saveClientId((document.getElementById('client-id-input') as HTMLTextAreaElement).value)}
                    className="bg-indigo-600 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                   >
                     Update Identity
                   </button>
                   <button 
                    onClick={() => {
                      localStorage.removeItem(SAVED_CLIENT_ID_KEY);
                      window.location.reload();
                    }}
                    className="bg-slate-100 text-slate-400 py-6 rounded-[32px] font-black text-xs uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all"
                   >
                     Reset to Default
                   </button>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AuthOverlay;
