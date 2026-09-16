import React from 'react';
import { WeaponType, DinoSkin, ThemeMode } from '../game/types';
import { WEAPONS_DATA } from '../game/engine';
import { SKINS_DATA } from '../game/sprites';

interface WeaponSkinBarProps {
  currentWeapon: WeaponType;
  onSelectWeapon: (w: WeaponType) => void;
  currentSkin: DinoSkin;
  onSelectSkin: (s: DinoSkin) => void;
  theme: ThemeMode;
}

export const WeaponSkinBar: React.FC<WeaponSkinBarProps> = ({
  currentWeapon,
  onSelectWeapon,
  currentSkin,
  onSelectSkin,
  theme
}) => {
  const isDark = theme === 'dark';

  const weaponsList: WeaponType[] = ['rifle', 'laser', 'shotgun', 'plasma'];
  const skinsList: DinoSkin[] = ['classic', 'cyber', 'military', 'golden', 'lava'];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs select-none">
      {/* Weapons Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <span className="font-pixel text-[10px] opacity-70 whitespace-nowrap mr-1">Оружие:</span>
        {weaponsList.map((wId, idx) => {
          const w = WEAPONS_DATA[wId];
          const isSelected = currentWeapon === wId;
          return (
            <button
              key={wId}
              onClick={() => onSelectWeapon(wId)}
              className={`px-2.5 py-1.5 rounded border font-pixel text-[10px] flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? isDark
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-stone-800 border-stone-900 text-white shadow-sm'
                  : isDark
                  ? 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  : 'bg-white border-stone-300 text-stone-600 hover:text-stone-900'
              }`}
              title={`${w.nameRu} (клавиша ${idx + 1})`}
            >
              <span>{w.icon}</span>
              <span>{w.nameRu}</span>
            </button>
          );
        })}
      </div>

      {/* Dino Skins Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <span className="font-pixel text-[10px] opacity-70 whitespace-nowrap mr-1">Скин:</span>
        {skinsList.map(sId => {
          const s = SKINS_DATA[sId];
          const isSelected = currentSkin === sId;
          return (
            <button
              key={sId}
              onClick={() => onSelectSkin(sId)}
              className={`px-2 py-1 rounded border font-pixel text-[10px] flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? isDark
                    ? 'bg-purple-950 border-purple-400 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                    : 'bg-purple-100 border-purple-500 text-purple-900 shadow-sm'
                  : isDark
                  ? 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  : 'bg-white border-stone-300 text-stone-600 hover:text-stone-900'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full border border-black/20"
                style={{ backgroundColor: s.body }}
              />
              <span>{s.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
