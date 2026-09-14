import React, { useState } from 'react';
import {
  Plus,
  Flame,
  Check,
  MoreVertical,
  Edit2,
  Trash2,
  Filter,
  Sparkles,
  Minus,
} from 'lucide-react';
import { Habit, HabitCategory, HabitLogsMap } from '../types';
import { formatDateKey, isHabitScheduledForDay, isSameDay } from '../utils/dateUtils';
import { calculateHabitStreak } from '../utils/analytics';
import { CategoryIcon, CATEGORY_COLORS, CATEGORY_LABELS } from './CategoryIcon';

interface HabitTrackerProps {
  habits: Habit[];
  logs: HabitLogsMap;
  weekDates: Date[];
  onToggleHabit: (habitId: string, date: Date) => void;
  onUpdateHabitValue: (habitId: string, date: Date, value: number) => void;
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habits,
  logs,
  weekDates,
  onToggleHabit,
  onUpdateHabitValue,
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | 'all'>('all');
  const [activeMenuHabitId, setActiveMenuHabitId] = useState<string | null>(null);
  const [numericPopover, setNumericPopover] = useState<{
    habitId: string;
    dateKey: string;
    date: Date;
    currentVal: number;
    targetVal: number;
    unit: string;
  } | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredHabits = habits
    .filter((h) => !h.archived)
    .filter((h) => (selectedCategory === 'all' ? true : h.category === selectedCategory));

  // Compute daily completion summary for header column
  const dailySummaries = weekDates.map((date) => {
    const dateKey = formatDateKey(date);
    let scheduled = 0;
    let completed = 0;

    habits.filter(h => !h.archived).forEach((h) => {
      if (isHabitScheduledForDay(h.frequency, h.customDays, date)) {
        scheduled++;
        if (logs[dateKey]?.[h.id]?.completed) {
          completed++;
        }
      }
    });

    const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;
    const isToday = isSameDay(date, today);

    return { date, dateKey, scheduled, completed, rate, isToday };
  });

  const categories: (HabitCategory | 'all')[] = [
    'all',
    'work',
    'health',
    'mindfulness',
    'fitness',
    'learning',
    'personal',
  ];

  return (
    <div className="space-y-4">
      {/* Category Filter bar and Add Habit Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 flex-shrink-0" />
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === 'all'
                ? habits.filter((h) => !h.archived).length
                : habits.filter((h) => !h.archived && h.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{cat === 'all' ? 'All Habits' : CATEGORY_LABELS[cat]}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-800/80 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onAddHabit}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm shadow-blue-600/20 transition-all ml-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Main Habit Grid Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            
            {/* Table Header: Days of the week */}
            <div className="grid grid-cols-12 gap-2 px-5 py-4 border-b border-slate-800 bg-slate-900/90 items-center text-xs text-slate-400 font-medium">
              <div className="col-span-5 flex items-center gap-2">
                <span>Habit & Target</span>
              </div>

              {dailySummaries.map((day) => {
                const dayName = day.date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = day.date.getDate();

                return (
                  <div
                    key={day.dateKey}
                    className={`col-span-1 text-center flex flex-col items-center justify-center p-1 rounded-lg transition-colors ${
                      day.isToday
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      {dayName}
                    </span>
                    <span className={`text-sm font-bold ${day.isToday ? 'text-blue-400' : 'text-slate-200'}`}>
                      {dayNum}
                    </span>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {day.rate}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Habit Rows */}
            {filteredHabits.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500 mb-3">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">
                  No habits found
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  {selectedCategory === 'all'
                    ? 'Begin your momentum by creating your first daily or weekly habit target.'
                    : `No habits found in the ${selectedCategory} category.`}
                </p>
                <button
                  onClick={onAddHabit}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Create Habit
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {filteredHabits.map((habit) => {
                  const categoryStyle = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.personal;
                  const streaks = calculateHabitStreak(habit, logs);

                  return (
                    <div
                      key={habit.id}
                      className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Left: Habit Info & Streaks */}
                      <div className="col-span-5 flex items-center justify-between pr-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}
                          >
                            <CategoryIcon
                              iconName={habit.iconName}
                              category={habit.category}
                              className="w-4 h-4"
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-200 truncate group-hover:text-blue-400 transition-colors">
                                {habit.name}
                              </h4>
                              {streaks.currentStreak > 0 && (
                                <span
                                  className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 flex-shrink-0"
                                  title={`${streaks.currentStreak} day consecutive streak`}
                                >
                                  <Flame className="w-2.5 h-2.5 fill-orange-400" />
                                  {streaks.currentStreak}d
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span>
                                {habit.targetType === 'number'
                                  ? `Target: ${habit.targetValue} ${habit.unit}`
                                  : 'Yes/No Check'}
                              </span>
                              <span>•</span>
                              <span className="capitalize">{habit.frequency}</span>
                            </div>
                          </div>
                        </div>

                        {/* Row Context Menu */}
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() =>
                              setActiveMenuHabitId(
                                activeMenuHabitId === habit.id ? null : habit.id
                              )
                            }
                            className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuHabitId === habit.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setActiveMenuHabitId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-50 p-1 text-xs text-slate-300">
                                <button
                                  onClick={() => {
                                    onEditHabit(habit);
                                    setActiveMenuHabitId(null);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-700 flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete habit "${habit.name}"?`)) {
                                      onDeleteHabit(habit.id);
                                    }
                                    setActiveMenuHabitId(null);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-700 text-rose-400 flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 7 Day Matrix Checkboxes */}
                      {weekDates.map((date) => {
                        const dateKey = formatDateKey(date);
                        const isScheduled = isHabitScheduledForDay(
                          habit.frequency,
                          habit.customDays,
                          date
                        );
                        const log = logs[dateKey]?.[habit.id];
                        const isCompleted = !!log?.completed;
                        const isToday = isSameDay(date, today);

                        return (
                          <div
                            key={dateKey}
                            className={`col-span-1 flex items-center justify-center p-1 rounded-lg ${
                              isToday ? 'bg-blue-500/5' : ''
                            }`}
                          >
                            {habit.targetType === 'boolean' ? (
                              <button
                                onClick={() => onToggleHabit(habit.id, date)}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                  isCompleted
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                                    : isScheduled
                                    ? 'border-2 border-slate-700 hover:border-blue-400 bg-slate-800/40 text-transparent'
                                    : 'border border-dashed border-slate-800 hover:border-slate-700 bg-transparent text-transparent opacity-40 hover:opacity-100'
                                }`}
                                title={`${habit.name} - ${dateKey} (${isCompleted ? 'Completed' : 'Pending'})`}
                              >
                                <Check
                                  className={`w-4 h-4 stroke-[3] transition-transform ${
                                    isCompleted ? 'scale-100' : 'scale-0'
                                  }`}
                                />
                              </button>
                            ) : (
                              // Number Target Habit (Click to open quick stepper or mark done)
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNumericPopover({
                                    habitId: habit.id,
                                    dateKey,
                                    date,
                                    currentVal: log?.value ?? (isCompleted ? habit.targetValue : 0),
                                    targetVal: habit.targetValue,
                                    unit: habit.unit || '',
                                  });
                                }}
                                className={`w-8 h-8 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition-all ${
                                  isCompleted
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105'
                                    : (log?.value ?? 0) > 0
                                    ? 'border-2 border-blue-500/60 bg-blue-500/20 text-blue-300'
                                    : isScheduled
                                    ? 'border-2 border-slate-700 hover:border-blue-400 bg-slate-800/40 text-slate-400'
                                    : 'border border-dashed border-slate-800 hover:border-slate-700 text-slate-600 opacity-40 hover:opacity-100'
                                }`}
                                title={`${habit.name}: ${log?.value ?? 0}/${habit.targetValue} ${habit.unit}`}
                              >
                                {isCompleted ? (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                ) : (
                                  <span>{log?.value ?? 0}</span>
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Numeric Quick Adjust Popover Modal */}
      {numericPopover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">
                  Log Progress
                </h4>
                <p className="text-xs text-slate-400">
                  Target: {numericPopover.targetVal} {numericPopover.unit}
                </p>
              </div>
              <button
                onClick={() => setNumericPopover(null)}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 py-2">
              <button
                onClick={() => {
                  const step = numericPopover.targetVal >= 30 ? 5 : 1;
                  const next = Math.max(0, numericPopover.currentVal - step);
                  setNumericPopover({ ...numericPopover, currentVal: next });
                }}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold border border-slate-700"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="text-center">
                <input
                  type="number"
                  value={numericPopover.currentVal}
                  onChange={(e) =>
                    setNumericPopover({
                      ...numericPopover,
                      currentVal: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="w-20 text-center text-2xl font-bold bg-slate-800 border border-slate-700 rounded-xl py-1 text-slate-100"
                />
                <span className="text-xs text-slate-400 block mt-1">
                  {numericPopover.unit}
                </span>
              </div>

              <button
                onClick={() => {
                  const step = numericPopover.targetVal >= 30 ? 5 : 1;
                  const next = numericPopover.currentVal + step;
                  setNumericPopover({ ...numericPopover, currentVal: next });
                }}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold border border-slate-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  // Complete full target
                  onUpdateHabitValue(
                    numericPopover.habitId,
                    numericPopover.date,
                    numericPopover.targetVal
                  );
                  setNumericPopover(null);
                }}
                className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 text-center"
              >
                Mark Full ({numericPopover.targetVal})
              </button>

              <button
                onClick={() => {
                  onUpdateHabitValue(
                    numericPopover.habitId,
                    numericPopover.date,
                    numericPopover.currentVal
                  );
                  setNumericPopover(null);
                }}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold text-center"
              >
                Save Value
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
