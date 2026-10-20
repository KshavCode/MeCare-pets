import React, { useState } from 'react';
import { Award, Check, Flame, Plus, Sparkles, X } from 'lucide-react';
import { PetSpeciesConfig, UserProfile } from '../types/game';
import {
  ADULT_STAGE_XP,
  calculateActiveAdultBonuses,
  getAdultBonusForSpecies,
  getEvolutionStage,
  getPetStageProgressInfo,
  getStreakXpMultiplier,
  getUserDisciplineLevelInfo,
  PET_SPECIES_LIST,
  RARITY_TIER_META,
} from '../data/petSpecies';
import { Pet3DCardPreview } from './Pet3DScene';

interface MaxLevelPetsModalProps {
  profile: UserProfile;
  onSelectSpecies: (species: PetSpeciesConfig) => void;
  onOpenShop: () => void;
  onClose: () => void;
}

export const MaxLevelPetsModal: React.FC<MaxLevelPetsModalProps> = ({
  profile,
  onSelectSpecies,
  onOpenShop,
  onClose,
}) => {
  // Default selected tab is 'owned' ("OWNED")
  const [tab, setTab] = useState<'owned' | 'fully_grown'>('owned');

  const xpMap = profile.petXpBySpecies || {
    [profile.activeSpeciesId]: profile.petXp,
  };

  const getSpeciesXp = (speciesId: string): number => {
    if (speciesId === profile.activeSpeciesId) {
      return Math.max(profile.petXp, xpMap[speciesId] || 0);
    }
    return xpMap[speciesId] || 0;
  };

  // Total User Discipline XP increases across all tasks irrespective of active pet
  const totalSpeciesXpSum = Object.values(xpMap).reduce(
    (sum, val) => sum + (val || 0),
    0
  );
  const effectiveUserXp = Math.max(
    profile.userXp ?? 0,
    totalSpeciesXpSum,
    profile.petXp
  );
  const userDisciplineInfo = getUserDisciplineLevelInfo(effectiveUserXp);
  const streakMultiplier = getStreakXpMultiplier(profile.streakDays);

  const unlockedSpeciesConfigs = PET_SPECIES_LIST.filter((sp) =>
    profile.unlockedSpecies.includes(sp.id)
  );

  // Pets are considered Fully Grown ONLY when they reach Adulthood (ADULT stage = 2,800 XP)
  const fullyGrownPets = unlockedSpeciesConfigs.filter(
    (sp) => getPetStageProgressInfo(getSpeciesXp(sp.id)).isAdultMax
  );

  const adultBonuses = calculateActiveAdultBonuses(
    profile,
    unlockedSpeciesConfigs
  );

  const displayedPets =
    tab === 'fully_grown' ? fullyGrownPets : unlockedSpeciesConfigs;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="w-full max-w-4xl max-h-[90dvh] bg-[#FAF6F0] pixel-box overflow-hidden flex flex-col text-slate-900">
        {/* Clean Header */}
        <div className="px-5 py-4 bg-[#EFE8DD] border-b-2 border-[#3B4254] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-300 pixel-box-sm flex items-center justify-center text-slate-950">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="font-display text-sm sm:text-base text-slate-900">
              MY PETS ({unlockedSpeciesConfigs.length})
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1 bg-rose-400 hover:bg-rose-300 text-slate-950 font-display text-xs pixel-btn flex items-center gap-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* LV X Progress Bar (No 'USER LV.' prefix) */}
          <div className="p-4 bg-white pixel-box space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 bg-emerald-300 pixel-box-sm font-display text-xs text-slate-950">
                  LV {userDisciplineInfo.level}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-orange-100 border-2 border-[#3B4254] rounded font-display text-xs text-orange-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500 fill-current" />
                  <span>x{streakMultiplier.toFixed(2)} XP</span>
                </span>
                <span className="font-pixel text-xs font-bold text-slate-700">
                  {userDisciplineInfo.intoLevelXp} /{' '}
                  {userDisciplineInfo.requiredForNextLevelXp} XP
                </span>
              </div>
            </div>

            <div className="w-full h-4 bg-slate-200 border-2 border-[#3B4254] overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${userDisciplineInfo.progressPct}%` }}
              />
            </div>
          </div>

          {/* Filter Tabs: OWNED (default) vs FULLY GROWN */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('owned')}
              className={`px-4 py-2 font-display text-xs pixel-btn flex items-center gap-1.5 ${
                tab === 'owned'
                  ? 'bg-sky-200 text-slate-950'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>OWNED ({unlockedSpeciesConfigs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab('fully_grown')}
              className={`px-4 py-2 font-display text-xs pixel-btn flex items-center gap-1.5 ${
                tab === 'fully_grown'
                  ? 'bg-amber-300 text-slate-950'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>FULLY GROWN ({fullyGrownPets.length})</span>
            </button>
          </div>

          {/* Active System Perks Summary Banner in FULLY GROWN tab */}
          {tab === 'fully_grown' && fullyGrownPets.length > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-amber-100 via-emerald-100 to-sky-100 pixel-box flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 font-display text-xs text-slate-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>TOTAL SYSTEM BOOST ({fullyGrownPets.length} Fully Grown Pets)</span>
                </div>
                <p className="font-pixel text-xs font-bold text-slate-700 mt-0.5">
                  Permanent passive perks applied across all your quests, gold rewards & interactions
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-400 text-slate-950 font-display text-[10px] pixel-box-sm">
                  +{adultBonuses.totalXpPct}% QUEST XP
                </span>
                <span className="px-2.5 py-1 bg-amber-300 text-slate-950 font-display text-[10px] pixel-box-sm">
                  +{adultBonuses.totalGoldPct}% QUEST GOLD
                </span>
                {adultBonuses.totalMoodBoost > 0 && (
                  <span className="px-2.5 py-1 bg-rose-300 text-slate-950 font-display text-[10px] pixel-box-sm">
                    +{adultBonuses.totalMoodBoost} INTERACT MOOD
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Empty State when no pet has reached Fully Grown (2,800 XP) yet: ONLY the heading */}
          {tab === 'fully_grown' && fullyGrownPets.length === 0 ? (
            <div className="p-8 bg-white pixel-box text-center">
              <h3 className="font-display text-sm text-slate-900">
                NO ADULT PETS YET
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {displayedPets.map((species) => {
                const spXp = getSpeciesXp(species.id);
                const stageInfo = getPetStageProgressInfo(spXp);
                const stage = getEvolutionStage(spXp);
                const isActive = profile.activeSpeciesId === species.id;
                const rMeta = RARITY_TIER_META[species.rarity];
                const customName =
                  profile.petCustomNames?.[species.id] || species.name;
                const adultBonus = getAdultBonusForSpecies(species);

                return (
                  <div
                    key={species.id}
                    style={{ background: species.theme.cardGradientCss }}
                    className={`pixel-box p-4 flex flex-col justify-between ${
                      isActive ? 'ring-4 ring-amber-300' : ''
                    }`}
                  >
                    <div>
                      {/* Name + Stage Badge (BABY / KID / TEEN / FULLY GROWN) */}
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <h4 className="font-display text-xs sm:text-sm text-slate-900 truncate">
                          {customName}
                        </h4>
                      </div>

                      {/* Static Sprite */}
                      <div className="relative h-36 bg-white/85 pixel-box-sm overflow-hidden mb-3 flex items-center justify-center">
                        <Pet3DCardPreview speciesId={species.id} stage={stage} />
                      </div>

                      {/* Pet Stage Growth Progress Bar (Toward Adulthood 2,800 XP) */}
                      <div className="mb-2.5">
                        <div className="flex items-center justify-between font-pixel text-xs font-bold text-slate-700 mb-1">
                          <span className="uppercase">
                            {stageInfo.isAdultMax ? 'FULLY GROWN' : stage}
                          </span>
                          <span>
                            {Math.min(spXp, ADULT_STAGE_XP)}/{ADULT_STAGE_XP} XP
                          </span>
                        </div>
                        <div className="w-full h-3 bg-white/90 border border-[#3B4254] overflow-hidden">
                          <div
                            className={`h-full ${
                              stageInfo.isAdultMax
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{
                              width: `${stageInfo.overallAdultProgressPct}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Adult System Bonus Display */}
                      <div
                        className={`p-2 rounded mb-3 text-left border ${
                          stageInfo.isAdultMax
                            ? 'bg-emerald-50 border-emerald-600'
                            : 'bg-white/80 border-[#3B4254]'
                        }`}
                      >
                        <div className="flex items-center gap-1 font-display text-[8px] font-bold">
                          <Sparkles
                            className={`w-3 h-3 shrink-0 ${
                              stageInfo.isAdultMax
                                ? 'text-emerald-700'
                                : 'text-slate-500'
                            }`}
                          />
                          <span
                            className={
                              stageInfo.isAdultMax
                                ? 'text-emerald-950'
                                : 'text-slate-700'
                            }
                          >
                            {stageInfo.isAdultMax
                              ? 'ACTIVE PERK'
                              : 'PERK'}
                          </span>
                        </div>
                        <p className="font-pixel text-sm font-bold text-slate-800 leading-snug mt-0.5">
                          {adultBonus.description}
                        </p>
                      </div>
                    </div>

                    {/* Full-Width Padded Select Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSpecies(species);
                        onClose();
                      }}
                      className={`w-full py-1 px-1 font-display text-xs pixel-btn flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-white hover:bg-amber-200 text-slate-900'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-7 h-7" />
                        </>
                      ) : (
                        <span>SELECT</span>
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Large Card inside OWNED tab: "BUY MORE" */}
              {tab === 'owned' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenShop();
                  }}
                  className="pixel-box p-4 bg-purple-100 hover:bg-purple-200 transition-colors flex flex-col items-center justify-center text-center min-h-[16.5rem] gap-3 group cursor-pointer"
                >
                  <div className="w-16 h-16 bg-white pixel-box-sm flex items-center justify-center text-slate-900 group-hover:scale-105 transition-transform">
                    <Plus className="w-8 h-8" />
                  </div>
                  <span className="font-display text-xs sm:text-sm text-slate-950">
                    BUY MORE
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
