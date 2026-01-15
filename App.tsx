
import React, { useState, useEffect } from 'react';
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
    if (state.theme !== 'light') {
      body.classList.add(`theme-${state.theme}`);
    }
  }, [state]);

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, user }));
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, user: undefined }));
  };

  const updateUser = (updatedUser: User) => {
    setState(prev => ({ ...prev, user: updatedUser }));
  };

  const updateTheme = (theme: AppTheme) => setState(prev => ({ ...prev, theme }));

  const updateSubjects = (subjects: Subject[]) => setState(prev => ({ ...prev, subjects }));
  const addGoal = (goal: Goal) => setState(prev => ({ ...prev, goals: [...prev.goals, goal] }));
  
  const toggleGoal = (id: string, dateStr?: string) => setState(prev => ({
    ...prev,
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

  const deleteGoal = (id: string) => setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  const addResult = (result: ExamResult) => setState(prev => ({ ...prev, results: [...prev.results, result] }));
  const deleteResult = (id: string) => setState(prev => ({ ...prev, results: prev.results.filter(r => r.id !== id) }));
  const logPomodoro = (log: PomodoroLog) => setState(prev => ({ ...prev, pomodoroLogs: [...prev.pomodoroLogs, log] }));
  const setSyllabusDeadline = (date: string) => setState(prev => ({ ...prev, syllabusDeadline: date }));
  
  const addCourse = (course: Course) => setState(prev => ({ ...prev, courses: [...prev.courses, course] }));
  const deleteCourse = (id: string) => setState(prev => ({ ...prev, courses: prev.courses.filter(c => c.id !== id) }));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard state={state} onNavigate={setActiveTab} onUpdateDeadline={setSyllabusDeadline} />;
      case 'subjects': return <SubjectsPage subjects={state.subjects} setSubjects={updateSubjects} />;
      case 'revision': return <RevisionPage subjects={state.subjects} setSubjects={updateSubjects} />;
      case 'courses': return <CoursesPage courses={state.courses} subjects={state.subjects} onAdd={addCourse} onDelete={deleteCourse} />;
      case 'pomodoro': return <PomodoroPage subjects={state.subjects} onComplete={logPomodoro} logs={state.pomodoroLogs} />;
      case 'goals': return <GoalsPage goals={state.goals} onAdd={addGoal} onToggle={toggleGoal} onDelete={deleteGoal} />;
      case 'results': return <ResultsPage results={state.results} subjects={state.subjects} onAdd={addResult} onDelete={deleteResult} />;
      default: return <Dashboard state={state} onNavigate={setActiveTab} onUpdateDeadline={setSyllabusDeadline} />;
    }
  };

  if (!state.user) {
    return <AuthOverlay onLogin={handleLogin} />;
  }

  return (
    <div className={`flex min-h-screen overflow-hidden transition-colors duration-300`}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={state.user} 
        onLogout={handleLogout} 
        onUpdateUser={updateUser}
        theme={state.theme}
        onUpdateTheme={updateTheme}
      />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 overflow-y-auto max-h-screen custom-scrollbar relative">
        <div key={activeTab} className="page-transition min-h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
