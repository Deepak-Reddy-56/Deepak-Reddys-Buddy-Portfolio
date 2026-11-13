/**
 * Synthesised interface sounds (Web Audio). No files, no network, no keys.
 *
 * Rules:
 * - Nothing plays until `unlock()` is called from a user gesture
 *   (browsers block audio before that anyway).
 * - Nothing plays while disabled (the visitor's sound preference).
 * - Browsers without Web Audio get silent no-ops.
 */
export type SoundName = 'key' | 'enter' | 'startup' | 'blip' | 'toggle';

type AudioContextCtor = typeof AudioContext;

class SoundEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private enabled = false;

  get supported(): boolean {
    return typeof window !== 'undefined' && this.ctor() !== null;
  }

  get ready(): boolean {
    return this.context?.state === 'running';
  }

  /** The visitor's sound preference (independent of whether audio is unlocked yet). */
  get isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Call from a click / keydown / touch handler. Safe to call repeatedly. */
  unlock(): void {
    if (!this.supported) return;
    try {
      if (!this.context) {
        const Ctor = this.ctor()!;
        this.context = new Ctor();
        this.master = this.context.createGain();
        this.master.gain.value = 0.22;
        this.master.connect(this.context.destination);
        this.noise = this.makeNoise(this.context);
      }
      if (this.context.state === 'suspended') void this.context.resume();
    } catch {
      this.context = null;
    }
  }

  play(name: SoundName): void {
    if (!this.enabled || !this.context || !this.master || this.context.state !== 'running') return;
    const ctx = this.context;
    const now = ctx.currentTime;
    try {
      switch (name) {
        case 'key':
          this.click(now, 2600 + Math.random() * 1400, 0.014, 0.6);
          break;
        case 'enter':
          this.click(now, 1800, 0.018, 0.4);
          this.tone(now, 196, 0.09, 0.22, 'sine');
          break;
        case 'toggle':
          this.click(now, 3200, 0.01, 0.25);
          break;
        case 'blip':
          this.glide(now, 660, 990, 0.16, 0.16);
          break;
        case 'startup':
          this.startup(now);
          break;
      }
    } catch {
      /* never let sound break the experience */
    }
  }

  private ctor(): AudioContextCtor | null {
    const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
    return w.AudioContext ?? w.webkitAudioContext ?? null;
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.1), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private envelope(gain: GainNode, start: number, peak: number, attack: number, release: number): void {
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + release);
  }

  /** Short filtered noise burst — a soft mechanical key. */
  private click(start: number, frequency: number, length: number, peak: number): void {
    const ctx = this.context!;
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = 1.4;
    const gain = ctx.createGain();
    this.envelope(gain, start, peak, 0.002, length);
    source.connect(filter).connect(gain).connect(this.master!);
    source.start(start);
    source.stop(start + length + 0.03);
  }

  private tone(start: number, frequency: number, length: number, peak: number, type: OscillatorType): void {
    const ctx = this.context!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    const gain = ctx.createGain();
    this.envelope(gain, start, peak, 0.005, length);
    osc.connect(gain).connect(this.master!);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }

  private glide(start: number, from: number, to: number, length: number, peak: number): void {
    const ctx = this.context!;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + length * 0.7);
    const gain = ctx.createGain();
    this.envelope(gain, start, peak, 0.03, length); // soft 30 ms attack: a chime, not a click
    osc.connect(gain).connect(this.master!);
    osc.start(start);
    osc.stop(start + length + 0.08);
  }

  /** A restrained, warm swell as the chrome forms: three soft partials through an opening filter. */
  private startup(start: number): void {
    const ctx = this.context!;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, start);
    filter.frequency.exponentialRampToValueAtTime(2600, start + 1.1);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.55);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.4);
    filter.connect(gain).connect(this.master!);

    for (const [frequency, detune] of [
      [220, -4],
      [329.63, 3],
      [440, 0],
      [659.25, 5],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = frequency > 600 ? 'sine' : 'triangle';
      osc.frequency.value = frequency;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(start);
      osc.stop(start + 2.5);
    }
  }
}

export const soundEngine = new SoundEngine();
