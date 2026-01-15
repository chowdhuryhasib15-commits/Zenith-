
import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  RotateCcw, 
  Timer, 
  Calendar, 
  BarChart3,
  PlayCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';

export const COLORS = [
  '#6366f1', // Indigo
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b', // Slate
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'subjects', label: 'Subjects', icon: <BookOpen size={20} /> },
  { id: 'revision', label: 'Revision', icon: <RotateCcw size={20} /> },
  { id: 'courses', label: 'Courses', icon: <PlayCircle size={20} /> },
  { id: 'pomodoro', label: 'Pomodoro', icon: <Timer size={20} /> },
  { id: 'goals', label: 'Goals', icon: <Calendar size={20} /> },
  { id: 'results', label: 'Results', icon: <BarChart3 size={20} /> },
];

export const ICONS = {
  Plus: <Plus size={18} />,
  Trash: <Trash2 size={18} />,
  Check: <CheckCircle2 size={18} />,
  Clock: <Clock size={18} />,
  Trend: <TrendingUp size={18} />,
  AI: <BrainCircuit size={18} />,
};
