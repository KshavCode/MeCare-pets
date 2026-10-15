import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Clock,
  ShieldAlert,
  Search,
  FastForward,
  Flame,
  Trophy,
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
  getEvolutionStage,
  TASK_CATEGORY_CONFIG,
  TASK_DIFFICULTY_CONFIG,
} from '../data/petSpecies';

interface TaskCommandCenterProps {
  profile: UserProfile;
  species: PetSpeciesConfig;
  tasks: TaskItem[];
  latestPenalty: PenaltyEvent | null;
  onDismissPenalty: () => void;
  onCreateTask: (params: {
    title: string;
    category: TaskCategory;
    difficulty: TaskDifficulty;
  }) => void;
  onAttemptCompleteTask: (taskId: string) => void;
  onFastForwardTaskTimer: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskCommandCenter: React.FC<TaskCommandCenterProps> = ({
  profile,
  species,
  tasks,
  latestPenalty,
  onDismissPenalty,
  onCreateTask,
  onAttemptCompleteTask,
  onFastForwardTaskTimer,
  onDeleteTask,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('discipline');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('standard');
  const [filter, setFilter] = useState<'pending' | 'completed' | 'penalized' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Tick every second so anti-cheat countdowns update in real time
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentStage = getEvolutionStage(profile.petXp);
  const stageConfig = species.stages[currentStage];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < 2) return;
    onCreateTask({
      title: trimmed,
      category,
      difficulty,
    });
    setTitle('');
    setFilter('pending');
  };

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const penalizedCount = tasks.filter((t) => t.status === 'penalized').length;

  const filteredTasks = tasks.filter((task) => {
    if (filter !== 'all' && task.status !== filter) return false;
    if (
      searchQuery.trim() &&
      !task.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const milestoneTasksTarget = stageConfig.milestoneTasksRequired;
  const milestoneTasksProgress = Math.min(
    100,
    Math.round((profile.totalTasksCompleted / milestoneTasksTarget) * 100)
  );

  return (
    <section className="flex flex-col gap-6">
      {/* Anti-Cheat Penalty Alert Banner (Displays whenever user rushes a newly created task) */}
      {latestPenalty && (
        <div
          role="alert"
          className="bg-rose-950/90 border border-rose-600 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-300 font-display font-bold text-base">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                Anti-Cheat Penalty Triggered: Immediate Task Completion Detected
              </span>
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed">
              You marked <strong className="text-white">“{latestPenalty.taskTitle}”</strong> as completed only{' '}
              <span className="font-mono tabular-nums font-semibold text-white">
                {latestPenalty.elapsedSeconds}s
              </span>{' '}
              after creating it (minimum focus time required:{' '}
              <span className="font-mono tabular-nums font-semibold text-white">
                {latestPenalty.requiredSeconds}s
              </span>
              ). Rushing tasks hurts {profile.activePetName}’s growth and trust!
            </p>
            <div className="text-xs font-mono tabular-nums text-rose-300 pt-1">
              Penalty Applied: -{latestPenalty.hpLost} Health · -{latestPenalty.happinessLost} Happiness · -{latestPenalty.goldLost} Gold · -{latestPenalty.xpLost} XP
            </div>
          </div>
          <button
            type="button"
            onClick={onDismissPenalty}
            className="px-4 py-2 rounded-xl bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Growth Milestone Integration Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-xs text-orange-400 font-medium mb-1">
              Task-to-Evolution Milestone Sync · {species.name} ({stageConfig.label} Form)
            </div>
            <h2 className="font-display text-xl font-bold text-white">
              {stageConfig.milestoneTitle}
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-300">
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Streak: {profile.streakDays}d</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>
                Verified Tasks: {profile.totalTasksCompleted}/{milestoneTasksTarget}
              </span>
            </span>
          </div>
        </div>

        {/* Milestone Progress Bar */}
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mb-4">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-transform duration-200 origin-left"
            style={{ transform: `scaleX(${milestoneTasksProgress / 100})` }}
          />
        </div>

        {/* 3 Concrete Daily Motivation Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80 text-xs">
          <div>
            <div className="font-semibold text-white mb-0.5">
              1. Evolution XP Gate
            </div>
            <p className="text-slate-400">
              {stageConfig.nextXp
                ? `Earn ${stageConfig.nextXp - profile.petXp} more XP from tasks to evolve ${profile.activePetName} into its next form.`
                : `${profile.activePetName} has reached its final Adult Sovereign form! Keep completing tasks to earn Gold for new species.`}
            </p>
          </div>
          <div>
            <div className="font-semibold text-white mb-0.5">
              2. Healthy Companion Multiplier
            </div>
            <p className="text-slate-400">
              Keep Health & Happiness at 80+ to earn +25% bonus Gold and XP on every task you check off.
            </p>
          </div>
          <div>
            <div className="font-semibold text-white mb-0.5">
              3. Anti-Cheat Focus Timer
            </div>
            <p className="text-slate-400">
              Wait for a new task’s focus timer to finish before completing it. Immediate check-offs trigger a cheat penalty.
            </p>
          </div>
        </div>
      </div>

      {/* Add New To-Do Task Composer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-display text-lg font-bold text-white mb-1">
          Create a New Task for {profile.activePetName}
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Each task starts an anti-cheat focus timer upon creation. Complete the task after the timer matures to nourish and evolve your pet.
        </p>

        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-task-title" className="sr-only">
              Task description
            </label>
            <input
              id="new-task-title"
              type="text"
              required
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you need to accomplish today? (e.g., Study 30 mins, Run 3km, Refactor API module)"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-orange-500 min-h-[48px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Selector */}
            <div>
              <label
                htmlFor="task-category-select"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Growth Attribute Category
              </label>
              <select
                id="task-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-orange-500 min-h-[44px]"
              >
                {(Object.keys(TASK_CATEGORY_CONFIG) as TaskCategory[]).map(
                  (catKey) => {
                    const cfg = TASK_CATEGORY_CONFIG[catKey];
                    return (
                      <option key={catKey} value={catKey}>
                        {cfg.label} ({cfg.statBoostLabel})
                      </option>
                    );
                  }
                )}
              </select>
            </div>

            {/* Difficulty & Anti-Cheat Timer Selector */}
            <div>
              <label
                htmlFor="task-difficulty-select"
                className="block text-xs font-semibold text-slate-300 mb-1.5"
              >
                Task Effort & Anti-Cheat Focus Gate
              </label>
              <select
                id="task-difficulty-select"
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value as TaskDifficulty)
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-orange-500 min-h-[44px]"
              >
                {(Object.keys(TASK_DIFFICULTY_CONFIG) as TaskDifficulty[]).map(
                  (diffKey) => {
                    const cfg = TASK_DIFFICULTY_CONFIG[diffKey];
                    return (
                      <option key={diffKey} value={diffKey}>
                        {cfg.label} — {cfg.description}
                      </option>
                    );
                  }
                )}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {/* Quick Suggestion Presets */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400">Quick presets:</span>
              <button
                type="button"
                onClick={() => {
                  setTitle('Complete 25-minute Pomodoro study session');
                  setCategory('intellect');
                  setDifficulty('standard');
                }}
                className="text-slate-300 hover:text-orange-400 underline underline-offset-4 transition-colors whitespace-nowrap"
              >
                Pomodoro Sprint
              </button>
              <span className="text-slate-600">·</span>
              <button
                type="button"
                onClick={() => {
                  setTitle('Finish 30-minute strength & core workout');
                  setCategory('strength');
                  setDifficulty('deep');
                }}
                className="text-slate-300 hover:text-orange-400 underline underline-offset-4 transition-colors whitespace-nowrap"
              >
                Strength Workout
              </button>
              <span className="text-slate-600">·</span>
              <button
                type="button"
                onClick={() => {
                  setTitle('Zero inbox & organize tomorrow’s schedule');
                  setCategory('discipline');
                  setDifficulty('quick');
                }}
                className="text-slate-300 hover:text-orange-400 underline underline-offset-4 transition-colors whitespace-nowrap"
              >
                Inbox Zero
              </button>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-semibold text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task to List</span>
            </button>
          </div>
        </form>
      </div>

      {/* Active Task List & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          {/* Interactive Segmented Filter Controls */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                filter === 'pending'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Active ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                filter === 'completed'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('penalized')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                filter === 'penalized'
                  ? 'bg-slate-800 text-rose-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Penalized ({penalizedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                filter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({tasks.length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500 min-h-[40px]"
            />
          </div>
        </div>

        {/* Task Rows */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-xl">
            <p className="text-sm font-medium text-slate-300 mb-1">
              {filter === 'pending'
                ? 'No active tasks in your queue.'
                : filter === 'penalized'
                ? 'Zero anti-cheat penalties recorded! Great discipline.'
                : 'No tasks match this filter.'}
            </p>
            <p className="text-xs text-slate-500">
              Add a task above to feed {profile.activePetName}, earn Gold, and advance toward the next evolution stage.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredTasks.map((task) => {
              const elapsedSec = Math.max(
                0,
                Math.floor((nowMs - task.createdAtMs) / 1000)
              );
              const remainingSec = Math.max(
                0,
                task.minDurationSeconds - elapsedSec
              );
              const isReadyToComplete = remainingSec === 0;
              const catInfo = TASK_CATEGORY_CONFIG[task.category];
              const diffInfo = TASK_DIFFICULTY_CONFIG[task.difficulty];

              return (
                <div
                  key={task.id}
                  className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Primary Task Title */}
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`text-sm font-semibold leading-snug ${
                          task.status === 'completed'
                            ? 'line-through text-slate-400'
                            : task.status === 'penalized'
                            ? 'line-through text-rose-400/80'
                            : 'text-white'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    {/* Zero-Pill Metadata: Unboxed clean text with typographic separators */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                      <span className={catInfo.colorText}>{catInfo.label}</span>
                      <span aria-hidden="true">·</span>
                      <span>{diffInfo.label}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400">+{task.xpReward} XP</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-400">+{task.goldReward} Gold</span>

                      {task.status === 'pending' && (
                        <>
                          <span aria-hidden="true">·</span>
                          {isReadyToComplete ? (
                            <span className="text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Focus Verified (Ready)</span>
                            </span>
                          ) : (
                            <span className="text-amber-300 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                Anti-Cheat Gate: {remainingSec}s remaining
                              </span>
                            </span>
                          )}
                        </>
                      )}

                      {task.status === 'completed' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-400">
                            Verified & Completed
                          </span>
                        </>
                      )}

                      {task.status === 'penalized' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-rose-400">
                            Penalized: Completed prematurely ({task.penaltyReason || 'Rushed check-off'})
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Interactive Controls for Task Row */}
                  <div className="flex items-center gap-2 shrink-0">
                    {task.status === 'pending' && (
                      <>
                        {!isReadyToComplete && (
                          <button
                            type="button"
                            onClick={() => onFastForwardTaskTimer(task.id)}
                            title="Skip wait timer for quick evaluation"
                            className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[44px]"
                          >
                            <FastForward className="w-3.5 h-3.5 text-sky-400" />
                            <span>Ready Now</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onAttemptCompleteTask(task.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[44px] ${
                            isReadyToComplete
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              : 'bg-amber-500/20 hover:bg-rose-500/30 border border-amber-500/50 text-amber-200'
                          }`}
                        >
                          {isReadyToComplete ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Complete Task</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                              <span>Complete ({remainingSec}s early)</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      aria-label="Delete task"
                      title="Delete task"
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-slate-950 hover:bg-rose-950/70 border border-slate-800 text-slate-400 hover:text-rose-300 flex items-center justify-center transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
