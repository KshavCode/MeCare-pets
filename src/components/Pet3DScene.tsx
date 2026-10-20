import React, { useState, useRef } from 'react';
import { EvolutionStage, PetSpeciesId, RoomSlotId } from '../types/game';
import { DEFAULT_PLACED_DECOR, PET_SPECIES_MAP } from '../data/petSpecies';
import { PetAvatarSvg, PetInteractionState } from './PetAvatarSvg';
import { RoomDecorSvg } from './RoomDecorSvg';
import { soundFX } from '../utils/sound';
import { Plus } from 'lucide-react';

interface Pet3DSceneProps {
  speciesId: PetSpeciesId;
  stage: EvolutionStage;
  mood: 'idle' | 'happy' | 'penalized';
  health?: number;
  placedDecor?: Record<RoomSlotId, string>;
  isModalOpen?: boolean;
  onOpenDecorShop?: (slot: RoomSlotId) => void;
  onInteractBonus?: (
    type:
      | 'tickle'
      | 'fall'
      | 'flip'
      | 'headpat'
      | 'dash_left'
      | 'dash_right'
      | 'crouch'
  ) => void;
}

type HabitatCategory =
  | 'savanna'
  | 'arctic'
  | 'ocean'
  | 'jungle'
  | 'celestial'
  | 'meadow';

interface HabitatThemeVisual {
  category: HabitatCategory;
  floorTint: string;
  floorTrim: string;
  rugBg: string;
  horizonPrimary: string;
  horizonSecondary: string;
}

function getSpeciesHabitatTheme(speciesId: PetSpeciesId): HabitatThemeVisual {
  const cfg = PET_SPECIES_MAP[speciesId] || PET_SPECIES_MAP['common_dog'];
  const arch = cfg.visualArchetype;

  if (cfg.rarity === 'mythic') {
    return {
      category: 'celestial',
      floorTint: 'rgba(243, 232, 255, 0.52)',
      floorTrim: '#7E22CE',
      rugBg: '#FAF5FF',
      horizonPrimary: '#A855F7',
      horizonSecondary: '#FACC15',
    };
  }

  if (
    speciesId.includes('penguin') ||
    speciesId.includes('polar') ||
    speciesId.includes('snow') ||
    speciesId.includes('wolf') ||
    speciesId.includes('husky') ||
    speciesId.includes('eagle')
  ) {
    return {
      category: 'arctic',
      floorTint: 'rgba(224, 242, 254, 0.58)',
      floorTrim: '#0369A1',
      rugBg: '#F0F9FF',
      horizonPrimary: '#E0F2FE',
      horizonSecondary: '#7DD3FC',
    };
  }

  if (
    arch === 'aquatic' ||
    arch === 'waterfowl' ||
    speciesId.includes('dolphin') ||
    speciesId.includes('orca') ||
    speciesId.includes('seal') ||
    speciesId.includes('otter') ||
    speciesId.includes('turtle') ||
    speciesId.includes('platypus') ||
    speciesId.includes('hippo') ||
    speciesId.includes('flamingo')
  ) {
    return {
      category: 'ocean',
      floorTint: 'rgba(207, 250, 254, 0.52)',
      floorTrim: '#0E7490',
      rugBg: '#ECFEFF',
      horizonPrimary: '#06B6D4',
      horizonSecondary: '#0284C7',
    };
  }

  if (
    arch === 'pachyderm' ||
    arch === 'giraffe' ||
    speciesId.includes('lion') ||
    speciesId.includes('tiger') ||
    speciesId.includes('cheetah') ||
    speciesId.includes('camel') ||
    speciesId.includes('kangaroo') ||
    speciesId.includes('rhino') ||
    speciesId.includes('elephant') ||
    speciesId.includes('giraffe') ||
    speciesId.includes('zebra') ||
    speciesId.includes('komodo')
  ) {
    return {
      category: 'savanna',
      floorTint: 'rgba(254, 243, 199, 0.55)',
      floorTrim: '#B45309',
      rugBg: '#FFFBEB',
      horizonPrimary: '#F59E0B',
      horizonSecondary: '#D97706',
    };
  }

  if (
    arch === 'bear_ape' ||
    arch === 'reptile' ||
    speciesId.includes('panda') ||
    speciesId.includes('koala') ||
    speciesId.includes('gorilla') ||
    speciesId.includes('orangutan') ||
    speciesId.includes('sloth') ||
    speciesId.includes('toucan') ||
    speciesId.includes('macaw') ||
    speciesId.includes('peacock') ||
    speciesId.includes('chameleon') ||
    speciesId.includes('axolotl') ||
    speciesId.includes('frog')
  ) {
    return {
      category: 'jungle',
      floorTint: 'rgba(209, 250, 229, 0.52)',
      floorTrim: '#047857',
      rugBg: '#ECFDF5',
      horizonPrimary: '#10B981',
      horizonSecondary: '#059669',
    };
  }

  return {
    category: 'meadow',
    floorTint: 'rgba(255, 255, 255, 0.48)',
    floorTrim: '#3B4254',
    rugBg: '#FFFFFF',
    horizonPrimary: '#34D399',
    horizonSecondary: '#10B981',
  };
}

/**
 * Extra-Wide & Large Permanent Panoramic Sanctuary Window (Cannot be replaced in shop).
 * Reflects Day/Night cycle based on the user's real clock time and the active pet's Species Habitat vista!
 */
const PermanentRectangularWindow: React.FC<{
  isNight: boolean;
  habitat: HabitatThemeVisual;
}> = ({ isNight, habitat }) => {
  const skyMain = isNight ? '#1E1B4B' : '#7DD3FC';
  const skyTop = isNight ? '#0F172A' : '#38BDF8';

  return (
    <div
      title="Permanent Sanctuary Window (Follows Real Day / Night Clock)"
      className="pointer-events-none relative select-none"
    >
      <svg
        viewBox="0 0 60 30"
        shapeRendering="crispEdges"
        className="w-52 h-28 sm:w-96 sm:h-48 overflow-hidden"
      >
        {/* Outer Extra-Wide Rectangular Wood Frame */}
        <rect x={1} y={1} width={58} height={26} fill="#5C2D0C" />
        <rect x={2} y={2} width={56} height={24} fill="#8B4513" />

        {/* Panoramic Sky Backdrop */}
        <rect x={3} y={3} width={54} height={22} fill={skyMain} />
        <rect x={3} y={3} width={54} height={6} fill={skyTop} />

        {/* Celestial Body: Sun or Crescent Moon & Stars */}
        {isNight ? (
          <g>
            {/* Glowing Pixel Crescent Moon */}
            <rect x={9} y={5} width={5} height={5} fill="#FEF08A" />
            <rect x={11} y={5} width={3} height={4} fill={skyTop} />
            {/* Twinkling Pixel Stars Across Wide Sky */}
            <rect x={21} y={5} width={1} height={1} fill="#FFFFFF" />
            <rect x={29} y={7} width={1} height={1} fill="#FDE047" />
            <rect x={37} y={5} width={1} height={1} fill="#FFFFFF" />
            <rect x={44} y={8} width={1} height={1} fill="#BAE6FD" />
            <rect x={51} y={6} width={1} height={1} fill="#FDE047" />
          </g>
        ) : (
          <g>
            {/* Golden Pixel Sun */}
            <rect x={8} y={5} width={5} height={5} fill="#FACC15" />
            <rect x={9} y={6} width={3} height={3} fill="#FEF08A" />
            {/* Fluffy White Day Clouds */}
            <rect x={20} y={6} width={9} height={2} fill="#FFFFFF" />
            <rect x={22} y={5} width={5} height={1} fill="#FFFFFF" />
            <rect x={36} y={7} width={8} height={2} fill="#E0F2FE" />
            <rect x={47} y={5} width={7} height={2} fill="#FFFFFF" />
          </g>
        )}

        {/* Species Habitat Horizon Landscape */}
        {habitat.category === 'savanna' && (
          <g>
            <rect x={3} y={19} width={54} height={6} fill={habitat.horizonPrimary} />
            <rect x={20} y={18} width={37} height={2} fill={habitat.horizonSecondary} />
            {/* Flat-Topped Acacia Silhouettes */}
            <rect x={24} y={13} width={1} height={6} fill="#451A03" />
            <rect x={20} y={12} width={9} height={2} fill="#15803D" />
            <rect x={46} y={14} width={1} height={5} fill="#451A03" />
            <rect x={43} y={13} width={7} height={2} fill="#15803D" />
          </g>
        )}

        {habitat.category === 'arctic' && (
          <g>
            <rect x={6} y={14} width={11} height={10} fill="#94A3B8" />
            <rect x={9} y={12} width={5} height={3} fill="#FFFFFF" />
            <rect x={24} y={13} width={13} height={11} fill="#64748B" />
            <rect x={28} y={10} width={5} height={3} fill="#FFFFFF" />
            <rect x={42} y={15} width={11} height={9} fill="#94A3B8" />
            <rect x={45} y={13} width={5} height={3} fill="#FFFFFF" />
            <rect x={3} y={20} width={54} height={5} fill={habitat.horizonPrimary} />
          </g>
        )}

        {habitat.category === 'ocean' && (
          <g>
            <rect x={38} y={16} width={12} height={4} fill="#FDE047" />
            <rect x={43} y={12} width={1} height={4} fill="#78350F" />
            <rect x={40} y={11} width={7} height={2} fill="#10B981" />
            <rect x={3} y={19} width={54} height={6} fill={habitat.horizonSecondary} />
            <rect x={7} y={20} width={7} height={1} fill="#BAE6FD" />
            <rect x={22} y={22} width={8} height={1} fill="#BAE6FD" />
            <rect x={39} y={21} width={8} height={1} fill="#BAE6FD" />
          </g>
        )}

        {habitat.category === 'jungle' && (
          <g>
            <rect x={3} y={18} width={54} height={7} fill={habitat.horizonSecondary} />
            <rect x={3} y={20} width={54} height={5} fill={habitat.horizonPrimary} />
            <rect x={9} y={9} width={1} height={15} fill="#065F46" />
            <rect x={13} y={11} width={1} height={13} fill="#047857" />
            <rect x={34} y={10} width={1} height={14} fill="#065F46" />
            <rect x={49} y={9} width={1} height={15} fill="#047857" />
          </g>
        )}

        {habitat.category === 'celestial' && (
          <g>
            <rect x={3} y={19} width={54} height={6} fill="#581C87" />
            <rect x={12} y={18} width={36} height={2} fill="#7E22CE" />
            <rect x={19} y={11} width={2} height={7} fill="#FACC15" />
            <rect x={35} y={12} width={2} height={6} fill="#38BDF8" />
            <rect x={47} y={10} width={2} height={8} fill="#F43F5E" />
          </g>
        )}

        {habitat.category === 'meadow' && (
          <g>
            <rect x={3} y={19} width={54} height={6} fill={habitat.horizonPrimary} />
            <rect x={22} y={18} width={35} height={3} fill={habitat.horizonSecondary} />
            <rect x={12} y={15} width={2} height={4} fill="#78350F" />
            <rect x={9} y={11} width={8} height={4} fill="#059669" />
            <rect x={44} y={15} width={2} height={4} fill="#78350F" />
            <rect x={41} y={12} width={8} height={3} fill="#10B981" />
          </g>
        )}

        {/* Wide Rectangular Window Mullions (4 Panes Wide) */}
        <rect x={16} y={3} width={1} height={22} fill="#5C2D0C" />
        <rect x={30} y={3} width={1} height={22} fill="#5C2D0C" />
        <rect x={44} y={3} width={1} height={22} fill="#5C2D0C" />
        <rect x={3} y={14} width={54} height={1} fill="#5C2D0C" />

        {/* Extra-Wide Sturdy Window Sill & Planter */}
        <rect x={0} y={26} width={60} height={3} fill="#5C2D0C" />
        <rect x={1} y={26} width={58} height={1} fill="#A0522D" />
        <rect x={8} y={24} width={2} height={2} fill="#F43F5E" />
        <rect x={29} y={24} width={2} height={2} fill="#38BDF8" />
        <rect x={50} y={24} width={2} height={2} fill="#FACC15" />
      </svg>
    </div>
  );
};

function isClockNightTime(): boolean {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 19;
}

export const Pet3DScene: React.FC<Pet3DSceneProps> = ({
  speciesId,
  stage,
  mood,
  health = 100,
  placedDecor = DEFAULT_PLACED_DECOR,
  isModalOpen = false,
  onOpenDecorShop,
  onInteractBonus,
}) => {
  const [interaction, setInteraction] = useState<PetInteractionState | null>(
    null
  );

  // Day/Night cycle based on user's real clock time (6:00 AM - 6:59 PM = Day, 7:00 PM - 5:59 AM = Night)
  const [isNight, setIsNight] = useState<boolean>(() => isClockNightTime());

  // Cursor gaze direction on the main interface (disabled while inside any modal)
  const [cursorLook, setCursorLook] = useState<{ x: -1 | 0 | 1; y: -1 | 0 | 1 }>({
    x: 0,
    y: 0,
  });

  const petContainerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const singleClickTimeoutRef = useRef<number | null>(null);
  const cooldownUntilRef = useRef<number>(0);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const didSwipeRef = useRef<boolean>(false);

  // Keep Day/Night cycle synced with the user's real clock time
  React.useEffect(() => {
    const syncClock = () => setIsNight(isClockNightTime());
    const interval = window.setInterval(syncClock, 60000);
    return () => window.clearInterval(interval);
  }, []);

  // Reset cursor look to center whenever a modal opens
  React.useEffect(() => {
    if (isModalOpen) {
      setCursorLook({ x: 0, y: 0 });
    }
  }, [isModalOpen]);

  const cryTone = health <= 50 ? 'weak' : 'happy';
  const habitat = getSpeciesHabitatTheme(speciesId);

  /**
   * Triggers a pet interaction with a strict cooldown so animations never overlap or glitch.
   */
  const triggerInteraction = (
    type: 'jump' | 'tickle' | 'fall' | 'dash_left' | 'dash_right' | 'crouch'
  ) => {
    const now = Date.now();
    if (now < cooldownUntilRef.current || interaction !== null) {
      return;
    }

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    const duration =
      type === 'fall'
        ? 1450
        : type === 'jump'
        ? 800
        : type === 'dash_left' || type === 'dash_right'
        ? 680
        : type === 'crouch'
        ? 680
        : 850;
    cooldownUntilRef.current = now + duration + 350;

    if (type === 'jump') {
      setInteraction('jump');
      soundFX.playJumpFlip();
      window.setTimeout(() => {
        soundFX.playSpeciesCry(speciesId, cryTone);
      }, 140);
      onInteractBonus?.('flip');
    } else if (type === 'dash_left') {
      setInteraction('dash_left');
      soundFX.playJumpFlip();
      window.setTimeout(() => {
        soundFX.playSpeciesCry(speciesId, cryTone);
      }, 120);
      onInteractBonus?.('dash_left');
    } else if (type === 'dash_right') {
      setInteraction('dash_right');
      soundFX.playJumpFlip();
      window.setTimeout(() => {
        soundFX.playSpeciesCry(speciesId, cryTone);
      }, 120);
      onInteractBonus?.('dash_right');
    } else if (type === 'crouch') {
      setInteraction('crouch');
      soundFX.playSpeciesCry(speciesId, cryTone);
      onInteractBonus?.('crouch');
    } else if (type === 'tickle') {
      setInteraction('tickled');
      soundFX.playSpeciesCry(speciesId, cryTone);
      onInteractBonus?.('tickle');
    } else {
      setInteraction('fallen');
      soundFX.playFallOver();
      window.setTimeout(() => {
        soundFX.playSpeciesCry(speciesId, 'weak');
      }, 220);
      onInteractBonus?.('fall');
    }

    timerRef.current = window.setTimeout(() => {
      setInteraction(null);
    }, duration);
  };

  // Detect 4-Way Swipes: Swipe Up (Jump), Swipe Down (Crouch), Swipe Left (Dash Left), Swipe Right (Dash Right)
  const detectDirectionalSwipe = (deltaX: number, deltaY: number): boolean => {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (Math.max(absX, absY) < 22) return false;

    didSwipeRef.current = true;
    pointerStartRef.current = null;
    if (singleClickTimeoutRef.current) {
      window.clearTimeout(singleClickTimeoutRef.current);
      singleClickTimeoutRef.current = null;
    }

    if (absY >= absX) {
      if (deltaY < -22) {
        triggerInteraction('jump');
      } else if (deltaY > 22) {
        triggerInteraction('crouch');
      }
    } else {
      if (deltaX < -22) {
        triggerInteraction('dash_left');
      } else if (deltaX > 22) {
        triggerInteraction('dash_right');
      }
    }
    return true;
  };

  const handlePointerDown = (e: React.PointerEvent<SVGGElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unavailable
    }
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
    };
    didSwipeRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    if (!pointerStartRef.current || didSwipeRef.current) return;
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    detectDirectionalSwipe(deltaX, deltaY);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGGElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
    if (!pointerStartRef.current) return;
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    pointerStartRef.current = null;

    if (!didSwipeRef.current) {
      detectDirectionalSwipe(deltaX, deltaY);
    }
  };

  // Single Click -> Tickle (debounced so Double Click cleanly triggers Trip & Fall)
  const handlePetClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    if (Date.now() < cooldownUntilRef.current || interaction !== null) return;

    if (singleClickTimeoutRef.current) {
      window.clearTimeout(singleClickTimeoutRef.current);
    }
    singleClickTimeoutRef.current = window.setTimeout(() => {
      triggerInteraction('tickle');
      singleClickTimeoutRef.current = null;
    }, 220);
  };

  // Double Click -> Trip & Fall
  const handlePetDoubleClick = () => {
    if (singleClickTimeoutRef.current) {
      window.clearTimeout(singleClickTimeoutRef.current);
      singleClickTimeoutRef.current = null;
    }
    triggerInteraction('fall');
  };

  // Make the pet look towards the cursor movement on the main interface (disabled inside modals)
  const handleSceneMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isModalOpen) return;
    const rect = petContainerRef.current?.getBoundingClientRect();
    const centerX = rect
      ? rect.left + rect.width / 2
      : window.innerWidth / 2;
    const centerY = rect
      ? rect.top + rect.height / 2
      : window.innerHeight * 0.65;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    const nextX: -1 | 0 | 1 = dx < -48 ? -1 : dx > 48 ? 1 : 0;
    const nextY: -1 | 0 | 1 = dy < -70 ? -1 : dy > 70 ? 1 : 0;

    setCursorLook((prev) =>
      prev.x === nextX && prev.y === nextY ? prev : { x: nextX, y: nextY }
    );
  };

  const handleSceneMouseLeave = () => {
    setCursorLook((prev) =>
      prev.x === 0 && prev.y === 0 ? prev : { x: 0, y: 0 }
    );
  };

  const activeMood: PetInteractionState =
    interaction ||
    (mood === 'penalized'
      ? 'penalized'
      : mood === 'happy'
      ? 'happy'
      : 'idle');

  const wall1Id = placedDecor.wall_1 || placedDecor.wall_right || '';
  const wall2Id = placedDecor.wall_2 || '';
  const wall3Id = placedDecor.wall_3 || '';
  const wall4Id = placedDecor.wall_4 || '';
  const floorLeftId = placedDecor.floor_left;
  const floorRightId = placedDecor.floor_right;

  return (
    <div
      onMouseMove={handleSceneMouseMove}
      onMouseLeave={handleSceneMouseLeave}
      className="relative w-full h-full flex flex-col items-center justify-end overflow-hidden select-none px-4 pb-[14vh] sm:pb-[15vh]"
    >
      {/* Subtle Night Room Lighting Overlay */}
      {isNight && (
        <div
          className="pointer-events-none absolute inset-0 bg-indigo-950/20 transition-colors duration-500"
          aria-hidden="true"
        />
      )}

      {/* Sanctuary Floor Surface (Styled by Active Species Habitat Theme) */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-[36%] border-t-4 transition-colors duration-300"
        style={{
          backgroundColor: habitat.floorTint,
          borderColor: `${habitat.floorTrim}55`,
        }}
        aria-hidden="true"
      >
        <div
          className="w-full h-3 opacity-15"
          style={{ backgroundColor: habitat.floorTrim }}
        />
      </div>

      {/* BACKGROUND ROOM DECORATION SLOTS */}
      <div
        id="tutorial-sanctuary-bg"
        className="pointer-events-none absolute inset-0 max-w-5xl mx-auto"
      >
        {/* 1. Upper-Left / Center-Left Wall: BIG & WIDE Permanent Rectangular Window */}
        <div
          id="tutorial-room-window"
          className="absolute top-[18%] sm:top-[13%] left-3 sm:left-8"
        >
          <PermanentRectangularWindow isNight={isNight} habitat={habitat} />
        </div>

        {/* 2. Right Wall Decor: 2x2 GRID (4 Wall Slots: wall_1, wall_2, wall_3, wall_4) */}
        <div
          id="tutorial-decor-wall-right"
          className="pointer-events-auto absolute top-[13%] sm:top-[10%] right-2 sm:right-6 lg:right-10 grid grid-cols-2 gap-1.5 sm:gap-2 z-10"
        >
          {(
            [
              { slot: 'wall_1' as RoomSlotId, id: wall1Id },
              { slot: 'wall_2' as RoomSlotId, id: wall2Id },
              { slot: 'wall_3' as RoomSlotId, id: wall3Id },
              { slot: 'wall_4' as RoomSlotId, id: wall4Id },
            ] as const
          ).map((item, idx) => (
            <button
              key={item.slot}
              id={`tutorial-decor-${item.slot}`}
              type="button"
              onClick={() => onOpenDecorShop?.(item.slot)}
              title="Customize Wall Decor"
              className="p-1 rounded-sm hover:scale-105 transition-transform focus:outline-none group flex flex-col items-center justify-center bg-white/35 backdrop-blur-xs border border-slate-700/25 hover:border-slate-800 shadow-xs"
            >
              {item.id ? (
                <RoomDecorSvg
                  decorId={item.id}
                  size={76}
                  className="w-11 h-11 sm:w-16 sm:h-16 lg:w-20 lg:h-20"
                />
              ) : (
                <div className="w-11 h-11 sm:w-16 sm:h-16 lg:w-20 lg:h-20 flex items-center justify-center">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-dashed border-slate-500/80 bg-white/60 flex items-center justify-center text-slate-700 shadow-xs group-hover:scale-110 group-hover:border-slate-900 group-hover:bg-white/90">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 3. Left Floor Decor (Standing on the Floor Surface) */}
        <button
          id="tutorial-decor-floor-left"
          type="button"
          onClick={() => onOpenDecorShop?.('floor_left')}
          title={floorLeftId ? 'Customize Left Floor Decor' : 'Place Left Floor Decor (+)'}
          className="pointer-events-auto absolute bottom-[20%] sm:bottom-[16%] left-2 sm:left-12 p-1 rounded hover:scale-105 transition-transform focus:outline-none group flex flex-col items-center"
        >
          {floorLeftId ? (
            <RoomDecorSvg
              decorId={floorLeftId}
              size={124}
              className="w-20 h-20 sm:w-32 sm:h-32"
            />
          ) : (
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-slate-500/80 bg-white/45 backdrop-blur-xs flex items-center justify-center text-slate-700 shadow-xs transition-all group-hover:scale-110 group-hover:border-slate-900 group-hover:bg-white/75 active:scale-95">
              <Plus className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
          )}
        </button>

        {/* 4. Right Floor Decor (Standing on the Floor Surface) */}
        <button
          id="tutorial-decor-floor-right"
          type="button"
          onClick={() => onOpenDecorShop?.('floor_right')}
          title={floorRightId ? 'Customize Right Floor Decor' : 'Place Right Floor Decor (+)'}
          className="pointer-events-auto absolute bottom-[20%] sm:bottom-[16%] right-2 sm:right-12 p-1 rounded hover:scale-105 transition-transform focus:outline-none group flex flex-col items-center"
        >
          {floorRightId ? (
            <RoomDecorSvg
              decorId={floorRightId}
              size={124}
              className="w-20 h-20 sm:w-32 sm:h-32"
            />
          ) : (
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-slate-500/80 bg-white/45 backdrop-blur-xs flex items-center justify-center text-slate-700 shadow-xs transition-all group-hover:scale-110 group-hover:border-slate-900 group-hover:bg-white/75 active:scale-95">
              <Plus className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
          )}
        </button>
      </div>

      {/* Grounded Companion Stage (Hitbox strictly restricted to the pet's painted pixels) */}
      <div
        id="tutorial-pet-stage"
        ref={petContainerRef}
        className="relative z-10 pointer-events-none flex flex-col items-center justify-end scale-90 sm:scale-100 origin-bottom"
      >
        <div className="relative z-10 pointer-events-none">
          <PetAvatarSvg
            speciesId={speciesId}
            stage={stage}
            mood={activeMood}
            health={health}
            size={268}
            cursorLook={isModalOpen ? { x: 0, y: 0 } : cursorLook}
            onPetPointerDown={handlePointerDown}
            onPetPointerMove={handlePointerMove}
            onPetPointerUp={handlePointerUp}
            onPetClick={handlePetClick}
            onPetDoubleClick={handlePetDoubleClick}
          />
        </div>
      </div>
    </div>
  );
};

interface Pet3DCardPreviewProps {
  speciesId: PetSpeciesId;
  stage?: EvolutionStage;
}

/**
 * Static Pet Image Preview for Shop Cards (No animations or shadows in Shop)
 */
export const Pet3DCardPreview: React.FC<Pet3DCardPreviewProps> = ({
  speciesId,
  stage = 'adult',
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-end select-none pb-1">
      <PetAvatarSvg
        speciesId={speciesId}
        stage={stage}
        mood="idle"
        health={100}
        size={140}
        staticPreview={true}
      />
    </div>
  );
};
