export type HabitCategory = 'health' | 'work' | 'mindfulness' | 'fitness' | 'learning' | 'personal';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: HabitCategory;
  frequency: 'daily' | 'weekdays' | 'custom';
  customDays?: number[]; // 0 = Sun, 1 = Mon, ... 6 = Sat
  targetType: 'boolean' | 'number';
  targetValue: number; // 1 for boolean, or number for minutes/count
  unit?: string; // "mins", "pages", "glasses", "km"
  color: string; // Tailwind color accent
  iconName: string; // Lucide icon identifier
  createdAt: string;
  archived?: boolean;
}

export interface DayLog {
  completed: boolean;
  value?: number;
  note?: string;
}

// Map of date string "YYYY-MM-DD" to map of habitId -> DayLog
export type HabitLogsMap = Record<string, Record<string, DayLog>>;

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: HabitCategory;
  linkedHabitId?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: 'in_progress' | 'completed' | 'behind';
  milestones: GoalMilestone[];
  createdAt: string;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  dayLabel: string; // Mon, Tue, etc.
  dayNumber: number; // 14, 15, etc.
  scheduledCount: number;
  completedCount: number;
  percentage: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface WeeklyProductivityReport {
  weekStart: string;
  weekEnd: string;
  totalScheduled: number;
  totalCompleted: number;
  completionRate: number; // 0 - 100
  productivityScore: number; // 0 - 100
  scoreDelta: number; // diff from previous week
  perfectDays: number;
  peakDay: { dayName: string; rate: number } | null;
  slumpDay: { dayName: string; rate: number } | null;
  dailyStats: DailyStat[];
  categoryBreakdown: {
    category: HabitCategory;
    scheduled: number;
    completed: number;
    rate: number;
  }[];
  topHabits: {
    habit: Habit;
    completedDays: number;
    streak: number;
  }[];
  needsAttentionHabits: {
    habit: Habit;
    completedDays: number;
    rate: number;
  }[];
  insights: {
    id: string;
    type: 'positive' | 'warning' | 'tip';
    title: string;
    message: string;
  }[];
}
