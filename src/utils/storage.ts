import { Habit, HabitLogsMap, Goal } from '../types';
import { formatDateKey } from './dateUtils';

const HABITS_STORAGE_KEY = 'habit_tracker_habits_v1';
const LOGS_STORAGE_KEY = 'habit_tracker_logs_v1';
const GOALS_STORAGE_KEY = 'habit_tracker_goals_v1';

export function getInitialHabits(): Habit[] {
  return [
    {
      id: 'h-1',
      name: 'Deep Work Sprint',
      description: 'Uninterrupted 90-minute focus block without phone or Slack',
      category: 'work',
      frequency: 'weekdays',
      targetType: 'number',
      targetValue: 90,
      unit: 'min',
      color: '#3b82f6', // blue
      iconName: 'Zap',
      createdAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'h-2',
      name: 'Hydration Target',
      description: 'Drink at least 2.5L of clean water throughout the day',
      category: 'health',
      frequency: 'daily',
      targetType: 'number',
      targetValue: 2.5,
      unit: 'L',
      color: '#06b6d4', // cyan
      iconName: 'Droplets',
      createdAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'h-3',
      name: 'Morning Mindfulness',
      description: '15-minute breathwork & headspace meditation',
      category: 'mindfulness',
      frequency: 'daily',
      targetType: 'number',
      targetValue: 15,
      unit: 'min',
      color: '#10b981', // emerald
      iconName: 'Sparkles',
      createdAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'h-4',
      name: 'Strength & Conditioning',
      description: 'Weightlifting session, calisthenics, or HIIT training',
      category: 'fitness',
      frequency: 'custom',
      customDays: [1, 2, 4, 5, 6], // Mon, Tue, Thu, Fri, Sat
      targetType: 'boolean',
      targetValue: 1,
      unit: 'session',
      color: '#f59e0b', // amber
      iconName: 'Dumbbell',
      createdAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'h-5',
      name: 'Read Non-Fiction',
      description: 'Read 20 pages of business, philosophy, or engineering book',
      category: 'learning',
      frequency: 'daily',
      targetType: 'number',
      targetValue: 20,
      unit: 'pages',
      color: '#8b5cf6', // purple
      iconName: 'BookOpen',
      createdAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'h-6',
      name: 'Evening Reflection & Shutdown',
      description: 'Journal daily wins, review tomorrow\'s schedule, clear inbox',
      category: 'personal',
      frequency: 'weekdays',
      targetType: 'boolean',
      targetValue: 1,
      unit: 'check',
      color: '#ec4899', // pink
      iconName: 'CheckCircle2',
      createdAt: '2026-09-01T08:00:00.000Z',
    },
  ];
}

export function getInitialGoals(): Goal[] {
  return [
    {
      id: 'g-1',
      title: 'Complete 40 Hours of Deep Work',
      description: 'Dedicate quality deep cognitive effort to major Q3 project deliverables.',
      category: 'work',
      linkedHabitId: 'h-1',
      targetValue: 2400, // 40 hours in minutes
      currentValue: 1890,
      unit: 'mins',
      startDate: '2026-09-01',
      targetDate: '2026-09-30',
      status: 'in_progress',
      milestones: [
        { id: 'm-1', title: 'First 10 hours completed', completed: true },
        { id: 'm-2', title: 'Halfway mark (20 hours)', completed: true },
        { id: 'm-3', title: '30-hour milestone', completed: true },
        { id: 'm-4', title: 'Final 40 hours sprint', completed: false },
      ],
      createdAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'g-2',
      title: 'Read 2 Impactful Books (500 Pages)',
      description: 'Finish "Atomic Habits" and "Designing Data-Intensive Applications".',
      category: 'learning',
      linkedHabitId: 'h-5',
      targetValue: 500,
      currentValue: 340,
      unit: 'pages',
      startDate: '2026-09-01',
      targetDate: '2026-09-30',
      status: 'in_progress',
      milestones: [
        { id: 'm-5', title: 'Finish Book 1 (250 pages)', completed: true },
        { id: 'm-6', title: 'Read chapters 1-5 of Book 2', completed: true },
        { id: 'm-7', title: 'Complete Book 2 notes and review', completed: false },
      ],
      createdAt: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'g-3',
      title: 'Hit 85% Weekly Consistency Rate',
      description: 'Achieve at least 85% overall habit completion across all active tracks.',
      category: 'health',
      targetValue: 85,
      currentValue: 88,
      unit: '%',
      startDate: '2026-09-07',
      targetDate: '2026-09-28',
      status: 'completed',
      milestones: [
        { id: 'm-8', title: 'Establish morning routine without skipping', completed: true },
        { id: 'm-9', title: 'Maintain 5 consecutive days of 80%+', completed: true },
        { id: 'm-10', title: 'Hit 85%+ weekly productivity score', completed: true },
      ],
      createdAt: '2026-09-01T08:00:00.000Z',
    },
  ];
}

// Generate realistic seeded logs around today's date for past 21 days
export function getInitialLogs(): HabitLogsMap {
  const logs: HabitLogsMap = {};
  const today = new Date();

  // Populate last 21 days up to today
  for (let offset = -20; offset <= 0; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dateStr = formatDateKey(d);
    const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    logs[dateStr] = {};

    // h-1: Deep Work (weekdays)
    if (!isWeekend) {
      const completed = offset === -3 ? false : Math.random() > 0.12;
      logs[dateStr]['h-1'] = {
        completed,
        value: completed ? (offset % 2 === 0 ? 90 : 120) : 45,
      };
    }

    // h-2: Hydration (daily)
    const h2Done = offset === -5 ? false : Math.random() > 0.15;
    logs[dateStr]['h-2'] = {
      completed: h2Done,
      value: h2Done ? (2.5 + (offset % 3 === 0 ? 0.5 : 0)) : 1.8,
    };

    // h-3: Mindfulness (daily)
    const h3Done = Math.random() > 0.18;
    logs[dateStr]['h-3'] = {
      completed: h3Done,
      value: h3Done ? 15 : 5,
    };

    // h-4: Workout (Mon, Tue, Thu, Fri, Sat)
    if ([1, 2, 4, 5, 6].includes(dayOfWeek)) {
      const h4Done = offset === -1 ? true : Math.random() > 0.22;
      logs[dateStr]['h-4'] = {
        completed: h4Done,
        value: h4Done ? 1 : 0,
      };
    }

    // h-5: Reading (daily)
    const h5Done = offset === -7 ? false : Math.random() > 0.14;
    logs[dateStr]['h-5'] = {
      completed: h5Done,
      value: h5Done ? (20 + (offset % 4 === 0 ? 10 : 0)) : 10,
    };

    // h-6: Reflection (weekdays)
    if (!isWeekend) {
      const h6Done = Math.random() > 0.2;
      logs[dateStr]['h-6'] = {
        completed: h6Done,
        value: h6Done ? 1 : 0,
      };
    }
  }

  return logs;
}

export function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(HABITS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load habits from localStorage', e);
  }
  const initial = getInitialHabits();
  saveHabits(initial);
  return initial;
}

export function saveHabits(habits: Habit[]): void {
  try {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
  } catch (e) {
    console.error('Failed to save habits to localStorage', e);
  }
}

export function loadLogs(): HabitLogsMap {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load logs from localStorage', e);
  }
  const initial = getInitialLogs();
  saveLogs(initial);
  return initial;
}

export function saveLogs(logs: HabitLogsMap): void {
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save logs to localStorage', e);
  }
}

export function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load goals from localStorage', e);
  }
  const initial = getInitialGoals();
  saveGoals(initial);
  return initial;
}

export function saveGoals(goals: Goal[]): void {
  try {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch (e) {
    console.error('Failed to save goals to localStorage', e);
  }
}

export function resetAllToSampleData(): {
  habits: Habit[];
  logs: HabitLogsMap;
  goals: Goal[];
} {
  const habits = getInitialHabits();
  const logs = getInitialLogs();
  const goals = getInitialGoals();
  saveHabits(habits);
  saveLogs(logs);
  saveGoals(goals);
  return { habits, logs, goals };
}
