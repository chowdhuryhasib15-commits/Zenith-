
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Subject, Goal, PomodoroLog, User, Course, AppTheme, Exam, StudyTask } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SubjectsPage from './pages/SubjectsPage';
import RevisionPage from './pages/RevisionPage';
import PomodoroPage from './pages/PomodoroPage';
import GoalsPage from './pages/GoalsPage';
import ExamsPage from './pages/ExamsPage';
import CoursesPage from './pages/CoursesPage';
import GardenPage from './pages/GardenPage';
import AuthOverlay from './components/AuthOverlay';

const STORAGE_KEY = 'zenith_app_data_v2';

const INITIAL_STATE: AppState = {
  subjects: [],
  goals: [],
  exams: [],
  pomodoroLogs: [],
  courses: [],
  theme: 'light',
  syncStatus: 'local-only',
  customExamTypes: ['Semester Final', 'Midterm', 'Quiz', 'Mock Test'],
  hasAchievedGoalToday: false,
  gardenStreak: 0
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : INITIAL_STATE;
    
    // Check if it's a new day to reset today's goal achievement
    const today = new Date().toISOString().split('T')[0];
    if (parsed.goalLastUpdated !== today) {
      // If they didn't achieve the goal yesterday, wilt/reset streak?
      // For simplicity, we just reset the "achieved today" flag.
      // In a real app, we'd check if yesterday was achieved to maintain streak.
      return { 
        ...parsed, 
        hasAchievedGoalToday: false, 
        goalLastUpdated: today,
        // Optional: If goal wasn't hit yesterday, streak = 0
      };
    }
    return parsed;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  
  const addExam = (exam: Exam) => setState(prev => {
    const updatedTypes = prev.customExamTypes.includes(exam.type) 
      ? prev.customExamTypes 
      : [...prev.customExamTypes, exam.type];
    return { ...prev, exams: [...prev.exams, exam], customExamTypes: updatedTypes, syncStatus: 'local-only' };
  });

  const deleteExam = (id: string) => setState(prev => ({ ...prev, exams: prev.exams.filter(e => e.id !== id), syncStatus: 'local-only' }));
  
  const updateExam = (id: string, updates: Partial<Exam>) => setState(prev => ({
    ...prev,
    exams: prev.exams.map(e => e.id === id ? { ...e, ...updates } : e),
    syncStatus: 'local-only'
  }));

  const logPomodoro = (log: PomodoroLog) => setState(prev => ({ 
    ...prev, 
    pomodoroLogs: [...prev.pomodoroLogs, log],
    syncStatus: 'local-only'
  }));

  const setSyllabusDeadline = (date: string) => setState(prev => ({ ...prev, syllabusDeadline: date, syncStatus: 'local-only' }));
  const addCourse = (course: Course) => setState(prev => ({ ...prev, courses: [...prev.courses, course], syncStatus: 'local-only' }));
  const deleteCourse = (id: string) => setState(prev => ({ ...prev, courses: prev.courses.filter(c => c.id !== id), syncStatus: 'local-only' }));

  const setStudyPlan = (plan: StudyTask[]) => setState(prev => ({ ...prev, currentStudyPlan: plan }));

  const updateGarden = (updates: Partial<AppState>) => setState(prev => ({ ...prev, ...updates }));

  const onRestore = (newState: AppState) => {
    setState({ ...newState, syncStatus: 'synced', lastSyncedAt: new Date().toISOString() });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard state={state} onNavigate={setActiveTab} onUpdateDeadline={setSyllabusDeadline} onSetStudyPlan={setStudyPlan} />;
      case 'subjects': return <SubjectsPage subjects={state.subjects} setSubjects={updateSubjects} />;
      case 'revision': return <RevisionPage subjects={state.subjects} setSubjects={updateSubjects} />;
      case 'courses': return <CoursesPage courses={state.courses} subjects={state.subjects} onAdd={addCourse} onDelete={deleteCourse} />;
      case 'pomodoro': return <PomodoroPage subjects={state.subjects} onComplete={logPomodoro} logs={state.pomodoroLogs} fullState={state} onRestore={onRestore} />;
      case 'goals': return <GoalsPage goals={state.goals} onAdd={addGoal} onToggle={toggleGoal} onDelete={deleteGoal} />;
      case 'exams': return (
        <ExamsPage 
          exams={state.exams} 
          subjects={state.subjects} 
          customTypes={state.customExamTypes}
          onAddExam={addExam} 
          onDeleteExam={deleteExam} 
          onUpdateExam={updateExam}
        />
      );
      case 'garden': return <GardenPage state={state} onUpdate={updateGarden} />;
      default: return <Dashboard state={state} onNavigate={setActiveTab} onUpdateDeadline={setSyllabusDeadline} onSetStudyPlan={setStudyPlan} />;
    }
  };

  if (!state.user) return <AuthOverlay onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen overflow-hidden transition-colors duration-500">
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} user={state.user} onLogout={handleLogout} onUpdateUser={updateUser}
        theme={state.theme} onUpdateTheme={updateTheme} state={state} onSyncStart={() => setState(prev => ({ ...prev, syncStatus: 'syncing' }))}
        onSyncComplete={() => setState(prev => ({ ...prev, syncStatus: 'synced', lastSyncedAt: new Date().toISOString() }))} onRestore={onRestore}
      />
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 overflow-y-auto max-h-screen custom-scrollbar relative bg-transparent">
        <div key={activeTab} className="page-transition min-h-full">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
