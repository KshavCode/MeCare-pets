import React, { useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Award,
  CheckSquare,
  Flame,
  ShoppingBag,
  Pencil,
  Check,
  X,
  Heart,
  Smile,
  Timer,
  Trophy,
  TrendingUp,
  User,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  AchievementDef,
  EvolutionStage,
  PenaltyEvent,
  PetSpeciesConfig,
  PetSpeciesId,
  RoomDecorItem,
  RoomSlotId,
  TaskCategory,
  TaskDifficulty,
  TaskItem,
  UserProfile,
} from './types/game';
import {
  ACHIEVEMENTS_LIST,
  applyUnfairGoldTax,
  calculateActiveAdultBonuses,
  DEFAULT_PLACED_DECOR,
  getDaysBetweenGameDays,
  getEvolutionStage,
  getGameDayKey4AM,
  getGameDayOfWeek4AM,
  getPetStageProgressInfo,
  getStreakXpMultiplier,
  getUserDisciplineLevelInfo,
  NEW_USER_FOCUS_TRACKS,
  PET_SPECIES_LIST,
  PET_SPECIES_MAP,
  ROOM_DECOR_ITEMS,
  TASK_DIFFICULTY_CONFIG,
} from './data/petSpecies';
import { soundFX } from './utils/sound';
import {
  getUpdated7DayHappinessHistory,
  triggerHaptic,
  useAndroidBackHandler,
  useScreenWakeLock,
} from './utils/mobileBridge';
import { AuthScreen } from './components/AuthScreen';
import { Pet3DScene } from './components/Pet3DScene';
import { FloatingTasksDrawer } from './components/FloatingTasksDrawer';
import { PetStoreView } from './components/PetStoreModal';
import { AchievementsModal } from './components/AchievementsModal';
import { MaxLevelPetsModal } from './components/MaxLevelPetsModal';
import { PixelCoinIcon } from './components/PixelCoinIcon';
import { HappinessTrendChart } from './components/HappinessTrendChart';
import { UserProfileModal } from './components/UserProfileModal';
import { PixelLoadingScreen } from './components/PixelLoadingScreen';
import { TutorialGuideOverlay } from './components/TutorialGuideOverlay';
import { DecorPlacementModal } from './components/DecorPlacementModal';

interface StoredAccountRecord {
  profile: UserProfile;
  tasks: TaskItem[];
  penaltyHistory: PenaltyEvent[];
}

const ACCOUNTS_STORAGE_KEY = 'evoquest_accounts_prod_v1';

function createInitialAccount(params: {
  uid: string;
  username: string;
  initialPetName: string;
  focusTrackId?: string;
}): { profile: UserProfile; tasks: TaskItem[] } {
  const initialGameDay = getGameDayKey4AM();
  const cleanPetName = params.initialPetName.trim().slice(0, 28) || 'Buddy';

  const profile: UserProfile = {
    uid: params.uid,
    username: params.username,
    activeSpeciesId: 'common_dog',
    activePetName: cleanPetName,
    petCustomNames: {
      common_dog: cleanPetName,
    },
    unlockedSpecies: ['common_dog'],
    unlockedDecorIds: [
      'window_sunny',
      'wood_bookshelf',
      'potted_sprout',
      'cozy_cushion',
    ],
    placedDecorBySlot: { ...DEFAULT_PLACED_DECOR },
    claimedAchievementIds: [],
    userXp: 0,
    petXp: 0,
    petXpBySpecies: {
      common_dog: 0,
    },
    petHealth: 100,
    petHappiness: 100,
    petEnergy: 100,
    happinessHistory: [
      {
        dateKey: initialGameDay,
        dayLabel: 'Today',
        happiness: 100,
        interactions: 0,
      },
    ],
    gold: 0,
    streakDays: 0,
    claimedStreakCrates: [],
    cheatCount: 0,
    totalTasksCompleted: 0,
    lastDailyBonusDate: '',
    lastLoginGameDay: initialGameDay,
    lastStreakGameDay: '',
    createdAtIso: new Date().toISOString(),
  };

  return { profile, tasks: [] };
}

export default function App() {
  const [accountsMap, setAccountsMap] = useState<
    Record<string, StoredAccountRecord>
  >(() => {
    try {
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignore storage errors
    }
    return {};
  });

  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [bootProgress, setBootProgress] = useState<number>(8);
  const [isBootComplete, setIsBootComplete] = useState<boolean>(false);

  const [showStoreModal, setShowStoreModal] = useState(false);
  const [storeInitialTab, setStoreInitialTab] = useState<'pets' | 'decor'>(
    'pets'
  );
  const [storeInitialSlot, setStoreInitialSlot] = useState<
    RoomSlotId | 'all'
  >('all');

  const [showMaxPetsModal, setShowMaxPetsModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showQuestsModal, setShowQuestsModal] = useState(false);
  const [showMoodChartPopover, setShowMoodChartPopover] = useState(false);
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(false);
  const [selectedDecorSlotForPlacement, setSelectedDecorSlotForPlacement] =
    useState<RoomSlotId | null>(null);

  const [pendingGoogleNewUser, setPendingGoogleNewUser] = useState<{
    uid: string;
    suggestedUsername: string;
    initialPetName: string;
    focusTrackId: string;
  } | null>(null);
  const [googleUsernameDraft, setGoogleUsernameDraft] = useState('');
  const [googleUsernameError, setGoogleUsernameError] = useState<string | null>(null);
  const [isFinalizingGoogleUser, setIsFinalizingGoogleUser] = useState(false);

  const [isRenamingPet, setIsRenamingPet] = useState(false);
  const [petNameInput, setPetNameInput] = useState('');

  const [petMood, setPetMood] = useState<'idle' | 'happy' | 'penalized'>(
    'idle'
  );

  const [latestPenalty, setLatestPenalty] = useState<PenaltyEvent | null>(null);
  const [timerRewardToast, setTimerRewardToast] = useState<{
    taskTitle: string;
    xpEarned: number;
    goldEarned: number;
  } | null>(null);

  const [evolutionBanner, setEvolutionBanner] = useState<{
    speciesName: string;
    oldStage: EvolutionStage;
    newStage: EvolutionStage;
    newFormName: string;
  } | null>(null);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);

  // Pixelized Progress Bar Boot Animation
  useEffect(() => {
    const interval = window.setInterval(() => {
      setBootProgress((prev) => {
        if (!isAuthReady) {
          return Math.min(82, prev + 11);
        }
        if (prev >= 100) {
          window.clearInterval(interval);
          setIsBootComplete(true);
          return 100;
        }
        const next = Math.min(100, prev + 18);
        if (next >= 100) {
          window.setTimeout(() => setIsBootComplete(true), 140);
        }
        return next;
      });
    }, 85);
    return () => window.clearInterval(interval);
  }, [isAuthReady]);

  useEffect(() => {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accountsMap));
    } catch {
      // Ignore quota errors
    }
  }, [accountsMap]);

  const syncProfileToFirestore = useCallback(
    async (profile: UserProfile, isCreate: boolean = false) => {
      const fbUser = auth.currentUser;
      if (!fbUser || !fbUser.emailVerified || fbUser.uid !== profile.uid) {
        return;
      }
      const path = `users/${fbUser.uid}`;
      const cleanHandle =
        profile.username.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32) ||
        'trainer';
      const sanitizedPayload = {
        uid: fbUser.uid,
        username: cleanHandle.length >= 3 ? cleanHandle : `${cleanHandle}_01`,
        activeSpeciesId: profile.activeSpeciesId,
        activePetName: profile.activePetName.slice(0, 28) || 'Buddy',
        unlockedSpecies: profile.unlockedSpecies.slice(0, 50),
        petXp: Math.max(0, Math.min(1000000, Math.round(profile.petXp))),
        petHealth: Math.max(0, Math.min(100, Math.round(profile.petHealth))),
        petHappiness: Math.max(
          0,
          Math.min(100, Math.round(profile.petHappiness))
        ),
        petEnergy: Math.max(0, Math.min(100, Math.round(profile.petEnergy))),
        gold: Math.max(0, Math.min(1000000, Math.round(profile.gold))),
        streakDays: Math.max(
          0,
          Math.min(10000, Math.round(profile.streakDays))
        ),
        cheatCount: Math.max(
          0,
          Math.min(100000, Math.round(profile.cheatCount))
        ),
        totalTasksCompleted: Math.max(
          0,
          Math.min(1000000, Math.round(profile.totalTasksCompleted))
        ),
        updatedAt: serverTimestamp(),
      };

      try {
        if (isCreate) {
          await setDoc(doc(db, 'users', fbUser.uid), {
            ...sanitizedPayload,
            createdAt: serverTimestamp(),
          });
        } else {
          await updateDoc(doc(db, 'users', fbUser.uid), sanitizedPayload);
        }
      } catch (err) {
        handleFirestoreError(
          err,
          isCreate ? OperationType.CREATE : OperationType.UPDATE,
          path
        );
      }
    },
    []
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setActiveUsername(null);
        setIsAuthReady(true);
        return;
      }

      const fallbackHandle =
        (fbUser.displayName || fbUser.email?.split('@')[0] || 'trainer')
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '_')
          .slice(0, 28) || 'trainer';
      const safeHandle =
        fallbackHandle.length >= 3 ? fallbackHandle : `${fallbackHandle}_01`;

      if (fbUser.emailVerified) {
        const path = `users/${fbUser.uid}`;
        try {
          const snap = await getDoc(doc(db, 'users', fbUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            const handle = (data.username as string) || safeHandle;

            // Also load user's tasks from Firestore subcollection
            let remoteTasks: TaskItem[] = [];
            try {
              const tasksQuery = query(
                collection(db, 'users', fbUser.uid, 'tasks'),
                where('ownerId', '==', fbUser.uid)
              );
              const taskSnaps = await getDocs(tasksQuery);
              remoteTasks = taskSnaps.docs.map((d) => {
                const td = d.data();
                return {
                  id: d.id,
                  ownerId: td.ownerId as string,
                  title: td.title as string,
                  category: td.category as TaskCategory,
                  difficulty: td.difficulty as TaskDifficulty,
                  status: td.status as TaskItem['status'],
                  minDurationSeconds: Number(td.minDurationSeconds ?? 15),
                  xpReward: Number(td.xpReward ?? 20),
                  goldReward: Number(td.goldReward ?? 14),
                  createdAtMs: Number(td.createdAtMs ?? Date.now()),
                };
              });
            } catch (taskErr) {
              handleFirestoreError(
                taskErr,
                OperationType.LIST,
                `users/${fbUser.uid}/tasks`
              );
            }

            setAccountsMap((prev) => {
              const existing = prev[fbUser.uid] || prev[handle];
              const rawSpeciesId =
                (data.activeSpeciesId as PetSpeciesId) || 'common_dog';
              const validSpeciesId = PET_SPECIES_MAP[rawSpeciesId]
                ? rawSpeciesId
                : 'common_dog';

              const mergedProfile: UserProfile = {
                uid: fbUser.uid,
                username: handle,
                activeSpeciesId: validSpeciesId,
                activePetName: (data.activePetName as string) || 'Buddy',
                petCustomNames: existing?.profile.petCustomNames || {
                  [validSpeciesId]: (data.activePetName as string) || 'Buddy',
                },
                unlockedSpecies: (data.unlockedSpecies as PetSpeciesId[]) || [
                  'common_dog',
                ],
                unlockedDecorIds: existing?.profile.unlockedDecorIds || [
                  'window_sunny',
                  'wood_bookshelf',
                  'potted_sprout',
                  'cozy_cushion',
                ],
                placedDecorBySlot: existing?.profile.placedDecorBySlot || {
                  ...DEFAULT_PLACED_DECOR,
                },
                claimedAchievementIds:
                  existing?.profile.claimedAchievementIds || [],
                userXp: Math.max(
                  existing?.profile.userXp ?? 0,
                  Number(data.petXp ?? 0)
                ),
                petXp: Number(data.petXp ?? 0),
                petXpBySpecies: existing?.profile.petXpBySpecies || {
                  [validSpeciesId]: Number(data.petXp ?? 0),
                },
                petHealth: Number(data.petHealth ?? 100),
                petHappiness: Number(data.petHappiness ?? 100),
                petEnergy: Number(data.petEnergy ?? 100),
                happinessHistory:
                  existing?.profile.happinessHistory ||
                  getUpdated7DayHappinessHistory(
                    undefined,
                    Number(data.petHappiness ?? 100),
                    0
                  ),
                gold: Number(data.gold ?? 0),
                streakDays: Number(data.streakDays ?? 0),
                claimedStreakCrates:
                  existing?.profile.claimedStreakCrates || [],
                cheatCount: Number(data.cheatCount ?? 0),
                totalTasksCompleted: Number(data.totalTasksCompleted ?? 0),
                lastDailyBonusDate: existing?.profile.lastDailyBonusDate || '',
                lastLoginGameDay:
                  existing?.profile.lastLoginGameDay || getGameDayKey4AM(),
                lastStreakGameDay: existing?.profile.lastStreakGameDay || '',
                createdAtIso:
                  existing?.profile.createdAtIso || new Date().toISOString(),
              };

              const mergedTasks =
                remoteTasks.length > 0
                  ? remoteTasks.map((rt) => {
                      const localMatch = existing?.tasks.find(
                        (lt) => lt.id === rt.id
                      );
                      return localMatch ? { ...localMatch, ...rt } : rt;
                    })
                  : existing?.tasks || [];

              return {
                ...prev,
                [fbUser.uid]: {
                  profile: mergedProfile,
                  tasks: mergedTasks,
                  penaltyHistory: existing?.penaltyHistory || [],
                },
              };
            });
            setActiveUsername(fbUser.uid);
          } else {
            // Provision initial Firestore profile & starter quests for verified user
            const created = createInitialAccount({
              uid: fbUser.uid,
              username: safeHandle,
              initialPetName: 'Buddy',
              focusTrackId: 'balanced',
            });
            await syncProfileToFirestore(created.profile, true);
            for (const t of created.tasks) {
              try {
                await setDoc(doc(db, 'users', fbUser.uid, 'tasks', t.id), {
                  ownerId: fbUser.uid,
                  title: t.title,
                  category: t.category,
                  difficulty: t.difficulty,
                  status: 'pending',
                  minDurationSeconds: t.minDurationSeconds,
                  xpReward: t.xpReward,
                  goldReward: t.goldReward,
                  createdAtMs: t.createdAtMs,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
              } catch (taskErr) {
                handleFirestoreError(
                  taskErr,
                  OperationType.CREATE,
                  `users/${fbUser.uid}/tasks/${t.id}`
                );
              }
            }
            setAccountsMap((prev) => ({
              ...prev,
              [fbUser.uid]: {
                profile: created.profile,
                tasks: created.tasks,
                penaltyHistory: [],
              },
            }));
            setActiveUsername(fbUser.uid);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, path);
        }
      } else {
        // Authenticated Firebase Email/Password session
        setAccountsMap((prev) => {
          if (prev[fbUser.uid]) return prev;
          const created = createInitialAccount({
            uid: fbUser.uid,
            username: safeHandle,
            initialPetName: 'Buddy',
            focusTrackId: 'balanced',
          });
          return {
            ...prev,
            [fbUser.uid]: {
              profile: created.profile,
              tasks: created.tasks,
              penaltyHistory: [],
            },
          };
        });
        setActiveUsername(fbUser.uid);
      }

      setIsAuthReady(true);
    });
    return () => unsub();
  }, [syncProfileToFirestore]);

  const currentAccount = activeUsername ? accountsMap[activeUsername] : null;

  const updateCurrentAccount = useCallback(
    (updater: (record: StoredAccountRecord) => StoredAccountRecord) => {
      if (!activeUsername) return;
      setAccountsMap((prev) => {
        const curr = prev[activeUsername];
        if (!curr) return prev;
        const updated = updater(curr);
        syncProfileToFirestore(updated.profile, false);
        return {
          ...prev,
          [activeUsername]: updated,
        };
      });
    },
    [activeUsername, syncProfileToFirestore]
  );

  const triggerMoodTemporarily = useCallback((mood: 'happy' | 'penalized') => {
    setPetMood(mood);
    setTimeout(() => {
      setPetMood('idle');
    }, 1800);
  }, []);

  /**
   * Shared reward calculation for completing a verified task or finished timer task.
   * XP can ONLY be gained by completing tasks, boosted by the Day Streak Multiplier (x1.01 up to x2.00).
   */
  const completeTaskWithRewards = useCallback(
    async (task: TaskItem, isFromTimerEnd: boolean = false) => {
      if (!currentAccount) return;
      const { profile } = currentAccount;
      const activeSpecies =
        PET_SPECIES_MAP[profile.activeSpeciesId] ||
        PET_SPECIES_MAP['common_dog'];

      const isTimerTask = Boolean(task.isTimerTask) || isFromTimerEnd;
      const currentGameDay = getGameDayKey4AM();

      // Streak increments at most once per 4:00 AM Game Day when at least one task is completed
      const shouldIncrementDailyStreak =
        profile.lastStreakGameDay !== currentGameDay;
      let nextStreak = profile.streakDays;
      if (shouldIncrementDailyStreak) {
        if (profile.lastStreakGameDay) {
          const daysDiff = getDaysBetweenGameDays(
            profile.lastStreakGameDay,
            currentGameDay
          );
          nextStreak = daysDiff === 1 ? profile.streakDays + 1 : 1;
        } else {
          nextStreak = 1;
        }
      }

      // Day Streak XP Bonus Multiplier (Day 1 = x1.01, Day 13 = x1.13, ..., up to x2.00)
      const streakXpBonus = getStreakXpMultiplier(nextStreak);

      // Stacking Adult Pet System Multipliers
      const adultBonuses = calculateActiveAdultBonuses(profile);
      const adultXpMultiplier = 1 + adultBonuses.totalXpPct / 100;
      const adultGoldMultiplier = 1 + adultBonuses.totalGoldPct / 100;

      const earnedXp = Math.max(
        1,
        Math.round(task.xpReward * streakXpBonus * adultXpMultiplier)
      );

      // Currency reward (already has -5% unfair rule applied on task creation) boosted by adult pet bonuses
      const earnedGold = Math.max(
        1,
        Math.round(task.goldReward * adultGoldMultiplier)
      );

      const oldStage = getEvolutionStage(profile.petXp);
      const newXp = profile.petXp + earnedXp;
      const newStage = getEvolutionStage(newXp);

      if (newStage !== oldStage) {
        soundFX.playEvolution();
        window.setTimeout(
          () => soundFX.playSpeciesCry(activeSpecies.id, 'happy'),
          320
        );
        setEvolutionBanner({
          speciesName: activeSpecies.name,
          oldStage,
          newStage,
          newFormName: activeSpecies.stages[newStage].formName,
        });
      } else if (isTimerTask) {
        soundFX.playTimerAlarmComplete();
        window.setTimeout(
          () => soundFX.playSpeciesCry(activeSpecies.id, 'happy'),
          260
        );
        setTimerRewardToast({
          taskTitle: task.title,
          xpEarned: earnedXp,
          goldEarned: earnedGold,
        });
      } else {
        soundFX.playTaskComplete();
        window.setTimeout(
          () => soundFX.playSpeciesCry(activeSpecies.id, 'happy'),
          180
        );
      }

      triggerMoodTemporarily('happy');

      if (
        shouldIncrementDailyStreak &&
        (nextStreak === 3 ||
          nextStreak === 10 ||
          nextStreak === 25 ||
          nextStreak === 50 ||
          nextStreak === 100) &&
        !(profile.claimedAchievementIds || []).includes(
          `ach_streak_${nextStreak}`
        )
      ) {
        setShowAchievementsModal(true);
      }

      updateCurrentAccount((rec) => {
        const p = { ...rec.profile };
        const prevSpeciesSum = Object.values(p.petXpBySpecies || {}).reduce(
          (sum, v) => sum + (v || 0),
          0
        );
        const baseUserXp = Math.max(p.userXp ?? 0, prevSpeciesSum, p.petXp);
        p.userXp = baseUserXp + earnedXp;
        p.petXp = newXp;
        p.petXpBySpecies = {
          ...(p.petXpBySpecies || {}),
          [p.activeSpeciesId]: newXp,
        };
        p.gold += earnedGold;
        p.totalTasksCompleted += 1;
        p.streakDays = nextStreak;
        p.lastLoginGameDay = currentGameDay;
        if (shouldIncrementDailyStreak) {
          p.lastStreakGameDay = currentGameDay;
        }
        p.petHealth = Math.min(100, p.petHealth + 10);
        p.petHappiness = Math.min(100, p.petHappiness + 10);
        p.petEnergy = Math.min(100, p.petEnergy + 8);
        p.happinessHistory = getUpdated7DayHappinessHistory(
          p.happinessHistory,
          p.petHappiness,
          1,
          Date.now(),
          p.createdAtIso
        );

        const updatedTasks = rec.tasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: 'completed' as const,
                completedAtMs: Date.now(),
              }
            : t
        );

        return {
          ...rec,
          profile: p,
          tasks: updatedTasks,
        };
      });

      const fbUser = auth.currentUser;
      if (fbUser && fbUser.emailVerified && fbUser.uid === profile.uid) {
        const path = `users/${fbUser.uid}/tasks/${task.id}`;
        try {
          await updateDoc(doc(db, 'users', fbUser.uid, 'tasks', task.id), {
            status: 'completed',
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      }
    },
    [currentAccount, triggerMoodTemporarily, updateCurrentAccount]
  );

  const hasRunningTimerTask = Boolean(
    currentAccount?.tasks.some(
      (t) => t.status === 'pending' && t.isTimerTask && t.timerStartedAtMs
    )
  );
  useScreenWakeLock(hasRunningTimerTask);

  const isAnyModalOpen =
    showStoreModal ||
    showMaxPetsModal ||
    showAchievementsModal ||
    showProfileModal ||
    showQuestsModal ||
    showTutorialOverlay ||
    Boolean(selectedDecorSlotForPlacement);

  useAndroidBackHandler(isAnyModalOpen, () => {
    if (selectedDecorSlotForPlacement) setSelectedDecorSlotForPlacement(null);
    else if (showTutorialOverlay) setShowTutorialOverlay(false);
    else if (showQuestsModal) setShowQuestsModal(false);
    else if (showProfileModal) setShowProfileModal(false);
    else if (showStoreModal) setShowStoreModal(false);
    else if (showMaxPetsModal) setShowMaxPetsModal(false);
    else if (showAchievementsModal) setShowAchievementsModal(false);
  });

  // Auto-launch 6-step interactive tutorial for first-time trainers
  useEffect(() => {
    if (!activeUsername || !currentAccount) return;
    const tutorialKey = `evoquest_tutorial_completed_v1_${currentAccount.profile.uid}`;
    try {
      const completed = localStorage.getItem(tutorialKey);
      if (completed !== 'true') {
        setShowTutorialOverlay(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, [activeUsername, currentAccount]);

  const handleFinishTutorial = () => {
    if (currentAccount) {
      try {
        localStorage.setItem(
          `evoquest_tutorial_completed_v1_${currentAccount.profile.uid}`,
          'true'
        );
      } catch {
        // Ignore
      }
    }
    setShowTutorialOverlay(false);
  };

  // Automatic Timer Completion Watcher (Optimized for low-RAM background running)
  useEffect(() => {
    if (!currentAccount) return;
    const runningTimerTasks = currentAccount.tasks.filter(
      (t) =>
        t.status === 'pending' &&
        t.isTimerTask &&
        t.timerStartedAtMs &&
        !t.isTimerPaused
    );
    if (runningTimerTasks.length === 0) return;

    const checkTimers = () => {
      const now = Date.now();
      for (const t of runningTimerTasks) {
        if (!t.timerStartedAtMs || t.isTimerPaused) continue;
        const totalDurationSec =
          t.timerDurationSeconds || t.minDurationSeconds;
        const currentRunSec = Math.max(
          0,
          Math.floor((now - t.timerStartedAtMs) / 1000)
        );
        const totalElapsedSec =
          (t.timerElapsedBeforePauseSeconds || 0) + currentRunSec;

        if (totalElapsedSec >= totalDurationSec) {
          completeTaskWithRewards(t, true);
          break;
        }
      }
    };

    checkTimers();
    // 1000ms interval saves battery and memory on low-end devices
    const interval = window.setInterval(checkTimers, 1000);

    const handleVisibility = () => {
      if (!document.hidden) {
        checkTimers();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentAccount, completeTaskWithRewards]);

  // Synchronize Webpage Title with Active Timer Quest & Countdown
  useEffect(() => {
    if (!currentAccount) {
      document.title = 'MeCare: Pets To-Do List';
      return;
    }

    const activeTimerTask = currentAccount.tasks.find(
      (t) =>
        t.status === 'pending' &&
        t.isTimerTask &&
        (t.timerStartedAtMs || t.isTimerPaused)
    );

    if (!activeTimerTask) {
      document.title = 'MeCare: Pets To-Do List';
      return;
    }

    const syncTitle = () => {
      const totalSec =
        activeTimerTask.timerDurationSeconds ||
        activeTimerTask.minDurationSeconds;
      const isPaused = Boolean(activeTimerTask.isTimerPaused);
      const currentRunSec =
        activeTimerTask.timerStartedAtMs && !isPaused
          ? Math.max(
              0,
              Math.floor((Date.now() - activeTimerTask.timerStartedAtMs) / 1000)
            )
          : 0;
      const totalElapsed =
        (activeTimerTask.timerElapsedBeforePauseSeconds || 0) + currentRunSec;
      const remainingSec = Math.max(0, totalSec - totalElapsed);

      const m = Math.floor(remainingSec / 60);
      const s = remainingSec % 60;
      const timeFormatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

      if (isPaused) {
        document.title = `⏸ [PAUSED ${timeFormatted}] ${activeTimerTask.title} | MeCare`;
      } else {
        document.title = `⏱ ${timeFormatted} - ${activeTimerTask.title} | MeCare`;
      }
    };

    syncTitle();
    if (!activeTimerTask.isTimerPaused) {
      const titleInterval = window.setInterval(syncTitle, 1000);
      return () => {
        window.clearInterval(titleInterval);
      };
    }
  }, [currentAccount]);

  // 4:00 AM Daily Boundary Check: Breaks streak & reduces Pet Heart if user misses a day, and auto-enlists Repeating Quests!
  useEffect(() => {
    if (!currentAccount) return;

    const check4AmDailyBoundary = () => {
      const currentGameDay = getGameDayKey4AM();
      const todayDow = getGameDayOfWeek4AM();
      const prevLoginDay = currentAccount.profile.lastLoginGameDay;

      const needsLoginDayUpdate = prevLoginDay !== currentGameDay;
      const needsRepeatingEnlist = currentAccount.tasks.some(
        (t) =>
          t.isRepeating &&
          t.repeatDays &&
          t.repeatDays.includes(todayDow) &&
          t.lastEnlistedGameDay !== currentGameDay
      );

      if (!needsLoginDayUpdate && !needsRepeatingEnlist) return;

      updateCurrentAccount((rec) => {
        const p = { ...rec.profile };
        if (p.lastStreakGameDay && p.lastStreakGameDay !== currentGameDay) {
          const daysElapsed = getDaysBetweenGameDays(
            p.lastStreakGameDay,
            currentGameDay
          );
          if (daysElapsed > 1) {
            // Missed completing at least one task on previous day: break streak!
            p.streakDays = 0;
            p.petHealth = Math.max(10, p.petHealth - 25 * (daysElapsed - 1));
          }
        } else if (p.lastLoginGameDay && p.lastLoginGameDay !== currentGameDay) {
          const daysElapsed = getDaysBetweenGameDays(
            p.lastLoginGameDay,
            currentGameDay
          );
          if (daysElapsed > 1 && p.streakDays > 0) {
            p.streakDays = 0;
          }
        }
        p.lastLoginGameDay = currentGameDay;

        const updatedTasks = rec.tasks.map((t) => {
          if (
            t.isRepeating &&
            t.repeatDays &&
            t.repeatDays.includes(todayDow) &&
            t.lastEnlistedGameDay !== currentGameDay
          ) {
            return {
              ...t,
              status: 'pending' as const,
              createdAtMs: Date.now(),
              completedAtMs: undefined,
              timerStartedAtMs: null,
              lastEnlistedGameDay: currentGameDay,
            };
          }
          return t;
        });

        return {
          ...rec,
          profile: p,
          tasks: updatedTasks,
        };
      });
    };

    check4AmDailyBoundary();
    const interval = window.setInterval(check4AmDailyBoundary, 30000);
    return () => window.clearInterval(interval);
  }, [currentAccount, updateCurrentAccount]);

  const finalizeNewUserAccount = async (params: {
    uid: string;
    username: string;
    initialPetName: string;
    focusTrackId: string;
  }) => {
    const { uid, username, initialPetName, focusTrackId } = params;

    // 1. Claim in /usernames registry
    try {
      await setDoc(doc(db, 'usernames', username), {
        uid,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Could not register in /usernames:', e);
    }

    // 2. Create initial user document
    const created = createInitialAccount({
      uid,
      username,
      initialPetName,
      focusTrackId,
    });
    await syncProfileToFirestore(created.profile, true);

    // 3. Create initial tasks
    for (const t of created.tasks) {
      try {
        await setDoc(doc(db, 'users', uid, 'tasks', t.id), {
          ownerId: uid,
          title: t.title,
          category: t.category,
          difficulty: t.difficulty,
          status: 'pending',
          minDurationSeconds: t.minDurationSeconds,
          xpReward: t.xpReward,
          goldReward: t.goldReward,
          createdAtMs: t.createdAtMs,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (taskErr) {
        handleFirestoreError(
          taskErr,
          OperationType.CREATE,
          `users/${uid}/tasks/${t.id}`
        );
      }
    }

    setAccountsMap((prev) => ({
      ...prev,
      [uid]: {
        profile: created.profile,
        tasks: created.tasks,
        penaltyHistory: [],
      },
    }));
  };

  const handleConfirmNewGoogleUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleNewUser) return;
    setGoogleUsernameError(null);
    const clean = googleUsernameDraft
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 24);

    if (clean.length < 3) {
      setGoogleUsernameError('Username must be at least 3 characters.');
      return;
    }

    setIsFinalizingGoogleUser(true);
    try {
      // Check uniqueness in Firestore
      const checkSnap = await getDoc(doc(db, 'usernames', clean));
      if (checkSnap.exists()) {
        const data = checkSnap.data();
        if (data?.uid && data.uid !== pendingGoogleNewUser.uid) {
          setGoogleUsernameError(`Username '@${clean}' is already taken. Please choose another.`);
          setIsFinalizingGoogleUser(false);
          return;
        }
      }

      await finalizeNewUserAccount({
        uid: pendingGoogleNewUser.uid,
        username: clean,
        initialPetName: pendingGoogleNewUser.initialPetName,
        focusTrackId: pendingGoogleNewUser.focusTrackId,
      });

      setActiveUsername(pendingGoogleNewUser.uid);
      setPendingGoogleNewUser(null);
      soundFX.playTaskComplete();
    } catch (err: unknown) {
      setGoogleUsernameError(err instanceof Error ? err.message : 'Failed to register username.');
    } finally {
      setIsFinalizingGoogleUser(false);
    }
  };

  const handleLoginOrRegister = async (params: {
    username: string;
    password?: string;
    isNewUser: boolean;
    initialPetName?: string;
    focusTrackId?: string;
    useGoogleAuth?: boolean;
  }): Promise<{ ok: boolean; error?: string }> => {
    const rawInput = params.username.trim();
    const cleanUsername = rawInput
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 28);
    const validHandle =
      cleanUsername.length >= 3 ? cleanUsername : `${cleanUsername}_01`;

    if (params.useGoogleAuth) {
      try {
        const cred = await signInWithPopup(auth, googleProvider);
        const fbUid = cred.user.uid;

        // Check if existing user in Firestore
        const snap = await getDoc(doc(db, 'users', fbUid));
        if (snap.exists()) {
          // Returning user: Directly sign in with no username prompt!
          setActiveUsername(fbUid);
          soundFX.playTaskComplete();
          return { ok: true };
        }

        // BRAND NEW ACCOUNT via Google!
        // Derive candidate handle from form input, Google displayName, or email
        const rawGoogleName =
          params.username?.trim() ||
          cred.user.displayName ||
          cred.user.email?.split('@')[0] ||
          'trainer';
        const cleanGoogleHandle = rawGoogleName
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '_')
          .slice(0, 24);
        const validGoogleHandle =
          cleanGoogleHandle.length >= 3 ? cleanGoogleHandle : `${cleanGoogleHandle}_01`;

        // Check if this handle is already taken in the /usernames collection
        let isTaken = false;
        try {
          const nameCheck = await getDoc(doc(db, 'usernames', validGoogleHandle));
          if (nameCheck.exists()) {
            isTaken = true;
          }
        } catch {
          // fallback
        }

        // For new accounts: prompt user to choose/confirm unique username if not provided or taken
        if (isTaken || !params.username?.trim()) {
          const suggested = isTaken
            ? `${validGoogleHandle}_${Math.floor(Math.random() * 89 + 10)}`
            : validGoogleHandle;
          setPendingGoogleNewUser({
            uid: fbUid,
            suggestedUsername: suggested,
            initialPetName: params.initialPetName || 'Buddy',
            focusTrackId: params.focusTrackId || 'balanced',
          });
          setGoogleUsernameDraft(suggested);
          setGoogleUsernameError(
            isTaken
              ? `Handle '@${validGoogleHandle}' is taken. Choose a unique username:`
              : null
          );
          return { ok: true };
        }

        // Otherwise handle is available -> finalize account
        await finalizeNewUserAccount({
          uid: fbUid,
          username: validGoogleHandle,
          initialPetName: params.initialPetName || 'Buddy',
          focusTrackId: params.focusTrackId || 'balanced',
        });
        setActiveUsername(fbUid);
        soundFX.playTaskComplete();
        return { ok: true };
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        if (
          code === 'auth/popup-closed-by-user' ||
          code === 'auth/cancelled-popup-request' ||
          code === 'auth/user-cancelled'
        ) {
          return { ok: false };
        }
        if (auth.currentUser) {
          setActiveUsername(auth.currentUser.uid);
          return { ok: true };
        }
        return {
          ok: false,
          error:
            err instanceof Error
              ? err.message
              : 'Google authentication was not completed.',
        };
      }
    }

    const pwd = params.password || '';
    const emailToUse = rawInput.includes('@')
      ? rawInput
      : `${validHandle}@evoquest.app`;

    try {
      if (params.isNewUser) {
        // Check uniqueness in /usernames
        try {
          const checkName = await getDoc(doc(db, 'usernames', validHandle));
          if (checkName.exists()) {
            return {
              ok: false,
              error: `Username '@${validHandle}' is already taken. Please choose another.`,
            };
          }
        } catch {
          // fallback
        }

        const cred = await createUserWithEmailAndPassword(auth, emailToUse, pwd);
        const fbUid = cred.user.uid;
        await finalizeNewUserAccount({
          uid: fbUid,
          username: validHandle,
          initialPetName: params.initialPetName || 'Buddy',
          focusTrackId: params.focusTrackId || 'balanced',
        });
        setActiveUsername(fbUid);
        soundFX.playTaskComplete();
        return { ok: true };
      } else {
        const cred = await signInWithEmailAndPassword(auth, emailToUse, pwd);
        setActiveUsername(cred.user.uid);
        soundFX.playTaskComplete();
        return { ok: true };
      }
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (
        code === 'auth/operation-not-allowed' ||
        code === 'auth/configuration-not-found'
      ) {
        return {
          ok: false,
          error:
            'Please use "Continue with Google" or enable Email/Password sign-in in your Firebase project.',
        };
      }
      if (code === 'auth/email-already-in-use') {
        return {
          ok: false,
          error:
            'This account is already registered. Please switch to Sign In.',
        };
      }
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        return {
          ok: false,
          error: 'Invalid username/email or password.',
        };
      }
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : 'Authentication failed. Please try again.',
      };
    }
  };

  if (!isBootComplete || !isAuthReady) {
    return <PixelLoadingScreen progress={bootProgress} />;
  }

  if (!activeUsername || !currentAccount) {
    return (
      <>
        <AuthScreen onLoginSuccess={handleLoginOrRegister} />
        {pendingGoogleNewUser && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#FFFDF9] pixel-box p-5 animate-in fade-in zoom-in-95 duration-150 text-slate-900">
              <div className="mb-3.5 pb-2.5 border-b border-slate-300">
                <h3 className="font-display text-xs text-slate-900">
                  WELCOME NEW TRAINER!
                </h3>
                <p className="font-pixel text-base font-bold text-slate-600 mt-1">
                  Choose your unique trainer handle for your new account:
                </p>
              </div>

              <form onSubmit={handleConfirmNewGoogleUsername} className="space-y-3">
                <div>
                  <label className="block font-display text-[9px] text-slate-700 mb-1">
                    UNIQUE USERNAME
                  </label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 bg-slate-100 border-y-2 border-l-2 border-[#3B4254] font-pixel text-lg font-bold text-slate-600">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      autoFocus
                      maxLength={24}
                      disabled={isFinalizingGoogleUser}
                      value={googleUsernameDraft}
                      onChange={(e) => {
                        setGoogleUsernameDraft(e.target.value);
                        if (googleUsernameError) setGoogleUsernameError(null);
                      }}
                      placeholder="e.g. dragon_rider"
                      className="w-full px-3 py-2 bg-white border-2 border-[#3B4254] text-slate-900 font-pixel text-lg font-bold focus:outline-none"
                    />
                  </div>
                  {googleUsernameError && (
                    <p className="text-[11px] text-rose-600 font-pixel font-bold mt-1">
                      {googleUsernameError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingGoogleNewUser(null);
                      signOut(auth);
                    }}
                    className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 font-display text-[9px] pixel-btn"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isFinalizingGoogleUser}
                    className="py-2.5 px-4 bg-amber-300 hover:bg-amber-200 text-slate-950 font-display text-[10px] pixel-btn flex items-center justify-center gap-1.5"
                  >
                    {isFinalizingGoogleUser ? 'SAVING...' : 'START ADVENTURE'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  const { profile, tasks } = currentAccount;
  const activeSpecies =
    PET_SPECIES_MAP[profile.activeSpeciesId] || PET_SPECIES_MAP['common_dog'];
  const liveStage = getEvolutionStage(profile.petXp);
  const liveStageInfo = activeSpecies.stages[liveStage];

  // Achievements ready to claim (Streak + Quests)
  const claimedAchIds = profile.claimedAchievementIds || [];
  const readyAchievements = ACHIEVEMENTS_LIST.filter((ach) => {
    const val =
      ach.type === 'streak' ? profile.streakDays : profile.totalTasksCompleted;
    return val >= ach.targetValue && !claimedAchIds.includes(ach.id);
  });
  const readyStreakAchievements = readyAchievements.filter(
    (ach) => ach.type === 'streak'
  );

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = petNameInput.trim().slice(0, 28);
    if (!clean) return;
    updateCurrentAccount((rec) => ({
      ...rec,
      profile: {
        ...rec.profile,
        activePetName: clean,
        petCustomNames: {
          ...rec.profile.petCustomNames,
          [rec.profile.activeSpeciesId]: clean,
        },
      },
    }));
    setIsRenamingPet(false);
  };

  const xpBySpeciesMap = profile.petXpBySpecies || {
    [profile.activeSpeciesId]: profile.petXp,
  };
  const totalSpeciesXpSum = Object.values(xpBySpeciesMap).reduce(
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

  // Pets are considered Max Level ONLY when they reach Adulthood (ADULT stage = 2,800 XP)
  const maxedPetsCount = PET_SPECIES_LIST.filter(
    (sp) =>
      profile.unlockedSpecies.includes(sp.id) &&
      getPetStageProgressInfo(
        sp.id === profile.activeSpeciesId
          ? Math.max(profile.petXp, xpBySpeciesMap[sp.id] || 0)
          : xpBySpeciesMap[sp.id] || 0
      ).isAdultMax
  ).length;

  // Achievements reward merged Currency (Gold) + Exclusive Trophy Decor + Milestone Pets
  const handleClaimAchievement = (ach: AchievementDef) => {
    const exclusiveItem = ach.exclusiveDecorId
      ? ROOM_DECOR_ITEMS.find((d) => d.id === ach.exclusiveDecorId)
      : undefined;

    updateCurrentAccount((rec) => {
      const p = { ...rec.profile };
      const existingClaimed = p.claimedAchievementIds || [];
      if (existingClaimed.includes(ach.id)) return rec;

      p.gold += ach.unfairGoldReward;
      if (ach.type === 'streak') {
        p.petHealth = 100;
        p.petHappiness = 100;
        p.petEnergy = 100;
      }
      p.claimedAchievementIds = [...existingClaimed, ach.id];

      // Milestone Pet Unlock
      if (ach.rewardPetSpeciesId) {
        const currSpecies = p.unlockedSpecies || ['common_dog'];
        if (!currSpecies.includes(ach.rewardPetSpeciesId)) {
          p.unlockedSpecies = [...currSpecies, ach.rewardPetSpeciesId];
        }
      }

      if (exclusiveItem) {
        const currDecor = p.unlockedDecorIds || [
          'window_sunny',
          'wood_bookshelf',
          'potted_sprout',
          'cozy_cushion',
        ];
        if (!currDecor.includes(exclusiveItem.id)) {
          p.unlockedDecorIds = [...currDecor, exclusiveItem.id];
        }

        const currentPlaced = p.placedDecorBySlot || DEFAULT_PLACED_DECOR;
        let targetSlot: RoomSlotId;
        if (exclusiveItem.category === 'wall') {
          const wallSlots: RoomSlotId[] = ['wall_1', 'wall_2', 'wall_3', 'wall_4'];
          const emptyWall = wallSlots.find((s) => !currentPlaced[s]);
          targetSlot = emptyWall || 'wall_1';
        } else {
          const floorSlots: RoomSlotId[] = ['floor_left', 'floor_right'];
          const emptyFloor = floorSlots.find((s) => !currentPlaced[s]);
          targetSlot = emptyFloor || 'floor_right';
        }

        p.placedDecorBySlot = {
          ...currentPlaced,
          [targetSlot]: exclusiveItem.id,
        };
      }

      return {
        ...rec,
        profile: p,
      };
    });

    if (ach.rewardPetSpeciesId) {
      soundFX.playEvolution();
    }
    soundFX.playSpeciesCry(activeSpecies.id, 'happy');
    triggerMoodTemporarily('happy');
  };

  // Pet mood increases randomly by 3 to 5 on interactions and updates 7-day trend
  const handlePetInteractBonus = (
    _type:
      | 'tickle'
      | 'fall'
      | 'flip'
      | 'headpat'
      | 'dash_left'
      | 'dash_right'
      | 'crouch'
  ) => {
    const adultBonuses = calculateActiveAdultBonuses(profile);
    const baseBoost = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5
    const randomMoodBoost = baseBoost + adultBonuses.totalMoodBoost;
    triggerHaptic(10);
    updateCurrentAccount((rec) => {
      const nextHappiness = Math.min(
        100,
        rec.profile.petHappiness + randomMoodBoost
      );
      return {
        ...rec,
        profile: {
          ...rec.profile,
          petHappiness: nextHappiness,
          happinessHistory: getUpdated7DayHappinessHistory(
            rec.profile.happinessHistory,
            nextHappiness,
            1,
            Date.now(),
            rec.profile.createdAtIso
          ),
        },
      };
    });
  };

  const handleCreateTask = async (params: {
    title: string;
    category: TaskCategory;
    difficulty: TaskDifficulty;
    isTimerTask?: boolean;
    timerDurationSeconds?: number;
    isRepeating?: boolean;
    repeatDays?: number[];
  }) => {
    const diffCfg = TASK_DIFFICULTY_CONFIG[params.difficulty];
    const newTaskId = `task_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    const isTimer = Boolean(params.isTimerTask);
    const timerSec = params.timerDurationSeconds || 60;

    const xpReward = isTimer
      ? timerSec >= 1500
        ? 150
        : timerSec >= 900
        ? 110
        : timerSec >= 300
        ? 70
        : timerSec >= 60
        ? 40
        : 25
      : diffCfg.xpReward;

    const goldReward = isTimer
      ? timerSec >= 1500
        ? applyUnfairGoldTax(120)
        : timerSec >= 900
        ? applyUnfairGoldTax(85)
        : timerSec >= 300
        ? applyUnfairGoldTax(55)
        : timerSec >= 60
        ? applyUnfairGoldTax(30)
        : applyUnfairGoldTax(20)
      : diffCfg.goldReward;

    const minDur = isTimer ? Math.max(5, timerSec) : diffCfg.minDurationSeconds;
    const currentGameDay = getGameDayKey4AM();

    const newTask: TaskItem = {
      id: newTaskId,
      ownerId: profile.uid,
      title: params.title.trim().slice(0, 140),
      category: params.category,
      difficulty: params.difficulty,
      status: 'pending',
      minDurationSeconds: minDur,
      xpReward,
      goldReward,
      createdAtMs: Date.now(),
      isTimerTask: isTimer,
      timerDurationSeconds: isTimer ? timerSec : undefined,
      timerStartedAtMs: null,
      isRepeating: Boolean(params.isRepeating),
      repeatDays: params.repeatDays,
      lastEnlistedGameDay: params.isRepeating ? currentGameDay : undefined,
    };

    updateCurrentAccount((rec) => ({
      ...rec,
      tasks: [newTask, ...rec.tasks],
    }));

    const fbUser = auth.currentUser;
    if (fbUser && fbUser.emailVerified && fbUser.uid === profile.uid) {
      const path = `users/${fbUser.uid}/tasks/${newTaskId}`;
      try {
        await setDoc(doc(db, 'users', fbUser.uid, 'tasks', newTaskId), {
          ownerId: fbUser.uid,
          title: newTask.title,
          category: newTask.category,
          difficulty: newTask.difficulty,
          status: 'pending',
          minDurationSeconds: newTask.minDurationSeconds,
          xpReward: newTask.xpReward,
          goldReward: newTask.goldReward,
          createdAtMs: newTask.createdAtMs,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }
    }
  };

  const handleStartTaskTimer = (taskId: string) => {
    soundFX.playTimerStart();
    updateCurrentAccount((rec) => ({
      ...rec,
      tasks: rec.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isTimerTask: true,
              isTimerPaused: false,
              timerElapsedBeforePauseSeconds: 0,
              timerStartedAtMs: Date.now(),
            }
          : t
      ),
    }));
  };

  const handlePauseTaskTimer = (taskId: string) => {
    soundFX.playClick();
    updateCurrentAccount((rec) => ({
      ...rec,
      tasks: rec.tasks.map((t) => {
        if (t.id !== taskId || !t.isTimerTask) return t;
        const currentRunSec = t.timerStartedAtMs
          ? Math.max(0, Math.floor((Date.now() - t.timerStartedAtMs) / 1000))
          : 0;
        const totalElapsed =
          (t.timerElapsedBeforePauseSeconds || 0) + currentRunSec;
        return {
          ...t,
          isTimerPaused: true,
          timerElapsedBeforePauseSeconds: totalElapsed,
          timerStartedAtMs: null,
        };
      }),
    }));
  };

  const handleResumeTaskTimer = (taskId: string) => {
    soundFX.playTimerStart();
    updateCurrentAccount((rec) => ({
      ...rec,
      tasks: rec.tasks.map((t) => {
        if (t.id !== taskId || !t.isTimerTask) return t;
        return {
          ...t,
          isTimerPaused: false,
          timerStartedAtMs: Date.now(),
        };
      }),
    }));
  };

  const handleAttemptCompleteTask = async (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.status !== 'pending') return;

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - targetTask.createdAtMs) / 1000)
    );
    const isCheating = elapsedSeconds < targetTask.minDurationSeconds;

    if (isCheating) {
      const penaltyEvent: PenaltyEvent = {
        id: `pen_${Date.now()}`,
        taskTitle: targetTask.title,
        elapsedSeconds,
        requiredSeconds: targetTask.minDurationSeconds,
        hpLost: 20,
        happinessLost: 20,
        goldLost: 16,
        xpLost: 15,
        timestampMs: Date.now(),
      };

      soundFX.playPenaltyBuzzer();
      window.setTimeout(
        () => soundFX.playSpeciesCry(activeSpecies.id, 'weak'),
        220
      );
      triggerMoodTemporarily('penalized');
      setLatestPenalty(penaltyEvent);

      updateCurrentAccount((rec) => {
        const p = { ...rec.profile };
        p.petHealth = Math.max(5, p.petHealth - penaltyEvent.hpLost);
        p.petHappiness = Math.max(
          5,
          p.petHappiness - penaltyEvent.happinessLost
        );
        p.happinessHistory = getUpdated7DayHappinessHistory(
          p.happinessHistory,
          p.petHappiness,
          0,
          Date.now(),
          p.createdAtIso
        );
        p.gold = Math.max(0, p.gold - penaltyEvent.goldLost);
        p.petXp = Math.max(0, p.petXp - penaltyEvent.xpLost);
        p.cheatCount += 1;

        const updatedTasks = rec.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: 'penalized' as const,
                completedAtMs: Date.now(),
                penaltyReason: `Checked off after ${elapsedSeconds}s (min ${targetTask.minDurationSeconds}s)`,
              }
            : t
        );

        return {
          ...rec,
          profile: p,
          tasks: updatedTasks,
          penaltyHistory: [penaltyEvent, ...rec.penaltyHistory],
        };
      });

      const fbUser = auth.currentUser;
      if (fbUser && fbUser.emailVerified && fbUser.uid === profile.uid) {
        const path = `users/${fbUser.uid}/tasks/${taskId}`;
        try {
          await updateDoc(doc(db, 'users', fbUser.uid, 'tasks', taskId), {
            status: 'penalized',
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      }
    } else {
      await completeTaskWithRewards(targetTask, false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    updateCurrentAccount((rec) => ({
      ...rec,
      tasks: rec.tasks.filter((t) => t.id !== taskId),
    }));

    const fbUser = auth.currentUser;
    if (fbUser && fbUser.emailVerified && fbUser.uid === profile.uid) {
      const path = `users/${fbUser.uid}/tasks/${taskId}`;
      try {
        await deleteDoc(doc(db, 'users', fbUser.uid, 'tasks', taskId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, path);
      }
    }
  };

  const handleBuyOrSelectSpecies = (species: PetSpeciesConfig) => {
    const isUnlocked = profile.unlockedSpecies.includes(species.id);
    if (!isUnlocked && profile.gold < species.priceGold) return;

    soundFX.playCoinSpend();
    window.setTimeout(() => soundFX.playSpeciesCry(species.id, 'happy'), 140);
    triggerMoodTemporarily('happy');

    updateCurrentAccount((rec) => {
      const p = { ...rec.profile };
      const xpMap = {
        ...(p.petXpBySpecies || {}),
        [p.activeSpeciesId]: p.petXp,
      };
      if (!isUnlocked) {
        p.gold -= species.priceGold;
        p.unlockedSpecies = [...p.unlockedSpecies, species.id];
      }
      const nextSpeciesXp = xpMap[species.id] ?? 0;
      xpMap[species.id] = nextSpeciesXp;
      p.petXpBySpecies = xpMap;
      p.petXp = nextSpeciesXp;
      p.activeSpeciesId = species.id;
      p.activePetName = p.petCustomNames?.[species.id] || species.name;
      return {
        ...rec,
        profile: p,
      };
    });
  };

  const handleBuyOrPlaceDecor = (item: RoomDecorItem) => {
    const unlockedIds = profile.unlockedDecorIds || [
      'window_sunny',
      'wood_bookshelf',
      'potted_sprout',
      'cozy_cushion',
    ];
    const isUnlocked = item.isDefault || unlockedIds.includes(item.id);
    if (!isUnlocked && item.isAchievementExclusive) return;
    if (!isUnlocked && profile.gold < item.priceGold) return;

    soundFX.playCoinSpend();
    triggerMoodTemporarily('happy');

    updateCurrentAccount((rec) => {
      const p = { ...rec.profile };
      const currentUnlocked = p.unlockedDecorIds || [
        'window_sunny',
        'wood_bookshelf',
        'potted_sprout',
        'cozy_cushion',
      ];
      if (!isUnlocked) {
        p.gold -= item.priceGold;
        p.unlockedDecorIds = [...currentUnlocked, item.id];
      }

      const currentPlaced = p.placedDecorBySlot || DEFAULT_PLACED_DECOR;
      // Check if item is already placed in ANY slot
      const existingSlotKey = (Object.keys(currentPlaced) as RoomSlotId[]).find(
        (key) => currentPlaced[key] === item.id
      );

      if (isUnlocked && existingSlotKey) {
        // Unequip from its slot
        p.placedDecorBySlot = {
          ...currentPlaced,
          [existingSlotKey]: '',
        };
      } else {
        // Equip to first empty slot of its category
        let targetSlot: RoomSlotId;
        if (item.category === 'wall') {
          const wallSlots: RoomSlotId[] = ['wall_1', 'wall_2', 'wall_3', 'wall_4'];
          const emptySlot = wallSlots.find((s) => !currentPlaced[s]);
          targetSlot = emptySlot || 'wall_1';
        } else {
          const floorSlots: RoomSlotId[] = ['floor_left', 'floor_right'];
          const emptySlot = floorSlots.find((s) => !currentPlaced[s]);
          targetSlot = emptySlot || 'floor_right';
        }
        p.placedDecorBySlot = {
          ...currentPlaced,
          [targetSlot]: item.id,
        };
      }

      return {
        ...rec,
        profile: p,
      };
    });
  };

  const handleUpdateUsername = async (
    newUsername: string
  ): Promise<{ ok: boolean; error?: string }> => {
    const clean = newUsername
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 24);

    if (clean.length < 3) {
      return { ok: false, error: 'Username must be at least 3 characters.' };
    }

    if (clean === profile.username.toLowerCase()) {
      return { ok: true };
    }

    // 1. Check uniqueness across Firestore usernames collection
    try {
      const nameSnap = await getDoc(doc(db, 'usernames', clean));
      if (nameSnap.exists()) {
        const data = nameSnap.data();
        if (data?.uid && data.uid !== profile.uid) {
          return {
            ok: false,
            error: `Username '@${clean}' is already taken by another trainer!`,
          };
        }
      }
    } catch (checkErr) {
      console.warn('Could not verify username in Firestore:', checkErr);
    }

    // 2. Check local accounts map
    const isTakenLocally = Object.values(accountsMap).some(
      (acc) =>
        acc.profile.uid !== profile.uid &&
        acc.profile.username.toLowerCase() === clean
    );
    if (isTakenLocally) {
      return {
        ok: false,
        error: `Username '@${clean}' is already taken!`,
      };
    }

    // 3. Register in Firestore usernames collection & release old username
    const fbUser = auth.currentUser;
    if (fbUser && fbUser.uid === profile.uid) {
      try {
        await setDoc(doc(db, 'usernames', clean), {
          uid: fbUser.uid,
          updatedAt: serverTimestamp(),
        });

        if (profile.username && profile.username.toLowerCase() !== clean) {
          try {
            await deleteDoc(doc(db, 'usernames', profile.username.toLowerCase()));
          } catch {
            // ignore
          }
        }

        await updateDoc(doc(db, 'users', fbUser.uid), {
          username: clean,
          updatedAt: serverTimestamp(),
        });
      } catch (dbErr) {
        console.error('Failed to update username in Firestore:', dbErr);
      }
    }

    // 4. Update local account profile
    updateCurrentAccount((rec) => ({
      ...rec,
      profile: {
        ...rec.profile,
        username: clean,
      },
    }));

    soundFX.playTaskComplete();
    return { ok: true };
  };

  const handlePlaceDecorItem = (slot: RoomSlotId, decorId: string) => {
    updateCurrentAccount((rec) => ({
      ...rec,
      profile: {
        ...rec.profile,
        placedDecorBySlot: {
          ...(rec.profile.placedDecorBySlot || DEFAULT_PLACED_DECOR),
          [slot]: decorId,
        },
      },
    }));
    soundFX.playTaskComplete();
  };

  const handleClearDecorSlot = (slot: RoomSlotId) => {
    updateCurrentAccount((rec) => ({
      ...rec,
      profile: {
        ...rec.profile,
        placedDecorBySlot: {
          ...(rec.profile.placedDecorBySlot || DEFAULT_PLACED_DECOR),
          [slot]: '',
        },
      },
    }));
  };

  const handleToggleSound = () => {
    soundFX.muted = !soundMuted;
    setSoundMuted(!soundMuted);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore
    }
    setActiveUsername(null);
  };

  const handleDirectRenamePet = (newName: string) => {
    const clean = newName.trim().slice(0, 28);
    if (!clean) return;
    updateCurrentAccount((rec) => ({
      ...rec,
      profile: {
        ...rec.profile,
        activePetName: clean,
        petCustomNames: {
          ...rec.profile.petCustomNames,
          [rec.profile.activeSpeciesId]: clean,
        },
      },
    }));
  };

  const todayDow = getGameDayOfWeek4AM();
  const pendingTodayTasksCount = tasks.filter((t) => {
    if (t.status !== 'pending') return false;
    if (t.isRepeating && t.repeatDays && t.repeatDays.length > 0) {
      return t.repeatDays.includes(todayDow);
    }
    return true;
  }).length;

  return (
    <div
      style={{ background: activeSpecies.theme.bgGradientCss }}
      className="relative w-screen h-dvh overflow-hidden text-slate-900 select-none"
    >
      {/* Full-Viewport 8-Bit Grounded Companion Stage + Customizable Room Background */}
      <main className="relative z-10 w-full h-full">
        <Pet3DScene
          speciesId={activeSpecies.id}
          stage={liveStage}
          mood={petMood}
          health={profile.petHealth}
          placedDecor={profile.placedDecorBySlot || DEFAULT_PLACED_DECOR}
          isModalOpen={isAnyModalOpen}
          onOpenDecorShop={(slot) => {
            setSelectedDecorSlotForPlacement(slot);
          }}
          onInteractBonus={handlePetInteractBonus}
        />
      </main>

      {/* =====================================================================
          MOBILE HUD (sm:hidden): Clean, Uncluttered 2-Row Top Bar
          ===================================================================== */}
      <div className="fixed top-2.5 inset-x-2.5 z-30 flex flex-col gap-1.5 sm:hidden pointer-events-auto">
        {/* Mobile Row 1: Profile (LV X) | Equal-Size Coins & Streak | Clear QUESTS CTA Button */}
        <div className="flex items-center gap-1.5">
          {/* 1. Profile & LV Button */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="h-9 px-2.5 bg-white active:bg-emerald-50 text-slate-900 pixel-btn flex items-center justify-center gap-1.5 shrink-0"
          >
            <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="font-display text-[10px] text-slate-950 flex items-center">
              LV {userDisciplineInfo.level}
            </span>
          </button>

          {/* 2. Coins Display Badge (Display-only, modal click removed) */}
          <div
            id="tutorial-currency-mobile"
            className="h-9 px-2.5 bg-[#FFFBEB] pixel-btn shrink-0 inline-flex items-center justify-center gap-1.5 select-none whitespace-nowrap"
          >
            <PixelCoinIcon size={15} className="shrink-0" />
            <span className="font-display text-[10px] text-slate-950 flex items-center">
              {profile.gold}
            </span>
          </div>

          {/* 3. Streak Display Badge (Display-only, modal click removed) */}
          <div
            className={`h-9 px-2.5 pixel-btn shrink-0 inline-flex items-center justify-center gap-1.5 select-none whitespace-nowrap ${
              readyStreakAchievements.length > 0
                ? 'bg-amber-300 text-slate-950'
                : 'bg-orange-100 text-orange-950'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-current shrink-0" />
            <span className="font-display text-[10px] flex items-center">
              {profile.streakDays}D
            </span>
          </div>

          {/* 4. Redesigned Self-Explanatory QUESTS CTA Button */}
          <button
            id="tutorial-quests-mobile"
            type="button"
            onClick={() => setShowQuestsModal(true)}
            className={`h-9 px-2.5 flex-1 min-w-0 pixel-btn flex items-center justify-between gap-1.5 ${
              hasRunningTimerTask
                ? 'bg-sky-300 text-slate-950'
                : 'bg-amber-300 active:bg-amber-200 text-slate-950'
            }`}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              {hasRunningTimerTask ? (
                <Timer className="w-4 h-4 text-sky-950 animate-spin shrink-0" />
              ) : (
                <CheckSquare className="w-4 h-4 shrink-0" />
              )}
              <span className="font-display text-[9px] tracking-tight truncate">
                QUESTS
              </span>
            </span>
            <span className="px-1.5 py-0.5 bg-white text-slate-950 font-display text-[9px] border border-[#3B4254] flex items-center justify-center shrink-0">
              {pendingTodayTasksCount}
            </span>
          </button>
        </div>

        {/* Mobile Row 2: Sleek Single-Line Companion Info Strip */}
        <div
          id="tutorial-vitals-mobile"
          className="bg-white/95 pixel-box px-3 py-1.5 flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="px-2 py-0.5 rounded font-display text-[9px] text-white uppercase shrink-0"
              style={{ backgroundColor: activeSpecies.primaryColor }}
            >
              {liveStageInfo.label}
            </span>
            <span className="font-display text-[11px] text-slate-900 truncate">
              {profile.activePetName}
            </span>
          </div>

          <div className="flex items-center gap-3 font-display text-[10px] shrink-0">
            <span className="text-rose-500 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>{profile.petHealth}%</span>
            </span>

            <button
              type="button"
              onClick={() => setShowMoodChartPopover((prev) => !prev)}
              className="text-amber-500 flex items-center gap-1"
            >
              <Smile className="w-3.5 h-3.5 shrink-0" />
              <span>{profile.petHappiness}%</span>
            </button>
          </div>
        </div>

        {/* Mobile 7-Day Happiness Trend Popover */}
        {showMoodChartPopover && (
          <HappinessTrendChart
            history={profile.happinessHistory}
            currentHappiness={profile.petHappiness}
            petName={profile.activePetName}
            createdAtIso={profile.createdAtIso}
            compact={true}
            onClose={() => setShowMoodChartPopover(false)}
          />
        )}
      </div>

      {/* =====================================================================
          DESKTOP / PC HUD (hidden sm:flex): Full Top-Left Pet & Profile HUD
          ===================================================================== */}
      <div className="hidden sm:flex fixed top-3 left-3 z-30 flex-col items-start gap-2 pointer-events-auto max-w-[calc(100vw-11rem)]">
        {/* Row 1: Pet Info Bar + Unified MY PROFILE Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            id="tutorial-vitals"
            className="bg-white pixel-box px-3.5 py-2 flex items-center gap-3"
          >
            {/* Pet Stage Badge */}
            <span
              className="px-2.5 py-1 rounded font-display text-xs text-white uppercase"
              style={{ backgroundColor: activeSpecies.primaryColor }}
            >
              {liveStageInfo.label}
            </span>

            {/* Pet Name + Inline Rename */}
            {isRenamingPet ? (
              <form
                onSubmit={handleRenameSubmit}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  maxLength={28}
                  autoFocus
                  value={petNameInput}
                  onChange={(e) => setPetNameInput(e.target.value)}
                  className="px-2.5 py-1 bg-white border-2 border-slate-800 text-slate-900 font-pixel text-xl font-bold w-28 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Save pet name"
                  className="w-7 h-7 bg-emerald-400 text-slate-950 rounded flex items-center justify-center"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsRenamingPet(false)}
                  aria-label="Cancel rename"
                  className="w-7 h-7 bg-slate-200 text-slate-700 rounded flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1">
                <h1 className="font-display text-sm text-slate-900">
                  {profile.activePetName}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setPetNameInput(profile.activePetName);
                    setIsRenamingPet(true);
                  }}
                  aria-label="Rename pet"
                  title="Rename pet"
                  className="w-6 h-6 text-slate-500 hover:text-slate-900 flex items-center justify-center"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Heart & Mood Vitals (Same font-display as Coin & Streak numbers) */}
            <div className="flex items-center gap-3 pl-3 border-l-2 border-slate-200 font-display text-sm">
              <span
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                  profile.petHealth <= 25
                    ? 'bg-rose-500 text-white'
                    : profile.petHealth <= 50
                    ? 'bg-orange-200 text-rose-900'
                    : profile.petHealth <= 75
                    ? 'bg-amber-100 text-amber-900'
                    : 'text-rose-500'
                }`}
              >
                <Heart className="w-4 h-4 fill-current shrink-0" />
                <span>{profile.petHealth}%</span>
              </span>

              {/* Clicking Mood % toggles the 7-Day Happiness Trend Recharts Chart in the Pet Info area */}
              <button
                type="button"
                onClick={() => setShowMoodChartPopover((prev) => !prev)}
                title="View 7-Day Pet Happiness Trend"
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                  showMoodChartPopover
                    ? 'bg-amber-200 text-slate-950'
                    : 'text-amber-500 hover:bg-amber-50'
                }`}
              >
                <Smile className="w-4 h-4 shrink-0" />
                <span>{profile.petHappiness}%</span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-700 ml-0.5" />
              </button>
            </div>
          </div>

          {/* Unified MY PROFILE Button */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            title="Open My Profile & Settings"
            className="h-10 px-3 bg-white hover:bg-emerald-50 text-slate-900 pixel-btn flex items-center gap-1.5"
          >
            <User className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-display text-xs">MY PROFILE</span>
          </button>
        </div>

        {/* Row 2: Equal-Sized Coin Box & Streak Box + LV X Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Standalone Gold Currency Display Badge (Display-only, modal click removed) */}
          <div
            id="tutorial-currency"
            className="h-10 px-3.5 bg-[#FFFBEB] pixel-box inline-flex items-center justify-center gap-2 select-none whitespace-nowrap"
          >
            <PixelCoinIcon size={18} className="shrink-0" />
            <span className="font-display text-sm text-slate-950 flex items-center whitespace-nowrap">
              {profile.gold}
            </span>
          </div>

          {/* Streak Count Display Badge (Display-only, modal click removed) */}
          <div
            className={`h-10 px-3.5 pixel-box inline-flex items-center justify-center gap-2 select-none whitespace-nowrap ${
              readyStreakAchievements.length > 0
                ? 'bg-amber-300 text-slate-950'
                : 'bg-orange-100 text-orange-950'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-500 fill-current shrink-0" />
            <span className="font-display text-sm flex items-center whitespace-nowrap">
              {profile.streakDays}D
            </span>
            <span className="px-1.5 py-0.5 bg-white/90 border border-[#3B4254] font-pixel text-base font-bold text-slate-900 flex items-center whitespace-nowrap">
              x{streakMultiplier.toFixed(2)} XP
            </span>
          </div>

          {/* Desktop LV X Progress Pill (Matched to h-10 for pixel-perfect vertical alignment) */}
          <button
            type="button"
            onClick={() => setShowMaxPetsModal(true)}
            title="LV Progress & My Pets"
            className="hidden md:flex h-10 bg-white hover:bg-emerald-50 pixel-box px-3.5 items-center gap-2.5"
          >
            <span className="px-2 py-0.5 bg-emerald-300 border border-[#3B4254] font-display text-xs text-slate-950 flex items-center">
              LV {userDisciplineInfo.level}
            </span>
            <div className="w-24 h-3 bg-slate-200 border border-[#3B4254] overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${userDisciplineInfo.progressPct}%` }}
              />
            </div>
            <span className="font-pixel text-lg font-bold text-slate-700 flex items-center">
              {userDisciplineInfo.intoLevelXp}/
              {userDisciplineInfo.requiredForNextLevelXp} XP
            </span>
          </button>
        </div>

        {/* Pet Information Area: 7-Day Pet Happiness Trend Recharts Popover */}
        {showMoodChartPopover && (
          <HappinessTrendChart
            history={profile.happinessHistory}
            currentHappiness={profile.petHappiness}
            petName={profile.activePetName}
            createdAtIso={profile.createdAtIso}
            compact={true}
            onClose={() => setShowMoodChartPopover(false)}
          />
        )}
      </div>

      {/* Timer Task Auto-Reward Toast Banner */}
      {timerRewardToast && (
        <div className="fixed top-24 sm:top-20 left-1/2 -translate-x-1/2 z-40 bg-emerald-400 text-slate-950 pixel-box px-4 py-3 flex items-center gap-3">
          <Timer className="w-5 h-5 shrink-0" />
          <div className="font-pixel text-xl font-bold flex items-center gap-1.5">
            <span>
              TIMER FINISHED: “{timerRewardToast.taskTitle}” (+
              {timerRewardToast.xpEarned} XP,
            </span>
            <span className="inline-flex items-center gap-1">
              <PixelCoinIcon size={16} />+{timerRewardToast.goldEarned})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTimerRewardToast(null)}
            className="px-2.5 py-1 bg-white text-slate-900 font-display text-[10px] pixel-box-sm"
          >
            OK
          </button>
        </div>
      )}

      {/* Daily Quests Trigger (PC) & Centered Quests Modal (Mobile + PC) */}
      <FloatingTasksDrawer
        profile={profile}
        species={activeSpecies}
        tasks={tasks}
        isOpen={showQuestsModal}
        onOpenChange={setShowQuestsModal}
        latestPenalty={latestPenalty}
        onDismissPenalty={() => setLatestPenalty(null)}
        onCreateTask={handleCreateTask}
        onStartTaskTimer={handleStartTaskTimer}
        onPauseTaskTimer={handlePauseTaskTimer}
        onResumeTaskTimer={handleResumeTaskTimer}
        onAttemptCompleteTask={handleAttemptCompleteTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Evolution Celebration Banner */}
      {evolutionBanner && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md bg-white pixel-box p-6 text-center">
          <div className="inline-block px-3 py-1 bg-amber-300 pixel-box-sm font-display text-xs text-slate-950 mb-3">
            EVOLUTION UNLOCKED!
          </div>
          <h2 className="font-display text-sm sm:text-base text-slate-900 mb-2">
            {profile.activePetName} EVOLVED INTO{' '}
            {evolutionBanner.newStage.toUpperCase()}!
          </h2>
          <button
            type="button"
            onClick={() => setEvolutionBanner(null)}
            className="w-full py-2.5 mt-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display text-xs pixel-btn"
          >
            AWESOME!
          </button>
        </div>
      )}

      {/* Responsive Bottom Game Dock (3 Equal Buttons: My Pets, Achievements, Shop) */}
      <div
        id="tutorial-navbar"
        className="fixed bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[calc(100vw-1.25rem)] max-w-lg"
      >
        <div className="bg-white pixel-box p-1.5 sm:p-2 grid grid-cols-3 gap-1.5 sm:gap-2">
          {/* 1. MY PETS Button */}
          <button
            id="tutorial-mypets-btn"
            type="button"
            onClick={() => setShowMaxPetsModal(true)}
            className="py-2 sm:py-2.5 px-2 bg-emerald-200 hover:bg-emerald-300 text-slate-950 pixel-btn flex flex-col items-center justify-center gap-1"
          >
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-display text-[10px] sm:text-xs whitespace-nowrap">
              MY PETS
            </span>
          </button>

          {/* 2. Unified Achievements & Rewards Button */}
          <button
            type="button"
            onClick={() => setShowAchievementsModal(true)}
            className={`py-2 sm:py-2.5 px-2 pixel-btn flex flex-col items-center justify-center gap-1 ${
              readyAchievements.length > 0
                ? 'bg-amber-300 hover:bg-amber-200 text-slate-950 anim-crate-rattle'
                : 'bg-orange-100 hover:bg-orange-200 text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-display text-[10px] sm:text-xs whitespace-nowrap">
              ACHIEVE
            </span>
          </button>

          {/* 3. Shop Button */}
          <button
            type="button"
            onClick={() => {
              setStoreInitialTab('pets');
              setStoreInitialSlot('all');
              setShowStoreModal(true);
            }}
            className="py-2 sm:py-2.5 px-2 bg-purple-200 hover:bg-purple-300 text-slate-900 pixel-btn flex flex-col items-center justify-center gap-1"
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-display text-[10px] sm:text-xs whitespace-nowrap">
              SHOP
            </span>
          </button>
        </div>
      </div>

      {/* Unified My Profile Modal (LV X, Pet Info, 7-Day Happiness Recharts, Audio, Sign Out) */}
      {showProfileModal && (
        <UserProfileModal
          profile={profile}
          species={activeSpecies}
          soundMuted={soundMuted}
          onToggleSound={handleToggleSound}
          onRenamePet={handleDirectRenamePet}
          onUpdateUsername={handleUpdateUsername}
          onSignOut={() => {
            setShowProfileModal(false);
            handleSignOut();
          }}
          onStartTutorial={() => {
            setShowProfileModal(false);
            setShowTutorialOverlay(true);
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Interactive 6-Step Step-by-Step Tutorial Overlay */}
      {showTutorialOverlay && (
        <TutorialGuideOverlay
          onClose={handleFinishTutorial}
          onOpenQuests={() => setShowQuestsModal(true)}
          onOpenShop={() => {
            setStoreInitialTab('pets');
            setStoreInitialSlot('all');
            setShowStoreModal(true);
          }}
          onOpenMyPets={() => setShowMaxPetsModal(true)}
        />
      )}

      {/* My Pets (Owned & Fully Grown) Modal */}
      {showMaxPetsModal && (
        <MaxLevelPetsModal
          profile={profile}
          onSelectSpecies={handleBuyOrSelectSpecies}
          onOpenShop={() => {
            setStoreInitialTab('pets');
            setStoreInitialSlot('all');
            setShowStoreModal(true);
          }}
          onClose={() => setShowMaxPetsModal(false)}
        />
      )}

      {/* Unified Achievements & Milestone Rewards Modal */}
      {showAchievementsModal && (
        <AchievementsModal
          profile={profile}
          onClaimAchievement={handleClaimAchievement}
          onPlaceExclusiveDecor={handleBuyOrPlaceDecor}
          onClose={() => setShowAchievementsModal(false)}
        />
      )}

      {/* Pet & Room Decoration Shop Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-5">
          <div
            style={{ background: activeSpecies.theme.bgGradientCss }}
            className="w-full max-w-5xl max-h-[92dvh] pixel-box overflow-hidden flex flex-col"
          >
            <div className="px-5 py-4 bg-white text-slate-900 border-b-2 border-[#3B4254] flex items-center justify-between">
              <div>
                <div className="font-display text-sm sm:text-base text-slate-900">
                  SHOP
                </div>
                <div className="font-pixel text-xs sm:text-sm text-amber-800 font-bold">
                  Applies to whole system once pet reaches Adult stage (2,800 XP)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStoreModal(false)}
                className="px-4 py-2 bg-rose-400 hover:bg-rose-300 text-slate-950 font-display text-xs pixel-btn flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>CLOSE</span>
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <PetStoreView
                profile={profile}
                initialTab={storeInitialTab}
                initialSlotFilter={storeInitialSlot}
                onBuyOrSelectSpecies={(sp) => {
                  handleBuyOrSelectSpecies(sp);
                  setShowStoreModal(false);
                }}
                onBuyOrPlaceDecor={(item) => {
                  handleBuyOrPlaceDecor(item);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Wall & Floor Decor Placement Modal (Opened by + icons or placed decor) */}
      {selectedDecorSlotForPlacement && (
        <DecorPlacementModal
          slot={selectedDecorSlotForPlacement}
          profile={profile}
          onPlaceDecor={handlePlaceDecorItem}
          onClearSlot={handleClearDecorSlot}
          onOpenShop={(slot) => {
            setSelectedDecorSlotForPlacement(null);
            setStoreInitialTab('decor');
            setStoreInitialSlot(slot);
            setShowStoreModal(true);
          }}
          onClose={() => setSelectedDecorSlotForPlacement(null)}
        />
      )}
    </div>
  );
}
