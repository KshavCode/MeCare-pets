import {
  PetSpeciesConfig,
  PetSpeciesId,
  PetRarityTier,
  EvolutionStage,
  TaskDifficulty,
  TaskCategory,
  StreakCrateReward,
  RoomDecorItem,
  RoomSlotId,
  AchievementDef,
  AnimalVisualArchetype,
  AnimalCryCategory,
  PetThemePalette,
  AdultPetBonus,
  UserProfile,
} from '../types/game';

import ignisHabitatImg from '../assets/images/pet_species_ignis_rex_1791560904983.jpg';
import terradonHabitatImg from '../assets/images/pet_species_terradon_1791560918483.jpg';
import aegisWolfHabitatImg from '../assets/images/pet_species_aegis_wolf_1791560930392.jpg';
import celestiaHabitatImg from '../assets/images/pet_species_celestia_1791560940703.jpg';
import obsidianTitanHabitatImg from '../assets/images/pet_species_obsidian_titan_1791560951402.jpg';

/**
 * -5% Slightly Unfair Economy Multiplier (95% of fair payout)
 */
export const UNFAIR_ECONOMY_FACTOR = 0.95;

export function applyUnfairGoldTax(fairAmount: number): number {
  return Math.max(1, Math.floor(fairAmount * UNFAIR_ECONOMY_FACTOR));
}

export const RARITY_TIER_META: Record<
  PetRarityTier,
  {
    label: string;
    count: number;
    badgeBg: string;
    borderHex: string;
    populationDesc: string;
  }
> = {
  common: {
    label: 'Common',
    count: 10,
    badgeBg: 'bg-slate-200 text-slate-800',
    borderHex: '#64748B',
    populationDesc: '300M – 33B Global Population',
  },
  uncommon: {
    label: 'Uncommon',
    count: 10,
    badgeBg: 'bg-emerald-200 text-emerald-950',
    borderHex: '#10B981',
    populationDesc: '10M – 60M Global Population',
  },
  rare: {
    label: 'Rare',
    count: 7,
    badgeBg: 'bg-sky-200 text-sky-950',
    borderHex: '#0284C7',
    populationDesc: '10K – 600K Wild Population',
  },
  epic: {
    label: 'Epic',
    count: 7,
    badgeBg: 'bg-purple-200 text-purple-950',
    borderHex: '#9333EA',
    populationDesc: 'Vulnerable Apex Wildlife',
  },
  legendary: {
    label: 'Legendary',
    count: 5,
    badgeBg: 'bg-amber-300 text-amber-950',
    borderHex: '#D97706',
    populationDesc: '<6,000 Endangered Icons',
  },
  mythic: {
    label: 'Mythic',
    count: 5,
    badgeBg: 'bg-rose-300 text-rose-950',
    borderHex: '#E11D48',
    populationDesc: '1-of-1 Ancient & Cyber Sovereigns',
  },
};

/**
 * 1. USER DISCIPLINE LEVEL SYSTEM (Unbounded Trainer Level: Lv.1, Lv.2, Lv.3, ...)
 * The level belongs to the USER (not the pet) to measure the user's overall discipline.
 * Increases continuously across all completed quests regardless of which pet is active.
 */
export function getUserDisciplineLevelInfo(userXp: number): {
  level: number;
  intoLevelXp: number;
  requiredForNextLevelXp: number;
  progressPct: number;
  totalUserXp: number;
} {
  const safeXp = Math.max(0, Math.floor(userXp));
  let level = 1;
  let remaining = safeXp;
  let stepNeeded = 120; // Lv.1 -> Lv.2 requires 120 XP, increasing by +40 XP each level

  while (remaining >= stepNeeded) {
    remaining -= stepNeeded;
    level += 1;
    stepNeeded = 120 + (level - 1) * 40;
  }

  return {
    level,
    intoLevelXp: remaining,
    requiredForNextLevelXp: stepNeeded,
    progressPct: Math.min(100, Math.round((remaining / Math.max(1, stepNeeded)) * 100)),
    totalUserXp: safeXp,
  };
}

/**
 * 2. PET STAGE MILESTONE SYSTEM (Baby -> Kid -> Teen -> Adult = Max Level)
 * Pets do NOT have numeric levels; they only have their 4 Evolution Stages.
 * A pet is considered Max Level ONLY when it reaches Adulthood (2,800 XP milestone).
 */
export const KID_STAGE_XP = 400;
export const TEEN_STAGE_XP = 1200;
export const ADULT_STAGE_XP = 2800;
export const MAX_PET_XP = ADULT_STAGE_XP;

export function getPetStageProgressInfo(petXp: number): {
  stage: EvolutionStage;
  stageLabel: string;
  isAdultMax: boolean;
  currentStageXp: number;
  nextStageSpanXp: number;
  stageProgressPct: number;
  overallAdultProgressPct: number;
  totalPetXp: number;
} {
  const safeXp = Math.max(0, Math.floor(petXp));
  if (safeXp >= ADULT_STAGE_XP) {
    return {
      stage: 'adult',
      stageLabel: 'ADULT (MAX)',
      isAdultMax: true,
      currentStageXp: ADULT_STAGE_XP,
      nextStageSpanXp: ADULT_STAGE_XP,
      stageProgressPct: 100,
      overallAdultProgressPct: 100,
      totalPetXp: safeXp,
    };
  }

  let stage: EvolutionStage = 'baby';
  let stageLabel = 'BABY';
  let floorXp = 0;
  let ceilXp = KID_STAGE_XP;

  if (safeXp >= TEEN_STAGE_XP) {
    stage = 'teen';
    stageLabel = 'TEEN';
    floorXp = TEEN_STAGE_XP;
    ceilXp = ADULT_STAGE_XP;
  } else if (safeXp >= KID_STAGE_XP) {
    stage = 'kid';
    stageLabel = 'KID';
    floorXp = KID_STAGE_XP;
    ceilXp = TEEN_STAGE_XP;
  }

  const intoStage = safeXp - floorXp;
  const span = Math.max(1, ceilXp - floorXp);

  return {
    stage,
    stageLabel,
    isAdultMax: false,
    currentStageXp: intoStage,
    nextStageSpanXp: span,
    stageProgressPct: Math.min(100, Math.round((intoStage / span) * 100)),
    overallAdultProgressPct: Math.min(
      100,
      Math.round((safeXp / ADULT_STAGE_XP) * 100)
    ),
    totalPetXp: safeXp,
  };
}

/**
 * 3. ADULT PET SYSTEMIC PERK / BONUS SYSTEM
 * Each unique pet unlocks a permanent, stacking bonus for the user's WHOLE SYSTEM
 * once the pet evolves to the Adult milestone (2,800 XP).
 * Higher rarity tiers grant progressively larger system bonuses.
 */
export function getAdultBonusForSpecies(species: PetSpeciesConfig): AdultPetBonus {
  if (species.adultBonus) {
    return species.adultBonus;
  }

  // Tier-scaled defaults with distinct identity bonuses
  switch (species.rarity) {
    case 'mythic': {
      if (species.id === 'ignis_rex') {
        return {
          description: '+25% Quest XP, +20% Quest Gold & +8 Extra Mood on Interactions',
          xpPct: 25,
          goldPct: 20,
          moodBoost: 8,
        };
      }
      if (species.id === 'terradon') {
        return {
          description: '+22% Quest XP, +24% Quest Gold & +8 Extra Mood on Interactions',
          xpPct: 22,
          goldPct: 24,
          moodBoost: 8,
        };
      }
      if (species.id === 'aegis_wolf') {
        return {
          description: '+24% Quest XP, +18% Quest Gold & +8 Extra Mood on Interactions',
          xpPct: 24,
          goldPct: 18,
          moodBoost: 8,
        };
      }
      if (species.id === 'celestia') {
        return {
          description: '+25% Quest XP, +25% Quest Gold & +10 Extra Mood on Interactions',
          xpPct: 25,
          goldPct: 25,
          moodBoost: 10,
        };
      }
      if (species.id === 'obsidian_titan') {
        return {
          description: '+20% Quest XP, +26% Quest Gold & +8 Extra Mood on Interactions',
          xpPct: 20,
          goldPct: 26,
          moodBoost: 8,
        };
      }
      return {
        description: '+22% Quest XP, +22% Quest Gold & +8 Extra Mood on Interactions',
        xpPct: 22,
        goldPct: 22,
        moodBoost: 8,
      };
    }
    case 'legendary':
      return {
        description: '+15% Quest XP, +14% Quest Gold & +6 Extra Mood on Interactions',
        xpPct: 15,
        goldPct: 14,
        moodBoost: 6,
      };
    case 'epic':
      return {
        description: '+11% Quest XP, +10% Quest Gold & +5 Extra Mood on Interactions',
        xpPct: 11,
        goldPct: 10,
        moodBoost: 5,
      };
    case 'rare':
      return {
        description: '+8% Quest XP, +8% Quest Gold & +4 Extra Mood on Interactions',
        xpPct: 8,
        goldPct: 8,
        moodBoost: 4,
      };
    case 'uncommon':
      return {
        description: '+6% Quest XP, +5% Quest Gold & +3 Extra Mood on Interactions',
        xpPct: 6,
        goldPct: 5,
        moodBoost: 3,
      };
    case 'common':
    default: {
      if (species.id === 'common_dog') {
        return {
          description: '+4% Quest XP & +2 Extra Mood on Petting',
          xpPct: 4,
          goldPct: 0,
          moodBoost: 2,
        };
      }
      if (species.id === 'common_cat') {
        return {
          description: '+4% Quest Gold & +2 Extra Mood on Petting',
          xpPct: 0,
          goldPct: 4,
          moodBoost: 2,
        };
      }
      return {
        description: '+3% Quest XP, +3% Quest Gold & +2 Extra Mood on Petting',
        xpPct: 3,
        goldPct: 3,
        moodBoost: 2,
      };
    }
  }
}

/**
 * Calculates all active adult bonuses unlocked by the user across their pet collection.
 * Only pets that have reached the ADULT stage (XP >= 2,800) activate their systemic bonuses.
 */
export function calculateActiveAdultBonuses(
  profile: UserProfile,
  speciesList: PetSpeciesConfig[] = PET_SPECIES_LIST
): {
  totalXpPct: number;
  totalGoldPct: number;
  totalMoodBoost: number;
  adultPetsCount: number;
  activeAdultPets: { species: PetSpeciesConfig; bonus: AdultPetBonus }[];
} {
  const xpMap = profile.petXpBySpecies || {
    [profile.activeSpeciesId]: profile.petXp,
  };

  const activeAdultPets: { species: PetSpeciesConfig; bonus: AdultPetBonus }[] = [];
  let totalXpPct = 0;
  let totalGoldPct = 0;
  let totalMoodBoost = 0;

  for (const sp of speciesList) {
    if (!profile.unlockedSpecies.includes(sp.id)) continue;

    const spXp =
      sp.id === profile.activeSpeciesId
        ? Math.max(profile.petXp, xpMap[sp.id] || 0)
        : xpMap[sp.id] || 0;

    if (spXp >= ADULT_STAGE_XP) {
      const bonus = getAdultBonusForSpecies(sp);
      activeAdultPets.push({ species: sp, bonus });
      totalXpPct += bonus.xpPct;
      totalGoldPct += bonus.goldPct;
      totalMoodBoost += bonus.moodBoost;
    }
  }

  return {
    totalXpPct,
    totalGoldPct,
    totalMoodBoost,
    adultPetsCount: activeAdultPets.length,
    activeAdultPets,
  };
}

/**
 * Day Streak XP Bonus Multiplier:
 * Day 1 = x1.01, Day 13 = x1.13, ..., capped at x2.00 (Day 100+)
 */
export function getStreakXpMultiplier(streakDays: number): number {
  const clamped = Math.max(0, Math.min(100, Math.floor(streakDays)));
  return Number((1 + clamped * 0.01).toFixed(2));
}

/**
 * 4:00 AM Daily Reset & Streak Boundary Helpers
 */
export function getGameDayKey4AM(nowMs: number = Date.now()): string {
  const shifted = new Date(nowMs - 4 * 60 * 60 * 1000);
  const y = shifted.getFullYear();
  const m = String(shifted.getMonth() + 1).padStart(2, '0');
  const d = String(shifted.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getGameDayOfWeek4AM(nowMs: number = Date.now()): number {
  const shifted = new Date(nowMs - 4 * 60 * 60 * 1000);
  return shifted.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
}

export function getDaysBetweenGameDays(
  earlierDayKey: string,
  laterDayKey: string
): number {
  if (!earlierDayKey || !laterDayKey || earlierDayKey === laterDayKey) {
    return 0;
  }
  const [y1, m1, d1] = earlierDayKey.split('-').map(Number);
  const [y2, m2, d2] = laterDayKey.split('-').map(Number);
  const utc1 = Date.UTC(y1, (m1 || 1) - 1, d1 || 1);
  const utc2 = Date.UTC(y2, (m2 || 1) - 1, d2 || 1);
  return Math.round((utc2 - utc1) / (24 * 60 * 60 * 1000));
}

export const STREAK_CRATE_REWARDS: StreakCrateReward[] = [
  {
    milestoneDays: 7,
    title: '7-Day Streak Rare Crate',
    subtitle: 'Weekly Consistency Supply Drop',
    crateTier: 'Rare Silver Crate',
    goldBonus: applyUnfairGoldTax(160), // 152G
    xpBonus: 0,
    itemDropName: 'Silver Focus Charm',
    cratePrimaryHex: '#64748B',
    crateTrimHex: '#E2E8F0',
    crateGemHex: '#38BDF8',
  },
  {
    milestoneDays: 30,
    title: '30-Day Streak Rare Crate',
    subtitle: 'Monthly Master Treasure Chest',
    crateTier: 'Epic Golden Crate',
    goldBonus: applyUnfairGoldTax(420), // 399G
    xpBonus: 0,
    itemDropName: 'Golden Habit Crown',
    cratePrimaryHex: '#D97706',
    crateTrimHex: '#FDE68A',
    crateGemHex: '#F43F5E',
  },
  {
    milestoneDays: 100,
    title: '100-Day Streak Rare Crate',
    subtitle: 'Centurion Legend Vault',
    crateTier: 'Mythic Diamond Crate',
    goldBonus: applyUnfairGoldTax(1050), // 997G
    xpBonus: 0,
    itemDropName: 'Astral Sovereign Core',
    cratePrimaryHex: '#7C3AED',
    crateTrimHex: '#DDD6FE',
    crateGemHex: '#38BDF8',
  },
];

/**
 * 10 ACHIEVEMENTS (5 Day Streak Milestones + 5 Task Completion Milestones)
 * Rewards Currency (Gold with -5% unfair rule applied) + Exclusive Trophy Item Crates (Not sold in Shop!)
 */
export const ACHIEVEMENTS_LIST: AchievementDef[] = [
  // DAY STREAK ACHIEVEMENTS (8 milestones: 7, 14, 30, 60, 90, 120, 250, 365 days)
  {
    id: 'ach_streak_7',
    type: 'streak',
    targetValue: 7,
    title: '7 Days Streak',
    description: 'Maintain a 7-day daily streak.',
    fairGoldValue: 300,
    unfairGoldReward: applyUnfairGoldTax(300), // 285G
    xpReward: 0,
    exclusiveDecorId: 'trophy_streak_7',
    exclusiveCrateName: '7-Day Bronze Crate',
    trophyInscription: '7',
  },
  {
    id: 'ach_streak_14',
    type: 'streak',
    targetValue: 14,
    title: '14 Days Streak',
    description: 'Maintain a 14-day daily streak.',
    fairGoldValue: 700,
    unfairGoldReward: applyUnfairGoldTax(700), // 665G
    xpReward: 0,
    exclusiveDecorId: 'clock_streak_14',
    exclusiveCrateName: '14-Day Focus Crate',
    trophyInscription: '14',
    permanentPerkText: '+3% XP',
  },
  {
    id: 'ach_streak_30',
    type: 'streak',
    targetValue: 30,
    title: '30 Days Streak',
    description: 'Maintain a 30-day daily streak.',
    fairGoldValue: 1600,
    unfairGoldReward: applyUnfairGoldTax(1600), // 1520G
    xpReward: 0,
    exclusiveDecorId: 'pillar_streak_30',
    exclusiveCrateName: '30-Day Pillar Crate',
    trophyInscription: '30',
  },
  {
    id: 'ach_streak_60',
    type: 'streak',
    targetValue: 60,
    title: '60 Days Streak',
    description: 'Maintain a 60-day daily streak.',
    fairGoldValue: 3200,
    unfairGoldReward: applyUnfairGoldTax(3200), // 3040G
    xpReward: 0,
    exclusiveDecorId: 'hourglass_streak_60',
    exclusiveCrateName: '60-Day Hourglass Crate',
    trophyInscription: '60',
    permanentPerkText: '+5% Gold',
  },
  {
    id: 'ach_streak_90',
    type: 'streak',
    targetValue: 90,
    title: '90 Days Streak',
    description: 'Maintain a 90-day daily streak.',
    fairGoldValue: 5500,
    unfairGoldReward: applyUnfairGoldTax(5500), // 5225G
    xpReward: 0,
    exclusiveDecorId: 'starchart_streak_90',
    exclusiveCrateName: '90-Day Celestial Map Crate',
    trophyInscription: '90',
    rewardPetSpeciesId: 'rare_wolf', // Pet 1 of 2 in streaks
  },
  {
    id: 'ach_streak_120',
    type: 'streak',
    targetValue: 120,
    title: '120 Days Streak',
    description: 'Maintain a 120-day daily streak.',
    fairGoldValue: 8500,
    unfairGoldReward: applyUnfairGoldTax(8500), // 8075G
    xpReward: 0,
    exclusiveDecorId: 'altar_streak_120',
    exclusiveCrateName: '120-Day Guardian Altar Crate',
    trophyInscription: '120',
    permanentPerkText: '+5% XP',
  },
  {
    id: 'ach_streak_250',
    type: 'streak',
    targetValue: 250,
    title: '250 Days Streak',
    description: 'Maintain a 250-day daily streak.',
    fairGoldValue: 18000,
    unfairGoldReward: applyUnfairGoldTax(18000), // 17100G
    xpReward: 0,
    exclusiveDecorId: 'pillar_streak_250',
    exclusiveCrateName: '250-Day Dragon Pillar Crate',
    trophyInscription: '250',
    permanentPerkText: '+10% Gold & XP',
  },
  {
    id: 'ach_streak_365',
    type: 'streak',
    targetValue: 365,
    title: '365 Days Streak',
    description: 'Maintain a 365-day daily streak.',
    fairGoldValue: 38000,
    unfairGoldReward: applyUnfairGoldTax(38000), // 36100G
    xpReward: 0,
    exclusiveDecorId: 'crown_streak_365',
    exclusiveCrateName: '365-Day Solar Crown Crate',
    trophyInscription: '365',
    rewardPetSpeciesId: 'celestia', // Pet 2 of 2 in streaks
  },

  // TASK / QUEST COMPLETION ACHIEVEMENTS (Max 5,000 quests: 25, 50, 100, 250, 500, 1000, 2500, 5000)
  {
    id: 'ach_tasks_25',
    type: 'tasks',
    targetValue: 25,
    title: '25 Quests',
    description: 'Complete 25 verified quests.',
    fairGoldValue: 320,
    unfairGoldReward: applyUnfairGoldTax(320), // 304G
    xpReward: 0,
    exclusiveDecorId: 'shield_tasks_25',
    exclusiveCrateName: '25-Task Shield Crate',
    trophyInscription: '25',
  },
  {
    id: 'ach_tasks_50',
    type: 'tasks',
    targetValue: 50,
    title: '50 Quests',
    description: 'Complete 50 verified quests.',
    fairGoldValue: 750,
    unfairGoldReward: applyUnfairGoldTax(750), // 712G
    xpReward: 0,
    exclusiveDecorId: 'shelf_tasks_50',
    exclusiveCrateName: '50-Task Bookshelf Crate',
    trophyInscription: '50',
    permanentPerkText: '+3% Gold',
  },
  {
    id: 'ach_tasks_100',
    type: 'tasks',
    targetValue: 100,
    title: '100 Quests',
    description: 'Complete 100 verified quests.',
    fairGoldValue: 1600,
    unfairGoldReward: applyUnfairGoldTax(1600), // 1520G
    xpReward: 0,
    exclusiveDecorId: 'monolith_tasks_100',
    exclusiveCrateName: '100-Task Monolith Crate',
    trophyInscription: '100',
  },
  {
    id: 'ach_tasks_250',
    type: 'tasks',
    targetValue: 250,
    title: '250 Quests',
    description: 'Complete 250 verified quests.',
    fairGoldValue: 3800,
    unfairGoldReward: applyUnfairGoldTax(3800), // 3610G
    xpReward: 0,
    exclusiveDecorId: 'obelisk_tasks_250',
    exclusiveCrateName: '250-Task Obelisk Crate',
    trophyInscription: '250',
    permanentPerkText: '+5% Gold',
  },
  {
    id: 'ach_tasks_500',
    type: 'tasks',
    targetValue: 500,
    title: '500 Quests',
    description: 'Complete 500 verified quests.',
    fairGoldValue: 8000,
    unfairGoldReward: applyUnfairGoldTax(8000), // 7600G
    xpReward: 0,
    exclusiveDecorId: 'crest_tasks_500',
    exclusiveCrateName: '500-Task Griffin Crest Crate',
    trophyInscription: '500',
    permanentPerkText: '+5% XP',
  },
  {
    id: 'ach_tasks_1000',
    type: 'tasks',
    targetValue: 1000,
    title: '1,000 Quests',
    description: 'Complete 1,000 verified quests.',
    fairGoldValue: 18000,
    unfairGoldReward: applyUnfairGoldTax(18000), // 17100G
    xpReward: 0,
    exclusiveDecorId: 'armory_tasks_1000',
    exclusiveCrateName: '1,000-Task Sovereign Armory Crate',
    trophyInscription: '1000',
    rewardPetSpeciesId: 'legendary_tiger', // Pet 1 of 2 in quests
  },
  {
    id: 'ach_tasks_2500',
    type: 'tasks',
    targetValue: 2500,
    title: '2,500 Quests',
    description: 'Complete 2,500 verified quests.',
    fairGoldValue: 36000,
    unfairGoldReward: applyUnfairGoldTax(36000), // 34200G
    xpReward: 0,
    exclusiveDecorId: 'banner_tasks_2500',
    exclusiveCrateName: '2,500-Task Dragon War Banner Crate',
    trophyInscription: '2500',
    permanentPerkText: '+8% XP',
  },
  {
    id: 'ach_tasks_5000',
    type: 'tasks',
    targetValue: 5000,
    title: '5,000 Quests',
    description: 'Complete 5,000 verified quests.',
    fairGoldValue: 75000,
    unfairGoldReward: applyUnfairGoldTax(75000), // 71250G
    xpReward: 0,
    exclusiveDecorId: 'tapestry_tasks_5000',
    exclusiveCrateName: '5,000-Task Sovereign Tapestry Crate',
    trophyInscription: '5000',
    rewardPetSpeciesId: 'ignis_rex', // Pet 2 of 2 in quests
  },
];

/**
 * Helper to generate 4-stage config for the 39 Real-World Animal Kingdom pets
 */
function buildAnimalSpecies(params: {
  id: string;
  name: string;
  title: string;
  rarity: PetRarityTier;
  populationNote: string;
  vibeTag: string;
  styleArchetype: PetSpeciesConfig['styleArchetype'];
  priceGold: number;
  isDefault?: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentHex: string;
  visualArchetype: AnimalVisualArchetype;
  cryCategory: AnimalCryCategory;
  featureTag?: string;
  bgGradientCss: string;
  passiveBonusText: string;
  babyName: string;
  kidName: string;
  teenName: string;
  adultName: string;
  adultHeight: string;
  adultWeight: string;
  lore: string;
}): PetSpeciesConfig {
  const theme: PetThemePalette = {
    name: `${params.name} Sanctuary`,
    bgGradientCss: params.bgGradientCss,
    cardGradientCss: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
    accentButtonCss: 'bg-slate-800 hover:bg-slate-700 text-white',
    badgeBgCss: 'bg-white text-slate-800 border-slate-300',
    sceneClearHex: 0xfffdf9,
    pedestalTopHex: 0xffffff,
    pedestalBaseHex: 0x3b4254,
  };

  return {
    id: params.id,
    name: params.name,
    title: params.title,
    rarity: params.rarity,
    populationNote: params.populationNote,
    vibeTag: params.vibeTag,
    styleArchetype: params.styleArchetype,
    priceGold: params.priceGold,
    isDefault: Boolean(params.isDefault),
    primaryColor: params.primaryColor,
    secondaryColor: params.secondaryColor,
    accentHex: params.accentHex,
    habitatImage: ignisHabitatImg,
    lore: params.lore,
    passiveBonusText: params.passiveBonusText,
    visualArchetype: params.visualArchetype,
    cryCategory: params.cryCategory,
    featureTag: params.featureTag,
    theme,
    stages: {
      baby: {
        stage: 'baby',
        label: 'Baby',
        formName: params.babyName,
        minXp: 0,
        nextXp: KID_STAGE_XP,
        scaleFactor: 0.74,
        heightLabel: '0.25 m',
        weightLabel: '2.5 kg',
        description: `Tiny newborn ${params.name.toLowerCase()} learning its first daily habits.`,
        milestoneTitle: `Stage I: Reach ${KID_STAGE_XP} XP`,
        milestoneTasksRequired: 10,
      },
      kid: {
        stage: 'kid',
        label: 'Kid',
        formName: params.kidName,
        minXp: KID_STAGE_XP,
        nextXp: TEEN_STAGE_XP,
        scaleFactor: 0.88,
        heightLabel: '0.55 m',
        weightLabel: '11.0 kg',
        description: `Playful young ${params.name.toLowerCase()} brimming with curiosity and energy.`,
        milestoneTitle: `Stage II: Reach ${TEEN_STAGE_XP} XP`,
        milestoneTasksRequired: 25,
      },
      teen: {
        stage: 'teen',
        label: 'Teen',
        formName: params.teenName,
        minXp: TEEN_STAGE_XP,
        nextXp: ADULT_STAGE_XP,
        scaleFactor: 1.02,
        heightLabel: '0.95 m',
        weightLabel: '28.0 kg',
        description: `Agile, well-trained ${params.name.toLowerCase()} with sharp instincts.`,
        milestoneTitle: `Stage III: Reach ${ADULT_STAGE_XP} XP`,
        milestoneTasksRequired: 50,
      },
      adult: {
        stage: 'adult',
        label: 'Adult',
        formName: params.adultName,
        minXp: ADULT_STAGE_XP,
        nextXp: null,
        scaleFactor: 1.18,
        heightLabel: params.adultHeight,
        weightLabel: params.adultWeight,
        description: `${params.lore}`,
        milestoneTitle: 'Stage IV Adult Milestone Achieved',
        milestoneTasksRequired: 70,
      },
    },
  };
}

/**
 * ALL 44 PET SPECIES ACROSS 6 RARITY CATEGORIES:
 * - 10 Common (Real World Animals — Highest Global Population, includes Default Golden Retriever)
 * - 10 Uncommon (Real World Animals — 10M–60M Population)
 * - 7 Rare (Real World Animals — 10K–600K Wild Population)
 * - 7 Epic (Real World Animals — Vulnerable Big Game & Predators)
 * - 5 Legendary (Real World Animals — Critically Endangered Icons)
 * - 5 Mythic (Our 5 Mythic Fantasy/Cyber Overlords including Ignis Rex, priced 6,000G–9,500G!)
 */
export const PET_SPECIES_LIST: PetSpeciesConfig[] = [
  // ============================================================================
  // TIER 1: COMMON (10 Real-World Animals — Highest Global Population)
  // ============================================================================
  buildAnimalSpecies({
    id: 'common_dog',
    name: 'Retriever',
    title: 'Loyal Family Companion',
    rarity: 'common',
    populationNote: '~900M Global Population',
    vibeTag: 'Default Starter · Loyal & Cheerful',
    styleArchetype: 'Balanced Starter',
    priceGold: 0,
    isDefault: true,
    primaryColor: '#F59E0B',
    secondaryColor: '#B45309',
    accentHex: '#FDE047',
    visualArchetype: 'canine',
    cryCategory: 'bark',
    featureTag: 'floppy_ears',
    bgGradientCss:
      'linear-gradient(160deg, #FFFDF9 0%, #FEF3C7 50%, #FDE68A 100%)',
    passiveBonusText: '+5% Bonus XP on Daily Discipline tasks',
    babyName: 'Goldie Pup',
    kidName: 'Sunny Barker',
    teenName: 'Scout Retriever',
    adultName: 'Retriever',
    adultHeight: '0.61 m',
    adultWeight: '32.0 kg',
    lore: 'Humanity’s most faithful friend. Wags its fluffy golden tail with boundless joy whenever you finish a daily task.',
  }),
  buildAnimalSpecies({
    id: 'common_cat',
    name: 'Tabby',
    title: 'Cozy Window Feline',
    rarity: 'common',
    populationNote: '~600M Global Population',
    vibeTag: 'Common · Agile & Independent',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 145,
    primaryColor: '#EA580C',
    secondaryColor: '#9A3412',
    accentHex: '#FED7AA',
    visualArchetype: 'feline',
    cryCategory: 'meow',
    featureTag: 'stripes',
    bgGradientCss:
      'linear-gradient(160deg, #FFFDF9 0%, #FFEDD5 50%, #FED7AA 100%)',
    passiveBonusText: '+5% Happiness retention',
    babyName: 'Mittens Kit',
    kidName: 'Whisker Pouncer',
    teenName: 'Alley mouser',
    adultName: 'Tabby',
    adultHeight: '0.28 m',
    adultWeight: '4.8 kg',
    lore: 'A striped ginger tabby with twitching whiskers and a soothing purr that keeps your study room calm.',
  }),
  buildAnimalSpecies({
    id: 'common_chicken',
    name: 'Rooster',
    title: 'Dawn Alarm Herald',
    rarity: 'common',
    populationNote: '~33 Billion Global Population',
    vibeTag: 'Common · Early Morning Riser',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 160,
    primaryColor: '#EF4444',
    secondaryColor: '#F97316',
    accentHex: '#FEF08A',
    visualArchetype: 'bird',
    cryCategory: 'chirp',
    featureTag: 'comb',
    bgGradientCss:
      'linear-gradient(160deg, #FFFDF9 0%, #FEE2E2 50%, #FECACA 100%)',
    passiveBonusText: '+5% XP on Quick morning tasks',
    babyName: 'Peep Chick',
    kidName: 'Feather Bantam',
    teenName: 'Copper Cockerel',
    adultName: 'Rooster',
    adultHeight: '0.45 m',
    adultWeight: '3.2 kg',
    lore: 'The most populous bird on Earth! Struts proudly with a bright crimson comb to wake up procrastinators.',
  }),
  buildAnimalSpecies({
    id: 'common_pigeon',
    name: 'Pigeon',
    title: 'Urban Rooftop Messenger',
    rarity: 'common',
    populationNote: '~400M Global Population',
    vibeTag: 'Common · Resilient & Swift',
    styleArchetype: 'Balanced Starter',
    priceGold: 175,
    primaryColor: '#64748B',
    secondaryColor: '#334155',
    accentHex: '#A855F7',
    visualArchetype: 'bird',
    cryCategory: 'chirp',
    featureTag: 'neck_shimmer',
    bgGradientCss:
      'linear-gradient(160deg, #F8FAFC 0%, #E2E8F0 50%, #CBD5E1 100%)',
    passiveBonusText: '+5% Gold on Quick tasks',
    babyName: 'Squab Nestling',
    kidName: 'Plaza Flyer',
    teenName: 'Carrier Dove',
    adultName: 'Pigeon',
    adultHeight: '0.32 m',
    adultWeight: '0.38 kg',
    lore: 'Adorned with iridescent purple-green neck feathers, this trusty courier never loses sight of your goals.',
  }),
  buildAnimalSpecies({
    id: 'common_rabbit',
    name: 'Bunny',
    title: 'Clover Meadow Hopper',
    rarity: 'common',
    populationNote: '~300M Global Population',
    vibeTag: 'Common · Ultra-Cute & Bouncy',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 190,
    primaryColor: '#F472B6',
    secondaryColor: '#DB2777',
    accentHex: '#FCE7F3',
    visualArchetype: 'rabbit',
    cryCategory: 'squeak',
    featureTag: 'long_ears',
    bgGradientCss:
      'linear-gradient(160deg, #FFFBFD 0%, #FCE7F3 50%, #FBCFE8 100%)',
    passiveBonusText: '+6% Energy recovery on Vitality tasks',
    babyName: 'Bunbun Kit',
    kidName: 'Clover Hopper',
    teenName: 'Meadow Sprinter',
    adultName: 'Bunny',
    adultHeight: '0.40 m',
    adultWeight: '2.2 kg',
    lore: 'With tall twitching ears and a fluffy cotton tail, this bunny hops excitedly whenever you check off a goal.',
  }),
  buildAnimalSpecies({
    id: 'common_duck',
    name: 'Mallard',
    title: 'Emerald Pond Navigator',
    rarity: 'common',
    populationNote: '~1.1 Billion Global Population',
    vibeTag: 'Common · Cheerful Waterfowl',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 205,
    primaryColor: '#10B981',
    secondaryColor: '#047857',
    accentHex: '#FACC15',
    visualArchetype: 'waterfowl',
    cryCategory: 'quack',
    featureTag: 'yellow_bill',
    bgGradientCss:
      'linear-gradient(160deg, #F4FDF8 0%, #D1FAE5 50%, #A7F3D0 100%)',
    passiveBonusText: '+6% Health & Happiness balance',
    babyName: 'Sunny Duckling',
    kidName: 'Puddle Waddler',
    teenName: 'Reed Drake',
    adultName: 'Mallard',
    adultHeight: '0.50 m',
    adultWeight: '1.4 kg',
    lore: 'Sporting a glossy emerald-green head and bright yellow bill, it waddles happily across your sanctuary floor.',
  }),
  buildAnimalSpecies({
    id: 'common_pig',
    name: 'Piglet',
    title: 'Truffle Sniffer Companion',
    rarity: 'common',
    populationNote: '~780M Global Population',
    vibeTag: 'Common · Chubby & Wholesome',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 220,
    primaryColor: '#FB7185',
    secondaryColor: '#E11D48',
    accentHex: '#FFE4E6',
    visualArchetype: 'hoofed',
    cryCategory: 'farm_low',
    featureTag: 'snout',
    bgGradientCss:
      'linear-gradient(160deg, #FFF5F7 0%, #FFE4E6 50%, #FECDD3 100%)',
    passiveBonusText: '+6% Gold found on Standard tasks',
    babyName: 'Teacup Piglet',
    kidName: 'Muddy Snouter',
    teenName: 'Truffle Boar',
    adultName: 'Piglet',
    adultHeight: '0.75 m',
    adultWeight: '110.0 kg',
    lore: 'Clever, round, and affectionate, this rosy piglet has a sixth sense for sniffing out extra gold coins.',
  }),
  buildAnimalSpecies({
    id: 'common_sheep',
    name: 'Sheep',
    title: 'Cloud-Fleece Grazer',
    rarity: 'common',
    populationNote: '~1.2 Billion Global Population',
    vibeTag: 'Common · Fluffy & Peaceful',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 235,
    primaryColor: '#94A3B8',
    secondaryColor: '#334155',
    accentHex: '#F8FAFC',
    visualArchetype: 'hoofed',
    cryCategory: 'farm_low',
    featureTag: 'wool',
    bgGradientCss:
      'linear-gradient(160deg, #FFFFFF 0%, #F1F5F9 50%, #E2E8F0 100%)',
    passiveBonusText: '+8% Rest & Energy recovery',
    babyName: 'Cotton Lamb',
    kidName: 'Fleece Jumper',
    teenName: 'Meadow Ewe',
    adultName: 'Sheep',
    adultHeight: '0.85 m',
    adultWeight: '85.0 kg',
    lore: 'Wrapped in a cloud of ultra-thick pixel wool, this gentle sheep radiates cozy tranquility.',
  }),
  buildAnimalSpecies({
    id: 'common_cow',
    name: 'Cow',
    title: 'Pasture Bell Guardian',
    rarity: 'common',
    populationNote: '~1.5 Billion Global Population',
    vibeTag: 'Common · Gentle & Sturdy',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 250,
    primaryColor: '#334155',
    secondaryColor: '#0F172A',
    accentHex: '#F472B6',
    visualArchetype: 'hoofed',
    cryCategory: 'farm_low',
    featureTag: 'spots',
    bgGradientCss:
      'linear-gradient(160deg, #F8FAFC 0%, #DCFCE7 50%, #BBF7D0 100%)',
    passiveBonusText: '+4 HP healed per completed task',
    babyName: 'Buttercup Calf',
    kidName: 'Clover Heifer',
    teenName: 'Bell Grazer',
    adultName: 'Cow',
    adultHeight: '1.40 m',
    adultWeight: '580.0 kg',
    lore: 'With classic black-and-white patches and a brass pasture bell, it keeps your companion vitality rock-solid.',
  }),
  buildAnimalSpecies({
    id: 'common_goat',
    name: 'Goat',
    title: 'Crag Climber Capra',
    rarity: 'common',
    populationNote: '~1.1 Billion Global Population',
    vibeTag: 'Common · Stubborn & Determined',
    styleArchetype: 'Cool & Tactical',
    priceGold: 265,
    primaryColor: '#A16207',
    secondaryColor: '#713F12',
    accentHex: '#FEF08A',
    visualArchetype: 'hoofed',
    cryCategory: 'farm_low',
    featureTag: 'horns',
    bgGradientCss:
      'linear-gradient(160deg, #FEFCE8 0%, #FEF08A 48%, #FDE047 100%)',
    passiveBonusText: '+7% XP on Strength & Discipline tasks',
    babyName: 'Billy Kid',
    kidName: 'Ledge Hopper',
    teenName: 'Ridge Buck',
    adultName: 'Goat',
    adultHeight: '0.95 m',
    adultWeight: '72.0 kg',
    lore: 'No mountain or task list is too steep for this sure-footed alpine climber with curved ridge horns.',
  }),

  // ============================================================================
  // TIER 2: UNCOMMON (10 Real-World Animals — 10M to 60M Global Population)
  // ============================================================================
  buildAnimalSpecies({
    id: 'uncommon_horse',
    name: 'Mustang',
    title: 'Prairie Wind Charger',
    rarity: 'uncommon',
    populationNote: '~58M Global Population',
    vibeTag: 'Uncommon · Noble & Fast',
    styleArchetype: 'Cool & Tactical',
    priceGold: 360,
    primaryColor: '#B45309',
    secondaryColor: '#78350F',
    accentHex: '#FDE68A',
    visualArchetype: 'hoofed',
    cryCategory: 'farm_low',
    featureTag: 'mane',
    bgGradientCss:
      'linear-gradient(160deg, #FFFBEB 0%, #FDE68A 50%, #FCD34D 100%)',
    passiveBonusText: '+8% XP on Fitness & Strength tasks',
    babyName: 'Chestnut Foal',
    kidName: 'Prairie Colt',
    teenName: 'Canyon Bronco',
    adultName: 'Mustang',
    adultHeight: '1.62 m',
    adultWeight: '450.0 kg',
    lore: 'A spirited chestnut stallion with a flowing mane that gallops through your daily workload.',
  }),
  buildAnimalSpecies({
    id: 'uncommon_parrot',
    name: 'Macaw',
    title: 'Tropical Canopy Vocalist',
    rarity: 'uncommon',
    populationNote: '~50M Global Parrot Population',
    vibeTag: 'Uncommon · Colorful & Chatty',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 385,
    primaryColor: '#EF4444',
    secondaryColor: '#2563EB',
    accentHex: '#FACC15',
    visualArchetype: 'bird',
    cryCategory: 'chirp',
    featureTag: 'tropical_wings',
    bgGradientCss:
      'linear-gradient(160deg, #FFF5F5 0%, #FED7AA 48%, #93C5FD 100%)',
    passiveBonusText: '+8% Gold on Study & Intellect tasks',
    babyName: 'Mango Chick',
    kidName: 'Rio Flapper',
    teenName: 'Sun-Wing Lori',
    adultName: 'Macaw',
    adultHeight: '0.84 m',
    adultWeight: '1.3 kg',
    lore: 'Dressed in dazzling crimson, gold, and cobalt plumage, it cheers loudly every time you finish a task.',
  }),
  buildAnimalSpecies({
    id: 'uncommon_squirrel',
    name: 'Squirrel',
    title: 'Oak Treetop Hoarder',
    rarity: 'uncommon',
    populationNote: '~45M Wild Population',
    vibeTag: 'Uncommon · Hyper-Focused Collector',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 410,
    primaryColor: '#D97706',
    secondaryColor: '#92400E',
    accentHex: '#FDE047',
    visualArchetype: 'rodent',
    cryCategory: 'squeak',
    featureTag: 'bushy_tail',
    bgGradientCss:
      'linear-gradient(160deg, #FFFBEB 0%, #FFEDD5 50%, #FDBA74 100%)',
    passiveBonusText: '+9% Gold hoarded from all tasks',
    babyName: 'Nutkin Kit',
    kidName: 'Branch Dasher',
    teenName: 'Acorn Warden',
    adultName: 'Squirrel',
    adultHeight: '0.24 m',
    adultWeight: '0.35 kg',
    lore: 'Famous for saving acorns for winter, this bushy-tailed planner helps you stack gold for high-tier pets.',
  }),
  buildAnimalSpecies({
    id: 'uncommon_hedgehog',
    name: 'Hedgehog',
    title: 'Spiky Moss Explorer',
    rarity: 'uncommon',
    populationNote: '~30M Wild Population',
    vibeTag: 'Uncommon · Cozy & Armored',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 435,
    primaryColor: '#92400E',
    secondaryColor: '#451A03',
    accentHex: '#FDE68A',
    visualArchetype: 'rodent',
    cryCategory: 'squeak',
    featureTag: 'quills',
    bgGradientCss:
      'linear-gradient(160deg, #FEFCE8 0%, #E7E5E4 50%, #D6D3D1 100%)',
    passiveBonusText: 'Reduces Rush Penalty HP loss by 15%',
    babyName: 'Prickle Hoglet',
    kidName: 'Bramble Roller',
    teenName: 'Quill Scout',
    adultName: 'Hedgehog',
    adultHeight: '0.22 m',
    adultWeight: '1.1 kg',
    lore: 'A round little forest dweller with protective cocoa quills and a button nose.',
  }),
  buildAnimalSpecies({
    id: 'uncommon_deer',
    name: 'Stag',
    title: 'Sunlit Glade Antler Lord',
    rarity: 'uncommon',
    populationNote: '~35M Wild Population',
    vibeTag: 'Uncommon · Graceful & Regal',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 460,
    primaryColor: '#D97706',
    secondaryColor: '#78350F',
    accentHex: '#FEF9C3',
    visualArchetype: 'hoofed',
    cryCategory: 'farm_low',
    featureTag: 'antlers',
    bgGradientCss:
      'linear-gradient(160deg, #F0FDF4 0%, #DCFCE7 50%, #FDE68A 100%)',
    passiveBonusText: '+9% XP on Vitality & Health tasks',
    babyName: 'Spotted Fawn',
    kidName: 'Glade Yearling',
    teenName: 'Velvet Buck',
    adultName: 'Stag',
    adultHeight: '1.10 m',
    adultWeight: '95.0 kg',
    lore: 'Starts as a starry-spotted fawn and grows a magnificent crown of branching woodland antlers.',
  }),
  buildAnimalSpecies({
    id: 'uncommon_fox',
    name: 'Red Fox',
    title: 'Clever Autumn Trickster',
    rarity: 'uncommon',
    populationNote: '~25M Wild Population',
    vibeTag: 'Uncommon · Clever & Sleek',
    styleArchetype: 'Cool & Tactical',
    priceGold: 485,
    primaryColor: '#EA580C',
    secondaryColor: '#9A3412',
    accentHex: '#FFFFFF',
    visualArchetype: 'canine',
    cryCategory: 'bark',
    featureTag: 'white_tail_tip',
    bgGradientCss:
      'linear-gradient(160deg, #FFF7ED 0%, #FFEDD5 50%, #FB923C 100%)',
    passiveBonusText: '+10% XP on Intellect & Study tasks',
    babyName: 'Rusty Kit',
    kidName: 'Vixen Prowler',
    teenName: 'Autumn Reynard',
    adultName: 'Red Fox',
    adultHeight: '0.45 m',
    adultWeight: '8.5 kg',
    lore: 'Sharp-eared and quick-witted, the Red Fox thrives on clever problem-solving and deep study blocks.',
  }),
  buildAnimalSpecies({
    id: 'uncommon_raccoon',
    name: 'Raccoon',
    title: 'Midnight Masked Tactician',
    rarity: 'uncommon',
    populationNote: '~20M Wild Population',
    vibeTag: 'Uncommon · Mischievous & Smart',
    styleArchetype: 'Cool & Tactical',
    priceGold: 510,
    primaryColor: '#475569',
    secondaryColor: '#1E293B',
    accentHex: '#E2E8F0',
    visualArchetype: 'rodent',
    cryCategory: 'squeak',
    featureTag: 'bandit_mask',
    bgGradientCss:
      'linear-gradient(160deg, #F8FAFC 0%, #E2E8F0 50%, #94A3B8 100%)',
    passiveBonusText: '+10% Gold looted from Deep Work tasks',
    babyName: 'Mask Cub',
    kidName: 'Ringtail Scamp',
    teenName: 'Night Burglar',
    adultName: 'Raccoon',
    adultHeight: '0.38 m',
    adultWeight: '9.2 kg',
    lore: 'Wearing a natural domino mask and ringed tail, this nimble tactician washes every gold coin it earns.',
  }),
  buildAnimalSpecies({
    id: 'uncommon_owl',
    name: 'Owl',
    title: 'Midnight Library Scholar',
    rarity: 'uncommon',
    populationNote: '~15M Wild Population',
    vibeTag: 'Uncommon · Wise Night Guardian',
    styleArchetype: 'Cool & Tactical',
    priceGold: 535,
    primaryColor: '#78350F',
    secondaryColor: '#451A03',
    accentHex: '#FACC15',
    visualArchetype: 'bird',
    cryCategory: 'chirp',
    featureTag: 'owl_tufts',
    bgGradientCss:
      'linear-gradient(160deg, #FEFCE8 0%, #E0E7FF 50%, #C7D2FE 100%)',
    passiveBonusText: '+11% XP on Study & Intellect tasks',
    babyName: 'Downy Owlet',
    kidName: 'Belfry Watcher',
    teenName: 'Moon-Wing Strix',
    adultName: 'Owl',
    adultHeight: '0.58 m',
    adultWeight: '1.8 kg',
    lore: 'With piercing golden eyes and feathered ear-tufts, it watches over late-night coding and study sprints.',
  }),
  buildAnimalSpecies({
    id: 'uncommon_penguin',
    name: 'Penguin',
    title: 'Antarctic Tuxedo Navigator',
    rarity: 'uncommon',
    populationNote: '~12M Total Penguin Population',
    vibeTag: 'Uncommon · Dapper & Chill',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 560,
    primaryColor: '#1E293B',
    secondaryColor: '#0F172A',
    accentHex: '#38BDF8',
    visualArchetype: 'waterfowl',
    cryCategory: 'quack',
    featureTag: 'tuxedo',
    bgGradientCss:
      'linear-gradient(160deg, #F0F9FF 0%, #E0F2FE 50%, #7DD3FC 100%)',
    passiveBonusText: '+10% Streak stability & +5 Energy per task',
    babyName: 'Snowball Chick',
    kidName: 'Ice Toboggan',
    teenName: 'Glacier Diver',
    adultName: 'Penguin',
    adultHeight: '1.15 m',
    adultWeight: '35.0 kg',
    lore: 'Dressed in a crisp black-and-white tuxedo with golden collar accents, it slides joyfully across icy challenges.',
  }),
  buildAnimalSpecies({
    id: 'uncommon_capybara',
    name: 'Capybara',
    title: 'Zen Yuzu Master',
    rarity: 'uncommon',
    populationNote: '~10M Wild Population',
    vibeTag: 'Uncommon · Maximum Chill & Unbothered',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 590,
    primaryColor: '#B45309',
    secondaryColor: '#78350F',
    accentHex: '#FACC15',
    visualArchetype: 'rodent',
    cryCategory: 'squeak',
    featureTag: 'yuzu_head',
    bgGradientCss:
      'linear-gradient(160deg, #ECFDF5 0%, #FEF3C7 50%, #FDE68A 100%)',
    passiveBonusText: '+12% Happiness & +5 HP on every task',
    babyName: 'Cocoa Pup',
    kidName: 'River Lounger',
    teenName: 'Onsen Soaker',
    adultName: 'Capybara',
    adultHeight: '0.62 m',
    adultWeight: '58.0 kg',
    lore: 'Balancing a golden yuzu citrus fruit on its head, this unflappable giant rodent brings pure zen to your workflow.',
  }),

  // ============================================================================
  // TIER 3: RARE (7 Real-World Animals — 10K to 600K Wild Population)
  // ============================================================================
  buildAnimalSpecies({
    id: 'rare_dolphin',
    name: 'Dolphin',
    title: 'Coral Wave Acrobat',
    rarity: 'rare',
    populationNote: '~600,000 Wild Population',
    vibeTag: 'Rare · Playful Genius of the Sea',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 780,
    primaryColor: '#0284C7',
    secondaryColor: '#0369A1',
    accentHex: '#BAE6FD',
    visualArchetype: 'aquatic',
    cryCategory: 'splash',
    featureTag: 'dorsal_fin',
    bgGradientCss:
      'linear-gradient(160deg, #F0F9FF 0%, #BAE6FD 50%, #38BDF8 100%)',
    passiveBonusText: '+12% XP & Gold on Intellect tasks',
    babyName: 'Ripple Calf',
    kidName: 'Lagoon Jumper',
    teenName: 'Crest Spinner',
    adultName: 'Dolphin',
    adultHeight: '2.60 m',
    adultWeight: '220.0 kg',
    lore: 'One of the smartest creatures on the planet, capable of dazzling backflips and sonar echolocation.',
  }),
  buildAnimalSpecies({
    id: 'rare_eagle',
    name: 'Eagle',
    title: 'Sky Summit Sovereign',
    rarity: 'rare',
    populationNote: '~316,000 Wild Population',
    vibeTag: 'Rare · Fierce & Majestic Predator',
    styleArchetype: 'Cool & Tactical',
    priceGold: 850,
    primaryColor: '#78350F',
    secondaryColor: '#451A03',
    accentHex: '#FACC15',
    visualArchetype: 'bird',
    cryCategory: 'chirp',
    featureTag: 'white_crest',
    bgGradientCss:
      'linear-gradient(160deg, #FEFCE8 0%, #FDE68A 50%, #93C5FD 100%)',
    passiveBonusText: '+13% XP on Epic & Deep tasks',
    babyName: 'Aerie Eaglet',
    kidName: 'Cliff Glider',
    teenName: 'Talon Raptor',
    adultName: 'Eagle',
    adultHeight: '0.92 m',
    adultWeight: '6.3 kg',
    lore: 'With a snow-white crown and a two-meter wingspan, it surveys your entire daily schedule from the clouds.',
  }),
  buildAnimalSpecies({
    id: 'rare_wolf',
    name: 'Wolf',
    title: 'Northwind Pack Alpha',
    rarity: 'rare',
    populationNote: '~250,000 Wild Population',
    vibeTag: 'Rare · Cool & Manly Pack Leader',
    styleArchetype: 'Cool & Tactical',
    priceGold: 920,
    primaryColor: '#475569',
    secondaryColor: '#1E293B',
    accentHex: '#38BDF8',
    visualArchetype: 'canine',
    cryCategory: 'bark',
    featureTag: 'wolf_ruff',
    bgGradientCss:
      'linear-gradient(160deg, #F8FAFC 0%, #E0F2FE 50%, #94A3B8 100%)',
    passiveBonusText: '+14% Bonus Gold on Discipline & Strength tasks',
    babyName: 'Tundra Cub',
    kidName: 'Frost Tracker',
    teenName: 'Silverfang Stalker',
    adultName: 'Wolf',
    adultHeight: '0.88 m',
    adultWeight: '62.0 kg',
    lore: 'Relentless, loyal, and fierce. The Arctic Timber Wolf leads the pack through the toughest discipline streaks.',
  }),
  buildAnimalSpecies({
    id: 'rare_peacock',
    name: 'Peacock',
    title: 'Hundred-Eye Plumage King',
    rarity: 'rare',
    populationNote: '~150,000 Wild Population',
    vibeTag: 'Rare · Dazzling Iridescent Royalty',
    styleArchetype: 'Ultra-Cute Cosmic',
    priceGold: 990,
    primaryColor: '#0D9488',
    secondaryColor: '#1D4ED8',
    accentHex: '#FACC15',
    visualArchetype: 'bird',
    cryCategory: 'chirp',
    featureTag: 'peacock_fan',
    bgGradientCss:
      'linear-gradient(160deg, #F0FDFA 0%, #CCFBF1 48%, #93C5FD 100%)',
    passiveBonusText: '+14% Gold earned across all task categories',
    babyName: 'Sapphire Peachick',
    kidName: 'Plume Dancer',
    teenName: 'Crested Pavon',
    adultName: 'Peacock',
    adultHeight: '1.15 m',
    adultWeight: '5.5 kg',
    lore: 'Unfurls a breathtaking pixel fan of emerald, sapphire, and gold eyespots when you complete your tasks.',
  }),
  buildAnimalSpecies({
    id: 'rare_chameleon',
    name: 'Chameleon',
    title: 'Prism Scale Shifter',
    rarity: 'rare',
    populationNote: '~120,000 Wild Population',
    vibeTag: 'Rare · Exotic & Rainbow-Scaled',
    styleArchetype: 'Cool & Tactical',
    priceGold: 1060,
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    accentHex: '#EC4899',
    visualArchetype: 'reptile',
    cryCategory: 'splash',
    featureTag: 'curled_tail',
    bgGradientCss:
      'linear-gradient(160deg, #ECFDF5 0%, #D1FAE5 48%, #FBCFE8 100%)',
    passiveBonusText: '+14% XP on adaptable multi-category tasks',
    babyName: 'Leaf Hatchling',
    kidName: 'Branch Camo',
    teenName: 'Neon Crest Lizard',
    adultName: 'Chameleon',
    adultHeight: '0.44 m',
    adultWeight: '0.25 kg',
    lore: 'With a spiral tail and color-shifting turquoise-and-magenta scales, it zaps procrastination with precision.',
  }),
  buildAnimalSpecies({
    id: 'rare_koala',
    name: 'Koala',
    title: 'Silver Gumtree Dreamer',
    rarity: 'rare',
    populationNote: '~100,000 Wild Population',
    vibeTag: 'Rare · Fluffy & Adorable',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 1130,
    primaryColor: '#64748B',
    secondaryColor: '#475569',
    accentHex: '#A7F3D0',
    visualArchetype: 'bear_ape',
    cryCategory: 'squeak',
    featureTag: 'koala_ears',
    bgGradientCss:
      'linear-gradient(160deg, #F8FAFC 0%, #D1FAE5 50%, #CBD5E1 100%)',
    passiveBonusText: '+6 HP & +8 Happiness on every task',
    babyName: 'Pouch Joey',
    kidName: 'Gumtree Hugger',
    teenName: 'Silver-Ear Koala',
    adultName: 'Koala',
    adultHeight: '0.75 m',
    adultWeight: '13.5 kg',
    lore: 'With oversized fluffy round ears and a eucalyptus branch in paw, it brings stress-free focus to your day.',
  }),
  buildAnimalSpecies({
    id: 'rare_red_panda',
    name: 'Red Panda',
    title: 'Misty Bamboo Acrobat',
    rarity: 'rare',
    populationNote: '~10,000 Wild Population',
    vibeTag: 'Rare · Beloved Ring-Tailed Fire-Fox',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 1200,
    primaryColor: '#DC2626',
    secondaryColor: '#7C2D12',
    accentHex: '#FEF3C7',
    visualArchetype: 'rodent',
    cryCategory: 'squeak',
    featureTag: 'ring_tail',
    bgGradientCss:
      'linear-gradient(160deg, #FFF7ED 0%, #FED7AA 50%, #FCA5A5 100%)',
    passiveBonusText: '+15% XP & Gold on Standard and Deep tasks',
    babyName: 'Cinder Cub',
    kidName: 'Bamboo Climber',
    teenName: 'Cloud-Tail Ailurus',
    adultName: 'Red Panda',
    adultHeight: '0.60 m',
    adultWeight: '6.2 kg',
    lore: 'With cinnamon-red fur, white cheek badges, and a striped bushy tail, it stands on its hind legs to celebrate your wins!',
  }),

  // ============================================================================
  // TIER 4: EPIC (7 Real-World Animals — Vulnerable Big Game & Apex Predators)
  // ============================================================================
  buildAnimalSpecies({
    id: 'epic_elephant',
    name: 'Elephant',
    title: 'Savanna Earth Shaker',
    rarity: 'epic',
    populationNote: '~415,000 Wild (Vulnerable)',
    vibeTag: 'Epic · Colossal Ivory Titan',
    styleArchetype: 'Cool & Tactical',
    priceGold: 1550,
    primaryColor: '#64748B',
    secondaryColor: '#334155',
    accentHex: '#FEF9C3',
    visualArchetype: 'pachyderm',
    cryCategory: 'farm_low',
    featureTag: 'trunk_tusks',
    bgGradientCss:
      'linear-gradient(160deg, #F8FAFC 0%, #FEF3C7 50%, #CBD5E1 100%)',
    passiveBonusText: '+16% XP & +6 HP on all completed tasks',
    babyName: 'Trunklet Calf',
    kidName: 'Acacia Stomper',
    teenName: 'Ivory Bull',
    adultName: 'Elephant',
    adultHeight: '3.30 m',
    adultWeight: '6000.0 kg',
    lore: 'The largest land mammal on Earth! Raises its pixel trunk in a triumphant trumpet blast when you conquer hard tasks.',
  }),
  buildAnimalSpecies({
    id: 'epic_hippo',
    name: 'Hippo',
    title: 'Armored River Juggernaut',
    rarity: 'epic',
    populationNote: '~115,000 Wild (Vulnerable)',
    vibeTag: 'Epic · Heavyweight River Tank',
    styleArchetype: 'Fierce & Badass',
    priceGold: 1680,
    primaryColor: '#6D28D9',
    secondaryColor: '#4C1D95',
    accentHex: '#F472B6',
    visualArchetype: 'pachyderm',
    cryCategory: 'roar',
    featureTag: 'hippo_jaw',
    bgGradientCss:
      'linear-gradient(160deg, #FAF5FF 0%, #E9D5FF 50%, #C4B5FD 100%)',
    passiveBonusText: '+16% Gold on Strength & Vitality tasks',
    babyName: 'Lotus Hippo Calf',
    kidName: 'Delta Wader',
    teenName: 'River Crusher',
    adultName: 'Hippo',
    adultHeight: '1.65 m',
    adultWeight: '1800.0 kg',
    lore: 'Don’t let the round ears fool you—this river juggernaut charges through obstacles with unstoppable torque.',
  }),
  buildAnimalSpecies({
    id: 'epic_giraffe',
    name: 'Giraffe',
    title: 'Horizon Watchtower',
    rarity: 'epic',
    populationNote: '~68,000 Wild (Vulnerable)',
    vibeTag: 'Epic · Towering Golden Mosaic',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 1810,
    primaryColor: '#F59E0B',
    secondaryColor: '#92400E',
    accentHex: '#FEF08A',
    visualArchetype: 'giraffe',
    cryCategory: 'farm_low',
    featureTag: 'long_neck',
    bgGradientCss:
      'linear-gradient(160deg, #FFFBEB 0%, #FEF08A 50%, #FDBA74 100%)',
    passiveBonusText: '+17% XP on Long-Horizon & Deep tasks',
    babyName: 'Tall-Leg Calf',
    kidName: 'Canopy Grazer',
    teenName: 'Sun-Spot Strider',
    adultName: 'Giraffe',
    adultHeight: '5.50 m',
    adultWeight: '1200.0 kg',
    lore: 'Towering above the acacia trees with mosaic spots and cute ossicone horns, it gives you high-altitude perspective.',
  }),
  buildAnimalSpecies({
    id: 'epic_grizzly',
    name: 'Grizzly',
    title: 'Mountain Timber Titan',
    rarity: 'epic',
    populationNote: '~55,000 Wild Population',
    vibeTag: 'Epic · Heavy-Hitting Wilderness Boss',
    styleArchetype: 'Fierce & Badass',
    priceGold: 1940,
    primaryColor: '#78350F',
    secondaryColor: '#451A03',
    accentHex: '#F59E0B',
    visualArchetype: 'bear_ape',
    cryCategory: 'roar',
    featureTag: 'bear_claws',
    bgGradientCss:
      'linear-gradient(160deg, #FFFBEB 0%, #FDE68A 48%, #D6D3D1 100%)',
    passiveBonusText: '+18% XP on Strength & Fitness tasks',
    babyName: 'Honey Cub',
    kidName: 'Salmon Catcher',
    teenName: 'Timber Brawler',
    adultName: 'Grizzly',
    adultHeight: '2.80 m',
    adultWeight: '680.0 kg',
    lore: 'A massive mountain bruin whose thunderous roar intimidates any procrastination in its path.',
  }),
  buildAnimalSpecies({
    id: 'epic_lion',
    name: 'Lion',
    title: 'Serengeti Sun King',
    rarity: 'epic',
    populationNote: '~20,000 Wild (Vulnerable)',
    vibeTag: 'Epic · Regal King of Beasts',
    styleArchetype: 'Fierce & Badass',
    priceGold: 2070,
    primaryColor: '#D97706',
    secondaryColor: '#7C2D12',
    accentHex: '#FACC15',
    visualArchetype: 'feline',
    cryCategory: 'roar',
    featureTag: 'lion_mane',
    bgGradientCss:
      'linear-gradient(160deg, #FFFBEB 0%, #FDE68A 48%, #FB923C 100%)',
    passiveBonusText: '+18% XP & Gold on Epic Milestone tasks',
    babyName: 'Simba Cub',
    kidName: 'Savanna Prowler',
    teenName: 'Golden-Crest Prince',
    adultName: 'Lion',
    adultHeight: '1.25 m',
    adultWeight: '225.0 kg',
    lore: 'Crowned with a blazing golden mane, the King of Beasts commands total discipline and pride.',
  }),
  buildAnimalSpecies({
    id: 'epic_shark',
    name: 'Shark',
    title: 'Abyssal Ocean Torpedo',
    rarity: 'epic',
    populationNote: '~4,500 Wild (Vulnerable)',
    vibeTag: 'Epic · Relentless Deep-Sea Predator',
    styleArchetype: 'Fierce & Badass',
    priceGold: 2200,
    primaryColor: '#0284C7',
    secondaryColor: '#0F172A',
    accentHex: '#F43F5E',
    visualArchetype: 'aquatic',
    cryCategory: 'roar',
    featureTag: 'shark_jaws',
    bgGradientCss:
      'linear-gradient(160deg, #F0F9FF 0%, #BAE6FD 48%, #64748B 100%)',
    passiveBonusText: '+19% Gold & XP on Deep Work sprints',
    babyName: 'Reef Pup',
    kidName: 'Trench Hunter',
    teenName: 'Razorfin Mako',
    adultName: 'Shark',
    adultHeight: '4.80 m',
    adultWeight: '1900.0 kg',
    lore: 'Built for forward momentum—never stops moving, never stops grinding through your daily checklist.',
  }),
  buildAnimalSpecies({
    id: 'epic_gorilla',
    name: 'Gorilla',
    title: 'Virunga Mist Titan',
    rarity: 'epic',
    populationNote: '~1,063 Wild Mountain Gorillas',
    vibeTag: 'Epic · Pure Muscular Powerhouse',
    styleArchetype: 'Fierce & Badass',
    priceGold: 2350,
    primaryColor: '#334155',
    secondaryColor: '#0F172A',
    accentHex: '#E2E8F0',
    visualArchetype: 'bear_ape',
    cryCategory: 'roar',
    featureTag: 'silver_saddle',
    bgGradientCss:
      'linear-gradient(160deg, #F8FAFC 0%, #D1FAE5 48%, #94A3B8 100%)',
    passiveBonusText: '+20% XP on Strength & Discipline tasks',
    babyName: 'Canopy Infant',
    kidName: 'Chest-Drummer',
    teenName: 'Jungle Enforcer',
    adultName: 'Gorilla',
    adultHeight: '1.85 m',
    adultWeight: '210.0 kg',
    lore: 'Beats its mighty silver-plated chest with thunderous power whenever you smash a personal record.',
  }),

  // ============================================================================
  // TIER 5: LEGENDARY (5 Critically Rare Real-World Animals — <6,000 Wild)
  // ============================================================================
  buildAnimalSpecies({
    id: 'legendary_rhino',
    name: 'Rhino',
    title: 'Twin-Horned Living Tank',
    rarity: 'legendary',
    populationNote: '~6,000 Wild (Critically Endangered)',
    vibeTag: 'Legendary · Unstoppable Armored Juggernaut',
    styleArchetype: 'Fierce & Badass',
    priceGold: 3100,
    primaryColor: '#475569',
    secondaryColor: '#1E293B',
    accentHex: '#FACC15',
    visualArchetype: 'pachyderm',
    cryCategory: 'roar',
    featureTag: 'rhino_horn',
    bgGradientCss:
      'linear-gradient(160deg, #F8FAFC 0%, #E2E8F0 48%, #FDE047 100%)',
    passiveBonusText: '+22% XP & Gold on Strength & Discipline tasks',
    babyName: 'Pebble Calf',
    kidName: 'Iron-Hide Charger',
    teenName: 'Twin-Horn Bastion',
    adultName: 'Rhino',
    adultHeight: '1.75 m',
    adultWeight: '1400.0 kg',
    lore: 'Clad in natural plate armor with a golden front horn, fewer than 6,000 remain in the wild.',
  }),
  buildAnimalSpecies({
    id: 'legendary_snow_leopard',
    name: 'Snow Leopard',
    title: 'Himalayan Peak Phantom',
    rarity: 'legendary',
    populationNote: '~4,000 Wild (Endangered)',
    vibeTag: 'Legendary · Sleek Frost Assassin',
    styleArchetype: 'Cool & Tactical',
    priceGold: 3400,
    primaryColor: '#94A3B8',
    secondaryColor: '#334155',
    accentHex: '#38BDF8',
    visualArchetype: 'feline',
    cryCategory: 'roar',
    featureTag: 'rosette_spots',
    bgGradientCss:
      'linear-gradient(160deg, #F0F9FF 0%, #E0F2FE 48%, #CBD5E1 100%)',
    passiveBonusText: '+23% Gold & XP on Deep Work & Intellect tasks',
    babyName: 'Glacier Cub',
    kidName: 'Frost Rosette',
    teenName: 'Summit Stalker',
    adultName: 'Snow Leopard',
    adultHeight: '0.65 m',
    adultWeight: '54.0 kg',
    lore: 'Known as the Ghost of the Mountains, its silver-rosette coat and thick tail embody silent mastery.',
  }),
  buildAnimalSpecies({
    id: 'legendary_tiger',
    name: 'Tiger',
    title: 'Striped Jungle Emperor',
    rarity: 'legendary',
    populationNote: '~3,900 Wild (Endangered)',
    vibeTag: 'Legendary · Fierce Striped Apex Predator',
    styleArchetype: 'Fierce & Badass',
    priceGold: 3700,
    primaryColor: '#F97316',
    secondaryColor: '#0F172A',
    accentHex: '#FACC15',
    visualArchetype: 'feline',
    cryCategory: 'roar',
    featureTag: 'tiger_stripes',
    bgGradientCss:
      'linear-gradient(160deg, #FFF7ED 0%, #FED7AA 48%, #FB923C 100%)',
    passiveBonusText: '+24% XP & Gold on all Epic & Deep tasks',
    babyName: 'Stripe Cub',
    kidName: 'Monsoon Hunter',
    teenName: 'Saffron Fang',
    adultName: 'Tiger',
    adultHeight: '1.15 m',
    adultWeight: '260.0 kg',
    lore: 'Blazing orange fur etched with jet-black lightning stripes—a true symbol of focus and willpower.',
  }),
  buildAnimalSpecies({
    id: 'legendary_panda',
    name: 'Panda',
    title: 'Sacred Jade Forest Treasure',
    rarity: 'legendary',
    populationNote: '~1,864 Wild (Conservation Icon)',
    vibeTag: 'Legendary · Iconic Black-and-White Martial Master',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 4000,
    primaryColor: '#1E293B',
    secondaryColor: '#0F172A',
    accentHex: '#10B981',
    visualArchetype: 'bear_ape',
    cryCategory: 'roar',
    featureTag: 'panda_patches',
    bgGradientCss:
      'linear-gradient(160deg, #F0FDF4 0%, #BBF7D0 48%, #6EE7B7 100%)',
    passiveBonusText: '+25% XP & +10 HP healed on every task',
    babyName: 'Mochi Bean Cub',
    kidName: 'Bamboo Muncher',
    teenName: 'Jade Scroll Master',
    adultName: 'Panda',
    adultHeight: '1.60 m',
    adultWeight: '135.0 kg',
    lore: 'With fewer than 1,900 in the wild, this national treasure munches emerald bamboo and radiates legendary luck.',
  }),
  buildAnimalSpecies({
    id: 'legendary_axolotl',
    name: 'Axolotl',
    title: 'Xochimilco Eternal Regenerator',
    rarity: 'legendary',
    populationNote: '<1,000 Wild (Critically Endangered)',
    vibeTag: 'Legendary · Ultra-Rare Smiling Water Spirit',
    styleArchetype: 'Ultra-Cute Cosmic',
    priceGold: 4400,
    primaryColor: '#F472B6',
    secondaryColor: '#DB2777',
    accentHex: '#FACC15',
    visualArchetype: 'aquatic',
    cryCategory: 'splash',
    featureTag: 'axolotl_gills',
    bgGradientCss:
      'linear-gradient(160deg, #FDF2F8 0%, #FBCFE8 48%, #FDE047 100%)',
    passiveBonusText: '+26% Gold & +12 HP regeneration per task',
    babyName: 'Frill Tadpole',
    kidName: 'Petal Gill',
    teenName: 'Crystal Salamander',
    adultName: 'Axolotl',
    adultHeight: '0.30 m',
    adultWeight: '0.30 kg',
    lore: 'Crowned with six feathery pink gill-plumes and an eternal smile, fewer than 1,000 survive in the wild.',
  }),

  // ============================================================================
  // TIER 6: MYTHIC (All 5 Original Apex Pets Including Ignis Rex — High Price!)
  // ============================================================================
  {
    id: 'ignis_rex',
    name: 'Ignis Rex',
    title: 'Solar Flame Wyvern',
    rarity: 'mythic',
    populationNote: 'Mythic 1-of-1 Solar Sovereign',
    vibeTag: 'Mythic · Winged Solar Dragon Sovereign',
    styleArchetype: 'Fierce & Badass',
    priceGold: 6000,
    isDefault: false,
    primaryColor: '#F97316',
    secondaryColor: '#DC2626',
    accentHex: '#FBBF24',
    habitatImage: ignisHabitatImg,
    lore: 'Born from a solar core of pure discipline, Ignis Rex evolves from a glowing ember spirit into an armored winged Solar Wyvern.',
    passiveBonusText: '+30% Bonus XP & Gold on Strength & Vitality tasks',
    visualArchetype: 'mythic_ignis',
    cryCategory: 'mythic_ignis',
    theme: {
      name: 'Warm Sunset Amber',
      bgGradientCss:
        'linear-gradient(160deg, #FFFDF9 0%, #FFEDD5 48%, #FDBA74 100%)',
      cardGradientCss: 'linear-gradient(145deg, #FFFFFF 0%, #FFF7ED 100%)',
      accentButtonCss: 'bg-[#F97316] hover:bg-[#EA580C] text-white',
      badgeBgCss: 'bg-[#FFEDD5] text-[#9A3412] border-[#FDBA74]',
      sceneClearHex: 0xffedd5,
      pedestalTopHex: 0xfff7ed,
      pedestalBaseHex: 0xf97316,
    },
    stages: {
      baby: {
        stage: 'baby',
        label: 'Baby',
        formName: 'Cinderpuff',
        minXp: 0,
        nextXp: KID_STAGE_XP,
        scaleFactor: 0.72,
        heightLabel: '0.35 m',
        weightLabel: '4.2 kg',
        description:
          'A round ember sprite with oversized amber eyes and a flickering tail spark.',
        milestoneTitle: 'Stage I: Reach 100 XP',
        milestoneTasksRequired: 3,
      },
      kid: {
        stage: 'kid',
        label: 'Kid',
        formName: 'Pyrokit',
        minXp: KID_STAGE_XP,
        nextXp: TEEN_STAGE_XP,
        scaleFactor: 0.88,
        heightLabel: '0.85 m',
        weightLabel: '18.5 kg',
        description:
          'An agile fire cub with pointed ears, warm claws, and a lively flame mane.',
        milestoneTitle: 'Stage II: Reach 300 XP',
        milestoneTasksRequired: 7,
      },
      teen: {
        stage: 'teen',
        label: 'Teen',
        formName: 'Blazefang Drake',
        minXp: TEEN_STAGE_XP,
        nextXp: ADULT_STAGE_XP,
        scaleFactor: 1.04,
        heightLabel: '1.65 m',
        weightLabel: '74.0 kg',
        description:
          'A muscular horned fire-drake with shoulder plates and twin tail torches.',
        milestoneTitle: 'Stage III: Reach 600 XP',
        milestoneTasksRequired: 14,
      },
      adult: {
        stage: 'adult',
        label: 'Adult',
        formName: 'Ignis Sovereign',
        minXp: ADULT_STAGE_XP,
        nextXp: null,
        scaleFactor: 1.22,
        heightLabel: '3.40 m',
        weightLabel: '310.0 kg',
        description:
          'The Mythic winged Solar Wyvern clad in warm gold crest armor and solar flames.',
        milestoneTitle: 'Stage IV Apex Achieved',
        milestoneTasksRequired: 20,
      },
    },
  },
  {
    id: 'terradon',
    name: 'Elder Terradon',
    title: 'Ancient Grove Guardian',
    rarity: 'mythic',
    populationNote: 'Mythic 1-of-1 World-Tree Island',
    vibeTag: 'Mythic · Walking Bonsai & Waterfall Behemoth',
    styleArchetype: 'Cute & Wholesome',
    priceGold: 6800,
    isDefault: false,
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    accentHex: '#34D399',
    habitatImage: terradonHabitatImg,
    lore: 'Sprouts from a dewy ancient seed into a colossal World-Tree tortoise carrying a living bonsai canopy and waterfall.',
    passiveBonusText: '+32% XP & +12 HP recovery on every completed task',
    visualArchetype: 'mythic_terradon',
    cryCategory: 'mythic_terradon',
    theme: {
      name: 'Fresh Meadow Emerald',
      bgGradientCss:
        'linear-gradient(160deg, #F4FDF8 0%, #D1FAE5 48%, #6EE7B7 100%)',
      cardGradientCss: 'linear-gradient(145deg, #FFFFFF 0%, #ECFDF5 100%)',
      accentButtonCss: 'bg-[#10B981] hover:bg-[#059669] text-white',
      badgeBgCss: 'bg-[#D1FAE5] text-[#065F46] border-[#6EE7B7]',
      sceneClearHex: 0xd1fae5,
      pedestalTopHex: 0xecfdf5,
      pedestalBaseHex: 0x10b981,
    },
    stages: {
      baby: {
        stage: 'baby',
        label: 'Baby',
        formName: 'Dewbud',
        minXp: 0,
        nextXp: KID_STAGE_XP,
        scaleFactor: 0.7,
        heightLabel: '0.28 m',
        weightLabel: '3.1 kg',
        description:
          'A chubby seed-sprout with rosy cheeks and a twin-leaf sprout on its crown.',
        milestoneTitle: 'Stage I: Reach 100 XP',
        milestoneTasksRequired: 3,
      },
      kid: {
        stage: 'kid',
        label: 'Kid',
        formName: 'Shrubbie',
        minXp: KID_STAGE_XP,
        nextXp: TEEN_STAGE_XP,
        scaleFactor: 0.86,
        heightLabel: '0.75 m',
        weightLabel: '24.0 kg',
        description:
          'A round mossy tortoise-pup with blooming lotus buds on its wooden shell.',
        milestoneTitle: 'Stage II: Reach 300 XP',
        milestoneTasksRequired: 7,
      },
      teen: {
        stage: 'teen',
        label: 'Teen',
        formName: 'Brambleback',
        minXp: TEEN_STAGE_XP,
        nextXp: ADULT_STAGE_XP,
        scaleFactor: 1.04,
        heightLabel: '1.50 m',
        weightLabel: '115.0 kg',
        description:
          'A sturdy emerald guardian armored in bark plates and glowing runestones.',
        milestoneTitle: 'Stage III: Reach 600 XP',
        milestoneTasksRequired: 14,
      },
      adult: {
        stage: 'adult',
        label: 'Adult',
        formName: 'Elder Terradon',
        minXp: ADULT_STAGE_XP,
        nextXp: null,
        scaleFactor: 1.22,
        heightLabel: '2.95 m',
        weightLabel: '480.0 kg',
        description:
          'A Mythic World-Tree Behemoth carrying a living bonsai canopy and crystal waterfall.',
        milestoneTitle: 'Stage IV Apex Achieved',
        milestoneTasksRequired: 20,
      },
    },
  },
  {
    id: 'celestia',
    name: 'Celestia Seraph',
    title: 'Starlight Cloud Griffin',
    rarity: 'mythic',
    populationNote: 'Mythic 1-of-1 Astral Divinity',
    vibeTag: 'Mythic · 6-Winged Cosmic Seraph',
    styleArchetype: 'Ultra-Cute Cosmic',
    priceGold: 7600,
    isDefault: false,
    primaryColor: '#EC4899',
    secondaryColor: '#8B5CF6',
    accentHex: '#F472B6',
    habitatImage: celestiaHabitatImg,
    lore: 'Spun from aurora silk and wishing stars, Celestia blossoms into a regal six-winged Astral Seraph with orbiting stars.',
    passiveBonusText: '+35% Gold & Happiness retention across all tasks',
    visualArchetype: 'mythic_celestia',
    cryCategory: 'mythic_celestia',
    theme: {
      name: 'Dreamy Sakura & Starlight',
      bgGradientCss:
        'linear-gradient(160deg, #FFFBFD 0%, #FCE7F3 48%, #F9A8D4 100%)',
      cardGradientCss: 'linear-gradient(145deg, #FFFFFF 0%, #FDF2F8 100%)',
      accentButtonCss: 'bg-[#EC4899] hover:bg-[#DB2777] text-white',
      badgeBgCss: 'bg-[#FCE7F3] text-[#9D174D] border-[#F9A8D4]',
      sceneClearHex: 0xfce7f3,
      pedestalTopHex: 0xfdf2f8,
      pedestalBaseHex: 0xec4899,
    },
    stages: {
      baby: {
        stage: 'baby',
        label: 'Baby',
        formName: 'Mochi Star',
        minXp: 0,
        nextXp: KID_STAGE_XP,
        scaleFactor: 0.7,
        heightLabel: '0.25 m',
        weightLabel: '1.8 kg',
        description:
          'A marshmallow cloud bunny with floppy pastel ears and starlight eyes.',
        milestoneTitle: 'Stage I: Reach 100 XP',
        milestoneTasksRequired: 3,
      },
      kid: {
        stage: 'kid',
        label: 'Kid',
        formName: 'Lumipaw',
        minXp: KID_STAGE_XP,
        nextXp: TEEN_STAGE_XP,
        scaleFactor: 0.86,
        heightLabel: '0.68 m',
        weightLabel: '9.4 kg',
        description: 'A fluffy winged sky-kitten with aurora silk ribbons.',
        milestoneTitle: 'Stage II: Reach 300 XP',
        milestoneTasksRequired: 7,
      },
      teen: {
        stage: 'teen',
        label: 'Teen',
        formName: 'Starlight Sylph',
        minXp: TEEN_STAGE_XP,
        nextXp: ADULT_STAGE_XP,
        scaleFactor: 1.04,
        heightLabel: '1.40 m',
        weightLabel: '38.0 kg',
        description:
          'A graceful celestial griffin adorned with floating zodiac rings.',
        milestoneTitle: 'Stage III: Reach 600 XP',
        milestoneTasksRequired: 14,
      },
      adult: {
        stage: 'adult',
        label: 'Adult',
        formName: 'Celestia Seraph',
        minXp: ADULT_STAGE_XP,
        nextXp: null,
        scaleFactor: 1.22,
        heightLabel: '2.60 m',
        weightLabel: '110.0 kg',
        description:
          'A Mythic six-winged Astral Seraph with solar halos and orbiting stars.',
        milestoneTitle: 'Stage IV Apex Achieved',
        milestoneTasksRequired: 20,
      },
    },
  },
  {
    id: 'aegis_wolf',
    name: 'Omega Aegis',
    title: 'Tactical Cyber-Mecha Wolf',
    rarity: 'mythic',
    populationNote: 'Mythic 1-of-1 Orbital Dreadnought',
    vibeTag: 'Mythic · Gundam Mecha-Wolf + Dual Railguns',
    styleArchetype: 'Cool & Tactical',
    priceGold: 8500,
    isDefault: false,
    primaryColor: '#2563EB',
    secondaryColor: '#1D4ED8',
    accentHex: '#38BDF8',
    habitatImage: aegisWolfHabitatImg,
    lore: 'Engineered with brushed titanium alloy, dual shoulder rail-cannons, and cobalt plasma wing-thrusters.',
    passiveBonusText: '+38% Bonus Gold & XP from Discipline & Intellect tasks',
    visualArchetype: 'mythic_aegis',
    cryCategory: 'mythic_aegis',
    theme: {
      name: 'Cyber Sky & Cobalt',
      bgGradientCss:
        'linear-gradient(160deg, #F8FAFC 0%, #E0F2FE 48%, #7DD3FC 100%)',
      cardGradientCss: 'linear-gradient(145deg, #FFFFFF 0%, #F0F9FF 100%)',
      accentButtonCss: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white',
      badgeBgCss: 'bg-[#E0F2FE] text-[#1E40AF] border-[#7DD3FC]',
      sceneClearHex: 0xe0f2fe,
      pedestalTopHex: 0xf0f9ff,
      pedestalBaseHex: 0x2563eb,
    },
    stages: {
      baby: {
        stage: 'baby',
        label: 'Baby',
        formName: 'Sparkcore MK-I',
        minXp: 0,
        nextXp: KID_STAGE_XP,
        scaleFactor: 0.74,
        heightLabel: '0.42 m',
        weightLabel: '12.5 kg',
        description:
          'A compact recon drone-pup with an angular alloy chassis and cobalt visor.',
        milestoneTitle: 'Stage I: Reach 100 XP',
        milestoneTasksRequired: 3,
      },
      kid: {
        stage: 'kid',
        label: 'Kid',
        formName: 'Strider Lupus',
        minXp: KID_STAGE_XP,
        nextXp: TEEN_STAGE_XP,
        scaleFactor: 0.9,
        heightLabel: '1.05 m',
        weightLabel: '54.0 kg',
        description:
          'A sleek cyber-hound with articulated piston legs and plasma tail blade.',
        milestoneTitle: 'Stage II: Reach 300 XP',
        milestoneTasksRequired: 7,
      },
      teen: {
        stage: 'teen',
        label: 'Teen',
        formName: 'Vanguard Fenrir',
        minXp: TEEN_STAGE_XP,
        nextXp: ADULT_STAGE_XP,
        scaleFactor: 1.06,
        heightLabel: '1.85 m',
        weightLabel: '165.0 kg',
        description:
          'A heavy-armored combat wolf equipped with shoulder-mounted rail pods.',
        milestoneTitle: 'Stage III: Reach 600 XP',
        milestoneTasksRequired: 14,
      },
      adult: {
        stage: 'adult',
        label: 'Adult',
        formName: 'Omega Aegis Prime',
        minXp: ADULT_STAGE_XP,
        nextXp: null,
        scaleFactor: 1.24,
        heightLabel: '3.20 m',
        weightLabel: '420.0 kg',
        description:
          'An imposing Mythic Mecha-Wolf Dreadnought with twin plasma wing-thrusters and dual shoulder rail-cannons.',
        milestoneTitle: 'Stage IV Apex Achieved',
        milestoneTasksRequired: 20,
      },
    },
  },
  {
    id: 'obsidian_titan',
    name: 'Obsidian Titan',
    title: 'Abyssal Iron Behemoth',
    rarity: 'mythic',
    populationNote: 'Mythic 1-of-1 Abyssal Warlord',
    vibeTag: 'Mythic · Twin-Greatsword Demon Overlord',
    styleArchetype: 'Fierce & Badass',
    priceGold: 9500,
    isDefault: false,
    primaryColor: '#E11D48',
    secondaryColor: '#334155',
    accentHex: '#FB7185',
    habitatImage: obsidianTitanHabitatImg,
    lore: 'Carved from volcanic quartz and forged steel. The ultimate Mythic boss dual-wielding twin flaming magma greatswords.',
    passiveBonusText: '+45% Bonus XP & Gold on all tasks',
    visualArchetype: 'mythic_obsidian',
    cryCategory: 'mythic_obsidian',
    theme: {
      name: 'Royal Crimson & Quartz',
      bgGradientCss:
        'linear-gradient(160deg, #FFF5F7 0%, #FFE4E6 48%, #FDA4AF 100%)',
      cardGradientCss: 'linear-gradient(145deg, #FFFFFF 0%, #FFF1F2 100%)',
      accentButtonCss: 'bg-[#E11D48] hover:bg-[#BE123C] text-white',
      badgeBgCss: 'bg-[#FFE4E6] text-[#9F1239] border-[#FDA4AF]',
      sceneClearHex: 0xffe4e6,
      pedestalTopHex: 0xfff1f2,
      pedestalBaseHex: 0xe11d48,
    },
    stages: {
      baby: {
        stage: 'baby',
        label: 'Baby',
        formName: 'Gloomite',
        minXp: 0,
        nextXp: KID_STAGE_XP,
        scaleFactor: 0.74,
        heightLabel: '0.45 m',
        weightLabel: '16.0 kg',
        description:
          'A spiky little gargoyle hatchling with horned brow and mini trident.',
        milestoneTitle: 'Stage I: Reach 100 XP',
        milestoneTasksRequired: 3,
      },
      kid: {
        stage: 'kid',
        label: 'Kid',
        formName: 'Ironclaw Stalker',
        minXp: KID_STAGE_XP,
        nextXp: TEEN_STAGE_XP,
        scaleFactor: 0.9,
        heightLabel: '1.15 m',
        weightLabel: '68.0 kg',
        description: 'A muscular gargoyle brawler with stone gauntlets.',
        milestoneTitle: 'Stage II: Reach 300 XP',
        milestoneTasksRequired: 7,
      },
      teen: {
        stage: 'teen',
        label: 'Teen',
        formName: 'Dreadstalker',
        minXp: TEEN_STAGE_XP,
        nextXp: ADULT_STAGE_XP,
        scaleFactor: 1.08,
        heightLabel: '2.10 m',
        weightLabel: '240.0 kg',
        description:
          'A ferocious horned behemoth with steel pauldrons and magma broadsword.',
        milestoneTitle: 'Stage III: Reach 600 XP',
        milestoneTasksRequired: 14,
      },
      adult: {
        stage: 'adult',
        label: 'Adult',
        formName: 'Obsidian Leviathan',
        minXp: ADULT_STAGE_XP,
        nextXp: null,
        scaleFactor: 1.26,
        heightLabel: '3.90 m',
        weightLabel: '690.0 kg',
        description:
          'A monumental Mythic Warlord Dragon-Titan dual-wielding twin magma greatswords and soul orbs.',
        milestoneTitle: 'Stage IV Apex Achieved',
        milestoneTasksRequired: 20,
      },
    },
  },
];

export const PET_SPECIES_MAP: Record<PetSpeciesId, PetSpeciesConfig> =
  PET_SPECIES_LIST.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<PetSpeciesId, PetSpeciesConfig>
  );

export function getEvolutionStage(xp: number): EvolutionStage {
  if (xp >= ADULT_STAGE_XP) return 'adult';
  if (xp >= TEEN_STAGE_XP) return 'teen';
  if (xp >= KID_STAGE_XP) return 'kid';
  return 'baby';
}

export const TASK_DIFFICULTY_CONFIG: Record<
  TaskDifficulty,
  {
    label: string;
    minDurationSeconds: number;
    xpReward: number;
    goldReward: number;
    description: string;
  }
> = {
  quick: {
    label: 'Quick Task',
    minDurationSeconds: 15,
    xpReward: 20,
    goldReward: applyUnfairGoldTax(15), // 14G (-5% unfair rule)
    description: '15s focus gate · +20 XP · +14G (-5% tax)',
  },
  standard: {
    label: 'Standard Task',
    minDurationSeconds: 30,
    xpReward: 35,
    goldReward: applyUnfairGoldTax(25), // 23G (-5% unfair rule)
    description: '30s focus gate · +35 XP · +23G (-5% tax)',
  },
  deep: {
    label: 'Deep Work',
    minDurationSeconds: 45,
    xpReward: 60,
    goldReward: applyUnfairGoldTax(45), // 42G (-5% unfair rule)
    description: '45s focus gate · +60 XP · +42G (-5% tax)',
  },
  epic: {
    label: 'Epic Milestone',
    minDurationSeconds: 60,
    xpReward: 95,
    goldReward: applyUnfairGoldTax(75), // 71G (-5% unfair rule)
    description: '60s focus gate · +95 XP · +71G (-5% tax)',
  },
};

export const TASK_CATEGORY_CONFIG: Record<
  TaskCategory,
  {
    label: string;
    statBoostLabel: string;
    colorText: string;
  }
> = {
  vitality: {
    label: 'Vitality & Health',
    statBoostLabel: '+8 Health · +6 Energy',
    colorText: 'text-emerald-600',
  },
  intellect: {
    label: 'Study & Intellect',
    statBoostLabel: '+8 Happiness · +5 Health',
    colorText: 'text-blue-600',
  },
  strength: {
    label: 'Fitness & Strength',
    statBoostLabel: '+10 Health · +8 Happiness',
    colorText: 'text-orange-600',
  },
  discipline: {
    label: 'Daily Discipline',
    statBoostLabel: '+7 Health · +7 Happiness · +7 Energy',
    colorText: 'text-rose-600',
  },
};

export interface FocusTrackTemplate {
  id: string;
  name: string;
  subtitle: string;
  tasks: Array<{
    title: string;
    category: TaskCategory;
    difficulty: TaskDifficulty;
    preIncubated: boolean;
  }>;
}

export const NEW_USER_FOCUS_TRACKS: FocusTrackTemplate[] = [
  {
    id: 'balanced',
    name: 'Balanced Daily Habits',
    subtitle: 'Health, focus, and daily structure',
    tasks: [
      {
        title: 'Drink 500ml of water and stretch for 5 minutes',
        category: 'vitality',
        difficulty: 'quick',
        preIncubated: true,
      },
      {
        title: 'Complete today’s top priority work or study block',
        category: 'intellect',
        difficulty: 'standard',
        preIncubated: true,
      },
      {
        title: 'Clear desk workspace and plan tomorrow’s top 3 goals',
        category: 'discipline',
        difficulty: 'deep',
        preIncubated: false,
      },
    ],
  },
  {
    id: 'athletic',
    name: 'Strength & Conditioning',
    subtitle: 'Workouts, mobility, and physical grit',
    tasks: [
      {
        title: 'Complete 25 push-ups or 5-minute warm-up routine',
        category: 'strength',
        difficulty: 'quick',
        preIncubated: true,
      },
      {
        title: 'Finish 30-minute strength training or cardio session',
        category: 'strength',
        difficulty: 'deep',
        preIncubated: true,
      },
      {
        title: 'Prepare high-protein post-training meal & hydrate',
        category: 'vitality',
        difficulty: 'standard',
        preIncubated: false,
      },
    ],
  },
  {
    id: 'engineering',
    name: 'Deep Work & Engineering',
    subtitle: 'Coding, study sprints, and zero-distraction blocks',
    tasks: [
      {
        title: 'Review pull requests and triage today’s issue backlog',
        category: 'discipline',
        difficulty: 'quick',
        preIncubated: true,
      },
      {
        title: 'Complete 45-minute uninterrupted deep coding sprint',
        category: 'intellect',
        difficulty: 'deep',
        preIncubated: true,
      },
      {
        title: 'Step away from screen for a 10-minute outdoor walk',
        category: 'vitality',
        difficulty: 'standard',
        preIncubated: false,
      },
    ],
  },
];

export const DEFAULT_PLACED_DECOR: Record<RoomSlotId, string> = {
  wall_1: 'wood_bookshelf',
  wall_2: '',
  wall_3: '',
  wall_4: '',
  floor_left: 'potted_sprout',
  floor_right: 'cozy_cushion',
  wall_left: 'window_sunny',
  wall_right: '',
};

export const ROOM_DECOR_ITEMS: RoomDecorItem[] = [
  // ==========================================
  // WALL DECOR ITEMS (Fits in any 2x2 Wall Slot)
  // ==========================================
  {
    id: 'wood_bookshelf',
    name: 'Bookshelf',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 0,
    isDefault: true,
    description: 'Floating oak shelf stocked with pixel spellbooks and mana potions.',
  },
  {
    id: 'wall_swords',
    name: 'Knight Blades',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 90,
    isDefault: false,
    description: 'Crossed 8-bit broadswords mounted behind a royal crimson shield.',
  },
  {
    id: 'cuckoo_clock',
    name: 'Wall Clock',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 110,
    isDefault: false,
    description: 'Vintage pixel wall clock with brass gears and a golden pendulum.',
  },
  {
    id: 'neon_arcade_sign',
    name: 'Neon Sign',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 160,
    isDefault: false,
    description: 'Glowing pixel gamepad sign framed in electric cyan and magenta.',
  },
  {
    id: 'dragon_banner',
    name: 'Dragon Banner',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 180,
    isDefault: false,
    description: 'Royal crimson hanging banner embroidered with a golden wyvern crest.',
  },
  {
    id: 'motivation_banner',
    name: 'You Got This! Pennant',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 65,
    isDefault: false,
    description:
      'Motivational golden pennant embroidered with a champion star: "YOU GOT THIS!"',
  },
  {
    id: 'spellbook_stack',
    name: 'Stack of Mastery Books',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 80,
    isDefault: false,
    description:
      'Hardbound books on "Habit Mastery" and "Deep Focus" crowned with a golden bookmark.',
  },
  {
    id: 'wisdom_lamp',
    name: 'Study Lamp & Planner',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 95,
    isDefault: false,
    description:
      'Warm emerald banker desk lamp illuminating an open daily task planner.',
  },

  // Wall Decor Achievements
  {
    id: 'trophy_streak_7',
    name: 'Bronze Spark Pennant',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '7-Day Ember Spark',
    description: 'Achievement Exclusive! Hand-stitched bronze wall banner commemorating your first 7-day streak.',
  },
  {
    id: 'clock_streak_14',
    name: "Scholar's Focus Clock",
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '14-Day Iron Rhythm',
    description: 'Achievement Exclusive! Polished brass astronomical wall clock honoring 14 days of rhythm.',
  },
  {
    id: 'starchart_streak_90',
    name: "Grand Master's Star Chart",
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '90-Day Quarter-Year Vanguard',
    description: 'Achievement Exclusive! Framed celestial parchment showing constellations aligned with your focus.',
  },
  {
    id: 'crown_streak_365',
    name: 'Solar Crown of the Century',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '365-Day Ascended Immortal',
    description: 'Mythic Achievement Exclusive! Blazing radiant sun crown awarded for 365 days of unbroken consistency.',
  },
  {
    id: 'shield_tasks_25',
    name: 'Novice Vanguard Shield',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '25-Quest Vanguard Initiate',
    description: 'Achievement Exclusive! Riveted iron heraldic wall shield for 25 completed quests.',
  },
  {
    id: 'shelf_tasks_50',
    name: 'Wisdom Study Bookshelf',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '50-Quest Apprentice Scholar',
    description: 'Achievement Exclusive! Double-tiered library wall shelf loaded with magical tome scrolls.',
  },
  {
    id: 'crest_tasks_500',
    name: 'Order of the Griffin Crest',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '500-Quest Grand Legionnaire',
    description: 'Achievement Exclusive! Majestic golden griffin insignia mounted on imperial velvet.',
  },
  {
    id: 'tapestry_tasks_5000',
    name: 'Pantheon Sovereign Tapestry',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '5,000-Quest Ascended Task Divinity',
    description: 'Mythic Achievement Exclusive! Starlight-woven tapestry honoring 5,000 quests conquered.',
  },

  // Legacy Wall Achievements (backwards compatibility)
  {
    id: 'plaque_tasks_10',
    name: '"10" Task Plaque',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '10-Task Bronze Vanguard',
    description: 'Achievement Exclusive! Engraved bronze shield plaque stamped with a bold "10".',
  },
  {
    id: 'banner_streak_25',
    name: '"25" Streak Banner',
    category: 'wall',
    slot: 'wall',
    slotLabel: 'Wall',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '25-Day Quarter-Centurion',
    description: 'Achievement Exclusive! Royal emerald tapestry woven with a golden "25" emblem.',
  },

  // ==========================================
  // FLOOR DECOR ITEMS (Fits in any Floor Slot)
  // ==========================================
  {
    id: 'potted_sprout',
    name: 'Pixel Monstera Plant',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: true,
    description: 'Lush emerald monstera leaves in a warm terracotta pixel pot.',
  },
  {
    id: 'cozy_cushion',
    name: 'Plush Pet Bed & Bowl',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: true,
    description: 'Soft quilted velvet pet cushion paired with a golden snack bowl.',
  },
  {
    id: 'training_dummy',
    name: 'Hero Training Dummy',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 140,
    isDefault: false,
    description: 'Armored straw combat dummy with a practice wooden katana.',
  },
  {
    id: 'arcade_cabinet',
    name: 'Retro 8-Bit Arcade',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 220,
    isDefault: false,
    description: 'Classic upright pixel arcade machine with a glowing CRT screen.',
  },
  {
    id: 'power_hourglass',
    name: 'Focus Chrono Hourglass',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 110,
    isDefault: false,
    description:
      'Gleaming brass hourglass with glowing stardust that inspires relentless task momentum.',
  },
  {
    id: 'slime_plushie',
    name: 'Bouncy Slime Plush',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 85,
    isDefault: false,
    description:
      'Cheerful mint-green slime plush with rosy cheeks that smiles and cheers you on.',
  },
  {
    id: 'bear_plushie',
    name: 'Cozy Teddy Plushie',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 75,
    isDefault: false,
    description:
      'Warm caramel teddy bear with a red bowtie that gives comforting power for tough tasks.',
  },
  {
    id: 'determination_trophy',
    name: 'Willpower Eternal Flame',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 130,
    isDefault: false,
    description:
      'Roaring eternal pixel flame resting on obsidian stone, symbolizing inner willpower.',
  },
  {
    id: 'pixel_cat_toy',
    name: 'Playful Yarn & Bell Toy',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 55,
    isDefault: false,
    description:
      'Bright rainbow yarn ball with a cheerful brass bell for playful focus breaks.',
  },
  {
    id: 'mana_crystal_lamp',
    name: 'Astral Crystal Pillar',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 190,
    isDefault: false,
    description: 'Carved stone rune pedestal topped with a levitating starlight gem.',
  },
  {
    id: 'treasure_hoard',
    name: 'Royal Treasure Chest',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 250,
    isDefault: false,
    description: 'Open oak chest overflowing with sparkling pixel gold coins & rubies.',
  },

  // Floor Decor Achievements
  {
    id: 'pillar_streak_30',
    name: 'Silver Month Sovereign Pillar',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '30-Day Month of Iron Discipline',
    description: 'Achievement Exclusive! Carved silver monolith with moon runes celebrating 1 full month of consistency.',
  },
  {
    id: 'hourglass_streak_60',
    name: 'Emerald Hourglass of Eternity',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '60-Day Bi-Monthly Titan',
    description: 'Achievement Exclusive! Ornate jade hourglass filled with luminescent stardust honoring 60 days.',
  },
  {
    id: 'altar_streak_120',
    name: 'Sunfire Guardian Altar',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '120-Day Trimester Champion',
    description: 'Achievement Exclusive! Sacred marble brazier with perpetual golden embers for 120 days.',
  },
  {
    id: 'pillar_streak_250',
    name: 'Obsidian Dragon Pillar',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '250-Day Grand Centurion',
    description: 'Mythic Achievement Exclusive! Volcanic obsidian pillar wrapped in dragon coils for 250 days.',
  },
  {
    id: 'monolith_tasks_100',
    name: 'Century Stone Monolith',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '100-Quest Century Questor',
    description: 'Achievement Exclusive! Weathered granite runestone recording your first 100 finished quests.',
  },
  {
    id: 'obelisk_tasks_250',
    name: 'Golden Taskmaster Obelisk',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '250-Quest Relentless Taskmaster',
    description: 'Achievement Exclusive! Gleaming gold-inlaid spire emitting productive energy for 250 quests.',
  },
  {
    id: 'armory_tasks_1000',
    name: 'Imperial Sovereign Armory',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '1,000-Quest Sovereign Conqueror',
    description: 'Legendary Achievement Exclusive! Gilded stand of legendary armor and blades for 1,000 quests.',
  },
  {
    id: 'banner_tasks_2500',
    name: 'Dragon Knight War Banner',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '2,500-Quest Mythic Grandmaster',
    description: 'Legendary Achievement Exclusive! Towering war standard mounted in a stone dragon claw.',
  },

  // Legacy Floor Achievements (backwards compatibility)
  {
    id: 'statue_tasks_25',
    name: 'Golden "25" Knight Statue',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '25-Task Relentless Grinder',
    description: 'Achievement Exclusive! Solid gold pixel knight monument inscribed with "25".',
  },
  {
    id: 'pedestal_tasks_50',
    name: 'Royal "50" Crown Pedestal',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '50-Task Grand Sovereign',
    description: 'Achievement Exclusive! Velvet marble pillar displaying the "50" Taskmaster Crown.',
  },
  {
    id: 'trophy_streak_10',
    name: 'Golden "10" Streak Trophy',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '10-Day Decade Champion',
    description: 'Achievement Exclusive! Gleaming golden cup trophy inscribed with "10"!',
  },
  {
    id: 'trophy_streak_50',
    name: 'Diamond "50" Streak Trophy',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '50-Day Iron Discipline',
    description: 'Achievement Exclusive! Radiant diamond chalice trophy inscribed with "50"!',
  },
  {
    id: 'trophy_streak_100',
    name: 'Mythic "100" Centurion Trophy',
    category: 'floor',
    slot: 'floor',
    slotLabel: 'Floor',
    priceGold: 0,
    isDefault: false,
    isAchievementExclusive: true,
    achievementTitle: '100-Day Mythic Immortal',
    description: 'Achievement Exclusive! Winged solar obelisk trophy emblazoned with "100"!',
  },
];
