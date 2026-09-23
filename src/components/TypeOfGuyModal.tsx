import React, { useState } from 'react';
import { AthleteArchetype } from '../types';
import { ALL_ARCHETYPES_CATALOG } from '../utils/archetype';
import { sound } from '../utils/audio';
import {
  X,
  Sparkles,
  Share2,
  Check,
  Award,
  Clock,
  Flame,
  Brain,
  Zap,
  Shield,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Compass,
} from 'lucide-react';

interface TypeOfGuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  archetype: AthleteArchetype;
}

export const TypeOfGuyModal: React.FC<TypeOfGuyModalProps> = ({
  isOpen,
  onClose,
  archetype,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(archetype.shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const radarItems = [
    { label: 'Focus Stamina', value: archetype.radarScores.focusStamina, color: 'bg-emerald-500', icon: <Clock className="w-3 h-3 text-emerald-400" /> },
    { label: 'Retinal Shutter Speed', value: archetype.radarScores.shutterSpeed, color: 'bg-amber-400', icon: <Zap className="w-3 h-3 text-amber-400" /> },
    { label: 'RAM Buffer Capacity', value: archetype.radarScores.ramBuffer, color: 'bg-cyan-400', icon: <Brain className="w-3 h-3 text-cyan-400" /> },
    { label: 'Spatial Mapping', value: archetype.radarScores.spatialMapping, color: 'bg-purple-400', icon: <Layers className="w-3 h-3 text-purple-400" /> },
    { label: 'Iron Discipline', value: archetype.radarScores.ironDiscipline, color: 'bg-rose-500', icon: <Flame className="w-3 h-3 text-rose-400" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 text-slate-100 my-auto overflow-hidden ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative background aura */}
        <div className={`absolute -top-32 -left-32 w-72 h-72 rounded-full bg-gradient-to-tr ${archetype.auraGradient} opacity-20 blur-3xl pointer-events-none`} />
        <div className={`absolute -bottom-32 -right-32 w-72 h-72 rounded-full bg-gradient-to-bl ${archetype.auraGradient} opacity-20 blur-3xl pointer-events-none`} />

        {/* Top bar */}
        <div className="relative flex items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{archetype.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/90 px-2 py-0.5 rounded-full border border-cyan-800/60">
                  Cognitive Persona Diagnostic
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-800/80 ${archetype.borderAccent} ${archetype.textAccent}`}>
                  {archetype.tierName} (Tier {archetype.tierLevel})
                </span>
              </div>
              <h3 className="text-xs font-semibold text-slate-400 mt-0.5">
                Calculated from your all-time training time & cognitive habits
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Archetype Hero Card */}
        <div className={`relative rounded-2xl border p-5 mb-5 bg-gradient-to-br from-slate-900/90 via-slate-900/95 to-slate-950 ${archetype.borderAccent} shadow-xl overflow-hidden`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400 mb-1 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Your Memory Athlete Type:
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{archetype.title}</span>
              </h2>
              <p className={`text-xs sm:text-sm font-medium mt-1 ${archetype.textAccent}`}>
                {archetype.subtitle}
              </p>
            </div>

            {/* Total Training Hours Badge */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 text-center sm:text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-center sm:justify-end gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                All-Time Training Time
              </div>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {archetype.allTimeHours > 0 ? (
                  <>
                    {archetype.allTimeHours} <span className="text-xs font-normal text-slate-400">hrs</span>
                  </>
                ) : (
                  <>
                    {archetype.allTimeMinutes} <span className="text-xs font-normal text-slate-400">min</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-slate-400">
                {archetype.allTimeMinutes} total minutes • {archetype.sessionsCount} sessions
              </div>
            </div>
          </div>

          {/* Primary Dominance */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400">
              Neural Specialization: <strong className="text-slate-200">{archetype.primaryDominance}</strong>
            </span>
            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-lg">
              {archetype.badge}
            </span>
          </div>
        </div>

        {/* Cognitive Attribute Radar / Sliders */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-5">
          <div className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Neural Attribute Distribution (Calibrated to Your Training)
          </div>

          <div className="space-y-2.5">
            {radarItems.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    {item.icon}
                    {item.label}
                  </span>
                  <span className="font-mono font-bold text-slate-200">{item.value}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`${item.color} h-full rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Persona Traits Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
              <span>🏠</span> Natural Habitat
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">{archetype.traits.naturalHabitat}</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
              <span>⚡</span> Greatest Superpower
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">{archetype.traits.cognitiveSuperpower}</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
              <span>🚩</span> The "Red Flag"
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">{archetype.traits.redFlag}</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5 mb-1">
              <span>💬</span> Life Motto
            </div>
            <p className="text-xs text-slate-200 italic leading-relaxed">{archetype.traits.lifeMotto}</p>
          </div>
        </div>

        {/* Quirky Neuro Fact */}
        <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-3 mb-5 flex items-start gap-2.5">
          <span className="text-lg">💡</span>
          <div className="text-xs text-indigo-200">
            <strong className="text-white block font-bold mb-0.5">Neuro-Telemetry Note:</strong>
            {archetype.traits.quirkyFact}
          </div>
        </div>

        {/* Milestone Evolution Bar */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mb-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Next Evolution: <span className="text-amber-300 font-bold">{archetype.nextMilestone.targetLabel}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {archetype.nextMilestone.minutesRemaining > 0
                ? `${archetype.nextMilestone.minutesRemaining}m training remaining`
                : 'Milestone Cleared!'}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${archetype.nextMilestone.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Actions & Catalog Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              setShowCatalog(!showCatalog);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-semibold cursor-pointer"
          >
            <span>Compare All 9 Archetypes</span>
            {showCatalog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950" />
                  <span>Card Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-950" />
                  <span>Share / Copy Card</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible 9 Archetypes Catalog */}
        {showCatalog && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2.5 max-h-64 overflow-y-auto pr-1 animate-fade-in">
            <div className="text-xs font-bold text-slate-400 mb-2">The 9 Memory Athlete Archetypes:</div>
            {ALL_ARCHETYPES_CATALOG.map((cat) => {
              const isCurrent = cat.id === archetype.id;
              return (
                <div
                  key={cat.id}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-bold flex items-center gap-1.5 text-white">
                      <span>{cat.emoji}</span>
                      <span>{cat.title}</span>
                      {isCurrent && (
                        <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-black uppercase">
                          Your Current
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{cat.badge}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-snug">{cat.description}</p>
                  <div className="text-[10px] text-amber-300/80 mt-1 font-mono">Unlock: {cat.unlockCondition}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
