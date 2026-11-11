/**
 * Sonification of the experiments (parameter mapping, [hermann2011]).
 *
 * This is an auditory display, not a recording: the mechanical frequencies
 * (below about 2 Hz) are far under the audible range, so quantities are mapped
 * onto sound deliberately.
 *
 *  Oscillator  - a sine tone whose pitch follows the displacement (one octave
 *                per 3.5 m) and whose loudness follows the speed; an impact
 *                with a stop gives a short click scaled by the impact speed.
 *  Pendulum    - a tick each time the first link passes the vertical, higher
 *                pitched for one direction than for the other. A single
 *                pendulum sounds like a clock; a chaotic chain does not.
 *
 * Sound only plays while the simulation is running, the tab is visible and
 * the user has switched it on (browsers require a gesture to start audio).
 */

import type { Simulation } from "@/sim/Simulation";

const BASE_FREQUENCY = 220;
const METRES_PER_OCTAVE = 3.5;

type AudioContextConstructor = typeof AudioContext;

export class Sonifier {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private tone: OscillatorNode | null = null;
  private toneGain: GainNode | null = null;
  private enabled = false;
  private impactsHeard = 0;
  private previousSine = 0;
  private previousTime = Number.NaN;
  private epoch = -1;

  /** Must be called from a user gesture when enabling. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.master?.gain.setTargetAtTime(0, this.context?.currentTime ?? 0, 0.03);
      return;
    }
    if (!this.context) {
      const Constructor: AudioContextConstructor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
      if (!Constructor) return;
      this.context = new Constructor();
      this.master = this.context.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.context.destination);
      this.toneGain = this.context.createGain();
      this.toneGain.gain.value = 0;
      this.toneGain.connect(this.master);
      this.tone = this.context.createOscillator();
      this.tone.type = "sine";
      this.tone.frequency.value = BASE_FREQUENCY;
      this.tone.connect(this.toneGain);
      this.tone.start();
    }
    void this.context.resume();
  }

  /** Call once per animation frame. */
  update(sim: Simulation): void {
    const { context, master, tone, toneGain } = this;
    if (!context || !master || !tone || !toneGain) return;
    const state = sim.getState();
    const now = context.currentTime;
    const audible = this.enabled && state.running && !sim.isDragging && state.status === "ok" && !document.hidden;
    master.gain.setTargetAtTime(audible ? 1 : 0, now, 0.03);

    if (state.epoch !== this.epoch) {
      // A restart must not be heard as an impact or a crossing.
      this.epoch = state.epoch;
      this.impactsHeard = sim.osc.impactCount;
      this.previousSine = Math.sin(sim.pend.y[0]);
      this.previousTime = Number.NaN;
    }

    if (state.module === "oscillator") {
      const { x, v } = sim.osc;
      tone.frequency.setTargetAtTime(BASE_FREQUENCY * Math.pow(2, x / METRES_PER_OCTAVE), now, 0.015);
      toneGain.gain.setTargetAtTime(audible ? 0.07 * Math.tanh(Math.abs(v) / 4) : 0, now, 0.04);
      if (sim.osc.impactCount !== this.impactsHeard) {
        this.impactsHeard = sim.osc.impactCount;
        if (audible) this.click(110, Math.min(0.5, 0.08 + sim.osc.lastImpactSpeed / 30), 0.12, "triangle");
      }
      return;
    }

    toneGain.gain.setTargetAtTime(0, now, 0.03);
    const theta = sim.pend.y[0];
    const sine = Math.sin(theta);
    const advanced = sim.pend.t !== this.previousTime;
    if (audible && advanced && Math.cos(theta) > 0 && sine !== this.previousSine) {
      if (this.previousSine < 0 && sine >= 0) this.click(660, 0.12, 0.05, "sine");
      else if (this.previousSine > 0 && sine <= 0) this.click(440, 0.12, 0.05, "sine");
    }
    this.previousSine = sine;
    this.previousTime = sim.pend.t;
  }

  private click(frequency: number, gain: number, duration: number, type: OscillatorType): void {
    const { context, master } = this;
    if (!context || !master) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    envelope.gain.setValueAtTime(gain, now);
    envelope.gain.exponentialRampToValueAtTime(1e-4, now + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  dispose(): void {
    this.tone?.stop();
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.tone = null;
    this.toneGain = null;
  }
}
