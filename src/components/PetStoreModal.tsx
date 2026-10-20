import React, { useState } from 'react';
import { Check, Home, PawPrint, Sparkles } from 'lucide-react';
import {
  PetRarityTier,
  PetSpeciesConfig,
  RoomDecorItem,
  RoomSlotId,
  UserProfile,
} from '../types/game';
import {
  DEFAULT_PLACED_DECOR,
  PET_SPECIES_LIST,
  RARITY_TIER_META,
  ROOM_DECOR_ITEMS,
  getAdultBonusForSpecies,
} from '../data/petSpecies';
import { Pet3DCardPreview } from './Pet3DScene';
import { RoomDecorSvg } from './RoomDecorSvg';
import { PixelCoinIcon } from './PixelCoinIcon';

interface PetStoreViewProps {
  profile: UserProfile;
  onBuyOrSelectSpecies: (species: PetSpeciesConfig) => void;
  onBuyOrPlaceDecor?: (item: RoomDecorItem) => void;
  initialTab?: 'pets' | 'decor';
  initialSlotFilter?: RoomSlotId | 'all';
}

export const PetStoreView: React.FC<PetStoreViewProps> = ({
  profile,
  onBuyOrSelectSpecies,
  onBuyOrPlaceDecor,
  initialTab = 'pets',
  initialSlotFilter = 'all',
}) => {
  const [storeTab, setStoreTab] = useState<'pets' | 'decor'>(initialTab);
  const [rarityFilter, setRarityFilter] = useState<PetRarityTier | 'all'>('all');
  const [decorCategoryFilter, setDecorCategoryFilter] = useState<'all' | 'wall' | 'floor'>('all');

  const filteredSpecies = PET_SPECIES_LIST.filter((sp) => {
    if (rarityFilter !== 'all' && sp.rarity !== rarityFilter) return false;
    return true;
  });

  // Exclude achievement-exclusive trophies and the permanent left-wall window
  const shopDecorList = ROOM_DECOR_ITEMS.filter(
    (d) =>
      !d.isAchievementExclusive &&
      d.id !== 'window_sunny' &&
      d.category in { wall: true, floor: true }
  );

  const filteredDecor = shopDecorList.filter((d) => {
    if (decorCategoryFilter === 'all') return true;
    return d.category === decorCategoryFilter;
  });

  const unlockedDecorIds = profile.unlockedDecorIds || [
    'window_sunny',
    'wood_bookshelf',
    'potted_sprout',
    'cozy_cushion',
  ];
  const placedDecor = profile.placedDecorBySlot || DEFAULT_PLACED_DECOR;

  return (
    <div className="space-y-4">
      {/* Clean Top Bar: Tab Switcher + Gold Wallet */}
      <div className="p-3.5 bg-white pixel-box flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setStoreTab('pets')}
            className={`px-4 py-2.5 font-display text-xs pixel-btn flex items-center gap-2 ${
              storeTab === 'pets'
                ? 'bg-amber-300 text-slate-950'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <PawPrint className="w-4 h-4" />
            <span>PETS</span>
          </button>

          <button
            type="button"
            onClick={() => setStoreTab('decor')}
            className={`px-4 py-2.5 font-display text-xs pixel-btn flex items-center gap-2 ${
              storeTab === 'decor'
                ? 'bg-emerald-300 text-slate-950'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>DECOR</span>
          </button>
        </div>

        <div className="px-4 py-2 bg-amber-300 pixel-box-sm flex items-center gap-2">
          <PixelCoinIcon size={20} />
          <span className="font-display text-xs sm:text-sm text-slate-950">
            {profile.gold}
          </span>
        </div>
      </div>

      {/* TAB 1: PETS */}
      {storeTab === 'pets' && (
        <>
          {/* Clean Tier Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap bg-white/90 p-2.5 pixel-box-sm">
            <button
              type="button"
              onClick={() => setRarityFilter('all')}
              className={`px-3.5 py-2 font-display text-[10px] sm:text-xs pixel-btn ${
                rarityFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              ALL
            </button>

            {(
              [
                'common',
                'uncommon',
                'rare',
                'epic',
                'legendary',
                'mythic',
              ] as PetRarityTier[]
            ).map((tier) => {
              const meta = RARITY_TIER_META[tier];
              const isSelected = rarityFilter === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setRarityFilter(tier)}
                  className={`px-3.5 py-2 font-display text-[10px] sm:text-xs pixel-btn ${
                    isSelected
                      ? `${meta.badgeBg} ring-2 ring-slate-950`
                      : 'bg-white text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Simplified Pet Grid: Short Name, Single Tier Badge, Static Sprite, Full-Width Padded Buy Button */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSpecies.map((species) => {
              const isUnlocked = profile.unlockedSpecies.includes(species.id);
              const isActive = profile.activeSpeciesId === species.id;
              const canAfford = profile.gold >= species.priceGold;
              const rMeta = RARITY_TIER_META[species.rarity];

              return (
                <div
                  key={species.id}
                  style={{ background: species.theme.cardGradientCss }}
                  className={`pixel-box p-4 flex flex-col justify-between transition-transform ${
                    isActive ? 'ring-4 ring-amber-300' : ''
                  }`}
                >
                  {/* Top Header: Short Name + Single Tier Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <h4 className="font-display text-xs sm:text-sm text-slate-900 truncate">
                      {species.name}
                    </h4>
                    <span
                      className={`px-2 py-0.5 font-display text-[9px] pixel-box-sm shrink-0 ${rMeta.badgeBg}`}
                    >
                      {rMeta.label}
                    </span>
                  </div>

                  {/* Static Pet Image Only (No animations) */}
                  <div className="relative h-36 bg-white/85 pixel-box-sm overflow-hidden mb-2.5 flex items-center justify-center">
                    <Pet3DCardPreview speciesId={species.id} stage="adult" />
                  </div>

                  {/* Evolution System Perk */}
                  {(() => {
                    const adultBonus = getAdultBonusForSpecies(species);
                    return (
                      <div className="bg-amber-50/95 border border-[#3B4254] rounded p-2 mb-3 text-left">
                        <div className="flex items-center gap-1 font-display text-[8px] text-amber-950 font-bold">
                          <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>PERK</span>
                        </div>
                        <p className="font-pixel text-sm font-bold text-slate-800 leading-snug mt-0.5">
                          {adultBonus.description}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Full-Width Buy / Select Button (Spans card width with card padding) */}
                  <button
                    type="button"
                    disabled={!isUnlocked && !canAfford}
                    onClick={() => onBuyOrSelectSpecies(species)}
                    className={`w-full py-2.5 px-3 font-display text-xs pixel-btn flex items-center justify-center gap-2 ${
                      isActive
                        ? 'bg-emerald-400 text-slate-950'
                        : isUnlocked
                        ? 'bg-white hover:bg-amber-200 text-slate-900'
                        : canAfford
                        ? 'bg-amber-300 hover:bg-amber-200 text-slate-950'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Check className="w-4 h-4" />
                      </>
                    ) : isUnlocked ? (
                      <span>SELECT</span>
                    ) : (
                      <>
                        <PixelCoinIcon size={16} />
                        <span>
                          {species.priceGold === 0
                            ? 'FREE'
                            : `${species.priceGold}`}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* TAB 2: ROOM DECOR */}
      {storeTab === 'decor' && (
        <>
          <div className="flex items-center gap-2 flex-wrap bg-white/90 p-2.5 pixel-box-sm">
            {(
              [
                { id: 'all', label: 'ALL' },
                { id: 'wall', label: 'WALL' },
                { id: 'floor', label: 'FLOOR' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDecorCategoryFilter(f.id)}
                className={`px-3.5 py-2 font-display text-[10px] sm:text-xs pixel-btn ${
                  decorCategoryFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDecor.map((item) => {
              const isOwned =
                item.isDefault || unlockedDecorIds.includes(item.id);
              const isPlaced = Object.values(placedDecor).includes(item.id);
              const canAfford = profile.gold >= item.priceGold;

              return (
                <div
                  key={item.id}
                  className={`bg-white pixel-box p-4 flex flex-col justify-between ${
                    isPlaced ? 'ring-4 ring-emerald-300' : ''
                  }`}
                >
                  <div className="mb-2.5">
                    <h4 className="font-display text-xs sm:text-sm text-slate-900 truncate">
                      {item.name}
                    </h4>
                  </div>

                  {/* Static Decor Sprite */}
                  <div className="h-34 bg-[#FAF6F0] pixel-box-sm mb-3.5 flex items-center justify-center">
                    <RoomDecorSvg decorId={item.id} size={100} />
                  </div>

                  {/* Full-Width Padded Buy / Place Button */}
                  <button
                    type="button"
                    disabled={!isOwned && !canAfford}
                    onClick={() => onBuyOrPlaceDecor?.(item)}
                    className={`w-full py-2.5 px-3 font-display text-xs pixel-btn flex items-center justify-center gap-2 ${
                      isPlaced
                        ? 'bg-emerald-400 text-slate-950'
                        : isOwned
                        ? 'bg-sky-200 hover:bg-sky-300 text-slate-950'
                        : canAfford
                        ? 'bg-amber-300 hover:bg-amber-200 text-slate-950'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isPlaced ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isOwned ? (
                      <span>PLACE</span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <PixelCoinIcon size={16} className="shrink-0" />
                        <span className="leading-none">{item.priceGold}</span>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
