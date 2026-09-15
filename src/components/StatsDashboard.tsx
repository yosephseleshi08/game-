import React from 'react';
import { UserStats } from '../types';
import { MASTER_RANKS, getRankForXp } from '../utils/storage';
import { Award, Zap, Flame, Target, Trophy, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

interface StatsDashboardProps {
  stats: UserStats;
  onResetStats?: () => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ stats }) => {
  const { currentRank, nextRank, progressPercent } = getRankForXp(stats.xp);

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
            Player Telemetry & Mastery
          </span>
          <h2 className="text-xl font-extrabold text-white mt-1">
            Cognitive Visual Index
          </h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry tracking your visual cortex speed, span, and retention metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Accuracy</span>
            <span className="text-lg font-black text-emerald-400">{accuracy}%</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Total XP</span>
            <span className="text-lg font-black text-cyan-400">{stats.xp}</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6 shadow-xl">
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
  );
};
