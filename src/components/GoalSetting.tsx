import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  MoreVertical,
  Edit2,
  Trash2,
  Link,
  Award,
} from 'lucide-react';
import { Goal, Habit } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS } from './CategoryIcon';

interface GoalSettingProps {
  goals: Goal[];
  habits: Habit[];
  onAddGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
  onUpdateProgress: (goalId: string, delta: number) => void;
}

export const GoalSetting: React.FC<GoalSettingProps> = ({
  goals,
  habits,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  onToggleMilestone,
  onUpdateProgress,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredGoals = goals.filter((g) => {
    if (filterStatus === 'all') return true;
    return g.status === filterStatus;
  });

  const completedCount = goals.filter((g) => g.status === 'completed').length;
  const inProgressCount = goals.filter((g) => g.status === 'in_progress' || g.status === 'behind').length;

  const calculateDaysRemaining = (targetDateStr: string) => {
    const target = new Date(targetDateStr);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    return `${diffDays} days left`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Target className="w-3.5 h-3.5" />
              Strategic Objectives
            </span>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Productivity Targets & Milestone Roadmaps
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Connect everyday micro-habits to macro long-term accomplishments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-center">
              <span className="text-xs text-slate-400 block">In Progress</span>
              <span className="text-sm font-bold text-slate-100">{inProgressCount}</span>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 text-center">
              <span className="text-xs text-slate-400 block">Achieved</span>
              <span className="text-sm font-bold text-emerald-400">{completedCount}</span>
            </div>
            <button
              onClick={onAddGoal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all ml-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Goal</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-800">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Goals ({goals.length})
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === 'in_progress'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === 'completed'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Goal Cards Grid */}
      {filteredGoals.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500 mb-3">
            <Target className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200 mb-1">
            No goals in this view
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Set ambitious, measurable targets to supercharge your daily habit adherence.
          </p>
          <button
            onClick={onAddGoal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Set Target Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredGoals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
            const categoryStyle = CATEGORY_COLORS[goal.category] || CATEGORY_COLORS.personal;
            const daysLeft = calculateDaysRemaining(goal.targetDate);
            const isCompleted = goal.status === 'completed' || pct >= 100;
            const linkedHabit = habits.find((h) => h.id === goal.linkedHabitId);

            return (
              <div
                key={goal.id}
                className={`bg-slate-900/90 border rounded-2xl p-5 space-y-4 transition-all shadow-sm ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-gradient-to-br from-slate-900 to-emerald-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Category, Status & Action menu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
                    >
                      {CATEGORY_LABELS[goal.category]}
                    </span>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <Award className="w-3 h-3" />
                        Achieved
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {daysLeft}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenuId(activeMenuId === goal.id ? null : goal.id)
                      }
                      className="p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === goal.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setActiveMenuId(null)}
                        />
                        <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-slate-700 rounded-xl shadow-lg z-50 p-1 text-xs text-slate-300">
                          <button
                            onClick={() => {
                              onEditGoal(goal);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-700 flex items-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete goal "${goal.title}"?`)) {
                                onDeleteGoal(goal.id);
                              }
                              setActiveMenuId(null);
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

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-100 tracking-tight">
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {goal.description}
                    </p>
                  )}
                </div>

                {/* Progress bar and numeric tally */}
                <div className="space-y-2 bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()} {goal.unit}
                    </span>
                    <span className="font-bold text-blue-400">{pct}%</span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-slate-700/60 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-700 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      }`}
                    />
                  </div>

                  {/* Incremental progress controls */}
                  <div className="flex items-center justify-between pt-1">
                    {linkedHabit ? (
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Link className="w-3 h-3 text-blue-400" />
                        Synced to: <strong className="text-slate-300">{linkedHabit.name}</strong>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Manual tracking</span>
                    )}

                    {!isCompleted && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onUpdateProgress(goal.id, -(goal.targetValue >= 100 ? 10 : 1))}
                          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 border border-slate-700"
                          title="Reduce progress"
                        >
                          -
                        </button>
                        <button
                          onClick={() => onUpdateProgress(goal.id, goal.targetValue >= 100 ? 10 : 1)}
                          className="px-2.5 py-0.5 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-[11px] font-semibold text-blue-300 border border-blue-500/30"
                          title="Add progress"
                        >
                          +{goal.targetValue >= 100 ? 10 : 1}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Milestone Checklist */}
                {goal.milestones && goal.milestones.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Milestones ({goal.milestones.filter((m) => m.completed).length}/{goal.milestones.length})
                    </span>
                    <div className="space-y-1">
                      {goal.milestones.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => onToggleMilestone(goal.id, m.id)}
                          className="w-full text-left flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors text-xs text-slate-300 group"
                        >
                          {m.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 flex-shrink-0" />
                          )}
                          <span
                            className={`truncate ${
                              m.completed ? 'line-through text-slate-500' : 'text-slate-300'
                            }`}
                          >
                            {m.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
