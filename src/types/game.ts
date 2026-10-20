export type PetRarityTier =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic';

export type PetSpeciesId = string;

export type EvolutionStage = 'baby' | 'kid' | 'teen' | 'adult';

export type TaskCategory = 'vitality' | 'intellect' | 'strength' | 'discipline';

export type TaskDifficulty = 'quick' | 'standard' | 'deep' | 'epic';

export type TaskStatus = 'pending' | 'completed' | 'penalized';

export type DecorCategory = 'wall' | 'floor';

export type RoomSlotId =
  | 'wall_1'
  | 'wall_2'
  | 'wall_3'
  | 'wall_4'
  | 'floor_left'
  | 'floor_right'
  | 'wall_left'
  | 'wall_right';

export interface RoomDecorItem {
  id: string;
  name: string;
  category: DecorCategory;
  slot?: string;
  slotLabel?: string;
  priceGold: number;
  isDefault?: boolean;
  description: string;
  isAchievementExclusive?: boolean;
  achievementTitle?: string;
}

export interface AchievementDef {
  id: string;
  type: 'tasks' | 'streak';
  targetValue: number;
  title: string;
  description: string;
  fairGoldValue: number;
  unfairGoldReward: number; // -5% unfair rule applied (Math.floor(fairGoldValue * 0.95))
  xpReward: number;
  exclusiveCrateName?: string;
  exclusiveDecorId?: string;
  trophyInscription?: string;
  rewardPetSpeciesId?: string;
  permanentPerkText?: string;
  rarityTier?: 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
}

export interface StageConfig {
  stage: EvolutionStage;
  label: string;
  formName: string;
  minXp: number;
  nextXp: number | null;
  scaleFactor: number;
  heightLabel: string;
  weightLabel: string;
  description: string;
  milestoneTitle: string;
  milestoneTasksRequired: number;
}

export interface PetThemePalette {
  name: string;
  bgGradientCss: string;
  cardGradientCss: string;
  accentButtonCss: string;
  badgeBgCss: string;
  sceneClearHex: number;
  pedestalTopHex: number;
  pedestalBaseHex: number;
}

export type AnimalVisualArchetype =
  | 'mythic_ignis'
  | 'mythic_terradon'
  | 'mythic_aegis'
  | 'mythic_celestia'
  | 'mythic_obsidian'
  | 'canine'
  | 'feline'
  | 'bird'
  | 'rabbit'
  | 'waterfowl'
  | 'hoofed'
  | 'rodent'
  | 'aquatic'
  | 'reptile'
  | 'bear_ape'
  | 'pachyderm'
  | 'giraffe';

export type AnimalCryCategory =
  | 'mythic_ignis'
  | 'mythic_terradon'
  | 'mythic_aegis'
  | 'mythic_celestia'
  | 'mythic_obsidian'
  | 'bark'
  | 'meow'
  | 'chirp'
  | 'quack'
  | 'farm_low'
  | 'roar'
  | 'squeak'
  | 'splash';

export interface PetSpeciesConfig {
  id: PetSpeciesId;
  name: string;
  rarity: PetRarityTier;
  priceGold: number;
  isDefault: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentHex: string;
  habitatImage: string;
  lore: string;
  passiveBonusText: string;
  visualArchetype: AnimalVisualArchetype;
  cryCategory: AnimalCryCategory;
  featureTag?: string; // e.g. 'spots', 'stripes', 'mane', 'horns', 'tuxedo', 'gills', 'trunk', etc.
  theme: PetThemePalette;
  stages: Record<EvolutionStage, StageConfig>;
  adultBonus?: AdultPetBonus;
}

export interface AdultPetBonus {
  description: string;
  xpPct: number; // e.g. 5 means +5% Quest XP
  goldPct: number; // e.g. 5 means +5% Gold
  moodBoost: number; // e.g. +2 extra happiness on pet interactions
}

export interface TaskItem {
  id: string;
  ownerId: string;
  title: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  minDurationSeconds: number;
  xpReward: number;
  goldReward: number;
  createdAtMs: number;
  completedAtMs?: number;
  penaltyReason?: string;
  // Timer-based task fields
  isTimerTask?: boolean;
  timerDurationSeconds?: number;
  timerStartedAtMs?: number | null;
  isTimerPaused?: boolean;
  timerElapsedBeforePauseSeconds?: number;
  // Repeating daily/day-of-week task fields (4:00 AM daily reset)
  isRepeating?: boolean;
  repeatDays?: number[]; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  lastEnlistedGameDay?: string;
}

export type StreakMilestoneDays = 7 | 30 | 100;

export interface StreakCrateReward {
  milestoneDays: StreakMilestoneDays;
  title: string;
  subtitle: string;
  crateTier: 'Rare Silver Crate' | 'Epic Golden Crate' | 'Mythic Diamond Crate';
  goldBonus: number;
  xpBonus: number;
  itemDropName: string;
  cratePrimaryHex: string;
  crateTrimHex: string;
  crateGemHex: string;
}

export interface DailyHappinessPoint {
  dateKey: string;
  dayLabel: string;
  happiness: number;
  interactions: number;
}

export interface UserProfile {
  uid: string;
  username: string;
  activeSpeciesId: PetSpeciesId;
  activePetName: string;
  petCustomNames: Record<string, string>;
  unlockedSpecies: PetSpeciesId[];
  unlockedDecorIds?: string[];
  placedDecorBySlot?: Record<RoomSlotId, string>;
  claimedAchievementIds?: string[];
  userXp?: number;
  petXp: number;
  petXpBySpecies?: Record<string, number>;
  petHealth: number;
  petHappiness: number;
  petEnergy: number;
  happinessHistory?: DailyHappinessPoint[];
  gold: number;
  streakDays: number;
  claimedStreakCrates?: number[];
  cheatCount: number;
  totalTasksCompleted: number;
  lastDailyBonusDate: string;
  lastLoginGameDay?: string;
  lastStreakGameDay?: string;
  createdAtIso: string;
}

export interface PenaltyEvent {
  id: string;
  taskTitle: string;
  elapsedSeconds: number;
  requiredSeconds: number;
  hpLost: number;
  happinessLost: number;
  goldLost: number;
  xpLost: number;
  timestampMs: number;
}
