
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
  revisions: number; // Count of revisions done
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

export interface ExamResult {
  id: string;
  subjectId: string;
  type: 'Quiz' | 'Midterm' | 'Final' | 'Assignment';
  totalMarks: number;
  obtainedMarks: number;
  date: string;
}

export interface PomodoroLog {
  id: string;
  subjectId: string;
  duration: number;
  timestamp: string;
}

export interface AppState {
  user?: User;
  subjects: Subject[];
  goals: Goal[];
  results: ExamResult[];
  pomodoroLogs: PomodoroLog[];
  courses: Course[];
  theme: AppTheme;
  syllabusDeadline?: string;
  syncStatus: SyncStatus;
  lastSyncedAt?: string;
}
