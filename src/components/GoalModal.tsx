import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Goal, Habit, HabitCategory } from '../types';
import { CATEGORY_LABELS } from './CategoryIcon';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Omit<Goal, 'id' | 'createdAt'>) => void;
  initialGoal?: Goal | null;
  habits: Habit[];
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialGoal,
  habits,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('work');
  const [linkedHabitId, setLinkedHabitId] = useState<string>('');
  const [targetValue, setTargetValue] = useState<number>(100);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [unit, setUnit] = useState('mins');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [milestones, setMilestones] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newMilestoneText, setNewMilestoneText] = useState('');

  useEffect(() => {
    if (initialGoal) {
      setTitle(initialGoal.title);
      setDescription(initialGoal.description || '');
      setCategory(initialGoal.category);
      setLinkedHabitId(initialGoal.linkedHabitId || '');
      setTargetValue(initialGoal.targetValue);
      setCurrentValue(initialGoal.currentValue);
      setUnit(initialGoal.unit);
      setStartDate(initialGoal.startDate);
      setTargetDate(initialGoal.targetDate);
      setMilestones(initialGoal.milestones || []);
    } else {
      setTitle('');
      setDescription('');
      setCategory('work');
      setLinkedHabitId('');
      setTargetValue(100);
      setCurrentValue(0);
      setUnit('mins');
      setStartDate(new Date().toISOString().split('T')[0]);
      setTargetDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setMilestones([
        { id: 'm-1', title: 'Start baseline and establish habit', completed: false },
        { id: 'm-2', title: '50% progress milestone', completed: false },
        { id: 'm-3', title: 'Final sprint to completion', completed: false },
      ]);
    }
  }, [initialGoal, isOpen]);

  if (!isOpen) return null;

  const handleAddMilestone = () => {
    if (!newMilestoneText.trim()) return;
    setMilestones([
      ...milestones,
      { id: 'm-' + Date.now(), title: newMilestoneText.trim(), completed: false },
    ]);
    setNewMilestoneText('');
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const progressPct = (currentValue / targetValue) * 100;
    const status: Goal['status'] =
      progressPct >= 100 ? 'completed' : progressPct < 30 ? 'behind' : 'in_progress';

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      linkedHabitId: linkedHabitId || undefined,
      targetValue: Math.max(1, Number(targetValue)),
      currentValue: Math.max(0, Number(currentValue)),
      unit: unit.trim() || 'units',
      startDate,
      targetDate,
      status,
      milestones,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl p-6 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100">
            {initialGoal ? 'Edit Goal' : 'Set New Target Goal'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Goal Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Read 3 Books This Quarter"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Description / Why (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What outcome will this unlock for you?"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category & Linked Habit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as HabitCategory)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                {Object.keys(CATEGORY_LABELS).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat as HabitCategory]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Linked Habit (Optional)
              </label>
              <select
                value={linkedHabitId}
                onChange={(e) => setLinkedHabitId(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Standalone Goal --</option>
                {habits.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Value, Current Value & Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Current Progress
              </label>
              <input
                type="number"
                min="0"
                value={currentValue}
                onChange={(e) => setCurrentValue(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Target Metric
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Unit
              </label>
              <input
                type="text"
                placeholder="pages, hrs, %"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-100"
              />
            </div>
          </div>

          {/* Timeline Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Target Deadline
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-100"
              />
            </div>
          </div>

          {/* Milestones Checklist Builder */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Key Milestones / Checkpoints
            </label>
            <div className="space-y-2 mb-2">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 p-2 bg-slate-800/60 rounded-xl border border-slate-700 text-xs"
                >
                  <span className="text-slate-300 truncate">{m.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(m.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add milestone (e.g. Complete chapter 5)"
                value={newMilestoneText}
                onChange={(e) => setNewMilestoneText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMilestone();
                  }
                }}
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500"
              />
              <button
                type="button"
                onClick={handleAddMilestone}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
            >
              {initialGoal ? 'Save Goal' : 'Create Goal'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
