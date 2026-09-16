import React, { useState } from 'react';
import { ThemeMode, AISettings, AITelemetry } from '../game/types';
import { Cpu, Target, Sliders, ChevronDown, ChevronUp, AlertTriangle, Eye, Zap } from 'lucide-react';

interface AIInspectorProps {
  telemetry: AITelemetry | null;
  settings: AISettings;
  onUpdateSettings: (newSettings: Partial<AISettings>) => void;
  showLaserSight: boolean;
  onToggleLaserSight: () => void;
  theme: ThemeMode;
}

export const AIInspector: React.FC<AIInspectorProps> = ({
  telemetry,
  settings,
  onUpdateSettings,
  showLaserSight,
  onToggleLaserSight,
  theme
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'tuning'>('telemetry');

  const isDark = theme === 'dark';

  const getThreatBadge = (type: string | null, altitude: string | null) => {
    if (!type) return <span className="text-zinc-500">Нет угроз</span>;

    const isAir = altitude && altitude !== 'ground';
    let label = type;
    if (type === 'pterodactyl') label = `Птеродактиль (${altitude})`;
    else if (type === 'flying_drone') label = `Дрон (${altitude})`;
    else if (type === 'mutant_bat') label = `Мышь (${altitude})`;
    else if (type.includes('cactus')) label = 'Кактус';
    else if (type === 'spikes') label = 'Шипы';
    else if (type === 'robot_drone') label = 'Робот-краб';
    else if (type === 'scorpion') label = 'Скорпион';

    return (
      <span
        className={`px-1.5 py-0.5 rounded text-[9px] font-pixel ${
          isAir
            ? isDark
              ? 'bg-purple-950/80 text-purple-300 border border-purple-700'
              : 'bg-purple-100 text-purple-800 border border-purple-300'
            : isDark
            ? 'bg-rose-950/80 text-rose-300 border border-rose-700'
            : 'bg-rose-100 text-rose-800 border border-rose-300'
        }`}
      >
        {isAir ? '🦅 ' : '🌵 '} {label}
      </span>
    );
  };

  const getStatusColor = (status: AITelemetry['status']) => {
    switch (status) {
      case 'FIRING':
        return isDark ? 'text-rose-400 bg-rose-950/60 border-rose-700' : 'text-rose-700 bg-rose-50 border-rose-300';
      case 'AIMING':
        return isDark ? 'text-amber-400 bg-amber-950/60 border-amber-700' : 'text-amber-700 bg-amber-50 border-amber-300';
      case 'JUMPING':
        return isDark ? 'text-cyan-400 bg-cyan-950/60 border-cyan-700' : 'text-cyan-700 bg-cyan-50 border-cyan-300';
      case 'EVADING':
        return isDark ? 'text-emerald-400 bg-emerald-950/60 border-emerald-700' : 'text-emerald-700 bg-emerald-50 border-emerald-300';
      default:
        return isDark ? 'text-zinc-400 bg-zinc-800 border-zinc-700' : 'text-zinc-600 bg-zinc-100 border-zinc-300';
    }
  };

  return (
    <div
      className={`rounded-lg border shadow-sm transition-all text-xs select-none ${
        isDark
          ? 'bg-zinc-900/90 border-zinc-800 text-zinc-300'
          : 'bg-white/95 border-stone-300 text-stone-700'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-inherit">
        <div className="flex items-center gap-2">
          <Cpu className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-emerald-600'} animate-pulse`} />
          <span className="font-pixel text-[11px] font-bold">
            МОЗГ AI АЛГОРИТМА
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tab Switcher */}
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-2 py-1 rounded text-[10px] font-pixel transition-colors ${
              activeTab === 'telemetry'
                ? isDark
                  ? 'bg-cyan-950 border border-cyan-600 text-cyan-300'
                  : 'bg-stone-200 border border-stone-400 text-stone-900'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            Телеметрия
          </button>
          <button
            onClick={() => setActiveTab('tuning')}
            className={`px-2 py-1 rounded text-[10px] font-pixel flex items-center gap-1 transition-colors ${
              activeTab === 'tuning'
                ? isDark
                  ? 'bg-cyan-950 border border-cyan-600 text-cyan-300'
                  : 'bg-stone-200 border border-stone-400 text-stone-900'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Sliders className="w-3 h-3" />
            Тюнинг
          </button>

          {/* Toggle Expand/Collapse */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
            title={isOpen ? 'Свернуть' : 'Развернуть'}
          >
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="p-3">
          {activeTab === 'telemetry' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Action State */}
              <div
                className={`p-2 rounded border flex flex-col justify-between ${
                  telemetry ? getStatusColor(telemetry.status) : 'border-zinc-700'
                }`}
              >
                <div className="text-[9px] font-pixel opacity-70">ДЕЙСТВИЕ</div>
                <div className="font-pixel text-[11px] font-bold mt-1">
                  {telemetry ? telemetry.status : 'SCANNING'}
                </div>
              </div>

              {/* Target & Altitude */}
              <div
                className={`p-2 rounded border flex flex-col justify-between ${
                  isDark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="text-[9px] font-pixel opacity-70">ЦЕЛЬ & ДИСТАНЦИЯ</div>
                <div className="mt-1 flex items-center justify-between">
                  {telemetry ? getThreatBadge(telemetry.nearestThreatType, telemetry.nearestThreatAltitude) : '-'}
                  <span className="font-pixel text-[10px] font-bold">
                    {telemetry?.nearestThreatDistance ? `${telemetry.nearestThreatDistance}px` : '-'}
                  </span>
                </div>
              </div>

              {/* Aim Angle */}
              <div
                className={`p-2 rounded border flex flex-col justify-between ${
                  isDark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="text-[9px] font-pixel opacity-70 flex items-center justify-between">
                  <span>УГОЛ ПРИЦЕЛА</span>
                  <Target className="w-3 h-3 text-cyan-400" />
                </div>
                <div className="font-pixel text-[11px] font-bold mt-1 flex items-center gap-1.5">
                  <span className={telemetry?.aimAngleDeg && telemetry.aimAngleDeg < 0 ? 'text-purple-400' : ''}>
                    {telemetry?.aimAngleDeg !== undefined ? `${telemetry.aimAngleDeg}°` : '0°'}
                  </span>
                  <span className="text-[9px] font-normal opacity-70">
                    {telemetry?.aimAngleDeg && telemetry.aimAngleDeg < -10
                      ? '(в небо)'
                      : telemetry?.aimAngleDeg && telemetry.aimAngleDeg > 5
                      ? '(вниз)'
                      : '(прямо)'}
                  </span>
                </div>
              </div>

              {/* Randomness / Accuracy status */}
              <div
                className={`p-2 rounded border flex flex-col justify-between ${
                  telemetry?.willMiss
                    ? isDark
                      ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                      : 'bg-amber-50 border-amber-300 text-amber-800'
                    : isDark
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}
              >
                <div className="text-[9px] font-pixel opacity-70 flex items-center justify-between">
                  <span>РАНДОМ ТОЧНОСТИ</span>
                  {telemetry?.willMiss ? (
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                  ) : (
                    <Zap className="w-3 h-3 text-emerald-400" />
                  )}
                </div>
                <div className="font-pixel text-[10px] font-bold mt-1">
                  {telemetry?.willMiss ? '⚠️ ПРОМАХ (RNG)' : '🎯 ТОЧНЫЙ ВЫСТРЕЛ'}
                </div>
              </div>
            </div>
          ) : (
            /* Tuning Controls */
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Accuracy Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-pixel">
                    <span>Точность бота (Accuracy):</span>
                    <span className="font-bold text-cyan-400">{Math.round(settings.accuracy * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.02"
                    value={settings.accuracy}
                    onChange={e => onUpdateSettings({ accuracy: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                  />
                  <div className="text-[9px] opacity-60">Чем ниже, тем чаще стреляет выше/ниже врага</div>
                </div>

                {/* Miss Chance Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-pixel">
                    <span>Шанс промаха (Miss RNG):</span>
                    <span className="font-bold text-amber-400">{Math.round(settings.missChance * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.4"
                    step="0.02"
                    value={settings.missChance}
                    onChange={e => onUpdateSettings({ missChance: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                  />
                  <div className="text-[9px] opacity-60">Случайные осечки и отклонения при стрельбе</div>
                </div>

                {/* Jump Precision Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-pixel">
                    <span>Тайминг прыжков (Jump Timing):</span>
                    <span className="font-bold text-emerald-400">{Math.round(settings.jumpPrecision * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.7"
                    max="1.0"
                    step="0.02"
                    value={settings.jumpPrecision}
                    onChange={e => onUpdateSettings({ jumpPrecision: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                  />
                  <div className="text-[9px] opacity-60">Определяет точность дистанции отталкивания</div>
                </div>

                {/* Reaction Delay */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-pixel">
                    <span>Задержка реакции:</span>
                    <span className="font-bold text-purple-400">{settings.reactionDelayMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="220"
                    step="10"
                    value={settings.reactionDelayMs}
                    onChange={e => onUpdateSettings({ reactionDelayMs: parseInt(e.target.value, 10) })}
                    className="w-full accent-purple-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                  />
                  <div className="text-[9px] opacity-60">Имитация времени реакции между обнаружением и выстрелом</div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-inherit gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-[10px] font-pixel">
                  <input
                    type="checkbox"
                    checked={showLaserSight}
                    onChange={onToggleLaserSight}
                    className="accent-cyan-500 w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-cyan-400" /> Лазерный луч прицеливания AI
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[10px] font-pixel">
                  <input
                    type="checkbox"
                    checked={settings.autoDuck}
                    onChange={e => onUpdateSettings({ autoDuck: e.target.checked })}
                    className="accent-cyan-500 w-3.5 h-3.5 rounded cursor-pointer"
                  />
                  <span>Авто-пригибание от высоких врагов</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
