import React from 'react';
import * as Icons from 'lucide-react';
import { HabitCategory } from '../types';

interface CategoryIconProps {
  iconName?: string;
  category?: HabitCategory;
  className?: string;
  size?: number;
}

export const CATEGORY_COLORS: Record<HabitCategory, { bg: string; text: string; border: string; accent: string }> = {
  health: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', accent: '#06b6d4' },
  work: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', accent: '#3b82f6' },
  mindfulness: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', accent: '#10b981' },
  fitness: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', accent: '#f59e0b' },
  learning: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', accent: '#8b5cf6' },
  personal: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20', accent: '#ec4899' },
};

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  health: 'Health',
  work: 'Deep Work',
  mindfulness: 'Mindfulness',
  fitness: 'Fitness',
  learning: 'Learning',
  personal: 'Personal',
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName = 'CheckCircle2',
  category = 'personal',
  className = 'w-4 h-4',
  size = 16,
}) => {
  // Safe dynamic resolution from Lucide
  const IconComponent = (Icons as unknown as Record<string, React.ElementType>)[iconName] || Icons.CheckCircle2;

  return <IconComponent className={className} size={size} />;
};
