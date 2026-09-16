// Game Engine for Google Dino Gunner

import {
  ThemeMode,
  GameMode,
  WeaponType,
  DinoSkin,
  WeaponConfig,
  Obstacle,
  Enemy,
  Bullet,
  WeaponPickup,
  Particle,
  ShellCasing,
  FloatingText,
  Cloud,
  Star,
  GroundDetail,
  HeroState,
  AISettings,
  AITelemetry,
  DeathInfo,
  ObstacleType,
  GroundEnemyType,
  FlyingEnemyType,
  WeatherType,
  DayPhase,
  WaveType,
  ParallaxLayerObject,
  WeatherParticle,
  Atmosphere
} from './types';
import { AIController } from './aiController';
import { soundManager } from './audio';
import {
  drawDinoHero,
  drawObstacle,
  drawEnemy,
  drawBullet,
  drawParticles,
  drawShellCasings,
  drawFloatingTexts,
  drawBackground,
  drawGround,
  drawAILaserSight,
  drawWeaponPickups,
  drawComboCounter,
  drawParallax,
  drawAtmosphereOverlay,
  drawWeatherLayer,
  drawBanner
} from './sprites';

const WAVE_CONFIG: Record<
  WaveType,
  { obstacle: number; ground: number; air: number; gap: number; doubleObstacle?: boolean; duration: number }
> = {
  calm: { obstacle: 0.55, ground: 0.25, air: 0.15, gap: 1.5, duration: 10 },
  dense: { obstacle: 0.35, ground: 0.25, air: 0.25, gap: 0.72, duration: 9 },
  air_raid: { obstacle: 0.1, ground: 0.1, air: 0.7, gap: 0.95, duration: 9 },
  gauntlet: { obstacle: 0.45, ground: 0.45, air: 0.1, gap: 0.82, doubleObstacle: true, duration: 8 },
  boss: { obstacle: 0, ground: 0, air: 0, gap: 2.2, duration: 999 }
};

const WAVE_ROTATION: WaveType[] = ['calm', 'dense', 'air_raid', 'calm', 'gauntlet', 'dense', 'boss'];

export const WEAPONS_DATA: Record<WeaponType, WeaponConfig> = {
  rifle: {
    id: 'rifle',
    name: 'Assault Rifle',
    nameRu: 'Штурмовая винтовка',
    damage: 1,
    fireRate: 170,
    bulletSpeed: 18,
    bulletColor: '#ffaa00',
    bulletLength: 10,
    spreadAngle: 0.05,
    pellets: 1,
    icon: '🔫'
  },
  laser: {
    id: 'laser',
    name: 'Laser Blaster',
    nameRu: 'Лазерный бластер',
    damage: 2,
    fireRate: 210,
    bulletSpeed: 24,
    bulletColor: '#00f0ff',
    bulletLength: 16,
    spreadAngle: 0.02,
    pellets: 1,
    icon: '⚡'
  },
  shotgun: {
    id: 'shotgun',
    name: 'Combat Shotgun',
    nameRu: 'Боевой дробовик',
    damage: 1,
    fireRate: 340,
    bulletSpeed: 16,
    bulletColor: '#ff3300',
    bulletLength: 8,
    spreadAngle: 0.22,
    pellets: 4,
    icon: '💥'
  },
  plasma: {
    id: 'plasma',
    name: 'Plasma Cannon',
    nameRu: 'Плазменная пушка',
    damage: 3,
    fireRate: 260,
    bulletSpeed: 20,
    bulletColor: '#bf5af2',
    bulletLength: 14,
    spreadAngle: 0.04,
    pellets: 1,
    icon: '🔮'
  }
};

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Configuration & State
  public width: number = 920;
  public height: number = 300;
  public groundY: number = 245;
  public gravity: number = 0.65;
  public jumpForce: number = -12.4;

  public theme: ThemeMode = 'light';
  public gameMode: GameMode = 'ai';
  public currentWeapon: WeaponType = 'rifle';
  public currentSkin: DinoSkin = 'classic';
  public showLaserSight: boolean = true;

  // Game Progress
  public score: number = 0;
  public highScore: number = 0;
  public kills: number = 0;
  public distanceMeters: number = 0;

  // Speed ramps up linearly with elapsed run time (deterministic, no random bursts)
  public gameSpeed: number = 6.8;
  public baseGameSpeed: number = 6.8;
  public maxGameSpeed: number = 13.8;
  public speedRampPerSecond: number = 0.12;
  public runTime: number = 0;
  public isPaused: boolean = false;
  public isRunning: boolean = false;

  // Juice: brief freeze frames and camera shake
  public hitStopTimer: number = 0; // ms
  private shakeTimer: number = 0;
  private shakeDuration: number = 0;
  private shakeAmount: number = 0;

  // Combo streak
  public comboCount: number = 0;
  public comboTimer: number = 0;
  public comboWindowSeconds: number = 3.0;
  public maxCombo: number = 0;

  // Living world: day/night cycle, weather, wave director
  public worldTime: number = 0;
  public dayPhase: DayPhase = 'day';
  public phaseDuration: number = 40;
  private phaseTimer: number = 40;
  public weather: WeatherType = 'clear';
  private weatherPrev: WeatherType = 'clear';
  private weatherTimer: number = 30;
  private weatherFade: number = 1;
  private weatherFadeDuration: number = 3.5;
  public weatherParticles: WeatherParticle[] = [];
  private prevWeatherParticles: WeatherParticle[] = [];

  public waveType: WaveType = 'calm';
  public waveNumber: number = 0;
  private waveTimer: number = 8;
  private bossAlive: boolean = false;

  // On-screen announcement banner
  public bannerText: string = '';
  public bannerColor: string = '#ffffff';
  private bannerLife: number = 0;
  private bannerMaxLife: number = 1;

  public shotsFired: number = 0;
  public shotsHit: number = 0;

  // Entities
  public hero: HeroState;
  public obstacles: Obstacle[] = [];
  public enemies: Enemy[] = [];
  public weaponPickups: WeaponPickup[] = [];
  public bullets: Bullet[] = [];
  public particles: Particle[] = [];
  public shellCasings: ShellCasing[] = [];
  public floatingTexts: FloatingText[] = [];
  public clouds: Cloud[] = [];
  public stars: Star[] = [];
  public groundDetails: GroundDetail[] = [];
  public farHills: ParallaxLayerObject[] = [];
  public midDunes: ParallaxLayerObject[] = [];

  // Controllers
  public aiController: AIController;
  public telemetry: AITelemetry | null = null;

  // Spawner Tracking
  private nextSpawnDistance: number = 300;
  private nextPickupDistance: number = 650;
  private entityIdCounter: number = 1;
  private milestoneTracker: number = 0;

  // Auto-Restart after death
  public autoRestartTimer: number = 0;
  public isGameOver: boolean = false;
  public deathInfo: DeathInfo | null = null;

  // Callbacks to React UI
  private onScoreUpdate?: (score: number, highScore: number, kills: number, distance: number) => void;
  private onGameOverCallback?: (deathInfo: DeathInfo) => void;
  private onTelemetryUpdate?: (telemetry: AITelemetry) => void;
  private onWeaponPickupCallback?: (weapon: WeaponType) => void;

  constructor(
    canvas: HTMLCanvasElement,
    initialTheme: ThemeMode = 'light',
    initialMode: GameMode = 'ai',
    aiSettings: AISettings = {
      accuracy: 0.88,
      reactionDelayMs: 90,
      jumpPrecision: 0.92,
      aggression: 0.9,
      missChance: 0.12,
      panicChance: 0.05,
      autoDuck: true
    }
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.theme = initialTheme;
    this.gameMode = initialMode;
    this.aiController = new AIController(aiSettings);

    this.hero = this.createDefaultHero();
    this.initEnvironment();
    this.loadHighScore();
  }

  private createDefaultHero(): HeroState {
    return {
      x: 50,
      y: this.groundY - 47,
      width: 44,
      height: 47,
      vy: 0,
      isGrounded: true,
      isDucking: false,
      isJumping: false,
      jumpCount: 0,
      runFrame: 0,
      animTimer: 0,
      gunAngle: 0,
      recoilOffset: 0,
      lastShotTime: 0,
      invulnerableTime: 0,
      isDead: false,
      deathAnimTimer: 0
    };
  }

  private loadHighScore() {
    try {
      const saved = localStorage.getItem('dino_gunner_high_score');
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
    } catch {
      // localStorage might fail in private modes
    }
  }

  private saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
      try {
        localStorage.setItem('dino_gunner_high_score', this.highScore.toString());
      } catch {
        // ignore
      }
    }
  }

  public setCallbacks(
    onScore: (score: number, highScore: number, kills: number, distance: number) => void,
    onGameOver: (deathInfo: DeathInfo) => void,
    onTelemetry: (telemetry: AITelemetry) => void,
    onWeaponPickup?: (weapon: WeaponType) => void
  ) {
    this.onScoreUpdate = onScore;
    this.onGameOverCallback = onGameOver;
    this.onTelemetryUpdate = onTelemetry;
    this.onWeaponPickupCallback = onWeaponPickup;
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.groundY = Math.round(height * 0.82);
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.hero.isGrounded) {
      this.hero.y = this.groundY - (this.hero.isDucking ? 30 : 47);
    }
  }

  public initEnvironment() {
    this.clouds = [];
    this.stars = [];
    this.groundDetails = [];

    // Spawn initial clouds
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        id: this.entityIdCounter++,
        x: Math.random() * this.width,
        y: 20 + Math.random() * 80,
        speed: 0.3 + Math.random() * 0.4,
        width: 40 + Math.random() * 30,
        height: 16,
        type: Math.floor(Math.random() * 3)
      });
    }

    // Spawn stars for dark mode
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.groundY - 40),
        size: Math.random() > 0.8 ? 2 : 1,
        twinkleSpeed: 0.02 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Ground details
    for (let i = 0; i < 15; i++) {
      this.groundDetails.push({
        x: Math.random() * this.width,
        type: Math.random() > 0.7 ? 'grass' : (Math.random() > 0.5 ? 'pebble' : 'crack'),
        variant: Math.floor(Math.random() * 2)
      });
    }

    // Parallax layers (far hills + near dunes), spaced over one wrap period
    this.farHills = [];
    this.midDunes = [];
    const period = this.width + 400;

    let fx = -150;
    while (fx < period) {
      const w = 160 + Math.random() * 220;
      this.farHills.push({
        x: fx,
        width: w,
        height: 50 + Math.random() * 80,
        variant: Math.floor(Math.random() * 3)
      });
      fx += w * 0.7;
    }

    let mx = -220;
    while (mx < period) {
      const w = 220 + Math.random() * 260;
      this.midDunes.push({
        x: mx,
        width: w,
        height: 24 + Math.random() * 40,
        variant: Math.floor(Math.random() * 3)
      });
      mx += w * 0.65;
    }
  }

  // ----------------------------------------------------
  // GAME LIFECYCLE
  // ----------------------------------------------------
  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public resetGame(respawnWithInvulnerability: boolean = true) {
    this.saveHighScore();
    this.score = 0;
    this.kills = 0;
    this.distanceMeters = 0;
    this.gameSpeed = this.baseGameSpeed;
    this.runTime = 0;
    this.milestoneTracker = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.hitStopTimer = 0;
    this.shakeTimer = 0;
    this.shakeDuration = 0;
    this.shakeAmount = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.maxCombo = 0;

    this.hero = this.createDefaultHero();
    if (respawnWithInvulnerability) {
      this.hero.invulnerableTime = 1.8; // 1.8s flashing protection
      soundManager.playRespawn();
    }

    this.obstacles = [];
    this.enemies = [];
    this.weaponPickups = [];
    this.bullets = [];
    this.particles = [];
    this.shellCasings = [];
    this.floatingTexts = [];
    this.nextSpawnDistance = 350; // Give room at start
    this.nextPickupDistance = 650; // First weapon upgrade appears early
    this.waveType = 'calm';
    this.waveNumber = 0;
    this.waveTimer = 6;
    this.bossAlive = false;
    this.bannerLife = 0;

    this.isGameOver = false;
    this.deathInfo = null;
    this.autoRestartTimer = 0;
    this.aiController.resetState();

    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.score, this.highScore, this.kills, this.distanceMeters);
    }
  }

  private loop = (time: number) => {
    if (!this.isRunning) return;

    const deltaTimeMs = Math.min(time - this.lastTime, 60); // clamp delta
    this.lastTime = time;

    if (!this.isPaused) {
      this.update(deltaTimeMs);
    }
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  // ----------------------------------------------------
  // UPDATE LOOP
  // ----------------------------------------------------
  private update(dtMs: number) {
    const dt = dtMs / 1000;

    // Camera shake & combo timers keep running even during hit-stop
    this.updateScreenShake(dtMs);
    this.updateCombo(dt);

    // The world keeps living during hit-stop, deaths and respawns
    this.updateWorldClock(dt);
    this.updateWeather(dt);
    this.updateBanner(dt);

    // Hit-stop: a couple of frozen frames on kills/death for extra impact
    if (this.hitStopTimer > 0) {
      this.hitStopTimer = Math.max(0, this.hitStopTimer - dtMs);
      this.updateParticles(dt);
      return;
    }

    // Handle Auto-Restart after death
    if (this.isGameOver) {
      this.autoRestartTimer -= dt;
      if (this.autoRestartTimer <= 0) {
        this.resetGame(true);
      }
      this.updateParticles(dt);

      // Keep the UI countdown in sync while dead
      if (this.onScoreUpdate) {
        this.onScoreUpdate(
          Math.floor(this.score),
          this.highScore,
          this.kills,
          Math.floor(this.distanceMeters)
        );
      }
      return;
    }

    // Speed grows strictly with elapsed run time: linear, predictable, no feedback loop
    this.runTime += dt;
    this.gameSpeed = Math.min(this.maxGameSpeed, this.baseGameSpeed + this.runTime * this.speedRampPerSecond);

    // Distance and Score Accumulation
    this.distanceMeters += (this.gameSpeed * dt * 8);
    this.score += (this.gameSpeed * dt * 1.8);

    // Milestone Chimes (every 100 score)
    if (Math.floor(this.score / 100) > this.milestoneTracker) {
      this.milestoneTracker = Math.floor(this.score / 100);
      soundManager.playMilestone();
    }

    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
    }

    // Invulnerability timer countdown
    if (this.hero.invulnerableTime > 0) {
      this.hero.invulnerableTime = Math.max(0, this.hero.invulnerableTime - dt);
    }

    // Recoil recovery
    if (this.hero.recoilOffset > 0) {
      this.hero.recoilOffset = Math.max(0, this.hero.recoilOffset - dt * 25);
    }

    // ----------------------------------------------------
    // HERO PHYSICS & ANIMATION
    // ----------------------------------------------------
    // Gravity and Jumping
    if (!this.hero.isGrounded) {
      this.hero.vy += this.gravity;
      this.hero.y += this.hero.vy;

      const targetGroundY = this.groundY - (this.hero.isDucking ? 30 : 47);
      if (this.hero.y >= targetGroundY) {
        this.hero.y = targetGroundY;
        this.hero.vy = 0;
        this.hero.isGrounded = true;
        this.hero.isJumping = false;
        this.hero.jumpCount = 0;
      }
    }

    // Running frame animation (toggles every 80ms)
    this.hero.animTimer += dtMs;
    if (this.hero.animTimer >= 75) {
      this.hero.animTimer = 0;
      this.hero.runFrame = (this.hero.runFrame + 1) % 2;
    }

    // ----------------------------------------------------
    // AI OR MANUAL CONTROLLER EVALUATION
    // ----------------------------------------------------
    if (this.gameMode === 'ai') {
      const { action, telemetry } = this.aiController.evaluate(
        this.hero,
        this.obstacles,
        this.enemies,
        this.gameSpeed,
        this.width,
        dtMs
      );

      this.telemetry = telemetry;
      if (this.onTelemetryUpdate) {
        this.onTelemetryUpdate(telemetry);
      }

      // Execute AI Jumping
      if (action.shouldJump && this.hero.isGrounded) {
        this.jump();
      }

      // Execute AI Ducking
      this.hero.isDucking = action.shouldDuck;
      if (this.hero.isDucking && this.hero.isGrounded) {
        this.hero.height = 30;
        this.hero.y = this.groundY - 30;
      } else if (!this.hero.isDucking && this.hero.isGrounded) {
        this.hero.height = 47;
        this.hero.y = this.groundY - 47;
      }

      // Execute AI Gun Angle & Shooting
      this.hero.gunAngle = action.targetAngle;
      if (action.shouldShoot) {
        this.tryShoot();
      }
    }

    // ----------------------------------------------------
    // SCENERY SCROLLING
    // ----------------------------------------------------
    this.updateScenery(dt);

    // ----------------------------------------------------
    // SPAWN OBSTACLES & ENEMIES
    // ----------------------------------------------------
    this.updateSpawning(dt);

    // ----------------------------------------------------
    // ENTITIES UPDATE (Obstacles, Enemies, Bullets)
    // ----------------------------------------------------
    this.updateObstacles();
    this.updateEnemies(dt);
    this.updateWeaponPickups();
    this.updateBullets();
    this.updateParticles(dt);
    this.updateShellCasings(dt);
    this.updateFloatingTexts(dt);

    // ----------------------------------------------------
    // COLLISION DETECTION
    // ----------------------------------------------------
    this.checkPickupCollisions();
    this.checkCollisions();

    // Push scores to React
    if (this.onScoreUpdate) {
      this.onScoreUpdate(
        Math.floor(this.score),
        this.highScore,
        this.kills,
        Math.floor(this.distanceMeters)
      );
    }
  }

  // ----------------------------------------------------
  // JUICE: SCREEN SHAKE, HIT-STOP, COMBO
  // ----------------------------------------------------
  private updateScreenShake(dtMs: number) {
    if (this.shakeTimer <= 0) return;
    this.shakeTimer = Math.max(0, this.shakeTimer - dtMs);
    if (this.shakeTimer <= 0) {
      this.shakeAmount = 0;
      this.shakeDuration = 0;
    }
  }

  private triggerShake(intensity: number, durationMs: number) {
    this.shakeAmount = Math.max(this.shakeAmount, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, durationMs);
    this.shakeDuration = Math.max(this.shakeDuration, durationMs);
  }

  private updateCombo(dt: number) {
    if (this.comboCount <= 0) return;
    this.comboTimer -= dt;
    if (this.comboTimer <= 0) {
      this.comboCount = 0;
      this.comboTimer = 0;
    }
  }

  private registerKill(): number {
    this.comboCount++;
    this.comboTimer = this.comboWindowSeconds;
    this.maxCombo = Math.max(this.maxCombo, this.comboCount);

    const tier = Math.min(8, this.comboCount);
    if (tier === 3 || tier === 5 || tier === 8) {
      soundManager.playCombo(tier);
      this.triggerShake(2 + tier * 0.6, 220);
    }

    return tier;
  }

  // ----------------------------------------------------
  // LIVING WORLD: DAY/NIGHT CYCLE, WEATHER, BANNERS
  // ----------------------------------------------------
  private updateWorldClock(dt: number) {
    this.worldTime += dt;

    this.phaseTimer -= dt;
    if (this.phaseTimer <= 0) {
      this.advanceDayPhase();
    }

    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      this.rollWeather();
    }

    // Music tempo follows the run speed
    const speedNorm = (this.gameSpeed - this.baseGameSpeed) / (this.maxGameSpeed - this.baseGameSpeed);
    soundManager.setMusicBpm(112 + Math.max(0, Math.min(1, speedNorm)) * 44);
  }

  private advanceDayPhase() {
    const order: DayPhase[] = ['day', 'sunset', 'night', 'dawn'];
    this.dayPhase = order[(order.indexOf(this.dayPhase) + 1) % order.length];

    const durations: Record<DayPhase, number> = { day: 50, sunset: 22, night: 40, dawn: 20 };
    this.phaseDuration = durations[this.dayPhase] * (0.8 + Math.random() * 0.4);
    this.phaseTimer = this.phaseDuration;

    const labels: Record<DayPhase, string> = {
      day: '☀ ДЕНЬ',
      sunset: '🌇 ЗАКАТ',
      night: '🌙 НОЧЬ',
      dawn: '🌅 РАССВЕТ'
    };
    this.showBanner(labels[this.dayPhase], this.dayPhase === 'night' ? '#9db4ff' : '#ffcc66', 2.0);
  }

  private rollWeather() {
    // Always pick a different weather so the transition is visible
    const options: WeatherType[] = ['clear', 'rain', 'snow', 'sandstorm'].filter(w => w !== this.weather) as WeatherType[];
    const next = options[Math.floor(Math.random() * options.length)];
    this.setWeather(next);
  }

  private setWeather(weather: WeatherType) {
    if (weather === this.weather) return;

    // Keep the outgoing particles around so everything crossfades smoothly
    this.weatherPrev = this.weather;
    this.prevWeatherParticles = this.weatherParticles;
    this.weather = weather;
    this.weatherTimer = 18 + Math.random() * 18;
    this.weatherFade = 0;
    this.weatherParticles = [];

    const counts: Record<WeatherType, number> = { clear: 0, rain: 90, snow: 70, sandstorm: 60 };
    for (let i = 0; i < counts[weather]; i++) {
      this.weatherParticles.push(this.createWeatherParticle(weather, true));
    }
  }

  private createWeatherParticle(weather: WeatherType, anywhere: boolean): WeatherParticle {
    const w = this.width;
    const h = this.height;
    const startY = anywhere ? Math.random() * h : -20;

    if (weather === 'rain') {
      return {
        x: Math.random() * w,
        y: startY,
        vx: -1.5 - Math.random() * 1.5,
        vy: 9 + Math.random() * 5,
        len: 8 + Math.random() * 8,
        size: 1,
        alpha: 0.35 + Math.random() * 0.35
      };
    }
    if (weather === 'snow') {
      return {
        x: Math.random() * w,
        y: startY,
        vx: -0.4 + Math.random() * 0.8,
        vy: 0.8 + Math.random() * 1.2,
        len: 2,
        size: Math.random() > 0.7 ? 2 : 1,
        alpha: 0.5 + Math.random() * 0.4
      };
    }
    if (weather === 'sandstorm') {
      return {
        x: anywhere ? Math.random() * w : w + Math.random() * 80,
        y: Math.random() * h,
        vx: -9 - Math.random() * 7,
        vy: 0.3 + Math.random(),
        len: 10 + Math.random() * 14,
        size: 1,
        alpha: 0.25 + Math.random() * 0.3
      };
    }
    return { x: 0, y: 0, vx: 0, vy: 0, len: 0, size: 0, alpha: 0 };
  }

  private updateWeather(dt: number) {
    // Crossfade progress
    if (this.weatherFade < 1) {
      this.weatherFade = Math.min(1, this.weatherFade + dt / this.weatherFadeDuration);
      if (this.weatherFade >= 1) {
        this.prevWeatherParticles = [];
      }
    }

    const advance = (particles: WeatherParticle[], weather: WeatherType) => {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const drift = weather === 'snow' ? Math.sin((this.worldTime + p.y * 0.05) * 2) * 0.5 : 0;
        p.x += p.vx + drift;
        p.y += p.vy;

        if (p.x < -60 || p.y > this.height + 30) {
          particles[i] = this.createWeatherParticle(weather, false);
        }
      }
    };

    advance(this.weatherParticles, this.weather);
    if (this.weatherFade < 1) {
      advance(this.prevWeatherParticles, this.weatherPrev);
    }
  }

  public getAtmosphere(): Atmosphere {
    const progress = this.phaseDuration > 0 ? 1 - this.phaseTimer / this.phaseDuration : 0;
    let night = 0;
    let sunset = 0;

    switch (this.dayPhase) {
      case 'sunset':
        night = progress;
        sunset = Math.sin(progress * Math.PI);
        break;
      case 'night':
        night = 1;
        break;
      case 'dawn':
        night = 1 - progress;
        sunset = Math.sin(progress * Math.PI) * 0.4;
        break;
      default:
        night = 0;
        break;
    }

    const fadeSmooth = this.weatherFade * this.weatherFade * (3 - 2 * this.weatherFade); // smoothstep
    return {
      night,
      sunset,
      weather: this.weather,
      weatherStrength: fadeSmooth,
      previousWeather: this.weatherPrev,
      previousStrength: 1 - fadeSmooth
    };
  }

  public showBanner(text: string, color: string, life: number = 2.2) {
    this.bannerText = text;
    this.bannerColor = color;
    this.bannerLife = life;
    this.bannerMaxLife = life;
  }

  private updateBanner(dt: number) {
    if (this.bannerLife > 0) {
      this.bannerLife = Math.max(0, this.bannerLife - dt);
    }
  }

  // ----------------------------------------------------
  // SCENERY UPDATE
  // ----------------------------------------------------
  private updateScenery(_dt: number) {
    // Parallax hills & dunes scroll slower than the ground
    const wrapPeriod = this.width + 400;
    this.farHills.forEach(h => {
      h.x -= this.gameSpeed * 0.12;
      if (h.x + h.width < -80) h.x += wrapPeriod;
    });
    this.midDunes.forEach(d => {
      d.x -= this.gameSpeed * 0.3;
      if (d.x + d.width < -80) d.x += wrapPeriod;
    });

    // Clouds
    this.clouds.forEach(cl => {
      cl.x -= (this.gameSpeed * 0.15 + cl.speed);
      if (cl.x + cl.width < 0) {
        cl.x = this.width + Math.random() * 80;
        cl.y = 20 + Math.random() * 80;
      }
    });

    // Stars phase
    if (this.theme === 'dark') {
      this.stars.forEach(st => {
        st.phase += st.twinkleSpeed;
      });
    }

    // Ground details
    this.groundDetails.forEach(gd => {
      gd.x -= this.gameSpeed;
      if (gd.x < -20) {
        gd.x = this.width + Math.random() * 50;
        gd.type = Math.random() > 0.7 ? 'grass' : (Math.random() > 0.5 ? 'pebble' : 'crack');
        gd.variant = Math.floor(Math.random() * 2);
      }
    });
  }

  // ----------------------------------------------------
  // SPAWNING SYSTEM
  // ----------------------------------------------------
  private updateSpawning(dt: number) {
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.startNextWave();
    }

    this.bossAlive = this.enemies.some(e => e.isBoss && e.hp > 0);

    // Weapon pickups spawn on their own rhythm, not tied to hazards or waves
    this.nextPickupDistance -= this.gameSpeed;
    if (this.nextPickupDistance <= 0) {
      this.spawnWeaponPickup();
      this.nextPickupDistance = 2000 + Math.random() * 1500 + this.gameSpeed * 20;
    }

    // Boss fights pause regular spawning until it is dead
    if (this.waveType === 'boss' && this.bossAlive) {
      return;
    }

    const cfg = WAVE_CONFIG[this.waveType];
    this.nextSpawnDistance -= this.gameSpeed;

    if (this.nextSpawnDistance <= 0) {
      const roll = Math.random();
      const pObstacle = cfg.obstacle;
      const pGround = pObstacle + cfg.ground;
      const pAir = pGround + cfg.air;

      if (roll < pObstacle) {
        this.spawnObstacle();
      } else if (roll < pGround) {
        this.spawnGroundEnemy();
      } else if (roll < pAir) {
        this.spawnFlyingEnemy();
      } else {
        // Combo spawn: obstacle with a flyer overhead
        this.spawnObstacle();
        this.spawnFlyingEnemy(this.width + 40, 'mid');
      }

      if (cfg.doubleObstacle && Math.random() < 0.5) {
        this.spawnObstacle();
      }

      const baseGap = 260 + Math.random() * 160;
      this.nextSpawnDistance = (baseGap + this.gameSpeed * 10) * cfg.gap;
    }
  }

  private startNextWave() {
    const next = WAVE_ROTATION[this.waveNumber % WAVE_ROTATION.length];
    this.waveNumber++;
    this.waveType = next;

    if (next === 'boss') {
      this.waveTimer = WAVE_CONFIG.boss.duration;
      this.spawnBoss();
      soundManager.playCombo(8);
      this.triggerShake(6, 400);
      return;
    }

    this.waveTimer = WAVE_CONFIG[next].duration * (0.85 + Math.random() * 0.3);
  }

  private spawnBoss() {
    const hp = 10 + Math.floor(this.waveNumber / WAVE_ROTATION.length) * 4;
    const w = 48;
    const h = 42;

    this.enemies.push({
      id: this.entityIdCounter++,
      x: this.width + 60,
      y: this.groundY - h,
      width: w,
      height: h,
      type: 'robot_drone',
      isFlying: false,
      isBoss: true,
      hp,
      maxHp: hp,
      scoreValue: 500,
      animFrame: 0,
      animTimer: 0
    });
  }

  private spawnWeaponPickup() {
    const allWeapons = Object.keys(WEAPONS_DATA) as WeaponType[];
    const choices = allWeapons.filter(w => w !== this.currentWeapon);
    const weapon = choices[Math.floor(Math.random() * choices.length)];
    const size = 28;

    // Never stack the pickup right on top of a hazard
    let spawnX = this.width + 30;
    const blocked = [...this.obstacles, ...this.enemies].some(
      o => o.x + o.width > spawnX - 60 && o.x < spawnX + 160
    );
    if (blocked) {
      spawnX += 180;
    }

    this.weaponPickups.push({
      id: this.entityIdCounter++,
      x: spawnX,
      y: this.groundY - 50 - size / 2,
      width: size,
      height: size,
      weapon,
      bobPhase: Math.random() * Math.PI * 2,
      bobOffset: 0
    });
  }

  private spawnObstacle() {
    const types: ObstacleType[] = [
      'cactus_small',
      'cactus_double',
      'cactus_triple',
      'cactus_large',
      'rock',
      'spikes',
      'barricade'
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    let w = 24;
    let h = 34;

    switch (type) {
      case 'cactus_small':
        w = 20; h = 34; break;
      case 'cactus_double':
        w = 34; h = 34; break;
      case 'cactus_triple':
        w = 46; h = 38; break;
      case 'cactus_large':
        w = 28; h = 48; break;
      case 'rock':
        w = 32; h = 26; break;
      case 'spikes':
        w = 40; h = 20; break;
      case 'barricade':
        w = 36; h = 32; break;
    }

    this.obstacles.push({
      id: this.entityIdCounter++,
      x: this.width + 20,
      y: this.groundY - h,
      width: w,
      height: h,
      type
    });
  }

  private spawnGroundEnemy() {
    const types: GroundEnemyType[] = ['robot_drone', 'scorpion', 'bone_raptor'];
    const type = types[Math.floor(Math.random() * types.length)];

    const w = 32;
    const h = 28;
    const hp = type === 'robot_drone' ? 2 : 1;

    this.enemies.push({
      id: this.entityIdCounter++,
      x: this.width + 20,
      y: this.groundY - h,
      width: w,
      height: h,
      type,
      isFlying: false,
      hp,
      maxHp: hp,
      scoreValue: 60,
      animFrame: 0,
      animTimer: 0
    });
  }

  private spawnFlyingEnemy(spawnX?: number, forcedAltitude?: 'low' | 'mid' | 'high') {
    const types: FlyingEnemyType[] = ['pterodactyl', 'flying_drone', 'mutant_bat'];
    const type = types[Math.floor(Math.random() * types.length)];

    const altitudes: Array<'low' | 'mid' | 'high'> = ['low', 'mid', 'high'];
    const altitude = forcedAltitude || altitudes[Math.floor(Math.random() * altitudes.length)];

    const w = 36;
    const h = 28;

    // Calculate Y based on altitude:
    // Low: touches ground when jumping (20-35px above ground) - can be jumped over or shot
    // Mid: head level (55-75px above ground) - can be ducked or shot, jumps might collide!
    // High: (95-125px above ground) - fly high overhead, safe to run under or shoot for bonus
    let enemyY = this.groundY - 65;
    if (altitude === 'low') {
      enemyY = this.groundY - 38;
    } else if (altitude === 'mid') {
      enemyY = this.groundY - 72;
    } else if (altitude === 'high') {
      enemyY = this.groundY - 110;
    }

    this.enemies.push({
      id: this.entityIdCounter++,
      x: spawnX || (this.width + 20),
      y: enemyY,
      width: w,
      height: h,
      type,
      isFlying: true,
      flyingAltitude: altitude,
      hp: 1,
      maxHp: 1,
      scoreValue: altitude === 'high' ? 120 : (altitude === 'mid' ? 100 : 80),
      animFrame: 0,
      animTimer: 0,
      bobOffset: 0,
      bobSpeed: 0.08 + Math.random() * 0.04
    });
  }

  // ----------------------------------------------------
  // ENTITY UPDATES
  // ----------------------------------------------------
  private updateObstacles() {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.gameSpeed;
      if (obs.x + obs.width < -30) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      // Enemies scroll with ground (stationary hazards)
      e.x -= this.gameSpeed;

      // Animate frame
      e.animTimer += dt * 1000;
      if (e.animTimer >= 120) {
        e.animTimer = 0;
        e.animFrame = (e.animFrame + 1) % 2;
      }

      // Flying bobbing
      if (e.isFlying) {
        e.bobOffset = Math.sin((e.bobSpeed || 0.1) * performance.now() * 0.05) * 4;
      }

      if (e.x + e.width < -30) {
        if (e.isBoss) {
          this.showBanner('БОСС УШЁЛ...', '#888888', 1.6);
          this.waveTimer = 1.2;
        }
        this.enemies.splice(i, 1);
      }
    }
  }

  private updateWeaponPickups() {
    for (let i = this.weaponPickups.length - 1; i >= 0; i--) {
      const pu = this.weaponPickups[i];
      pu.x -= this.gameSpeed;
      pu.bobOffset = Math.sin(performance.now() * 0.004 + pu.bobPhase) * 3;

      if (pu.x + pu.width < -30) {
        this.weaponPickups.splice(i, 1);
      }
    }
  }

  private updateBullets() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.distanceTraveled += Math.sqrt(b.vx * b.vx + b.vy * b.vy);

      // Despawn if out of screen bounds or exceeded max distance
      if (b.x > this.width + 50 || b.y < -50 || b.y > this.height + 50 || b.distanceTraveled > b.maxDistance) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check bullet hit on obstacles (some obstacles absorb bullets)
      let bulletConsumed = false;
      for (const obs of this.obstacles) {
        if (
          b.x >= obs.x &&
          b.x <= obs.x + obs.width &&
          b.y >= obs.y &&
          b.y <= obs.y + obs.height
        ) {
          // Bullet hits obstacle: create spark particles
          this.createSparkParticles(b.x, b.y, '#ffff88', 4);
          this.bullets.splice(i, 1);
          bulletConsumed = true;
          break;
        }
      }
      if (bulletConsumed) continue;

      // Check bullet hit on living enemies
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const enemy = this.enemies[j];
        if (enemy.hp <= 0) continue;

        const enemyHitY = enemy.y + (enemy.bobOffset || 0);
        if (
          b.x >= enemy.x &&
          b.x <= enemy.x + enemy.width &&
          b.y >= enemyHitY &&
          b.y <= enemyHitY + enemy.height
        ) {
          // Hit detected!
          this.shotsHit++;
          enemy.hp -= b.damage;

          // Sound and spark
          soundManager.playHit();
          this.createSparkParticles(b.x, b.y, enemy.isFlying ? '#bf5af2' : '#ff3333', 6);

          if (enemy.hp <= 0) {
            // Enemy Destroyed!
            this.kills++;
            const comboMult = this.registerKill();
            const gained = enemy.scoreValue * comboMult;
            this.score += gained;

            // Juice: frozen frames + camera kick scale with combo
            const comboBoost = comboMult >= 5 ? 1.6 : comboMult >= 3 ? 1.3 : 1;
            this.hitStopTimer = Math.max(this.hitStopTimer, (enemy.maxHp > 1 || enemy.isFlying ? 55 : 35) * comboBoost);
            this.triggerShake((enemy.isFlying ? 4 : 3) * comboBoost, 180);

            if (enemy.isBoss) {
              this.showBanner('БОСС ПОВЕРЖЕН!', '#00ff66', 2.4);
              this.hitStopTimer = Math.max(this.hitStopTimer, 110);
              this.triggerShake(10, 500);
              soundManager.playCombo(8);
              this.waveTimer = 1.2;
            }

            // Pixel Debris Explosion
            this.createExplosion(enemy.x + enemy.width / 2, enemyHitY + enemy.height / 2, enemy.isFlying ? '#bf5af2' : '#ff3333');

            // Floating Score Popup
            const baseText = enemy.isFlying ? `+${gained} AIR!` : `+${gained}`;
            const text = comboMult > 1 ? `${baseText} x${comboMult}` : baseText;
            const popupColor = comboMult >= 5 ? '#ff0055' : comboMult >= 3 ? '#ffaa00' : enemy.isFlying ? '#00f0ff' : '#00ff66';
            this.floatingTexts.push({
              id: this.entityIdCounter++,
              text,
              x: enemy.x,
              y: enemyHitY - 5,
              color: popupColor,
              alpha: 1.0,
              life: 0.8
            });

            this.enemies.splice(j, 1);
          }

          this.bullets.splice(i, 1);
          break;
        }
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateShellCasings(dt: number) {
    for (let i = this.shellCasings.length - 1; i >= 0; i--) {
      const s = this.shellCasings[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.5; // gravity
      s.rotation += s.rotSpeed;

      // Bounce on ground
      if (s.y >= s.groundY) {
        s.y = s.groundY;
        s.vy = -s.vy * 0.4;
        s.vx *= 0.6;
        s.bounces++;
      }

      if (s.bounces > 3) {
        s.alpha -= dt * 1.5;
      }

      if (s.alpha <= 0 || s.x < -20) {
        this.shellCasings.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 25 * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / 0.8);

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // ----------------------------------------------------
  // COLLISION DETECTION (Hero vs Obstacles & Enemies)
  // ----------------------------------------------------
  private getHeroHitbox() {
    return {
      x: this.hero.x + 8,
      y: this.hero.y + 6,
      width: this.hero.width - 16,
      height: this.hero.height - 8
    };
  }

  private checkPickupCollisions() {
    if (this.hero.isDead) return;

    const heroBox = this.getHeroHitbox();

    for (let i = this.weaponPickups.length - 1; i >= 0; i--) {
      const pu = this.weaponPickups[i];
      const pickupBox = {
        x: pu.x + 3,
        y: pu.y + pu.bobOffset + 3,
        width: pu.width - 6,
        height: pu.height - 6
      };

      if (this.checkAABB(heroBox, pickupBox)) {
        this.collectWeaponPickup(pu);
        this.weaponPickups.splice(i, 1);
      }
    }
  }

  private collectWeaponPickup(pickup: WeaponPickup) {
    const weapon = WEAPONS_DATA[pickup.weapon];
    this.currentWeapon = pickup.weapon;
    this.score += 25;

    soundManager.playPickup();
    this.triggerShake(2, 140);
    this.createSparkParticles(
      pickup.x + pickup.width / 2,
      pickup.y + pickup.bobOffset + pickup.height / 2,
      weapon.bulletColor,
      10
    );

    this.floatingTexts.push({
      id: this.entityIdCounter++,
      text: `${weapon.icon} ${weapon.nameRu.toUpperCase()}`,
      x: pickup.x - 24,
      y: pickup.y + pickup.bobOffset - 6,
      color: weapon.bulletColor,
      alpha: 1.0,
      life: 0.8
    });

    if (this.onWeaponPickupCallback) {
      this.onWeaponPickupCallback(pickup.weapon);
    }
  }

  private checkCollisions() {
    if (this.hero.isDead || this.hero.invulnerableTime > 0) return;

    // Tight hero hitbox
    const heroBox = this.getHeroHitbox();

    // Check Obstacles
    for (const obs of this.obstacles) {
      const obsBox = {
        x: obs.x + 4,
        y: obs.y + 4,
        width: obs.width - 8,
        height: obs.height - 4
      };

      if (this.checkAABB(heroBox, obsBox)) {
        this.handleDeath(this.getObstacleNameRu(obs.type), 'obstacle');
        return;
      }
    }

    // Check Living Enemies
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;

      const enemyHitY = enemy.y + (enemy.bobOffset || 0);
      const enemyBox = {
        x: enemy.x + 4,
        y: enemyHitY + 4,
        width: enemy.width - 8,
        height: enemy.height - 6
      };

      if (this.checkAABB(heroBox, enemyBox)) {
        const isAir = enemy.isFlying;
        const nameRu = this.getEnemyNameRu(enemy.type);
        this.handleDeath(nameRu, isAir ? 'flying_enemy' : 'ground_enemy');
        return;
      }
    }
  }

  private checkAABB(
    r1: { x: number; y: number; width: number; height: number },
    r2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  // ----------------------------------------------------
  // DEATH & GAME OVER FLOW
  // ----------------------------------------------------
  private handleDeath(killerName: string, killerType: DeathInfo['killerType']) {
    this.hero.isDead = true;
    this.isGameOver = true;
    this.autoRestartTimer = 2.4; // 2.4s auto-countdown to restart

    // Dramatic freeze + heavy camera shake, combo is lost
    this.hitStopTimer = Math.max(this.hitStopTimer, 120);
    this.triggerShake(11, 600);
    this.comboCount = 0;
    this.comboTimer = 0;

    soundManager.playGameOver();

    // Spawn massive pixel shatter explosion from Dino
    this.createExplosion(this.hero.x + 20, this.hero.y + 20, '#ff3333', 35);

    const accuracy = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 100;

    this.deathInfo = {
      killerName,
      killerType,
      score: Math.floor(this.score),
      kills: this.kills,
      distance: Math.floor(this.distanceMeters),
      accuracy,
      shotsFired: this.shotsFired,
      shotsHit: this.shotsHit,
      maxCombo: this.maxCombo
    };

    this.saveHighScore();

    if (this.onGameOverCallback) {
      this.onGameOverCallback(this.deathInfo);
    }
  }

  // ----------------------------------------------------
  // ACTIONS (Jump, Shoot, Duck)
  // ----------------------------------------------------
  public jump() {
    if (this.hero.isGrounded && !this.hero.isDead) {
      this.hero.vy = this.jumpForce;
      this.hero.isGrounded = false;
      this.hero.isJumping = true;
      soundManager.playJump();

      // Jump dust particles
      this.createSparkParticles(this.hero.x + 10, this.groundY, '#888888', 5);
    }
  }

  public setDucking(ducking: boolean) {
    if (this.hero.isDead) return;
    this.hero.isDucking = ducking;
    if (this.hero.isGrounded) {
      this.hero.height = ducking ? 30 : 47;
      this.hero.y = this.groundY - this.hero.height;
    }
  }

  public tryShoot(): boolean {
    if (this.hero.isDead) return false;

    const now = performance.now();
    const weapon = WEAPONS_DATA[this.currentWeapon];

    if (now - this.hero.lastShotTime < weapon.fireRate) {
      return false; // on cooldown
    }

    this.hero.lastShotTime = now;
    this.hero.recoilOffset = 6;
    this.shotsFired += weapon.pellets;

    soundManager.playShoot(weapon.id);
    this.triggerShake(weapon.id === 'shotgun' ? 2.5 : 1.2, 80);

    // Muzzle origin in world space
    const originX = this.hero.x + 30;
    const originY = this.hero.y + (this.hero.isDucking ? 18 : 20);
    const angle = this.hero.gunAngle;

    for (let p = 0; p < weapon.pellets; p++) {
      // Pellets spread
      let pelletAngle = angle;
      if (weapon.pellets > 1) {
        const spreadStep = (p - (weapon.pellets - 1) / 2) * (weapon.spreadAngle / weapon.pellets);
        pelletAngle += spreadStep;
      }

      const vx = Math.cos(pelletAngle) * weapon.bulletSpeed;
      const vy = Math.sin(pelletAngle) * weapon.bulletSpeed;

      this.bullets.push({
        id: this.entityIdCounter++,
        x: originX + Math.cos(angle) * 18,
        y: originY + Math.sin(angle) * 18,
        vx,
        vy,
        width: weapon.bulletLength,
        height: 4,
        color: weapon.bulletColor,
        damage: weapon.damage,
        isLaser: weapon.id === 'laser' || weapon.id === 'plasma',
        distanceTraveled: 0,
        maxDistance: 600
      });
    }

    // Eject shell casing
    this.shellCasings.push({
      id: this.entityIdCounter++,
      x: originX - 4,
      y: originY - 2,
      vx: -2 - Math.random() * 2,
      vy: -3 - Math.random() * 2,
      rotation: Math.random() * Math.PI,
      rotSpeed: 0.2 + Math.random() * 0.3,
      groundY: this.groundY + 2,
      bounces: 0,
      alpha: 1.0
    });

    return true;
  }

  public setAimAngle(angleRad: number) {
    this.hero.gunAngle = Math.max(-1.05, Math.min(0.52, angleRad));
  }

  // ----------------------------------------------------
  // PARTICLE GENERATORS
  // ----------------------------------------------------
  private createExplosion(x: number, y: number, color: string, count: number = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        id: this.entityIdCounter++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 4,
        color: Math.random() > 0.4 ? color : '#ffff00',
        alpha: 1.0,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        gravity: 0.25,
        isPixelDebris: true
      });
    }
  }

  private createSparkParticles(x: number, y: number, color: string, count: number = 6) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * Math.PI;
      const speed = 1.5 + Math.random() * 4;
      this.particles.push({
        id: this.entityIdCounter++,
        x,
        y,
        vx: -Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2,
        color,
        alpha: 1.0,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        gravity: 0.2
      });
    }
  }

  // ----------------------------------------------------
  // RENDER PIPELINE
  // ----------------------------------------------------
  private render() {
    const atmosphere = this.getAtmosphere();

    // 1. Clear & Background (Sky, Sun/Moon, Clouds, Stars) - stays put to cover shaken edges
    drawBackground(this.ctx, this.width, this.height, this.theme, this.clouds, this.stars, atmosphere);

    // Camera shake offset for shots, kills, pickups and death
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTimer > 0 && this.shakeDuration > 0 && !this.isPaused) {
      const power = this.shakeAmount * (this.shakeTimer / this.shakeDuration);
      shakeX = (Math.random() - 0.5) * 2 * power;
      shakeY = (Math.random() - 0.5) * 2 * power * 0.7;
    }

    this.ctx.save();
    this.ctx.translate(Math.round(shakeX), Math.round(shakeY));

    // 2. Parallax layers (far hills -> near dunes)
    drawParallax(this.ctx, this.groundY, this.theme, this.farHills, this.midDunes);

    // 3. Ground & Pebbles
    drawGround(this.ctx, this.width, this.groundY, this.theme, this.groundDetails);

    // 4. AI Laser Sight Ray (if enabled)
    if (this.showLaserSight && this.gameMode === 'ai' && !this.hero.isDead) {
      drawAILaserSight(this.ctx, this.telemetry, this.theme);
    }

    // 5. Shell Casings on ground
    drawShellCasings(this.ctx, this.shellCasings);

    // 6. Obstacles
    this.obstacles.forEach(obs => {
      drawObstacle(this.ctx, obs, this.theme);
    });

    // 7. Enemies
    this.enemies.forEach(e => {
      drawEnemy(this.ctx, e, this.theme);
    });

    // 8. Weapon Pickups on the path
    drawWeaponPickups(this.ctx, this.weaponPickups, this.theme);

    // 9. Bullets & Lasers
    this.bullets.forEach(b => {
      drawBullet(this.ctx, b, this.theme);
    });

    // 10. Dino Hero
    drawDinoHero(this.ctx, this.hero, this.groundY, this.theme, this.currentSkin, this.currentWeapon);

    // 11. Particles & Shards
    drawParticles(this.ctx, this.particles);

    // 12. Floating Texts (+100, etc.)
    drawFloatingTexts(this.ctx, this.floatingTexts);

    this.ctx.restore();

    // Screen-space layers: atmosphere tint, crossfading weather, combo counter, banner
    drawAtmosphereOverlay(this.ctx, this.width, this.height, atmosphere);
    if (atmosphere.previousStrength > 0.01) {
      drawWeatherLayer(this.ctx, this.prevWeatherParticles, atmosphere.previousWeather, atmosphere.previousStrength);
    }
    drawWeatherLayer(this.ctx, this.weatherParticles, atmosphere.weather, atmosphere.weatherStrength);
    drawComboCounter(this.ctx, this.comboCount, this.comboTimer / this.comboWindowSeconds);
    drawBanner(this.ctx, this.bannerText, this.bannerMaxLife > 0 ? this.bannerLife / this.bannerMaxLife : 0, this.bannerColor);
  }

  // Helper translations
  private getObstacleNameRu(type: ObstacleType): string {
    switch (type) {
      case 'cactus_small': return 'Маленький кактус';
      case 'cactus_double': return 'Двойной кактус';
      case 'cactus_triple': return 'Куст кактусов';
      case 'cactus_large': return 'Гигантский кактус';
      case 'rock': return 'Каменный валун';
      case 'spikes': return 'Шипастая ловушка';
      case 'barricade': return 'Заградительный барьер';
      default: return 'Препятствие';
    }
  }

  private getEnemyNameRu(type: GroundEnemyType | FlyingEnemyType): string {
    switch (type) {
      case 'pterodactyl': return 'Птеродактиль';
      case 'flying_drone': return 'Боевой дрон';
      case 'mutant_bat': return 'Мутантная летучая мышь';
      case 'robot_drone': return 'Кибер-краб';
      case 'scorpion': return 'Ядовитый скорпион';
      case 'bone_raptor': return 'Костяной раптор';
      default: return 'Враг';
    }
  }
}
