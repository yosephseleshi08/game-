import React, { useState, useEffect, useRef } from 'react';
import { FlashSpeed, GameMode } from '../types';
import { sound } from '../utils/audio';
import { FLASH_SPEED_OPTIONS } from '../utils/storage';
import { getMaxAyumuDigitsForDay } from '../utils/dayRestrictions';
import { StrictDayLockoutView } from './StrictDayLockoutView';
import { Play, RotateCcw, Zap, Eye, Sparkles, Check, AlertTriangle, Flame, Lock } from 'lucide-react';

interface AyumuChimpGameProps {
  currentSpeed: FlashSpeed;
  curriculumDay: number;
  isLockedOut?: boolean;
  onSpeedChange: (speed: FlashSpeed) => void;
  onAddXp: (amount: number) => void;
  onRecordResult: (isSuccess: boolean, numbersCount: number) => void;
  onNavigateMode: (mode: GameMode) => void;
  isTaskCompleteToday?: boolean;
}

interface TileData {
  id: number;
  val: number; // 1..N
  cellIdx: number;
  status: 'revealed' | 'blanked' | 'cleared' | 'failed';
}

type ModeType = 'timed-flash' | 'first-touch-blank';

export const AyumuChimpGame: React.FC<AyumuChimpGameProps> = ({
  currentSpeed,
  curriculumDay,
  isLockedOut = false,
  onSpeedChange,
  onAddXp,
  onRecordResult,
  onNavigateMode,
  isTaskCompleteToday = false,
}) => {
  const dayLimit = getMaxAyumuDigitsForDay(curriculumDay);

  if (isLockedOut) {
    return (
      <StrictDayLockoutView
        curriculumDay={curriculumDay}
        gameTitle="Ayumu Numeric Sequence"
        onNavigateMode={onNavigateMode}
      />
    );
  }

  // 8 columns x 5 rows = 40 cells
  const COLS = 8;
  const ROWS = 5;
  const TOTAL_CELLS = COLS * ROWS;

  const [digitsCount, setDigitsCount] = useState(() => Math.min(5, dayLimit.maxDigits));
  const [triggerMode, setTriggerMode] = useState<ModeType>('timed-flash');
  const [stage, setStage] = useState<'idle' | 'countdown' | 'flashing' | 'playing' | 'success' | 'failed'>('idle');
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [nextExpectedNum, setNextExpectedNum] = useState(1);
  const [timeRemainingMs, setTimeRemainingMs] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [finishTimeMs, setFinishTimeMs] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [failedNum, setFailedNum] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentOption = FLASH_SPEED_OPTIONS.find((o) => o.value === currentSpeed) || FLASH_SPEED_OPTIONS[1];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const generateBoard = () => {
    const chosenCells = new Set<number>();
    while (chosenCells.size < digitsCount) {
      chosenCells.add(Math.floor(Math.random() * TOTAL_CELLS));
    }

    const cellArr = Array.from(chosenCells);
    const newTiles: TileData[] = cellArr.map((cellIdx, i) => ({
      id: i,
      val: i + 1,
      cellIdx,
      status: 'revealed',
    }));

    return newTiles;
  };

  const startRound = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const newTiles = generateBoard();
    setTiles(newTiles);
    setNextExpectedNum(1);
    setFailedNum(null);
    setStage('countdown');
    setCountdown(3);
    sound.playTick();

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        sound.playTick();
      } else {
        clearInterval(interval);
        startExposure(newTiles);
      }
    }, 550);
  };

  const startExposure = (currentTiles: TileData[]) => {
    setStage('flashing');
    sound.playFlash();
    setStartTime(Date.now());

    if (triggerMode === 'timed-flash') {
      // In timed-flash mode, numbers vanish after currentSpeed
      setTimeRemainingMs(currentSpeed);
      timerRef.current = setTimeout(() => {
        setTiles((prev) =>
          prev.map((t) => ({
            ...t,
            status: t.status === 'cleared' ? 'cleared' : 'blanked',
          }))
        );
        setStage('playing');
      }, currentSpeed);
    } else {
      // In first-touch mode, tiles remain visible until 1 is touched
      setStage('playing');
    }
  };

  const handleTileClick = (tile: TileData) => {
    if (stage !== 'playing' && stage !== 'flashing') return;
    if (tile.status === 'cleared') return;

    // If first-touch-blank mode and tapping #1, immediately blank all other tiles!
    if (triggerMode === 'first-touch-blank' && nextExpectedNum === 1) {
      setTiles((prev) =>
        prev.map((t) => (t.val === 1 ? { ...t, status: 'cleared' } : { ...t, status: 'blanked' }))
      );
    }

    if (tile.val === nextExpectedNum) {
      // Correct number
      sound.playChimpStep(tile.val, digitsCount);

      const nextNum = nextExpectedNum + 1;
      setNextExpectedNum(nextNum);

      setTiles((prev) =>
        prev.map((t) => (t.id === tile.id ? { ...t, status: 'cleared' } : t))
      );

      // Won round!
      if (nextNum > digitsCount) {
        const elapsed = Date.now() - startTime;
        setFinishTimeMs(elapsed);
        sound.playSuccess();
        const base = digitsCount * 18;
        const totalXp = Math.round(base * currentOption.xpMultiplier);
        onAddXp(totalXp);
        onRecordResult(true, digitsCount);
        setStage('success');
      }
    } else {
      // Wrong number tapped!
      sound.playError();
      setFailedNum(tile.val);
      // Reveal all tiles with numbers to demonstrate discrepancy
      setTiles((prev) =>
        prev.map((t) => ({
          ...t,
          status: t.val === tile.val ? 'failed' : 'revealed',
        }))
      );
      onRecordResult(false, digitsCount);
      setStage('failed');
    }
  };

  const increaseDifficulty = () => {
    if (digitsCount < 14) {
      setDigitsCount((d) => d + 1);
    }
    startRound();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Test Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl relative overflow-hidden backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/60 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> Step 2 of 6 • Sequence
              </span>
              <span className="text-xs text-slate-400">
                Digits: <strong className="text-white">{digitsCount}</strong>
              </span>
              <span className="text-[10px] bg-slate-800 text-amber-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                Day {curriculumDay} Max: {dayLimit.maxDigits}
              </span>
              <span className="text-[10px] bg-emerald-950/60 text-emerald-300 font-medium px-2 py-0.5 rounded border border-emerald-800/60">
                Unlimited Attempts
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              Ayumu Chimpanzee Test
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Snapshot the numbers 1 through {digitsCount} across the board. Once blanked, tap them in exact sequence.
            </p>
          </div>

          {/* Controls: Mode & Digits count */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Digits Selector */}
            <div className="bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="text-xs text-slate-400">Digits:</span>
              <div className="flex items-center gap-1">
                {[5, 7, 9, 11].map((cnt) => {
                  const isLocked = cnt > dayLimit.maxDigits;
                  return (
                    <button
                      key={cnt}
                      disabled={isLocked}
                      onClick={() => {
                        if (isLocked) return;
                        sound.playClick();
                        setDigitsCount(cnt);
                        setStage('idle');
                      }}
                      title={isLocked ? `Strictly locked for Day ${curriculumDay}. Unlocks Day ${dayLimit.nextUnlockDay}.` : undefined}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition-colors flex items-center gap-0.5 ${
                        isLocked
                          ? 'text-slate-600 bg-slate-900/50 cursor-not-allowed border border-slate-800'
                          : digitsCount === cnt
                          ? 'bg-amber-500 text-slate-950 shadow-sm cursor-pointer'
                          : 'text-slate-400 hover:text-slate-200 cursor-pointer'
                      }`}
                    >
                      {isLocked ? <Lock className="w-2.5 h-2.5 text-slate-500" /> : null}
                      {cnt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trigger Mode */}
            <div className="bg-slate-800/80 border border-slate-700/60 px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-xs">
              <button
                onClick={() => {
                  sound.playClick();
                  setTriggerMode('timed-flash');
                }}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  triggerMode === 'timed-flash'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tiles vanish after the set flash timer"
              >
                Timed Flash
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setTriggerMode('first-touch-blank');
                }}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  triggerMode === 'first-touch-blank'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Tiles stay until you tap #1, then all turn blank"
              >
                Touch Blank
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Play Board */}
      <div className="flex flex-col items-center">
        <div className="relative p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-[660px]">
          {/* Countdown Overlay */}
          {stage === 'countdown' && (
            <div className="absolute inset-0 bg-slate-950/85 z-20 rounded-3xl flex flex-col items-center justify-center backdrop-blur-xs">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-2">
                Lock Gaze on Board Center
              </span>
              <div className="text-6xl font-black text-white animate-pulse">
                {countdown}
              </div>
            </div>
          )}

          {/* Grid Container 8 cols x 5 rows */}
          <div
            className="grid grid-cols-8 gap-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 w-full aspect-[8/5]"
          >
            {Array.from({ length: TOTAL_CELLS }).map((_, cellIdx) => {
              const tile = tiles.find((t) => t.cellIdx === cellIdx);

              if (!tile) {
                // Empty background cell
                return (
                  <div
                    key={cellIdx}
                    className="rounded-xl bg-slate-900/40 border border-slate-800/40"
                  />
                );
              }

              // Render active tile
              let tileClass = 'bg-slate-800 border-slate-700 text-white';
              let content: React.ReactNode = null;

              if (tile.status === 'revealed') {
                tileClass =
                  'bg-white text-slate-950 font-black border-slate-300 shadow-md scale-95 transition-all text-xl sm:text-2xl';
                content = tile.val;
              } else if (tile.status === 'blanked') {
                // White square with no text - the classic Ayumu snapshot tile!
                tileClass =
                  'bg-slate-100 hover:bg-slate-200 border-slate-300 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95';
                content = null;
              } else if (tile.status === 'cleared') {
                tileClass =
                  'bg-emerald-500/20 border-emerald-600/40 text-emerald-400 font-bold opacity-75';
                content = <Check className="w-5 h-5 text-emerald-400" />;
              } else if (tile.status === 'failed') {
                tileClass =
                  'bg-rose-600 text-white font-black border-rose-400 shadow-lg animate-shake';
                content = tile.val;
              }

              return (
                <button
                  key={cellIdx}
                  onClick={() => handleTileClick(tile)}
                  disabled={stage !== 'playing' && stage !== 'flashing' || tile.status === 'cleared'}
                  className={`rounded-xl border flex items-center justify-center font-bold select-none transition-transform duration-100 ${tileClass}`}
                >
                  {content}
                </button>
              );
            })}
          </div>

          {/* Action / Results footer */}
          <div className="w-full mt-6 flex flex-col items-center">
            {stage === 'idle' && (
              <button
                onClick={startRound}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-98"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                Launch {digitsCount}-Digit Ayumu Test
              </button>
            )}

            {(stage === 'flashing' || stage === 'playing') && (
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <span className="text-amber-400 font-bold">Target:</span> Tap square{' '}
                <strong className="text-white text-base px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {nextExpectedNum}
                </strong>{' '}
                of {digitsCount}
              </div>
            )}

            {stage === 'success' && (
              <div className="w-full text-center animate-fade-in">
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-base mb-1">
                  <Sparkles className="w-5 h-5" />
                  Sequence Mastered!
                </div>
                <p className="text-xs text-slate-300 mb-4">
                  Recalled {digitsCount} scattered digits in {(finishTimeMs / 1000).toFixed(2)}s (+{Math.round(digitsCount * 18 * currentOption.xpMultiplier)} XP)
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={startRound}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Replay {digitsCount} Digits
                  </button>
                  {digitsCount >= dayLimit.maxDigits ? (
                    <button
                      onClick={startRound}
                      className="flex-2 py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-800/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Replay {digitsCount} Digits (Day Max Reached)
                    </button>
                  ) : (
                    <button
                      onClick={increaseDifficulty}
                      className="flex-2 py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-slate-950" />
                      Push to {digitsCount + 1} Digits
                    </button>
                  )}
                </div>
              </div>
            )}

            {stage === 'failed' && (
              <div className="w-full text-center animate-fade-in">
                <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-base mb-1">
                  <AlertTriangle className="w-5 h-5" />
                  Sequence Interrupted at #{failedNum}
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Review the revealed board above to recalibrate your spatial index. You have unlimited retries—practice until you pass today's level!
                </p>
                <button
                  onClick={startRound}
                  className="w-full py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Test (Unlimited Attempts)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scientific Insight Card */}
        <div className="max-w-[660px] w-full mt-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-slate-300 text-xs flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-amber-950 border border-amber-800 text-amber-400 shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-white">The Chimpanzee Advantage: Iconic Memory</span>
            <p className="text-slate-400 mt-0.5 leading-relaxed">
              Why could chimpanzee Ayumu beat humans at this test in under 210ms? Humans instinctively verbalize: saying <em>"two, four, seven..."</em> internally. Speech processing creates an acute bottleneck. Chimpanzees retain the entire visual field as a raw sensory image, directly translating visual coordinates to motor touch without verbal translation. Train yourself to stay silent and look with a panoramic gaze!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
