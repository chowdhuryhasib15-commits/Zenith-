
export interface User {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  joinedAt: string;
  age?: number;
  education?: string;
}

export interface Chapter {
  id: string;
  name: string;
  isCompleted: boolean;
  completedAt?: string | undefined;
  lastRevisedAt?: string | undefined;
  revisions: number; 
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  chapters: Chapter[];
}

export interface Course {
  id: string;
  title: string;
  url: string;
  subjectId: string;
  topic?: string;
  addedAt: string;
}

export type GoalCategory = 'Study' | 'Personal' | 'Project' | 'Health';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';
export type AppTheme = 'light' | 'dark' | 'obsidian' | 'rose' | 'ocean';
export type SyncStatus = 'synced' | 'local-only' | 'syncing' | 'error';

export interface Goal {
  id: string;
  text: string;
  date: string;
  isDone: boolean;
  category: GoalCategory;
  recurrence: RecurrenceType;
  completedDates?: string[];
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  date: string;
  priority: 'High' | 'Medium' | 'Low';
  type: string; // Custom string for categories like "Semester Final", "Mock", etc.
  isCompleted: boolean; // Marked as taken
  isGraded: boolean; // Marks have been entered
  totalMarks?: number;
  obtainedMarks?: number;
}

export interface PomodoroLog {
  id: string;
  subjectId: string;
  duration: number;
  timestamp: string;
}

export interface StudyTask {
  id: string;
  task: string;
  priority: 'Critical' | 'Focus' | 'Routine';
  estimatedTime: string;
}

export interface GardenObjective {
  id: string;
  label: string;
}

export interface AppState {
  user?: User;
  subjects: Subject[];
  goals: Goal[];
  exams: Exam[];
  pomodoroLogs: PomodoroLog[];
  courses: Course[];
  theme: AppTheme;
  syllabusDeadline?: string;
  syncStatus: SyncStatus;
  lastSyncedAt?: string;
  currentStudyPlan?: StudyTask[];
  customExamTypes: string[]; 
  // Garden State
  dailyFocusGoal?: string;
  goalLastUpdated?: string;
  hasAchievedGoalToday: boolean;
  gardenStreak: number;
  gardenObjectives: GardenObjective[];
}
