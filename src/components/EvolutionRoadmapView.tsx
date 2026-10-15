import React from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  EvolutionStage,
  PenaltyEvent,
  PetSpeciesConfig,
  TaskItem,
  UserProfile,
} from '../types/game';
import { getEvolutionStage } from '../data/petSpecies';
import { PetAvatarSvg } from './PetAvatarSvg';

interface EvolutionRoadmapViewProps {
  profile: UserProfile;
  species: PetSpeciesConfig;
  tasks: TaskItem[];
  penaltyHistory: PenaltyEvent[];
  onSimulateAddTaskWithInstantCheat: () => void;
}

const STAGES: EvolutionStage[] = ['baby', 'kid', 'teen', 'adult'];

export const EvolutionRoadmapView: React.FC<EvolutionRoadmapViewProps> = ({
  profile,
  species,
  tasks,
  penaltyHistory,
  onSimulateAddTaskWithInstantCheat,
}) => {
  const activeStage = getEvolutionStage(profile.petXp);
  const penalizedTasks = tasks.filter((t) => t.status === 'penalized');

  return (
    <section className="space-y-8">
      {/* 4-Stage Evolution Progression Showcase */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-medium text-orange-400 mb-1">
              4-Form Companion Evolution Line · {species.name}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              From Baby Hatchling to Apex Adult
            </h2>
          </div>

          <div className="text-left md:text-right font-mono tabular-nums">
            <div className="text-xs text-slate-400">Current Evolution Progress</div>
            <div className="text-lg font-bold text-amber-400">
              {profile.petXp} XP · {profile.totalTasksCompleted} Verified Tasks
            </div>
          </div>
        </div>

        {/* 4 Stage Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STAGES.map((st, idx) => {
            const stInfo = species.stages[st];
            const isCurrent = activeStage === st;
            const isUnlocked = profile.petXp >= stInfo.minXp;

            return (
              <div
                key={st}
                className={`rounded-xl border p-5 flex flex-col justify-between gap-4 ${
                  isCurrent
                    ? 'bg-slate-950 border-orange-500'
                    : isUnlocked
                    ? 'bg-slate-950/70 border-emerald-500/40'
                    : 'bg-slate-950/40 border-slate-800 opacity-75'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums mb-2">
                    <span className="text-slate-400">
                      Form 0{idx + 1} · {stInfo.label}
                    </span>
                    {isCurrent ? (
                      <span className="text-orange-400 font-semibold">
                        Current Form
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{stInfo.minXp} XP</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-lg font-bold text-white mb-1">
                    {stInfo.formName}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono tabular-nums mb-3">
                    Size: {stInfo.heightLabel} · {stInfo.weightLabel}
                  </div>

                  <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl py-3 flex items-center justify-center mb-3">
                    <PetAvatarSvg
                      speciesId={species.id}
                      stage={st}
                      mood="idle"
                      size={135}
                    />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {stInfo.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-xs font-mono tabular-nums text-slate-400">
                  <div>
                    Threshold: <span className="text-white">{stInfo.minXp} XP</span>
                  </div>
                  <div>
                    Target Milestone:{' '}
                    <span className="text-emerald-400">
                      {stInfo.milestoneTasksRequired} Tasks
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anti-Cheat Integrity System & Penalty Log */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-medium text-rose-400 mb-1">
              Anti-Cheat Task Verification Engine
            </p>
            <h3 className="font-display text-2xl font-bold text-white mb-1">
              Honest Work vs. Rushed Completion Penalties
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              When a user creates a to-do task and immediately claims it is completed before the minimum focus window expires, MeCare flags the action as cheating and applies a multi-stat penalty to discourage fake task grinding.
            </p>
          </div>

          <button
            type="button"
            onClick={onSimulateAddTaskWithInstantCheat}
            className="px-4 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 min-h-[44px]"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Test Anti-Cheat Penalty Now</span>
          </button>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">
              Verified Tasks Completed
            </div>
            <div className="font-mono text-2xl font-bold text-emerald-400 tabular-nums">
              {profile.totalTasksCompleted}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">
              Anti-Cheat Penalties Triggered
            </div>
            <div className="font-mono text-2xl font-bold text-rose-400 tabular-nums">
              {profile.cheatCount}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs text-slate-400 mb-1">
              Standard Rush Penalty Cost
            </div>
            <div className="font-mono text-sm font-bold text-amber-300 tabular-nums pt-1">
              -18 HP · -20 Happy · -15 Gold · -15 XP
            </div>
          </div>
        </div>

        {/* Penalty History List */}
        {penaltyHistory.length === 0 && penalizedTasks.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <p className="text-sm font-semibold text-emerald-400 mb-1">
              Clean Discipline Record — Zero Rushed Task Violations
            </p>
            <p className="text-xs text-slate-400">
              Try creating a task and immediately clicking “Complete” (or click “Test Anti-Cheat Penalty Now” above) to see how the penalty system protects your companion’s evolution integrity.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {penaltyHistory.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-semibold text-rose-300">
                    Rushed Task: “{item.taskTitle}”
                  </span>
                  <span className="text-slate-400 ml-2 font-mono tabular-nums">
                    (Checked off after {item.elapsedSeconds}s · Required {item.requiredSeconds}s)
                  </span>
                </div>
                <div className="font-mono tabular-nums text-rose-400">
                  -{item.hpLost} HP · -{item.happinessLost} Happy · -{item.goldLost} Gold · -{item.xpLost} XP
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
