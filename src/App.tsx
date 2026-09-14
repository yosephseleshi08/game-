import { useState, useMemo, useEffect } from 'react';
import { Habit, Goal, HabitLogsMap } from './types';
import {
  loadHabits,
  saveHabits,
  loadLogs,
  saveLogs,
  loadGoals,
  saveGoals,
  resetAllToSampleData,
} from './utils/storage';
import { formatDateKey, getWeekDates, isSameDay } from './utils/dateUtils';
import { generateWeeklyReport } from './utils/analytics';
import { Header } from './components/Header';
import { WeeklyScoreCard } from './components/WeeklyScoreCard';
import { HabitTracker } from './components/HabitTracker';
import { HabitModal } from './components/HabitModal';
import { ProductivityInsights } from './components/ProductivityInsights';
import { GoalSetting } from './components/GoalSetting';
import { GoalModal } from './components/GoalModal';

export default function App() {
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits());
  const [logs, setLogs] = useState<HabitLogsMap>(() => loadLogs());
  const [goals, setGoals] = useState<Goal[]>(() => loadGoals());
  
  const [currentAnchorDate, setCurrentAnchorDate] = useState<Date>(() => new Date());
  const [activeTab, setActiveTab] = useState<'tracker' | 'insights' | 'goals'>('tracker');

  // Modal states
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Sync to local storage on changes
  useEffect(() => {
    saveHabits(habits);
  }, [habits]);

  useEffect(() => {
    saveLogs(logs);
  }, [logs]);

  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  // Week computation
  const weekDates = useMemo(() => getWeekDates(currentAnchorDate), [currentAnchorDate]);
  const currentWeekStart = weekDates[0];
  const currentWeekEnd = weekDates[6];

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const isCurrentWeek = useMemo(() => {
    return weekDates.some((d) => isSameDay(d, today));
  }, [weekDates, today]);

  // Weekly Productivity Report
  const weeklyReport = useMemo(() => {
    return generateWeeklyReport(habits, logs, currentAnchorDate);
  }, [habits, logs, currentAnchorDate]);

  // Handlers for Week Navigation
  const handlePrevWeek = () => {
    setCurrentAnchorDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentAnchorDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };

  const handleJumpToToday = () => {
    setCurrentAnchorDate(new Date());
  };

  // Habit Logging & Auto-sync with linked Goals
  const handleToggleHabit = (habitId: string, date: Date) => {
    const dateKey = formatDateKey(date);
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    setLogs((prev) => {
      const dayLogs = prev[dateKey] || {};
      const currentLog = dayLogs[habitId];
      const nextCompleted = !currentLog?.completed;
      const nextValue = nextCompleted ? habit.targetValue : 0;

      const updated = {
        ...prev,
        [dateKey]: {
          ...dayLogs,
          [habitId]: {
            completed: nextCompleted,
            value: nextValue,
          },
        },
      };

      // Auto update linked goals if applicable
      const linkedGoals = goals.filter((g) => g.linkedHabitId === habitId);
      if (linkedGoals.length > 0) {
        setGoals((prevGoals) =>
          prevGoals.map((g) => {
            if (g.linkedHabitId === habitId) {
              const delta = nextCompleted ? habit.targetValue : -habit.targetValue;
              const nextVal = Math.max(0, g.currentValue + delta);
              const isFinished = nextVal >= g.targetValue;
              return {
                ...g,
                currentValue: nextVal,
                status: isFinished ? 'completed' : g.status,
              };
            }
            return g;
          })
        );
      }

      return updated;
    });
  };

  const handleUpdateHabitValue = (habitId: string, date: Date, value: number) => {
    const dateKey = formatDateKey(date);
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    setLogs((prev) => {
      const dayLogs = prev[dateKey] || {};
      const oldVal = dayLogs[habitId]?.value ?? 0;
      const isCompleted = value >= habit.targetValue;

      const updated = {
        ...prev,
        [dateKey]: {
          ...dayLogs,
          [habitId]: {
            completed: isCompleted,
            value,
          },
        },
      };

      // Auto update linked goal
      const diff = value - oldVal;
      if (diff !== 0) {
        setGoals((prevGoals) =>
          prevGoals.map((g) => {
            if (g.linkedHabitId === habitId) {
              const nextVal = Math.max(0, g.currentValue + diff);
              const isFinished = nextVal >= g.targetValue;
              return {
                ...g,
                currentValue: nextVal,
                status: isFinished ? 'completed' : g.status,
              };
            }
            return g;
          })
        );
      }

      return updated;
    });
  };

  // Habit CRUD
  const handleSaveHabit = (habitData: Omit<Habit, 'id' | 'createdAt'>) => {
    if (editingHabit) {
      setHabits((prev) =>
        prev.map((h) => (h.id === editingHabit.id ? { ...h, ...habitData } : h))
      );
      setEditingHabit(null);
    } else {
      const newHabit: Habit = {
        ...habitData,
        id: 'h-' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      setHabits((prev) => [newHabit, ...prev]);
    }
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  // Goal CRUD
  const handleSaveGoal = (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    if (editingGoal) {
      setGoals((prev) =>
        prev.map((g) => (g.id === editingGoal.id ? { ...g, ...goalData } : g))
      );
      setEditingGoal(null);
    } else {
      const newGoal: Goal = {
        ...goalData,
        id: 'g-' + Date.now(),
        createdAt: new Date().toISOString(),
      };
      setGoals((prev) => [newGoal, ...prev]);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const updatedMilestones = g.milestones.map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          );
          return { ...g, milestones: updatedMilestones };
        }
        return g;
      })
    );
  };

  const handleUpdateGoalProgress = (goalId: string, delta: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const nextVal = Math.max(0, g.currentValue + delta);
          const isFinished = nextVal >= g.targetValue;
          return {
            ...g,
            currentValue: nextVal,
            status: isFinished ? 'completed' : g.status,
          };
        }
        return g;
      })
    );
  };

  // Reset & Backup Data Management
  const handleResetData = () => {
    if (confirm('Reset all habits, logs, and goals to default realistic sample data?')) {
      const { habits: h, logs: l, goals: g } = resetAllToSampleData();
      setHabits(h);
      setLogs(l);
      setGoals(g);
      setCurrentAnchorDate(new Date());
    }
  };

  const handleExportData = () => {
    const backup = {
      habits,
      logs,
      goals,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-backup-${formatDateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.habits && Array.isArray(parsed.habits)) {
        setHabits(parsed.habits);
      }
      if (parsed.logs) {
        setLogs(parsed.logs);
      }
      if (parsed.goals && Array.isArray(parsed.goals)) {
        setGoals(parsed.goals);
      }
    } catch {
      alert('Failed to parse backup JSON. Please check file format.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      
      {/* Top Application Navigation */}
      <Header
        currentWeekStart={currentWeekStart}
        currentWeekEnd={currentWeekEnd}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onJumpToToday={handleJumpToToday}
        isCurrentWeek={isCurrentWeek}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeHabitCount={habits.filter((h) => !h.archived).length}
        activeGoalCount={goals.filter((g) => g.status !== 'completed').length}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Universal Weekly Scorecard Banner */}
        <WeeklyScoreCard report={weeklyReport} />

        {/* View Switcher Output */}
        {activeTab === 'tracker' && (
          <HabitTracker
            habits={habits}
            logs={logs}
            weekDates={weekDates}
            onToggleHabit={handleToggleHabit}
            onUpdateHabitValue={handleUpdateHabitValue}
            onAddHabit={() => {
              setEditingHabit(null);
              setIsHabitModalOpen(true);
            }}
            onEditHabit={(h) => {
              setEditingHabit(h);
              setIsHabitModalOpen(true);
            }}
            onDeleteHabit={handleDeleteHabit}
          />
        )}

        {activeTab === 'insights' && (
          <ProductivityInsights report={weeklyReport} />
        )}

        {activeTab === 'goals' && (
          <GoalSetting
            goals={goals}
            habits={habits}
            onAddGoal={() => {
              setEditingGoal(null);
              setIsGoalModalOpen(true);
            }}
            onEditGoal={(g) => {
              setEditingGoal(g);
              setIsGoalModalOpen(true);
            }}
            onDeleteGoal={handleDeleteGoal}
            onToggleMilestone={handleToggleMilestone}
            onUpdateProgress={handleUpdateGoalProgress}
          />
        )}

      </main>

      {/* Habit Create / Edit Modal */}
      <HabitModal
        isOpen={isHabitModalOpen}
        onClose={() => {
          setIsHabitModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        initialHabit={editingHabit}
      />

      {/* Goal Create / Edit Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        initialGoal={editingGoal}
        habits={habits}
      />

      {/* Minimalist Professional Footer */}
      <footer className="border-t border-slate-800/60 bg-slate-950/40 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Habit Tracker • Weekly Productivity & Goal Architecture
          </span>
          <span className="text-slate-400">
            "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
          </span>
        </div>
      </footer>

    </div>
  );
}
