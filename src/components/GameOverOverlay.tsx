import React, { useEffect } from 'react';
import { DeathInfo, ThemeMode } from '../game/types';
import { RotateCcw, Trophy, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverOverlayProps {
  deathInfo: DeathInfo | null;
  highScore: number;
  autoRestartTimeRemaining: number;
  onRestart: () => void;
  theme: ThemeMode;
}

const Stat: React.FC<{ label: string; value: React.ReactNode; accent: string }> = ({ label, value, accent }) => (
  <div>
    <div className="font-pixel text-[8px] opacity-50">{label}</div>
    <div className={`font-pixel text-sm font-bold mt-1 ${accent}`}>{value}</div>
  </div>
);

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  deathInfo,
  highScore,
  autoRestartTimeRemaining,
  onRestart,
  theme
}) => {
  if (!deathInfo) return null;

  const isDark = theme === 'dark';
  const isNewHighScore = deathInfo.score >= highScore && deathInfo.score > 0;
  const pct = Math.max(0, Math.min(1, autoRestartTimeRemaining / 2.4));

  useEffect(() => {
    if (isNewHighScore) {
      confetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.6 }
      });
    }
  }, [isNewHighScore]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
      <div
        className={`max-w-xs w-full max-h-full overflow-y-auto p-5 rounded-lg border shadow-2xl text-center select-none ${
          isDark ? 'bg-zinc-950/95 border-zinc-800 text-zinc-100' : 'bg-white/95 border-stone-300 text-stone-800'
        }`}
      >
        <h2 className="font-pixel text-base font-bold tracking-wider text-red-500">ВЫ ПРОИГРАЛИ</h2>
        <p className="font-pixel text-[10px] opacity-50 mt-2 mb-4">{deathInfo.killerName}</p>

        {isNewHighScore && (
          <div className="mb-4 flex items-center justify-center gap-1.5 font-pixel text-[10px] text-amber-400">
            <Trophy className="w-3.5 h-3.5" />
            НОВЫЙ РЕКОРД
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4 text-left">
          <Stat label="СЧЕТ" value={deathInfo.score} accent="text-cyan-400" />
          <Stat label="УБИЙСТВА" value={deathInfo.kills} accent="text-rose-400" />
          <Stat label="ДИСТАНЦИЯ" value={`${deathInfo.distance}м`} accent="text-emerald-400" />
          <Stat label="МЕТКОСТЬ" value={`${deathInfo.accuracy}%`} accent="text-purple-400" />
        </div>

        {deathInfo.maxCombo >= 2 && (
          <div className="mb-4 flex items-center justify-center gap-1.5 font-pixel text-[10px] text-orange-400">
            <Flame className="w-3.5 h-3.5" />
            КОМБО x{Math.min(8, deathInfo.maxCombo)}
          </div>
        )}

        <div className={`w-full h-1 rounded-full overflow-hidden mb-4 ${isDark ? 'bg-zinc-800' : 'bg-stone-200'}`}>
          <div className="h-full bg-red-500 transition-all duration-100" style={{ width: `${pct * 100}%` }} />
        </div>

        <button
          onClick={onRestart}
          className="w-full py-2.5 rounded font-pixel text-[11px] font-bold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          ЗАНОВО [ПРОБЕЛ]
        </button>
      </div>
    </div>
  );
};
