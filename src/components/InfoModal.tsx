import React from 'react';
import { ThemeMode } from '../game/types';
import { X, Bot, Target, ShieldAlert, Sun, RotateCcw, CloudSun } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, theme }) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in select-none">
      <div
        className={`max-w-lg w-full p-5 rounded-xl border shadow-2xl transition-all my-8 ${
          isDark
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100 shadow-[0_0_30px_rgba(0,0,0,0.8)]'
            : 'bg-white border-stone-300 text-stone-800 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-inherit mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🦖🔫</span>
            <h3 className="font-pixel text-xs sm:text-sm font-bold">
              ОБ ИГРЕ И AI-АЛГОРИТМЕ
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="space-y-4 text-xs font-pixel leading-relaxed">
          {/* Section 1: AI Algorithm */}
          <div
            className={`p-3 rounded border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1.5 text-[11px]">
              <Bot className="w-4 h-4" />
              <span>1. Алгоритм действий персонажа</span>
            </div>
            <p className="text-[10px] opacity-80 mb-1.5">
              Динозаврик бежит с ружьем и непрерывно сканирует сектор впереди:
            </p>
            <ul className="list-disc list-inside text-[9px] opacity-75 space-y-1">
              <li>Автоматически рассчитывает идеальную точку для перепрыгивания кактусов и шипов.</li>
              <li>Обнаруживает наземных роботов, скорпионов и летающих врагов (птеродактилей) на разных высотах.</li>
              <li>Динамически наводит ствол оружия вверх/вниз прямо на цель.</li>
            </ul>
          </div>

          {/* Section 2: Randomness & Misses */}
          <div
            className={`p-3 rounded border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2 text-amber-400 font-bold mb-1.5 text-[11px]">
              <Target className="w-4 h-4" />
              <span>2. Рандом и возможные промахи</span>
            </div>
            <p className="text-[10px] opacity-80 mb-1.5">
              В алгоритм заложен контролируемый генератор случайных погрешностей (RNG):
            </p>
            <ul className="list-disc list-inside text-[9px] opacity-75 space-y-1">
              <li>Иногда динозаврик может промахнуться (пуля пролетит чуть выше или ниже птицы).</li>
              <li>Если выстрел промахнулся, враг остается на месте, создавая опасность столкновения!</li>
              <li>Легкий джиттер времени реакции и отталкивания при прыжке.</li>
            </ul>
          </div>

          {/* Section 3: Hazards & Collision */}
          <div
            className={`p-3 rounded border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2 text-rose-400 font-bold mb-1.5 text-[11px]">
              <ShieldAlert className="w-4 h-4" />
              <span>3. Враги и механика урона</span>
            </div>
            <p className="text-[10px] opacity-80 mb-1.5">
              Враги статичны или парят на месте, нанося смертельный урон при касании. Игрок или бот может налететь на кактус, на наземного врага или влететь в птеродактиля прямо во время прыжка!
            </p>
            <ul className="list-disc list-inside text-[9px] opacity-75 space-y-1">
              <li>Набор препятствий и врагов зависит от биома: пустыня — кактусы, перекати-поле и песчаные пауки, лес — пни, брёвна и рапторы, горы — валуны, шипы и кибер-черепа, поля — кусты, ящики и стервятники. Босс тоже выбирается под биом.</li>
              <li>Серия убийств подряд (окно 3 секунды) даёт комбо-множитель до x8 — очки за врага растут.</li>
              <li>Каждое убийство сопровождается короткой заморозкой кадра и тряской камеры, на серии x3/x5/x8 — звук и усиленный эффект.</li>
            </ul>
          </div>

          {/* Section 4: Weapon Pickups */}
          <div
            className={`p-3 rounded border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2 text-sky-400 font-bold mb-1.5 text-[11px]">
              <Target className="w-4 h-4" />
              <span>4. Подбор оружия на пути</span>
            </div>
            <p className="text-[10px] opacity-80">
              Время от времени на пути появляется светящийся ящик с оружием — просто пробегите сквозь него (или подпрыгните), и динозаврик сменит ствол на случайный из арсенала (винтовка, лазер, дробовик, плазма). Скорость бега растёт линейно со временем забега, без случайных рывков.
            </p>
          </div>

          {/* Section 5: Death & Respawn */}
          <div
            className={`p-3 rounded border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2 text-purple-400 font-bold mb-1.5 text-[11px]">
              <RotateCcw className="w-4 h-4" />
              <span>5. Смерть и авто-перезапуск с миганием</span>
            </div>
            <p className="text-[10px] opacity-80">
              При столкновении проигрывается анимация взрыва пикселей, табличка «ВЫ ПРОИГРАЛИ» с подробной статистикой и через 2.4с игра начинается сначала со счетом 0 и миганием неуязвимости персонажа!
            </p>
          </div>

          {/* Section 6: Themes */}
          <div
            className={`p-3 rounded border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5 text-[11px]">
              <Sun className="w-4 h-4" />
              <span>6. Светлая и Темная темы</span>
            </div>
            <p className="text-[10px] opacity-80">
              Интерфейс автоматически уходит в тёмную киберпанк-тему с закатом и возвращается к светлой на рассвете (режим АВТО в шапке). Клавиша T переключает тему вручную и выключает авто-режим.
            </p>
          </div>

          {/* Section 7: Living World & Recording */}
          <div
            className={`p-3 rounded border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center gap-2 text-sky-400 font-bold mb-1.5 text-[11px]">
              <CloudSun className="w-4 h-4" />
              <span>7. Живой мир, волны и запись</span>
            </div>
            <ul className="list-disc list-inside text-[9px] opacity-75 space-y-1">
              <li>Пять биомов — поля, лес, горы, холмы и пустыня — сменяются под погоду и плавно перетекают друг в друга.</li>
              <li>День сменяется закатом, ночью и рассветом по таймеру: солнце восходит и садится по дуге, ночью по небу плывёт полумесяц.</li>
              <li>Погода — дождь, снег или песчаная буря — приходит по таймеру и плавно сменяет друг друга.</li>
              <li>Режиссёр волн чередует затишье, плотный поток, воздушный налёт, полосу препятствий и боссов.</li>
              <li>Динозаврик сам подстраивает окрас под биом, погоду и время суток (режим АВТО у выбора скинов).</li>
              <li>У каждого скина свой головной аксессуар: шляпа следопыта, каска коммандо, кибер-импланты с визором и антенной, корона фараона или шипастый шлем.</li>
              <li>8-битная музыкальная петля ускоряется вместе с бегом, выключается клавишей B.</li>
              <li>Чистый экран [C] скрывает интерфейс для записи видео.</li>
            </ul>
          </div>
        </div>

        {/* Footer Button */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-lg font-pixel text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 cursor-pointer shadow transition-colors"
          >
            ПОНЯТНО, В БОЙ!
          </button>
        </div>
      </div>
    </div>
  );
};
