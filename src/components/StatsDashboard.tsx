import React, { useState } from 'react';
import { UserStats, FourHourPlanState, FreeTrainingSessionStats, DailyProtocolState } from '../types';
import { MASTER_RANKS, getRankForXp, loadFreeTrainingStats, exportDataBackupFile } from '../utils/storage';
import { loadFourHourPlan } from '../utils/fourHourPlan';
import { ProgressHistoryView } from './ProgressHistoryView';
import { ContributionHeatmap } from './ContributionHeatmap';
import { getAthleteArchetype } from '../utils/archetype';
import {
  Award,
  Zap,
  Flame,
  Target,
  Trophy,
  Clock,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar,
  Compass,
  Sparkles,
  Share2,
  Download,
} from 'lucide-react';

interface StatsDashboardProps {
  stats: UserStats;
  onResetStats?: () => void;
  fourHourPlan?: FourHourPlanState;
  freeTrainingStats?: FreeTrainingSessionStats;
  protocol?: DailyProtocolState;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedTime?: Date | null;
  onTriggerSync?: () => Promise<void> | void;
  onOpenArchetype?: () => void;
  onRestoreStreak?: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  fourHourPlan: propFourHourPlan,
  freeTrainingStats: propFreeTrainingStats,
  protocol,
  cloudSyncStatus = 'synced',
  lastSyncedTime,
  onTriggerSync,
  onOpenArchetype,
  onRestoreStreak,
}) => {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'history' | 'overview' | 'archetype'>('heatmap');
  const { currentRank, nextRank, progressPercent } = getRankForXp(stats.xp);

  // Fallback to loaded storage if not passed directly via props
  const resolvedFourHourPlan = propFourHourPlan || loadFourHourPlan();
  const resolvedFreeTrainingStats = propFreeTrainingStats || loadFreeTrainingStats();

  const archetype = getAthleteArchetype({
    userStats: stats,
    freeStats: resolvedFreeTrainingStats,
    fourHourPlan: resolvedFourHourPlan,
    protocol,
  });

  const accuracy =
    stats.totalAttempts > 0
      ? Math.round((stats.totalCorrectAttempts / stats.totalAttempts) * 100)
      : 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-2.5 py-0.5 rounded-full border border-indigo-800/60">
            Player Telemetry & Analytics
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Cognitive Visual Index
          </h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry tracking your visual cortex speed, span, and retention metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Type of Guy Badge Trigger */}
          <button
            onClick={() => onOpenArchetype ? onOpenArchetype() : setActiveTab('archetype')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer bg-slate-800/90 ${archetype.borderAccent} ${archetype.textAccent} hover:bg-slate-700`}
            title="Inspect your Type of Guy athlete persona"
          >
            <span>{archetype.emoji}</span>
            <span className="hidden sm:inline">Type of Guy:</span>
            <span className="font-extrabold">{archetype.title.split(' ')[1] || 'Athlete'}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </button>

          <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Accuracy</span>
            <span className="text-base font-black text-emerald-400">{accuracy}%</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total XP</span>
            <span className="text-base font-black text-cyan-400">{stats.xp}</span>
          </div>
        </div>
      </div>

      {/* 6-Day Streak Safeguard & Backup Strip */}
      <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-3.5 mb-6 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-xs">6-Day Streak Safeguard</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 font-mono font-bold border border-amber-700/60">
                {stats.currentStreak} Days Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Your 6-day streak and Day 7 curriculum are locked and safe. Tap restore or download a JSON backup anytime.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onRestoreStreak) onRestoreStreak();
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-950/40 active:scale-95"
          >
            <Flame className="w-3.5 h-3.5 fill-slate-950" />
            <span>Restore 6-Day Streak</span>
          </button>
          <button
            onClick={() => {
              exportDataBackupFile();
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download full progress backup JSON file"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Save (.json)</span>
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'heatmap'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          12-Month Habit Heatmap & Sync
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'history'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-800'
          }`}
        >
          <LineChartIcon className="w-4 h-4" />
          Progress History (Ayumu & Dual N-Back)
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'overview'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-900 border border-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Overview & Mastery Ranks
        </button>
        <button
          onClick={() => setActiveTab('archetype')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === 'archetype'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20'
              : 'text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60'
          }`}
        >
          <Compass className="w-4 h-4 text-purple-300" />
          <span>{archetype.emoji}</span>
          <span>Type of Guy Diagnostic</span>
        </button>
      </div>

      {/* Tab 1: 12-Month Activity Heatmap */}
      {activeTab === 'heatmap' && (
        <ContributionHeatmap
          stats={stats}
          fourHourPlan={resolvedFourHourPlan}
          freeTrainingStats={resolvedFreeTrainingStats}
          protocol={protocol}
          cloudSyncStatus={cloudSyncStatus}
          lastSyncedTime={lastSyncedTime}
          onTriggerSync={onTriggerSync}
        />
      )}

      {/* Tab 2: Progress History View (Charts & Trend Analysis) */}
      {activeTab === 'history' && <ProgressHistoryView stats={stats} />}

      {/* Tab 3: Overview & Mastery Ranks */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Primary KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Matrix Level</span>
                <Trophy className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-black text-white">Lvl {stats.matrixMaxLevel}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Spatial grid max</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Ayumu Max</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-black text-white">{stats.ayumuMaxNumbers} Digits</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Chimp benchmark</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Dual N-Back</span>
                <Target className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl font-black text-white">N={stats.dualNBackMaxN}</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Working memory span</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Peg Speed</span>
                <Zap className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-xl font-black text-white">{stats.mnemonicConversionCount} Drills</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Mnemonic automation</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Best Streak</span>
                <Zap className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-xl font-black text-white">{stats.bestStreak} Rounds</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Perfect recalls</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-semibold">Fastest Flash</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-white">{stats.fastestFlashMs}ms</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Exposure record</p>
            </div>
          </div>

          {/* Mastery Ranks Progression Roadmap */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Eidetic Mastery Progression
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {stats.xp} / {nextRank ? nextRank.minXp : stats.xp} XP
              </span>
            </div>

            <div className="space-y-3">
              {MASTER_RANKS.map((rank) => {
                const isUnlocked = stats.xp >= rank.minXp;
                const isCurrent = currentRank.level === rank.level;

                return (
                  <div
                    key={rank.level}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isCurrent
                        ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-500/10'
                        : isUnlocked
                        ? 'bg-slate-900/50 border-slate-800/80 opacity-80'
                        : 'bg-slate-950/40 border-slate-900 opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isUnlocked
                            ? 'bg-gradient-to-tr ' + rank.badgeColor + ' text-white shadow'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isUnlocked ? <CheckCircle2 className="w-5 h-5" /> : rank.level}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{rank.title}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-700 px-2 py-0.5 rounded-full">
                              Current Rank
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-snug">{rank.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono text-slate-400 block">{rank.minXp} XP</span>
                      <span
                        className={`text-[10px] uppercase font-bold ${
                          isUnlocked ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {isUnlocked ? 'Unlocked' : 'Locked'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily PQ History Table */}
          {stats.pqHistory.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Photographic Quotient History
              </h3>
              <div className="space-y-2">
                {stats.pqHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-slate-800/70 border border-slate-700/60 p-3 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-sm">
                        {rec.grade}
                      </span>
                      <div>
                        <span className="font-bold text-white text-sm">PQ {rec.score}</span>
                        <span className="text-slate-400 ml-2">{rec.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 font-mono">
                      <span>Matrix: {rec.breakdown.matrixScore}</span>
                      <span>Ayumu: {rec.breakdown.ayumuScore}</span>
                      <span>Detail: {rec.breakdown.detectiveScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Type of Guy Diagnostic */}
      {activeTab === 'archetype' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Persona Hero Card */}
          <div className={`relative rounded-3xl border p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-950 ${archetype.borderAccent} shadow-2xl overflow-hidden`}>
            <div className={`absolute -top-24 -right-24 w-60 h-60 rounded-full bg-gradient-to-br ${archetype.auraGradient} opacity-20 blur-3xl pointer-events-none`} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{archetype.emoji}</span>
                  <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/60">
                    Calculated Archetype
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border bg-slate-800/80 ${archetype.borderAccent} ${archetype.textAccent}`}>
                    {archetype.tierName}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {archetype.title}
                </h3>
                <p className={`text-sm font-medium mt-1 ${archetype.textAccent}`}>
                  {archetype.subtitle}
                </p>
              </div>

              {/* Total Training Hours Metric */}
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 text-left md:text-right shrink-0">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center md:justify-end gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  All-Time Training Time
                </div>
                <div className="text-3xl font-black text-white font-mono mt-0.5">
                  {archetype.allTimeHours > 0 ? (
                    <>
                      {archetype.allTimeHours} <span className="text-sm font-normal text-slate-400">hrs</span>
                    </>
                  ) : (
                    <>
                      {archetype.allTimeMinutes} <span className="text-sm font-normal text-slate-400">min</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {archetype.allTimeMinutes} minutes • {archetype.sessionsCount} sessions
                </div>
              </div>
            </div>

            {/* Neural Specialization Bar */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs relative z-10">
              <span className="text-slate-300">
                Dominant Processing: <strong className="text-white">{archetype.primaryDominance}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(archetype.shareText);
                    alert('Persona card copied to clipboard!');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700 flex items-center gap-1.5 transition-all text-xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  Share Card
                </button>
                {onOpenArchetype && (
                  <button
                    onClick={onOpenArchetype}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs transition-all shadow-sm cursor-pointer"
                  >
                    Open Deep Profile Modal
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Persona Traits Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <span>🏠</span> Natural Habitat
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{archetype.traits.naturalHabitat}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <span>⚡</span> Cognitive Superpower
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{archetype.traits.cognitiveSuperpower}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <span>🚩</span> Red Flag / Quirk
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{archetype.traits.redFlag}</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <span>💬</span> Life Motto
              </div>
              <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">{archetype.traits.lifeMotto}</p>
            </div>
          </div>

          {/* Neural Attribute Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Calibrated Attribute Radar
            </h4>

            <div className="space-y-3">
              {[
                { label: 'Focus Stamina', val: archetype.radarScores.focusStamina, color: 'bg-emerald-500' },
                { label: 'Retinal Shutter Speed', val: archetype.radarScores.shutterSpeed, color: 'bg-amber-400' },
                { label: 'RAM Buffer Capacity', val: archetype.radarScores.ramBuffer, color: 'bg-cyan-400' },
                { label: 'Spatial Mapping', val: archetype.radarScores.spatialMapping, color: 'bg-purple-400' },
                { label: 'Iron Discipline', val: archetype.radarScores.ironDiscipline, color: 'bg-rose-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-semibold">{item.label}</span>
                    <span className="font-mono font-bold text-slate-200">{item.val}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className={`${item.color} h-full rounded-full transition-all duration-700`} style={{ width: `${item.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Milestone Evolution Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Evolution Target: <span className="text-amber-300">{archetype.nextMilestone.targetLabel}</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                {archetype.nextMilestone.minutesRemaining > 0
                  ? `${archetype.nextMilestone.minutesRemaining}m to evolve`
                  : 'Evolution Cleared!'}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${archetype.nextMilestone.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
