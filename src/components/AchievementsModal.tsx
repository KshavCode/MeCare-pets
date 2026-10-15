import React, { useState } from 'react';
import {
  Trophy,
  Check,
  Sparkles,
  X,
  Flame,
  CheckSquare,
  Star,
  Award,
  Crown,
  Heart,
} from 'lucide-react';
import { AchievementDef, RoomDecorItem, UserProfile } from '../types/game';
import { ACHIEVEMENTS_LIST, ROOM_DECOR_ITEMS, PET_SPECIES_MAP } from '../data/petSpecies';
import { RoomDecorSvg } from './RoomDecorSvg';
import { PixelCoinIcon } from './PixelCoinIcon';
import { soundFX } from '../utils/sound';

interface AchievementsModalProps {
  profile: UserProfile;
  onClaimAchievement: (achievement: AchievementDef) => void;
  onPlaceExclusiveDecor: (item: RoomDecorItem) => void;
  onClose: () => void;
}

const RARITY_BADGES: Record<
  string,
  { label: string; bg: string; text: string; border: string; glow: string }
> = {
  uncommon: {
    label: 'UNCOMMON',
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    border: 'border-emerald-600',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.35)]',
  },
  rare: {
    label: 'RARE',
    bg: 'bg-sky-100',
    text: 'text-sky-900',
    border: 'border-sky-600',
    glow: 'shadow-[0_0_18px_rgba(14,165,233,0.4)]',
  },
  epic: {
    label: 'EPIC',
    bg: 'bg-purple-100',
    text: 'text-purple-900',
    border: 'border-purple-600',
    glow: 'shadow-[0_0_22px_rgba(168,85,247,0.45)]',
  },
  legendary: {
    label: 'LEGENDARY',
    bg: 'bg-amber-100',
    text: 'text-amber-950',
    border: 'border-amber-600',
    glow: 'shadow-[0_0_26px_rgba(245,158,11,0.55)]',
  },
  mythic: {
    label: 'MYTHIC',
    bg: 'bg-rose-100',
    text: 'text-rose-950',
    border: 'border-rose-600',
    glow: 'shadow-[0_0_32px_rgba(244,63,94,0.65)]',
  },
};

/**
 * Computes piecewise progress (0..100%) across evenly spaced checkpoint nodes
 * so the progress bar aligns with each checkpoint marker on the track.
 */
function getCheckpointNodePositionPct(idx: number, total: number): number {
  if (total <= 1) return 50;
  const step = 100 / total;
  return step / 2 + idx * step;
}

function getCheckpointTrackProgressPct(
  currentValue: number,
  targets: number[]
): number {
  if (targets.length === 0 || currentValue <= 0) return 0;
  const lastIdx = targets.length - 1;
  if (currentValue >= targets[lastIdx]) return 100;

  const nodePositions = targets.map((_, idx) =>
    getCheckpointNodePositionPct(idx, targets.length)
  );

  if (currentValue < targets[0]) {
    return Math.round(
      (currentValue / Math.max(1, targets[0])) * nodePositions[0]
    );
  }

  for (let i = 0; i < lastIdx; i++) {
    const startVal = targets[i];
    const endVal = targets[i + 1];
    if (currentValue >= startVal && currentValue <= endVal) {
      const ratio = (currentValue - startVal) / Math.max(1, endVal - startVal);
      const startPos = nodePositions[i];
      const endPos = nodePositions[i + 1];
      return Math.min(100, Math.round(startPos + ratio * (endPos - startPos)));
    }
  }

  return 100;
}

function getDefaultActiveCheckpointId(
  checkpoints: AchievementDef[],
  currentValue: number,
  claimedIds: string[]
): string {
  // 1. Prefer the first checkpoint that is reached and ready to claim
  const firstClaimable = checkpoints.find(
    (c) => currentValue >= c.targetValue && !claimedIds.includes(c.id)
  );
  if (firstClaimable) return firstClaimable.id;

  // 2. Otherwise prefer the next unreached checkpoint
  const nextGoal = checkpoints.find((c) => currentValue < c.targetValue);
  if (nextGoal) return nextGoal.id;

  // 3. Otherwise default to the final checkpoint
  return checkpoints[checkpoints.length - 1]?.id || '';
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  profile,
  onClaimAchievement,
  onPlaceExclusiveDecor,
  onClose,
}) => {
  const claimedList = profile.claimedAchievementIds || [];

  const streakAchievements = ACHIEVEMENTS_LIST.filter(
    (ach) => ach.type === 'streak'
  );
  const taskAchievements = ACHIEVEMENTS_LIST.filter(
    (ach) => ach.type === 'tasks'
  );

  const [selectedStreakAchId, setSelectedStreakAchId] = useState<string>(() =>
    getDefaultActiveCheckpointId(
      streakAchievements,
      profile.streakDays,
      claimedList
    )
  );
  const [selectedTaskAchId, setSelectedTaskAchId] = useState<string>(() =>
    getDefaultActiveCheckpointId(
      taskAchievements,
      profile.totalTasksCompleted,
      claimedList
    )
  );
  const [justClaimedAch, setJustClaimedAch] = useState<AchievementDef | null>(
    null
  );

  const handleClaim = (ach: AchievementDef, checkpoints: AchievementDef[]) => {
    soundFX.playEvolution();
    onClaimAchievement(ach);
    setJustClaimedAch(ach);

    const updatedClaimed = [...claimedList, ach.id];
    const currentVal =
      ach.type === 'streak' ? profile.streakDays : profile.totalTasksCompleted;
    const nextId = getDefaultActiveCheckpointId(
      checkpoints,
      currentVal,
      updatedClaimed
    );
    if (ach.type === 'streak') {
      setSelectedStreakAchId(nextId);
    } else {
      setSelectedTaskAchId(nextId);
    }
  };

  const renderMilestoneTrackCard = (params: {
    trackTitle: string;
    currentValue: number;
    icon: React.ReactNode;
    accentBarClass: string;
    checkpoints: AchievementDef[];
    selectedId: string;
    onSelectId: (id: string) => void;
  }) => {
    const {
      trackTitle,
      currentValue,
      icon,
      accentBarClass,
      checkpoints,
      selectedId,
      onSelectId,
    } = params;

    const targets = checkpoints.map((c) => c.targetValue);
    const barPct = getCheckpointTrackProgressPct(currentValue, targets);

    const activeAch =
      checkpoints.find((c) => c.id === selectedId) || checkpoints[0];
    const isReached = currentValue >= activeAch.targetValue;
    const isClaimed = claimedList.includes(activeAch.id);
    const exclusiveDecorItem = activeAch.exclusiveDecorId
      ? ROOM_DECOR_ITEMS.find((d) => d.id === activeAch.exclusiveDecorId)
      : undefined;
    const petReward = activeAch.rewardPetSpeciesId
      ? PET_SPECIES_MAP[activeAch.rewardPetSpeciesId]
      : undefined;

    const unitLabel = activeAch.type === 'streak' ? 'DAYS' : 'QUESTS';

    return (
      <div className="p-3.5 sm:p-5 bg-white pixel-box space-y-4">
        {/* Card Header: Track Name + Current Count */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-display text-[11px] sm:text-sm text-slate-900">
              {trackTitle}
            </h3>
          </div>
          <span className="px-2.5 py-1 bg-[#EFE8DD] border-2 border-[#3B4254] font-display text-xs sm:text-sm text-slate-900">
            {currentValue} {unitLabel}
          </span>
        </div>

        {/* Progress Bar + 8 Checkpoint Nodes */}
        <div className="relative pt-3 pb-1">
          <div className="w-full h-3 sm:h-3.5 bg-slate-200 border-2 border-[#3B4254]">
            <div
              className={`h-full transition-all duration-300 ${accentBarClass}`}
              style={{ width: `${barPct}%` }}
            />
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 sm:gap-1.5 -mt-5 sm:-mt-6 relative z-10">
            {checkpoints.map((ach) => {
              const nodeReached = currentValue >= ach.targetValue;
              const nodeClaimed = claimedList.includes(ach.id);
              const isSelected = ach.id === activeAch.id;

              return (
                <div key={ach.id} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => onSelectId(ach.id)}
                    className={`w-full h-8 sm:h-9 border-2 border-[#3B4254] flex items-center justify-center font-display text-[9px] sm:text-[10px] transition-transform relative ${
                      nodeClaimed
                        ? 'bg-emerald-400 text-slate-950'
                        : nodeReached
                        ? 'bg-amber-300 text-slate-950'
                        : 'bg-white text-slate-800 hover:bg-slate-50'
                    } ${
                      isSelected
                        ? 'ring-2 ring-slate-950 -translate-y-0.5 shadow-[0_2px_0_#1E293B]'
                        : ''
                    }`}
                  >
                    {nodeClaimed ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <span>{ach.targetValue}</span>
                    )}

                    {/* Ready-to-claim dot indicator */}
                    {nodeReached && !nodeClaimed && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 border border-[#3B4254] animate-pulse" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Checkpoint Detail Strip (Clean checkpoint progress + rewards below) */}
        <div className="p-3 bg-[#FAF6F0] border-2 border-[#3B4254] space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs sm:text-sm text-slate-950 font-bold">
                CHECKPOINT: {activeAch.targetValue.toLocaleString()} {unitLabel}
              </span>
              {isClaimed ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 font-display text-[9px]">
                  CLAIMED
                </span>
              ) : isReached ? (
                <span className="px-2 py-0.5 bg-amber-200 text-amber-950 border border-amber-500 font-display text-[9px] animate-pulse">
                  READY
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-white text-slate-600 border border-slate-300 font-display text-[9px]">
                  IN PROGRESS
                </span>
              )}
            </div>

            {/* Claim Action */}
            <div className="shrink-0">
              {isClaimed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-200 border border-[#3B4254] font-display text-[10px] text-slate-950">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>CLAIMED</span>
                </span>
              ) : isReached ? (
                <button
                  type="button"
                  onClick={() => handleClaim(activeAch, checkpoints)}
                  className="py-1.5 px-4 bg-amber-300 hover:bg-amber-200 text-slate-950 font-display text-xs pixel-btn animate-bounce"
                >
                  CLAIM REWARD
                </button>
              ) : null}
            </div>
          </div>

          {/* Simple Clean Rewards/Perks Row Below */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-300">
            <span className="font-display text-[9px] text-slate-500">REWARDS:</span>

            {/* Gold */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 border border-[#3B4254] font-display text-[10px] text-slate-950">
              <PixelCoinIcon size={13} />
              <span>+{activeAch.unfairGoldReward}</span>
            </div>

            {/* Exclusive Decor (Wall or Floor) */}
            {exclusiveDecorItem && (
              <div
                title={`${exclusiveDecorItem.name} (${exclusiveDecorItem.category.toUpperCase()})`}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-[#3B4254]"
              >
                <RoomDecorSvg decorId={exclusiveDecorItem.id} size={18} />
                <span className="font-pixel text-sm font-bold text-slate-800">
                  {exclusiveDecorItem.name} ({exclusiveDecorItem.category.toUpperCase()})
                </span>
              </div>
            )}

            {/* Pet Reward (At most 2 pets total in each track) */}
            {petReward && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-100 border border-rose-500 text-rose-950 font-pixel text-sm font-bold">
                <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-500" />
                <span>Pet: {petReward.name}</span>
              </div>
            )}

            {/* Permanent Perk */}
            {activeAch.permanentPerkText && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 border border-purple-500 text-purple-950 font-display text-[9px]">
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>{activeAch.permanentPerkText}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[92dvh] bg-[#FAF6F0] pixel-box overflow-hidden flex flex-col text-slate-900 shadow-2xl relative">
        {/* Clean Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-[#EFE8DD] border-b-2 border-[#3B4254] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-300 pixel-box-sm flex items-center justify-center text-slate-950 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xs sm:text-base text-slate-900">
                ACHIEVEMENTS ({claimedList.length}/{ACHIEVEMENTS_LIST.length})
              </h2>
              <p className="font-pixel text-sm font-bold text-slate-600">
                8 Milestone Checkpoints with Rare Decor, Perks & Exclusive Pets
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 sm:px-4 py-2 bg-rose-400 hover:bg-rose-300 text-slate-950 font-display text-[10px] sm:text-xs pixel-btn flex items-center gap-1.5 shrink-0"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">CLOSE</span>
          </button>
        </div>

        {/* Content: 2 Checkpoint Progress Tracks */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Track 1: Day Streak Checkpoints (7, 14, 30, 60, 90, 120, 250, 365) */}
          {renderMilestoneTrackCard({
            trackTitle: 'DAY STREAK (MAX 365 DAYS)',
            currentValue: profile.streakDays,
            icon: <Flame className="w-5 h-5 text-orange-600 shrink-0" />,
            accentBarClass: 'bg-amber-400',
            checkpoints: streakAchievements,
            selectedId: selectedStreakAchId,
            onSelectId: setSelectedStreakAchId,
          })}

          {/* Track 2: Quest Checkpoints (25, 50, 100, 250, 500, 1000, 2500, 5000) */}
          {renderMilestoneTrackCard({
            trackTitle: 'QUESTS COMPLETED (MAX 5,000)',
            currentValue: profile.totalTasksCompleted,
            icon: <CheckSquare className="w-5 h-5 text-sky-600 shrink-0" />,
            accentBarClass: 'bg-sky-400',
            checkpoints: taskAchievements,
            selectedId: selectedTaskAchId,
            onSelectId: setSelectedTaskAchId,
          })}
        </div>

        {/* CELEBRATION MODAL OVERLAY ON CLAIM */}
        {justClaimedAch && (() => {
          const decor = justClaimedAch.exclusiveDecorId
            ? ROOM_DECOR_ITEMS.find((d) => d.id === justClaimedAch.exclusiveDecorId)
            : undefined;
          const pet = justClaimedAch.rewardPetSpeciesId
            ? PET_SPECIES_MAP[justClaimedAch.rewardPetSpeciesId]
            : undefined;

          return (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-full max-w-md bg-[#FFFDF9] pixel-box p-5 text-center space-y-4 border-4 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.45)]">
                <div className="flex justify-center -mt-8">
                  <div className="w-16 h-16 rounded-full bg-amber-300 border-4 border-[#3B4254] flex items-center justify-center text-slate-950 shadow-lg animate-bounce">
                    <Trophy className="w-9 h-9" />
                  </div>
                </div>

                <div>
                  <span className="px-3 py-1 font-display text-[10px] bg-amber-300 text-slate-950 border border-[#3B4254]">
                    ★ ACHIEVEMENT UNLOCKED ★
                  </span>
                  <h3 className="font-display text-sm sm:text-base text-slate-900 mt-2">
                    {justClaimedAch.title}
                  </h3>
                </div>

                {/* Show Unlocked Rewards */}
                <div className="p-3 bg-[#FAF6F0] pixel-box space-y-3">
                  {/* Decor Showcase */}
                  {decor && (
                    <div className="flex flex-col items-center gap-1.5 p-2 bg-white pixel-box-sm">
                      <div className="font-display text-[9px] text-amber-700">
                        EXCLUSIVE {decor.category.toUpperCase()} DECOR
                      </div>
                      <RoomDecorSvg decorId={decor.id} size={70} />
                      <div className="font-display text-xs text-slate-900">
                        {decor.name}
                      </div>
                      <p className="font-pixel text-sm text-slate-600 text-center">
                        {decor.description}
                      </p>
                    </div>
                  )}

                  {/* Pet Showcase */}
                  {pet && (
                    <div className="p-2.5 bg-rose-50 border-2 border-rose-300 pixel-box-sm flex items-center justify-center gap-3">
                      <Heart className="w-6 h-6 text-rose-500 fill-rose-500 shrink-0 animate-pulse" />
                      <div className="text-left">
                        <div className="font-display text-[10px] text-rose-700">
                          NEW COMPANION UNLOCKED!
                        </div>
                        <div className="font-display text-xs text-slate-900">
                          {pet.name} ({pet.title})
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Perk Showcase */}
                  {justClaimedAch.permanentPerkText && (
                    <div className="p-2 bg-purple-50 border border-purple-300 pixel-box-sm flex items-center justify-center gap-2 text-purple-900 font-display text-[10px]">
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>{justClaimedAch.permanentPerkText}</span>
                    </div>
                  )}

                  {/* Gold Reward */}
                  <div className="flex items-center justify-center gap-2 font-display text-sm text-slate-900">
                    <PixelCoinIcon size={20} />
                    <span>+{justClaimedAch.unfairGoldReward} GOLD</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  {decor && (
                    <button
                      type="button"
                      onClick={() => {
                        onPlaceExclusiveDecor(decor);
                        setJustClaimedAch(null);
                        onClose();
                      }}
                      className="py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display text-xs pixel-btn flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>EQUIP IN ROOM</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setJustClaimedAch(null)}
                    className="py-2.5 px-5 bg-amber-300 hover:bg-amber-200 text-slate-950 font-display text-xs pixel-btn"
                  >
                    CONTINUE
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
