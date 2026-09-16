import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ThemeMode,
  GameMode,
  WeaponType,
  DinoSkin,
  DayPhase,
  AISettings,
  AITelemetry,
  DeathInfo
} from './game/types';
import { GameEngine } from './game/engine';
import { soundManager } from './game/audio';
import { HeaderNav } from './components/HeaderNav';
import { ScoreHUD } from './components/ScoreHUD';
import { AIInspector } from './components/AIInspector';
import { WeaponSkinBar } from './components/WeaponSkinBar';
import { GameOverOverlay } from './components/GameOverOverlay';
import { ControlsInfo } from './components/ControlsInfo';
import { InfoModal } from './components/InfoModal';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const resizeRef = useRef<() => void>(() => {});

  // App State
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('rifle');
  const [currentSkin, setCurrentSkin] = useState<DinoSkin>('classic');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showLaserSight, setShowLaserSight] = useState<boolean>(true);
  const [enableCrtEffect, setEnableCrtEffect] = useState<boolean>(false);
  const [isMusicOn, setIsMusicOn] = useState<boolean>(true);
  const [isCleanScreen, setIsCleanScreen] = useState<boolean>(false);
  const [isAutoSkin, setIsAutoSkin] = useState<boolean>(true);
  const [isAutoTheme, setIsAutoTheme] = useState<boolean>(true);
  const isAutoThemeRef = useRef<boolean>(true);

  // Score & Game Stats
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [kills, setKills] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [isInvulnerable, setIsInvulnerable] = useState<boolean>(false);

  // AI Telemetry & Settings
  const [telemetry, setTelemetry] = useState<AITelemetry | null>(null);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    accuracy: 0.88,
    reactionDelayMs: 90,
    jumpPrecision: 0.92,
    aggression: 0.9,
    missChance: 0.12,
    panicChance: 0.05,
    autoDuck: true
  });

  // Game Over State
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [deathInfo, setDeathInfo] = useState<DeathInfo | null>(null);
  const [autoRestartRemaining, setAutoRestartRemaining] = useState<number>(0);

  // Modals
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);

  // ----------------------------------------------------
  // INITIALIZE ENGINE
  // ----------------------------------------------------
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(
      canvasRef.current,
      theme,
      gameMode,
      aiSettings
    );

    engine.currentWeapon = currentWeapon;
    engine.currentSkin = currentSkin;
    engine.showLaserSight = showLaserSight;
    engineRef.current = engine;

    // Callbacks
    engine.setCallbacks(
      (s, hi, k, d) => {
        setScore(s);
        setHighScore(hi);
        setKills(k);
        setDistance(d);
        setIsInvulnerable(engine.hero.invulnerableTime > 0);
        setIsGameOver(engine.isGameOver);
        setAutoRestartRemaining(engine.autoRestartTimer);
      },
      (dInfo) => {
        setIsGameOver(true);
        setDeathInfo(dInfo);
      },
      (telem) => {
        setTelemetry(telem);
      },
      (weapon) => {
        setCurrentWeapon(weapon);
      },
      (skin) => {
        setCurrentSkin(skin);
      },
      (phase) => {
        if (isAutoThemeRef.current) {
          setTheme(phase === 'day' || phase === 'dawn' ? 'light' : 'dark');
        }
      }
    );

    // Initial resize (large cinematic screen)
    const handleResize = () => {
      if (!containerRef.current || !engineRef.current) return;
      const width = Math.min(1180, containerRef.current.clientWidth);
      const height = Math.max(300, Math.min(640, Math.round(width * 0.52)));
      engineRef.current.resize(width, height);
    };
    resizeRef.current = handleResize;

    handleResize();
    window.addEventListener('resize', handleResize);

    // Start engine loop
    engine.start();

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stop();
    };
  }, []); // run once on mount

  // Sync props to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.theme = theme;
    }
  }, [theme]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.gameMode = gameMode;
    }
  }, [gameMode]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.currentWeapon = currentWeapon;
    }
  }, [currentWeapon]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.currentSkin = currentSkin;
    }
  }, [currentSkin]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.autoSkin = isAutoSkin;
    }
  }, [isAutoSkin]);

  // Auto theme follows the in-game day/night cycle
  useEffect(() => {
    isAutoThemeRef.current = isAutoTheme;
    if (isAutoTheme && engineRef.current) {
      const phase: DayPhase = engineRef.current.dayPhase;
      setTheme(phase === 'day' || phase === 'dawn' ? 'light' : 'dark');
    }
  }, [isAutoTheme]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.showLaserSight = showLaserSight;
    }
  }, [showLaserSight]);

  useEffect(() => {
    soundManager.setMuted(isMuted);
  }, [isMuted]);

  useEffect(() => {
    soundManager.setMusicEnabled(isMusicOn);
  }, [isMusicOn]);

  // Browsers require a user gesture before audio; unlock the music on first input
  useEffect(() => {
    const unlock = () => {
      soundManager.unlock();
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Re-measure the canvas when switching layouts (clean recording mode)
  useEffect(() => {
    const id = requestAnimationFrame(() => resizeRef.current());
    return () => cancelAnimationFrame(id);
  }, [isCleanScreen]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.isPaused = isPaused;
    }
  }, [isPaused]);

  // ----------------------------------------------------
  // SETTINGS HANDLER
  // ----------------------------------------------------
  const handleUpdateAISettings = useCallback((newSettings: Partial<AISettings>) => {
    setAiSettings(prev => {
      const updated = { ...prev, ...newSettings };
      if (engineRef.current) {
        engineRef.current.aiController.updateSettings(updated);
      }
      return updated;
    });
  }, []);

  // ----------------------------------------------------
  // ACTION HANDLERS
  // ----------------------------------------------------
  const handleJump = useCallback(() => {
    if (!engineRef.current) return;
    if (engineRef.current.isGameOver) {
      engineRef.current.resetGame(true);
      setIsGameOver(false);
      setDeathInfo(null);
    } else {
      engineRef.current.jump();
    }
  }, []);

  const handleDuckStart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.setDucking(true);
    }
  }, []);

  const handleDuckEnd = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.setDucking(false);
    }
  }, []);

  const handleShoot = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.tryShoot();
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resetGame(true);
      setIsGameOver(false);
      setDeathInfo(null);
    }
  }, []);

  // ----------------------------------------------------
  // KEYBOARD SHORTCUTS
  // ----------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleJump();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        handleDuckStart();
      } else if (e.code === 'KeyF' || e.code === 'KeyE' || e.code === 'Enter') {
        e.preventDefault();
        handleShoot();
      } else if (e.code === 'KeyA') {
        e.preventDefault();
        setGameMode(m => (m === 'ai' ? 'manual' : 'ai'));
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        setIsAutoTheme(false);
        setTheme(t => (t === 'light' ? 'dark' : 'light'));
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        setIsMuted(m => !m);
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        setIsPaused(p => !p);
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setIsCleanScreen(v => !v);
      } else if (e.code === 'KeyB') {
        e.preventDefault();
        setIsMusicOn(m => !m);
      } else if (e.code === 'Digit1') {
        setCurrentWeapon('rifle');
      } else if (e.code === 'Digit2') {
        setCurrentWeapon('laser');
      } else if (e.code === 'Digit3') {
        setCurrentWeapon('shotgun');
      } else if (e.code === 'Digit4') {
        setCurrentWeapon('plasma');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        handleDuckEnd();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJump, handleDuckStart, handleDuckEnd, handleShoot]);

  // Handle canvas mouse click / aiming
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const heroGunX = engineRef.current.hero.x + 30;
    const heroGunY = engineRef.current.hero.y + 20;

    const angle = Math.atan2(clickY - heroGunY, clickX - heroGunX);
    engineRef.current.setAimAngle(angle);

    if (engineRef.current.isGameOver) {
      handleRestart();
    } else {
      engineRef.current.tryShoot();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current || gameMode !== 'manual') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const heroGunX = engineRef.current.hero.x + 30;
    const heroGunY = engineRef.current.hero.y + 20;

    const angle = Math.atan2(mouseY - heroGunY, mouseX - heroGunX);
    engineRef.current.setAimAngle(angle);
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 font-pixel selection:bg-cyan-500 selection:text-white ${
        isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-stone-100 text-stone-800'
      }`}
    >
      {/* Top Header (hidden in clean recording mode) */}
      {!isCleanScreen && (
        <HeaderNav
          theme={theme}
          onToggleTheme={() => {
            setIsAutoTheme(false);
            setTheme(t => (t === 'light' ? 'dark' : 'light'));
          }}
          isAutoTheme={isAutoTheme}
          onToggleAutoTheme={() => setIsAutoTheme(v => !v)}
          gameMode={gameMode}
          onToggleGameMode={() => setGameMode(m => (m === 'ai' ? 'manual' : 'ai'))}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(m => !m)}
          isMusicOn={isMusicOn}
          onToggleMusic={() => setIsMusicOn(m => !m)}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(p => !p)}
          isCleanScreen={isCleanScreen}
          onToggleCleanScreen={() => setIsCleanScreen(v => !v)}
          onOpenHelp={() => setIsInfoModalOpen(true)}
        />
      )}

      {/* Main Container */}
      <main
        className={
          isCleanScreen
            ? 'flex-1 w-full p-1 sm:p-2 flex flex-col gap-2'
            : 'flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4'
        }
      >
        {/* Game Screen Container */}
        <div
          ref={containerRef}
          className={`relative rounded-xl border-2 overflow-hidden shadow-2xl transition-all ${
            isDark
              ? 'bg-[#141419] border-zinc-800 shadow-[0_0_30px_rgba(0,0,0,0.8)]'
              : 'bg-[#f7f7f7] border-stone-400 shadow-xl'
          }`}
        >
          {/* Top-Right Score & HUD Overlay */}
          <div className="absolute top-0 left-0 right-0 z-10">
            <ScoreHUD
              score={score}
              highScore={highScore}
              kills={kills}
              distance={distance}
              theme={theme}
              isInvulnerable={isInvulnerable}
            />
          </div>

          {/* Canvas Rendering Game Loop */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            className="w-full block pixelated cursor-crosshair select-none"
            style={{ minHeight: '260px' }}
          />

          {/* CRT scanline overlay effect (optional) */}
          {enableCrtEffect && <div className="absolute inset-0 crt-overlay pointer-events-none" />}

          {/* Pause Screen Overlay */}
          {isPaused && (
            <div className="absolute inset-0 z-25 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
              <div
                className={`p-4 rounded-lg border font-pixel text-sm flex items-center gap-2 ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-amber-400' : 'bg-white border-stone-300 text-stone-800'
                }`}
              >
                <span>⏸️ ИГРА НА ПАУЗЕ [Нажмите P]</span>
              </div>
            </div>
          )}

          {/* Game Over Modal / Overlay */}
          {isGameOver && (
            <GameOverOverlay
              deathInfo={deathInfo}
              highScore={highScore}
              autoRestartTimeRemaining={autoRestartRemaining}
              onRestart={handleRestart}
              theme={theme}
            />
          )}

          {/* Clean recording mode: tiny exit affordance */}
          {isCleanScreen && (
            <button
              onClick={() => setIsCleanScreen(false)}
              className="absolute bottom-2 right-2 z-40 px-2 py-1 rounded border font-pixel text-[9px] bg-black/40 border-white/20 text-white/50 opacity-20 hover:opacity-100 transition-opacity cursor-pointer"
              title="Выйти из чистого режима [C]"
            >
              ВЫЙТИ [C]
            </button>
          )}
        </div>

        {!isCleanScreen && (
          <>
            {/* Weapons & Dino Skins Bar */}
            <WeaponSkinBar
              currentWeapon={currentWeapon}
              onSelectWeapon={setCurrentWeapon}
              currentSkin={currentSkin}
              onSelectSkin={skin => {
                setCurrentSkin(skin);
                setIsAutoSkin(false);
              }}
              isAutoSkin={isAutoSkin}
              onSelectAutoSkin={() => setIsAutoSkin(true)}
              theme={theme}
            />

            {/* AI Inspector & Telemetry Dashboard */}
            <AIInspector
              telemetry={telemetry}
              settings={aiSettings}
              onUpdateSettings={handleUpdateAISettings}
              showLaserSight={showLaserSight}
              onToggleLaserSight={() => setShowLaserSight(v => !v)}
              theme={theme}
            />

            {/* Controls, Hotkeys & Mobile Buttons */}
            <ControlsInfo
              gameMode={gameMode}
              theme={theme}
              onJump={handleJump}
              onDuckStart={handleDuckStart}
              onDuckEnd={handleDuckEnd}
              onShoot={handleShoot}
            />

            {/* Extra toggles row */}
            <div className="flex items-center justify-between text-[10px] font-pixel opacity-70 px-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCrtEffect}
                  onChange={e => setEnableCrtEffect(e.target.checked)}
                  className="accent-cyan-500 cursor-pointer"
                />
                <span>Эффект ЭЛТ-монитора (CRT Scanlines)</span>
              </label>

              <span>Google Dino Gunner AI v2.4</span>
            </div>
          </>
        )}
      </main>

      {/* Info / Guide Modal */}
      {!isCleanScreen && (
        <InfoModal
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          theme={theme}
        />
      )}
    </div>
  );
};

export default App;
