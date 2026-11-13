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
class BuddyVoice {
  private provider: VoiceProvider = new SpeechSynthesisVoiceProvider();
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

  cancel(): void {
    this.speaking = false;
    this.provider.cancel();
  }

  get isSpeaking(): boolean {
    return this.speaking;
  }

  /** Mouth opening 0..1 for the current moment (syllable-ish flutter, accented on word starts). */
  talk(now: number): number {
    if (!this.speaking) return 0;
    const t = (now - this.speakingSince) / 1000;
    const accent = Math.exp(-(now - this.lastWordAt) / 140);
    const flutter = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 5.5) * Math.sin(t * Math.PI * 2 * 1.7 + 0.6);
    return Math.min(1, 0.25 + 0.55 * flutter + 0.35 * accent);
  }
}

export const buddyVoice = new BuddyVoice();
