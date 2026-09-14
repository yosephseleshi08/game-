import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Award,
  CalendarCheck,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { WeeklyProductivityReport } from '../types';

interface WeeklyScoreCardProps {
  report: WeeklyProductivityReport;
}

export const WeeklyScoreCard: React.FC<WeeklyScoreCardProps> = ({ report }) => {
  const {
    productivityScore,
    scoreDelta,
    completionRate,
    totalCompleted,
    totalScheduled,
    perfectDays,
    peakDay,
    topHabits,
  } = report;

  // Circumference for radial progress
  const strokeWidth = 8;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (productivityScore / 100) * circumference;

  const getScoreRating = (score: number) => {
    if (score >= 85) return { label: 'Optimal Momentum', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 70) return { label: 'High Consistency', color: 'text-blue-400', badgeBg: 'bg-blue-500/10 border-blue-500/30' };
    if (score >= 50) return { label: 'Building Traction', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 border-amber-500/30' };
    return { label: 'Refocus Needed', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 border-rose-500/30' };
  };

  const rating = getScoreRating(productivityScore);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left: Productivity Score Gauge */}
        <div className="md:col-span-5 flex items-center gap-5 border-b md:border-b-0 md:border-r border-slate-800 pb-5 md:pb-0 pr-0 md:pr-4">
          <div className="relative flex items-center justify-center flex-shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="text-slate-800 stroke-current"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="text-blue-500 stroke-current transition-all duration-1000 ease-out"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-slate-100 tracking-tight">
                {productivityScore}
              </span>
              <span className="text-[10px] uppercase font-semibold text-slate-400">
                Score
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${rating.badgeBg} ${rating.color}`}>
                {rating.label}
              </span>
              {scoreDelta !== 0 && (
                <div
                  className={`flex items-center text-xs font-medium ${
                    scoreDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                  title={`${scoreDelta > 0 ? '+' : ''}${scoreDelta}% compared to previous 7 days`}
                >
                  {scoreDelta > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                  )}
                  <span>{scoreDelta > 0 ? `+${scoreDelta}%` : `${scoreDelta}%`}</span>
                </div>
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-200">
              Weekly Productivity Index
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Derived from your weekly habit completion ({completionRate}%), daily consistency, and target goals.
            </p>
          </div>
        </div>

        {/* Right: Key Performance Indicators */}
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100">
                {totalCompleted} <span className="text-xs font-normal text-slate-400">/ {totalScheduled}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {completionRate}% success rate
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Perfect Days</span>
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100">
                {perfectDays} <span className="text-xs font-normal text-slate-400">/ 7</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                100% daily targets
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Peak Day</span>
              <Award className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100 truncate">
                {peakDay ? peakDay.dayName : 'None'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {peakDay ? `${peakDay.rate}% rate` : 'No logs yet'}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-medium uppercase tracking-wider">Top Streak</span>
              <Flame className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-100 truncate">
                {topHabits[0] ? `${topHabits[0].streak} days` : '0 days'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate" title={topHabits[0]?.habit.name}>
                {topHabits[0] ? topHabits[0].habit.name : 'Start today'}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
