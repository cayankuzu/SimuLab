// Web Audio API Engine for SimuLab Physics Laboratory
// Synthesizes natural laboratory acoustic frequencies, resonance harmonics, and pendulum clicks.

class PhysicsAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private oscNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private resonantChimeNode: OscillatorNode | null = null;
  private resonantGainNode: GainNode | null = null;

  public init() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!muted) {
      this.init();
      this.startContinuousTone();
    } else {
      this.stopContinuousTone();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private startContinuousTone() {
    if (!this.ctx || this.isMuted) return;
    try {
      if (!this.oscNode) {
        this.oscNode = this.ctx.createOscillator();
        this.oscNode.type = "sine";
        this.oscNode.frequency.setValueAtTime(220, this.ctx.currentTime);

        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(0.001, this.ctx.currentTime);

        this.oscNode.connect(this.gainNode);
        this.gainNode.connect(this.ctx.destination);
        this.oscNode.start();
      }
    } catch {
      // Audio autoplay policy handled
    }
  }

  private stopContinuousTone() {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  public updateSpringAudio(omega: number, amplitude: number, isResonant: boolean) {
    if (this.isMuted || !this.ctx || !this.gainNode || !this.oscNode) return;
    try {
      // Scale frequency between 120Hz and 680Hz
      const targetFreq = Math.max(80, Math.min(800, (omega / (2 * Math.PI)) * 180 + 120));
      this.oscNode.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);

      // Volume based on displacement amplitude (max 0.08 to be pleasant and subtle)
      const targetVol = isResonant
        ? 0.09
        : Math.min(0.06, Math.max(0.002, Math.abs(amplitude) * 0.015));
      this.gainNode.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.08);

      if (isResonant) {
        this.playResonanceChime(targetFreq * 2);
      }
    } catch {
      // Ignore audio glitches
    }
  }

  public triggerTick(pitchHz: number = 440) {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(pitchHz, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Ignore
    }
  }

  private lastChimeTime = 0;
  private playResonanceChime(freq: number) {
    if (this.isMuted || !this.ctx) return;
    const now = Date.now();
    if (now - this.lastChimeTime < 800) return;
    this.lastChimeTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch {}
  }
}

export const physicsAudio = new PhysicsAudioEngine();
