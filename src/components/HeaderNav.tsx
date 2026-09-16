import React from 'react';
import { ThemeMode, GameMode } from '../game/types';
import { Sun, Moon, Bot, Gamepad2, Volume2, VolumeX, Pause, Play, Sparkles, Music, Music2, Clapperboard } from 'lucide-react';

interface HeaderNavProps {
  theme: ThemeMode;
  onToggleTheme: () => void;
  gameMode: GameMode;
  onToggleGameMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isMusicOn: boolean;
  onToggleMusic: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  isCleanScreen: boolean;
  onToggleCleanScreen: () => void;
  onOpenHelp: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  theme,
  onToggleTheme,
  gameMode,
  onToggleGameMode,
  isMuted,
  onToggleMute,
  isMusicOn,
  onToggleMusic,
  isPaused,
  onTogglePause,
  isCleanScreen,
  onToggleCleanScreen,
  onOpenHelp
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`w-full py-3 px-4 border-b transition-colors select-none ${
        isDark
          ? 'bg-zinc-950/80 border-zinc-800 text-zinc-100'
          : 'bg-white/80 border-stone-300 text-stone-800'
      } backdrop-blur-md sticky top-0 z-20`}
    >
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded border flex items-center justify-center font-pixel text-sm ${
              isDark ? 'bg-cyan-950 border-cyan-500 text-cyan-400' : 'bg-stone-800 border-stone-900 text-white'
            }`}
          >
            🦖
          </div>
          <div>
            <h1 className="font-pixel text-xs sm:text-sm font-bold tracking-tight flex items-center gap-1.5">
              <span>DINO GUNNER</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-pixel ${
                  isDark ? 'bg-purple-950 text-purple-400 border border-purple-800' : 'bg-stone-200 text-stone-700'
                }`}
              >
                AI RUNNER
              </span>
            </h1>
            <p className="text-[9px] font-pixel opacity-60 hidden sm:block">
              Google Dino с ружьем, авто-наведением и алгоритмом действий
            </p>
          </div>
        </div>

        {/* Right: Actions / Mode & Theme Toggles */}
        <div className="flex items-center gap-2">
          {/* AI vs Manual Toggle */}
          <button
            onClick={onToggleGameMode}
            className={`px-3 py-1.5 rounded-lg border font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer transition-all ${
              gameMode === 'ai'
                ? isDark
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : 'bg-emerald-600 border-emerald-700 text-white shadow-sm'
                : isDark
                ? 'bg-amber-950 border-amber-500 text-amber-300'
                : 'bg-amber-600 border-amber-700 text-white shadow-sm'
            }`}
            title="Переключить режим управления [Клавиша A]"
          >
            {gameMode === 'ai' ? (
              <>
                <Bot className="w-3.5 h-3.5 animate-pulse" />
                <span>AI БОТ</span>
              </>
            ) : (
              <>
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>РУЧНОЙ</span>
              </>
            )}
          </button>

          {/* Theme Switcher (Light / Dark) */}
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-lg border cursor-pointer transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-700 text-yellow-400 hover:bg-zinc-800'
                : 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200'
            }`}
            title={`Сменить тему на ${isDark ? 'Светлую (День)' : 'Темную (Ночь)'} [Клавиша T]`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-lg border cursor-pointer transition-colors ${
              isMuted
                ? 'bg-rose-950/50 border-rose-800 text-rose-400'
                : isDark
                ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                : 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200'
            }`}
            title={isMuted ? 'Включить звук [M]' : 'Выключить звук [M]'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Background Music Toggle */}
          <button
            onClick={onToggleMusic}
            className={`p-2 rounded-lg border cursor-pointer transition-colors ${
              isMusicOn
                ? isDark
                  ? 'bg-cyan-950/60 border-cyan-700 text-cyan-300'
                  : 'bg-cyan-100 border-cyan-300 text-cyan-700'
                : isDark
                ? 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:bg-zinc-800'
                : 'bg-stone-100 border-stone-300 text-stone-400 hover:bg-stone-200'
            }`}
            title={isMusicOn ? 'Выключить фоновую музыку [B]' : 'Включить фоновую музыку [B]'}
          >
            {isMusicOn ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
          </button>

          {/* Clean recording mode */}
          <button
            onClick={onToggleCleanScreen}
            className={`p-2 rounded-lg border cursor-pointer transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                : 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200'
            }`}
            title={isCleanScreen ? 'Выйти из чистого режима [C]' : 'Чистый экран для записи [C]'}
          >
            <Clapperboard className="w-4 h-4" />
          </button>

          {/* Pause / Resume */}
          <button
            onClick={onTogglePause}
            className={`p-2 rounded-lg border cursor-pointer transition-colors ${
              isPaused
                ? 'bg-amber-950/60 border-amber-600 text-amber-400'
                : isDark
                ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                : 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200'
            }`}
            title={isPaused ? 'Продолжить [P]' : 'Пауза [P]'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Info / Guide button */}
          <button
            onClick={onOpenHelp}
            className={`p-2 rounded-lg border cursor-pointer transition-colors ${
              isDark
                ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                : 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200'
            }`}
            title="Инструкция и алгоритм"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
