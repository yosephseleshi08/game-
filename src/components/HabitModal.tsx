import React, { useState, useEffect } from 'react';
import { Habit, HabitCategory } from '../types';
import { CategoryIcon, CATEGORY_COLORS, CATEGORY_LABELS } from './CategoryIcon';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Omit<Habit, 'id' | 'createdAt'>) => void;
  initialHabit?: Habit | null;
}

const PRESET_ICONS = [
  'Zap',
  'Droplets',
  'Sparkles',
  'Dumbbell',
  'BookOpen',
  'CheckCircle2',
  'Heart',
  'Brain',
  'Flame',
  'Sun',
  'Moon',
  'Coffee',
  'Target',
  'Timer',
];

const QUICK_IDEAS = [
  { name: 'Deep Work Sprint', category: 'work' as HabitCategory, icon: 'Zap', type: 'number' as const, val: 90, unit: 'min' },
  { name: 'Hydrate 2.5L', category: 'health' as HabitCategory, icon: 'Droplets', type: 'number' as const, val: 2.5, unit: 'L' },
  { name: 'Morning Meditation', category: 'mindfulness' as HabitCategory, icon: 'Sparkles', type: 'number' as const, val: 15, unit: 'min' },
  { name: 'Daily Workout', category: 'fitness' as HabitCategory, icon: 'Dumbbell', type: 'boolean' as const, val: 1, unit: 'session' },
  { name: 'Read 20 Pages', category: 'learning' as HabitCategory, icon: 'BookOpen', type: 'number' as const, val: 20, unit: 'pages' },
];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('health');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'custom'>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [targetType, setTargetType] = useState<'boolean' | 'number'>('boolean');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [unit, setUnit] = useState('');
  const [iconName, setIconName] = useState('CheckCircle2');

  useEffect(() => {
    if (initialHabit) {
      setName(initialHabit.name);
      setDescription(initialHabit.description || '');
      setCategory(initialHabit.category);
      setFrequency(initialHabit.frequency);
      setCustomDays(initialHabit.customDays || [1, 2, 3, 4, 5]);
      setTargetType(initialHabit.targetType);
      setTargetValue(initialHabit.targetValue);
      setUnit(initialHabit.unit || '');
      setIconName(initialHabit.iconName);
    } else {
      setName('');
      setDescription('');
      setCategory('health');
      setFrequency('daily');
      setCustomDays([1, 2, 3, 4, 5]);
      setTargetType('boolean');
      setTargetValue(1);
      setUnit('');
      setIconName('CheckCircle2');
    }
  }, [initialHabit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      frequency,
      customDays: frequency === 'custom' ? customDays : undefined,
      targetType,
      targetValue: targetType === 'number' ? Math.max(1, Number(targetValue)) : 1,
      unit: targetType === 'number' ? unit.trim() || 'units' : undefined,
      color: CATEGORY_COLORS[category].accent,
      iconName,
    });

    onClose();
  };

  const dayLabels = [
    { label: 'Sun', val: 0 },
    { label: 'Mon', val: 1 },
    { label: 'Tue', val: 2 },
    { label: 'Wed', val: 3 },
    { label: 'Thu', val: 4 },
    { label: 'Fri', val: 5 },
    { label: 'Sat', val: 6 },
  ];

  const toggleCustomDay = (val: number) => {
    if (customDays.includes(val)) {
      if (customDays.length > 1) {
        setCustomDays(customDays.filter((d) => d !== val));
      }
    } else {
      setCustomDays([...customDays, val].sort());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl p-6 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-100">
            {initialHabit ? 'Edit Habit' : 'Create New Habit'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        {/* Quick Inspiration Pills (only for new habits) */}
        {!initialHabit && (
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1.5 uppercase tracking-wider">
              Quick Ideas
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_IDEAS.map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setName(idea.name);
                    setCategory(idea.category);
                    setIconName(idea.icon);
                    setTargetType(idea.type);
                    setTargetValue(idea.val);
                    setUnit(idea.unit);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  {idea.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name & Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Habit Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning Meditation"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Purpose / Cue (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this matters, or trigger (e.g., Right after brewing coffee)"
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category & Icon */}
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
                Icon
              </label>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <CategoryIcon iconName={iconName} category={category} className="w-5 h-5" />
                </div>
                <select
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  {PRESET_ICONS.map((ico) => (
                    <option key={ico} value={ico}>
                      {ico}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Frequency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'daily', label: 'Every Day' },
                { id: 'weekdays', label: 'Weekdays (M-F)' },
                { id: 'custom', label: 'Custom Days' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFrequency(f.id as 'daily' | 'weekdays' | 'custom')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    frequency === f.id
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {frequency === 'custom' && (
              <div className="flex items-center justify-between gap-1 mt-2.5 p-2 bg-slate-800/50 rounded-xl border border-slate-700/60">
                {dayLabels.map((d) => {
                  const isChecked = customDays.includes(d.val);
                  return (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() => toggleCustomDay(d.val)}
                      className={`w-9 h-8 rounded-lg text-xs font-semibold transition-all ${
                        isChecked
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Metric Type */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Target Type
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setTargetType('boolean')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  targetType === 'boolean'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Yes / No (Checkmark)
              </button>
              <button
                type="button"
                onClick={() => setTargetType('number')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  targetType === 'number'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Numeric Value (mins, pages, etc.)
              </button>
            </div>

            {targetType === 'number' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    min="1"
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
                    placeholder="e.g., mins, pages, L"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-slate-100"
                  />
                </div>
              </div>
            )}
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
              {initialHabit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
