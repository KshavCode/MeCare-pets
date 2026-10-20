import React, { useState } from 'react';
import {
  User,
  Flame,
  Heart,
  Smile,
  Volume2,
  VolumeX,
  LogOut,
  Pencil,
  Check,
  X,
  Compass,
} from 'lucide-react';
import { PetSpeciesConfig, UserProfile } from '../types/game';
import {
  getEvolutionStage,
  getStreakXpMultiplier,
  getUserDisciplineLevelInfo,
} from '../data/petSpecies';
import { HappinessTrendChart } from './HappinessTrendChart';

interface UserProfileModalProps {
  profile: UserProfile;
  species: PetSpeciesConfig;
  soundMuted: boolean;
  onToggleSound: () => void;
  onRenamePet: (newName: string) => void;
  onUpdateUsername?: (
    newUsername: string
  ) => Promise<{ ok: boolean; error?: string }> | void;
  onSignOut: () => void;
  onStartTutorial: () => void;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  profile,
  species,
  soundMuted,
  onToggleSound,
  onRenamePet,
  onUpdateUsername,
  onSignOut,
  onStartTutorial,
  onClose,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.activePetName);

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(profile.username);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);

  const xpMap = profile.petXpBySpecies || {
    [profile.activeSpeciesId]: profile.petXp,
  };
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
  const liveStage = getEvolutionStage(profile.petXp);
  const liveStageLabel = species.stages[liveStage].label;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameDraft.trim().slice(0, 28);
    if (clean) {
      onRenamePet(clean);
    }
    setIsEditingName(false);
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(null);
    const clean = usernameDraft
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 24);

    if (clean.length < 3) {
      setUsernameError('At least 3 characters required.');
      return;
    }

    if (clean === profile.username.toLowerCase()) {
      setIsEditingUsername(false);
      return;
    }

    if (onUpdateUsername) {
      setIsSavingUsername(true);
      try {
        const res = await onUpdateUsername(clean);
        if (res && !res.ok) {
          setUsernameError(res.error || 'Username already taken. Please choose another.');
          return;
        }
        setUsernameSuccess('Username updated!');
        setTimeout(() => setUsernameSuccess(null), 3000);
        setIsEditingUsername(false);
      } catch (err: unknown) {
        setUsernameError(err instanceof Error ? err.message : 'Could not change username.');
      } finally {
        setIsSavingUsername(false);
      }
    } else {
      setIsEditingUsername(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="w-full max-w-xl max-h-[90dvh] bg-[#FAF6F0] pixel-box overflow-hidden flex flex-col text-slate-900">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-[#EFE8DD] border-b-2 border-[#3B4254] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-300 pixel-box-sm flex items-center justify-center text-slate-950 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xs sm:text-sm text-slate-900">
                MY PROFILE
              </h2>
              {isEditingUsername ? (
                <div className="mt-1">
                  <form onSubmit={handleSaveUsername} className="flex items-center gap-1">
                    <span className="font-pixel text-base font-bold text-slate-600">@</span>
                    <input
                      type="text"
                      maxLength={24}
                      autoFocus
                      disabled={isSavingUsername}
                      value={usernameDraft}
                      onChange={(e) => {
                        setUsernameDraft(e.target.value);
                        if (usernameError) setUsernameError(null);
                      }}
                      className="px-1.5 py-0.5 bg-white border border-slate-700 text-slate-900 font-pixel text-sm font-bold w-32 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isSavingUsername}
                      className="w-5 h-5 bg-emerald-400 text-slate-950 border border-[#3B4254] flex items-center justify-center hover:bg-emerald-300 disabled:opacity-50"
                      title="Save unique username"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={isSavingUsername}
                      onClick={() => {
                        setIsEditingUsername(false);
                        setUsernameError(null);
                      }}
                      className="w-5 h-5 bg-slate-200 text-slate-700 border border-[#3B4254] flex items-center justify-center hover:bg-slate-300"
                      title="Cancel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </form>
                  {usernameError && (
                    <div className="text-[10px] text-rose-600 font-pixel font-bold mt-0.5 leading-tight">
                      {usernameError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="font-pixel text-sm font-bold text-slate-600">
                    @ {profile.username}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUsernameDraft(profile.username);
                      setUsernameError(null);
                      setIsEditingUsername(true);
                    }}
                    title="Change username"
                    className="w-5 h-5 text-slate-500 hover:text-slate-900 flex items-center justify-center"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  {usernameSuccess && (
                    <span className="text-[10px] text-emerald-700 font-pixel font-bold">
                      {usernameSuccess}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1 bg-rose-400 hover:bg-rose-300 text-slate-950 font-display text-xs pixel-btn flex items-center gap-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* 1. User Level & Streak XP Bonus Card */}
          <div className="p-3.5 bg-white pixel-box space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-1 bg-emerald-300 border-2 border-[#3B4254] font-display text-xs text-slate-950">
                LV {userDisciplineInfo.level}
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-orange-100 border border-[#3B4254] font-display text-[10px] text-orange-950 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-500 fill-current" />
                  <span>x{streakMultiplier.toFixed(2)} XP</span>
                </span>
                <span className="font-pixel text-xs font-bold text-slate-700">
                  {userDisciplineInfo.intoLevelXp}/
                  {userDisciplineInfo.requiredForNextLevelXp} XP
                </span>
              </div>
            </div>

            <div className="w-full h-3.5 bg-slate-200 border-2 border-[#3B4254] overflow-hidden">
              <div
                className="h-full bg-emerald-400"
                style={{ width: `${userDisciplineInfo.progressPct}%` }}
              />
            </div>
          </div>

          {/* 2. Active Companion Info & Vitals */}
          <div className="p-3.5 bg-white pixel-box space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-1 rounded font-display text-[10px] text-white uppercase"
                  style={{ backgroundColor: species.primaryColor }}
                >
                  {liveStageLabel}
                </span>

                {isEditingName ? (
                  <form
                    onSubmit={handleSaveName}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="text"
                      maxLength={28}
                      autoFocus
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      className="px-2 py-0.5 bg-white border-2 border-slate-800 text-slate-900 font-pixel text-sm font-bold w-full focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="w-6 h-6 bg-emerald-400 text-slate-950 border border-[#3B4254] flex items-center justify-center"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-xs sm:text-sm text-slate-900">
                      {profile.activePetName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNameDraft(profile.activePetName);
                        setIsEditingName(true);
                      }}
                      className="w-6 h-6 text-slate-500 hover:text-slate-900 flex items-center justify-center"
                      aria-label="Rename pet"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Heart & Mood in matching font-display */}
              <div className="flex items-center gap-3 font-display text-xs">
                <span className="text-rose-500 flex items-center gap-1">
                  <Heart className="w-4 h-4 fill-current" />
                  <span>{profile.petHealth}%</span>
                </span>
                <span className="text-amber-500 flex items-center gap-1">
                  <Smile className="w-4 h-4" />
                  <span>{profile.petHappiness}%</span>
                </span>
              </div>
            </div>
          </div>

          {/* 3. 7-Day Pet Happiness Trend (Recharts) */}
          <HappinessTrendChart
            history={profile.happinessHistory}
            currentHappiness={profile.petHappiness}
            petName={profile.activePetName}
            createdAtIso={profile.createdAtIso}
          />

          {/* 4. Interactive Step-by-Step Tutorial Access */}
          <button
            type="button"
            onClick={onStartTutorial}
            className="w-full py-2.5 px-3 bg-amber-300 hover:bg-amber-200 text-slate-950 pixel-btn flex items-center justify-center gap-2 font-display text-xs"
          >
            <Compass className="w-4 h-4 text-slate-950" />
            <span>TUTORIAL</span>
          </button>

          {/* 5. Audio & Sign Out Controls */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onToggleSound}
              className="py-2.5 px-3 bg-white hover:bg-slate-50 pixel-btn flex items-center justify-center gap-2 font-display text-xs text-slate-900"
            >
              {soundMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span>SOUND OFF</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span>SOUND ON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="py-2.5 px-3 bg-rose-100 hover:bg-rose-200 text-rose-950 pixel-btn flex items-center justify-center gap-2 font-display text-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>SIGN OUT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
