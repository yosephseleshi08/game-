import React from 'react';
import {
  TrendingUp,
  Sparkles,
  AlertTriangle,
  Flame,
  Award,
  Calendar,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { WeeklyProductivityReport } from '../types';
import { CATEGORY_COLORS, CATEGORY_LABELS, CategoryIcon } from './CategoryIcon';

interface ProductivityInsightsProps {
  report: WeeklyProductivityReport;
}

export const ProductivityInsights: React.FC<ProductivityInsightsProps> = ({ report }) => {
  const {
    productivityScore,
    completionRate,
    dailyStats,
    categoryBreakdown,
    topHabits,
    needsAttentionHabits,
    insights,
    peakDay,
    slumpDay,
    perfectDays,
  } = report;

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Weekly Rhythm Overview */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Weekly Performance Analytics
            </span>
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Habit Consistency & Productivity Heatmap
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              7-day aggregate of scheduled vs executed routines across your focus zones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-400">Weekly Average</div>
              <div className="text-lg font-bold text-slate-100">{completionRate}%</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
              {perfectDays}★
            </div>
          </div>
        </div>

        {/* Daily Completion Bars */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4 border-t border-slate-800">
          {dailyStats.map((day) => {
            const isPeak = peakDay?.dayName === day.dayLabel && day.percentage > 0;
            const isSlump = slumpDay?.dayName === day.dayLabel && day.percentage < 65;

            return (
              <div key={day.date} className="flex flex-col items-center">
                {/* Value tooltip label */}
                <span className="text-[10px] font-semibold text-slate-400 mb-2">
                  {day.percentage}%
                </span>

                {/* Vertical Bar Container */}
                <div className="w-full max-w-[48px] h-36 bg-slate-800/60 rounded-xl p-1 flex flex-col justify-end relative overflow-hidden border border-slate-700/40">
                  {/* Subtle 80% benchmark guideline */}
                  <div className="absolute top-[20%] left-0 right-0 border-b border-dashed border-slate-600/40 pointer-events-none" />

                  {/* Filled Bar */}
                  <div
                    style={{ height: `${Math.max(4, day.percentage)}%` }}
                    className={`w-full rounded-lg transition-all duration-700 ease-out ${
                      day.percentage === 100
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/20'
                        : isPeak
                        ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-md shadow-blue-500/20'
                        : isSlump
                        ? 'bg-gradient-to-t from-amber-600/80 to-amber-400/80'
                        : 'bg-gradient-to-t from-slate-600 to-blue-500'
                    }`}
                  />
                </div>

                {/* Day label and date */}
                <div className="text-center mt-2.5">
                  <span
                    className={`text-xs font-semibold block ${
                      day.isToday ? 'text-blue-400' : 'text-slate-300'
                    }`}
                  >
                    {day.dayLabel}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {day.completedCount}/{day.scheduledCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Peak Day vs Vulnerability (Slump) Day Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Peak Performance Day Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                Peak Productivity Zone
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {peakDay ? `${peakDay.rate}% Target Met` : 'N/A'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100">
              {peakDay ? `${peakDay.dayName} was your strongest day` : 'Collecting data...'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Your focus and habit follow-through peaked on {peakDay?.dayName || 'mid-week'}.
              Protect this day for your highest-leverage intellectual and fitness milestones.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center text-xs text-slate-400 gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span>Recommended: Schedule challenging deep work blocks here.</span>
          </div>
        </div>

        {/* Slump / Vulnerability Day Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Vulnerability Window
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {slumpDay ? `${slumpDay.rate}% Completion` : 'Consistent'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100">
              {slumpDay ? `${slumpDay.dayName} recorded lower consistency` : 'No significant slump detected'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {slumpDay
                ? `${slumpDay.dayName} had lower completion. Reduce friction by anchoring habits to existing weekend anchors or setting "minimum viable" starter targets.`
                : 'Your daily distribution is stable throughout the entire 7-day cycle.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center text-xs text-slate-400 gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Strategy: Use the 2-minute rule to maintain identity on off-days.</span>
          </div>
        </div>

      </div>

      {/* Category Distribution & Balance */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5" />
              Life Zone Balance
            </span>
            <h3 className="text-base font-bold text-slate-100">
              Category Completion Breakdown
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {categoryBreakdown.length} active categories
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryBreakdown.map((item) => {
            const style = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.personal;
            return (
              <div
                key={item.category}
                className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg ${style.bg} ${style.text} flex items-center justify-center`}>
                      <CategoryIcon category={item.category} className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-slate-200">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px]">
                      {item.completed}/{item.scheduled} tasks
                    </span>
                    <span className="font-bold text-slate-100">
                      {item.rate}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <div
                    style={{ width: `${item.rate}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.rate >= 80 ? 'bg-emerald-500' : item.rate >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak Leaders & Attention Needed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Top Habits */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              Streak Momentum Leaders
            </h3>
            <span className="text-[11px] text-slate-400">Unbroken chains</span>
          </div>

          <div className="space-y-2.5">
            {topHabits.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Log consecutive days to build streak records.
              </p>
            ) : (
              topHabits.map((item, i) => (
                <div
                  key={item.habit.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-500 w-4">
                      #{i + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">
                        {item.habit.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {item.habit.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-lg">
                    <Flame className="w-3.5 h-3.5 fill-orange-400" />
                    <span>{item.streak} days</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Habits Needing Attention
            </h3>
            <span className="text-[11px] text-slate-400">&lt;60% completion</span>
          </div>

          <div className="space-y-2.5">
            {needsAttentionHabits.length === 0 ? (
              <div className="p-4 text-center text-xs text-emerald-400 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                ✨ Excellent! All active habits are maintaining solid weekly consistency.
              </div>
            ) : (
              needsAttentionHabits.map((item) => (
                <div
                  key={item.habit.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">
                      {item.habit.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Completed {item.completedDays} days this week
                    </span>
                  </div>
                  <div className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg">
                    {item.rate}%
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Actionable Productivity Insights Feed */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          Actionable Productivity Takeaways
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {insights.map((ins) => {
            const isPos = ins.type === 'positive';
            const isWarn = ins.type === 'warning';

            return (
              <div
                key={ins.id}
                className={`p-4 rounded-xl border transition-all ${
                  isPos
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : isWarn
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-blue-500/5 border-blue-500/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      isPos
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : isWarn
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}
                  >
                    {ins.type}
                  </span>
                  <h4 className="text-xs font-bold text-slate-200">{ins.title}</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{ins.message}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
