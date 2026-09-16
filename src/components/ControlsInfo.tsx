import React from 'react';
import { GameMode, ThemeMode } from '../game/types';
import { ArrowUp, ArrowDown, Crosshair, Sun, Moon, Volume2, Pause, Music2, Clapperboard } from 'lucide-react';

interface ControlsInfoProps {
  gameMode: GameMode;
  theme: ThemeMode;
  onJump: () => void;
  onDuckStart: () => void;
  onDuckEnd: () => void;
  onShoot: () => void;
}

export const ControlsInfo: React.FC<ControlsInfoProps> = ({
  gameMode,
  theme,
  onJump,
  onDuckStart,
  onDuckEnd,
  onShoot
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="w-full space-y-3 select-none">
      {/* Mobile Touch Controls (Always available, highlighted in manual mode) */}
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        {/* Duck Button */}
        <button
          onTouchStart={onDuckStart}
          onTouchEnd={onDuckEnd}
          onMouseDown={onDuckStart}
          onMouseUp={onDuckEnd}
          onMouseLeave={onDuckEnd}
          className={`py-3 px-2 rounded-lg border font-pixel text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform ${
            isDark
              ? 'bg-zinc-800 active:bg-zinc-700 border-zinc-700 text-zinc-200'
              : 'bg-stone-200 active:bg-stone-300 border-stone-400 text-stone-800'
          }`}
        >
          <ArrowDown className="w-5 h-5" />
          <span>ПРИСЕД</span>
        </button>

        {/* Jump Button */}
        <button
          onClick={onJump}
          className={`py-3 px-2 rounded-lg border font-pixel text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform ${
            isDark
              ? 'bg-cyan-900 active:bg-cyan-800 border-cyan-700 text-cyan-200'
              : 'bg-emerald-600 active:bg-emerald-700 border-emerald-700 text-white'
          }`}
        >
          <ArrowUp className="w-5 h-5" />
          <span>ПРЫЖОК</span>
        </button>

        {/* Shoot Button */}
        <button
          onClick={onShoot}
          className={`py-3 px-2 rounded-lg border font-pixel text-xs flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform ${
            isDark
              ? 'bg-rose-900 active:bg-rose-800 border-rose-700 text-rose-200'
              : 'bg-rose-600 active:bg-rose-700 border-rose-700 text-white'
          }`}
        >
          <Crosshair className="w-5 h-5" />
          <span>ОГОНЬ</span>
        </button>
      </div>

      {/* Desktop Keyboard Cheat Sheet */}
      <div
        className={`p-3 rounded-lg border text-xs ${
          isDark
            ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
            : 'bg-stone-100/90 border-stone-300 text-stone-600'
        }`}
      >
        <div className="font-pixel text-[10px] font-bold mb-2 flex items-center justify-between text-inherit opacity-90">
          <span>⌨️ УПРАВЛЕНИЕ И ГОРЯЧИЕ КЛАВИШИ</span>
          <span className="text-[9px] opacity-70">
            {gameMode === 'ai' ? '🤖 AI действует автоматически' : '🎮 Ручное управление активно'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-pixel">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 border border-inherit">
              Space / ↑
            </kbd>
            <span>Прыжок</span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 border border-inherit">
              ↓ / S
            </kbd>
            <span>Присесть</span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 border border-inherit">
              F / E / Click
            </kbd>
            <span>Выстрел</span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 border border-inherit">
              A
            </kbd>
            <span>AI / Ручной</span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 border border-inherit">
              T
            </kbd>
            <span className="flex items-center gap-1">
              Тема ({theme === 'dark' ? <Moon className="w-2.5 h-2.5" /> : <Sun className="w-2.5 h-2.5" />})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 border border-inherit">
              M
            </kbd>
            <span className="flex items-center gap-1">
              <Volume2 className="w-2.5 h-2.5" /> Звук
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 border border-inherit">
              P
            </kbd>
            <span className="flex items-center gap-1">
              <Pause className="w-2.5 h-2.5" /> Пауза
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 border border-inherit">
              1-4
            </kbd>
            <span>Смена оружия</span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 border border-inherit">
              B
            </kbd>
            <span className="flex items-center gap-1">
              <Music2 className="w-2.5 h-2.5" /> Музыка
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 border border-inherit">
              C
            </kbd>
            <span className="flex items-center gap-1">
              <Clapperboard className="w-2.5 h-2.5" /> Чистый экран
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
