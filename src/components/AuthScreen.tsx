import React, { useState } from 'react';
import {
  Pencil,
  ShieldCheck,
  KeyRound,
  UserPlus,
  LogIn,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { NEW_USER_FOCUS_TRACKS, PET_SPECIES_MAP } from '../data/petSpecies';
import { Pet3DScene } from './Pet3DScene';

interface AuthScreenProps {
  onLoginSuccess: (params: {
    username: string;
    password?: string;
    isNewUser: boolean;
    initialPetName?: string;
    focusTrackId?: string;
    useGoogleAuth?: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [petNickname, setPetNickname] = useState('Buddy');
  const [isEditingPetName, setIsEditingPetName] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('balanced');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeSpecies = PET_SPECIES_MAP['common_dog'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUser = username.trim();
    if (cleanUser.length < 3) {
      setErrorMsg('Please enter a valid username or email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (petNickname.trim().length < 1 || petNickname.trim().length > 28) {
        setErrorMsg('Companion name must be between 1 and 28 characters.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await onLoginSuccess({
        username: cleanUser,
        password,
        isNewUser: mode === 'register',
        initialPetName: petNickname.trim() || 'Buddy',
        focusTrackId: selectedTrackId,
      });
      if (!res.ok && res.error) {
        setErrorMsg(res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateGoogleAuth = (customChosenName?: string) => {
    const candidate = (customChosenName || username).trim();
    executeGoogleLogin(candidate);
  };

  const executeGoogleLogin = async (candidateUser: string) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await onLoginSuccess({
        username: candidateUser,
        isNewUser: mode === 'register',
        initialPetName: petNickname.trim() || 'Buddy',
        focusTrackId: selectedTrackId,
        useGoogleAuth: true,
      });
      if (!res.ok && res.error) {
        const lower = res.error.toLowerCase();
        if (
          !lower.includes('popup') &&
          !lower.includes('cancel') &&
          !lower.includes('closed')
        ) {
          setErrorMsg(res.error);
        }
      }
    } catch {
      // User dismissed or closed window
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{ background: activeSpecies.theme.bgGradientCss }}
      className="relative w-screen h-dvh overflow-hidden text-slate-800 select-none"
    >
      {/* Left Interactive 8-Bit Companion Stage (Desktop) */}
      <div className="hidden lg:block absolute inset-0 right-[440px] z-0">
        <Pet3DScene speciesId="common_dog" stage="kid" mood="idle" />

        <div className="pointer-events-none absolute top-5 left-5 z-10 max-w-md bg-[#FFFDF9] p-4 pixel-box">
          <h1 className="font-display text-base text-slate-900">
            MECARE: PETS TO-DO LIST
          </h1>
          <p className="font-pixel text-lg font-bold text-slate-600 mt-1">
            Complete daily quests to evolve your companion and unlock milestone
            rewards.
          </p>
        </div>
      </div>

      {/* Right Login / New Player Card */}
      <div className="relative z-20 h-full w-full lg:w-[440px] lg:ml-auto p-4 sm:p-6 flex items-center justify-center">
        <div className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[#FFFDF9] pixel-box p-5">
          <div className="mb-4 pb-3 border-b border-slate-300">
            <div className="font-display text-xs sm:text-sm text-slate-900">
              TRAINER PORTAL
            </div>
            <div className="font-pixel text-lg font-bold text-slate-600">
              Sign in to access your companion sanctuary
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 font-display text-[10px] pixel-btn flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-[#F5EBD6] text-slate-900'
                  : 'bg-white text-slate-600'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>SIGN IN</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 font-display text-[10px] pixel-btn flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-[#DCECE2] text-slate-900'
                  : 'bg-white text-slate-600'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>NEW PLAYER</span>
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mb-3.5 p-2.5 bg-[#F6E4E7] border border-[#3B4254] flex items-start gap-2 font-pixel text-base font-bold text-[#8F394A]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Google Authentication */}
          <button
            type="button"
            onClick={() => initiateGoogleAuth()}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 mb-3.5 bg-amber-300 hover:bg-amber-200 text-slate-950 font-display text-[10px] pixel-btn flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span>CONTINUE WITH GOOGLE</span>
          </button>

          <div className="relative flex py-1.5 items-center mb-3">
            <div className="flex-grow border-t border-slate-300" />
            <span className="shrink-0 mx-3 font-display text-[8px] text-slate-500">
              OR ACCOUNT CREDENTIALS
            </span>
            <div className="flex-grow border-t border-slate-300" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="auth-username"
                className="block font-display text-[9px] text-slate-700 mb-1"
              >
                USERNAME OR EMAIL
              </label>
              <input
                id="auth-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. pixel_hero"
                className="w-full px-3 py-2 bg-white border-2 border-[#3B4254] text-slate-800 font-pixel text-lg focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block font-display text-[9px] text-slate-700 mb-1"
              >
                PASSWORD
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-3 pr-10 py-2 bg-white border-2 border-[#3B4254] text-slate-800 font-pixel text-lg focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="Toggle password visibility"
                  className="absolute right-1 top-1 bottom-1 px-2.5 flex items-center justify-center text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label
                    htmlFor="auth-confirm-password"
                    className="block font-display text-[9px] text-slate-700 mb-1"
                  >
                    CONFIRM PASSWORD
                  </label>
                  <input
                    id="auth-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 bg-white border-2 border-[#3B4254] text-slate-800 font-pixel text-lg focus:outline-none"
                  />
                </div>

                {/* Name Your Pet with Pencil Icon */}
                <div className="pt-2 border-t border-slate-300">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-[9px] text-slate-700">
                      NAME YOUR PIXEL PET
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingPetName((prev) => !prev)}
                      className="inline-flex items-center gap-1 font-pixel text-sm font-bold text-[#B86B43]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{isEditingPetName ? 'Save' : 'Edit'}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={28}
                      value={petNickname}
                      readOnly={!isEditingPetName}
                      onChange={(e) => setPetNickname(e.target.value)}
                      onClick={() => setIsEditingPetName(true)}
                      className="w-full px-3 py-1.5 bg-white border-2 border-[#3B4254] text-slate-800 font-pixel text-lg font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingPetName((prev) => !prev)}
                      aria-label="Edit pet name with pencil"
                      className="w-9 h-9 bg-[#F5EBD6] text-slate-800 pixel-btn flex items-center justify-center shrink-0"
                    >
                      {isEditingPetName ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Pencil className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-display text-[9px] text-slate-700 mb-1.5">
                    STARTER QUEST PACK
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {NEW_USER_FOCUS_TRACKS.map((track) => {
                      const isSel = selectedTrackId === track.id;
                      return (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => setSelectedTrackId(track.id)}
                          className={`text-left px-3 py-1.5 border border-[#3B4254] font-pixel text-base flex items-center justify-between ${
                            isSel
                              ? 'bg-[#F5EBD6] text-slate-900 font-bold'
                              : 'bg-white text-slate-600 hover:bg-[#FAF6F0]'
                          }`}
                        >
                          <span>{track.name}</span>
                          <span className="font-display text-[8px]">
                            {isSel ? 'SELECTED' : 'PICK'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#DCECE2] hover:bg-[#CBE3D4] text-slate-900 font-display text-[10px] pixel-btn flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'AUTHENTICATING...'
                  : mode === 'login'
                  ? 'SIGN IN'
                  : 'CREATE ACCOUNT'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
