import type { BuddyLine } from '../../content/buddyLines';
import { soundEngine } from '../audio/soundEngine';

/**
 * Buddy's voice — a pluggable provider behind one small interface.
 *
 * M3 ships a Web Speech API provider (no assets, no keys, no network). Its
 * quality depends on the visitor's OS/browser voices: Chrome desktop offers
 * Google voices, Safari/macOS/iOS offer system voices (often the most natural),
 * Firefox uses OS voices, Android uses Google TTS, and some Linux setups have
 * none — then Buddy just shows the caption. A recorded or custom TTS provider
 * can replace it later without touching callers.
 */
export interface VoiceProvider {
  readonly id: string;
  readonly supported: boolean;
  /** Speak; resolves when finished, failed or cancelled. Never throws. */
  speak(text: string, hooks?: { onStart?: () => void; onWord?: () => void }): Promise<void>;
  cancel(): void;
  /** Optional: called inside a user gesture so later speech is allowed (iOS Safari). */
  prime?(): void;
}

/** Novelty / effect voices that would undercut a friendly character. */
const NOVELTY = /(bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|fred|junior|ralph|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley)/i;

function rankVoice(voice: SpeechSynthesisVoice): number {
  if (!/^en(-|_|$)/i.test(voice.lang) || NOVELTY.test(voice.name)) return -1;
  let score = 0;
  if (/(natural|neural|online|enhanced|premium)/i.test(voice.name)) score += 50; // modern neural voices first
  if (/^en[-_](GB|US|AU|IE|IN)/i.test(voice.lang)) score += 10;
  if (/google/i.test(voice.name)) score += 8;
  if (voice.localService) score += 2; // starts faster, works offline
  return score;
}

class SpeechSynthesisVoiceProvider implements VoiceProvider {
  readonly id = 'web-speech';
  private voices: SpeechSynthesisVoice[] = [];
  private primed = false;
  /** Last failure reported by the engine (e.g. 'not-allowed' without a user gesture). */
  lastError: string | null = null;

  constructor() {
    if (!this.supported) return;
    // Chrome fills the voice list asynchronously; keep a cached copy so the first line gets the good voice.
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) this.voices = list;
    };
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
  }

  /**
   * Call inside a user gesture (sound toggle, running the intro). iOS Safari only
   * lets later, timer-driven speech play once speech has started inside a gesture.
   */
  prime(): void {
    if (!this.supported || this.primed) return;
    try {
      const silent = new SpeechSynthesisUtterance(' ');
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
      this.primed = true;
    } catch {
      /* ignore */
    }
  }

  get supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  private pick(): SpeechSynthesisVoice | null {
    const voices = this.voices.length ? this.voices : window.speechSynthesis.getVoices();
    let best: SpeechSynthesisVoice | null = null;
    let bestScore = -1;
    for (const voice of voices) {
      const score = rankVoice(voice);
      if (score > bestScore) {
        best = voice;
        bestScore = score;
      }
    }
    return best;
  }

  speak(text: string, hooks: { onStart?: () => void; onWord?: () => void } = {}): Promise<void> {
    if (!this.supported) return Promise.resolve();
    return new Promise((resolve) => {
      try {
        const synth = window.speechSynthesis;
        if (synth.speaking || synth.pending) synth.cancel(); // (cancelling an idle queue can drop the next utterance in Safari)
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = this.pick();
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else {
          utterance.lang = 'en-GB';
        }
        // Friendly and a little playful: slightly raised pitch, natural pace.
        utterance.pitch = 1.15;
        utterance.rate = 1.03;
        utterance.volume = 0.9;
        let settled = false;
        const done = () => {
          if (!settled) {
            settled = true;
            window.clearTimeout(watchdog);
            resolve();
          }
        };
        // Some engines never fire events; never leave Buddy "talking" forever.
        const watchdog = window.setTimeout(done, 4000);
        utterance.onstart = () => hooks.onStart?.();
        utterance.onboundary = () => hooks.onWord?.();
        utterance.onend = done;
        utterance.onerror = (event) => {
          this.lastError = event.error; // 'not-allowed' = no user activation; the caption still shows
          done();
        };
        synth.speak(utterance);
      } catch {
        resolve();
      }
    });
  }

  cancel(): void {
    if (this.supported) window.speechSynthesis.cancel();
  }
}

/**
 * Buddy's voice service: provider + "say once" guard + a talk envelope the
 * renderers read every frame to move the mouth.
 */

/**
 * Buddy's speaking pace: playback rate for recorded lines (pitch preserved).
 * Short intro lines keep a lively pace; jokes and the Deepak lines get a touch
 * slower so they land. Works with whichever audio was generated (Kokoro or Speechify).
 */
export const SPEECH_RATE = 0.9;
const JOKE_RATE = 0.86;

/** Extra beats held at punctuation, in ms (the recordings' own pauses are short). */
const HOLD_MS = { sentence: 380, ellipsis: 460, minor: 170 } as const;

type Pause = { at: number; ms: number };
type Pacing = { rate: number; pauses: Pause[]; spokenMs: number };

const QUIET = 0.1;
const FPS = 60;

/**
 * Where to hold a beat: each punctuation mark's position in the text is mapped
 * onto the voiced span of the recording, then snapped to the nearest real
 * silence in the loudness envelope (no silence nearby → no hold).
 */
function findPauses(line: BuddyLine): Pause[] {
  const env = line.envelope;
  let first = -1;
  let last = -1;
  env.forEach((v, i) => {
    if (v >= QUIET) {
      if (first < 0) first = i;
      last = i;
    }
  });
  if (first < 0) return [];
  const a = first / FPS;
  const b = last / FPS;
  const gaps: { t: number; len: number }[] = [];
  for (let i = 0; i < env.length; ) {
    if (env[i] < QUIET) {
      let j = i;
      while (j < env.length && env[j] < QUIET) j++;
      if (j - i >= 2 && i / FPS > a && j / FPS < b) gaps.push({ t: (i + j) / 2 / FPS, len: j - i });
      i = j;
    } else i++;
  }
  const pauses: Pause[] = [];
  const marks = /([.!?\u2026]+["'\u201d\u2019)]*|[,;:\u2014\u2013])\s+(?=\S)/g;
  for (let m = marks.exec(line.text); m; m = marks.exec(line.text)) {
    const est = a + ((m.index + m[0].length) / line.text.length) * (b - a);
    let best: { t: number; len: number } | null = null;
    let bestScore = Infinity;
    for (const g of gaps) {
      const off = Math.abs(g.t - est);
      if (off > 0.4) continue;
      const score = off - g.len * 0.02;
      if (score < bestScore) {
        bestScore = score;
        best = g;
      }
    }
    if (!best || pauses.some((p) => p.at === best.t)) continue;
    const mark = m[1];
    const ms = /\.\.\.|\u2026/.test(mark) ? HOLD_MS.ellipsis : /[.!?]/.test(mark) ? HOLD_MS.sentence : HOLD_MS.minor;
    pauses.push({ at: best.t, ms });
  }
  return pauses.sort((x, y) => x.at - y.at);
}

const pacingCache = new Map<string, Pacing>();

/** Rate, held beats and total spoken length (ms) for a line. */
export function pacingOf(line: BuddyLine): Pacing {
  let pacing = pacingCache.get(line.id);
  if (!pacing) {
    const rate = line.group === 'intro' ? SPEECH_RATE : JOKE_RATE;
    const pauses = findPauses(line);
    const spokenMs = (line.duration / rate) * 1000 + pauses.reduce((sum, p) => sum + p.ms, 0);
    pacing = { rate, pauses, spokenMs };
    pacingCache.set(line.id, pacing);
  }
  return pacing;
}

/** Wall-clock ms from the start of a line until `fraction` of its audio has played (holds included). */
export function spokenAt(line: BuddyLine, fraction: number): number {
  const { rate, pauses } = pacingOf(line);
  const t = line.duration * fraction;
  return (t / rate) * 1000 + pauses.filter((p) => p.at < t).reduce((sum, p) => sum + p.ms, 0);
}

type ActiveLine = {
  line: BuddyLine;
  pacing: Pacing;
  audio: HTMLAudioElement | null;
  /** Position in the recording, seconds. */
  media: number;
  next: number;
  holdUntil: number;
  last: number;
  raf: number;
  finish: () => void;
};

class BuddyVoice {
  private provider: VoiceProvider = new SpeechSynthesisVoiceProvider();
  private active: ActiveLine | null = null;
  private readonly clips = new Map<string, HTMLAudioElement>();
  private said = new Set<string>();
  private speakingSince = 0;
  private lastWordAt = 0;
  private speaking = false;

  use(provider: VoiceProvider): void {
    this.provider = provider;
  }

  get supported(): boolean {
    return this.provider.supported;
  }

  /** Call from a user gesture (sound toggle, running the intro). */
  prime(): void {
    if (soundEngine.isEnabled) this.provider.prime?.();
  }

  /** Speak `text` once per `key` (e.g. one intro run). Respects the sound preference. */
  sayOnce(key: string, text: string): void {
    if (this.said.has(key) || !soundEngine.isEnabled || !this.provider.supported) return;
    this.said.add(key);
    this.speaking = false;
    void this.provider
      .speak(text, {
        onStart: () => {
          this.speaking = true;
          this.speakingSince = performance.now();
          this.lastWordAt = this.speakingSince;
        },
        onWord: () => {
          this.lastWordAt = performance.now();
        },
      })
      .then(() => {
        this.speaking = false;
      });
  }

  /** Fetch line audio ahead of time (call at the start of the intro). */
  preload(lines: readonly BuddyLine[]): void {
    for (const line of lines) {
      if (this.clips.has(line.src)) continue;
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = line.src;
      this.clips.set(line.src, audio);
    }
  }

  /**
   * Play one of Buddy's recorded lines. With sound on, the audio plays (it was
   * unlocked by the visitor's Enter / click); with sound off — or if the browser
   * refuses playback — the line still runs on its own clock, so the caption and
   * the mouth stay in step. Resolves when the line has finished (or was cancelled).
   */
  playLine(line: BuddyLine): Promise<void> {
    this.stopLine();
    return new Promise((resolve) => {
      let done = false;
      const pacing = pacingOf(line);
      const finish = () => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        window.cancelAnimationFrame(entry.raf);
        if (this.active?.finish === finish) this.active = null;
        resolve();
      };
      const audio = soundEngine.isEnabled ? (this.clips.get(line.src) ?? new Audio(line.src)) : null;
      const entry: ActiveLine = {
        line,
        pacing,
        audio,
        media: 0,
        next: 0,
        holdUntil: 0,
        last: performance.now(),
        raf: 0,
        finish,
      };
      this.active = entry;
      // Safety net: never wait much longer than the paced line.
      const timer = window.setTimeout(finish, pacing.spokenMs + 600);

      // One clock for audio and silent playback: advance through the recording,
      // holding a beat at each punctuation pause (audio paused, mouth closed).
      const tick = (now: number) => {
        if (done) return;
        const dt = Math.min(0.1, (now - entry.last) / 1000);
        entry.last = now;
        if (entry.holdUntil) {
          if (now >= entry.holdUntil) {
            entry.holdUntil = 0;
            if (entry.audio) void entry.audio.play().catch(() => (entry.audio = null));
          }
        } else {
          if (entry.audio && !entry.audio.paused) entry.media = entry.audio.currentTime;
          else if (!entry.audio) entry.media += dt * pacing.rate;
          const pause = pacing.pauses[entry.next];
          if (pause && entry.media >= pause.at) {
            entry.next += 1;
            entry.holdUntil = now + pause.ms;
            entry.audio?.pause();
          } else if (!entry.audio && entry.media >= line.duration) {
            finish();
            return;
          }
        }
        entry.raf = window.requestAnimationFrame(tick);
      };

      if (audio) {
        audio.currentTime = 0;
        audio.playbackRate = pacing.rate;
        audio.preservesPitch = true;
        audio.onended = finish;
        audio.play().then(
          () => {
            entry.last = performance.now();
          },
          () => {
            entry.audio = null; // autoplay refused: keep the silent timeline
          },
        );
      }
      entry.raf = window.requestAnimationFrame(tick);
    });
  }

  private stopLine(): void {
    const current = this.active;
    if (!current) return;
    if (current.audio) {
      current.audio.onended = null;
      current.audio.pause();
    }
    current.finish();
  }

  cancel(): void {
    this.speaking = false;
    this.provider.cancel();
    this.stopLine();
  }

  get isSpeaking(): boolean {
    return this.speaking || this.active !== null;
  }

  /** Mouth opening 0..1 for the current moment (syllable-ish flutter, accented on word starts). */
  talk(now: number): number {
    const active = this.active;
    if (active) {
      if (active.holdUntil) return 0; // a held beat: mouth closed
      const audio = active.audio;
      const t = audio && !audio.paused ? audio.currentTime : active.media;
      const env = active.line.envelope;
      const i = Math.floor(t * 60);
      if (i < 0 || i >= env.length) return 0;
      return Math.min(1, env[i] * 1.1);
    }
    if (!this.speaking) return 0;
    const t = (now - this.speakingSince) / 1000;
    const accent = Math.exp(-(now - this.lastWordAt) / 140);
    const flutter = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 5.5) * Math.sin(t * Math.PI * 2 * 1.7 + 0.6);
    return Math.min(1, 0.25 + 0.55 * flutter + 0.35 * accent);
  }
}

export const buddyVoice = new BuddyVoice();
