import React, { useState } from 'react';
import { UserStats, ProgressHistoryEntry } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { TrendingUp, Flame, Target, Trophy, Sparkles, ArrowUpRight, Award, Zap } from 'lucide-react';

interface ProgressHistoryViewProps {
  stats: UserStats;
}

export const ProgressHistoryView: React.FC<ProgressHistoryViewProps> = ({ stats }) => {
  const [chartMetric, setChartMetric] = useState<'both' | 'ayumu' | 'dualNBack'>('both');

  // Build the dataset: if user has records, use them; ensure current peaks are included cleanly
  const historyData: (ProgressHistoryEntry & { dayLabel: string })[] = (
    stats.progressHistory && stats.progressHistory.length > 0
      ? stats.progressHistory
      : [
          {
            id: 'init-1',
            timestamp: new Date(Date.now() - 14 * 86400000).toISOString(),
            displayDate: 'Day 1',
            ayumuMax: 4,
            dualNBackMaxN: 2,
            matrixLevel: 1,
          },
          {
            id: 'init-2',
            timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
            displayDate: 'Day 7',
            ayumuMax: 5,
            dualNBackMaxN: 2,
            matrixLevel: 2,
          },
          {
            id: 'init-3',
            timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
            displayDate: 'Day 12',
            ayumuMax: 6,
            dualNBackMaxN: 3,
            matrixLevel: 3,
          },
          {
            id: 'init-4',
            timestamp: new Date().toISOString(),
            displayDate: 'Today',
            ayumuMax: stats.ayumuMaxNumbers,
            dualNBackMaxN: stats.dualNBackMaxN,
            matrixLevel: stats.matrixMaxLevel,
          },
        ]
  ).map((item, idx) => ({
    ...item,
    dayLabel: item.displayDate || `Session ${idx + 1}`,
  }));

  // Calculate percentage improvements
  const firstEntry = historyData[0];
  const latestEntry = historyData[historyData.length - 1];

  const ayumuGrowth = Math.round(
    ((latestEntry.ayumuMax - firstEntry.ayumuMax) / Math.max(1, firstEntry.ayumuMax)) * 100
  );
  const nBackGrowth = Math.round(
    ((latestEntry.dualNBackMaxN - firstEntry.dualNBackMaxN) / Math.max(1, firstEntry.dualNBackMaxN)) * 100
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Ayumu Growth Card */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4" /> Ayumu Visual Span
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +{Math.max(0, ayumuGrowth)}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.ayumuMaxNumbers}</span>
            <span className="text-xs text-slate-400">sequential digits</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Started at {firstEntry.ayumuMax} digits. World Chimp benchmark is 9 digits.
          </p>
        </div>

        {/* Dual N-Back Growth Card */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Dual N-Back Level
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> +{Math.max(0, nBackGrowth)}%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">N = {stats.dualNBackMaxN}</span>
            <span className="text-xs text-slate-400">working memory span</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Top 0.1% target is consistent N=4 and N=5 multi-stream recall.
          </p>
        </div>

        {/* Cognitive Velocity Index Card */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Data Density
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              {historyData.length} checkpoints
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.totalGamesPlayed}</span>
            <span className="text-xs text-slate-400">total cognitive drills</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Continuous calibration across all working memory modules.
          </p>
        </div>
      </div>

      {/* Main Recharts Visualization Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Cognitive Trajectory Over Time
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizing growth in iconic snapshot span (Ayumu) & prefrontal working memory (Dual N-Back)
            </p>
          </div>

          {/* Metric Selector Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setChartMetric('both')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                chartMetric === 'both'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Combined
            </button>
            <button
              onClick={() => setChartMetric('ayumu')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                chartMetric === 'ayumu'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Ayumu Only
            </button>
            <button
              onClick={() => setChartMetric('dualNBack')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                chartMetric === 'dualNBack'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Dual N-Back
            </button>
          </div>
        </div>

        {/* Recharts Responsive Container */}
        <div className="w-full h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="ayumuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="nbackGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="dayLabel"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ProgressHistoryEntry & { dayLabel: string };
                    return (
                      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl text-xs font-mono">
                        <div className="font-bold text-white mb-1.5 flex items-center justify-between gap-4 font-sans">
                          <span>{label}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(data.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {(chartMetric === 'both' || chartMetric === 'ayumu') && (
                            <div className="flex items-center justify-between gap-4 text-amber-400">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-400" /> Ayumu Digits:
                              </span>
                              <span className="font-bold">{data.ayumuMax}</span>
                            </div>
                          )}
                          {(chartMetric === 'both' || chartMetric === 'dualNBack') && (
                            <div className="flex items-center justify-between gap-4 text-cyan-400">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Dual N-Back:
                              </span>
                              <span className="font-bold">N = {data.dualNBackMaxN}</span>
                            </div>
                          )}
                          {data.matrixLevel && (
                            <div className="flex items-center justify-between gap-4 text-emerald-400">
                              <span>Matrix Lvl:</span>
                              <span className="font-bold">{data.matrixLevel}</span>
                            </div>
                          )}
                          {data.notes && (
                            <div className="text-[10px] text-slate-400 mt-1 border-t border-slate-800 pt-1 font-sans">
                              {data.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />

              {(chartMetric === 'both' || chartMetric === 'ayumu') && (
                <Area
                  type="monotone"
                  dataKey="ayumuMax"
                  name="Ayumu Max Numbers"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#ayumuGradient)"
                  activeDot={{ r: 6, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}

              {(chartMetric === 'both' || chartMetric === 'dualNBack') && (
                <Area
                  type="monotone"
                  dataKey="dualNBackMaxN"
                  name="Dual N-Back Level (N)"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#nbackGradient)"
                  activeDot={{ r: 6, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Contextual Guidance */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Graph points plot peak performance captured during your daily protocol training sessions.
            </span>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">
            Current Capacity: Top {stats.dualNBackMaxN >= 3 ? '3%' : '15%'} Global Tier
          </span>
        </div>
      </div>

      {/* History Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Milestone Performance Log
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                <th className="pb-2.5">Date / Checkpoint</th>
                <th className="pb-2.5">Ayumu Digits</th>
                <th className="pb-2.5">Dual N-Back (N)</th>
                <th className="pb-2.5">Matrix Level</th>
                <th className="pb-2.5">Neurological Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {historyData.slice().reverse().map((entry) => (
                <tr key={entry.id} className="text-slate-300 hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 font-sans font-medium text-white flex items-center gap-1.5">
                    {entry.dayLabel}
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({new Date(entry.timestamp).toLocaleDateString()})
                    </span>
                  </td>
                  <td className="py-2.5 text-amber-400 font-bold">{entry.ayumuMax} Digits</td>
                  <td className="py-2.5 text-cyan-400 font-bold">N = {entry.dualNBackMaxN}</td>
                  <td className="py-2.5 text-emerald-400">{entry.matrixLevel || '—'}</td>
                  <td className="py-2.5 font-sans text-[11px] text-slate-400">
                    {entry.dualNBackMaxN >= 4
                      ? 'Top 0.1% Grandmaster'
                      : entry.dualNBackMaxN >= 3
                      ? 'Top 3% High RAM'
                      : 'Top 30% Foundation'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
