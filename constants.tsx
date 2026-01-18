
import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  RotateCcw, 
  Timer, 
  Calendar, 
  Trophy,
  PlayCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  TrendingUp,
  BrainCircuit,
  Smile,
  Zap,
  Laugh,
  Frown,
  Angry,
  CalendarCheck
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
  { id: 'exams', label: 'Exams', icon: <CalendarCheck size={20} /> },
];

export const ICONS = {
  Plus: <Plus size={18} />,
  Trash: <Trash2 size={18} />,
  Check: <CheckCircle2 size={18} />,
  Clock: <Clock size={18} />,
  Trend: <TrendingUp size={18} />,
  AI: <BrainCircuit size={18} />,
};

export const AVATAR_SEEDS = Array.from({ length: 24 }, (_, i) => `ZenithUser_${i + 1}`);

export const EXPRESSIONS = [
  { id: 'smiling', label: 'Serene', icon: <Smile size={16} />, params: 'eyes=happy&mouth=smile' },
  { id: 'confident', label: 'Focused', icon: <Zap size={16} />, params: 'eyes=squint&mouth=serious' },
  { id: 'funny', label: 'Energetic', icon: <Laugh size={16} />, params: 'eyes=winkWacky&mouth=tongue' },
  { id: 'nervous', label: 'Analytical', icon: <Frown size={16} />, params: 'eyes=close&mouth=concerned' },
  { id: 'mad', label: 'Intense', icon: <Angry size={16} />, params: 'eyes=angry&mouth=grimace' },
];

export const getAvatarUrl = (seed: string, expressionId: string) => {
  const expr = EXPRESSIONS.find(e => e.id === expressionId) || EXPRESSIONS[0];
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&${expr.params}`;
};
