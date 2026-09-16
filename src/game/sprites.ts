// Pixel Art Sprites & Canvas Renderer for Google Dino Gunner

import {
  ThemeMode,
  Obstacle,
  Enemy,
  WeaponPickup,
  Bullet,
  Particle,
  ShellCasing,
  FloatingText,
  Cloud,
  Star,
  GroundDetail,
  HeroState,
  DinoSkin,
  WeaponType,
  AITelemetry,
  Atmosphere,
  ParallaxLayerObject,
  WeatherParticle,
  WeatherType
} from './types';

// Palette Definitions
export const PALETTES = {
  light: {
    bg: '#f7f7f7',
    horizon: '#535353',
    dinoBody: '#535353',
    dinoEye: '#ffffff',
    dinoPupil: '#535353',
    gunBody: '#333333',
    gunBarrel: '#1a1a1a',
    cactus: '#535353',
    obstacleAlt: '#444444',
    enemyGround: '#d32f2f',
    enemyAir: '#7b1fa2',
    cloud: '#dcdcdc',
    sunMoon: '#e0e0e0',
    star: '#ffffff',
    groundDust: '#b0b0b0',
    laserSight: 'rgba(239, 68, 68, 0.4)',
    textPrimary: '#535353',
    textSecondary: '#888888',
    gridLine: 'rgba(0,0,0,0.03)'
  },
  dark: {
    bg: '#141419',
    horizon: '#acacac',
    dinoBody: '#e0e0e0',
    dinoEye: '#141419',
    dinoPupil: '#00f0ff',
    gunBody: '#00f0ff',
    gunBarrel: '#ffffff',
    cactus: '#acacac',
    obstacleAlt: '#909090',
    enemyGround: '#ff0055',
    enemyAir: '#bf5af2',
    cloud: '#2a2a35',
    sunMoon: '#f5f5f5',
    star: '#ffffff',
    groundDust: '#555566',
    laserSight: 'rgba(0, 240, 255, 0.6)',
    textPrimary: '#f0f0f0',
    textSecondary: '#8888aa',
    gridLine: 'rgba(255,255,255,0.03)'
  }
};

export const SKINS_DATA: Record<DinoSkin, { name: string; body: string; belly: string; accent: string; eye: string }> = {
  classic: { name: 'Классик', body: '#535353', belly: '#737373', accent: '#333333', eye: '#ffffff' },
  cyber: { name: 'Киберпанк', body: '#00f0ff', belly: '#0088cc', accent: '#ff007f', eye: '#ffff00' },
  military: { name: 'Коммандо', body: '#4d6b38', belly: '#6c8b54', accent: '#2d3b20', eye: '#ff3333' },
  golden: { name: 'Золотой Мех', body: '#e5a93c', belly: '#fcd34d', accent: '#92400e', eye: '#00f0ff' },
  lava: { name: 'Лава Раптор', body: '#dc2626', belly: '#f97316', accent: '#7f1d1d', eye: '#ffffff' },
};

// Helper to draw a pixel rectangle
function drawPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// ----------------------------------------------------
// DINO HERO DRAWING (Chrome Dino with Gun)
// ----------------------------------------------------
export function drawDinoHero(
  ctx: CanvasRenderingContext2D,
  hero: HeroState,
  _groundY: number,
  theme: ThemeMode,
  skin: DinoSkin,
  weapon: WeaponType
) {
  ctx.save();

  // If invulnerable, blink at 12Hz
  if (hero.invulnerableTime > 0) {
    const isVisible = Math.floor(hero.invulnerableTime * 14) % 2 === 0;
    if (!isVisible) {
      ctx.restore();
      return;
    }
  }

  // Handle Death Falling/Shatter
  if (hero.isDead) {
    drawDeadDino(ctx, hero, theme, skin);
    ctx.restore();
    return;
  }

  const s = SKINS_DATA[skin];
  const bodyColor = theme === 'dark' && skin === 'classic' ? '#e0e0e0' : s.body;
  const bellyColor = theme === 'dark' && skin === 'classic' ? '#a0a0a0' : s.belly;
  const eyeColor = s.eye;
  const pupilColor = theme === 'dark' ? '#000000' : '#222222';

  const x = Math.round(hero.x);
  const y = Math.round(hero.y);

  // Render Dino Sprite
  if (hero.isDucking) {
    // Ducking / Crawling Dino Frame
    drawDuckingDino(ctx, x, y, bodyColor, bellyColor, eyeColor, pupilColor);
  } else if (!hero.isGrounded) {
    // Jumping Dino Frame
    drawJumpingDino(ctx, x, y, bodyColor, bellyColor, eyeColor, pupilColor);
  } else {
    // Running Dino with alternating legs
    const legFrame = hero.runFrame % 2;
    drawRunningDino(ctx, x, y, bodyColor, bellyColor, eyeColor, pupilColor, legFrame);
  }

  // Draw Gun in Dino's Hand / Mount
  // Gun origin point
  let gunOriginX = x + 30;
  let gunOriginY = y + (hero.isDucking ? 18 : 20);

  // Gun recoil kickback
  const recoilX = -Math.cos(hero.gunAngle) * hero.recoilOffset;
  const recoilY = -Math.sin(hero.gunAngle) * hero.recoilOffset;

  drawGun(ctx, gunOriginX + recoilX, gunOriginY + recoilY, hero.gunAngle, weapon, theme, hero.recoilOffset > 2);

  ctx.restore();
}

function drawRunningDino(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bodyColor: string,
  bellyColor: string,
  eyeColor: string,
  pupilColor: string,
  legFrame: number
) {
  // Dino dimensions ~ 44 wide x 47 high
  // Head & Snout
  drawPixelRect(ctx, x + 22, y + 0, 20, 16, bodyColor);
  drawPixelRect(ctx, x + 38, y + 4, 6, 8, bodyColor); // snout tip
  drawPixelRect(ctx, x + 24, y + 16, 12, 4, bodyColor); // lower jaw

  // Eye
  drawPixelRect(ctx, x + 26, y + 3, 4, 4, eyeColor);
  drawPixelRect(ctx, x + 28, y + 4, 2, 2, pupilColor);

  // Neck
  drawPixelRect(ctx, x + 18, y + 12, 10, 10, bodyColor);

  // Body & Torso
  drawPixelRect(ctx, x + 10, y + 20, 22, 18, bodyColor);
  drawPixelRect(ctx, x + 14, y + 22, 14, 12, bellyColor); // belly highlight

  // Tail
  drawPixelRect(ctx, x + 2, y + 18, 10, 6, bodyColor);
  drawPixelRect(ctx, x + 0, y + 14, 6, 6, bodyColor);
  drawPixelRect(ctx, x + 0, y + 10, 3, 4, bodyColor);

  // Tiny Dino Arms (holding gun stance)
  drawPixelRect(ctx, x + 28, y + 22, 6, 4, bodyColor);
  drawPixelRect(ctx, x + 32, y + 24, 4, 3, bodyColor);

  // Legs Animation
  if (legFrame === 0) {
    // Left leg down, Right leg raised
    drawPixelRect(ctx, x + 12, y + 38, 4, 9, bodyColor);
    drawPixelRect(ctx, x + 12, y + 45, 7, 2, bodyColor); // foot forward

    drawPixelRect(ctx, x + 22, y + 38, 4, 5, bodyColor);
    drawPixelRect(ctx, x + 26, y + 41, 5, 2, bodyColor); // foot raised back
  } else {
    // Left leg raised, Right leg down
    drawPixelRect(ctx, x + 12, y + 38, 4, 5, bodyColor);
    drawPixelRect(ctx, x + 8, y + 41, 5, 2, bodyColor); // foot raised

    drawPixelRect(ctx, x + 22, y + 38, 4, 9, bodyColor);
    drawPixelRect(ctx, x + 22, y + 45, 7, 2, bodyColor); // foot down
  }
}

function drawJumpingDino(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bodyColor: string,
  bellyColor: string,
  eyeColor: string,
  pupilColor: string
) {
  // Head & Snout
  drawPixelRect(ctx, x + 22, y + 0, 20, 16, bodyColor);
  drawPixelRect(ctx, x + 38, y + 4, 6, 8, bodyColor);
  drawPixelRect(ctx, x + 24, y + 16, 12, 4, bodyColor);

  // Eye
  drawPixelRect(ctx, x + 26, y + 3, 4, 4, eyeColor);
  drawPixelRect(ctx, x + 28, y + 4, 2, 2, pupilColor);

  // Neck & Body
  drawPixelRect(ctx, x + 18, y + 12, 10, 10, bodyColor);
  drawPixelRect(ctx, x + 10, y + 20, 22, 18, bodyColor);
  drawPixelRect(ctx, x + 14, y + 22, 14, 12, bellyColor);

  // Tail
  drawPixelRect(ctx, x + 2, y + 18, 10, 6, bodyColor);
  drawPixelRect(ctx, x + 0, y + 14, 6, 6, bodyColor);

  // Arms
  drawPixelRect(ctx, x + 28, y + 22, 6, 4, bodyColor);

  // Tucked Legs (Jumping)
  drawPixelRect(ctx, x + 12, y + 38, 5, 6, bodyColor);
  drawPixelRect(ctx, x + 14, y + 42, 6, 3, bodyColor);

  drawPixelRect(ctx, x + 22, y + 38, 5, 6, bodyColor);
  drawPixelRect(ctx, x + 25, y + 42, 6, 3, bodyColor);
}

function drawDuckingDino(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bodyColor: string,
  bellyColor: string,
  eyeColor: string,
  pupilColor: string
) {
  // Low profile Dino
  // Body stretched horizontal
  drawPixelRect(ctx, x + 4, y + 10, 32, 16, bodyColor);
  drawPixelRect(ctx, x + 10, y + 12, 20, 10, bellyColor);

  // Head forward and low
  drawPixelRect(ctx, x + 32, y + 8, 20, 14, bodyColor);
  drawPixelRect(ctx, x + 48, y + 12, 6, 6, bodyColor);

  // Eye
  drawPixelRect(ctx, x + 38, y + 10, 4, 4, eyeColor);
  drawPixelRect(ctx, x + 40, y + 11, 2, 2, pupilColor);

  // Tail low
  drawPixelRect(ctx, x + 0, y + 12, 6, 5, bodyColor);

  // Legs crawling
  drawPixelRect(ctx, x + 8, y + 26, 8, 4, bodyColor);
  drawPixelRect(ctx, x + 24, y + 26, 8, 4, bodyColor);
}

function drawDeadDino(
  ctx: CanvasRenderingContext2D,
  hero: HeroState,
  theme: ThemeMode,
  skin: DinoSkin
) {
  const x = Math.round(hero.x);
  const y = Math.round(hero.y);
  const s = SKINS_DATA[skin];
  const color = theme === 'dark' && skin === 'classic' ? '#ff4444' : s.body;

  // X Eye (KO)
  drawRunningDino(ctx, x, y, color, '#444444', '#ffffff', '#ff0000', 0);

  // Draw X on Eye
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 26, y + 3);
  ctx.lineTo(x + 30, y + 7);
  ctx.moveTo(x + 30, y + 3);
  ctx.lineTo(x + 26, y + 7);
  ctx.stroke();

  // Floating skull or KO text
  ctx.font = '10px "Press Start 2P"';
  ctx.fillStyle = '#ff3333';
  ctx.fillText('X_X', x + 15, y - 10);
}

// ----------------------------------------------------
// GUN DRAWING (Rotatable with Muzzle Flash)
// ----------------------------------------------------
function drawGun(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  angleRad: number,
  weapon: WeaponType,
  theme: ThemeMode,
  isFiring: boolean
) {
  ctx.save();
  ctx.translate(originX, originY);
  ctx.rotate(angleRad);

  const isDark = theme === 'dark';

  if (weapon === 'laser' || weapon === 'plasma') {
    // Futuristic Laser Rifle
    const bodyColor = isDark ? '#00f0ff' : '#0077aa';
    const accentColor = isDark ? '#ff007f' : '#333333';
    const barrelColor = isDark ? '#ffffff' : '#111111';

    drawPixelRect(ctx, -4, -3, 10, 6, bodyColor);
    drawPixelRect(ctx, 6, -2, 14, 4, barrelColor);
    drawPixelRect(ctx, 2, -5, 6, 2, accentColor); // scope
    drawPixelRect(ctx, -2, 3, 4, 5, '#222222'); // grip

    // Glowing energy cell
    drawPixelRect(ctx, 8, -1, 4, 2, isDark ? '#00ffff' : '#00ddff');
  } else if (weapon === 'shotgun') {
    // Heavy Shotgun
    const woodColor = '#8b4513';
    const steelColor = isDark ? '#cccccc' : '#222222';

    drawPixelRect(ctx, -6, -2, 8, 5, woodColor); // stock
    drawPixelRect(ctx, 2, -3, 8, 6, steelColor); // chamber
    drawPixelRect(ctx, 10, -3, 12, 5, steelColor); // double barrel
    drawPixelRect(ctx, 4, 3, 4, 5, '#111111'); // grip
  } else {
    // Assault Rifle / Commando Gun
    const steelColor = isDark ? '#dddddd' : '#222222';
    const magColor = isDark ? '#888888' : '#444444';

    drawPixelRect(ctx, -4, -2, 8, 5, steelColor); // receiver
    drawPixelRect(ctx, 4, -2, 14, 3, steelColor); // long barrel
    drawPixelRect(ctx, 18, -3, 2, 5, '#ff4444'); // muzzle tip
    drawPixelRect(ctx, 2, 3, 4, 6, magColor); // curved magazine
    drawPixelRect(ctx, -2, 3, 3, 4, '#111111'); // handle
    drawPixelRect(ctx, 4, -5, 6, 2, '#666666'); // sight
  }

  // Muzzle Flash Effect
  if (isFiring) {
    const flashColors = ['#ffff00', '#ff9900', '#ff3300', '#ffffff'];
    const rndColor = flashColors[Math.floor(Math.random() * flashColors.length)];
    ctx.fillStyle = rndColor;

    // Starburst muzzle flash
    ctx.beginPath();
    ctx.arc(22, -0.5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Spikes
    drawPixelRect(ctx, 26, -2, 4, 3, '#ffffaa');
    drawPixelRect(ctx, 20, -6, 3, 4, '#ffaa00');
    drawPixelRect(ctx, 20, 2, 3, 4, '#ffaa00');
  }

  ctx.restore();
}

// ----------------------------------------------------
// OBSTACLE DRAWING
// ----------------------------------------------------
export function drawObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, theme: ThemeMode) {
  const p = PALETTES[theme];
  const x = Math.round(obs.x);
  const y = Math.round(obs.y);
  const w = obs.width;
  const h = obs.height;
  const color = p.cactus;

  switch (obs.type) {
    case 'cactus_small':
      drawSingleCactus(ctx, x, y, color, false);
      break;
    case 'cactus_double':
      drawSingleCactus(ctx, x, y, color, false);
      drawSingleCactus(ctx, x + 16, y, color, false);
      break;
    case 'cactus_triple':
      drawSingleCactus(ctx, x, y, color, false);
      drawSingleCactus(ctx, x + 14, y + 4, color, false);
      drawSingleCactus(ctx, x + 28, y, color, false);
      break;
    case 'cactus_large':
      drawSingleCactus(ctx, x, y, color, true);
      break;
    case 'rock':
      drawRockObstacle(ctx, x, y, w, h, p.obstacleAlt);
      break;
    case 'spikes':
      drawSpikesObstacle(ctx, x, y, w, h, theme);
      break;
    case 'barricade':
      drawBarricadeObstacle(ctx, x, y, w, h, theme);
      break;
    default:
      drawSingleCactus(ctx, x, y, color, false);
      break;
  }
}

function drawSingleCactus(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, isLarge: boolean) {
  const stemW = isLarge ? 8 : 6;
  const h = isLarge ? 48 : 34;

  // Main Trunk
  drawPixelRect(ctx, x + (isLarge ? 10 : 8), y, stemW, h, color);

  // Left Arm
  drawPixelRect(ctx, x, y + (isLarge ? 16 : 10), isLarge ? 10 : 8, 4, color);
  drawPixelRect(ctx, x, y + (isLarge ? 8 : 6), 4, isLarge ? 10 : 8, color);

  // Right Arm
  const rightX = x + (isLarge ? 18 : 14);
  drawPixelRect(ctx, rightX, y + (isLarge ? 22 : 14), isLarge ? 10 : 8, 4, color);
  drawPixelRect(ctx, rightX + (isLarge ? 6 : 4), y + (isLarge ? 14 : 10), 4, isLarge ? 10 : 8, color);

  // Base
  drawPixelRect(ctx, x + 4, y + h - 2, isLarge ? 20 : 16, 2, color);
}

function drawRockObstacle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  drawPixelRect(ctx, x + 4, y + 4, w - 8, h - 4, color);
  drawPixelRect(ctx, x + 8, y, w - 16, 4, color);
  drawPixelRect(ctx, x, y + 8, 4, h - 8, color);
  drawPixelRect(ctx, x + w - 4, y + 8, 4, h - 8, color);

  // Cracks
  drawPixelRect(ctx, x + 8, y + 8, 3, 6, '#111111');
  drawPixelRect(ctx, x + 10, y + 14, 4, 3, '#111111');
}

function drawSpikesObstacle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: ThemeMode) {
  const spikeCount = Math.floor(w / 8);
  const color = theme === 'dark' ? '#ff3366' : '#cc2222';

  for (let i = 0; i < spikeCount; i++) {
    const sx = x + i * 8;
    drawPixelRect(ctx, sx + 2, y + 12, 4, h - 12, color);
    drawPixelRect(ctx, sx + 3, y + 6, 2, 6, color);
    drawPixelRect(ctx, sx + 3, y + 2, 2, 4, '#ffffff'); // sharp tip
  }
}

function drawBarricadeObstacle(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: ThemeMode) {
  const baseColor = theme === 'dark' ? '#ffcc00' : '#e6a100';
  const stripeColor = '#222222';

  drawPixelRect(ctx, x, y + 4, w, h - 4, baseColor);
  drawPixelRect(ctx, x + 4, y + 8, 6, h - 10, stripeColor);
  drawPixelRect(ctx, x + 14, y + 8, 6, h - 10, stripeColor);
  drawPixelRect(ctx, x + 24, y + 8, 6, h - 10, stripeColor);

  // Legs
  drawPixelRect(ctx, x + 2, y + h - 6, 4, 6, '#444444');
  drawPixelRect(ctx, x + w - 6, y + h - 6, 4, 6, '#444444');
}

// ----------------------------------------------------
// ENEMY DRAWING (Ground and Flying Enemies)
// ----------------------------------------------------
export function drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, theme: ThemeMode) {
  const x = Math.round(enemy.x);
  const y = Math.round(enemy.y + (enemy.bobOffset || 0));
  const w = enemy.width;

  if (enemy.isBoss) {
    // Pulsing menace aura behind the boss
    ctx.save();
    ctx.globalAlpha = 0.22 + 0.12 * Math.sin(performance.now() * 0.008);
    drawPixelRect(ctx, x - 6, y - 8, w + 12, enemy.height + 12, theme === 'dark' ? '#ff0055' : '#ff3300');
    ctx.restore();

    // Upscaled sprite + BOSS tag
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.4, 1.4);
    drawGroundEnemy(ctx, enemy, 0, 0, theme);
    ctx.restore();

    ctx.save();
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 6;
    ctx.fillText('BOSS', x + w / 2, y - 8);
    ctx.restore();
  } else if (enemy.isFlying) {
    drawFlyingEnemy(ctx, enemy, x, y, theme);
  } else {
    drawGroundEnemy(ctx, enemy, x, y, theme);
  }

  // Draw Health Bar if damaged and has > 1 hp
  if (enemy.maxHp > 1) {
    const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
    const barW = w;
    const barH = 3;
    const barY = y - 6;

    drawPixelRect(ctx, x, barY, barW, barH, '#222222');
    drawPixelRect(ctx, x, barY, barW * hpPct, barH, hpPct > 0.5 ? '#00ff66' : '#ff3333');
  }
}

// Flying Enemies (e.g. Classic Google Dino Pterodactyl with animated flapping wings)
function drawFlyingEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, x: number, y: number, theme: ThemeMode) {
  const wingFrame = enemy.animFrame % 2; // 0 = wing up, 1 = wing down

  if (enemy.type === 'pterodactyl') {
    const bodyColor = theme === 'dark' ? '#bf5af2' : '#6b21a8';
    const beakColor = theme === 'dark' ? '#ffcc00' : '#d97706';
    const eyeColor = '#ffffff';

    // Pterodactyl body dimensions ~ 36x28
    // Body & Head
    drawPixelRect(ctx, x + 10, y + 8, 16, 8, bodyColor);
    drawPixelRect(ctx, x + 22, y + 4, 8, 8, bodyColor); // head

    // Sharp Beak
    drawPixelRect(ctx, x + 30, y + 8, 8, 3, beakColor);

    // Eye
    drawPixelRect(ctx, x + 24, y + 5, 2, 2, eyeColor);
    drawPixelRect(ctx, x + 25, y + 5, 1, 1, '#ff0000'); // glowing red pupil

    // Tail
    drawPixelRect(ctx, x + 4, y + 10, 6, 3, bodyColor);
    drawPixelRect(ctx, x + 0, y + 11, 4, 2, bodyColor);

    // Wings Animation
    if (wingFrame === 0) {
      // Wings UP
      drawPixelRect(ctx, x + 12, y - 6, 6, 14, bodyColor);
      drawPixelRect(ctx, x + 10, y - 10, 4, 8, bodyColor);
      drawPixelRect(ctx, x + 8, y - 14, 4, 6, bodyColor);
    } else {
      // Wings DOWN
      drawPixelRect(ctx, x + 12, y + 14, 6, 12, bodyColor);
      drawPixelRect(ctx, x + 10, y + 20, 4, 8, bodyColor);
      drawPixelRect(ctx, x + 8, y + 24, 4, 6, bodyColor);
    }

    // Little claws
    drawPixelRect(ctx, x + 14, y + 16, 2, 4, beakColor);
    drawPixelRect(ctx, x + 18, y + 16, 2, 4, beakColor);
  } else if (enemy.type === 'flying_drone') {
    // Cyber Flying Drone
    const metalColor = theme === 'dark' ? '#00f0ff' : '#0284c7';
    const eyeGlow = '#ff0055';

    // Drone chassis
    drawPixelRect(ctx, x + 6, y + 8, 20, 10, metalColor);
    drawPixelRect(ctx, x + 12, y + 10, 8, 6, eyeGlow); // big red sensor eye

    // Rotors
    const rotorOffset = wingFrame === 0 ? 0 : 2;
    drawPixelRect(ctx, x + 2 + rotorOffset, y + 2, 12, 2, '#ffffff');
    drawPixelRect(ctx, x + 18 - rotorOffset, y + 2, 12, 2, '#ffffff');

    // Thruster exhaust particles
    drawPixelRect(ctx, x + 14, y + 19, 4, 3, '#ffaa00');
  } else {
    // Mutant Bat
    const batColor = theme === 'dark' ? '#ff0055' : '#881337';
    drawPixelRect(ctx, x + 10, y + 8, 12, 10, batColor);
    drawPixelRect(ctx, x + 12, y + 10, 2, 2, '#ffff00'); // eyes
    drawPixelRect(ctx, x + 18, y + 10, 2, 2, '#ffff00');

    if (wingFrame === 0) {
      drawPixelRect(ctx, x + 0, y + 0, 10, 8, batColor);
      drawPixelRect(ctx, x + 22, y + 0, 10, 8, batColor);
    } else {
      drawPixelRect(ctx, x + 0, y + 12, 10, 8, batColor);
      drawPixelRect(ctx, x + 22, y + 12, 10, 8, batColor);
    }
  }
}

// Ground Enemies (Robots, Scorpions, Bone Raptors)
function drawGroundEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, x: number, y: number, theme: ThemeMode) {
  const legFrame = enemy.animFrame % 2;

  if (enemy.type === 'robot_drone') {
    // Cyber Crab Robot
    const metalColor = theme === 'dark' ? '#ff3366' : '#dc2626';
    const eyeColor = '#00ffff';

    // Body
    drawPixelRect(ctx, x + 6, y + 4, 20, 14, metalColor);
    drawPixelRect(ctx, x + 10, y + 8, 12, 4, '#111111');
    drawPixelRect(ctx, x + 12, y + 9, 8, 2, eyeColor); // scanning visor

    // Top Antenna
    drawPixelRect(ctx, x + 14, y + 0, 2, 4, metalColor);
    drawPixelRect(ctx, x + 13, y - 2, 4, 2, '#ff0000');

    // Legs
    if (legFrame === 0) {
      drawPixelRect(ctx, x + 2, y + 18, 4, 8, '#333333');
      drawPixelRect(ctx, x + 12, y + 18, 4, 6, '#333333');
      drawPixelRect(ctx, x + 24, y + 18, 4, 8, '#333333');
    } else {
      drawPixelRect(ctx, x + 4, y + 18, 4, 6, '#333333');
      drawPixelRect(ctx, x + 14, y + 18, 4, 8, '#333333');
      drawPixelRect(ctx, x + 22, y + 18, 4, 6, '#333333');
    }
  } else if (enemy.type === 'scorpion') {
    // Desert Scorpion
    const color = theme === 'dark' ? '#fb923c' : '#c2410c';

    // Body
    drawPixelRect(ctx, x + 8, y + 12, 16, 8, color);

    // Claws
    drawPixelRect(ctx, x + 24, y + 8, 6, 4, color);
    drawPixelRect(ctx, x + 28, y + 6, 3, 3, '#111111');

    // Tail curved up
    drawPixelRect(ctx, x + 2, y + 8, 6, 6, color);
    drawPixelRect(ctx, x + 0, y + 2, 4, 6, color);
    drawPixelRect(ctx, x + 4, y + 0, 6, 4, '#ff0000'); // stinger tip

    // Tiny legs
    drawPixelRect(ctx, x + 8, y + 20, 3, 4, color);
    drawPixelRect(ctx, x + 14, y + 20, 3, 4, color);
    drawPixelRect(ctx, x + 20, y + 20, 3, 4, color);
  } else {
    // Bone Raptor / Cyber Skull
    const boneColor = theme === 'dark' ? '#fcd34d' : '#b45309';

    drawPixelRect(ctx, x + 8, y + 4, 18, 14, boneColor);
    // Glowing eye
    drawPixelRect(ctx, x + 16, y + 8, 4, 4, '#ff0000');
    // Jaw & sharp teeth
    drawPixelRect(ctx, x + 14, y + 16, 12, 4, boneColor);
    drawPixelRect(ctx, x + 16, y + 15, 2, 2, '#ffffff');
    drawPixelRect(ctx, x + 20, y + 15, 2, 2, '#ffffff');
    drawPixelRect(ctx, x + 24, y + 15, 2, 2, '#ffffff');

    // Legs
    drawPixelRect(ctx, x + 10, y + 18, 4, 8, boneColor);
    drawPixelRect(ctx, x + 18, y + 18, 4, 8, boneColor);
  }
}

// ----------------------------------------------------
// WEAPON PICKUPS (Floating Crates with Guns)
// ----------------------------------------------------
const PICKUP_STYLES: Record<WeaponType, { frame: string; glow: string; gun: string; accent: string }> = {
  rifle: { frame: '#8a6d3b', glow: 'rgba(255,170,0,0.35)', gun: '#222222', accent: '#ffaa00' },
  laser: { frame: '#0e7490', glow: 'rgba(0,240,255,0.35)', gun: '#0369a1', accent: '#00f0ff' },
  shotgun: { frame: '#7c2d12', glow: 'rgba(255,51,0,0.35)', gun: '#333333', accent: '#ff3300' },
  plasma: { frame: '#6d28d9', glow: 'rgba(191,90,242,0.4)', gun: '#7e22ce', accent: '#bf5af2' }
};

export function drawWeaponPickups(ctx: CanvasRenderingContext2D, pickups: WeaponPickup[], theme: ThemeMode) {
  pickups.forEach(pu => drawWeaponPickup(ctx, pu, theme));
}

function drawWeaponPickup(ctx: CanvasRenderingContext2D, pu: WeaponPickup, theme: ThemeMode) {
  const style = PICKUP_STYLES[pu.weapon];
  const x = Math.round(pu.x);
  const y = Math.round(pu.y + pu.bobOffset);
  const w = pu.width;
  const h = pu.height;

  // Pulsing glow aura
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() * 0.006 + pu.bobPhase);
  ctx.save();
  ctx.globalAlpha = 0.2 + pulse * 0.35;
  drawPixelRect(ctx, x - 3, y - 3, w + 6, h + 6, style.glow);
  ctx.restore();

  // Crate body & frame
  const bodyColor = theme === 'dark' ? '#1c1c24' : '#f3f0e8';
  drawPixelRect(ctx, x, y, w, h, bodyColor);
  drawPixelRect(ctx, x, y, w, 2, style.frame);
  drawPixelRect(ctx, x, y + h - 2, w, 2, style.frame);
  drawPixelRect(ctx, x, y, 2, h, style.frame);
  drawPixelRect(ctx, x + w - 2, y, 2, h, style.frame);

  // Corner rivets
  drawPixelRect(ctx, x + 2, y + 2, 2, 2, style.accent);
  drawPixelRect(ctx, x + w - 4, y + 2, 2, 2, style.accent);
  drawPixelRect(ctx, x + 2, y + h - 4, 2, 2, style.accent);
  drawPixelRect(ctx, x + w - 4, y + h - 4, 2, 2, style.accent);

  // Mini gun icon (varies per weapon)
  const gx = x + 5;
  const gy = y + h / 2;

  if (pu.weapon === 'shotgun') {
    drawPixelRect(ctx, gx + 2, gy - 4, 12, 3, style.gun);
    drawPixelRect(ctx, gx + 2, gy, 12, 3, style.gun);
    drawPixelRect(ctx, gx, gy - 2, 3, 7, '#8b4513');
    drawPixelRect(ctx, gx + 13, gy - 4, 2, 7, style.accent);
  } else if (pu.weapon === 'laser' || pu.weapon === 'plasma') {
    drawPixelRect(ctx, gx, gy - 3, 10, 6, style.gun);
    drawPixelRect(ctx, gx + 10, gy - 2, 7, 4, style.accent);
    drawPixelRect(ctx, gx + 2, gy - 6, 5, 3, style.frame);
    drawPixelRect(ctx, gx + 11, gy - 1, 4, 2, '#ffffff');
  } else {
    drawPixelRect(ctx, gx, gy - 2, 8, 4, style.gun);
    drawPixelRect(ctx, gx + 8, gy - 2, 10, 3, style.gun);
    drawPixelRect(ctx, gx + 16, gy - 3, 2, 5, style.accent);
    drawPixelRect(ctx, gx + 1, gy + 2, 4, 4, style.gun);
  }

  // "!" hint above the crate
  ctx.save();
  ctx.globalAlpha = 0.6 + pulse * 0.4;
  ctx.font = '8px "Press Start 2P"';
  ctx.fillStyle = style.accent;
  ctx.fillText('▼', x + w / 2 - 4, y - 4);
  ctx.restore();
}

// ----------------------------------------------------
// BULLETS DRAWING
// ----------------------------------------------------
export function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet, theme: ThemeMode) {
  ctx.save();
  ctx.translate(bullet.x, bullet.y);
  const angle = Math.atan2(bullet.vy, bullet.vx);
  ctx.rotate(angle);

  if (bullet.isLaser) {
    // Neon Laser Bolt
    const glowColor = theme === 'dark' ? 'rgba(0, 240, 255, 0.5)' : 'rgba(0, 150, 255, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowColor = glowColor;

    drawPixelRect(ctx, -bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height, bullet.color);
    drawPixelRect(ctx, -bullet.width / 2 + 2, -bullet.height / 2 + 1, bullet.width - 4, bullet.height - 2, '#ffffff');
  } else {
    // Standard Bullet / Tracer
    drawPixelRect(ctx, -bullet.width / 2, -bullet.height / 2, bullet.width, bullet.height, bullet.color);
    // Yellow head
    drawPixelRect(ctx, bullet.width / 2 - 2, -bullet.height / 2, 2, bullet.height, '#ffff00');
  }

  ctx.restore();
}

// ----------------------------------------------------
// PARTICLES & SHELL CASINGS
// ----------------------------------------------------
export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(p.size), Math.round(p.size));
    ctx.restore();
  });
}

export function drawShellCasings(ctx: CanvasRenderingContext2D, shells: ShellCasing[]) {
  shells.forEach(s => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha));
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);
    // Brass casing ~ 4x2 pixels
    drawPixelRect(ctx, -2, -1, 4, 2, '#eab308');
    drawPixelRect(ctx, 1, -1, 1, 2, '#a16207');
    ctx.restore();
  });
}

// ----------------------------------------------------
// FLOATING TEXT (+100, HEADSHOT, etc.)
// ----------------------------------------------------
export function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  texts.forEach(ft => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
    ctx.font = '10px "Press Start 2P"';
    ctx.fillStyle = ft.color;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
    ctx.restore();
  });
}

// ----------------------------------------------------
// COMBO STREAK COUNTER (Screen-space overlay)
// ----------------------------------------------------
export function drawComboCounter(ctx: CanvasRenderingContext2D, combo: number, timerRatio: number) {
  const multiplier = Math.min(8, combo);
  if (multiplier < 2) return;

  const tier =
    multiplier >= 8
      ? { main: '#ff0055', glow: 'rgba(255,0,85,0.6)' }
      : multiplier >= 5
      ? { main: '#ff8800', glow: 'rgba(255,136,0,0.55)' }
      : { main: '#ffcc00', glow: 'rgba(255,204,0,0.5)' };

  const x = ctx.canvas.width - 24;
  const y = 96;
  const pulse = 1 + Math.sin(performance.now() * 0.02) * 0.07;
  const fontSize = Math.min(26, 12 + multiplier * 1.7) * pulse;

  ctx.save();
  ctx.textAlign = 'right';
  ctx.shadowColor = tier.glow;
  ctx.shadowBlur = 14;

  ctx.font = `${Math.round(fontSize)}px "Press Start 2P"`;
  ctx.fillStyle = tier.main;
  ctx.fillText(`x${multiplier}`, x, y);

  ctx.font = '9px "Press Start 2P"';
  ctx.fillText('COMBO', x, y + 16);

  // Combo window timer bar
  ctx.shadowBlur = 0;
  const barW = 68;
  drawPixelRect(ctx, x - barW, y + 24, barW, 4, 'rgba(0,0,0,0.35)');
  drawPixelRect(ctx, x - barW, y + 24, barW * Math.max(0, Math.min(1, timerRatio)), 4, tier.main);

  ctx.restore();
}

// ----------------------------------------------------
// SCENERY (Clouds, Stars, Sun/Moon, Ground Horizon)
// ----------------------------------------------------
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  theme: ThemeMode,
  clouds: Cloud[],
  stars: Star[],
  atmosphere?: Atmosphere
) {
  const p = PALETTES[theme];

  // Background clear
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, width, height);

  // Stars: appear at night in light theme, always in dark theme
  const starVisibility = atmosphere ? Math.max(atmosphere.night, theme === 'dark' ? 1 : 0) : theme === 'dark' ? 1 : 0;
  if (starVisibility > 0.02) {
    stars.forEach(st => {
      const alpha = (0.4 + 0.6 * Math.sin(st.phase)) * starVisibility;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
      ctx.fillRect(Math.round(st.x), Math.round(st.y), st.size, st.size);
    });
  }

  // Sun or Moon (crossfades through the day/night cycle)
  drawCelestialBody(ctx, width, atmosphere);

  // Clouds
  clouds.forEach(cl => {
    drawCloud(ctx, cl.x, cl.y, cl.width, cl.height, p.cloud);
  });
}

function drawCelestialBody(ctx: CanvasRenderingContext2D, width: number, atmosphere?: Atmosphere) {
  const cx = width - 100;
  const cy = 45;
  const r = 16;

  const night = atmosphere ? atmosphere.night : 0;
  const sunAlpha = 1 - night;
  const moonAlpha = night;

  if (sunAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = sunAlpha;
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Subtle sun rays
    drawPixelRect(ctx, cx - 2, cy - 22, 4, 4, '#fef08a');
    drawPixelRect(ctx, cx - 2, cy + 18, 4, 4, '#fef08a');
    drawPixelRect(ctx, cx - 22, cy - 2, 4, 4, '#fef08a');
    drawPixelRect(ctx, cx + 18, cy - 2, 4, 4, '#fef08a');
    ctx.restore();
  }

  if (moonAlpha > 0.02) {
    ctx.save();
    ctx.globalAlpha = moonAlpha;
    ctx.fillStyle = '#f3f4f6';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    drawPixelRect(ctx, cx - 6, cy - 6, 5, 5, '#cbd5e1');
    drawPixelRect(ctx, cx + 2, cy + 2, 4, 4, '#cbd5e1');
    drawPixelRect(ctx, cx - 3, cy + 5, 3, 3, '#cbd5e1');
    ctx.restore();
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, _h: number, color: string) {
  const rx = Math.round(x);
  const ry = Math.round(y);

  // 8-bit stepped pixel cloud
  drawPixelRect(ctx, rx + 8, ry + 0, w - 16, 6, color);
  drawPixelRect(ctx, rx + 4, ry + 6, w - 8, 8, color);
  drawPixelRect(ctx, rx + 0, ry + 12, w, 6, color);
}

export function drawGround(
  ctx: CanvasRenderingContext2D,
  width: number,
  groundY: number,
  theme: ThemeMode,
  details: GroundDetail[]
) {
  const p = PALETTES[theme];

  // Ground baseline
  ctx.strokeStyle = p.horizon;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();

  // Ground details (pebbles, grass tufts, cracks)
  details.forEach(d => {
    const x = Math.round(d.x);
    if (d.type === 'pebble') {
      drawPixelRect(ctx, x, groundY + 4, 3, 2, p.groundDust);
      if (d.variant > 0) {
        drawPixelRect(ctx, x + 4, groundY + 6, 2, 2, p.groundDust);
      }
    } else if (d.type === 'grass') {
      drawPixelRect(ctx, x, groundY - 4, 2, 4, p.horizon);
      drawPixelRect(ctx, x + 3, groundY - 6, 2, 6, p.horizon);
      drawPixelRect(ctx, x + 6, groundY - 3, 2, 3, p.horizon);
    } else {
      drawPixelRect(ctx, x, groundY + 2, 6, 2, p.groundDust);
      drawPixelRect(ctx, x + 6, groundY + 4, 4, 2, p.groundDust);
    }
  });
}

// ----------------------------------------------------
// PARALLAX LAYERS, ATMOSPHERE, WEATHER, BANNER
// ----------------------------------------------------
export function drawParallax(
  ctx: CanvasRenderingContext2D,
  groundY: number,
  theme: ThemeMode,
  farHills: ParallaxLayerObject[],
  midDunes: ParallaxLayerObject[]
) {
  const farColor = theme === 'dark' ? '#20202a' : '#d6d3cf';
  const nearColor = theme === 'dark' ? '#2b2b38' : '#c2beb8';

  const drawLayer = (layer: ParallaxLayerObject[], color: string, yOffset: number) => {
    layer.forEach(h => {
      const steps = 7;
      const stepH = h.height / steps;
      for (let s = 0; s < steps; s++) {
        const rowW = h.width * ((s + 1) / steps);
        const rowX = h.x + (h.width - rowW) / 2;
        // Slight jaggedness per variant so silhouettes differ
        const skew = h.variant === 0 ? 0 : h.variant === 1 ? rowW * 0.06 : -rowW * 0.05;
        drawPixelRect(ctx, rowX + skew, groundY + yOffset - h.height + s * stepH, rowW, stepH + 1, color);
      }
    });
  };

  drawLayer(farHills, farColor, -2);
  drawLayer(midDunes, nearColor, 0);
}

const WEATHER_TINTS: Record<WeatherType, string> = {
  clear: '',
  rain: 'rgba(40, 60, 95, 0.18)',
  snow: 'rgba(190, 210, 255, 0.1)',
  sandstorm: 'rgba(205, 140, 55, 0.22)'
};

export function drawAtmosphereOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  atmosphere: Atmosphere
) {
  const { night, sunset, weather, weatherStrength, previousWeather, previousStrength } = atmosphere;
  ctx.save();

  if (night > 0.01) {
    ctx.fillStyle = `rgba(12, 14, 38, ${(night * 0.42).toFixed(3)})`;
    ctx.fillRect(0, 0, width, height);
  }
  if (sunset > 0.01) {
    ctx.fillStyle = `rgba(255, 110, 40, ${(sunset * 0.18).toFixed(3)})`;
    ctx.fillRect(0, 0, width, height);
  }

  // Weather tints crossfade in and out
  const currentTint = WEATHER_TINTS[weather];
  if (currentTint && weatherStrength > 0.01) {
    ctx.globalAlpha = weatherStrength;
    ctx.fillStyle = currentTint;
    ctx.fillRect(0, 0, width, height);
  }

  const prevTint = WEATHER_TINTS[previousWeather];
  if (prevTint && previousStrength > 0.01) {
    ctx.globalAlpha = previousStrength;
    ctx.fillStyle = prevTint;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

export function drawWeatherLayer(
  ctx: CanvasRenderingContext2D,
  particles: WeatherParticle[],
  weather: WeatherType,
  alpha: number
) {
  if (weather === 'clear' || alpha <= 0.01) return;

  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha * alpha;

    if (weather === 'rain' || weather === 'sandstorm') {
      ctx.strokeStyle = weather === 'rain' ? '#9fc5ff' : '#e8c07a';
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      const speed = Math.max(1, Math.sqrt(p.vx * p.vx + p.vy * p.vy));
      ctx.lineTo(p.x - (p.vx / speed) * p.len, p.y - (p.vy / speed) * p.len);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }

    ctx.restore();
  });
}

export function drawBanner(ctx: CanvasRenderingContext2D, text: string, lifeRatio: number, color: string) {
  if (!text || lifeRatio <= 0) return;

  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const y = Math.round(h * 0.22);
  const alpha = Math.min(1, lifeRatio / 0.25);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = '16px "Press Start 2P"';
  const textW = ctx.measureText(text).width;

  // Backing strip
  ctx.globalAlpha = alpha * 0.55;
  drawPixelRect(ctx, w / 2 - textW / 2 - 16, y - 22, textW + 32, 34, '#000000');

  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.fillText(text, w / 2, y + 3);
  ctx.restore();
}

// ----------------------------------------------------
// AI LASER SIGHT / TARGETING RAY
// ----------------------------------------------------
export function drawAILaserSight(
  ctx: CanvasRenderingContext2D,
  telemetry: AITelemetry | null,
  theme: ThemeMode
) {
  if (!telemetry || !telemetry.calculatedTrajectory) return;

  const t = telemetry.calculatedTrajectory;
  const p = PALETTES[theme];

  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = telemetry.willMiss ? 'rgba(255, 170, 0, 0.4)' : p.laserSight;

  ctx.beginPath();
  ctx.moveTo(t.x1, t.y1);
  ctx.lineTo(t.x2, t.y2);
  ctx.stroke();

  // Target reticle
  ctx.setLineDash([]);
  ctx.strokeStyle = telemetry.willMiss ? '#ffaa00' : (theme === 'dark' ? '#00f0ff' : '#ff0000');
  ctx.beginPath();
  ctx.arc(t.x2, t.y2, 5, 0, Math.PI * 2);
  ctx.stroke();

  // Little crosshairs
  drawPixelRect(ctx, t.x2 - 7, t.y2, 4, 1, ctx.strokeStyle);
  drawPixelRect(ctx, t.x2 + 3, t.y2, 4, 1, ctx.strokeStyle);
  drawPixelRect(ctx, t.x2, t.y2 - 7, 1, 4, ctx.strokeStyle);
  drawPixelRect(ctx, t.x2, t.y2 + 3, 1, 4, ctx.strokeStyle);

  ctx.restore();
}
