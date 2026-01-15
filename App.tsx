
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Subject, Goal, ExamResult, PomodoroLog, User, Course, AppTheme } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SubjectsPage from './pages/SubjectsPage';
import RevisionPage from './pages/RevisionPage';
import PomodoroPage from './pages/PomodoroPage';
import GoalsPage from './pages/GoalsPage';
import ResultsPage from './pages/ResultsPage';
import CoursesPage from './pages/CoursesPage';
import AuthOverlay from './components/AuthOverlay';

const STORAGE_KEY = 'zenith_app_data_v1';

const INITIAL_STATE: AppState = {
  subjects: [],
  goals: [],
  results: [],
  pomodoroLogs: [],
  courses: [],
  theme: 'light',
  syncStatus: 'local-only',
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Apply theme to body
    const body = document.body;
    body.className = body.className.replace(/theme-\w+/, '').trim();
    if (state.theme && state.theme !== 'light') {
      body.classList.add(`theme-${state.theme}`);
    }
  }, [state]);

  const handleLogin = useCallback((user: User) => {
    setState(prev => ({ ...prev, user }));
  }, []);

  const handleLogout = useCallback(() => {
    setState(prev => {
      const newState = { ...prev };
      delete newState.user;
      return newState;
    });
    setActiveTab('dashboard');
  }, []);

  const updateUser = (updatedUser: User) => {
    setState(prev => ({ ...prev, user: updatedUser }));
  };

  const updateTheme = (theme: AppTheme) => setState(prev => ({ ...prev, theme }));

  const updateSubjects = (subjects: Subject[]) => setState(prev => ({ ...prev, subjects, syncStatus: 'local-only' }));
  const addGoal = (goal: Goal) => setState(prev => ({ ...prev, goals: [...prev.goals, goal], syncStatus: 'local-only' }));
  
  const toggleGoal = (id: string, dateStr?: string) => setState(prev => ({
    ...prev,
    syncStatus: 'local-only',
    goals: prev.goals.map(g => {
      if (g.id !== id) return g;
      if (g.recurrence === 'none') return { ...g, isDone: !g.isDone };
      if (!dateStr) return g;
      const currentCompleted = g.completedDates || [];
      const isAlreadyDone = currentCompleted.includes(dateStr);
      return {
        ...g,
        completedDates: isAlreadyDone 
          ? currentCompleted.filter(d => d !== dateStr) 
          : [...currentCompleted, dateStr]
      };
    })
  }));

  const deleteGoal = (id: string) => setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id), syncStatus: 'local-only' }));
  const addResult = (result: ExamResult) => setState(prev => ({ ...prev, results: [...prev.results, result], syncStatus: 'local-only' }));
  const deleteResult = (id: string) => setState(prev => ({ ...prev, results: prev.results.filter(r => r.id !== id), syncStatus: 'local-only' }));
  
  const logPomodoro = (log: PomodoroLog) => setState(prev => ({ 
    ...prev, 
    pomodoroLogs: [...prev.pomodoroLogs, log],
    syncStatus: 'local-only'
  }));

  const setSyllabusDeadline = (date: string) => setState(prev => ({ ...prev, syllabusDeadline: date, syncStatus: 'local-only' }));
  
  const addCourse = (course: Course) => setState(prev => ({ ...prev, courses: [...prev.courses, course], syncStatus: 'local-only' }));
  const deleteCourse = (id: string) => setState(prev => ({ ...prev, courses: prev.courses.filter(c => c.id !== id), syncStatus: 'local-only' }));

  const onSyncStart = () => setState(prev => ({ ...prev, syncStatus: 'syncing' }));
  const onSyncComplete = () => setState(prev => ({ ...prev, syncStatus: 'synced', lastSyncedAt: new Date().toISOString() }));
  
  const onRestore = (newState: AppState) => {
    setState({ ...newState, syncStatus: 'synced', lastSyncedAt: new Date().toISOString() });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard state={state} onNavigate={setActiveTab} onUpdateDeadline={setSyllabusDeadline} />;
      case 'subjects': return <SubjectsPage subjects={state.subjects} setSubjects={updateSubjects} />;
      case 'revision': return <RevisionPage subjects={state.subjects} setSubjects={updateSubjects} />;
      case 'courses': return <CoursesPage courses={state.courses} subjects={state.subjects} onAdd={addCourse} onDelete={deleteCourse} />;
      case 'pomodoro': return <PomodoroPage subjects={state.subjects} onComplete={logPomodoro} logs={state.pomodoroLogs} fullState={state} onRestore={onRestore} />;
      case 'goals': return <GoalsPage goals={state.goals} onAdd={addGoal} onToggle={toggleGoal} onDelete={deleteGoal} />;
      case 'results': return <ResultsPage results={state.results} subjects={state.subjects} onAdd={addResult} onDelete={deleteResult} />;
      default: return <Dashboard state={state} onNavigate={setActiveTab} onUpdateDeadline={setSyllabusDeadline} />;
    }
  };

  if (!state.user) {
    return <AuthOverlay onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen overflow-hidden transition-colors duration-500">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={state.user} 
        onLogout={handleLogout} 
        onUpdateUser={updateUser}
        theme={state.theme}
        onUpdateTheme={updateTheme}
        state={state}
        onSyncStart={onSyncStart}
        onSyncComplete={onSyncComplete}
        onRestore={onRestore}
      />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 overflow-y-auto max-h-screen custom-scrollbar relative bg-transparent">
        <div key={activeTab} className="page-transition min-h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
