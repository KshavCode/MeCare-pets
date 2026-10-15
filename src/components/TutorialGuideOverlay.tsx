import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart,
  Smile,
  CheckSquare,
  Sparkles,
  Award,
  ChevronRight,
  ChevronLeft,
  X,
  Compass,
  Palette,
  Check,
  Flame,
} from 'lucide-react';
import { PixelCoinIcon } from './PixelCoinIcon';

interface TutorialGuideOverlayProps {
  onClose: () => void;
  onOpenQuests?: () => void;
  onOpenShop?: () => void;
  onOpenMyPets?: () => void;
}

interface StepBullet {
  label: string;
  desc: string;
  icon: React.ReactNode;
}

interface TutorialStep {
  stepNumber: number;
  totalSteps: number;
  badge: string;
  title: string;
  targetId:
    | 'vitals'
    | 'quests'
    | 'currency'
    | 'navbar'
    | 'background'
    | 'decor'
    | 'mypets';
  elementSelectors: string[];
  bullets: StepBullet[];
}

const TOTAL_STEPS = 6;

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    stepNumber: 1,
    totalSteps: TOTAL_STEPS,
    badge: '1 / 6',
    title: 'Pet & Vitals',
    targetId: 'vitals',
    elementSelectors: ['tutorial-vitals', 'tutorial-vitals-mobile', 'tutorial-pet-stage'],
    bullets: [
      {
        icon: <Heart className="w-4 h-4 text-rose-500 fill-current shrink-0" />,
        label: 'Heart (HP)',
        desc: 'Drops on missed days. Restored by finishing verified daily tasks.',
      },
      {
        icon: <Smile className="w-4 h-4 text-amber-500 fill-current shrink-0" />,
        label: 'Mood & Gestures',
        desc: 'Pet or swipe your companion to cheer them up. Tap Mood % for trend.',
      },
    ],
  },
  {
    stepNumber: 2,
    totalSteps: TOTAL_STEPS,
    badge: '2 / 6',
    title: 'Quests & Habits',
    targetId: 'quests',
    elementSelectors: ['tutorial-quests', 'tutorial-quests-mobile'],
    bullets: [
      {
        icon: <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />,
        label: 'Create Tasks',
        desc: 'Add to-dos across Vitality, Intellect, and Discipline tracks.',
      },
      {
        icon: <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />,
        label: 'Evolution XP',
        desc: 'Completing quests levels up your pet, raises Discipline LV, and gives Gold.',
      },
    ],
  },
  {
    stepNumber: 3,
    totalSteps: TOTAL_STEPS,
    badge: '3 / 6',
    title: 'Gold Currency',
    targetId: 'currency',
    elementSelectors: ['tutorial-currency', 'tutorial-currency-mobile'],
    bullets: [
      {
        icon: <PixelCoinIcon size={16} className="shrink-0" />,
        label: 'Earn Coins',
        desc: 'Earned from finishing verified quests and maintaining daily streaks.',
      },
      {
        icon: <Award className="w-4 h-4 text-purple-600 shrink-0" />,
        label: 'Sanctuary Shop',
        desc: 'Spend Gold in the shop to adopt new companion species and buy decor.',
      },
    ],
  },
  {
    stepNumber: 4,
    totalSteps: TOTAL_STEPS,
    badge: '4 / 6',
    title: 'Navigation Dock',
    targetId: 'navbar',
    elementSelectors: ['tutorial-navbar'],
    bullets: [
      {
        icon: <Award className="w-4 h-4 text-emerald-600 shrink-0" />,
        label: 'MY PETS',
        desc: 'Switch active companions, inspect Trainer LV, and review adult bonuses.',
      },
      {
        icon: <Flame className="w-4 h-4 text-orange-500 fill-current shrink-0" />,
        label: 'ACHIEVE',
        desc: 'Track habit streak milestones and claim exclusive trophies.',
      },
      {
        icon: <Compass className="w-4 h-4 text-sky-600 shrink-0" />,
        label: 'SHOP',
        desc: 'Adopt companions across 6 rarities and purchase room furnishings.',
      },
    ],
  },
  {
    stepNumber: 5,
    totalSteps: TOTAL_STEPS,
    badge: '5 / 6',
    title: 'Sanctuary Decor Slots',
    targetId: 'decor',
    elementSelectors: [
      'tutorial-decor-wall-right',
      'tutorial-decor-floor-right',
      'tutorial-decor-floor-left',
    ],
    bullets: [
      {
        icon: <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />,
        label: 'Decor Slots',
        desc: 'Tap the dashed "+" spots on your wall or floor to view owned decor and place items.',
      },
      {
        icon: <Palette className="w-4 h-4 text-emerald-600 shrink-0" />,
        label: 'Collect Furnishings',
        desc: 'Unlock banners, plushies, and books in the Shop or as milestone quest rewards.',
      },
    ],
  },
  {
    stepNumber: 6,
    totalSteps: TOTAL_STEPS,
    badge: '6 / 6',
    title: 'Adult Evolution Perks',
    targetId: 'mypets',
    elementSelectors: ['tutorial-mypets-btn', 'tutorial-navbar'],
    bullets: [
      {
        icon: <Award className="w-4 h-4 text-purple-600 shrink-0" />,
        label: 'Full Adulthood',
        desc: 'Pets evolve through 4 stages and reach adult maturity at 2,800 XP.',
      },
      {
        icon: <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />,
        label: 'System Bonuses',
        desc: 'Each adult pet grants permanent stacking bonuses (+% Gold, +% XP) to your whole account!',
      },
    ],
  },
];

export const TutorialGuideOverlay: React.FC<TutorialGuideOverlayProps> = ({
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TUTORIAL_STEPS[currentStepIndex];

  // Dynamically compute the exact bounding box of the active target element
  // Works reliably even for position:fixed elements where offsetParent is null
  const measureTarget = useCallback(() => {
    let matchedRect: DOMRect | null = null;
    for (const selector of step.elementSelectors) {
      const el = document.getElementById(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          matchedRect = rect;
          break;
        }
      }
    }
    setTargetRect(matchedRect);
  }, [step]);

  useEffect(() => {
    measureTarget();
    const handleResize = () => measureTarget();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    const timer = window.setTimeout(measureTarget, 60);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
      window.clearTimeout(timer);
    };
  }, [measureTarget, currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Determine card placement so it never covers the spotlighted target:
  // If target is in the lower half (e.g. navbar at bottom), dock card at top (top: 16px)
  // If target is in the upper half (e.g. vitals/quests/coins at top), dock card at bottom (bottom: 16px)
  const isTargetInBottomHalf =
    targetRect !== null && targetRect.top > window.innerHeight * 0.45;

  const cardPlacementStyle: React.CSSProperties = isTargetInBottomHalf
    ? {
        position: 'fixed',
        left: '50%',
        top: '16px',
        transform: 'translateX(-50%)',
      }
    : {
        position: 'fixed',
        left: '50%',
        bottom: '16px',
        transform: 'translateX(-50%)',
      };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none">
      {/* 1. Dynamic Aperture Cutout Spotlight */}
      {targetRect ? (
        <div
          className="pointer-events-none fixed z-40 transition-all duration-300 rounded-lg border-2 border-amber-400"
          style={{
            top: `${Math.max(2, targetRect.top - 6)}px`,
            left: `${Math.max(2, targetRect.left - 6)}px`,
            width: `${Math.min(window.innerWidth - 4, targetRect.width + 12)}px`,
            height: `${targetRect.height + 12}px`,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.48)',
          }}
        >
          {/* Animated pulsing highlight border */}
          <div className="absolute -inset-1 border-2 border-amber-300/80 rounded-lg animate-pulse" />
        </div>
      ) : (
        <div
          className="pointer-events-none fixed inset-0 z-40 transition-opacity duration-300"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.48)' }}
        />
      )}

      {/* 2. Compact, Short & Clear Dialogue Modal (Skip button inside the modal) */}
      <div
        style={cardPlacementStyle}
        className="pointer-events-auto z-50 w-[calc(100vw-1.5rem)] max-w-md transition-all duration-300"
      >
        <div className="bg-[#FAF6F0] pixel-box shadow-2xl overflow-hidden border-2 border-[#3B4254]">
          {/* Header Bar: Badge, Title & In-Modal Skip Button */}
          <div className="px-3.5 py-2.5 bg-[#EFE8DD] border-b-2 border-[#3B4254] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 bg-amber-300 pixel-box-sm font-display text-[10px] sm:text-xs text-slate-950 shrink-0">
                {step.badge}
              </span>
              <h3 className="font-display text-xs sm:text-sm text-slate-900 truncate">
                {step.title}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-2 py-1 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-900 font-display text-[10px] sm:text-xs pixel-box-sm flex items-center gap-1 transition-colors shrink-0"
              title="Skip Tutorial"
            >
              <X className="w-3.5 h-3.5 text-rose-500" />
              <span>SKIP</span>
            </button>
          </div>

          {/* Dialogue Body: Readable, legible font size with concise text */}
          <div className="p-3 space-y-2">
            {step.bullets.map((b, i) => (
              <div
                key={i}
                className="p-2 sm:p-2.5 bg-white border border-[#3B4254]/30 rounded flex items-start gap-2.5 shadow-xs"
              >
                <div className="mt-0.5 shrink-0">{b.icon}</div>
                <div className="min-w-0 flex-1 font-sans text-xs sm:text-sm leading-snug text-slate-800">
                  <strong className="font-bold text-slate-950 mr-1.5 font-sans">
                    {b.label}:
                  </strong>
                  <span>{b.desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Controls Footer */}
          <div className="px-3.5 py-2 bg-[#EFE8DD] border-t-2 border-[#3B4254] flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={currentStepIndex === 0}
              onClick={handlePrev}
              className={`px-3 py-1 font-display text-[10px] sm:text-xs pixel-btn flex items-center gap-1 ${
                currentStepIndex === 0
                  ? 'opacity-30 cursor-not-allowed bg-slate-200 text-slate-500'
                  : 'bg-white hover:bg-slate-100 text-slate-800'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREV</span>
            </button>

            {/* Step Dots indicator */}
            <div className="flex items-center gap-1.5">
              {TUTORIAL_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-2.5 h-2.5 border border-[#3B4254] transition-all ${
                    idx === currentStepIndex
                      ? 'bg-amber-400 scale-125'
                      : idx < currentStepIndex
                      ? 'bg-emerald-400'
                      : 'bg-white'
                  }`}
                  title={`Step ${idx + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="px-3.5 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display text-[10px] sm:text-xs pixel-btn flex items-center gap-1 shadow-sm"
            >
              <span>
                {currentStepIndex === TOTAL_STEPS - 1 ? 'FINISH' : 'NEXT'}
              </span>
              {currentStepIndex === TOTAL_STEPS - 1 ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
