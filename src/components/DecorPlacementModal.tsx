import React from 'react';
import { X, Check, Trash2, ShoppingBag, Plus } from 'lucide-react';
import { RoomDecorItem, RoomSlotId, UserProfile } from '../types/game';
import { ROOM_DECOR_ITEMS } from '../data/petSpecies';
import { RoomDecorSvg } from './RoomDecorSvg';

interface DecorPlacementModalProps {
  slot: RoomSlotId;
  profile: UserProfile;
  onPlaceDecor: (slot: RoomSlotId, decorId: string) => void;
  onClearSlot: (slot: RoomSlotId) => void;
  onOpenShop: (slot: RoomSlotId) => void;
  onClose: () => void;
}

const SLOT_TITLES: Record<RoomSlotId, string> = {
  wall_1: 'WALL DECOR (SLOT 1)',
  wall_2: 'WALL DECOR (SLOT 2)',
  wall_3: 'WALL DECOR (SLOT 3)',
  wall_4: 'WALL DECOR (SLOT 4)',
  wall_right: 'WALL DECOR',
  wall_left: 'LEFT WINDOW',
  floor_left: 'LEFT FLOOR DECOR',
  floor_right: 'RIGHT FLOOR DECOR',
};

export const DecorPlacementModal: React.FC<DecorPlacementModalProps> = ({
  slot,
  profile,
  onPlaceDecor,
  onClearSlot,
  onOpenShop,
  onClose,
}) => {
  const currentPlacedId = profile.placedDecorBySlot?.[slot] || '';
  const slotName = SLOT_TITLES[slot] || 'ROOM DECOR';

  // Categorization is strictly 'wall' and 'floor'
  const isWallSlot = slot.startsWith('wall');
  const slotItems = ROOM_DECOR_ITEMS.filter((item) =>
    isWallSlot ? item.category === 'wall' : item.category === 'floor'
  );
  const unlockedIds = profile.unlockedDecorIds || [];

  const ownedItems = slotItems.filter(
    (item) => item.isDefault || unlockedIds.includes(item.id)
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[88dvh] bg-[#FAF6F0] pixel-box overflow-hidden flex flex-col text-slate-900 shadow-2xl">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-[#EFE8DD] border-b-2 border-[#3B4254] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#3B4254] bg-white flex items-center justify-center text-slate-800">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-xs sm:text-sm text-slate-900">
                PLACE {slotName}
              </h2>
              <p className="font-pixel text-base font-bold text-slate-600">
                Choose an owned item to display in your room
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-rose-400 hover:bg-rose-300 text-slate-950 font-display text-xs pixel-btn flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            <span>CLOSE</span>
          </button>
        </div>

        {/* Currently Placed Strip & Clear Action */}
        {currentPlacedId && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-display text-[9px] text-amber-900 uppercase">
                CURRENTLY PLACED:
              </span>
              <span className="font-pixel text-base font-bold text-slate-900 truncate">
                {ROOM_DECOR_ITEMS.find((d) => d.id === currentPlacedId)?.name || currentPlacedId}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onClearSlot(slot)}
              className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-[#3B4254] font-display text-[9px] flex items-center gap-1 shrink-0"
              title="Remove item and leave spot empty"
            >
              <Trash2 className="w-3 h-3 text-rose-600" />
              <span>REMOVE</span>
            </button>
          </div>
        )}

        {/* Owned Items List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {ownedItems.length === 0 ? (
            <div className="p-6 bg-white pixel-box text-center space-y-3 my-4">
              <div className="w-12 h-12 mx-auto rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center text-slate-400">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xs text-slate-800">
                NO OWNED DECOR FOR THIS SPOT YET
              </h3>
              <p className="font-pixel text-base text-slate-600 max-w-sm mx-auto">
                Visit the Sanctuary Shop to buy plushies, banners, and books with Gold, or earn exclusive decor from quest achievements!
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShop(slot);
                }}
                className="mt-2 px-4 py-2 bg-amber-300 hover:bg-amber-200 text-slate-950 font-display text-xs pixel-btn inline-flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>OPEN DECOR SHOP</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ownedItems.map((item) => {
                const isPlaced = currentPlacedId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 bg-white pixel-box flex items-center justify-between gap-3 transition-all ${
                      isPlaced ? 'ring-3 ring-emerald-400 bg-emerald-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 bg-[#FAF6F0] pixel-box-sm flex items-center justify-center shrink-0">
                        <RoomDecorSvg decorId={item.id} size={48} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-display text-[11px] text-slate-900 truncate">
                          {item.name}
                        </h4>
                        <p className="font-pixel text-sm text-slate-600 line-clamp-2 leading-tight mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isPlaced ? (
                        <div
                          title="Currently Placed"
                          className="w-9 h-9 rounded bg-emerald-400 border-2 border-[#3B4254] flex items-center justify-center text-slate-950 shadow-xs"
                        >
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onPlaceDecor(slot, item.id)}
                          className="py-1.5 px-3 bg-amber-300 hover:bg-amber-200 text-slate-950 font-display text-[10px] pixel-btn"
                        >
                          PLACE
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-[#EFE8DD] border-t-2 border-[#3B4254] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenShop(slot);
            }}
            className="py-2 px-3.5 bg-white hover:bg-slate-100 text-slate-900 font-display text-[10px] pixel-btn flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
            <span>MORE IN SHOP</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-display text-[10px] pixel-btn"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
