import { Phase } from "@mafia/game-rules";

/**
 * Procedural Web Audio API Sound Synthesizer
 * Zero external audio assets required. All sound effects are generated mathematically
 * in real-time using browser native AudioContext oscillators, filters, and gain envelopes.
 */

const STORAGE_SFX_VOLUME = "mafia_sfx_volume";
const STORAGE_SFX_MUTED = "mafia_sfx_muted";

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume: number = 0.7;
  private muted: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      const savedVol = localStorage.getItem(STORAGE_SFX_VOLUME);
      if (savedVol !== null) {
        const parsed = parseFloat(savedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }

      const savedMuted = localStorage.getItem(STORAGE_SFX_MUTED);
      if (savedMuted !== null) {
        this.muted = savedMuted === "true";
      }

      // Pre-warm context on first user interaction
      const unlockAudio = () => {
        this.initContext();
        window.removeEventListener("click", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      };
      window.addEventListener("click", unlockAudio, { once: true });
      window.addEventListener("keydown", unlockAudio, { once: true });
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_SFX_VOLUME, this.volume.toString());
    }
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_SFX_MUTED, this.muted.toString());
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // --- PROCEDURAL SOUND GENERATORS ---

  /**
   * Short subtle UI tap
   */
  public playUIClick(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  }

  /**
   * Resonant wooden confirm tap when casting votes or night hits
   */
  public playVoteConfirm(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.08); // E5

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.15);
  }

  /**
   * Tension countdown tick for final seconds of discussion or voting
   */
  public playClockTick(isUrgent: boolean = false): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "square";
    const freq = isUrgent ? 1200 : 800;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(freq, ctx.currentTime);
    filter.Q.setValueAtTime(6, ctx.currentTime);

    const baseGain = isUrgent ? 0.2 : 0.1;
    gain.gain.setValueAtTime(baseGain, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  /**
   * Distinct, atmospheric musical sting for each game phase transition
   */
  public playPhaseTransition(phase: Phase): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    switch (phase) {
      case Phase.NIGHT:
        this.synthesizeNightDrone(ctx);
        break;
      case Phase.MORNING_ANNOUNCEMENT:
        this.synthesizeDawnBell(ctx);
        break;
      case Phase.DAY_DISCUSSION:
        this.synthesizeDiscussionChime(ctx);
        break;
      case Phase.DAY_VOTING:
      case Phase.REVOTING:
        this.synthesizeGavelStrike(ctx);
        break;
      case Phase.ELIMINATION_ANNOUNCEMENT:
        this.synthesizeDoomToll(ctx);
        break;
      case Phase.VICTORY:
        this.synthesizeVictoryFanfare(ctx);
        break;
      default:
        break;
    }
  }

  // --- INDIVIDUAL ATMOSPHERIC STINGS ---

  /**
   * Deep ominous drone with slow opening filter (Nightfall)
   */
  private synthesizeNightDrone(ctx: AudioContext): void {
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Minor third drone: A2 (110Hz) & C3 (130.8Hz)
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(110, now);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(130.81, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 1.2);
    filter.frequency.exponentialRampToValueAtTime(80, now + 2.8);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.8);
    osc2.stop(now + 2.8);
  }

  /**
   * Resonant church bell tolling (Dawn Announcement)
   */
  private synthesizeDawnBell(ctx: AudioContext): void {
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    // Bell harmonics: fundamental 440Hz, 880Hz (octave), 1230Hz, 1760Hz
    const harmonics = [
      { f: 440, g: 0.3, decay: 2.2 },
      { f: 880, g: 0.22, decay: 1.8 },
      { f: 1230, g: 0.15, decay: 1.4 },
      { f: 1760, g: 0.08, decay: 0.9 }
    ];

    harmonics.forEach(({ f, g, decay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(g, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + decay);
    });
  }

  /**
   * Harmonious 2-tone melodic chime (Day Discussion)
   */
  private synthesizeDiscussionChime(ctx: AudioContext): void {
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, time: now, duration: 0.6 },       // C5
      { freq: 659.25, time: now + 0.18, duration: 0.8 } // E5
    ];

    notes.forEach(({ freq, time, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.2, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  /**
   * Heavy wooden tribunal gavel strike (Day Voting / Revoting)
   */
  private synthesizeGavelStrike(ctx: AudioContext): void {
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    // Pitch sweep impact
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 0.25);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.35);

    // Second bounce / echo 0.14s later
    const bounceOsc = ctx.createOscillator();
    const bounceGain = ctx.createGain();

    bounceOsc.type = "sine";
    bounceOsc.frequency.setValueAtTime(140, now + 0.14);
    bounceOsc.frequency.exponentialRampToValueAtTime(50, now + 0.26);

    bounceGain.gain.setValueAtTime(0.001, now);
    bounceGain.gain.setValueAtTime(0.25, now + 0.14);
    bounceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    bounceOsc.connect(bounceGain);
    bounceGain.connect(this.masterGain);

    bounceOsc.start(now + 0.14);
    bounceOsc.stop(now + 0.32);
  }

  /**
   * Dark doom bass drop & descending toll (Elimination Announcement)
   */
  private synthesizeDoomToll(ctx: AudioContext): void {
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(95, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 1.8);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 1.8);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 2.0);
  }

  /**
   * Triumphant major arpeggio flourish (Victory)
   */
  private synthesizeVictoryFanfare(ctx: AudioContext): void {
    if (!this.masterGain) return;
    const now = ctx.currentTime;

    // C Major Triad Fanfare: C4 (261.6), E4 (329.6), G4 (392.0), C5 (523.25)
    const notes = [
      { f: 261.63, delay: 0.0, dur: 0.3 },
      { f: 329.63, delay: 0.12, dur: 0.3 },
      { f: 392.0, delay: 0.24, dur: 0.35 },
      { f: 523.25, delay: 0.38, dur: 1.5 }
    ];

    notes.forEach(({ f, delay, dur }) => {
      const t = now + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(t);
      osc.stop(t + dur);
    });
  }
}

export const audioManager = new AudioManager();
