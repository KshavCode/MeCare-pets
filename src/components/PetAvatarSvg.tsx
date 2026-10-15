import React, { useState, useEffect } from 'react';
import { EvolutionStage, PetSpeciesId } from '../types/game';
import { PET_SPECIES_MAP } from '../data/petSpecies';

export type PetInteractionState =
  | 'idle'
  | 'happy'
  | 'penalized'
  | 'tickled'
  | 'fallen'
  | 'jump'
  | 'backflip'
  | 'headpat'
  | 'dash_left'
  | 'dash_right'
  | 'crouch';

export type AutonomousPose =
  | 'stand'
  | 'look_left'
  | 'look_right'
  | 'step_left'
  | 'step_right'
  | 'species_special';

interface PetAvatarSvgProps {
  speciesId: PetSpeciesId;
  stage: EvolutionStage;
  mood?: PetInteractionState;
  health?: number;
  size?: number;
  staticPreview?: boolean;
  cursorLook?: { x: -1 | 0 | 1; y: -1 | 0 | 1 };
  className?: string;
  onPetPointerDown?: (e: React.PointerEvent<SVGGElement>) => void;
  onPetPointerMove?: (e: React.PointerEvent<SVGGElement>) => void;
  onPetPointerUp?: (e: React.PointerEvent<SVGGElement>) => void;
  onPetClick?: (e: React.MouseEvent<SVGGElement>) => void;
  onPetDoubleClick?: (e: React.MouseEvent<SVGGElement>) => void;
}

interface PxProps {
  x: number;
  y: number;
  w?: number;
  h?: number;
  c: string;
}

const Px: React.FC<PxProps> = ({ x, y, w = 1, h = 1, c }) => (
  <rect x={x} y={y} width={w} height={h} fill={c} />
);

export const PetAvatarSvg: React.FC<PetAvatarSvgProps> = ({
  speciesId,
  stage,
  mood = 'idle',
  health = 100,
  size = 240,
  staticPreview = false,
  cursorLook = { x: 0, y: 0 },
  className = '',
  onPetPointerDown,
  onPetPointerMove,
  onPetPointerUp,
  onPetClick,
  onPetDoubleClick,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [autoPose] = useState<AutonomousPose>('stand');
  const [stepFoot] = useState<0 | 1>(0);
  const [fxFrame, setFxFrame] = useState<0 | 1>(0);

  const speciesCfg =
    PET_SPECIES_MAP[speciesId] || PET_SPECIES_MAP['common_dog'];
  const isMythic = speciesCfg.rarity === 'mythic';
  const isLegendary = speciesCfg.rarity === 'legendary';

  // 1. Natural Periodic Eye Blinking (disabled in Shop staticPreview)
  useEffect(() => {
    if (staticPreview) return;
    let blinkTimeout: number;
    let reopenTimeout: number;

    const scheduleNextBlink = () => {
      const delay = 3400 + Math.random() * 2800;
      blinkTimeout = window.setTimeout(() => {
        setIsBlinking(true);
        reopenTimeout = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 150);
      }, delay);
    };

    scheduleNextBlink();
    return () => {
      window.clearTimeout(blinkTimeout);
      window.clearTimeout(reopenTimeout);
    };
  }, [staticPreview]);

  // 2. Mythic Special Effect Frame Toggle (disabled in Shop staticPreview)
  useEffect(() => {
    if (staticPreview || !isMythic) return;
    const interval = window.setInterval(() => {
      setFxFrame((prev) => (prev === 0 ? 1 : 0));
    }, 550);
    return () => window.clearInterval(interval);
  }, [staticPreview, isMythic]);

  const stageScale: Record<EvolutionStage, number> = {
    baby: 0.78,
    kid: 0.9,
    teen: 1.0,
    adult: 1.12,
  };

  const animClass = (() => {
    if (staticPreview) return '';
    switch (mood) {
      case 'tickled':
      case 'happy':
      case 'headpat':
        return 'anim-pixel-tickle';
      case 'fallen':
        return 'anim-pixel-fall';
      case 'jump':
        return 'anim-pixel-jump';
      case 'backflip':
        return 'anim-pixel-flip';
      case 'dash_left':
        return 'anim-pixel-dash-left';
      case 'dash_right':
        return 'anim-pixel-dash-right';
      case 'crouch':
        return 'anim-pixel-crouch';
      case 'penalized':
        return 'anim-pixel-penalized';
      default:
        return isMythic ? 'anim-mythic-idle' : '';
    }
  })();

  const autonomousTransform = (() => {
    if (staticPreview || mood !== 'idle') return 'translate3d(0px, 0px, 0px)';
    if (cursorLook.x !== 0 || cursorLook.y !== 0) {
      const lookX = cursorLook.x * 4;
      const lookY = cursorLook.y * 2;
      return `translate3d(${lookX}px, ${lookY}px, 0px)`;
    }
    switch (autoPose) {
      case 'look_left':
        return 'translate3d(-3px, 0px, 0px)';
      case 'look_right':
        return 'translate3d(3px, 0px, 0px)';
      case 'step_left':
        return `translate3d(-8px, ${stepFoot ? -2 : 0}px, 0px)`;
      case 'step_right':
        return `translate3d(8px, ${stepFoot ? -2 : 0}px, 0px)`;
      case 'species_special':
        return 'translate3d(0px, -2px, 0px) scale(1.02)';
      default:
        return 'translate3d(0px, 0px, 0px)';
    }
  })();

  const isDizzy = !staticPreview && (mood === 'fallen' || mood === 'penalized');
  const isHappy =
    !staticPreview &&
    (mood === 'tickled' ||
      mood === 'happy' ||
      mood === 'headpat' ||
      mood === 'jump' ||
      mood === 'dash_left' ||
      mood === 'dash_right' ||
      mood === 'crouch');
  const isSpecial =
    !staticPreview && mood === 'idle' && autoPose === 'species_special';

  // Health Threshold States: <=90, <=75, <=50, <=25
  const isCritical25 = !staticPreview && health <= 25;
  const isInjured50 = !staticPreview && health > 25 && health <= 50;
  const isTired75 = !staticPreview && health > 50 && health <= 75;
  const isNormal90 = !staticPreview && health > 75 && health <= 90;

  const gazeShift =
    !staticPreview && mood === 'idle'
      ? cursorLook.x !== 0
        ? cursorLook.x
        : autoPose === 'look_left' || autoPose === 'step_left'
        ? -1
        : autoPose === 'look_right' || autoPose === 'step_right'
        ? 1
        : 0
      : 0;

  const gazeShiftY = !staticPreview && mood === 'idle' ? cursorLook.y : 0;

  /**
   * FACIAL EXPRESSIONS (Differ by Animal Family & Health Thresholds 25, 50, 75, 90)
   */
  const renderSpeciesFace = (
    lx: number,
    rx: number,
    rawY: number,
    snoutType: 'nose_dark' | 'nose_pink' | 'beak' | 'none' = 'nose_dark'
  ) => {
    const y = rawY + gazeShiftY;
    const midX = Math.round((lx + rx) / 2);

    // Threshold <= 25: Critical Exhausted Face
    if (isCritical25 && !isHappy) {
      return (
        <g>
          <Px x={lx} y={y} c="#1E293B" />
          <Px x={lx + 2} y={y} c="#1E293B" />
          <Px x={lx + 1} y={y + 1} c="#EF4444" />
          <Px x={lx} y={y + 2} c="#1E293B" />
          <Px x={lx + 2} y={y + 2} c="#1E293B" />

          <Px x={rx} y={y} c="#1E293B" />
          <Px x={rx + 2} y={y} c="#1E293B" />
          <Px x={rx + 1} y={y + 1} c="#EF4444" />
          <Px x={rx} y={y + 2} c="#1E293B" />
          <Px x={rx + 2} y={y + 2} c="#1E293B" />

          <Px x={lx - 1} y={y + 2} w={1} h={2} c="#38BDF8" />
          <Px x={rx + 3} y={y + 2} w={1} h={2} c="#38BDF8" />

          <Px x={midX - 1} y={y + 4} w={3} h={1} c="#334155" />
          <Px x={midX + 1} y={y + 3} w={3} h={1} c="#FFFFFF" />
          <Px x={midX + 4} y={y + 2} w={2} h={2} c="#EF4444" />
        </g>
      );
    }

    // Threshold <= 50: Weakened / Injured Wincing Face
    if (isInjured50 && !isHappy && !isDizzy) {
      return (
        <g>
          <Px x={lx} y={y} c="#1E293B" />
          <Px x={lx + 1} y={y + 1} w={2} h={1} c="#1E293B" />
          <Px x={lx} y={y + 2} c="#1E293B" />

          <Px x={rx + 2} y={y} c="#1E293B" />
          <Px x={rx} y={y + 1} w={2} h={1} c="#1E293B" />
          <Px x={rx + 2} y={y + 2} c="#1E293B" />

          <Px x={rx + 3} y={y + 2} w={1} h={2} c="#38BDF8" />
          <Px x={midX - 1} y={y + 4} w={3} h={1} c="#475569" />
        </g>
      );
    }

    // Mythic 1: Ignis Rex
    if (speciesId === 'ignis_rex') {
      if (isDizzy) {
        return (
          <g>
            <Px x={lx} y={y} c="#DC2626" />
            <Px x={lx + 2} y={y} c="#DC2626" />
            <Px x={lx + 1} y={y + 1} c="#FACC15" />
            <Px x={lx} y={y + 2} c="#DC2626" />
            <Px x={lx + 2} y={y + 2} c="#DC2626" />
            <Px x={rx} y={y} c="#DC2626" />
            <Px x={rx + 2} y={y} c="#DC2626" />
            <Px x={rx + 1} y={y + 1} c="#FACC15" />
            <Px x={rx} y={y + 2} c="#DC2626" />
            <Px x={rx + 2} y={y + 2} c="#DC2626" />
            <Px x={midX - 1} y={y + 4} w={4} h={1} c="#7C2D12" />
          </g>
        );
      }
      if (isHappy) {
        return (
          <g>
            <Px x={lx} y={y + 1} c="#451A03" />
            <Px x={lx + 1} y={y} c="#451A03" />
            <Px x={lx + 2} y={y + 1} c="#451A03" />
            <Px x={rx} y={y + 1} c="#451A03" />
            <Px x={rx + 1} y={y} c="#451A03" />
            <Px x={rx + 2} y={y + 1} c="#451A03" />
            <Px x={midX - 1} y={y + 3} w={4} h={2} c="#7C2D12" />
            <Px x={midX} y={y + 4} w={2} h={1} c="#FACC15" />
          </g>
        );
      }
      if (isBlinking || isSpecial) {
        return (
          <g>
            <Px x={lx} y={y + 1} w={3} h={1} c="#451A03" />
            <Px x={rx} y={y + 1} w={3} h={1} c="#451A03" />
          </g>
        );
      }
      return (
        <g>
          <Px x={lx + gazeShift} y={y} w={2} h={3} c="#0F172A" />
          <Px x={lx + 1 + gazeShift} y={y + 1} w={1} h={2} c="#FACC15" />
          <Px x={lx + gazeShift} y={y} w={1} h={1} c="#FFFFFF" />
          <Px x={rx + gazeShift} y={y} w={2} h={3} c="#0F172A" />
          <Px x={rx + 1 + gazeShift} y={y + 1} w={1} h={2} c="#FACC15" />
          <Px x={rx + gazeShift} y={y} w={1} h={1} c="#FFFFFF" />
          <Px x={midX - 1} y={y + 4} w={3} h={1} c="#7C2D12" />
          <Px x={midX + 1} y={y + 4} w={1} h={1} c="#FFFFFF" />
        </g>
      );
    }

    // Mythic 2: Omega Aegis Cyber Visor
    if (speciesId === 'aegis_wolf') {
      const visorWidth = rx - lx + 4;
      if (isDizzy) {
        return (
          <g>
            <Px x={lx - 1} y={y} w={visorWidth} h={2} c="#991B1B" />
            <Px x={lx} y={y} w={2} h={1} c="#FACC15" />
            <Px x={rx} y={y + 1} w={2} h={1} c="#EF4444" />
          </g>
        );
      }
      if (isHappy) {
        return (
          <g>
            <Px x={lx - 1} y={y} w={visorWidth} h={3} c="#0F172A" />
            <Px x={lx} y={y + 1} w={1} h={1} c="#34D399" />
            <Px x={lx + 1} y={y} w={1} h={1} c="#34D399" />
            <Px x={lx + 2} y={y + 1} w={1} h={1} c="#34D399" />
            <Px x={rx} y={y + 1} w={1} h={1} c="#34D399" />
            <Px x={rx + 1} y={y} w={1} h={1} c="#34D399" />
            <Px x={rx + 2} y={y + 1} w={1} h={1} c="#34D399" />
          </g>
        );
      }
      if (isBlinking) {
        return <Px x={lx - 1} y={y + 1} w={visorWidth} h={1} c="#0284C7" />;
      }
      return (
        <g>
          <Px x={lx - 1} y={y} w={visorWidth} h={2} c="#0284C7" />
          <Px x={lx + gazeShift} y={y} w={visorWidth - 2} h={1} c="#38BDF8" />
          <Px
            x={isSpecial ? rx : lx + 1 + gazeShift}
            y={y}
            w={2}
            h={1}
            c={isSpecial ? '#4ADE80' : '#FFFFFF'}
          />
        </g>
      );
    }

    // Mythic 3: Obsidian Titan Warlord Eyes
    if (speciesId === 'obsidian_titan') {
      if (isDizzy) {
        return (
          <g>
            <Px x={lx} y={y} w={3} h={2} c="#E11D48" />
            <Px x={rx} y={y} w={3} h={2} c="#E11D48" />
            <Px x={midX - 2} y={y + 4} w={6} h={1} c="#F43F5E" />
          </g>
        );
      }
      if (isHappy) {
        return (
          <g>
            <Px x={lx} y={y + 1} w={3} h={1} c="#FACC15" />
            <Px x={rx} y={y + 1} w={3} h={1} c="#FACC15" />
            <Px x={lx - 1} y={y + 2} w={2} h={1} c="#FB7185" />
            <Px x={rx + 2} y={y + 2} w={2} h={1} c="#FB7185" />
          </g>
        );
      }
      if (isBlinking) {
        return (
          <g>
            <Px x={lx} y={y + 1} w={3} h={1} c="#881337" />
            <Px x={rx} y={y + 1} w={3} h={1} c="#881337" />
          </g>
        );
      }
      return (
        <g>
          <Px x={lx + gazeShift} y={y} w={2} h={1} c="#F43F5E" />
          <Px x={lx + 1 + gazeShift} y={y + 1} w={2} h={1} c="#FEF08A" />
          <Px x={rx + 1 + gazeShift} y={y} w={2} h={1} c="#F43F5E" />
          <Px x={rx + gazeShift} y={y + 1} w={2} h={1} c="#FEF08A" />
          <Px x={midX - 2} y={y + 4} w={1} h={1} c="#94A3B8" />
          <Px x={midX} y={y + 4} w={1} h={1} c="#94A3B8" />
          <Px x={midX + 2} y={y + 4} w={1} h={1} c="#94A3B8" />
        </g>
      );
    }

    // Real-World Animal Kingdom & Celestia/Terradon Faces
    if (isDizzy) {
      return (
        <g>
          <Px x={lx} y={y} c="#1E293B" />
          <Px x={lx + 2} y={y} c="#1E293B" />
          <Px x={lx + 1} y={y + 1} c="#1E293B" />
          <Px x={lx} y={y + 2} c="#1E293B" />
          <Px x={lx + 2} y={y + 2} c="#1E293B" />

          <Px x={rx} y={y} c="#1E293B" />
          <Px x={rx + 2} y={y} c="#1E293B" />
          <Px x={rx + 1} y={y + 1} c="#1E293B" />
          <Px x={rx} y={y + 2} c="#1E293B" />
          <Px x={rx + 2} y={y + 2} c="#1E293B" />
          <Px x={midX} y={y + 3} w={2} h={2} c="#EF4444" />
        </g>
      );
    }

    if (isHappy) {
      return (
        <g>
          <Px x={lx} y={y + 1} c="#0F172A" />
          <Px x={lx + 1} y={y} c="#0F172A" />
          <Px x={lx + 2} y={y + 1} c="#0F172A" />

          <Px x={rx} y={y + 1} c="#0F172A" />
          <Px x={rx + 1} y={y} c="#0F172A" />
          <Px x={rx + 2} y={y + 1} c="#0F172A" />

          <Px x={lx - 1} y={y + 2} w={2} h={1} c="#FB7185" />
          <Px x={rx + 2} y={y + 2} w={2} h={1} c="#FB7185" />
          <Px x={midX} y={y + 3} w={2} h={2} c="#F43F5E" />
        </g>
      );
    }

    const renderNoseMuzzle = () => {
      if (snoutType === 'nose_dark') {
        return (
          <g>
            <Px x={midX - 1} y={y + 2} w={4} h={2} c="#FFFBEB" />
            <Px x={midX} y={y + 2} w={2} h={1} c="#0F172A" />
          </g>
        );
      }
      if (snoutType === 'nose_pink') {
        return (
          <g>
            <Px x={midX - 1} y={y + 2} w={4} h={2} c="#FFFFFF" />
            <Px x={midX} y={y + 2} w={2} h={1} c="#F43F5E" />
          </g>
        );
      }
      return null;
    };

    if (isBlinking) {
      return (
        <g>
          <Px x={lx} y={y + 1} w={2} h={1} c="#0F172A" />
          <Px x={rx} y={y + 1} w={2} h={1} c="#0F172A" />
          {renderNoseMuzzle()}
        </g>
      );
    }

    const isFierceAnimal =
      speciesCfg.styleArchetype === 'Fierce & Badass' ||
      speciesCfg.styleArchetype === 'Cool & Tactical';

    return (
      <g>
        {isFierceAnimal && (
          <>
            <Px x={lx} y={y - 1} w={2} h={1} c={speciesCfg.secondaryColor} />
            <Px x={rx} y={y - 1} w={2} h={1} c={speciesCfg.secondaryColor} />
          </>
        )}
        <Px x={lx + gazeShift} y={y} w={2} h={2} c="#0F172A" />
        <Px x={lx + gazeShift} y={y} w={1} h={1} c="#FFFFFF" />

        <Px x={rx + gazeShift} y={y} w={2} h={2} c="#0F172A" />
        <Px x={rx + gazeShift} y={y} w={1} h={1} c="#FFFFFF" />

        {renderNoseMuzzle()}
      </g>
    );
  };

  /**
   * 5 MYTHIC APEX SPRITES (With Special Animations & Dynamic Mythic Particle Effects)
   */
  const renderIgnisRex = () => {
    const lFootLift = stepFoot === 1 ? -1 : 0;
    const wingShift = !staticPreview && fxFrame === 1 ? -1 : 0;
    if (stage === 'baby') {
      return (
        <g>
          <Px x={15} y={8 + wingShift} w={2} h={2} c="#FACC15" />
          <Px x={14} y={10} w={4} h={2} c="#F97316" />
          <Px x={10} y={12} w={12} h={12} c="#EA580C" />
          <Px x={9} y={14} w={14} h={8} c="#F97316" />
          <Px x={11} y={13} w={10} h={10} c="#FB923C" />
          <Px x={12} y={19} w={8} h={4} c="#FDE047" />
          <Px x={23} y={19} w={3} h={2} c="#EA580C" />
          <Px x={25} y={17 + wingShift} w={2} h={2} c="#FACC15" />
          <Px x={10} y={24 + lFootLift} w={4} h={3} c="#9A3412" />
          <Px x={18} y={24} w={4} h={3} c="#9A3412" />
          {renderSpeciesFace(12, 18, 15, 'none')}
        </g>
      );
    }
    return (
      <g>
        {/* Animated Solar Wyvern Wings */}
        <Px x={1} y={8 + wingShift} w={8} h={11} c="#991B1B" />
        <Px x={2} y={10 + wingShift} w={6} h={8} c="#EF4444" />
        <Px x={3} y={12 + wingShift} w={5} h={5} c="#FACC15" />
        <Px x={23} y={8 + wingShift} w={8} h={11} c="#991B1B" />
        <Px x={24} y={10 + wingShift} w={6} h={8} c="#EF4444" />
        <Px x={24} y={12 + wingShift} w={5} h={5} c="#FACC15" />
        {/* Dragon Horns & Solar Crest */}
        <Px x={8} y={3} w={2} h={4} c="#FACC15" />
        <Px x={22} y={3} w={2} h={4} c="#FACC15" />
        <Px x={14} y={2} w={4} h={4} c="#FEF08A" />
        <Px x={15} y={1} w={2} h={2} c="#EF4444" />
        {/* Sculpted Dragon Head & Armored Chest */}
        <Px x={10} y={5} w={12} h={1} c="#9A3412" />
        <Px x={9} y={6} w={14} h={7} c="#EA580C" />
        <Px x={10} y={7} w={12} h={5} c="#F97316" />
        <Px x={9} y={13} w={14} h={11} c="#DC2626" />
        <Px x={8} y={15} w={16} h={8} c="#DC2626" />
        <Px x={11} y={14} w={10} h={9} c="#FACC15" />
        <Px x={11} y={16} w={10} h={1} c="#B45309" />
        <Px x={11} y={19} w={10} h={1} c="#B45309" />
        <Px x={8} y={24 + lFootLift} w={5} h={3} c="#7C2D12" />
        <Px x={19} y={24} w={5} h={3} c="#7C2D12" />
        {renderSpeciesFace(11, 19, 8, 'none')}
      </g>
    );
  };

  const renderTerradon = () => {
    const lFootLift = stepFoot === 1 ? -1 : 0;
    const waterShift = !staticPreview && fxFrame === 1 ? 1 : 0;
    return (
      <g>
        {/* World-Tree Canopy */}
        <Px x={9} y={1} w={16} h={6} c="#059669" />
        <Px x={7} y={3} w={20} h={5} c="#10B981" />
        <Px x={11} y={2} w={12} h={4} c="#34D399" />
        <Px x={10} y={3} w={2} h={2} c="#FACC15" />
        <Px x={17} y={2} w={2} h={2} c="#F472B6" />
        <Px x={22} y={4} w={2} h={2} c="#FACC15" />
        <Px x={14} y={8} w={6} h={4} c="#78350F" />
        {/* Ancient Tortoise Shell & Flowing Waterfall */}
        <Px x={7} y={11} w={20} h={2} c="#064E3B" />
        <Px x={6} y={13} w={22} h={7} c="#064E3B" />
        <Px x={8} y={12} w={18} h={7} c="#047857" />
        <Px x={19} y={12} w={3} h={9} c="#38BDF8" />
        <Px x={20} y={13 + waterShift} w={1} h={6} c="#E0F2FE" />
        <Px x={5} y={19} w={24} h={2} c="#D97706" />
        {/* Sculpted Tortoise Head */}
        <Px x={2} y={12} w={5} h={1} c="#059669" />
        <Px x={1} y={13} w={7} h={6} c="#34D399" />
        <Px x={6} y={21 + lFootLift} w={4} h={6} c="#065F46" />
        <Px x={12} y={21} w={4} h={6} c="#065F46" />
        <Px x={18} y={21 + lFootLift} w={4} h={6} c="#065F46" />
        <Px x={24} y={21} w={4} h={6} c="#065F46" />
        {renderSpeciesFace(2, 5, 14, 'none')}
      </g>
    );
  };

  const renderCelestia = () => {
    const wingLift = !staticPreview && fxFrame === 1 ? -1 : 0;
    return (
      <g>
        {/* Astral Halo */}
        <Px x={11} y={1} w={10} h={2} c="#FACC15" />
        <Px x={15} y={0} w={2} h={4} c="#FEF08A" />
        {/* 6 Cosmic Wings */}
        <Px x={1} y={5 + wingLift} w={8} h={5} c="#FACC15" />
        <Px x={2} y={6 + wingLift} w={6} h={3} c="#FEF08A" />
        <Px x={23} y={5 + wingLift} w={8} h={5} c="#FACC15" />
        <Px x={24} y={6 + wingLift} w={6} h={3} c="#FEF08A" />
        <Px x={0} y={11} w={9} h={5} c="#EC4899" />
        <Px x={2} y={12} w={6} h={3} c="#FBCFE8" />
        <Px x={23} y={11} w={9} h={5} c="#EC4899" />
        <Px x={24} y={12} w={6} h={3} c="#FBCFE8" />
        <Px x={2} y={17 - wingLift} w={7} h={5} c="#8B5CF6" />
        <Px x={23} y={17 - wingLift} w={7} h={5} c="#8B5CF6" />
        {/* Rounded Seraph Body */}
        <Px x={10} y={6} w={12} h={2} c="#FFF1F2" />
        <Px x={9} y={8} w={14} h={14} c="#FFF1F2" />
        <Px x={8} y={15} w={16} h={7} c="#FCE7F3" />
        <Px x={13} y={15} w={6} h={3} c="#FACC15" />
        <Px x={6} y={24} w={20} h={3} c="#E9D5FF" />
        <Px x={8} y={23} w={16} h={3} c="#FDF4FF" />
        {renderSpeciesFace(11, 19, 10, 'nose_pink')}
      </g>
    );
  };

  const renderAegisWolf = () => {
    const lFootLift = stepFoot === 1 ? -1 : 0;
    const thrusterGlow = !staticPreview && fxFrame === 1 ? '#38BDF8' : '#0284C7';
    return (
      <g>
        {/* Plasma Thruster Wings */}
        <Px x={0} y={9} w={6} h={3} c={thrusterGlow} />
        <Px x={1} y={14} w={5} h={3} c={thrusterGlow} />
        <Px x={26} y={9} w={6} h={3} c={thrusterGlow} />
        <Px x={26} y={14} w={5} h={3} c={thrusterGlow} />
        {/* Dual Shoulder Railguns */}
        <Px x={4} y={2} w={4} h={12} c="#1E293B" />
        <Px x={5} y={2} w={2} h={9} c="#38BDF8" />
        <Px x={24} y={2} w={4} h={12} c="#1E293B" />
        <Px x={25} y={2} w={2} h={9} c="#38BDF8" />
        {/* Cyber Wolf Ears & Chassis */}
        <Px x={9} y={2} w={3} h={5} c="#334155" />
        <Px x={20} y={2} w={3} h={5} c="#334155" />
        <Px x={10} y={6} w={12} h={1} c="#1E293B" />
        <Px x={8} y={7} w={16} h={16} c="#1E293B" />
        <Px x={9} y={7} w={14} h={15} c="#475569" />
        <Px x={9} y={14} w={14} h={7} c="#F8FAFC" />
        <Px x={10} y={15} w={12} h={2} c="#FACC15" />
        <Px x={13} y={16} w={6} h={4} c="#0284C7" />
        <Px x={7} y={23 + lFootLift} w={6} h={4} c="#0F172A" />
        <Px x={19} y={23} w={6} h={4} c="#0F172A" />
        {renderSpeciesFace(11, 18, 9, 'none')}
      </g>
    );
  };

  const renderObsidianTitan = () => {
    const lFootLift = stepFoot === 1 ? -1 : 0;
    const swordLiftY =
      isHappy || isSpecial || (!staticPreview && fxFrame === 1) ? -1 : 0;
    return (
      <g>
        <Px x={3} y={6} w={6} h={13} c="#4C0519" />
        <Px x={4} y={8} w={4} h={9} c="#9F1239" />
        <Px x={23} y={6} w={6} h={13} c="#4C0519" />
        <Px x={24} y={8} w={4} h={9} c="#9F1239" />
        <Px x={0} y={2 + swordLiftY} w={3} h={16} c="#E11D48" />
        <Px x={1} y={3 + swordLiftY} w={1} h={13} c="#FACC15" />
        <Px x={0} y={18 + swordLiftY} w={4} h={2} c="#FACC15" />
        <Px x={29} y={2 + swordLiftY} w={3} h={16} c="#E11D48" />
        <Px x={30} y={3 + swordLiftY} w={1} h={13} c="#FACC15" />
        <Px x={28} y={18 + swordLiftY} w={4} h={2} c="#FACC15" />
        <Px x={6} y={1} w={3} h={6} c="#E11D48" />
        <Px x={23} y={1} w={3} h={6} c="#E11D48" />
        <Px x={10} y={5} w={12} h={1} c="#090D16" />
        <Px x={8} y={6} w={16} h={17} c="#090D16" />
        <Px x={9} y={6} w={14} h={16} c="#1E293B" />
        <Px x={11} y={13} w={10} h={8} c="#9F1239" />
        <Px x={12} y={14} w={8} h={6} c="#F43F5E" />
        <Px x={14} y={15} w={4} h={4} c="#FACC15" />
        <Px x={8} y={23 + lFootLift} w={6} h={4} c="#090D16" />
        <Px x={18} y={23} w={6} h={4} c="#090D16" />
        {renderSpeciesFace(11, 18, 8, 'none')}
      </g>
    );
  };

  /**
   * SCULPTED REAL-WORLD ANIMAL KINGDOM 8-BIT SPRITE RENDERER (39 Animals)
   * Every animal has a contoured pixel silhouette (tapered head, distinct snout/beak/horns/shell/tail)
   * and ZERO artificial crowns or floating yellow pixels!
   */
  const renderRealWorldAnimal = () => {
    const lFootLift = stepFoot === 1 ? -1 : 0;
    const pCol = speciesCfg.primaryColor;
    const sCol = speciesCfg.secondaryColor;
    const aCol = speciesCfg.accentHex;
    const feat = speciesCfg.featureTag || '';
    const arch = speciesCfg.visualArchetype;

    // 1. GIRAFFE — Tall Spotted Neck, Rounded Snout, Ossicones, 4 Long Legs
    if (arch === 'giraffe') {
      return (
        <g>
          {/* Ossicone Horns & Ears */}
          <Px x={10} y={1} w={1} h={3} c={sCol} />
          <Px x={14} y={1} w={1} h={3} c={sCol} />
          <Px x={8} y={3} w={2} h={2} c={pCol} />
          {/* Sculpted Head & Cream Muzzle */}
          <Px x={9} y={3} w={7} h={5} c={pCol} />
          <Px x={14} y={5} w={4} h={3} c={aCol} />
          <Px x={16} y={5} w={1} h={1} c="#0F172A" />
          {/* Long Spotted Neck */}
          <Px x={10} y={8} w={4} h={9} c={pCol} />
          <Px x={9} y={9} w={1} h={7} c={sCol} />
          <Px x={11} y={10} w={2} h={2} c={sCol} />
          <Px x={11} y={14} w={2} h={2} c={sCol} />
          {/* Sloped Giraffe Back & Spotted Body */}
          <Px x={9} y={16} w={13} h={5} c={pCol} />
          <Px x={10} y={15} w={6} h={2} c={pCol} />
          <Px x={11} y={17} w={2} h={2} c={sCol} />
          <Px x={15} y={16} w={2} h={2} c={sCol} />
          <Px x={18} y={18} w={2} h={2} c={sCol} />
          {/* Tufted Tail */}
          <Px x={22} y={17} w={1} h={5} c={pCol} />
          <Px x={22} y={21} w={2} h={2} c={sCol} />
          {/* 4 Slender Hoofed Legs */}
          <Px x={9} y={21 + lFootLift} w={2} h={5} c={pCol} />
          <Px x={9} y={26 + lFootLift} w={2} h={1} c="#1E293B" />
          <Px x={12} y={21} w={2} h={5} c={sCol} />
          <Px x={12} y={26} w={2} h={1} c="#1E293B" />
          <Px x={17} y={21 + lFootLift} w={2} h={5} c={sCol} />
          <Px x={17} y={26 + lFootLift} w={2} h={1} c="#1E293B" />
          <Px x={20} y={21} w={2} h={5} c={pCol} />
          <Px x={20} y={26} w={2} h={1} c="#1E293B" />
          {renderSpeciesFace(10, 13, 4, 'none')}
        </g>
      );
    }

    // 2. PACHYDERM (Elephant, Hippo, Rhino) — Rounded Dome Back, Heavy Pillar Legs
    if (arch === 'pachyderm') {
      return (
        <g>
          {/* Large Floppy Elephant Ears vs Rounded Hippo/Rhino Ears */}
          {feat === 'trunk_tusks' ? (
            <>
              <Px x={3} y={7} w={5} h={8} c={sCol} />
              <Px x={4} y={8} w={3} h={6} c="#FDA4AF" />
              <Px x={24} y={7} w={5} h={8} c={sCol} />
              <Px x={25} y={8} w={3} h={6} c="#FDA4AF" />
            </>
          ) : (
            <>
              <Px x={8} y={5} w={3} h={3} c={sCol} />
              <Px x={21} y={5} w={3} h={3} c={sCol} />
            </>
          )}
          {/* Rounded Dome Head & Arched Back */}
          <Px x={10} y={6} w={12} h={2} c={pCol} />
          <Px x={8} y={8} w={16} h={7} c={pCol} />
          <Px x={7} y={14} w={18} h={8} c={pCol} />
          <Px x={6} y={16} w={20} h={5} c={pCol} />
          <Px x={10} y={17} w={12} h={5} c={sCol} />
          {/* Elephant Curled Trunk & Ivory Tusks */}
          {feat === 'trunk_tusks' && (
            <>
              <Px x={14} y={12} w={4} h={9} c={pCol} />
              <Px x={16} y={19} w={4} h={3} c={pCol} />
              <Px x={10} y={14} w={3} h={3} c="#FEF9C3" />
              <Px x={19} y={14} w={3} h={3} c="#FEF9C3" />
            </>
          )}
          {/* Rhino Twin Curved Horns & Armor Folds */}
          {feat === 'rhino_horn' && (
            <>
              <Px x={14} y={2} w={4} h={4} c="#FACC15" />
              <Px x={15} y={0} w={2} h={3} c="#FEF08A" />
              <Px x={9} y={14} w={1} h={6} c="#1E293B" />
              <Px x={22} y={14} w={1} h={6} c="#1E293B" />
            </>
          )}
          {/* Hippo Wide Muzzle, Nostrils & Lower Tusks */}
          {feat === 'hippo_jaw' && (
            <>
              <Px x={8} y={12} w={16} h={6} c={aCol} />
              <Px x={11} y={13} w={2} h={1} c="#4C1D95" />
              <Px x={19} y={13} w={2} h={1} c="#4C1D95" />
              <Px x={10} y={17} w={2} h={2} c="#FFFFFF" />
              <Px x={20} y={17} w={2} h={2} c="#FFFFFF" />
            </>
          )}
          {/* 4 Heavy Pillar Feet with Toenails */}
          <Px x={7} y={22 + lFootLift} w={4} h={5} c={sCol} />
          <Px x={7} y={26 + lFootLift} w={1} h={1} c="#E2E8F0" />
          <Px x={9} y={26 + lFootLift} w={1} h={1} c="#E2E8F0" />
          <Px x={12} y={23} w={3} h={4} c={pCol} />
          <Px x={17} y={23 + lFootLift} w={3} h={4} c={pCol} />
          <Px x={21} y={22} w={4} h={5} c={sCol} />
          <Px x={21} y={26} w={1} h={1} c="#E2E8F0" />
          <Px x={23} y={26} w={1} h={1} c="#E2E8F0" />
          {renderSpeciesFace(10, 19, 9, 'none')}
        </g>
      );
    }

    // 3. BIRDS & WATERFOWL (Rooster, Pigeon, Macaw, Owl, Eagle, Peacock, Mallard, Penguin)
    if (arch === 'bird' || arch === 'waterfowl') {
      return (
        <g>
          {/* Peacock Multi-Layered Iridescent Tail Fan */}
          {feat === 'peacock_fan' && (
            <g>
              <Px x={4} y={3} w={24} h={3} c="#059669" />
              <Px x={2} y={6} w={28} h={11} c="#059669" />
              <Px x={5} y={5} w={22} h={11} c="#10B981" />
              <Px x={6} y={6} w={2} h={2} c="#FACC15" />
              <Px x={15} y={4} w={2} h={2} c="#FACC15" />
              <Px x={24} y={6} w={2} h={2} c="#FACC15" />
              <Px x={9} y={9} w={2} h={2} c="#38BDF8" />
              <Px x={21} y={9} w={2} h={2} c="#38BDF8" />
            </g>
          )}
          {/* Rooster Zigzag Crimson Comb & Wattle */}
          {feat === 'comb' && (
            <>
              <Px x={12} y={4} w={2} h={3} c="#DC2626" />
              <Px x={15} y={3} w={2} h={4} c="#DC2626" />
              <Px x={18} y={4} w={2} h={3} c="#DC2626" />
              <Px x={15} y={14} w={2} h={2} c="#DC2626" />
            </>
          )}
          {/* Owl Feathered Horn Tufts */}
          {feat === 'owl_tufts' && (
            <>
              <Px x={8} y={4} w={3} h={3} c={sCol} />
              <Px x={21} y={4} w={3} h={3} c={sCol} />
            </>
          )}
          {/* Sculpted Round Bird Head */}
          <Px
            x={11}
            y={6}
            w={10}
            h={2}
            c={feat === 'white_crest' ? '#FFFFFF' : pCol}
          />
          <Px
            x={9}
            y={8}
            w={14}
            h={6}
            c={feat === 'white_crest' ? '#FFFFFF' : pCol}
          />
          {/* Pigeon Iridescent Neck Collar / Mallard White Neck Ring */}
          {feat === 'neck_shimmer' && (
            <Px x={9} y={13} w={14} h={2} c="#A855F7" />
          )}
          {feat === 'yellow_bill' && (
            <Px x={9} y={13} w={14} h={1} c="#FFFFFF" />
          )}
          {/* Plump Tapered Bird Body */}
          <Px x={8} y={14} w={16} h={8} c={pCol} />
          <Px x={10} y={22} w={12} h={2} c={pCol} />
          {/* Rounded Breast / Penguin Tuxedo Belly */}
          <Px
            x={11}
            y={14}
            w={10}
            h={8}
            c={feat === 'tuxedo' ? '#FFFFFF' : aCol}
          />
          {/* Contoured Folded Wings */}
          <Px
            x={5}
            y={14}
            w={3}
            h={6}
            c={feat === 'tropical_wings' ? '#2563EB' : sCol}
          />
          <Px
            x={6}
            y={20}
            w={2}
            h={2}
            c={feat === 'tropical_wings' ? '#FACC15' : sCol}
          />
          <Px
            x={24}
            y={14}
            w={3}
            h={6}
            c={feat === 'tropical_wings' ? '#2563EB' : sCol}
          />
          <Px
            x={24}
            y={20}
            w={2}
            h={2}
            c={feat === 'tropical_wings' ? '#FACC15' : sCol}
          />
          {/* Sculpted Beak / Duck Bill */}
          <Px
            x={14}
            y={11}
            w={4}
            h={2}
            c={feat === 'yellow_bill' ? '#FACC15' : '#F97316'}
          />
          <Px x={15} y={13} w={2} h={1} c="#EA580C" />
          {/* Webbed Feet / Bird Talons */}
          <Px x={11} y={24 + lFootLift} w={3} h={3} c="#F59E0B" />
          <Px x={10} y={26 + lFootLift} w={4} h={1} c="#D97706" />
          <Px x={18} y={24} w={3} h={3} c="#F59E0B" />
          <Px x={18} y={26} w={4} h={1} c="#D97706" />
          {renderSpeciesFace(10, 19, 9, 'beak')}
        </g>
      );
    }

    // 4. AQUATIC & REPTILE (Dolphin, Shark, Axolotl, Chameleon)
    if (arch === 'aquatic' || arch === 'reptile') {
      return (
        <g>
          {/* Axolotl 6 Feathery Pink External Gill Frills */}
          {feat === 'axolotl_gills' && (
            <>
              <Px x={4} y={7} w={4} h={2} c="#DB2777" />
              <Px x={3} y={10} w={5} h={2} c="#EC4899" />
              <Px x={4} y={13} w={4} h={2} c="#DB2777" />
              <Px x={24} y={7} w={4} h={2} c="#DB2777" />
              <Px x={24} y={10} w={5} h={2} c="#EC4899" />
              <Px x={24} y={13} w={4} h={2} c="#DB2777" />
            </>
          )}
          {/* Shark / Dolphin Curved Dorsal Fin */}
          {(feat === 'dorsal_fin' || feat === 'shark_jaws') && (
            <>
              <Px x={14} y={3} w={3} h={3} c={sCol} />
              <Px x={13} y={6} w={5} h={2} c={sCol} />
            </>
          )}
          {/* Chameleon Casque Head Crest */}
          {feat === 'curled_tail' && (
            <Px x={11} y={4} w={8} h={3} c={sCol} />
          )}
          {/* Tapered Streamlined Head & Body */}
          <Px x={10} y={7} w={12} h={2} c={pCol} />
          <Px x={8} y={9} w={16} h={11} c={pCol} />
          <Px x={9} y={20} w={14} h={3} c={pCol} />
          <Px x={11} y={15} w={10} h={7} c="#F8FAFC" />
          {/* Shark Serrated Jaws */}
          {feat === 'shark_jaws' && (
            <g>
              <Px x={11} y={14} w={10} h={3} c="#991B1B" />
              <Px x={11} y={14} w={2} h={1} c="#FFFFFF" />
              <Px x={15} y={14} w={2} h={1} c="#FFFFFF" />
              <Px x={19} y={14} w={2} h={1} c="#FFFFFF" />
            </g>
          )}
          {/* Chameleon Coiled Spiral Tail vs Aquatic Tail Fin */}
          {feat === 'curled_tail' ? (
            <g>
              <Px x={24} y={16} w={5} h={6} c={sCol} />
              <Px x={25} y={17} w={3} h={4} c={aCol} />
              <Px x={26} y={18} w={1} h={2} c={sCol} />
            </g>
          ) : (
            <g>
              <Px x={24} y={18} w={4} h={4} c={sCol} />
              <Px x={27} y={16} w={2} h={3} c={sCol} />
              <Px x={27} y={21} w={2} h={3} c={sCol} />
            </g>
          )}
          {/* Flippers / Reptile Feet */}
          <Px x={8} y={23 + lFootLift} w={5} h={4} c={sCol} />
          <Px x={19} y={23} w={5} h={4} c={sCol} />
          {renderSpeciesFace(10, 19, 10, 'none')}
        </g>
      );
    }

    // 5. RABBIT & RODENTS (Bunny, Squirrel, Hedgehog, Raccoon, Capybara, Red Panda)
    if (arch === 'rabbit' || arch === 'rodent') {
      return (
        <g>
          {/* Tall Sculpted Bunny Ears vs Round Rodent Ears */}
          {feat === 'long_ears' ? (
            <>
              <Px x={10} y={1} w={3} h={7} c={pCol} />
              <Px x={11} y={2} w={1} h={5} c="#FCE7F3" />
              <Px x={19} y={1} w={3} h={7} c={pCol} />
              <Px x={20} y={2} w={1} h={5} c="#FCE7F3" />
            </>
          ) : (
            <>
              <Px x={8} y={6} w={3} h={3} c={sCol} />
              <Px x={9} y={7} w={1} h={1} c={aCol} />
              <Px x={21} y={6} w={3} h={3} c={sCol} />
              <Px x={22} y={7} w={1} h={1} c={aCol} />
            </>
          )}
          {/* Capybara Yuzu Citrus on Head */}
          {feat === 'yuzu_head' && (
            <>
              <Px x={14} y={4} w={4} h={3} c="#FACC15" />
              <Px x={15} y={3} w={2} h={1} c="#22C55E" />
            </>
          )}
          {/* Hedgehog Layered Spiky Quills */}
          {feat === 'quills' && (
            <>
              <Px x={7} y={6} w={18} h={3} c={sCol} />
              <Px x={5} y={9} w={22} h={10} c={sCol} />
              <Px x={8} y={5} w={2} h={1} c={sCol} />
              <Px x={13} y={5} w={2} h={1} c={sCol} />
              <Px x={18} y={5} w={2} h={1} c={sCol} />
              <Px x={22} y={5} w={2} h={1} c={sCol} />
            </>
          )}
          {/* Large Bushy Curved Tail (Squirrel, Red Panda, Raccoon) */}
          {(feat === 'bushy_tail' ||
            feat === 'ring_tail' ||
            feat === 'bandit_mask') && (
            <g>
              <Px x={23} y={8} w={6} h={14} c={pCol} />
              <Px x={25} y={6} w={4} h={3} c={sCol} />
              <Px x={24} y={11} w={5} h={2} c={sCol} />
              <Px x={24} y={15} w={5} h={2} c={sCol} />
            </g>
          )}
          {/* Bunny Fluffy Cotton Tail */}
          {feat === 'long_ears' && (
            <Px x={24} y={19} w={3} h={3} c="#FFFFFF" />
          )}
          {/* Sculpted Rounded Head & Pear-Shaped Chubby Body */}
          <Px x={10} y={7} w={12} h={2} c={pCol} />
          <Px x={8} y={9} w={16} h={6} c={pCol} />
          <Px x={7} y={15} w={18} h={8} c={pCol} />
          <Px x={11} y={15} w={10} h={8} c={aCol} />
          {/* Raccoon Bandit Mask */}
          {feat === 'bandit_mask' && (
            <Px x={8} y={9} w={16} h={4} c="#0F172A" />
          )}
          {/* Red Panda White Cheek Badges */}
          {feat === 'ring_tail' && (
            <>
              <Px x={8} y={11} w={3} h={2} c="#FFFFFF" />
              <Px x={21} y={11} w={3} h={2} c="#FFFFFF" />
            </>
          )}
          {/* Paws */}
          <Px x={9} y={23 + lFootLift} w={5} h={4} c={sCol} />
          <Px x={18} y={23} w={5} h={4} c={sCol} />
          {renderSpeciesFace(
            10,
            19,
            10,
            feat === 'long_ears' ? 'nose_pink' : 'nose_dark'
          )}
        </g>
      );
    }

    // 6. BEAR, KOALA, PANDA, GORILLA (bear_ape)
    if (arch === 'bear_ape') {
      const isPanda = feat === 'panda_patches';
      return (
        <g>
          {/* Round Bear/Koala/Panda Ears */}
          <Px
            x={6}
            y={5}
            w={feat === 'koala_ears' ? 6 : 4}
            h={feat === 'koala_ears' ? 6 : 4}
            c={sCol}
          />
          {feat === 'koala_ears' && (
            <Px x={7} y={6} w={3} h={3} c="#E2E8F0" />
          )}
          <Px
            x={feat === 'koala_ears' ? 20 : 22}
            y={5}
            w={feat === 'koala_ears' ? 6 : 4}
            h={feat === 'koala_ears' ? 6 : 4}
            c={sCol}
          />
          {feat === 'koala_ears' && (
            <Px x={22} y={6} w={3} h={3} c="#E2E8F0" />
          )}
          {/* Sculpted Rounded Head & Broad Shoulders */}
          <Px
            x={10}
            y={6}
            w={12}
            h={2}
            c={isPanda ? '#FFFFFF' : pCol}
          />
          <Px
            x={8}
            y={8}
            w={16}
            h={7}
            c={isPanda ? '#FFFFFF' : pCol}
          />
          <Px
            x={6}
            y={15}
            w={20}
            h={8}
            c={isPanda ? '#FFFFFF' : pCol}
          />
          {/* Panda Black Harness, Eye Patches & Emerald Bamboo Stalk */}
          {isPanda && (
            <g>
              <Px x={6} y={15} w={20} h={3} c="#0F172A" />
              <Px x={6} y={15} w={4} h={6} c="#0F172A" />
              <Px x={22} y={15} w={4} h={6} c="#0F172A" />
              <Px x={9} y={9} w={4} h={4} c="#0F172A" />
              <Px x={19} y={9} w={4} h={4} c="#0F172A" />
              <Px x={26} y={9} w={2} h={13} c="#10B981" />
              <Px x={25} y={11} w={2} h={1} c="#34D399" />
            </g>
          )}
          {/* Gorilla Silver Chest Plate & Brow Ridge */}
          {feat === 'silver_saddle' && (
            <>
              <Px x={8} y={7} w={16} h={2} c="#0F172A" />
              <Px x={9} y={15} w={14} h={6} c="#CBD5E1" />
            </>
          )}
          {/* Grizzly Rounded Tan Snout & Belly */}
          {feat === 'bear_claws' && (
            <Px x={10} y={16} w={12} h={6} c={aCol} />
          )}
          {/* Sturdy Paws */}
          <Px x={7} y={23 + lFootLift} w={6} h={4} c={sCol} />
          <Px x={19} y={23} w={6} h={4} c={sCol} />
          {renderSpeciesFace(10, 19, 10, 'nose_dark')}
        </g>
      );
    }

    // 7. HOOFED (Piglet, Sheep, Cow, Goat, Mustang, Stag)
    if (arch === 'hoofed') {
      return (
        <g>
          {/* Stag Branching Woodland Antlers */}
          {feat === 'antlers' && (
            <g>
              <Px x={7} y={1} w={2} h={6} c="#FEF08A" />
              <Px x={5} y={2} w={4} h={2} c="#FEF08A" />
              <Px x={9} y={3} w={2} h={1} c="#FEF08A" />
              <Px x={23} y={1} w={2} h={6} c="#FEF08A" />
              <Px x={23} y={2} w={4} h={2} c="#FEF08A" />
              <Px x={21} y={3} w={2} h={1} c="#FEF08A" />
            </g>
          )}
          {/* Goat / Cow Curved Horns */}
          {(feat === 'horns' || feat === 'spots') && (
            <>
              <Px x={8} y={3} w={2} h={4} c="#FEF08A" />
              <Px x={22} y={3} w={2} h={4} c="#FEF08A" />
            </>
          )}
          {/* Mustang Flowing Mane */}
          {feat === 'mane' && (
            <>
              <Px x={12} y={4} w={8} h={3} c={sCol} />
              <Px x={6} y={8} w={3} h={9} c={sCol} />
            </>
          )}
          {/* Sheep Scalloped Fluffy Cloud Fleece */}
          {feat === 'wool' && (
            <g>
              <Px x={9} y={5} w={14} h={3} c="#F8FAFC" />
              <Px x={6} y={8} w={20} h={13} c="#F8FAFC" />
              <Px x={5} y={11} w={22} h={8} c="#FFFFFF" />
            </g>
          )}
          {/* Sculpted Head & Torso */}
          <Px
            x={10}
            y={6}
            w={12}
            h={2}
            c={feat === 'spots' ? '#FFFFFF' : pCol}
          />
          <Px
            x={8}
            y={8}
            w={16}
            h={14}
            c={feat === 'spots' ? '#FFFFFF' : pCol}
          />
          {/* Side Ears */}
          <Px x={6} y={8} w={2} h={3} c={sCol} />
          <Px x={24} y={8} w={2} h={3} c={sCol} />
          {/* Cow Black Patches */}
          {feat === 'spots' && (
            <>
              <Px x={8} y={8} w={5} h={5} c="#0F172A" />
              <Px x={17} y={15} w={7} h={6} c="#0F172A" />
            </>
          )}
          {/* Piglet / Cow Prominent Pink Snout with Nostrils */}
          {(feat === 'snout' || feat === 'spots') && (
            <g>
              <Px x={11} y={12} w={10} h={4} c="#F472B6" />
              <Px x={13} y={13} w={2} h={2} c="#881337" />
              <Px x={17} y={13} w={2} h={2} c="#881337" />
            </g>
          )}
          {/* Goat Beard */}
          {feat === 'horns' && <Px x={14} y={15} w={4} h={3} c={sCol} />}
          {/* 4 Cloven Hooves */}
          <Px x={8} y={22 + lFootLift} w={4} h={5} c={sCol} />
          <Px x={8} y={25 + lFootLift} w={4} h={2} c="#0F172A" />
          <Px x={13} y={22} w={3} h={5} c={sCol} />
          <Px x={13} y={25} w={3} h={2} c="#0F172A" />
          <Px x={20} y={22} w={4} h={5} c={sCol} />
          <Px x={20} y={25} w={4} h={2} c="#0F172A" />
          {renderSpeciesFace(
            10,
            19,
            9,
            feat === 'snout' || feat === 'spots' ? 'none' : 'nose_dark'
          )}
        </g>
      );
    }

    // 8. CANINE & FELINE (Retriever, Tabby, Red Fox, Wolf, Lion, Tiger, Snow Leopard)
    const isCatOrBigCat = arch === 'feline';
    return (
      <g>
        {/* Lion Sculpted Sunburst Mane */}
        {feat === 'lion_mane' && (
          <g>
            <Px x={8} y={3} w={16} h={3} c={sCol} />
            <Px x={5} y={6} w={22} h={12} c={sCol} />
            <Px x={7} y={5} w={18} h={13} c="#9A3412" />
          </g>
        )}
        {/* Ears: Floppy Retriever Ears vs Pointed Triangular Cat/Wolf/Fox/Tiger Ears */}
        {feat === 'floppy_ears' ? (
          <>
            <Px x={6} y={7} w={3} h={7} c={sCol} />
            <Px x={5} y={9} w={2} h={4} c={sCol} />
            <Px x={23} y={7} w={3} h={7} c={sCol} />
            <Px x={25} y={9} w={2} h={4} c={sCol} />
          </>
        ) : (
          <>
            <Px x={9} y={3} w={2} h={1} c={sCol} />
            <Px x={8} y={4} w={4} h={3} c={sCol} />
            <Px x={9} y={5} w={2} h={2} c="#FDA4AF" />
            <Px x={21} y={3} w={2} h={1} c={sCol} />
            <Px x={20} y={4} w={4} h={3} c={sCol} />
            <Px x={21} y={5} w={2} h={2} c="#FDA4AF" />
          </>
        )}
        {/* Contoured Head & Cheek Ruff */}
        <Px x={10} y={6} w={12} h={2} c={pCol} />
        <Px x={8} y={8} w={16} h={7} c={pCol} />
        {feat === 'wolf_ruff' && (
          <>
            <Px x={6} y={10} w={2} h={4} c="#CBD5E1" />
            <Px x={24} y={10} w={2} h={4} c="#CBD5E1" />
          </>
        )}
        {/* Feline Whiskers */}
        {isCatOrBigCat && (
          <>
            <Px x={6} y={11} w={2} h={1} c="#334155" />
            <Px x={6} y={13} w={2} h={1} c="#334155" />
            <Px x={24} y={11} w={2} h={1} c="#334155" />
            <Px x={24} y={13} w={2} h={1} c="#334155" />
          </>
        )}
        {/* Sculpted Torso & Chest Fur */}
        <Px x={8} y={15} w={16} h={8} c={pCol} />
        <Px x={11} y={15} w={10} h={7} c={aCol} />
        {/* Tiger / Tabby Stripes */}
        {(feat === 'tiger_stripes' || feat === 'stripes') && (
          <>
            <Px x={15} y={6} w={2} h={2} c="#0F172A" />
            <Px x={8} y={15} w={3} h={1} c="#0F172A" />
            <Px x={8} y={18} w={4} h={1} c="#0F172A" />
            <Px x={21} y={15} w={3} h={1} c="#0F172A" />
            <Px x={20} y={18} w={4} h={1} c="#0F172A" />
          </>
        )}
        {/* Snow Leopard Rosette Spots */}
        {feat === 'rosette_spots' && (
          <>
            <Px x={9} y={16} w={2} h={2} c="#334155" />
            <Px x={21} y={16} w={2} h={2} c="#334155" />
            <Px x={9} y={19} w={2} h={1} c="#334155" />
          </>
        )}
        {/* Curved Tail with Tip */}
        <Px x={24} y={16} w={3} h={6} c={pCol} />
        <Px x={26} y={13} w={3} h={4} c={pCol} />
        <Px
          x={26}
          y={11}
          w={3}
          h={2}
          c={feat === 'white_tail_tip' ? '#FFFFFF' : sCol}
        />
        {/* 4 Paws */}
        <Px x={8} y={23 + lFootLift} w={5} h={4} c={sCol} />
        <Px x={9} y={26 + lFootLift} w={3} h={1} c={aCol} />
        <Px x={19} y={23} w={5} h={4} c={sCol} />
        <Px x={20} y={26} w={3} h={1} c={aCol} />
        {renderSpeciesFace(
          10,
          19,
          9,
          isCatOrBigCat ? 'nose_pink' : 'nose_dark'
        )}
      </g>
    );
  };

  /**
   * LEGENDARY & MYTHIC SPECIAL EFFECTS (Only for Legendary & Mythic Tiers!)
   * - Mythic Pets: Animated dynamic elemental/cyber aura particles + idle pulse animation
   * - Legendary Pets: Ambient legendary elemental visual effects (no extra body animation)
   */
  const renderTierSpecialEffects = () => {
    if (staticPreview) return null;

    // MYTHIC SPECIAL EFFECTS (Dynamic 2-frame particle aura)
    if (isMythic) {
      const shift = fxFrame === 1 ? -1 : 0;
      if (speciesId === 'ignis_rex') {
        return (
          <g>
            <Px x={2} y={4 + shift} w={2} h={2} c="#FACC15" />
            <Px x={3} y={3 + shift} w={1} h={1} c="#EF4444" />
            <Px x={28} y={4 - shift} w={2} h={2} c="#FACC15" />
            <Px x={29} y={3 - shift} w={1} h={1} c="#EF4444" />
            <Px x={5} y={21 + shift} w={2} h={2} c="#F97316" />
            <Px x={26} y={21 - shift} w={2} h={2} c="#F97316" />
          </g>
        );
      }
      if (speciesId === 'terradon') {
        return (
          <g>
            <Px x={3} y={5 + shift} w={2} h={2} c="#34D399" />
            <Px x={28} y={6 - shift} w={2} h={2} c="#FACC15" />
            <Px x={18} y={22} w={5} h={1} c="#BAE6FD" />
          </g>
        );
      }
      if (speciesId === 'celestia') {
        return (
          <g>
            <Px x={3} y={2 + shift} w={1} h={3} c="#FACC15" />
            <Px x={2} y={3 + shift} w={3} h={1} c="#FACC15" />
            <Px x={28} y={2 - shift} w={1} h={3} c="#EC4899" />
            <Px x={27} y={3 - shift} w={3} h={1} c="#EC4899" />
          </g>
        );
      }
      if (speciesId === 'aegis_wolf') {
        return (
          <g>
            <Px x={1} y={5 + shift} w={2} h={1} c="#38BDF8" />
            <Px x={29} y={5 - shift} w={2} h={1} c="#38BDF8" />
            <Px x={2} y={19 + shift} w={2} h={2} c="#38BDF8" />
            <Px x={28} y={19 - shift} w={2} h={2} c="#38BDF8" />
          </g>
        );
      }
      if (speciesId === 'obsidian_titan') {
        return (
          <g>
            <Px x={2} y={0 + shift} w={2} h={2} c="#F43F5E" />
            <Px x={28} y={0 - shift} w={2} h={2} c="#F43F5E" />
            <Px x={4} y={21 + shift} w={2} h={2} c="#FACC15" />
            <Px x={26} y={21 - shift} w={2} h={2} c="#FACC15" />
          </g>
        );
      }
    }

    // LEGENDARY SPECIAL EFFECTS ONLY (Elemental aura around the 5 Legendary animals)
    if (isLegendary) {
      if (speciesId === 'legendary_rhino') {
        // Golden Armor Bastion Sparks
        return (
          <g>
            <Px x={3} y={10} w={2} h={2} c="#FACC15" />
            <Px x={27} y={10} w={2} h={2} c="#FACC15" />
            <Px x={4} y={19} w={1} h={2} c="#FEF08A" />
            <Px x={27} y={19} w={1} h={2} c="#FEF08A" />
          </g>
        );
      }
      if (speciesId === 'legendary_snow_leopard') {
        // Himalayan Frost Crystals
        return (
          <g>
            <Px x={3} y={6} w={1} h={3} c="#38BDF8" />
            <Px x={2} y={7} w={3} h={1} c="#BAE6FD" />
            <Px x={27} y={8} w={1} h={3} c="#38BDF8" />
            <Px x={26} y={9} w={3} h={1} c="#BAE6FD" />
          </g>
        );
      }
      if (speciesId === 'legendary_tiger') {
        // Blazing Saffron Lightning Sparks
        return (
          <g>
            <Px x={3} y={8} w={2} h={1} c="#FACC15" />
            <Px x={4} y={9} w={2} h={1} c="#F97316" />
            <Px x={27} y={8} w={2} h={1} c="#FACC15" />
            <Px x={26} y={9} w={2} h={1} c="#F97316" />
          </g>
        );
      }
      if (speciesId === 'legendary_panda') {
        // Sacred Jade Bamboo Aura Wisps
        return (
          <g>
            <Px x={3} y={9} w={2} h={2} c="#10B981" />
            <Px x={4} y={8} w={1} h={1} c="#6EE7B7" />
            <Px x={28} y={6} w={2} h={2} c="#10B981" />
          </g>
        );
      }
      if (speciesId === 'legendary_axolotl') {
        // Xochimilco Golden Bubble & Starlight Shimmer
        return (
          <g>
            <Px x={2} y={5} w={2} h={2} c="#FACC15" />
            <Px x={28} y={5} w={2} h={2} c="#F472B6" />
            <Px x={4} y={18} w={2} h={2} c="#38BDF8" />
            <Px x={27} y={18} w={2} h={2} c="#38BDF8" />
          </g>
        );
      }
    }

    return null;
  };

  /**
   * HEALTH THRESHOLD SPRITE OVERLAYS (Thresholds: <=90, <=75, <=50, <=25)
   * Note: >90% has ZERO extra floating pixels!
   */
  const renderHealthThresholdDetails = () => {
    if (staticPreview) return null;

    if (isNormal90 && !isHappy) {
      return (
        <g>
          <Px x={22} y={8} w={1} h={2} c="#38BDF8" />
          <Px x={22} y={7} w={1} h={1} c="#E0F2FE" />
        </g>
      );
    }

    if (isTired75 && !isHappy) {
      return (
        <g>
          <Px x={19} y={13} w={4} h={2} c="#FDE68A" />
          <Px x={20} y={13} w={2} h={2} c="#D97706" />
          <Px x={24} y={8} w={2} h={3} c="#38BDF8" />
          <Px x={24} y={8} w={1} h={1} c="#E0F2FE" />
        </g>
      );
    }

    if (isInjured50) {
      return (
        <g>
          <Px x={13} y={6} w={6} h={2} c="#FDE68A" />
          <Px x={15} y={6} w={2} h={2} c="#D97706" />
          <Px x={12} y={17} w={7} h={5} c="#FFFFFF" />
          <Px x={15} y={18} w={1} h={3} c="#EF4444" />
          <Px x={14} y={19} w={3} h={1} c="#EF4444" />
        </g>
      );
    }

    if (isCritical25) {
      return (
        <g>
          <Px x={13} y={0} w={6} h={5} c="#FFFFFF" />
          <Px x={15} y={1} w={2} h={3} c="#EF4444" />
          <Px x={14} y={2} w={4} h={1} c="#EF4444" />
          <Px x={11} y={5} w={9} h={2} c="#38BDF8" />
          <Px x={12} y={5} w={7} h={1} c="#BAE6FD" />
          <Px x={10} y={16} w={11} h={6} c="#F8FAFC" />
          <Px x={11} y={17} w={9} h={1} c="#CBD5E1" />
          <Px x={11} y={20} w={9} h={1} c="#CBD5E1" />
        </g>
      );
    }

    return null;
  };

  const renderInteractionParticles = () => {
    if (staticPreview) return null;
    if (isDizzy) {
      return (
        <g>
          <Px x={6} y={1} w={2} h={2} c="#FACC15" />
          <Px x={15} y={0} w={2} h={2} c="#F43F5E" />
          <Px x={24} y={1} w={2} h={2} c="#FACC15" />
        </g>
      );
    }
    if (isHappy) {
      return (
        <g>
          <Px x={4} y={3} w={1} h={3} c="#FACC15" />
          <Px x={3} y={4} w={3} h={1} c="#FACC15" />
          <Px x={27} y={2} w={1} h={3} c="#EC4899" />
          <Px x={26} y={3} w={3} h={1} c="#EC4899" />
        </g>
      );
    }
    return null;
  };

  const healthPostureScale = (() => {
    const base = stageScale[stage];
    if (isCritical25) {
      return `translateY(4px) scale(${(base * 1.05).toFixed(2)}, ${(
        base * 0.8
      ).toFixed(2)})`;
    }
    if (isInjured50) {
      return `translateY(2.5px) scale(${(base * 0.98).toFixed(2)}, ${(
        base * 0.9
      ).toFixed(2)})`;
    }
    if (isTired75) {
      return `translateY(1px) scale(${(base * 0.99).toFixed(2)}, ${(
        base * 0.96
      ).toFixed(2)})`;
    }
    return `scale(${base})`;
  })();

  const healthFilter = isCritical25
    ? 'saturate(0.58) brightness(0.94)'
    : isInjured50
    ? 'saturate(0.76) brightness(0.97)'
    : isTired75
    ? 'saturate(0.9)'
    : 'none';

  return (
    <div
      className={`relative inline-flex items-end justify-center select-none pointer-events-none ${animClass} ${className}`}
      style={{
        width: size,
        height: size,
      }}
    >
      <div
        className="w-full h-full transition-transform duration-300 ease-out pointer-events-none"
        style={{ transform: autonomousTransform }}
      >
        <svg
          viewBox="0 0 32 28"
          shapeRendering="crispEdges"
          className="w-full h-full overflow-visible transition-all duration-300 pointer-events-none"
          style={{
            transform: healthPostureScale,
            transformOrigin: 'center bottom',
            filter: healthFilter,
          }}
          role="img"
          aria-label={`8-bit pixel ${speciesCfg.name}`}
        >
          {/* Exact Pixel Hitbox: Only painted pet body pixels respond to taps/clicks/swipes */}
          <g
            onPointerDown={onPetPointerDown}
            onPointerMove={onPetPointerMove}
            onPointerUp={onPetPointerUp}
            onClick={onPetClick}
            onDoubleClick={onPetDoubleClick}
            style={{
              pointerEvents: staticPreview ? 'none' : 'visiblePainted',
            }}
            className={staticPreview ? '' : 'cursor-pointer touch-none'}
          >
            {speciesId === 'ignis_rex' && renderIgnisRex()}
            {speciesId === 'terradon' && renderTerradon()}
            {speciesId === 'aegis_wolf' && renderAegisWolf()}
            {speciesId === 'celestia' && renderCelestia()}
            {speciesId === 'obsidian_titan' && renderObsidianTitan()}
            {speciesId !== 'ignis_rex' &&
              speciesId !== 'terradon' &&
              speciesId !== 'aegis_wolf' &&
              speciesId !== 'celestia' &&
              speciesId !== 'obsidian_titan' &&
              renderRealWorldAnimal()}
          </g>

          <g className="pointer-events-none">
            {renderTierSpecialEffects()}
            {renderHealthThresholdDetails()}
            {renderInteractionParticles()}
          </g>
        </svg>
      </div>
    </div>
  );
};
