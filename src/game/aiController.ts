// AI Autonomous Bot Controller for Google Dino Gunner

import {
  Obstacle,
  Enemy,
  HeroState,
  AISettings,
  AITelemetry
} from './types';

export interface AIAction {
  shouldJump: boolean;
  shouldDuck: boolean;
  shouldShoot: boolean;
  targetAngle: number;
}

export class AIController {
  private settings: AISettings;
  private currentAimAngle: number = 0;
  private reactionTimer: number = 0;
  private isReacting: boolean = false;
  private lastTargetId: number | null = null;
  private currentShotWillMiss: boolean = false;
  private missAngleOffset: number = 0;
  private jumpJitter: number = 0;

  constructor(settings: AISettings) {
    this.settings = settings;
    this.resetState();
  }

  public updateSettings(newSettings: Partial<AISettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  public getSettings(): AISettings {
    return { ...this.settings };
  }

  public resetState() {
    this.currentAimAngle = 0;
    this.reactionTimer = 0;
    this.isReacting = false;
    this.lastTargetId = null;
    this.currentShotWillMiss = false;
    this.missAngleOffset = 0;
    this.jumpJitter = (Math.random() - 0.5) * (1 - this.settings.jumpPrecision) * 30;
  }

  /**
   * Main Decision Loop
   */
  public evaluate(
    hero: HeroState,
    obstacles: Obstacle[],
    enemies: Enemy[],
    gameSpeed: number,
    _canvasWidth: number,
    deltaTimeMs: number
  ): { action: AIAction; telemetry: AITelemetry } {
    let shouldJump = false;
    let shouldDuck = false;
    let shouldShoot = false;
    let targetAngle = 0;
    let status: AITelemetry['status'] = 'RUNNING';
    let nearestThreatDistance = 9999;
    let nearestThreatType: string | null = null;
    let nearestThreatAltitude: string | null = null;
    let calculatedTrajectory: AITelemetry['calculatedTrajectory'] = null;

    const heroRight = hero.x + hero.width;
    const heroGunX = hero.x + 30;
    const heroGunY = hero.y + 20;

    // ----------------------------------------------------
    // 1. SCAN AND SORT TARGETS AHEAD
    // ----------------------------------------------------
    // Filter living enemies ahead
    const livingEnemiesAhead = enemies
      .filter(e => e.x + e.width > hero.x && e.hp > 0 && e.x < hero.x + 550)
      .sort((a, b) => a.x - b.x);

    // Filter ground obstacles ahead
    const obstaclesAhead = obstacles
      .filter(o => o.x + o.width > hero.x && o.x < hero.x + 450)
      .sort((a, b) => a.x - b.x);

    // ----------------------------------------------------
    // 2. AIMING AND SHOOTING ALGORITHM
    // ----------------------------------------------------
    const targetEnemy = livingEnemiesAhead[0] || null;

    if (targetEnemy) {
      const enemyCenterX = targetEnemy.x + targetEnemy.width / 2;
      const enemyCenterY = targetEnemy.y + targetEnemy.height / 2 + (targetEnemy.bobOffset || 0);
      const distToEnemy = targetEnemy.x - heroRight;

      nearestThreatDistance = Math.max(0, Math.round(distToEnemy));
      nearestThreatType = targetEnemy.type;
      nearestThreatAltitude = targetEnemy.isFlying ? (targetEnemy.flyingAltitude || 'mid') : 'ground';

      // Check if target changed to roll new randomness
      if (this.lastTargetId !== targetEnemy.id) {
        this.lastTargetId = targetEnemy.id;
        // Roll for Miss Chance
        const missRoll = Math.random();
        this.currentShotWillMiss = missRoll < this.settings.missChance || (1 - this.settings.accuracy) > Math.random();

        if (this.currentShotWillMiss) {
          // Miss up or down by 14 - 24 degrees
          const sign = Math.random() > 0.5 ? 1 : -1;
          this.missAngleOffset = sign * (0.22 + Math.random() * 0.18);
        } else {
          // Tiny natural spread (0.5 to 1.5 deg)
          this.missAngleOffset = (Math.random() - 0.5) * 0.04;
        }

        // Reaction delay
        this.reactionTimer = this.settings.reactionDelayMs + (Math.random() - 0.5) * 40;
        this.isReacting = true;
      }

      // Calculate pure geometric aiming angle from gun to target
      const dx = enemyCenterX - heroGunX;
      const dy = enemyCenterY - heroGunY;
      const idealAngle = Math.atan2(dy, dx);

      // Clamp angle between -60 deg (looking up at high flyers) and +30 deg (looking down at low ground crawlers)
      const clampedIdealAngle = Math.max(-1.05, Math.min(0.52, idealAngle));

      // Final target angle with AI randomness/miss offset applied
      targetAngle = clampedIdealAngle + this.missAngleOffset;

      // Handle Reaction Timer
      if (this.isReacting) {
        this.reactionTimer -= deltaTimeMs;
        if (this.reactionTimer <= 0) {
          this.isReacting = false;
        }
      }

      // Smooth gun tracking
      const angleDiff = targetAngle - this.currentAimAngle;
      this.currentAimAngle += angleDiff * 0.35;

      // Firing Decision
      // Shoot if enemy is within effective range (< 480px) and reaction timer ready
      if (distToEnemy < 480 && !this.isReacting) {
        shouldShoot = true;
        status = 'FIRING';
      } else {
        status = 'AIMING';
      }

      // Calculate trajectory ray for visual laser sight
      const rayLength = Math.min(distToEnemy + 60, 480);
      const targetRayX = heroGunX + Math.cos(this.currentAimAngle) * rayLength;
      const targetRayY = heroGunY + Math.sin(this.currentAimAngle) * rayLength;

      calculatedTrajectory = {
        x1: heroGunX,
        y1: heroGunY,
        x2: targetRayX,
        y2: targetRayY
      };
    } else {
      // No active enemy ahead: rest gun to horizontal forward
      this.currentAimAngle += (0 - this.currentAimAngle) * 0.2;
      this.lastTargetId = null;
      this.currentShotWillMiss = false;
    }

    // ----------------------------------------------------
    // 3. JUMPING & OBSTACLE EVASION ALGORITHM
    // ----------------------------------------------------
    // Find closest ground hazard (either an obstacle or a ground enemy)
    const nearestObstacle = obstaclesAhead[0] || null;
    const nearestGroundEnemy = livingEnemiesAhead.find(e => !e.isFlying) || null;

    let closestHazardX = 9999;
    let closestHazardW = 0;
    let hazardType = 'none';

    if (nearestObstacle && nearestGroundEnemy) {
      if (nearestObstacle.x < nearestGroundEnemy.x) {
        closestHazardX = nearestObstacle.x;
        closestHazardW = nearestObstacle.width;
        hazardType = nearestObstacle.type;
      } else {
        closestHazardX = nearestGroundEnemy.x;
        closestHazardW = nearestGroundEnemy.width;
        hazardType = nearestGroundEnemy.type;
      }
    } else if (nearestObstacle) {
      closestHazardX = nearestObstacle.x;
      closestHazardW = nearestObstacle.width;
      hazardType = nearestObstacle.type;
    } else if (nearestGroundEnemy) {
      closestHazardX = nearestGroundEnemy.x;
      closestHazardW = nearestGroundEnemy.width;
      hazardType = nearestGroundEnemy.type;
    }

    if (closestHazardX < 9999) {
      const distToHazard = closestHazardX - heroRight;

      if (distToHazard < nearestThreatDistance) {
        nearestThreatDistance = Math.max(0, Math.round(distToHazard));
        nearestThreatType = hazardType;
        nearestThreatAltitude = 'ground';
      }

      // Calculate ideal jump trigger distance based on current speed
      // Base jump trigger zone: ~ 80px to 140px depending on speed
      const baseJumpDist = gameSpeed * 13.5;
      // Extra lead distance for wide obstacle clusters
      const clusterExtra = closestHazardW > 30 ? (closestHazardW - 30) * 0.5 : 0;

      // Jitter due to imperfect AI precision
      const triggerThreshold = baseJumpDist + clusterExtra + this.jumpJitter;

      // Check if jumping might collide with a low/mid flying enemy overhead
      const hasFlyingHazardOverhead = livingEnemiesAhead.some(
        e => e.isFlying && e.x > hero.x - 20 && e.x < closestHazardX + 80 && (e.flyingAltitude === 'mid' || e.flyingAltitude === 'low')
      );

      if (distToHazard <= triggerThreshold && distToHazard > -10 && hero.isGrounded) {
        // If there is an unsaved flying hazard overhead, chance of panic increases
        const panicThreshold = hasFlyingHazardOverhead ? (this.settings.panicChance * 0.15) : (this.settings.panicChance * 0.05);
        if (Math.random() >= panicThreshold) {
          shouldJump = true;
          status = 'JUMPING';
          // Roll new jitter for next obstacle
          this.jumpJitter = (Math.random() - 0.5) * (1 - this.settings.jumpPrecision) * 35;
        }
      }
    }

    // ----------------------------------------------------
    // 4. DUCKING ALGORITHM (For high flying enemies)
    // ----------------------------------------------------
    if (this.settings.autoDuck && hero.isGrounded && !shouldJump) {
      const highFlyerOverhead = livingEnemiesAhead.find(
        e => e.isFlying && e.flyingAltitude === 'high' && (e.x - heroRight) < 90 && (e.x - hero.x) > -40
      );
      if (highFlyerOverhead) {
        shouldDuck = true;
        status = 'EVADING';
      }
    }

    // Overall confidence calculation
    const confidenceScore = Math.round(
      (this.settings.accuracy * 0.6 + this.settings.jumpPrecision * 0.4) * 100 * (this.currentShotWillMiss ? 0.6 : 1.0)
    );

    const telemetry: AITelemetry = {
      status,
      nearestThreatDistance: nearestThreatDistance === 9999 ? 0 : nearestThreatDistance,
      nearestThreatType,
      nearestThreatAltitude,
      aimAngleDeg: Math.round((this.currentAimAngle * 180) / Math.PI),
      calculatedTrajectory,
      willMiss: this.currentShotWillMiss,
      reactionTimerMs: Math.max(0, Math.round(this.reactionTimer)),
      lastAction: shouldJump ? 'ПРЫЖОК' : (shouldShoot ? 'ВЫСТРЕЛ' : (shouldDuck ? 'ПРИСЕД' : 'БЕГ')),
      confidenceScore
    };

    const action: AIAction = {
      shouldJump,
      shouldDuck,
      shouldShoot,
      targetAngle: this.currentAimAngle
    };

    return { action, telemetry };
  }
}
