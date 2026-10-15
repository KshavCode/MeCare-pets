import React, { useState, useEffect } from 'react';
import {
  Pencil,
  Check,
  X,
  Heart,
  Smile,
  Zap,
  Sparkles,
  Utensils,
  Dumbbell,
  Gift,
} from 'lucide-react';
import {
  EvolutionStage,
  PetSpeciesConfig,
  UserProfile,
} from '../types/game';
import { getEvolutionStage } from '../data/petSpecies';
import { PetAvatarSvg } from './PetAvatarSvg';

interface PetSanctuaryPanelProps {
  profile: UserProfile;
  species: PetSpeciesConfig;
  petMood: 'idle' | 'happy' | 'penalized';
  onRenamePet: (newName: string) => void;
  onCareAction: (action: 'feed' | 'train' | 'daily_bonus') => void;
}

const STAGE_ORDER: EvolutionStage[] = ['baby', 'kid', 'teen', 'adult'];

export const PetSanctuaryPanel: React.FC<PetSanctuaryPanelProps> = ({
  profile,
  species,
  petMood,
  onRenamePet,
  onCareAction,
}) => {
  const liveStage = getEvolutionStage(profile.petXp);
  const [inspectedStage, setInspectedStage] = useState<EvolutionStage | null>(
    null
  );
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(profile.activePetName);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setNameInput(profile.activePetName);
  }, [profile.activePetName]);

  useEffect(() => {
    setImgFailed(false);
    setInspectedStage(null);
  }, [species.id]);

  const displayedStage = inspectedStage ?? liveStage;
  const stageData = species.stages[displayedStage];
  const liveStageData = species.stages[liveStage];

  // Calculate XP progress within current stage
  const xpProgressPercent = (() => {
    if (liveStage === 'adult') return 100;
    const min = liveStageData.minXp;
    const next = liveStageData.nextXp ?? 600;
    const pct = ((profile.petXp - min) / (next - min)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  })();

  const isHealthyBonusActive =
    profile.petHealth >= 80 && profile.petHappiness >= 80;

  const todayKey = new Date().toISOString().slice(0, 10);
  const canClaimDailyCare = profile.lastDailyBonusDate !== todayKey;

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed.length >= 1 && trimmed.length <= 28) {
      onRenamePet(trimmed);
      setIsRenaming(false);
    }
  };

  const getVitalStatusText = (val: number) => {
    if (val >= 80) return 'Optimal';
    if (val >= 50) return 'Stable';
    if (val >= 25) return 'Low';
    return 'Critical';
  };

  return (
    <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-6">
      {/* Top Header: Pet Name + Pencil Rename Button + Species Info */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-400 mb-1">
              {species.name} · {liveStageData.label} Stage ({liveStageData.formName})
            </div>

            {isRenaming ? (
              <form
                onSubmit={handleSaveRename}
                className="flex items-center gap-2 mt-1"
              >
                <input
                  type="text"
                  maxLength={28}
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  aria-label="New pet name"
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-orange-500 text-white font-display text-lg font-bold focus:outline-none w-full max-w-[210px] min-h-[40px]"
                />
                <button
                  type="submit"
                  aria-label="Save pet name"
                  className="min-h-[40px] min-w-[40px] rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(profile.activePetName);
                    setIsRenaming(false);
                  }}
                  aria-label="Cancel rename"
                  className="min-h-[40px] min-w-[40px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center shrink-0 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold text-white truncate">
                  {profile.activePetName}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsRenaming(true)}
                  aria-label="Rename companion"
                  title="Rename companion"
                  className="min-h-[40px] min-w-[40px] rounded-lg bg-slate-800/80 hover:bg-slate-700 text-orange-400 hover:text-orange-300 flex items-center justify-center shrink-0 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs text-slate-400">Evolution XP</div>
            <div className="font-mono text-lg font-bold text-amber-400 tabular-nums">
              {profile.petXp} XP
            </div>
          </div>
        </div>

        {/* Sanctuary Habitat Viewport */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 min-h-[290px] flex flex-col justify-between p-5">
          {/* Habitat Background Image with Measured Scrim & Fallback */}
          {!imgFailed ? (
            <img
              src={species.habitatImage}
              alt={`${species.name} sanctuary habitat`}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="absolute inset-0 w-full h-full object-cover opacity-45 pointer-events-none select-none"
            />
          ) : (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 35%, ${species.primaryColor}33, #020617 80%)`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/55 to-slate-950/40 pointer-events-none" />

          {/* Top Overlay Metadata (Unboxed clean text) */}
          <div className="relative z-10 flex items-center justify-between gap-2 text-xs text-slate-300">
            <span>
              Form: <strong className="text-white">{stageData.formName}</strong> ·{' '}
              <span className="font-mono tabular-nums">{stageData.heightLabel}</span> ·{' '}
              <span className="font-mono tabular-nums">{stageData.weightLabel}</span>
            </span>
            {inspectedStage && inspectedStage !== liveStage && (
              <button
                type="button"
                onClick={() => setInspectedStage(null)}
                className="text-xs font-semibold text-orange-400 hover:text-orange-300 underline whitespace-nowrap shrink-0"
              >
                Return to Live Form
              </button>
            )}
          </div>

          {/* Center Animated Pet SVG */}
          <div className="relative z-10 my-auto flex items-center justify-center py-2">
            <PetAvatarSvg
              speciesId={species.id}
              stage={displayedStage}
              mood={petMood}
              size={205}
            />
          </div>

          {/* Bottom Stage Description & Passive Bonus */}
          <div className="relative z-10 text-center">
            <p className="text-xs text-slate-200 max-w-md mx-auto leading-relaxed mb-1.5">
              {stageData.description}
            </p>
            <div className="text-xs text-amber-300 font-medium">
              Trait: {species.passiveBonusText}
            </div>
          </div>
        </div>

        {/* 4-Form Evolution Selector Bar (Baby -> Kid -> Teen -> Adult) */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Evolution Forms (Click any form to inspect size & appearance)</span>
            <span className="font-mono tabular-nums text-slate-300">
              {liveStageData.nextXp
                ? `${profile.petXp} / ${liveStageData.nextXp} XP to next form`
                : 'Max Adult Form Reached'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mb-3">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-transform duration-200 origin-left"
              style={{ transform: `scaleX(${xpProgressPercent / 100})` }}
            />
          </div>

          {/* 4 Stage Interactive Buttons */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            {STAGE_ORDER.map((st, idx) => {
              const info = species.stages[st];
              const isUnlocked = profile.petXp >= info.minXp;
              const isSelected = displayedStage === st;
              const isCurrentLive = liveStage === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() =>
                    setInspectedStage(st === liveStage ? null : st)
                  }
                  className={`py-2 px-2 rounded-lg text-center transition-colors min-h-[44px] flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-orange-500/70'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span className="text-xs font-semibold whitespace-nowrap">
                    {idx + 1}. {info.label}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {isCurrentLive
                      ? 'Active'
                      : isUnlocked
                      ? 'Unlocked'
                      : `${info.minXp} XP`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Companion Vitals & Daily Care Actions */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Companion Vitals & Daily Care
          </h3>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {isHealthyBonusActive
              ? 'Healthy Care Bonus: +25% Task Rewards'
              : 'Reach 80% HP & Happy for +25% Bonus'}
          </span>
        </div>

        {/* 3 Vitals Meters */}
        <div className="space-y-2.5">
          {/* Health */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Health</span>
              </span>
              <span className="font-mono tabular-nums text-slate-200">
                {profile.petHealth}/100 · {getVitalStatusText(profile.petHealth)}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-transform duration-200 origin-left"
                style={{ transform: `scaleX(${profile.petHealth / 100})` }}
              />
            </div>
          </div>

          {/* Happiness */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Smile className="w-3.5 h-3.5 text-amber-400" />
                <span>Happiness</span>
              </span>
              <span className="font-mono tabular-nums text-slate-200">
                {profile.petHappiness}/100 · {getVitalStatusText(profile.petHappiness)}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-transform duration-200 origin-left"
                style={{ transform: `scaleX(${profile.petHappiness / 100})` }}
              />
            </div>
          </div>

          {/* Energy */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vital Energy</span>
              </span>
              <span className="font-mono tabular-nums text-slate-200">
                {profile.petEnergy}/100 · {getVitalStatusText(profile.petEnergy)}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-transform duration-200 origin-left"
                style={{ transform: `scaleX(${profile.petEnergy / 100})` }}
              />
            </div>
          </div>
        </div>

        {/* Interactive Care Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onCareAction('feed')}
            disabled={profile.gold < 15}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-45 border border-slate-800 text-left transition-colors min-h-[48px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                <span>Feed Ration</span>
              </span>
              <span className="font-mono tabular-nums text-amber-400">15 G</span>
            </div>
            <span className="text-[11px] text-slate-400">
              +15 HP · +15 Energy
            </span>
          </button>

          <button
            type="button"
            onClick={() => onCareAction('train')}
            disabled={profile.gold < 20}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-45 border border-slate-800 text-left transition-colors min-h-[48px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Dumbbell className="w-3.5 h-3.5 text-sky-400" />
                <span>Spar & Play</span>
              </span>
              <span className="font-mono tabular-nums text-amber-400">20 G</span>
            </div>
            <span className="text-[11px] text-slate-400">
              +18 Happy · +12 XP
            </span>
          </button>

          <button
            type="button"
            onClick={() => onCareAction('daily_bonus')}
            disabled={!canClaimDailyCare}
            className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-45 border border-slate-800 text-left transition-colors min-h-[48px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs font-semibold text-white">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                <span>{canClaimDailyCare ? 'Daily Check-In' : 'Claimed Today'}</span>
              </span>
              <span className="font-mono tabular-nums text-emerald-400">
                {canClaimDailyCare ? '+25 G' : 'Done'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              +10 All Vitals · +25 Gold
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};
