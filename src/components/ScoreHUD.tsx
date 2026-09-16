import React from 'react';
import { ThemeMode } from '../game/types';
import { Trophy, Crosshair, MapPin } from 'lucide-react';

interface ScoreHUDProps {
  score: number;
  highScore: number;
  kills: number;
  distance: number;
  theme: ThemeMode;
  isInvulnerable: boolean;
}

export const ScoreHUD: React.FC<ScoreHUDProps> = ({
  score,
  highScore,
  kills,
  distance,
  theme,
  isInvulnerable
}) => {
  // Format numbers with leading zeros like classic arcade Dino
  const padScore = (num: number, length: number = 5) => {
    return String(Math.floor(num)).padStart(length, '0');
  };

  const isDark = theme === 'dark';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 select-none">
      {/* Left: Status */}
      <div className="flex items-center gap-2">
        {isInvulnerable && (
          <div className="flex items-center px-2 py-0.5 text-[9px] font-pixel rounded bg-yellow-500/20 border border-yellow-500 text-yellow-500 animate-pulse">
            ЩИТ
          </div>
        )}
      </div>

      {/* Right: Scores & Stats */}
      <div className="flex items-center gap-4 text-xs font-pixel">
        {/* Distance */}
        <div
          className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded border text-[10px] ${
            isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-300' : 'bg-stone-100 border-stone-300 text-stone-600'
          }`}
          title="Пройденная дистанция"
        >
          <MapPin className="w-3 h-3 opacity-70" />
          <span>{Math.floor(distance)}m</span>
        </div>

        {/* Kills Counter */}
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded border text-[10px] ${
            isDark
              ? 'bg-rose-950/70 border-rose-800 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.2)]'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
          title="Уничтожено врагов"
        >
          <Crosshair className="w-3 h-3 text-rose-500" />
          <span>{kills}</span>
        </div>

        {/* High Score */}
        <div
          className={`flex items-center gap-1.5 opacity-80 ${
            isDark ? 'text-zinc-400' : 'text-stone-500'
          }`}
          title="Рекорд"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px]">HI {padScore(highScore)}</span>
        </div>

        {/* Current Score */}
        <div
          className={`flex items-center px-2.5 py-1 rounded border text-sm font-bold tracking-wider ${
            isDark
              ? 'bg-zinc-900 border-zinc-700 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
              : 'bg-white border-stone-300 text-stone-800 shadow-sm'
          }`}
        >
          <span>{padScore(score)}</span>
        </div>
      </div>
    </div>
  );
};
