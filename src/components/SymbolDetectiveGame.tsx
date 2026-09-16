import React, { useState, useEffect, useRef } from 'react';
import { FlashSpeed, SymbolShape, SymbolColor, DetectiveItem, DetectiveQuestion } from '../types';
import { sound } from '../utils/audio';
import { FLASH_SPEED_OPTIONS } from '../utils/storage';
import { getDetectiveAdaptiveConfig } from '../utils/dayRestrictions';
import {
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Shield,
  Star,
  Heart,
  Zap,
  Triangle,
  Circle,
  Square,
  Diamond,
  Sliders,
  Clock,
} from 'lucide-react';

interface SymbolDetectiveGameProps {
  currentSpeed: FlashSpeed;
  onSpeedChange: (speed: FlashSpeed) => void;
  onAddXp: (amount: number) => void;
  onRecordResult: (isSuccess: boolean, score: number) => void;
  curriculumDay?: number;
  playerLevel?: number;
}

const SHAPES: SymbolShape[] = ['star', 'shield', 'heart', 'zap', 'triangle', 'circle', 'square', 'diamond'];
const COLORS: { name: SymbolColor; bgClass: string; textClass: string }[] = [
  { name: 'red', bgClass: 'bg-rose-500/20 border-rose-500 text-rose-400', textClass: 'text-rose-400' },
  { name: 'blue', bgClass: 'bg-blue-500/20 border-blue-500 text-blue-400', textClass: 'text-blue-400' },
  { name: 'emerald', bgClass: 'bg-emerald-500/20 border-emerald-500 text-emerald-400', textClass: 'text-emerald-400' },
  { name: 'amber', bgClass: 'bg-amber-500/20 border-amber-500 text-amber-400', textClass: 'text-amber-400' },
  { name: 'purple', bgClass: 'bg-purple-500/20 border-purple-500 text-purple-400', textClass: 'text-purple-400' },
  { name: 'cyan', bgClass: 'bg-cyan-500/20 border-cyan-500 text-cyan-400', textClass: 'text-cyan-400' },
];

function renderShapeIcon(shape: SymbolShape, className = 'w-6 h-6') {
  switch (shape) {
    case 'star':
      return <Star className={`${className} fill-current`} />;
    case 'shield':
      return <Shield className={`${className} fill-current`} />;
    case 'heart':
      return <Heart className={`${className} fill-current`} />;
    case 'zap':
      return <Zap className={`${className} fill-current`} />;
    case 'triangle':
      return <Triangle className={`${className} fill-current`} />;
    case 'circle':
      return <Circle className={`${className} fill-current`} />;
    case 'square':
      return <Square className={`${className} fill-current`} />;
    case 'diamond':
      return <Diamond className={`${className} fill-current`} />;
  }
}

export const SymbolDetectiveGame: React.FC<SymbolDetectiveGameProps> = ({
  currentSpeed,
  onAddXp,
  onRecordResult,
  curriculumDay = 1,
  playerLevel = 1,
}) => {
  const GRID_SIZE = 3; // 3x3 = 9 items
  const adaptiveConfig = getDetectiveAdaptiveConfig(curriculumDay, playerLevel);

  const [stage, setStage] = useState<'idle' | 'countdown' | 'flashing' | 'question' | 'result'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [items, setItems] = useState<DetectiveItem[]>([]);
  const [question, setQuestion] = useState<DetectiveQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  // Adaptive timing state with manual speed options
  const [selectedSpeedMs, setSelectedSpeedMs] = useState<number>(adaptiveConfig.flashTimeMs);
  const [flashProgress, setFlashProgress] = useState(100);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentOption = FLASH_SPEED_OPTIONS.find((o) => o.value === currentSpeed) || FLASH_SPEED_OPTIONS[1];

  // Update speed default if curriculumDay or playerLevel changes
  useEffect(() => {
    setSelectedSpeedMs(adaptiveConfig.flashTimeMs);
  }, [curriculumDay, playerLevel]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const generateBoardAndQuestion = (): { board: DetectiveItem[]; q: DetectiveQuestion } => {
    const board: DetectiveItem[] = [];
    let id = 0;
    for (let r = 1; r <= GRID_SIZE; r++) {
      for (let c = 1; c <= GRID_SIZE; c++) {
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)].name;
        board.push({ id: id++, row: r, col: c, shape, color });
      }
    }

    // Pick a question type
    const qTypes: DetectiveQuestion['questionType'][] = ['position', 'color', 'shape'];
    const chosenType = qTypes[Math.floor(Math.random() * qTypes.length)];

    let q: DetectiveQuestion;

    if (chosenType === 'position') {
      const targetItem = board[Math.floor(Math.random() * board.length)];
      const otherShapes = SHAPES.filter((s) => s !== targetItem.shape);
      const shuffledOptions = [targetItem.shape, ...otherShapes.slice(0, 3)].sort(() => 0.5 - Math.random());

      q = {
        prompt: `Which symbol was located at Row ${targetItem.row}, Column ${targetItem.col}?`,
        options: shuffledOptions,
        correctAnswer: targetItem.shape,
        targetRow: targetItem.row,
        targetCol: targetItem.col,
        questionType: 'position',
      };
    } else if (chosenType === 'color') {
      const targetItem = board[Math.floor(Math.random() * board.length)];
      const otherColors = COLORS.filter((c) => c.name !== targetItem.color).map((c) => c.name);
      const shuffledOptions = [targetItem.color, ...otherColors.slice(0, 3)].sort(() => 0.5 - Math.random());

      q = {
        prompt: `What color was the ${targetItem.shape.toUpperCase()} at Row ${targetItem.row}, Column ${targetItem.col}?`,
        options: shuffledOptions,
        correctAnswer: targetItem.color,
        targetRow: targetItem.row,
        targetCol: targetItem.col,
        questionType: 'color',
      };
    } else {
      const targetItem = board[Math.floor(Math.random() * board.length)];
      const otherShapes = SHAPES.filter((s) => s !== targetItem.shape);
      const shuffledOptions = [targetItem.shape, ...otherShapes.slice(0, 3)].sort(() => 0.5 - Math.random());

      q = {
        prompt: `In Row ${targetItem.row}, Column ${targetItem.col}, which icon was displayed?`,
        options: shuffledOptions,
        correctAnswer: targetItem.shape,
        targetRow: targetItem.row,
        targetCol: targetItem.col,
        questionType: 'shape',
      };
    }

    return { board, q };
  };

  const startRound = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    const { board, q } = generateBoardAndQuestion();
    setItems(board);
    setQuestion(q);
    setSelectedAnswer(null);
    setIsCorrect(false);
    setStage('countdown');
    setCountdown(3);
    setFlashProgress(100);
    sound.playTick();

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        sound.playTick();
      } else {
        clearInterval(interval);
        triggerExposure();
      }
    }, 550);
  };

  const triggerExposure = () => {
    setStage('flashing');
    sound.playFlash();
    setFlashProgress(100);

    const startTime = Date.now();
    const duration = selectedSpeedMs;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setFlashProgress(remainingPct);
      if (remainingPct <= 0 && progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }, 40);

    timerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setFlashProgress(0);
      setStage('question');
    }, duration);
  };

  const handleSelectOption = (option: string) => {
    if (stage !== 'question' || !question) return;

    setSelectedAnswer(option);
    const success = option.toLowerCase() === question.correctAnswer.toLowerCase();
    setIsCorrect(success);

    if (success) {
      sound.playSuccess();
      const base = 40;
      const totalXp = Math.round(base * currentOption.xpMultiplier);
      onAddXp(totalXp);
      setScore((s) => s + 1);
      onRecordResult(true, score + 1);
    } else {
      sound.playError();
      onRecordResult(false, score);
    }

    setStage('result');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-800/60 flex items-center gap-1">
                Chromatic Feature Snapshot
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  adaptiveConfig.tierName === 'Beginner'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70'
                    : adaptiveConfig.tierName === 'Intermediate'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600/70'
                    : 'bg-amber-950/80 text-amber-300 border-amber-600/70'
                }`}
              >
                {adaptiveConfig.tierName} Status • Day {curriculumDay} (Lv {playerLevel})
              </span>
              <span className="text-[10px] bg-slate-800 text-purple-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                Exposure: {(selectedSpeedMs / 1000).toFixed(1)}s
              </span>
              <span className="text-xs text-slate-400">
                Score: <strong className="text-white">{score}</strong>
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Symbol & Color Detective
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Snapshot both the shape identities and color channels across the 3x3 matrix.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 px-4 py-2 rounded-xl text-center">
            <div className="text-xs text-slate-400">Current Score</div>
            <div className="text-xl font-black text-purple-300">{score}</div>
          </div>
        </div>
      </div>

      {/* Main Board */}
      <div className="flex flex-col items-center">
        <div className="relative p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-[540px]">
          {/* Timing Selector / Control (shown in idle state) */}
          {stage === 'idle' && (
            <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 mb-5 text-left animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  Calibrated Exposure Speed:
                </span>
                <span className="text-xs font-mono font-bold text-purple-300">
                  {(selectedSpeedMs / 1000).toFixed(1)}s
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {adaptiveConfig.availableSpeeds.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedSpeedMs(opt.value)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                      selectedSpeedMs === opt.value
                        ? 'bg-purple-600/30 border-purple-500 text-white shadow-sm ring-1 ring-purple-400/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                {adaptiveConfig.description}
              </p>
            </div>
          )}

          {/* Countdown */}
          {stage === 'countdown' && (
            <div className="absolute inset-0 bg-slate-950/85 z-20 rounded-3xl flex flex-col items-center justify-center backdrop-blur-xs">
              <span className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-2">
                Absorb Shape + Color Layers
              </span>
              <div className="text-6xl font-black text-white animate-pulse">
                {countdown}
              </div>
              <p className="text-xs text-slate-400 mt-2 font-mono">
                {(selectedSpeedMs / 1000).toFixed(1)}s exposure incoming...
              </p>
            </div>
          )}

          {/* Matrix Visual */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800/90 w-full aspect-square max-w-[400px]">
            {items.map((item) => {
              const isTargetCell =
                question?.targetRow === item.row && question?.targetCol === item.col;

              const colorDef = COLORS.find((c) => c.name === item.color) || COLORS[0];

              let cellStyle = 'bg-slate-800/40 border-slate-800';
              let showContent = false;

              if (stage === 'flashing') {
                cellStyle = `${colorDef.bgClass} shadow-md`;
                showContent = true;
              } else if (stage === 'result') {
                if (isTargetCell) {
                  cellStyle = `${colorDef.bgClass} ring-2 ring-purple-400 shadow-lg`;
                  showContent = true;
                } else {
                  cellStyle = 'bg-slate-800/30 border-slate-800 opacity-40';
                }
              }

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border flex flex-col items-center justify-center relative transition-all duration-200 ${cellStyle}`}
                >
                  {/* Coordinate Label */}
                  <span className="absolute top-1.5 left-2 text-[9px] font-mono text-slate-500">
                    R{item.row}:C{item.col}
                  </span>

                  {showContent && (
                    <div className="flex flex-col items-center justify-center animate-scale">
                      {renderShapeIcon(item.shape, 'w-8 h-8')}
                      <span className="text-[10px] font-bold uppercase mt-1 tracking-wider opacity-80">
                        {item.color}
                      </span>
                    </div>
                  )}

                  {!showContent && stage === 'question' && isTargetCell && (
                    <span className="text-sm font-black text-purple-400 animate-bounce">
                      ?
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Flash Exposure Progress Bar */}
          {stage === 'flashing' && (
            <div className="w-full max-w-[400px] mt-3 animate-fade-in">
              <div className="flex justify-between items-center text-[10px] text-purple-300 font-bold mb-1">
                <span>Absorbing Shape & Color Matrix...</span>
                <span className="font-mono">{(selectedSpeedMs / 1000).toFixed(1)}s</span>
              </div>
              <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden border border-slate-700/50">
                <div
                  className="bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-400 h-full transition-all duration-75 ease-linear"
                  style={{ width: `${flashProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Question / Interaction Panel */}
          <div className="w-full mt-6 flex flex-col items-center">
            {stage === 'idle' && (
              <button
                onClick={startRound}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all active:scale-98"
              >
                <Play className="w-4 h-4 fill-white" />
                Snapshot 3x3 Feature Grid ({(selectedSpeedMs / 1000).toFixed(1)}s)
              </button>
            )}

            {stage === 'question' && question && (
              <div className="w-full animate-fade-in">
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-center mb-4">
                  <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold block mb-1">
                    Visual Cortex Recall Prompt
                  </span>
                  <p className="text-sm font-bold text-white">
                    {question.prompt}
                  </p>
                </div>

                {/* 4 Choices */}
                <div className="grid grid-cols-2 gap-2.5">
                  {question.options.map((opt) => {
                    const isShape = SHAPES.includes(opt as SymbolShape);
                    const isCol = COLORS.some((c) => c.name === opt);

                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectOption(opt)}
                        className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-white font-semibold text-xs transition-all hover:border-purple-500 flex items-center justify-center gap-2 capitalize shadow-sm"
                      >
                        {isShape && renderShapeIcon(opt as SymbolShape, 'w-4 h-4 text-purple-400')}
                        {isCol && (
                          <span
                            className="w-3.5 h-3.5 rounded-full inline-block"
                            style={{
                              backgroundColor:
                                opt === 'red'
                                  ? '#f43f5e'
                                  : opt === 'blue'
                                  ? '#3b82f6'
                                  : opt === 'emerald'
                                  ? '#10b981'
                                  : opt === 'amber'
                                  ? '#f59e0b'
                                  : opt === 'purple'
                                  ? '#a855f7'
                                  : '#06b6d4',
                            }}
                          />
                        )}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {stage === 'result' && question && (
              <div className="w-full text-center animate-fade-in">
                <div
                  className={`flex items-center justify-center gap-2 font-bold text-base mb-1 ${
                    isCorrect ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Retinal Detail Perfect!
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" /> Detail Discrepancy
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-300 mb-4">
                  Correct answer was{' '}
                  <strong className="text-purple-300 uppercase">
                    {question.correctAnswer}
                  </strong>
                  . Compare with the highlighted cell above.
                </p>

                <button
                  onClick={startRound}
                  className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Next Snapshot Challenge
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Visual Tip */}
        <div className="max-w-[540px] w-full mt-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-slate-300 text-xs flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-purple-950 border border-purple-800 text-purple-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Binding Feature Theory & Acclimation</span>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              In neuroscience, the brain processes color (V4 area) and shape (lateral occipital cortex) through separate visual streams before "binding" them. Beginner timing starts with generous exposure (~3.8s) to establish neural pathways without panic, and progressively tightens as synaptic speed increases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
