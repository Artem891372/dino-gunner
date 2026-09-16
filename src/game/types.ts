export type ThemeMode = 'light' | 'dark';

export type GameMode = 'ai' | 'manual';

export type WeaponType = 'rifle' | 'laser' | 'shotgun' | 'plasma';

export type DinoSkin = 'classic' | 'cyber' | 'military' | 'golden' | 'lava';

export interface WeaponConfig {
  id: WeaponType;
  name: string;
  nameRu: string;
  damage: number;
  fireRate: number; // in ms between shots
  bulletSpeed: number;
  bulletColor: string;
  bulletLength: number;
  spreadAngle: number;
  pellets: number;
  icon: string;
}

export interface DinoSkinConfig {
  id: DinoSkin;
  name: string;
  nameRu: string;
  bodyColor: string;
  eyeColor: string;
  bellyColor: string;
  accentColor: string;
}

export type ObstacleType = 
  | 'cactus_small'
  | 'cactus_double'
  | 'cactus_triple'
  | 'cactus_large'
  | 'rock'
  | 'spikes'
  | 'barricade'
  | 'bush'
  | 'stump'
  | 'log'
  | 'tumbleweed'
  | 'crate';

export type WeatherType = 'clear' | 'rain' | 'snow' | 'sandstorm';

export type DayPhase = 'dawn' | 'day' | 'sunset' | 'night';

export type WaveType = 'calm' | 'dense' | 'air_raid' | 'gauntlet' | 'boss';

export interface ParallaxLayerObject {
  x: number;
  width: number;
  height: number;
  variant: number;
}

export type BiomeType = 'fields' | 'forest' | 'mountains' | 'hills' | 'desert';

export interface BiomeTerrain {
  far: ParallaxLayerObject[];
  mid: ParallaxLayerObject[];
}

export interface CelestialBody {
  x: number; // normalized 0..1 (can exceed while off-screen)
  y: number; // normalized 0..1, 0.82 is the horizon
  visible: boolean;
}

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  size: number;
  alpha: number;
}

export interface Atmosphere {
  night: number; // 0..1
  sunset: number; // 0..1
  weather: WeatherType;
  weatherStrength: number; // 0..1 crossfade of the incoming weather
  previousWeather: WeatherType;
  previousStrength: number; // 0..1 crossfade of the outgoing weather
  sun: CelestialBody;
  moon: CelestialBody;
}

export type GroundEnemyType = 
  | 'robot_drone'
  | 'scorpion'
  | 'cyber_skull'
  | 'bone_raptor'
  | 'sand_spider';

export type FlyingEnemyType = 
  | 'pterodactyl'
  | 'flying_drone'
  | 'mutant_bat'
  | 'vulture';

export interface GameObject {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Obstacle extends GameObject {
  type: ObstacleType;
}

export interface WeaponPickup extends GameObject {
  weapon: WeaponType;
  bobPhase: number;
  bobOffset: number;
}

export interface Enemy extends GameObject {
  type: GroundEnemyType | FlyingEnemyType;
  isFlying: boolean;
  isBoss?: boolean;
  flyingAltitude?: 'low' | 'mid' | 'high'; // low: 20-40px above ground, mid: 50-70px, high: 80-110px
  hp: number;
  maxHp: number;
  scoreValue: number;
  animFrame: number;
  animTimer: number;
  bobOffset?: number;
  bobSpeed?: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  damage: number;
  isLaser?: boolean;
  distanceTraveled: number;
  maxDistance: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity: number;
  isPixelDebris?: boolean;
}

export interface ShellCasing {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  groundY: number;
  bounces: number;
  alpha: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  life: number;
}

export interface Cloud {
  id: number;
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
  type: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  twinkleSpeed: number;
  phase: number;
}

export interface GroundDetail {
  x: number;
  type: 'pebble' | 'grass' | 'crack';
  variant: number;
}

export interface HeroState {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  isGrounded: boolean;
  isDucking: boolean;
  isJumping: boolean;
  jumpCount: number;
  runFrame: number;
  animTimer: number;
  gunAngle: number; // in radians
  recoilOffset: number;
  lastShotTime: number;
  invulnerableTime: number; // in seconds
  isDead: boolean;
  deathAnimTimer: number;
}

export interface AISettings {
  accuracy: number; // 0.5 to 1.0 (50% to 100%)
  reactionDelayMs: number; // 0 to 200 ms
  jumpPrecision: number; // 0.7 to 1.0
  aggression: number; // shooting priority
  missChance: number; // 0.0 to 0.35 (chance of deliberate slight miss)
  panicChance: number; // 0.0 to 0.15 (chance of mistimed jump or delayed reaction)
  autoDuck: boolean;
}

export interface AITelemetry {
  status: 'SCANNING' | 'RUNNING' | 'JUMPING' | 'AIMING' | 'FIRING' | 'EVADING' | 'RELOADING';
  nearestThreatDistance: number;
  nearestThreatType: string | null;
  nearestThreatAltitude: string | null;
  aimAngleDeg: number;
  calculatedTrajectory: { x1: number; y1: number; x2: number; y2: number } | null;
  willMiss: boolean;
  reactionTimerMs: number;
  lastAction: string;
  confidenceScore: number;
}

export interface DeathInfo {
  killerName: string;
  killerType: 'obstacle' | 'ground_enemy' | 'flying_enemy' | 'unknown';
  score: number;
  kills: number;
  distance: number;
  accuracy: number;
  shotsFired: number;
  shotsHit: number;
  maxCombo: number;
}
