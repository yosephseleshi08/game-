import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Flame,
  Sparkles,
  Clock,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Award,
  TrendingUp,
  Brain,
  Info,
  Check,
  X,
  Target,
} from 'lucide-react';
import {
  UserStats,
  DailyProtocolState,
  FreeTrainingSessionStats,
} from '../types';
import { sound } from '../utils/audio';
import { getLocalDateString } from '../utils/protocol';

export interface ContributionHeatmapProps {
  stats: UserStats;
  protocol?: DailyProtocolState;
  freeTrainingStats?: FreeTrainingSessionStats;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedTime?: Date | null;
  onTriggerSync?: () => Promise<void> | void;
}

export interface DayActivity {
  dateStr: string; // YYYY-MM-DD
  dateObj: Date;
  dayOfWeek: number; // 0=Sun..6=Sat
  weekIndex: number;
  minutes: number;
  curriculumDay?: number;
  isCompleted: boolean; // GREEN
  isFailed: boolean; // RED
  isToday: boolean;
  isFuture: boolean;
  isPreJourney: boolean;
  statusLabel: string;
  gamesCompleted?: number;
  memoryPalaceCompleted?: boolean;
}

export const ContributionHeatmap: React.FC<ContributionHeatmapProps> = ({
  stats,
  protocol,
  freeTrainingStats,
  cloudSyncStatus = 'synced',
  lastSyncedTime,
  onTriggerSync,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayActivity | null>(null);
  const [timeRange, setTimeRange] = useState<'12_months' | 'last_6_months' | 'last_90_days'>('last_90_days');
  const [isSyncing, setIsSyncing] = useState(false);

  const todayStr = useMemo(() => getLocalDateString(), []);
  const today = useMemo(() => new Date(todayStr + 'T00:00:00'), [todayStr]);

  const journeyStartDate = useMemo(() => {
    return protocol?.startDate || todayStr;
  }, [protocol?.startDate, todayStr]);

  // Generate 53 weeks aligned to Sunday..Saturday
  const { weeksData, totalStats } = useMemo(() => {
    const endDate = new Date(today);
    const dayOfWeekEnd = endDate.getDay();
    const daysUntilSaturday = 6 - dayOfWeekEnd;
    const calendarEndDate = new Date(endDate);
    calendarEndDate.setDate(calendarEndDate.getDate() + daysUntilSaturday);

    const totalDaysToGenerate = 53 * 7;
    const startDate = new Date(calendarEndDate);
    startDate.setDate(startDate.getDate() - totalDaysToGenerate + 1);

    const history = protocol?.history || {};
    const todayTasks = protocol?.tasks || [];
    const todayPalace = protocol?.memoryPalaceTimer?.isCompleted;
    const isTodayAllDone = Boolean(
      todayTasks.length >= 4 &&
      todayTasks.every((t) => t.isCompleted) &&
      todayPalace
    );

    let greenCount = 0;
    let redCount = 0;
    let totalMinutesCount = 0;

    const weeks: DayActivity[][] = [];
    let currentWeek: DayActivity[] = [];
    let cursor = new Date(startDate);
    let weekCounter = 0;

    for (let d = 0; d < totalDaysToGenerate; d++) {
      const dStr = getLocalDateString(cursor);
      const dayOfWeek = cursor.getDay();
      const isFuture = cursor > today;
      const isToday = dStr === todayStr;
      const isPreJourney = dStr < journeyStartDate;

      const record = history[dStr];
      let isCompleted = false;
      let isFailed = false;
      let minutes = 0;
      let gamesDone = 0;
      let palaceDone = false;

      if (isToday) {
        isCompleted = isTodayAllDone;
        isFailed = false;
        const todaySecs = freeTrainingStats?.todaySeconds || 0;
        minutes = Math.floor(todaySecs / 60);
        gamesDone = todayTasks.filter((t) => t.id !== 'memory-palace' && t.isCompleted).length;
        palaceDone = Boolean(todayPalace);
      } else if (!isFuture && !isPreJourney) {
        if (record) {
          isCompleted = Boolean(record.completed && !record.failed);
          isFailed = !isCompleted;
          minutes = record.totalSeconds ? Math.floor(record.totalSeconds / 60) : isCompleted ? 120 : 0;
          gamesDone = record.gamesCompletedCount || (isCompleted ? 3 : 0);
          palaceDone = Boolean(record.memoryPalaceCompleted || isCompleted);
        } else {
          // A day elapsed after journey start with no record is considered Failed (Red)
          isCompleted = false;
          isFailed = true;
          minutes = 0;
        }
      }

      if (isCompleted && !isFuture) {
        greenCount++;
        totalMinutesCount += minutes || 120;
      } else if (isFailed && !isFuture) {
        redCount++;
        totalMinutesCount += minutes;
      }

      let statusLabel = 'Pre-Journey';
      if (isFuture) statusLabel = 'Upcoming Future Day';
      else if (isToday) statusLabel = isCompleted ? 'Mastered Today (Green)' : 'In Progress Today';
      else if (isCompleted) statusLabel = 'Mastered Goal (Green)';
      else if (isFailed) statusLabel = 'Failed / Missed Goal (Red)';

      const dayActivity: DayActivity = {
        dateStr: dStr,
        dateObj: new Date(cursor),
        dayOfWeek,
        weekIndex: weekCounter,
        minutes,
        curriculumDay: record?.curriculumDay,
        isCompleted,
        isFailed,
        isToday,
        isFuture,
        isPreJourney,
        statusLabel,
        gamesCompleted: gamesDone,
        memoryPalaceCompleted: palaceDone,
      };

      currentWeek.push(dayActivity);

      if (dayOfWeek === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
        weekCounter++;
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return {
      weeksData: weeks,
      totalStats: {
        greenCount,
        redCount,
        totalTrackedDays: greenCount + redCount,
        totalHours: (totalMinutesCount / 60).toFixed(1),
        successRate:
          greenCount + redCount > 0
            ? Math.round((greenCount / (greenCount + redCount)) * 100)
            : 100,
      },
    };
  }, [today, todayStr, journeyStartDate, protocol, freeTrainingStats]);

  const displayedWeeks = useMemo(() => {
    if (timeRange === 'last_90_days') {
      return weeksData.slice(-14);
    }
    if (timeRange === 'last_6_months') {
      return weeksData.slice(-27);
    }
    return weeksData;
  }, [weeksData, timeRange]);

  const handleManualSyncClick = async () => {
    sound.playClick();
    setIsSyncing(true);
    try {
      if (onTriggerSync) {
        await onTriggerSync();
      }
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 700);
    }
  };

  const getCellColor = (day: DayActivity) => {
    if (day.isFuture) {
      return 'bg-slate-900/40 border-slate-800/40 opacity-30 cursor-not-allowed';
    }
    if (day.isToday) {
      if (day.isCompleted) {
        return 'bg-emerald-500 border-emerald-400 shadow-md shadow-emerald-500/40 text-slate-950';
      }
      return 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-400/50 animate-pulse';
    }
    if (day.isCompleted) {
      return 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/30 text-slate-950 hover:scale-125';
    }
    if (day.isFailed) {
      return 'bg-rose-600 border-rose-500 shadow-sm shadow-rose-600/30 text-white hover:scale-125';
    }
    return 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700';
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200 w-full max-w-full overflow-x-hidden">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-cyan-400 to-indigo-500 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Calendar className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Green vs Red Calendar Heatmap
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold uppercase tracking-wider">
                  Real Calendar Progression
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Every single day is recorded. Completed protocols turn <strong className="text-emerald-400">Green</strong>; missed or skipped days turn <strong className="text-rose-400">Red</strong> and reset your streak.
              </p>
            </div>
          </div>

          {/* Sync Status Badge */}
          <div className="flex items-center gap-2.5 bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-2xl">
            <div className="flex items-center gap-2 text-xs">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  cloudSyncStatus === 'synced'
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/80 animate-pulse'
                    : cloudSyncStatus === 'syncing'
                    ? 'bg-cyan-400 animate-spin'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300 font-semibold text-xs hidden sm:inline">
                {cloudSyncStatus === 'synced' ? 'All Devices Synced' : cloudSyncStatus === 'syncing' ? 'Syncing...' : 'Local Cache'}
              </span>
            </div>
            <button
              onClick={handleManualSyncClick}
              disabled={isSyncing}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span className="text-[11px]">{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs relative z-10">
          <div className="bg-slate-950/80 border border-emerald-500/30 p-3 rounded-2xl">
            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Green Days
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-400">{totalStats.greenCount}</span>
              <span className="text-xs text-slate-400">Mastered</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              100% Protocol Achieved
            </span>
          </div>

          <div className="bg-slate-950/80 border border-rose-500/30 p-3 rounded-2xl">
            <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider block flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Red Days
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-rose-400">{totalStats.redCount}</span>
              <span className="text-xs text-slate-400">Failed / Missed</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Streak Reset to 0
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider block flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Active Streak
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-white">{stats.currentStreak}</span>
              <span className="text-xs text-slate-400">Consecutive Days</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Best: {stats.bestStreak} Days
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
            <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Total Volume
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-white">{totalStats.totalHours}</span>
              <span className="text-xs text-slate-400">Hours</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Games + Manual Palace
            </span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Grid Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xl w-full max-w-full overflow-hidden">
        {/* Time range selector */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 max-w-full">
            <button
              onClick={() => {
                sound.playClick();
                setTimeRange('last_90_days');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === 'last_90_days' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 90 Days
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setTimeRange('last_6_months');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === 'last_6_months' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 6 Months
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setTimeRange('12_months');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timeRange === '12_months' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Full Year (52 Wks)
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Click any cell to inspect details
          </div>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="flex items-center justify-between sm:hidden text-[10px] text-cyan-400 font-mono mb-1.5 px-1">
          <span>← Swipe horizontally to view full calendar history →</span>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-3 pt-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-950 touch-scroll-x">
          <div className="min-w-[700px] inline-block select-none">
            <div className="flex gap-2">
              {/* Day Labels */}
              <div className="flex flex-col justify-between text-[9px] font-mono text-slate-500 pr-1 py-0.5 select-none w-6 shrink-0">
                <span className="h-3 leading-3">Sun</span>
                <span className="h-3 leading-3 font-semibold text-slate-400">Mon</span>
                <span className="h-3 leading-3">Tue</span>
                <span className="h-3 leading-3 font-semibold text-slate-400">Wed</span>
                <span className="h-3 leading-3">Thu</span>
                <span className="h-3 leading-3 font-semibold text-slate-400">Fri</span>
                <span className="h-3 leading-3">Sat</span>
              </div>

              {/* Columns of Week Cells */}
              <div className="flex gap-[3.5px] flex-1">
                {displayedWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3.5px]">
                    {week.map((day) => {
                      const isSelected = selectedDay?.dateStr === day.dateStr;
                      return (
                        <button
                          key={day.dateStr}
                          onClick={() => {
                            sound.playClick();
                            setSelectedDay(day);
                          }}
                          className={`w-3.5 h-3.5 rounded-[3.5px] transition-all relative group cursor-pointer border ${getCellColor(
                            day
                          )} ${
                            isSelected
                              ? 'ring-2 ring-cyan-400 ring-offset-1 ring-offset-slate-900 scale-125 z-20'
                              : ''
                          }`}
                          title={`${day.dateStr}: ${day.statusLabel}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-3 mt-2 border-t border-slate-800 text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <span className="w-3 h-3 rounded-[3px] bg-emerald-500 border border-emerald-400 inline-block" />
              Green: Mastered (1h Games + 1h Palace)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-rose-400 font-bold">
              <span className="w-3 h-3 rounded-[3px] bg-rose-600 border border-rose-500 inline-block" />
              Red: Incomplete / Missed
            </span>
            <span className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
              <span className="w-3 h-3 rounded-[3px] bg-amber-500/40 border border-amber-500 inline-block" />
              Amber: Today
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Journey Start: {journeyStartDate}
          </span>
        </div>
      </div>

      {/* Selected Day Inspector */}
      {selectedDay && (
        <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-150">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-4 h-4 rounded-md ${
                  selectedDay.isCompleted
                    ? 'bg-emerald-500'
                    : selectedDay.isFailed
                    ? 'bg-rose-600'
                    : selectedDay.isToday
                    ? 'bg-amber-400'
                    : 'bg-slate-800'
                }`}
              />
              <div>
                <h4 className="text-base font-black text-white">
                  {selectedDay.dateObj.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h4>
                <span className="text-xs text-slate-400">
                  {selectedDay.statusLabel}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-2 font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-0.5">
                Outcome Status
              </span>
              <span className={`text-base font-black ${selectedDay.isCompleted ? 'text-emerald-400' : selectedDay.isFailed ? 'text-rose-400' : 'text-amber-400'}`}>
                {selectedDay.isCompleted ? 'PASSED (Green)' : selectedDay.isFailed ? 'FAILED (Red)' : 'TODAY ACTIVE'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-0.5">
                3-Game Practice (1 Hour)
              </span>
              <span className="text-base font-black text-white">
                {selectedDay.gamesCompleted || 0} / 3 Games Met
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-0.5">
                Manual Memory Palace (1 Hour)
              </span>
              <span className={`text-base font-black ${selectedDay.memoryPalaceCompleted ? 'text-emerald-400' : 'text-slate-400'}`}>
                {selectedDay.memoryPalaceCompleted ? '60m Completed' : 'Not Finished'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
