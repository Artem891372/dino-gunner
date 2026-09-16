// Web Audio API Retro 8-bit Sound Synthesizer

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.3;

  // Background music loop state
  private musicEnabled: boolean = true;
  private musicBpm: number = 116;
  private scheduleTimer: number | null = null;
  private musicStep: number = 0;
  private musicNextTime: number = 0;
  private musicGain: GainNode | null = null;

  constructor() {
    // Lazy initialize AudioContext on user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.musicGain) {
      this.musicGain.gain.value = muted ? 0 : this.volume * 0.9;
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Call on first user gesture to satisfy browser autoplay policies
  public unlock() {
    this.initCtx();
    if (this.musicEnabled) {
      this.startMusic();
    }
  }

  public setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (enabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public setMusicBpm(bpm: number) {
    this.musicBpm = Math.max(90, Math.min(170, bpm));
  }

  public startMusic() {
    if (this.scheduleTimer !== null) return;
    this.initCtx();
    if (!this.ctx) return;

    if (!this.musicGain) {
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.isMuted ? 0 : this.volume * 0.9;
      this.musicGain.connect(this.ctx.destination);
    }

    this.musicStep = 0;
    this.musicNextTime = this.ctx.currentTime + 0.08;
    this.scheduleTimer = window.setInterval(() => this.musicScheduler(), 25);
  }

  public stopMusic() {
    if (this.scheduleTimer !== null) {
      window.clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
    }
  }

  private musicScheduler() {
    if (!this.ctx || !this.musicEnabled) return;
    const stepDur = 60 / this.musicBpm / 4; // 16th notes

    // If the context was suspended, skip the missed notes instead of dumping them at once
    const now = this.ctx.currentTime;
    if (this.musicNextTime < now) {
      this.musicNextTime = now + 0.05;
    }

    while (this.musicNextTime < now + 0.12) {
      this.scheduleMusicStep(this.musicStep, this.musicNextTime);
      this.musicNextTime += stepDur;
      this.musicStep = (this.musicStep + 1) % 64;
    }
  }

  // Simple 8-bit beat: kick / snare / hat / bass / arp (64 steps = 4 bars)
  private scheduleMusicStep(step: number, t: number) {
    if (!this.ctx || !this.musicGain) return;

    const inBar = step % 16;
    const bar = Math.floor(step / 16);

    // Crash opens each half of the loop
    if (step === 0 || step === 32) {
      this.musicCrash(t);
    }

    // Kick: four-on-the-floor + syncopated push in bars 2 & 4
    if (inBar % 4 === 0 || ((bar === 1 || bar === 3) && inBar === 14)) {
      this.musicKick(t);
    }

    // Snare backbeat
    if (inBar === 4 || inBar === 12) {
      this.musicSnare(t);
    }

    // Clap stacked on the snare in bars 2 & 4
    if ((bar === 1 || bar === 3) && (inBar === 4 || inBar === 12)) {
      this.musicClap(t);
    }

    // Hats: 8ths with accents + open hat ending the bar
    if (inBar % 2 === 1) {
      const accent = inBar === 3 || inBar === 7 || inBar === 11 || inBar === 15;
      this.musicHat(t, accent ? 0.16 : 0.09);
    }
    if (inBar === 6 || inBar === 14) {
      this.musicOpenHat(t);
    }

    // Tom fill at the end of bars 2 & 4
    if ((bar === 1 || bar === 3) && (inBar === 13 || inBar === 14)) {
      this.musicTom(t, inBar === 13 ? 185 : 135);
    }

    // Bass: root groove + octave/fifth pushes
    const bassRoots = [110, 110, 87.31, 98]; // A2 A2 F2 G2
    const root = bassRoots[bar];
    if (inBar % 4 === 0) {
      this.musicTone(root, t, 0.2, 'square', 0.16, 0.16);
    }
    if (inBar === 2 || inBar === 10) {
      this.musicTone(root * 2, t, 0.1, 'square', 0.07, 0.09);
    }
    if (inBar === 6 || inBar === 14) {
      this.musicTone(root * 1.5, t, 0.1, 'square', 0.07, 0.09);
    }

    // Arp lead in the 2nd half of the loop, with a quiet octave echo
    if (step >= 32 && inBar % 2 === 0) {
      const arp = [440, 523.25, 659.25, 523.25, 587.33, 659.25, 783.99, 659.25];
      const note = arp[Math.floor(step / 2) % arp.length];
      this.musicTone(note, t, 0.09, 'square', 0.06, 0.1);
      this.musicTone(note * 2, t, 0.06, 'triangle', 0.025, 0.08);
    }
  }

  private musicKick(t: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.11);
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.13);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  private musicSnare(t: number) {
    this.playNoise(0.09, 0.32, this.musicGain ?? undefined, t);
  }

  private musicClap(t: number) {
    this.playNoise(0.05, 0.3, this.musicGain ?? undefined, t);
    this.playNoise(0.1, 0.18, this.musicGain ?? undefined, t + 0.02);
  }

  private musicHat(t: number, vol: number) {
    this.playNoise(0.03, vol, this.musicGain ?? undefined, t);
  }

  private musicOpenHat(t: number) {
    this.playNoise(0.14, 0.13, this.musicGain ?? undefined, t);
  }

  private musicCrash(t: number) {
    this.playNoise(0.5, 0.2, this.musicGain ?? undefined, t);
  }

  private musicTom(t: number, freq: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.16);
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  private musicTone(freq: number, t: number, dur: number, type: OscillatorType, vol: number, decay: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.005, t + decay);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  // 8-bit Jump Sound: Frequency slide upwards
  public playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

      gain.gain.setValueAtTime(this.volume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio context might be restricted
    }
  }

  // Gun Shot / Laser Sound
  public playShoot(type: 'rifle' | 'laser' | 'shotgun' | 'plasma' = 'rifle') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      if (type === 'laser' || type === 'plasma') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

        gain.gain.setValueAtTime(this.volume * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'shotgun') {
        // Heavy boom with noise
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

        gain.gain.setValueAtTime(this.volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
        this.playNoise(0.18, 0.4);
      } else {
        // Rifle: quick punchy square wave + noise burst
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

        gain.gain.setValueAtTime(this.volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
        this.playNoise(0.06, 0.25);
      }
    } catch {
      // ignore
    }
  }

  // White noise burst for explosions/bullets/music
  private playNoise(duration: number, volFactor: number, dest?: AudioNode, startTime?: number) {
    if (!this.ctx) return;
    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const gain = this.ctx.createGain();
      const now = startTime ?? this.ctx.currentTime;
      const level = dest ? volFactor : this.volume * volFactor;
      gain.gain.setValueAtTime(level, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      noise.connect(gain);
      gain.connect(dest ?? this.ctx.destination);

      noise.start(now);
    } catch {
      // ignore
    }
  }

  // Enemy Hit / Explosion
  public playHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

      gain.gain.setValueAtTime(this.volume * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
      this.playNoise(0.12, 0.35);
    } catch {
      // ignore
    }
  }

  // Death / Game Over Jingle
  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // 3 descending tones
      const notes = [280, 220, 160, 110];
      notes.forEach((freq, index) => {
        const t = now + index * 0.12;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(this.volume * 0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + 0.18);
      });
      this.playNoise(0.3, 0.4);
    } catch {
      // ignore
    }
  }

  // Score 100-pt milestone chime (classic high beep pair)
  public playMilestone() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [800, 1000].forEach((freq, idx) => {
        const t = now + idx * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(this.volume * 0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + 0.07);
      });
    } catch {
      // ignore
    }
  }

  // Combo tier-up sting: pitch climbs with the streak
  public playCombo(tier: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = 560 + tier * 55;
      [1, 1.5].forEach((ratio, idx) => {
        const t = now + idx * 0.06;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(baseFreq * ratio, t);

        gain.gain.setValueAtTime(this.volume * 0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + 0.09);
      });
    } catch {
      // ignore
    }
  }

  // Weapon pickup power-up arpeggio
  public playPickup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [520, 780, 1040].forEach((freq, idx) => {
        const t = now + idx * 0.07;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(this.volume * 0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + 0.09);
      });
    } catch {
      // ignore
    }
  }

  // Respawn chime
  public playRespawn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [300, 450, 600].forEach((freq, idx) => {
        const t = now + idx * 0.06;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(this.volume * 0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(t);
        osc.stop(t + 0.06);
      });
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
