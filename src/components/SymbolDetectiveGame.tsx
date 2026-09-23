import React, { useState, useEffect, useRef } from 'react';
import {
  FlashSpeed,
  SymbolShape,
  SymbolColor,
  DetectiveItem,
  DetectiveQuestion,
  DetectiveLabMode,
} from '../types';
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
  Search,
  Layers,
  Eye,
  Hash,
  Flame,
  Award,
  HelpCircle,
  Grid2X2,
  Grid3X3,
  Target,
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
const COLORS: { name: SymbolColor; bgClass: string; textClass: string; hex: string }[] = [
  { name: 'red', bgClass: 'bg-rose-500/20 border-rose-500 text-rose-400', textClass: 'text-rose-400', hex: '#f43f5e' },
  { name: 'blue', bgClass: 'bg-blue-500/20 border-blue-500 text-blue-400', textClass: 'text-blue-400', hex: '#3b82f6' },
  { name: 'emerald', bgClass: 'bg-emerald-500/20 border-emerald-500 text-emerald-400', textClass: 'text-emerald-400', hex: '#10b981' },
  { name: 'amber', bgClass: 'bg-amber-500/20 border-amber-500 text-amber-400', textClass: 'text-amber-400', hex: '#f59e0b' },
  { name: 'purple', bgClass: 'bg-purple-500/20 border-purple-500 text-purple-400', textClass: 'text-purple-400', hex: '#a855f7' },
  { name: 'cyan', bgClass: 'bg-cyan-500/20 border-cyan-500 text-cyan-400', textClass: 'text-cyan-400', hex: '#06b6d4' },
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
  onSpeedChange,
  onAddXp,
  onRecordResult,
  curriculumDay = 1,
  playerLevel = 1,
}) => {
  const adaptiveConfig = getDetectiveAdaptiveConfig(curriculumDay, playerLevel);

  // Lab Configuration
  const [labMode, setLabMode] = useState<DetectiveLabMode>('matrix-binding');
  const [gridDim, setGridDim] = useState<2 | 3 | 4>(3);
  const [selectedSpeedMs, setSelectedSpeedMs] = useState<number>(adaptiveConfig.flashTimeMs);

  // Game Loop State
  const [stage, setStage] = useState<'idle' | 'countdown' | 'flashing' | 'change-gap' | 'flashing-b' | 'question' | 'result'>('idle');
  const [countdown, setCountdown] = useState(3);
  const [items, setItems] = useState<DetectiveItem[]>([]);
  const [itemsFrameB, setItemsFrameB] = useState<DetectiveItem[]>([]);
  const [question, setQuestion] = useState<DetectiveQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [flashProgress, setFlashProgress] = useState(100);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(0);

  const currentOption = FLASH_SPEED_OPTIONS.find((o) => o.value === selectedSpeedMs) || FLASH_SPEED_OPTIONS[1];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Update speed default if curriculumDay or playerLevel changes
  useEffect(() => {
    setSelectedSpeedMs(adaptiveConfig.flashTimeMs);
  }, [curriculumDay, playerLevel]);

  // Protocol 1: Chromatic Matrix Feature Binding
  const generateMatrixBinding = (size: number): { board: DetectiveItem[]; q: DetectiveQuestion } => {
    const board: DetectiveItem[] = [];
    let id = 0;
    for (let r = 1; r <= size; r++) {
      for (let c = 1; c <= size; c++) {
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)].name;
        board.push({ id: id++, row: r, col: c, shape, color });
      }
    }

    const qTypes: ('position' | 'color' | 'shape')[] = ['position', 'color', 'shape'];
    const chosenType = qTypes[Math.floor(Math.random() * qTypes.length)];
    const targetItem = board[Math.floor(Math.random() * board.length)];

    let q: DetectiveQuestion;

    if (chosenType === 'position') {
      const otherShapes = SHAPES.filter((s) => s !== targetItem.shape);
      const shuffledOptions = [targetItem.shape, ...otherShapes.slice(0, 3)].sort(() => 0.5 - Math.random());
      q = {
        prompt: `Which symbol was bound to Row ${targetItem.row}, Column ${targetItem.col}?`,
        options: shuffledOptions,
        correctAnswer: targetItem.shape,
        targetRow: targetItem.row,
        targetCol: targetItem.col,
        targetShape: targetItem.shape,
        targetColor: targetItem.color,
        questionType: 'position',
        explanation: `Row ${targetItem.row}, Col ${targetItem.col} contained a ${targetItem.color.toUpperCase()} ${targetItem.shape.toUpperCase()}.`,
      };
    } else if (chosenType === 'color') {
      const otherColors = COLORS.filter((c) => c.name !== targetItem.color).map((c) => c.name);
      const shuffledOptions = [targetItem.color, ...otherColors.slice(0, 3)].sort(() => 0.5 - Math.random());
      q = {
        prompt: `What color channel was bound to the ${targetItem.shape.toUpperCase()} at Row ${targetItem.row}, Column ${targetItem.col}?`,
        options: shuffledOptions,
        correctAnswer: targetItem.color,
        targetRow: targetItem.row,
        targetCol: targetItem.col,
        targetShape: targetItem.shape,
        targetColor: targetItem.color,
        questionType: 'color',
        explanation: `The ${targetItem.shape.toUpperCase()} at Row ${targetItem.row}, Col ${targetItem.col} was ${targetItem.color.toUpperCase()}.`,
      };
    } else {
      const otherShapes = SHAPES.filter((s) => s !== targetItem.shape);
      const shuffledOptions = [targetItem.shape, ...otherShapes.slice(0, 3)].sort(() => 0.5 - Math.random());
      q = {
        prompt: `At Row ${targetItem.row}, Column ${targetItem.col}, identify the flashed symbol:`,
        options: shuffledOptions,
        correctAnswer: targetItem.shape,
        targetRow: targetItem.row,
        targetCol: targetItem.col,
        targetShape: targetItem.shape,
        targetColor: targetItem.color,
        questionType: 'shape',
        explanation: `Row ${targetItem.row}, Col ${targetItem.col} held a ${targetItem.color.toUpperCase()} ${targetItem.shape.toUpperCase()}.`,
      };
    }

    return { board, q };
  };

  // Protocol 2: Pre-Attentive Anomaly / Odd-One-Out Pop-Out
  const generateAnomalySearch = (size: number): { board: DetectiveItem[]; q: DetectiveQuestion } => {
    const board: DetectiveItem[] = [];
    const baseShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const baseColor = COLORS[Math.floor(Math.random() * COLORS.length)].name;

    const anomalyShape = SHAPES.filter((s) => s !== baseShape)[Math.floor(Math.random() * (SHAPES.length - 1))];
    const anomalyColor = COLORS.filter((c) => c.name !== baseColor)[Math.floor(Math.random() * (COLORS.length - 1))].name;

    const isShapeAnomaly = Math.random() > 0.5;
    const targetRow = Math.floor(Math.random() * size) + 1;
    const targetCol = Math.floor(Math.random() * size) + 1;

    let id = 0;
    for (let r = 1; r <= size; r++) {
      for (let c = 1; c <= size; c++) {
        const isAnomaly = r === targetRow && c === targetCol;
        board.push({
          id: id++,
          row: r,
          col: c,
          shape: isAnomaly ? (isShapeAnomaly ? anomalyShape : baseShape) : baseShape,
          color: isAnomaly ? (isShapeAnomaly ? baseColor : anomalyColor) : baseColor,
          isAnomaly,
        });
      }
    }

    const correctAns = `Row ${targetRow}, Col ${targetCol}`;
    const distractorOptions: string[] = [];
    while (distractorOptions.length < 3) {
      const dr = Math.floor(Math.random() * size) + 1;
      const dc = Math.floor(Math.random() * size) + 1;
      const opt = `Row ${dr}, Col ${dc}`;
      if (opt !== correctAns && !distractorOptions.includes(opt)) {
        distractorOptions.push(opt);
      }
    }

    const options = [correctAns, ...distractorOptions].sort(() => 0.5 - Math.random());

    const q: DetectiveQuestion = {
      prompt: `Where was the pre-attentive anomaly located? (Unique ${isShapeAnomaly ? 'shape' : 'color'})`,
      options,
      correctAnswer: correctAns,
      targetRow,
      targetCol,
      targetShape: isShapeAnomaly ? anomalyShape : baseShape,
      targetColor: isShapeAnomaly ? baseColor : anomalyColor,
      questionType: 'anomaly',
      explanation: `The odd-one-out was at Row ${targetRow}, Col ${targetCol} (${isShapeAnomaly ? anomalyShape : anomalyColor}).`,
    };

    return { board, q };
  };

  // Protocol 3: Change Blindness (Frame A -> ISI Gap -> Frame B)
  const generateChangeBlindness = (size: number): { boardA: DetectiveItem[]; boardB: DetectiveItem[]; q: DetectiveQuestion } => {
    const boardA: DetectiveItem[] = [];
    const boardB: DetectiveItem[] = [];
    const changeRow = Math.floor(Math.random() * size) + 1;
    const changeCol = Math.floor(Math.random() * size) + 1;

    let id = 0;
    for (let r = 1; r <= size; r++) {
      for (let c = 1; c <= size; c++) {
        const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const color = COLORS[Math.floor(Math.random() * COLORS.length)].name;
        boardA.push({ id: id, row: r, col: c, shape, color });

        const isChange = r === changeRow && c === changeCol;
        if (isChange) {
          const newShape = SHAPES.filter((s) => s !== shape)[0];
          boardB.push({ id: id, row: r, col: c, shape: newShape, color, hasChanged: true });
        } else {
          boardB.push({ id: id, row: r, col: c, shape, color });
        }
        id++;
      }
    }

    const correctAns = `Row ${changeRow}, Col ${changeCol}`;
    const distractorOptions: string[] = [];
    while (distractorOptions.length < 3) {
      const dr = Math.floor(Math.random() * size) + 1;
      const dc = Math.floor(Math.random() * size) + 1;
      const opt = `Row ${dr}, Col ${dc}`;
      if (opt !== correctAns && !distractorOptions.includes(opt)) {
        distractorOptions.push(opt);
      }
    }

    const q: DetectiveQuestion = {
      prompt: `Which coordinate altered between Flash A and Flash B?`,
      options: [correctAns, ...distractorOptions].sort(() => 0.5 - Math.random()),
      correctAnswer: correctAns,
      targetRow: changeRow,
      targetCol: changeCol,
      questionType: 'change',
      explanation: `Tile at Row ${changeRow}, Col ${changeCol} shifted shape across the inter-stimulus interval.`,
    };

    return { boardA, boardB, q };
  };

  // Protocol 4: Subitizing & Feature Counter
  const generateFeatureCounter = (size: number): { board: DetectiveItem[]; q: DetectiveQuestion } => {
    const board: DetectiveItem[] = [];
    const targetShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)].name;

    // Pick random target count between 2 and Math.min(6, size * size - 2)
    const countTarget = Math.floor(Math.random() * 4) + 2; // 2 to 5
    const totalCells = size * size;
    const targetIndices = new Set<number>();
    while (targetIndices.size < countTarget) {
      targetIndices.add(Math.floor(Math.random() * totalCells));
    }

    let id = 0;
    for (let r = 1; r <= size; r++) {
      for (let c = 1; c <= size; c++) {
        const isTarget = targetIndices.has(id);
        if (isTarget) {
          board.push({ id: id++, row: r, col: c, shape: targetShape, color: targetColor });
        } else {
          // ensure not an exact match of targetShape AND targetColor
          let s = SHAPES[Math.floor(Math.random() * SHAPES.length)];
          let col = COLORS[Math.floor(Math.random() * COLORS.length)].name;
          if (s === targetShape && col === targetColor) {
            col = COLORS.filter((c2) => c2.name !== targetColor)[0].name;
          }
          board.push({ id: id++, row: r, col: c, shape: s, color: col });
        }
      }
    }

    const correctAns = String(countTarget);
    const possibleCounts = [countTarget - 1, countTarget + 1, countTarget + 2]
      .filter((n) => n >= 1)
      .map(String);
    const options = [correctAns, ...possibleCounts.slice(0, 3)].sort((a, b) => Number(a) - Number(b));

    const q: DetectiveQuestion = {
      prompt: `How many ${targetColor.toUpperCase()} ${targetShape.toUpperCase()}S were in the matrix?`,
      options,
      correctAnswer: correctAns,
      targetShape,
      targetColor,
      questionType: 'count',
      explanation: `There were exactly ${countTarget} ${targetColor.toUpperCase()} ${targetShape.toUpperCase()}S scattered across the grid.`,
    };

    return { board, q };
  };

  const startRound = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    setStage('countdown');
    setCountdown(3);
    setSelectedAnswer(null);
    setIsCorrect(false);
    setFlashProgress(100);
    sound.playTick();

    if (labMode === 'change-blindness') {
      const { boardA, boardB, q } = generateChangeBlindness(gridDim);
      setItems(boardA);
      setItemsFrameB(boardB);
      setQuestion(q);
    } else if (labMode === 'anomaly-search') {
      const { board, q } = generateAnomalySearch(gridDim);
      setItems(board);
      setQuestion(q);
    } else if (labMode === 'feature-counter') {
      const { board, q } = generateFeatureCounter(gridDim);
      setItems(board);
      setQuestion(q);
    } else {
      const { board, q } = generateMatrixBinding(gridDim);
      setItems(board);
      setQuestion(q);
    }

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
    }, 450);
  };

  const triggerExposure = () => {
    sound.playFlash();
    setStage('flashing');
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
    }, 25);

    timerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setFlashProgress(0);

      if (labMode === 'change-blindness') {
        // Show 200ms ISI (inter-stimulus interval) gap, then Frame B
        setStage('change-gap');
        setTimeout(() => {
          setStage('flashing-b');
          sound.playFlash();
          setTimeout(() => {
            setStage('question');
            questionStartTimeRef.current = Date.now();
          }, duration);
        }, 220);
      } else {
        setStage('question');
        questionStartTimeRef.current = Date.now();
      }
    }, duration);
  };

  const handleSelectOption = (option: string) => {
    if (stage !== 'question' || !question) return;

    const reactionTime = Date.now() - questionStartTimeRef.current;
    setReactionTimes((prev) => [...prev.slice(-9), reactionTime]);
    setSelectedAnswer(option);

    const success = option.toLowerCase() === question.correctAnswer.toLowerCase();
    setIsCorrect(success);
    setTotalAttempts((a) => a + 1);

    if (success) {
      sound.playSuccess();
      const speedMult = currentOption.xpMultiplier;
      const gridMult = gridDim === 4 ? 2.0 : gridDim === 3 ? 1.4 : 1.0;
      const base = 45;
      const totalXp = Math.round(base * speedMult * gridMult);
      onAddXp(totalXp);
      setScore((s) => s + 1);
      setTotalCorrect((c) => c + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak((b) => Math.max(b, newStreak));
      onRecordResult(true, score + 1);
    } else {
      sound.playError();
      setStreak(0);
      onRecordResult(false, score);
    }

    setStage('result');
  };

  const accuracyPct = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 100;
  const avgReactionTime = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Lab Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-5 shadow-xl relative overflow-hidden backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/90 px-2.5 py-0.5 rounded-full border border-purple-800/60 flex items-center gap-1">
                <Search className="w-3 h-3 text-purple-400" />
                Cognitive Visual Lab
              </span>
              <span className="text-[10px] bg-slate-800 text-purple-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                Exposure: {(selectedSpeedMs / 1000).toFixed(2)}s
              </span>
              <span className="text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
                Grid: {gridDim}x{gridDim} ({gridDim * gridDim} Cells)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              Symbol Detective Laboratory
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-paradigm visual cortex research: Feature binding, pre-attentive search, change blindness & parallel subitizing.
            </p>
          </div>

          {/* Telemetry Chips */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Streak</span>
              <span className="text-base sm:text-lg font-black text-amber-400 flex items-center justify-center gap-0.5">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                {streak}
              </span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Accuracy</span>
              <span className="text-base sm:text-lg font-black text-emerald-400">{accuracyPct}%</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Score</span>
              <span className="text-base sm:text-lg font-black text-purple-300">{score}</span>
            </div>
          </div>
        </div>

        {/* Lab Protocol Switcher Tabs */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => {
              if (stage === 'idle' || stage === 'result') {
                sound.playClick();
                setLabMode('matrix-binding');
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              labMode === 'matrix-binding'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            1. Feature Binding
          </button>

          <button
            onClick={() => {
              if (stage === 'idle' || stage === 'result') {
                sound.playClick();
                setLabMode('anomaly-search');
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              labMode === 'anomaly-search'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            2. Anomaly Pop-Out
          </button>

          <button
            onClick={() => {
              if (stage === 'idle' || stage === 'result') {
                sound.playClick();
                setLabMode('change-blindness');
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              labMode === 'change-blindness'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            3. Change Blindness
          </button>

          <button
            onClick={() => {
              if (stage === 'idle' || stage === 'result') {
                sound.playClick();
                setLabMode('feature-counter');
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              labMode === 'feature-counter'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            4. Parallel Subitizing
          </button>
        </div>
      </div>

      {/* Main Lab Experiment Arena */}
      <div className="flex flex-col items-center">
        <div className="relative p-4 sm:p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-[560px]">
          {/* Controls Bar (shown when idle) */}
          {(stage === 'idle' || stage === 'result') && (
            <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 mb-4 text-left animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  Calibrate Shutter Speed:
                </span>
                <span className="text-xs font-mono font-bold text-purple-300">
                  {selectedSpeedMs}ms ({currentOption.label})
                </span>
              </div>

              {/* Speed Buttons */}
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {FLASH_SPEED_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      sound.playClick();
                      setSelectedSpeedMs(opt.value);
                      onSpeedChange(opt.value);
                    }}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      selectedSpeedMs === opt.value
                        ? 'bg-purple-600/40 border-purple-500 text-white shadow-sm ring-1 ring-purple-400/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-[8px] opacity-70">{opt.tag}</div>
                  </button>
                ))}
              </div>

              {/* Grid Dimensions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400 font-medium">Matrix Architecture:</span>
                <div className="flex items-center gap-1.5">
                  {[2, 3, 4].map((dim) => (
                    <button
                      key={dim}
                      onClick={() => {
                        sound.playClick();
                        setGridDim(dim as 2 | 3 | 4);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        gridDim === dim
                          ? 'bg-purple-600/30 border-purple-400 text-purple-300 ring-1 ring-purple-400/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {dim}x{dim}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Countdown Overlay */}
          {stage === 'countdown' && (
            <div className="absolute inset-0 bg-slate-950/90 z-20 rounded-3xl flex flex-col items-center justify-center backdrop-blur-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-2">
                {labMode === 'change-blindness' ? 'Prepare for Dual Frame Shift' : 'Absorb Feature Conjunctions'}
              </span>
              <div className="text-6xl font-black text-white animate-pulse">
                {countdown}
              </div>
              <p className="text-xs text-slate-400 mt-2 font-mono">
                {(selectedSpeedMs / 1000).toFixed(2)}s exposure incoming...
              </p>
            </div>
          )}

          {/* Change Gap ISI Overlay */}
          {stage === 'change-gap' && (
            <div className="absolute inset-0 bg-slate-950 z-20 rounded-3xl flex flex-col items-center justify-center">
              <span className="text-xs font-mono uppercase text-slate-500 animate-pulse">
                [Inter-Stimulus Retinal Interval]
              </span>
            </div>
          )}

          {/* Matrix Board */}
          <div
            className={`grid gap-2 sm:gap-2.5 p-3 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800/90 w-full aspect-square max-w-[420px] ${
              gridDim === 2 ? 'grid-cols-2' : gridDim === 4 ? 'grid-cols-4' : 'grid-cols-3'
            }`}
          >
            {(stage === 'flashing-b' ? itemsFrameB : items).map((item) => {
              const isTargetCell = question?.targetRow === item.row && question?.targetCol === item.col;
              const colorDef = COLORS.find((c) => c.name === item.color) || COLORS[0];

              let cellStyle = 'bg-slate-800/40 border-slate-800';
              let showContent = false;

              if (stage === 'flashing' || stage === 'flashing-b') {
                cellStyle = `${colorDef.bgClass} shadow-md`;
                showContent = true;
              } else if (stage === 'result') {
                if (isTargetCell || item.isAnomaly || item.hasChanged) {
                  cellStyle = `${colorDef.bgClass} ring-2 ring-purple-400 shadow-lg`;
                  showContent = true;
                } else if (question?.questionType === 'count' && item.shape === question.targetShape && item.color === question.targetColor) {
                  cellStyle = `${colorDef.bgClass} ring-2 ring-emerald-400 shadow-md`;
                  showContent = true;
                } else {
                  cellStyle = 'bg-slate-800/30 border-slate-800 opacity-40';
                }
              }

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border flex flex-col items-center justify-center relative transition-all duration-150 ${cellStyle}`}
                >
                  <span className="absolute top-1 left-1.5 text-[8px] font-mono text-slate-500">
                    {item.row}:{item.col}
                  </span>

                  {showContent && (
                    <div className="flex flex-col items-center justify-center animate-scale p-1">
                      {renderShapeIcon(item.shape, gridDim === 4 ? 'w-5 h-5' : 'w-7 h-7 sm:w-8 sm:h-8')}
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase mt-0.5 tracking-wider opacity-85">
                        {item.color}
                      </span>
                    </div>
                  )}

                  {!showContent && stage === 'question' && isTargetCell && (
                    <span className="text-base font-black text-purple-400 animate-bounce">
                      ?
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Flash Exposure Progress Bar */}
          {(stage === 'flashing' || stage === 'flashing-b') && (
            <div className="w-full max-w-[420px] mt-3 animate-fade-in">
              <div className="flex justify-between items-center text-[10px] text-purple-300 font-bold mb-1">
                <span>{stage === 'flashing-b' ? 'Absorbing Frame B...' : 'Absorbing Iconic Matrix...'}</span>
                <span className="font-mono">{(selectedSpeedMs / 1000).toFixed(2)}s</span>
              </div>
              <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden border border-slate-700/50">
                <div
                  className="bg-gradient-to-r from-purple-500 via-fuchsia-400 to-indigo-400 h-full transition-all duration-75 ease-linear"
                  style={{ width: `${flashProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action / Question Panel */}
          <div className="w-full mt-5 flex flex-col items-center">
            {stage === 'idle' && (
              <button
                onClick={startRound}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-600 to-purple-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all active:scale-98 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Launch {labMode === 'matrix-binding' ? 'Feature Binding' : labMode === 'anomaly-search' ? 'Anomaly Pop-Out' : labMode === 'change-blindness' ? 'Change Blindness' : 'Subitizing Counter'} ({(selectedSpeedMs / 1000).toFixed(2)}s)
              </button>
            )}

            {stage === 'question' && question && (
              <div className="w-full animate-fade-in">
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-center mb-3.5">
                  <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold block mb-1">
                    Visual Diagnostic Query
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
                        className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/90 border border-slate-700 text-white font-semibold text-xs transition-all hover:border-purple-500 flex items-center justify-center gap-2 capitalize shadow-sm cursor-pointer active:scale-98"
                      >
                        {isShape && renderShapeIcon(opt as SymbolShape, 'w-4 h-4 text-purple-400')}
                        {isCol && (
                          <span
                            className="w-3.5 h-3.5 rounded-full inline-block"
                            style={{
                              backgroundColor: COLORS.find((c) => c.name === opt)?.hex || '#fff',
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
                      <CheckCircle2 className="w-5 h-5" /> Retinal Binding Perfect! (+{Math.round(45 * currentOption.xpMultiplier)} XP)
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" /> Feature Discrepancy
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-300 mb-1">
                  {question.explanation || `Correct answer was ${question.correctAnswer}.`}
                </p>
                {avgReactionTime > 0 && (
                  <p className="text-[10px] text-slate-400 font-mono mb-3">
                    Recent Solve Time: ~{avgReactionTime}ms
                  </p>
                )}

                <button
                  onClick={startRound}
                  className="w-full py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <RotateCcw className="w-4 h-4" />
                  Next Lab Trial
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Neuro-Telemetry Lab Reference */}
        <div className="max-w-[560px] w-full mt-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-slate-300 text-xs flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-purple-950 border border-purple-800 text-purple-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">Visual Conjunction & Ventral Stream Dynamics</span>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              Feature binding requires simultaneous activation in area V4 (color constancy) and the lateral occipital complex (shape geometry), bound together by parieto-frontal attentional mechanisms. Training with sub-second shutter speeds forces parallel binding rather than slow serial scanning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
