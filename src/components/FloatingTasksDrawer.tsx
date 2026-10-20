import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  X,
  Timer,
  Play,
  Pause,
  Repeat,
  Check,
  ArrowLeft,
} from 'lucide-react';
import {
  PenaltyEvent,
  PetSpeciesConfig,
  TaskCategory,
  TaskDifficulty,
  TaskItem,
  UserProfile,
} from '../types/game';
import {
  getGameDayOfWeek4AM,
  getStreakXpMultiplier,
  TASK_CATEGORY_CONFIG,
  TASK_DIFFICULTY_CONFIG,
} from '../data/petSpecies';
import { PixelCoinIcon } from './PixelCoinIcon';

interface FloatingTasksDrawerProps {
  profile: UserProfile;
  species: PetSpeciesConfig;
  tasks: TaskItem[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  latestPenalty: PenaltyEvent | null;
  onDismissPenalty: () => void;
  onCreateTask: (params: {
    title: string;
    category: TaskCategory;
    difficulty: TaskDifficulty;
    isTimerTask?: boolean;
    timerDurationSeconds?: number;
    isRepeating?: boolean;
    repeatDays?: number[];
  }) => void;
  onStartTaskTimer: (taskId: string) => void;
  onPauseTaskTimer?: (taskId: string) => void;
  onResumeTaskTimer?: (taskId: string) => void;
  onAttemptCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const TIMER_PRESETS = [
  { label: '5 Min Focus', seconds: 300 },
  { label: '10 Min Sprint', seconds: 600 },
  { label: '15 Min Deep', seconds: 900 },
  { label: '25 Min Pomodoro', seconds: 1500 },
  { label: '45 Min Session', seconds: 2700 },
];

const WEEK_DAYS: Array<{ dayIndex: number; shortLabel: string }> = [
  { dayIndex: 0, shortLabel: 'SUN' },
  { dayIndex: 1, shortLabel: 'MON' },
  { dayIndex: 2, shortLabel: 'TUE' },
  { dayIndex: 3, shortLabel: 'WED' },
  { dayIndex: 4, shortLabel: 'THU' },
  { dayIndex: 5, shortLabel: 'FRI' },
  { dayIndex: 6, shortLabel: 'SAT' },
];

function formatDurationMmSs(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatRepeatDaysBadge(repeatDays?: number[]): string {
  if (!repeatDays || repeatDays.length === 0) return '';
  if (repeatDays.length === 7) return 'DAILY';
  return WEEK_DAYS.filter((d) => repeatDays.includes(d.dayIndex))
    .map((d) => d.shortLabel)
    .join(', ');
}

export const FloatingTasksDrawer: React.FC<FloatingTasksDrawerProps> = ({
  profile,
  tasks,
  isOpen: controlledOpen,
  onOpenChange,
  latestPenalty,
  onDismissPenalty,
  onCreateTask,
  onStartTaskTimer,
  onPauseTaskTimer,
  onResumeTaskTimer,
  onAttemptCompleteTask,
  onDeleteTask,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setIsOpen = (next: boolean) => {
    setInternalOpen(next);
    onOpenChange?.(next);
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('vitality');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('standard');

  // Timer Task vs Category Task state
  const [isTimerMode, setIsTimerMode] = useState(false);
  const [timerDurationSeconds, setTimerDurationSeconds] = useState<number>(60);

  // Repeating Day-of-Week Checkboxes (0 = Sun .. 6 = Sat)
  const [selectedRepeatDays, setSelectedRepeatDays] = useState<number[]>([]);

  const [filterTab, setFilterTab] = useState<'pending' | 'repeating' | 'done'>(
    'pending'
  );
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Low-end RAM & battery optimization: only tick 1000ms if drawer is open or an active timer is running
  useEffect(() => {
    const hasRunningTimer = tasks.some(
      (t) => t.isTimerTask && t.timerStartedAtMs && !t.isTimerPaused
    );
    if (!isOpen && !hasRunningTimer) return;

    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isOpen, tasks]);

  useEffect(() => {
    if (latestPenalty) {
      setIsOpen(true);
    }
  }, [latestPenalty]);

  const isAllDailyChecked = selectedRepeatDays.length === 7;

  const handleToggleDailyAll = () => {
    if (isAllDailyChecked) {
      setSelectedRepeatDays([]);
    } else {
      setSelectedRepeatDays([0, 1, 2, 3, 4, 5, 6]);
    }
  };

  const handleToggleSingleDay = (dayIdx: number) => {
    setSelectedRepeatDays((prev) =>
      prev.includes(dayIdx)
        ? prev.filter((d) => d !== dayIdx)
        : [...prev, dayIdx].sort((a, b) => a - b)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = title.trim();
    if (clean.length < 2) return;
    const isRepeating = selectedRepeatDays.length > 0;
    onCreateTask({
      title: clean,
      category,
      difficulty,
      isTimerTask: isTimerMode,
      timerDurationSeconds: isTimerMode ? timerDurationSeconds : undefined,
      isRepeating,
      repeatDays: isRepeating ? selectedRepeatDays : undefined,
    });
    setTitle('');
    setSelectedRepeatDays([]);
    setShowAddForm(false);
  };

  const todayDayOfWeek = getGameDayOfWeek4AM(nowMs);
  const streakMultiplier = getStreakXpMultiplier(profile.streakDays);

  // Active pending tasks that apply to today (either non-repeating or scheduled for today's day of week)
  const pendingTasks = tasks.filter((t) => {
    if (t.status !== 'pending') return false;
    if (t.isRepeating && t.repeatDays && t.repeatDays.length > 0) {
      return t.repeatDays.includes(todayDayOfWeek);
    }
    return true;
  });

  const repeatingTasks = tasks.filter(
    (t) => t.isRepeating && t.repeatDays && t.repeatDays.length > 0
  );

  const doneTasks = tasks.filter((t) => t.status !== 'pending');

  const displayedTasks =
    filterTab === 'pending'
      ? pendingTasks
      : filterTab === 'repeating'
      ? repeatingTasks
      : doneTasks;

  const activeRunningTimersCount = pendingTasks.filter(
    (t) => t.isTimerTask && t.timerStartedAtMs
  ).length;

  return (
    <>
      {/* Desktop Right-Corner Quests Trigger Button (Responsive, compact h-10 matching HUD items) */}
      <div className="hidden sm:flex fixed top-3 right-3 z-30 items-center gap-2">
        <button
          id="tutorial-quests"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-10 px-3 sm:px-3.5 pixel-btn flex items-center gap-2 transition-transform active:scale-95 ${
            activeRunningTimersCount > 0
              ? 'bg-sky-200 hover:bg-sky-300 text-slate-900'
              : 'bg-amber-300 hover:bg-amber-200 text-slate-950'
          }`}
        >
          {activeRunningTimersCount > 0 ? (
            <Timer className="w-4 h-4 text-sky-900 animate-spin shrink-0" />
          ) : (
            <CheckSquare className="w-4 h-4 shrink-0" />
          )}
          <span className="font-display text-xs tracking-tight">QUESTS</span>
          <span className="px-1.5 py-0.5 bg-white text-slate-900 font-display text-[11px] border border-[#3B4254] flex items-center justify-center shrink-0">
            {pendingTasks.length}
          </span>
        </button>
      </div>

      {/* Clean Centered Quests Modal (Matches Shop, My Pets, Achievements & Crates Modals) */}
      {isOpen && (
        <div
          aria-label="Daily Quests Modal"
          className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-3 sm:p-5 select-none"
        >
          <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-h-[88dvh] md:max-h-[85dvh] bg-[#FAF6F0] pixel-box overflow-hidden flex flex-col text-slate-900">
            {/* Modal Header */}
            <div className="px-4 sm:px-5 py-3.5 bg-[#EFE8DD] border-b-2 border-[#3B4254] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="font-display text-xs sm:text-sm text-slate-900">
                  {showAddForm ? 'NEW QUEST' : 'QUESTS'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm((prev) => !prev)}
                  className={`px-3 py-1.5 font-display text-[10px] sm:text-xs pixel-btn flex items-center gap-1 ${
                    showAddForm
                      ? 'bg-white hover:bg-slate-100 text-slate-900'
                      : 'bg-emerald-300 hover:bg-emerald-200 text-slate-950'
                  }`}
                >
                  {showAddForm ? (
                    <>
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>BACK</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>NEW</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setIsOpen(false);
                  }}
                  aria-label="Close quests"
                  className="px-5 py-1 bg-rose-400 hover:bg-rose-300 text-slate-950 font-display text-[10px] sm:text-xs pixel-btn flex items-center gap-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Anti-Cheat Penalty Banner */}
            {latestPenalty && (
              <div className="mx-4 mt-3 p-3 bg-rose-100 border-2 border-rose-800 rounded flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-display text-[10px] text-rose-900">
                      EARLY COMPLETION PENALTY!
                    </div>
                    <p className="font-pixel text-xs sm:text-sm text-rose-800 leading-tight mt-1 flex flex-wrap items-center gap-1">
                      <span>
                        “{latestPenalty.taskTitle}” checked at{' '}
                        {latestPenalty.elapsedSeconds}s (min{' '}
                        {latestPenalty.requiredSeconds}s). -{latestPenalty.hpLost}{' '}
                        HP,
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <PixelCoinIcon size={14} />-{latestPenalty.goldLost}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onDismissPenalty}
                  className="px-2.5 py-1 bg-white text-rose-900 font-display text-[10px] pixel-btn shrink-0"
                >
                  OK
                </button>
              </div>
            )}

            {/* VIEW A: Create Quest Form (Clean dedicated view with zero double-scrollbars) */}
            {showAddForm ? (
              <form
                onSubmit={handleSubmit}
                className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1"
              >
                {/* Mode Switch: Category Quest vs Timer Quest */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTimerMode(false)}
                    className={`py-2.5 px-2 font-display text-[10px] pixel-btn flex items-center justify-center gap-1.5 ${
                      !isTimerMode
                        ? 'bg-amber-300 text-slate-950'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>CATEGORY</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTimerMode(true)}
                    className={`py-2.5 px-2 font-display text-[10px] pixel-btn flex items-center justify-center gap-1.5 ${
                      isTimerMode
                        ? 'bg-sky-300 text-slate-950'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Timer className="w-4 h-4" />
                    <span>TIMER</span>
                  </button>
                </div>

                <div>
                  <label className="block font-display text-[9px] text-slate-600 mb-1">
                    QUEST TITLE
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={140}
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter quest title..."
                    className="w-full px-3 py-2 bg-white border-2 border-[#3B4254] rounded text-slate-900 placeholder-slate-400 font-pixel text-sm sm:text-base focus:outline-none"
                  />
                </div>

                {/* Category & Difficulty / Timer Duration */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-display text-[9px] text-slate-600 mb-1">
                      CATEGORY
                    </label>
                    <select
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as TaskCategory)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border-2 border-[#3B4254] rounded text-slate-900 font-pixel text-xs sm:text-sm font-bold"
                    >
                      {(
                        Object.keys(TASK_CATEGORY_CONFIG) as TaskCategory[]
                      ).map((cat) => (
                        <option key={cat} value={cat}>
                          {TASK_CATEGORY_CONFIG[cat].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!isTimerMode ? (
                    <div>
                      <label className="block font-display text-[9px] text-slate-600 mb-1">
                        DIFFICULTY
                      </label>
                      <select
                        value={difficulty}
                        onChange={(e) =>
                          setDifficulty(e.target.value as TaskDifficulty)
                        }
                        className="w-full px-2.5 py-1.5 bg-white border-2 border-[#3B4254] rounded text-slate-900 font-pixel text-xs sm:text-sm font-bold"
                      >
                        {(
                          Object.keys(
                            TASK_DIFFICULTY_CONFIG
                          ) as TaskDifficulty[]
                        ).map((diff) => {
                          const d = TASK_DIFFICULTY_CONFIG[diff];
                          return (
                            <option key={diff} value={diff}>
                              {d.label} (+{d.xpReward} XP)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block font-display text-[9px] text-slate-600 mb-1">
                        DURATION
                      </label>
                      <select
                        value={timerDurationSeconds}
                        onChange={(e) =>
                          setTimerDurationSeconds(Number(e.target.value))
                        }
                        className="w-full px-2.5 py-1.5 bg-sky-50 border-2 border-[#3B4254] rounded text-slate-900 font-pixel text-xs sm:text-sm font-bold"
                      >
                        {TIMER_PRESETS.map((preset) => (
                          <option key={preset.seconds} value={preset.seconds}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* REPEATING QUEST SCHEDULE: "DAILY" Checkbox at Top + 7 Day Checkboxes */}
                <div className="p-3 bg-white pixel-box-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[9px] text-slate-800 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-emerald-700" />
                      <span>REPEAT SCHEDULE (4:00 AM RESET)</span>
                    </span>
                  </div>

                  {/* Top Checkbox: DAILY (Marks All 7 Days) */}
                  <button
                    type="button"
                    onClick={handleToggleDailyAll}
                    className={`w-full py-2 px-3 pixel-btn flex items-center justify-between font-display text-[10px] sm:text-xs ${
                      isAllDailyChecked
                        ? 'bg-emerald-300 text-slate-950'
                        : 'bg-[#FAF6F0] text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>DAILY (ALL DAYS)</span>
                    <span
                      className={`w-5 h-5 border-2 border-[#3B4254] flex items-center justify-center ${
                        isAllDailyChecked
                          ? 'bg-slate-900 text-white'
                          : 'bg-white'
                      }`}
                    >
                      {isAllDailyChecked && <Check className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {/* Individual Day Checkboxes (SUN .. SAT) */}
                  <div className="grid grid-cols-7 gap-1">
                    {WEEK_DAYS.map((d) => {
                      const isChecked = selectedRepeatDays.includes(d.dayIndex);
                      return (
                        <button
                          key={d.dayIndex}
                          type="button"
                          onClick={() => handleToggleSingleDay(d.dayIndex)}
                          className={`py-1.5 px-1 border-2 border-[#3B4254] rounded flex flex-col items-center justify-center gap-1 transition-colors ${
                            isChecked
                              ? 'bg-amber-300 text-slate-950'
                              : 'bg-[#FAF6F0] text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-display text-[8px]">
                            {d.shortLabel}
                          </span>
                          <span
                            className={`w-4 h-4 border border-[#3B4254] flex items-center justify-center ${
                              isChecked ? 'bg-slate-900 text-white' : 'bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display text-xs pixel-btn"
                >
                  ADD QUEST
                </button>
              </form>
            ) : (
              /* VIEW B: Filter Tabs + Clean Uncluttered Quest List */
              <>
                {/* 3 Equal-Width Filter Tabs */}
                <div className="px-4 pt-3.5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterTab('pending')}
                    className={`py-2 px-2 font-display text-[10px] sm:text-xs pixel-btn text-center ${
                      filterTab === 'pending'
                        ? 'bg-amber-300 text-slate-950'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    ACTIVE ({pendingTasks.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('repeating')}
                    className={`py-2 px-2 font-display text-[10px] sm:text-xs pixel-btn flex items-center justify-center gap-1 ${
                      filterTab === 'repeating'
                        ? 'bg-emerald-300 text-slate-950'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>REPEAT ({repeatingTasks.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab('done')}
                    className={`py-2 px-2 font-display text-[10px] sm:text-xs pixel-btn text-center ${
                      filterTab === 'done'
                        ? 'bg-sky-200 text-slate-950'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    DONE ({doneTasks.length})
                  </button>
                </div>

                {/* Quests List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {displayedTasks.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-white pixel-box-sm">
                      <p className="font-display text-xs text-slate-800 mb-2">
                        {filterTab === 'pending'
                          ? 'NO ACTIVE QUESTS TODAY'
                          : filterTab === 'repeating'
                          ? 'NO REPEATING QUESTS SET'
                          : 'NO COMPLETED QUESTS YET'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="mt-1 px-4 py-2 bg-emerald-300 hover:bg-emerald-200 text-slate-950 font-display text-[10px] pixel-btn inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>CREATE QUEST</span>
                      </button>
                    </div>
                  ) : (
                    displayedTasks.map((task) => {
                      const isTimerTask = Boolean(task.isTimerTask);
                      const timerTotalSec =
                        task.timerDurationSeconds || task.minDurationSeconds;
                      const isTimerPaused = Boolean(task.isTimerPaused);
                      const isTimerRunning =
                        isTimerTask && Boolean(task.timerStartedAtMs) && !isTimerPaused;

                      // Total elapsed = accumulated past sessions before pause + current running duration
                      const currentRunElapsedSec =
                        isTimerRunning && task.timerStartedAtMs
                          ? Math.max(
                              0,
                              Math.floor((nowMs - task.timerStartedAtMs) / 1000)
                            )
                          : 0;
                      const timerElapsedSec =
                        (task.timerElapsedBeforePauseSeconds || 0) +
                        currentRunElapsedSec;
                      const timerRemainingSec = Math.max(
                        0,
                        timerTotalSec - timerElapsedSec
                      );
                      const timerPct = Math.min(
                        100,
                        Math.round((timerElapsedSec / timerTotalSec) * 100)
                      );

                      const stdElapsedSec = Math.max(
                        0,
                        Math.floor((nowMs - task.createdAtMs) / 1000)
                      );
                      const stdRemainingSec = Math.max(
                        0,
                        task.minDurationSeconds - stdElapsedSec
                      );
                      const isStdReady = stdRemainingSec === 0;

                      const repeatLabel = formatRepeatDaysBadge(
                        task.repeatDays
                      );
                      const boostedXp = Math.round(
                        task.xpReward * streakMultiplier
                      );

                      return (
                        <div
                          key={task.id}
                          className={`p-3.5 pixel-box-sm space-y-2.5 ${
                            task.status === 'completed'
                              ? 'bg-emerald-50'
                              : task.status === 'penalized'
                              ? 'bg-rose-50'
                              : isTimerRunning
                              ? 'bg-sky-50'
                              : 'bg-white'
                          }`}
                        >
                          {/* Top Row: Category / Schedule + Delete Button */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-[#EFE8DD] border border-[#3B4254] font-display text-[8px] text-slate-800 uppercase">
                                {TASK_CATEGORY_CONFIG[task.category]?.label ||
                                  task.category}
                              </span>
                              {repeatLabel && (
                                <span className="px-2 py-0.5 bg-emerald-200 border border-[#3B4254] font-display text-[8px] text-emerald-950 flex items-center gap-1">
                                  <Repeat className="w-2.5 h-2.5" />
                                  <span>{repeatLabel}</span>
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => onDeleteTask(task.id)}
                              aria-label="Delete quest"
                              className="w-7 h-7 bg-slate-100 hover:bg-rose-200 text-slate-600 hover:text-rose-900 border border-[#3B4254] rounded flex items-center justify-center shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Middle Row: Full-Width Quest Title */}
                          <p
                            className={`font-pixel text-sm sm:text-base font-bold leading-snug break-words ${
                              task.status === 'completed'
                                ? 'line-through text-slate-400'
                                : task.status === 'penalized'
                                ? 'line-through text-rose-500'
                                : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </p>

                          {/* Bottom Row: Rewards & Status on Left, Primary Action Button on Right */}
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-amber-100 border border-[#3B4254] font-pixel text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1">
                                <PixelCoinIcon size={14} />
                                <span>+{task.goldReward}</span>
                              </span>

                              <span className="px-2 py-0.5 bg-emerald-100 border border-[#3B4254] font-pixel text-xs sm:text-sm font-bold text-emerald-950">
                                +{boostedXp} XP
                              </span>

                              {task.status === 'pending' && (
                                <>
                                  {isTimerTask ? (
                                    <span
                                      className={`font-pixel text-xs sm:text-sm font-bold ${
                                        isTimerPaused
                                          ? 'text-amber-800'
                                          : isTimerRunning
                                          ? 'text-sky-800'
                                          : 'text-slate-600'
                                      }`}
                                    >
                                      {isTimerPaused
                                        ? `⏸ ${formatDurationMmSs(
                                            timerRemainingSec
                                          )} (PAUSED)`
                                        : isTimerRunning
                                        ? `⏱ ${formatDurationMmSs(
                                            timerRemainingSec
                                          )} left`
                                        : formatDurationMmSs(timerTotalSec)}
                                    </span>
                                  ) : (
                                    <span
                                      className={`font-pixel text-xs sm:text-sm font-bold flex items-center gap-1 ${
                                        isStdReady
                                          ? 'text-emerald-700'
                                          : 'text-amber-700'
                                      }`}
                                    >
                                      <Clock className="w-3.5 h-3.5" />
                                      {isStdReady
                                        ? 'Ready'
                                        : `${stdRemainingSec}s`}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Primary Action Button */}
                            <div className="shrink-0">
                              {task.status === 'pending' ? (
                                isTimerTask ? (
                                  isTimerRunning ? (
                                    <button
                                      type="button"
                                      onClick={() => onPauseTaskTimer?.(task.id)}
                                      title="Pause Quest Timer"
                                      className="px-3 py-1.5 bg-amber-300 hover:bg-amber-200 text-slate-950 font-display text-[9px] pixel-btn flex items-center gap-1"
                                    >
                                      <Pause className="w-3.5 h-3.5 fill-current" />
                                      <span>PAUSE</span>
                                    </button>
                                  ) : isTimerPaused ? (
                                    <button
                                      type="button"
                                      onClick={() => onResumeTaskTimer?.(task.id)}
                                      title="Resume Quest Timer"
                                      className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display text-[9px] pixel-btn flex items-center gap-1"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-current" />
                                      <span>RESUME</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => onStartTaskTimer(task.id)}
                                      className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display text-[10px] pixel-btn flex items-center gap-1"
                                    >
                                      <Play className="w-3.5 h-3.5 fill-current" />
                                      <span>START</span>
                                    </button>
                                  )
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onAttemptCompleteTask(task.id)
                                    }
                                    className={`px-3.5 py-1.5 font-display text-[10px] pixel-btn flex items-center gap-1 ${
                                      isStdReady
                                        ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                                        : 'bg-amber-200 hover:bg-amber-300 text-slate-900'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{isStdReady ? 'DONE' : 'EARLY'}</span>
                                  </button>
                                )
                              ) : task.status === 'completed' ? (
                                <span className="px-2.5 py-1 bg-emerald-300 text-slate-950 font-display text-[9px] pixel-box-sm">
                                  CLEARED
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-rose-300 text-slate-950 font-display text-[9px] pixel-box-sm flex items-center gap-0.5">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>PENALTY</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Timer Progress Bar */}
                          {task.status === 'pending' &&
                            isTimerTask &&
                            isTimerRunning && (
                              <div className="w-full h-2.5 bg-slate-200 border border-[#3B4254] overflow-hidden">
                                <div
                                  className="h-full bg-sky-400 transition-all duration-300"
                                  style={{ width: `${timerPct}%` }}
                                />
                              </div>
                            )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
