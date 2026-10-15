import React from 'react';

interface RoomDecorSvgProps {
  decorId: string;
  size?: number;
  className?: string;
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

/**
 * Helper to draw crisp 8-bit pixel numbers ("10", "25", "50", "100") on Achievement Trophies
 */
const renderPixelInscription = (
  text: '10' | '25' | '50' | '100',
  x: number,
  y: number,
  color: string
) => {
  if (text === '10') {
    return (
      <g>
        {/* Digit '1' */}
        <Px x={x} y={y} w={1} h={5} c={color} />
        {/* Digit '0' */}
        <Px x={x + 2} y={y} w={3} h={1} c={color} />
        <Px x={x + 2} y={y + 4} w={3} h={1} c={color} />
        <Px x={x + 2} y={y} w={1} h={5} c={color} />
        <Px x={x + 4} y={y} w={1} h={5} c={color} />
      </g>
    );
  }
  if (text === '25') {
    return (
      <g>
        {/* Digit '2' */}
        <Px x={x} y={y} w={3} h={1} c={color} />
        <Px x={x + 2} y={y + 1} w={1} h={1} c={color} />
        <Px x={x} y={y + 2} w={3} h={1} c={color} />
        <Px x={x} y={y + 3} w={1} h={1} c={color} />
        <Px x={x} y={y + 4} w={3} h={1} c={color} />
        {/* Digit '5' */}
        <Px x={x + 4} y={y} w={3} h={1} c={color} />
        <Px x={x + 4} y={y + 1} w={1} h={1} c={color} />
        <Px x={x + 4} y={y + 2} w={3} h={1} c={color} />
        <Px x={x + 6} y={y + 3} w={1} h={1} c={color} />
        <Px x={x + 4} y={y + 4} w={3} h={1} c={color} />
      </g>
    );
  }
  if (text === '50') {
    return (
      <g>
        {/* Digit '5' */}
        <Px x={x} y={y} w={3} h={1} c={color} />
        <Px x={x} y={y + 1} w={1} h={1} c={color} />
        <Px x={x} y={y + 2} w={3} h={1} c={color} />
        <Px x={x + 2} y={y + 3} w={1} h={1} c={color} />
        <Px x={x} y={y + 4} w={3} h={1} c={color} />
        {/* Digit '0' */}
        <Px x={x + 4} y={y} w={3} h={1} c={color} />
        <Px x={x + 4} y={y + 4} w={3} h={1} c={color} />
        <Px x={x + 4} y={y} w={1} h={5} c={color} />
        <Px x={x + 6} y={y} w={1} h={5} c={color} />
      </g>
    );
  }
  // '100'
  return (
    <g>
      {/* '1' */}
      <Px x={x} y={y} w={1} h={5} c={color} />
      {/* '0' */}
      <Px x={x + 2} y={y} w={3} h={1} c={color} />
      <Px x={x + 2} y={y + 4} w={3} h={1} c={color} />
      <Px x={x + 2} y={y} w={1} h={5} c={color} />
      <Px x={x + 4} y={y} w={1} h={5} c={color} />
      {/* '0' */}
      <Px x={x + 6} y={y} w={3} h={1} c={color} />
      <Px x={x + 6} y={y + 4} w={3} h={1} c={color} />
      <Px x={x + 6} y={y} w={1} h={5} c={color} />
      <Px x={x + 8} y={y} w={1} h={5} c={color} />
    </g>
  );
};

export const RoomDecorSvg: React.FC<RoomDecorSvgProps> = ({
  decorId,
  size = 110,
  className = '',
}) => {
  const renderSprite = () => {
    switch (decorId) {
      // 1. LEFT WALL: Sunny Pixel Window (Default)
      case 'window_sunny':
        return (
          <g>
            <Px x={3} y={3} w={18} h={18} c="#78350F" />
            <Px x={4} y={4} w={16} h={16} c="#B45309" />
            <Px x={5} y={5} w={14} h={14} c="#7DD3FC" />
            <Px x={7} y={7} w={3} h={3} c="#FACC15" />
            <Px x={8} y={6} w={1} h={5} c="#FEF08A" />
            <Px x={13} y={9} w={4} h={2} c="#FFFFFF" />
            <Px x={14} y={8} w={2} h={1} c="#FFFFFF" />
            <Px x={6} y={14} w={5} h={2} c="#E0F2FE" />
            <Px x={5} y={16} w={14} h={3} c="#34D399" />
            <Px x={11} y={15} w={6} h={2} c="#10B981" />
            <Px x={11} y={5} w={2} h={14} c="#92400E" />
            <Px x={5} y={11} w={14} h={2} c="#92400E" />
            <Px x={2} y={20} w={20} h={2} c="#78350F" />
            <Px x={7} y={18} w={2} h={2} c="#F43F5E" />
            <Px x={15} y={18} w={2} h={2} c="#FACC15" />
          </g>
        );

      // 2. LEFT WALL: Knight Crest & Blades
      case 'wall_swords':
        return (
          <g>
            <Px x={3} y={3} w={3} h={3} c="#FACC15" />
            <Px x={5} y={5} w={3} h={3} c="#CBD5E1" />
            <Px x={7} y={7} w={3} h={3} c="#94A3B8" />
            <Px x={14} y={14} w={3} h={3} c="#CBD5E1" />
            <Px x={17} y={17} w={3} h={3} c="#FACC15" />

            <Px x={18} y={3} w={3} h={3} c="#FACC15" />
            <Px x={16} y={5} w={3} h={3} c="#CBD5E1" />
            <Px x={14} y={7} w={3} h={3} c="#94A3B8" />
            <Px x={7} y={14} w={3} h={3} c="#CBD5E1" />
            <Px x={4} y={17} w={3} h={3} c="#FACC15" />

            <Px x={7} y={6} w={10} h={10} c="#FACC15" />
            <Px x={8} y={16} w={8} h={3} c="#FACC15" />
            <Px x={10} y={19} w={4} h={2} c="#FACC15" />

            <Px x={8} y={7} w={8} h={8} c="#DC2626" />
            <Px x={9} y={15} w={6} h={3} c="#B91C1C" />
            <Px x={11} y={18} w={2} h={2} c="#991B1B" />

            <Px x={11} y={8} w={2} h={9} c="#FEF08A" />
            <Px x={9} y={11} w={6} h={2} c="#FEF08A" />
          </g>
        );

      // 3. LEFT WALL: Cyber Neon Game Sign
      case 'neon_arcade_sign':
        return (
          <g>
            <Px x={2} y={5} w={20} h={14} c="#0F172A" />
            <Px x={3} y={6} w={18} h={1} c="#38BDF8" />
            <Px x={3} y={17} w={18} h={1} c="#EC4899" />
            <Px x={3} y={6} w={1} h={12} c="#38BDF8" />
            <Px x={20} y={6} w={1} h={12} c="#EC4899" />
            <Px x={6} y={9} w={12} h={6} c="#E2E8F0" />
            <Px x={5} y={11} w={2} h={4} c="#CBD5E1" />
            <Px x={17} y={11} w={2} h={4} c="#CBD5E1" />
            <Px x={8} y={10} w={1} h={3} c="#1E293B" />
            <Px x={7} y={11} w={3} h={1} c="#1E293B" />
            <Px x={14} y={12} w={1} h={1} c="#F43F5E" />
            <Px x={16} y={11} w={1} h={1} c="#38BDF8" />
            <Px x={10} y={3} w={4} h={2} c="#FACC15" />
          </g>
        );

      // EXCLUSIVE LEFT WALL: Bronze "10" Task Plaque
      case 'plaque_tasks_10':
        return (
          <g>
            <Px x={4} y={3} w={16} h={16} c="#78350F" />
            <Px x={5} y={4} w={14} h={14} c="#D97706" />
            <Px x={6} y={5} w={12} h={12} c="#1E293B" />
            {/* Gold Corner Studs */}
            <Px x={5} y={4} w={2} h={2} c="#FACC15" />
            <Px x={17} y={4} w={2} h={2} c="#FACC15" />
            <Px x={5} y={16} w={2} h={2} c="#FACC15" />
            <Px x={17} y={16} w={2} h={2} c="#FACC15" />
            {/* Inscribed "10" */}
            {renderPixelInscription('10', 10, 9, '#FACC15')}
            <Px x={9} y={6} w={6} h={1} c="#FDE047" />
          </g>
        );

      // 4. RIGHT WALL: Alchemist Bookshelf (Default)
      case 'wood_bookshelf':
        return (
          <g>
            <Px x={4} y={8} w={3} h={7} c="#EF4444" />
            <Px x={5} y={9} w={1} h={5} c="#FCA5A5" />
            <Px x={7} y={7} w={3} h={8} c="#3B82F6" />
            <Px x={8} y={8} w={1} h={6} c="#93C5FD" />
            <Px x={10} y={9} w={3} h={6} c="#10B981" />
            <Px x={16} y={7} w={2} h={2} c="#D97706" />
            <Px x={15} y={9} w={4} h={2} c="#E0F2FE" />
            <Px x={14} y={11} w={6} h={4} c="#38BDF8" />
            <Px x={15} y={12} w={2} h={2} c="#BAE6FD" />
            <Px x={2} y={15} w={20} h={3} c="#78350F" />
            <Px x={3} y={15} w={18} h={1} c="#B45309" />
            <Px x={5} y={18} w={2} h={3} c="#451A03" />
            <Px x={17} y={18} w={2} h={3} c="#451A03" />
          </g>
        );

      // 5. RIGHT WALL: Golden Pendulum Clock
      case 'cuckoo_clock':
        return (
          <g>
            <Px x={10} y={2} w={4} h={2} c="#92400E" />
            <Px x={8} y={4} w={8} h={2} c="#78350F" />
            <Px x={6} y={6} w={12} h={10} c="#78350F" />
            <Px x={7} y={7} w={10} h={8} c="#B45309" />
            <Px x={9} y={8} w={6} h={6} c="#FEF9C3" />
            <Px x={11} y={9} w={1} h={3} c="#1E293B" />
            <Px x={12} y={11} w={2} h={1} c="#DC2626" />
            <Px x={11} y={16} w={2} h={4} c="#D97706" />
            <Px x={10} y={19} w={4} h={3} c="#FACC15" />
          </g>
        );

      // 6. RIGHT WALL: Solar Dragon Tapestry
      case 'dragon_banner':
        return (
          <g>
            <Px x={3} y={3} w={18} h={2} c="#FACC15" />
            <Px x={2} y={2} w={2} h={4} c="#D97706" />
            <Px x={20} y={2} w={2} h={4} c="#D97706" />
            <Px x={5} y={5} w={14} h={13} c="#BE123C" />
            <Px x={6} y={5} w={12} h={12} c="#E11D48" />
            <Px x={5} y={18} w={4} h={3} c="#BE123C" />
            <Px x={15} y={18} w={4} h={3} c="#BE123C" />
            <Px x={10} y={18} w={4} h={4} c="#FACC15" />
            <Px x={9} y={8} w={6} h={6} c="#FACC15" />
            <Px x={8} y={9} w={8} h={3} c="#FEF08A" />
            <Px x={11} y={7} w={2} h={8} c="#FACC15" />
          </g>
        );

      // EXCLUSIVE RIGHT WALL: Emerald "25" Streak Banner
      case 'banner_streak_25':
        return (
          <g>
            <Px x={3} y={2} w={18} h={2} c="#FACC15" />
            <Px x={5} y={4} w={14} h={14} c="#047857" />
            <Px x={6} y={4} w={12} h={13} c="#10B981" />
            <Px x={5} y={18} w={4} h={3} c="#047857" />
            <Px x={15} y={18} w={4} h={3} c="#047857" />
            <Px x={10} y={18} w={4} h={4} c="#FACC15" />
            {/* Golden Crown + "25" */}
            <Px x={9} y={6} w={6} h={2} c="#FEF08A" />
            {renderPixelInscription('25', 9, 10, '#FEF08A')}
          </g>
        );

      // 7. LEFT FLOOR: Pixel Monstera Plant (Default)
      case 'potted_sprout':
        return (
          <g>
            <Px x={6} y={21} w={12} h={2} c="rgba(15,23,42,0.16)" />
            <Px x={7} y={14} w={10} h={2} c="#EA580C" />
            <Px x={8} y={16} w={8} h={6} c="#C2410C" />
            <Px x={9} y={16} w={6} h={5} c="#EA580C" />
            <Px x={11} y={8} w={2} h={6} c="#065F46" />
            <Px x={5} y={7} w={6} h={5} c="#10B981" />
            <Px x={6} y={8} w={4} h={3} c="#34D399" />
            <Px x={13} y={6} w={6} h={5} c="#059669" />
            <Px x={14} y={7} w={4} h={3} c="#34D399" />
            <Px x={9} y={3} w={6} h={5} c="#10B981" />
            <Px x={11} y={4} w={3} h={3} c="#6EE7B7" />
          </g>
        );

      // 8. LEFT FLOOR: Hero Training Dummy
      case 'training_dummy':
        return (
          <g>
            <Px x={6} y={21} w={12} h={2} c="rgba(15,23,42,0.18)" />
            <Px x={7} y={20} w={10} h={2} c="#78350F" />
            <Px x={11} y={5} w={2} h={16} c="#92400E" />
            <Px x={4} y={10} w={16} h={2} c="#92400E" />
            <Px x={9} y={4} w={6} h={5} c="#FDE047" />
            <Px x={9} y={5} w={6} h={1} c="#EF4444" />
            <Px x={15} y={5} w={2} h={2} c="#EF4444" />
            <Px x={8} y={9} w={8} h={8} c="#D97706" />
            <Px x={9} y={10} w={6} h={6} c="#F59E0B" />
            <Px x={10} y={11} w={4} h={4} c="#EF4444" />
            <Px x={11} y={12} w={2} h={2} c="#FFFFFF" />
          </g>
        );

      // 9. LEFT FLOOR: Retro 8-Bit Arcade Cabinet
      case 'arcade_cabinet':
        return (
          <g>
            <Px x={5} y={21} w={14} h={2} c="rgba(15,23,42,0.2)" />
            <Px x={6} y={3} w={12} h={19} c="#1E1B4B" />
            <Px x={7} y={4} w={10} h={17} c="#4338CA" />
            <Px x={6} y={3} w={12} h={3} c="#FACC15" />
            <Px x={8} y={4} w={8} h={1} c="#EF4444" />
            <Px x={8} y={7} w={8} h={6} c="#38BDF8" />
            <Px x={9} y={8} w={3} h={2} c="#BAE6FD" />
            <Px x={13} y={10} w={2} h={2} c="#F43F5E" />
            <Px x={5} y={13} w={14} h={2} c="#EC4899" />
            <Px x={9} y={11} w={1} h={2} c="#FACC15" />
            <Px x={9} y={11} w={2} h={1} c="#EF4444" />
            <Px x={10} y={16} w={4} h={4} c="#0F172A" />
            <Px x={11} y={17} w={2} h={2} c="#F59E0B" />
          </g>
        );

      // EXCLUSIVE LEFT FLOOR: Golden "25" Knight Statue
      case 'statue_tasks_25':
        return (
          <g>
            <Px x={5} y={21} w={14} h={2} c="rgba(15,23,42,0.2)" />
            {/* Golden Knight Figure */}
            <Px x={9} y={2} w={6} h={4} c="#FACC15" />
            <Px x={10} y={3} w={4} h={1} c="#78350F" />
            <Px x={7} y={6} w={10} h={7} c="#EAB308" />
            <Px x={8} y={7} w={8} h={5} c="#FEF08A" />
            <Px x={17} y={3} w={2} h={10} c="#38BDF8" />
            {/* Stone Pedestal Base with "25" */}
            <Px x={5} y={13} w={14} h={9} c="#334155" />
            <Px x={6} y={14} w={12} h={7} c="#1E293B" />
            {renderPixelInscription('25', 9, 15, '#FACC15')}
          </g>
        );

      // EXCLUSIVE LEFT FLOOR: Royal "50" Crown Pedestal
      case 'pedestal_tasks_50':
        return (
          <g>
            <Px x={5} y={21} w={14} h={2} c="rgba(15,23,42,0.2)" />
            {/* Royal Golden Crown */}
            <Px x={7} y={3} w={2} h={4} c="#FACC15" />
            <Px x={11} y={2} w={2} h={5} c="#FEF08A" />
            <Px x={15} y={3} w={2} h={4} c="#FACC15" />
            <Px x={7} y={6} w={10} h={3} c="#EAB308" />
            <Px x={11} y={7} w={2} h={1} c="#E11D48" />
            {/* Velvet Pillow */}
            <Px x={6} y={9} w={12} h={3} c="#BE123C" />
            {/* Marble Pillar with "50" */}
            <Px x={6} y={12} w={12} h={10} c="#475569" />
            <Px x={7} y={13} w={10} h={8} c="#1E293B" />
            {renderPixelInscription('50', 9, 15, '#FEF08A')}
          </g>
        );

      // 10. RIGHT FLOOR: Plush Pet Bed & Bowl (Default)
      case 'cozy_cushion':
        return (
          <g>
            <Px x={3} y={20} w={18} h={2} c="rgba(15,23,42,0.16)" />
            <Px x={3} y={14} w={13} h={6} c="#E11D48" />
            <Px x={4} y={13} w={11} h={6} c="#FB7185" />
            <Px x={5} y={14} w={9} h={4} c="#FFE4E6" />
            <Px x={7} y={15} w={5} h={2} c="#FDA4AF" />
            <Px x={16} y={17} w={6} h={3} c="#D97706" />
            <Px x={17} y={17} w={4} h={2} c="#FACC15" />
            <Px x={17} y={15} w={4} h={2} c="#78350F" />
            <Px x={18} y={14} w={2} h={1} c="#B45309" />
          </g>
        );

      // 11. RIGHT FLOOR: Astral Crystal Pillar
      case 'mana_crystal_lamp':
        return (
          <g>
            <Px x={6} y={21} w={12} h={2} c="rgba(15,23,42,0.18)" />
            <Px x={7} y={19} w={10} h={3} c="#475569" />
            <Px x={9} y={13} w={6} h={6} c="#64748B" />
            <Px x={8} y={12} w={8} h={2} c="#94A3B8" />
            <Px x={11} y={3} w={2} h={8} c="#A855F7" />
            <Px x={9} y={5} w={6} h={4} c="#C084FC" />
            <Px x={10} y={6} w={4} h={2} c="#F3E8FF" />
            <Px x={6} y={4} w={1} h={1} c="#38BDF8" />
            <Px x={17} y={6} w={1} h={1} c="#FACC15" />
          </g>
        );

      // EXCLUSIVE RIGHT FLOOR: Golden "10" Streak Trophy (10-Day Streak Exclusive!)
      case 'trophy_streak_10':
        return (
          <g>
            <Px x={5} y={21} w={14} h={2} c="rgba(15,23,42,0.22)" />
            {/* Trophy Handles */}
            <Px x={4} y={5} w={2} h={5} c="#D97706" />
            <Px x={18} y={5} w={2} h={5} c="#D97706" />
            {/* Golden Trophy Cup */}
            <Px x={6} y={3} w={12} h={9} c="#FACC15" />
            <Px x={7} y={4} w={10} h={7} c="#FEF08A" />
            {/* Bold "10" Written Right on the Golden Trophy Cup! */}
            {renderPixelInscription('10', 10, 5, '#92400E')}
            {/* Trophy Stem & Pedestal */}
            <Px x={10} y={12} w={4} h={4} c="#D97706" />
            <Px x={6} y={16} w={12} h={6} c="#451A03" />
            <Px x={8} y={18} w={8} h={2} c="#FACC15" />
          </g>
        );

      // EXCLUSIVE RIGHT FLOOR: Diamond "50" Streak Trophy
      case 'trophy_streak_50':
        return (
          <g>
            <Px x={5} y={21} w={14} h={2} c="rgba(15,23,42,0.22)" />
            {/* Diamond Wing Handles */}
            <Px x={3} y={4} w={3} h={6} c="#38BDF8" />
            <Px x={18} y={4} w={3} h={6} c="#38BDF8" />
            {/* Diamond Chalice */}
            <Px x={6} y={3} w={12} h={9} c="#0284C7" />
            <Px x={7} y={4} w={10} h={7} c="#E0F2FE" />
            {/* Bold "50" Written on the Diamond Trophy */}
            {renderPixelInscription('50', 9, 5, '#0F172A')}
            <Px x={10} y={12} w={4} h={4} c="#38BDF8" />
            <Px x={6} y={16} w={12} h={6} c="#1E293B" />
            <Px x={8} y={18} w={8} h={2} c="#38BDF8" />
          </g>
        );

      // EXCLUSIVE RIGHT FLOOR: Mythic "100" Centurion Trophy
      case 'trophy_streak_100':
        return (
          <g>
            <Px x={4} y={21} w={16} h={2} c="rgba(15,23,42,0.24)" />
            {/* Mythic Golden Wings */}
            <Px x={2} y={4} w={4} h={7} c="#FACC15" />
            <Px x={18} y={4} w={4} h={7} c="#FACC15" />
            {/* Crimson & Gold Obelisk */}
            <Px x={6} y={2} w={12} h={12} c="#BE123C" />
            <Px x={7} y={3} w={10} h={10} c="#1E1B4B" />
            {/* Bold "100" Written Across the Mythic Trophy */}
            {renderPixelInscription('100', 8, 5, '#FEF08A')}
            <Px x={5} y={14} w={14} h={8} c="#FACC15" />
            <Px x={7} y={16} w={10} h={4} c="#78350F" />
          </g>
        );

      // --- NEW MOTIVATIONAL, PLUSHIE, TOY & BOOK SPRITES ---
      // 13. Motivation Pennant Banner (Wall)
      case 'motivation_banner':
        return (
          <g>
            {/* Hanging cord and rod */}
            <Px x={5} y={3} w={14} h={1} c="#78350F" />
            <Px x={4} y={2} w={2} h={3} c="#F59E0B" />
            <Px x={18} y={2} w={2} h={3} c="#F59E0B" />
            {/* Red Pennant Body */}
            <Px x={5} y={4} w={14} h={12} c="#DC2626" />
            <Px x={6} y={5} w={12} h={10} c="#B91C1C" />
            {/* Golden Border Inset */}
            <Px x={6} y={5} w={12} h={1} c="#FACC15" />
            <Px x={6} y={14} w={12} h={1} c="#FACC15" />
            {/* Star of Power & Motivation in Center */}
            <Px x={11} y={7} w={2} h={6} c="#FEF08A" />
            <Px x={9} y={9} w={6} h={2} c="#FEF08A" />
            <Px x={10} y={8} w={4} h={4} c="#FACC15" />
            <Px x={11} y={9} w={2} h={2} c="#FFFFFF" />
            {/* Bottom triangular cuts and golden tassels */}
            <Px x={7} y={16} w={4} h={3} c="#DC2626" />
            <Px x={13} y={16} w={4} h={3} c="#DC2626" />
            <Px x={8} y={19} w={2} h={2} c="#F59E0B" />
            <Px x={14} y={19} w={2} h={2} c="#F59E0B" />
          </g>
        );

      // 14. Stack of Mastery Books (Wall / Floor)
      case 'spellbook_stack':
        return (
          <g>
            <Px x={3} y={21} w={18} h={2} c="rgba(15,23,42,0.18)" />
            {/* Bottom Book: Royal Sapphire */}
            <Px x={4} y={17} w={16} h={4} c="#1E3A8A" />
            <Px x={5} y={18} w={14} h={2} c="#FEF3C7" />
            <Px x={4} y={17} w={2} h={4} c="#FACC15" />
            {/* Middle Book: Emerald Tome */}
            <Px x={5} y={12} w={14} h={5} c="#065F46" />
            <Px x={6} y={13} w={12} h={3} c="#FEF3C7" />
            <Px x={5} y={12} w={2} h={5} c="#34D399" />
            {/* Top Book: Ruby Focus Guide */}
            <Px x={6} y={8} w={12} h={4} c="#991B1B" />
            <Px x={7} y={9} w={10} h={2} c="#FEF3C7" />
            <Px x={6} y={8} w={2} h={4} c="#F87171" />
            {/* Golden Ribbon Bookmark hanging out */}
            <Px x={13} y={7} w={2} h={10} c="#FACC15" />
            <Px x={14} y={17} w={2} h={2} c="#F59E0B" />
          </g>
        );

      // 15. Late-Night Study Lamp & Planner (Wall)
      case 'wisdom_lamp':
        return (
          <g>
            {/* Desk Surface / Base */}
            <Px x={4} y={20} w={16} h={3} c="#78350F" />
            {/* Open Task Planner Notebook */}
            <Px x={5} y={17} w={8} h={3} c="#F8FAFC" />
            <Px x={6} y={18} w={6} h={1} c="#38BDF8" />
            <Px x={14} y={16} w={1} h={4} c="#64748B" />
            {/* Lamp Base & Brass Arm */}
            <Px x={15} y={19} w={4} h={2} c="#B45309" />
            <Px x={17} y={10} w={2} h={9} c="#D97706" />
            <Px x={12} y={9} w={6} h={2} c="#D97706" />
            {/* Emerald Glass Banker Shade */}
            <Px x={9} y={8} w={8} h={4} c="#047857" />
            <Px x={10} y={9} w={6} h={2} c="#10B981" />
            {/* Warm Glowing Light */}
            <Px x={10} y={12} w={6} h={2} c="#FEF08A" />
            <Px x={9} y={14} w={8} h={3} c="rgba(254,240,138,0.3)" />
          </g>
        );

      // 16. Focus Chrono Hourglass (Floor Left)
      case 'power_hourglass':
        return (
          <g>
            <Px x={4} y={21} w={16} h={2} c="rgba(15,23,42,0.18)" />
            {/* Top & Bottom Brass Plates */}
            <Px x={5} y={3} w={14} h={3} c="#D97706" />
            <Px x={6} y={2} w={12} h={1} c="#B45309" />
            <Px x={5} y={18} w={14} h={3} c="#D97706" />
            <Px x={6} y={21} w={12} h={1} c="#B45309" />
            {/* 4 Brass Corner Pillars */}
            <Px x={5} y={6} w={2} h={12} c="#B45309" />
            <Px x={17} y={6} w={2} h={12} c="#B45309" />
            {/* Glass Bulb Top & Bottom */}
            <Px x={7} y={6} w={10} h={5} c="#BAE6FD" />
            <Px x={9} y={11} w={6} h={2} c="#E0F2FE" />
            <Px x={7} y={13} w={10} h={5} c="#BAE6FD" />
            {/* Electric Blue Mystic Stardust Sand */}
            <Px x={8} y={7} w={8} h={3} c="#0284C7" />
            <Px x={11} y={10} w={2} h={5} c="#38BDF8" />
            <Px x={8} y={15} w={8} h={3} c="#0284C7" />
            <Px x={10} y={14} w={4} h={2} c="#38BDF8" />
            <Px x={11} y={12} w={2} h={1} c="#FFFFFF" />
          </g>
        );

      // 17. Bouncy Slime Plush (Floor Left)
      case 'slime_plushie':
        return (
          <g>
            <Px x={5} y={20} w={14} h={2} c="rgba(15,23,42,0.2)" />
            {/* Slime Jelly Body */}
            <Px x={6} y={9} w={12} h={11} c="#059669" />
            <Px x={5} y={11} w={14} h={8} c="#10B981" />
            <Px x={7} y={10} w={10} h={8} c="#34D399" />
            {/* Head highlight shine */}
            <Px x={7} y={9} w={4} h={3} c="#A7F3D0" />
            <Px x={7} y={9} w={2} h={1} c="#FFFFFF" />
            {/* Sparkling Big Eyes */}
            <Px x={8} y={13} w={2} h={3} c="#064E3B" />
            <Px x={8} y={13} w={1} h={1} c="#FFFFFF" />
            <Px x={14} y={13} w={2} h={3} c="#064E3B" />
            <Px x={14} y={13} w={1} h={1} c="#FFFFFF" />
            {/* Rosy Cheeks */}
            <Px x={6} y={15} w={2} h={1} c="#F472B6" />
            <Px x={16} y={15} w={2} h={1} c="#F472B6" />
            {/* Tiny Golden Party Crown */}
            <Px x={10} y={6} w={4} h={3} c="#FACC15" />
            <Px x={10} y={5} w={1} h={1} c="#FEF08A" />
            <Px x={13} y={5} w={1} h={1} c="#FEF08A" />
          </g>
        );

      // 18. Cozy Teddy Plushie (Floor Right)
      case 'bear_plushie':
        return (
          <g>
            <Px x={5} y={20} w={14} h={2} c="rgba(15,23,42,0.2)" />
            {/* Round Ears */}
            <Px x={5} y={5} w={4} h={4} c="#78350F" />
            <Px x={6} y={6} w={2} h={2} c="#FDE68A" />
            <Px x={15} y={5} w={4} h={4} c="#78350F" />
            <Px x={16} y={6} w={2} h={2} c="#FDE68A" />
            {/* Head */}
            <Px x={6} y={7} w={12} h={8} c="#92400E" />
            <Px x={7} y={8} w={10} h={6} c="#B45309" />
            {/* Snout */}
            <Px x={9} y={11} w={6} h={4} c="#FEF3C7" />
            <Px x={11} y={11} w={2} h={1} c="#451A03" />
            {/* Button Eyes */}
            <Px x={8} y={10} w={2} h={2} c="#451A03" />
            <Px x={8} y={10} w={1} h={1} c="#FFFFFF" />
            <Px x={14} y={10} w={2} h={2} c="#451A03" />
            <Px x={14} y={10} w={1} h={1} c="#FFFFFF" />
            {/* Red Bowtie */}
            <Px x={10} y={15} w={4} h={2} c="#EF4444" />
            <Px x={9} y={15} w={1} h={2} c="#DC2626" />
            <Px x={14} y={15} w={1} h={2} c="#DC2626" />
            <Px x={11} y={15} w={2} h={2} c="#FEE2E2" />
            {/* Body and Little Paws */}
            <Px x={7} y={16} w={10} h={5} c="#92400E" />
            <Px x={5} y={16} w={2} h={3} c="#78350F" />
            <Px x={17} y={16} w={2} h={3} c="#78350F" />
            <Px x={7} y={19} w={3} h={2} c="#D97706" />
            <Px x={14} y={19} w={3} h={2} c="#D97706" />
          </g>
        );

      // 19. Willpower Eternal Flame Monument (Floor Right)
      case 'determination_trophy':
        return (
          <g>
            <Px x={3} y={21} w={18} h={2} c="rgba(15,23,42,0.22)" />
            {/* Tiered Obsidian Stone Pedestal */}
            <Px x={5} y={19} w={14} h={2} c="#0F172A" />
            <Px x={6} y={17} w={12} h={2} c="#1E293B" />
            <Px x={7} y={15} w={10} h={2} c="#334155" />
            {/* Golden Brazier Cup */}
            <Px x={6} y={14} w={12} h={2} c="#D97706" />
            <Px x={7} y={13} w={10} h={2} c="#F59E0B" />
            <Px x={8} y={13} w={8} h={1} c="#FEF08A" />
            {/* Roaring Layered Flame of Willpower */}
            {/* Outer Crimson Heat */}
            <Px x={8} y={5} w={8} h={8} c="#DC2626" />
            <Px x={9} y={3} w={6} h={10} c="#EF4444" />
            {/* Middle Fierce Orange */}
            <Px x={9} y={5} w={6} h={7} c="#F97316" />
            {/* Inner Bright Golden Core */}
            <Px x={10} y={7} w={4} h={5} c="#FACC15" />
            <Px x={11} y={9} w={2} h={3} c="#FEF08A" />
            <Px x={11} y={10} w={2} h={2} c="#FFFFFF" />
            {/* Flickering floating embers */}
            <Px x={7} y={4} w={1} h={1} c="#F97316" />
            <Px x={16} y={3} w={1} h={1} c="#FACC15" />
          </g>
        );

      // 20. Playful Yarn & Bell Toy (Floor Right)
      case 'pixel_cat_toy':
        return (
          <g>
            <Px x={4} y={21} w={16} h={2} c="rgba(15,23,42,0.18)" />
            {/* Rainbow Yarn Ball */}
            <Px x={6} y={11} w={10} h={10} c="#EC4899" />
            <Px x={7} y={10} w={8} h={11} c="#DB2777" />
            <Px x={8} y={11} w={6} h={8} c="#F472B6" />
            {/* Multi-color Thread Strands */}
            <Px x={7} y={13} w={8} h={2} c="#38BDF8" />
            <Px x={9} y={11} w={2} h={8} c="#FACC15" />
            {/* Trailing loose yarn strand */}
            <Px x={15} y={18} w={3} h={1} c="#EC4899" />
            <Px x={17} y={19} w={3} h={1} c="#EC4899" />
            {/* Brass Bell Toy */}
            <Px x={17} y={15} w={4} h={4} c="#D97706" />
            <Px x={18} y={14} w={2} h={1} c="#FACC15" />
            <Px x={18} y={16} w={2} h={1} c="#451A03" />
            <Px x={18} y={17} w={2} h={1} c="#FEF08A" />
          </g>
        );

      // 12. MILESTONE DECOR: 7-Day Bronze Spark Pennant
      case 'trophy_streak_7':
        return (
          <g>
            <Px x={5} y={3} w={14} h={2} c="#78350F" />
            <Px x={6} y={5} w={12} h={10} c="#B45309" />
            <Px x={7} y={6} w={10} h={8} c="#D97706" />
            <Px x={8} y={15} w={8} h={4} c="#B45309" />
            <Px x={10} y={19} w={4} h={3} c="#B45309" />
            <Px x={11} y={8} w={2} h={6} c="#FEF08A" />
            <Px x={9} y={10} w={6} h={2} c="#FEF08A" />
          </g>
        );

      // 13. MILESTONE DECOR: 14-Day Scholar's Focus Clock
      case 'clock_streak_14':
        return (
          <g>
            <Px x={5} y={4} w={14} h={14} c="#78350F" />
            <Px x={6} y={5} w={12} h={12} c="#D97706" />
            <Px x={7} y={6} w={10} h={10} c="#FEF9C3" />
            <Px x={11} y={7} w={2} h={4} c="#451A03" />
            <Px x={11} y={10} w={4} h={2} c="#451A03" />
            <Px x={11} y={18} w={2} h={5} c="#D97706" />
            <Px x={10} y={22} w={4} h={2} c="#FACC15" />
          </g>
        );

      // 14. MILESTONE DECOR: 30-Day Silver Month Sovereign Pillar
      case 'pillar_streak_30':
        return (
          <g>
            <Px x={4} y={20} w={16} h={3} c="#334155" />
            <Px x={6} y={18} w={12} h={2} c="#64748B" />
            <Px x={7} y={6} w={10} h={12} c="#94A3B8" />
            <Px x={8} y={7} w={8} h={10} c="#CBD5E1" />
            <Px x={9} y={8} w={6} h={8} c="#E2E8F0" />
            {/* Silver Moon Sigil */}
            <Px x={10} y={10} w={4} h={4} c="#38BDF8" />
            <Px x={12} y={10} w={2} h={4} c="#E2E8F0" />
            <Px x={6} y={4} w={12} h={2} c="#E2E8F0" />
            <Px x={9} y={2} w={6} h={2} c="#F8FAFC" />
          </g>
        );

      // 15. MILESTONE DECOR: 60-Day Emerald Hourglass of Eternity
      case 'hourglass_streak_60':
        return (
          <g>
            <Px x={4} y={21} w={16} h={2} c="rgba(15,23,42,0.2)" />
            <Px x={5} y={4} w={14} h={2} c="#065F46" />
            <Px x={6} y={6} w={12} h={1} c="#047857" />
            <Px x={7} y={7} w={10} h={3} c="#A7F3D0" />
            <Px x={8} y={8} w={8} h={2} c="#10B981" />
            <Px x={10} y={10} w={4} h={4} c="#A7F3D0" />
            <Px x={11} y={11} w={2} h={2} c="#34D399" />
            <Px x={7} y={14} w={10} h={3} c="#A7F3D0" />
            <Px x={8} y={15} w={8} h={3} c="#059669" />
            <Px x={6} y={17} w={12} h={1} c="#047857" />
            <Px x={5} y={18} w={14} h={2} c="#065F46" />
          </g>
        );

      // 16. MILESTONE DECOR: 90-Day Grand Master's Star Chart
      case 'starchart_streak_90':
        return (
          <g>
            <Px x={4} y={4} w={16} h={16} c="#78350F" />
            <Px x={5} y={5} w={14} h={14} c="#FEF3C7" />
            <Px x={6} y={6} w={12} h={12} c="#0F172A" />
            {/* Constellation Stars */}
            <Px x={8} y={8} w={2} h={2} c="#FACC15" />
            <Px x={14} y={9} w={2} h={2} c="#38BDF8" />
            <Px x={11} y={12} w={2} h={2} c="#FEF08A" />
            <Px x={9} y={15} w={2} h={2} c="#F43F5E" />
            <Px x={15} y={15} w={2} h={2} c="#A78BFA" />
            {/* Thin Connecting Starlight Lines */}
            <Px x={9} y={9} w={4} h={1} c="#475569" />
            <Px x={12} y={11} w={1} h={3} c="#475569" />
            <Px x={13} y={14} w={2} h={1} c="#475569" />
          </g>
        );

      // 17. MILESTONE DECOR: 120-Day Sunfire Guardian Altar
      case 'altar_streak_120':
        return (
          <g>
            <Px x={4} y={20} w={16} h={3} c="#78350F" />
            <Px x={5} y={18} w={14} h={2} c="#B45309" />
            <Px x={7} y={11} w={10} h={7} c="#D97706" />
            <Px x={6} y={9} w={12} h={2} c="#F59E0B" />
            {/* Perpetual Golden Sunfire */}
            <Px x={9} y={6} w={6} h={3} c="#EF4444" />
            <Px x={10} y={4} w={4} h={3} c="#F97316" />
            <Px x={11} y={2} w={2} h={3} c="#FDE047" />
          </g>
        );

      // 18. MILESTONE DECOR: 250-Day Obsidian Dragon Pillar
      case 'pillar_streak_250':
        return (
          <g>
            <Px x={4} y={21} w={16} h={2} c="#0F172A" />
            <Px x={5} y={18} w={14} h={3} c="#1E293B" />
            <Px x={7} y={6} w={10} h={12} c="#0F172A" />
            <Px x={8} y={7} w={8} h={10} c="#1E293B" />
            {/* Glowing Volcanic Dragon Runes */}
            <Px x={9} y={8} w={2} h={2} c="#EF4444" />
            <Px x={13} y={10} w={2} h={2} c="#F97316" />
            <Px x={9} y={13} w={2} h={2} c="#FACC15" />
            <Px x={12} y={15} w={2} h={2} c="#EF4444" />
            {/* Dragon Wing Crest at top */}
            <Px x={5} y={4} w={14} h={2} c="#334155" />
            <Px x={6} y={2} w={12} h={2} c="#EF4444" />
          </g>
        );

      // 19. MILESTONE DECOR: 365-Day Solar Crown of the Century
      case 'crown_streak_365':
        return (
          <g>
            {/* Sunburst Rays */}
            <Px x={11} y={1} w={2} h={3} c="#FDE047" />
            <Px x={6} y={3} w={2} h={2} c="#FACC15" />
            <Px x={16} y={3} w={2} h={2} c="#FACC15" />
            <Px x={3} y={8} w={2} h={2} c="#F59E0B" />
            <Px x={19} y={8} w={2} h={2} c="#F59E0B" />
            {/* Imperial Crown Base */}
            <Px x={4} y={16} w={16} h={4} c="#B45309" />
            <Px x={5} y={17} w={14} h={2} c="#F59E0B" />
            {/* Crown Peaks */}
            <Px x={5} y={11} w={3} h={5} c="#FACC15" />
            <Px x={10} y={8} w={4} h={8} c="#FEF08A" />
            <Px x={16} y={11} w={3} h={5} c="#FACC15" />
            {/* Embedded Mythic Rubies & Sapphires */}
            <Px x={7} y={17} w={2} h={2} c="#EF4444" />
            <Px x={11} y={17} w={2} h={2} c="#38BDF8" />
            <Px x={15} y={17} w={2} h={2} c="#A855F7" />
          </g>
        );

      // 20. MILESTONE DECOR: 25-Quest Novice Vanguard Shield
      case 'shield_tasks_25':
        return (
          <g>
            <Px x={6} y={4} w={12} h={3} c="#334155" />
            <Px x={5} y={7} w={14} h={8} c="#64748B" />
            <Px x={6} y={8} w={12} h={6} c="#94A3B8" />
            <Px x={7} y={15} w={10} h={3} c="#64748B" />
            <Px x={9} y={18} w={6} h={3} c="#475569" />
            <Px x={11} y={21} w={2} h={2} c="#334155" />
            {/* Center Blue Heraldic Cross */}
            <Px x={11} y={9} w={2} h={7} c="#2563EB" />
            <Px x={8} y={11} w={8} h={2} c="#2563EB" />
          </g>
        );

      // 21. MILESTONE DECOR: 50-Quest Wisdom Study Bookshelf
      case 'shelf_tasks_50':
        return (
          <g>
            <Px x={4} y={6} w={16} h={2} c="#78350F" />
            <Px x={4} y={15} w={16} h={2} c="#78350F" />
            <Px x={4} y={6} w={2} h={11} c="#78350F" />
            <Px x={18} y={6} w={2} h={11} c="#78350F" />
            {/* Top Shelf Books */}
            <Px x={6} y={8} w={2} h={7} c="#DC2626" />
            <Px x={8} y={9} w={3} h={6} c="#2563EB" />
            <Px x={11} y={8} w={2} h={7} c="#16A34A" />
            <Px x={13} y={10} w={3} h={5} c="#D97706" />
            {/* Potion vial */}
            <Px x={16} y={11} w={2} h={4} c="#A855F7" />
          </g>
        );

      // 22. MILESTONE DECOR: 100-Quest Century Stone Monolith
      case 'monolith_tasks_100':
        return (
          <g>
            <Px x={5} y={20} w={14} h={3} c="#1E293B" />
            <Px x={6} y={5} w={12} h={15} c="#475569" />
            <Px x={7} y={6} w={10} h={13} c="#64748B" />
            <Px x={8} y={7} w={8} h={11} c="#94A3B8" />
            {/* Century 100 Carving */}
            <Px x={9} y={9} w={2} h={6} c="#FEF08A" />
            <Px x={12} y={9} w={3} h={6} c="#FEF08A" />
            <Px x={13} y={11} w={1} h={2} c="#94A3B8" />
          </g>
        );

      // 23. MILESTONE DECOR: 250-Quest Golden Taskmaster Obelisk
      case 'obelisk_tasks_250':
        return (
          <g>
            <Px x={4} y={20} w={16} h={3} c="#78350F" />
            <Px x={6} y={18} w={12} h={2} c="#B45309" />
            <Px x={7} y={6} w={10} h={12} c="#D97706" />
            <Px x={8} y={7} w={8} h={10} c="#F59E0B" />
            <Px x={9} y={8} w={6} h={8} c="#FACC15" />
            {/* Pyramidion Top */}
            <Px x={8} y={4} w={8} h={2} c="#FACC15" />
            <Px x={10} y={2} w={4} h={2} c="#FEF08A" />
            <Px x={11} y={1} w={2} h={1} c="#FFFFFF" />
          </g>
        );

      // 24. MILESTONE DECOR: 500-Quest Order of the Griffin Crest
      case 'crest_tasks_500':
        return (
          <g>
            <Px x={5} y={4} w={14} h={14} c="#7C2D12" />
            <Px x={6} y={5} w={12} h={12} c="#991B1B" />
            {/* Griffin Golden Wings & Head */}
            <Px x={8} y={7} w={8} h={3} c="#FACC15" />
            <Px x={10} y={10} w={4} h={5} c="#F59E0B" />
            <Px x={7} y={9} w={3} h={5} c="#FEF08A" />
            <Px x={14} y={9} w={3} h={5} c="#FEF08A" />
            <Px x={11} y={15} w={2} h={2} c="#F59E0B" />
          </g>
        );

      // 25. MILESTONE DECOR: 1,000-Quest Imperial Sovereign Armory
      case 'armory_tasks_1000':
        return (
          <g>
            <Px x={3} y={20} w={18} h={3} c="#334155" />
            <Px x={5} y={6} w={14} h={2} c="#64748B" />
            <Px x={5} y={8} w={2} h={12} c="#475569" />
            <Px x={17} y={8} w={2} h={12} c="#475569" />
            {/* Hanging Golden Battleaxe & Broadsword */}
            <Px x={8} y={8} w={2} h={10} c="#94A3B8" />
            <Px x={7} y={9} w={4} h={3} c="#FACC15" />
            <Px x={14} y={8} w={2} h={10} c="#94A3B8" />
            <Px x={13} y={16} w={4} h={2} c="#FACC15" />
            {/* Imperial Helm */}
            <Px x={10} y={10} w={4} h={5} c="#F59E0B" />
            <Px x={11} y={9} w={2} h={1} c="#DC2626" />
          </g>
        );

      // 26. MILESTONE DECOR: 2,500-Quest Dragon Knight War Banner
      case 'banner_tasks_2500':
        return (
          <g>
            <Px x={4} y={20} w={16} h={3} c="#0F172A" />
            <Px x={11} y={3} w={2} h={17} c="#94A3B8" />
            <Px x={6} y={3} w={12} h={2} c="#FACC15" />
            <Px x={6} y={5} w={10} h={13} c="#7F1D1D" />
            <Px x={7} y={6} w={8} h={11} c="#991B1B" />
            {/* Golden Dragon Wyvern Sigil */}
            <Px x={9} y={8} w={4} h={3} c="#FACC15" />
            <Px x={8} y={11} w={6} h={4} c="#F59E0B" />
            <Px x={10} y={15} w={2} h={2} c="#FEF08A" />
          </g>
        );

      // 27. MILESTONE DECOR: 5,000-Quest Pantheon Sovereign Tapestry
      case 'tapestry_tasks_5000':
        return (
          <g>
            <Px x={4} y={2} w={16} h={2} c="#B45309" />
            <Px x={5} y={4} w={14} h={16} c="#312E81" />
            <Px x={6} y={5} w={12} h={14} c="#1E1B4B" />
            {/* Celestial Sun & Stars Motif */}
            <Px x={10} y={8} w={4} h={4} c="#FACC15" />
            <Px x={8} y={7} w={2} h={2} c="#FEF08A" />
            <Px x={14} y={7} w={2} h={2} c="#FEF08A" />
            <Px x={8} y={13} w={2} h={2} c="#38BDF8" />
            <Px x={14} y={13} w={2} h={2} c="#A855F7" />
            <Px x={6} y={18} w={12} h={2} c="#F59E0B" />
            <Px x={8} y={20} w={8} h={2} c="#FACC15" />
          </g>
        );

      // 28. RIGHT FLOOR: Royal Treasure Chest
      case 'treasure_hoard':
      default:
        return (
          <g>
            <Px x={4} y={20} w={16} h={2} c="rgba(15,23,42,0.2)" />
            <Px x={5} y={7} w={14} h={4} c="#78350F" />
            <Px x={6} y={8} w={12} h={2} c="#92400E" />
            <Px x={6} y={11} w={12} h={3} c="#FACC15" />
            <Px x={8} y={10} w={8} h={2} c="#FEF08A" />
            <Px x={9} y={11} w={2} h={2} c="#E11D48" />
            <Px x={14} y={11} w={2} h={1} c="#38BDF8" />
            <Px x={5} y={14} w={14} h={7} c="#92400E" />
            <Px x={5} y={14} w={14} h={2} c="#FACC15" />
            <Px x={11} y={15} w={2} h={3} c="#FEF08A" />
            <Px x={5} y={19} w={14} h={2} c="#78350F" />
          </g>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      style={{ width: size, height: size }}
      className={`select-none overflow-visible ${className}`}
      role="img"
      aria-label={`8-bit room decoration ${decorId}`}
    >
      {renderSprite()}
    </svg>
  );
};
