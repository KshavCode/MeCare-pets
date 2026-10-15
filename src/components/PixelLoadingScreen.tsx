import React from 'react';
import { PetAvatarSvg } from './PetAvatarSvg';

interface PixelLoadingScreenProps {
  progress: number;
  statusText?: string;
}

const TOTAL_PIXEL_BLOCKS = 12;

export const PixelLoadingScreen: React.FC<PixelLoadingScreenProps> = ({
  progress,
  statusText,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));
  const filledBlocks = Math.round((clamped / 100) * TOTAL_PIXEL_BLOCKS);

  const label =
    statusText ||
    (clamped < 30
      ? 'INITIALIZING PIXEL ENGINE...'
      : clamped < 65
      ? 'VERIFYING TRAINER SESSION...'
      : clamped < 95
      ? 'SYNCING SANCTUARY DATA...'
      : 'SANCTUARY READY!');

  return (
    <div className="fixed inset-0 z-50 w-screen h-dvh bg-[#FAF6F0] flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white pixel-box p-6 flex flex-col items-center text-center space-y-5">
        {/* 8-Bit Companion Sprite */}
        <div className="relative flex flex-col items-center justify-end pt-2">
          <div className="-mb-1">
            <PetAvatarSvg
              speciesId="common_dog"
              stage="kid"
              mood="happy"
              health={100}
              size={136}
            />
          </div>
          <div className="w-32 h-3.5 bg-[#EFE8DD] pixel-box-sm" />
        </div>

        {/* Game Title */}
        <div className="space-y-1">
          <h1 className="font-display text-base sm:text-lg text-slate-900 tracking-wide">
            EVOQUEST
          </h1>
          <p className="font-pixel text-lg font-bold text-slate-600">
            8-BIT COMPANION HABIT RPG
          </p>
        </div>

        {/* Segmented 8-Bit Pixelized Progress Bar */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between font-display text-[9px] text-slate-800">
            <span className="truncate pr-2">{label}</span>
            <span>{clamped}%</span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full p-1.5 bg-[#EFE8DD] border-4 border-[#3B4254] grid grid-cols-12 gap-1"
          >
            {Array.from({ length: TOTAL_PIXEL_BLOCKS }).map((_, idx) => {
              const isFilled = idx < filledBlocks;
              return (
                <div
                  key={idx}
                  className={`h-5 border border-[#3B4254] transition-colors duration-75 ${
                    isFilled
                      ? idx >= TOTAL_PIXEL_BLOCKS - 2
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                      : 'bg-white/60'
                  }`}
                >
                  {isFilled && (
                    <div className="w-full h-1.5 bg-white/45" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
