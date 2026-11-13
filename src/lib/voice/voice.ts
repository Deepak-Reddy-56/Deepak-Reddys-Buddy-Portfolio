import { soundEngine } from '../audio/soundEngine';

export interface VoiceProvider {
  readonly id: string;
  readonly supported: boolean;
  speak(text: string, hooks?: { onStart?: () => void; onWord?: (charIndex: number) => void; onEnd?: () => void }): Promise<void>;
  cancel(): void;
  prime?(): void;
}

export type AvailableBuddyVoice = { name: string; lang: string; local: boolean };

const NOVELTY = /(bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|fred|junior|ralph|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley)/i;
const VOICE_STORAGE_KEY = 'buddy.voice.name';

function rankVoice(voice: SpeechSynthesisVoice): number {
  if (!/^en(-|_|$)/i.test(voice.lang) || NOVELTY.test(voice.name)) return -1;
  let score = 0;
  if (/(natural|neural|online|enhanced|premium)/i.test(voice.name)) score += 50;
  if (/^en[-_](GB|US|AU|IE|IN)/i.test(voice.lang)) score += 10;
  if (/google/i.test(voice.name)) score += 8;
  if (voice.localService) score += 2;
  return score;
}

class SpeechSynthesisVoiceProvider implements VoiceProvider {
  readonly id = 'web-speech';
  private voices: SpeechSynthesisVoice[] = [];
  private primed = false;
  private preferredName: string | null = this.readPreference();
  lastError: string | null = null;

  constructor() {
    if (!this.supported) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) this.voices = list;
    };
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
  }

  get supported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  private readPreference(): string | null {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage.getItem(VOICE_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  availableVoices(): AvailableBuddyVoice[] {
    if (!this.supported) return [];
    const voices = this.voices.length ? this.voices : window.speechSynthesis.getVoices();
    return voices
      .filter((voice) => rankVoice(voice) >= 0)
      .sort((a, b) => rankVoice(b) - rankVoice(a) || a.name.localeCompare(b.name))
      .map((voice) => ({ name: voice.name, lang: voice.lang, local: voice.localService }));
  }

  setPreferredVoice(name: string | null): void {
    this.preferredName = name;
    try {
      if (name) localStorage.setItem(VOICE_STORAGE_KEY, name);
      else localStorage.removeItem(VOICE_STORAGE_KEY);
    } catch {
      // Speech remains usable when storage is unavailable.
    }
  }

  private pick(): SpeechSynthesisVoice | null {
    const voices = this.voices.length ? this.voices : window.speechSynthesis.getVoices();
    if (this.preferredName) {
      const preferred = voices.find((voice) => voice.name === this.preferredName && rankVoice(voice) >= 0);
      if (preferred) return preferred;
    }
    return voices.reduce<SpeechSynthesisVoice | null>((best, voice) => {
      if (rankVoice(voice) < 0) return best;
      return !best || rankVoice(voice) > rankVoice(best) ? voice : best;
    }, null);
  }

  prime(): void {
    if (!this.supported || this.primed) return;
    try {
      const silent = new SpeechSynthesisUtterance(' ');
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
      this.primed = true;
    } catch {
      // A later user gesture may prime the engine.
    }
  }

  speak(text: string, hooks: { onStart?: () => void; onWord?: (charIndex: number) => void; onEnd?: () => void } = {}): Promise<void> {
    if (!this.supported || !text.trim()) return Promise.resolve();
    return new Promise((resolve) => {
      try {
        const synth = window.speechSynthesis;
        if (synth.speaking || synth.pending) synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = this.pick();
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else {
          utterance.lang = 'en-GB';
        }
        utterance.pitch = 1.07;
        utterance.rate = 0.96;
        utterance.volume = 0.92;

        let settled = false;
        const expectedMs = Math.max(9000, text.trim().split(/\\s+/).length * 620 + 4500);
        const done = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(watchdog);
          hooks.onEnd?.();
          resolve();
        };
        const watchdog = window.setTimeout(done, expectedMs);
        utterance.onstart = () => hooks.onStart?.();
        utterance.onboundary = (event) => {
          if (event.name === 'word' || event.charIndex > 0) hooks.onWord?.(event.charIndex);
        };
        utterance.onend = done;
        utterance.onerror = (event) => {
          this.lastError = event.error;
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

/** One voice controller for the site: dedupe, interruption, voice preference and mouth timing. */
class BuddyVoice {
  private provider: SpeechSynthesisVoiceProvider | VoiceProvider = new SpeechSynthesisVoiceProvider();
  private said = new Set<string>();
  private runId = 0;
  private speakingSince = 0;
  private lastWordAt = 0;
  private speaking = false;

  use(provider: VoiceProvider): void {
    this.cancel();
    this.provider = provider;
  }

  get supported(): boolean { return this.provider.supported; }
  get isSpeaking(): boolean { return this.speaking; }
  get lastError(): string | null {
    return this.provider instanceof SpeechSynthesisVoiceProvider ? this.provider.lastError : null;
  }
  get availableVoices(): AvailableBuddyVoice[] {
    return this.provider instanceof SpeechSynthesisVoiceProvider ? this.provider.availableVoices() : [];
  }

  setPreferredVoice(name: string | null): void {
    if (this.provider instanceof SpeechSynthesisVoiceProvider) this.provider.setPreferredVoice(name);
  }

  prime(): void {
    if (soundEngine.isEnabled) this.provider.prime?.();
  }

  sayOnce(key: string, text: string): boolean {
    if (this.said.has(key) || !soundEngine.isEnabled || !this.provider.supported) return false;
    this.said.add(key);
    return this.speakNow(key, text);
  }

  /** Starts the new line immediately and cancels any previous narration. */
  speakNow(_key: string, text: string): boolean {
    if (!soundEngine.isEnabled || !this.provider.supported || !text.trim()) return false;
    this.provider.cancel();
    const run = ++this.runId;
    this.speaking = false;
    void this.provider.speak(text, {
      onStart: () => {
        if (run !== this.runId) return;
        this.speaking = true;
        this.speakingSince = performance.now();
        this.lastWordAt = this.speakingSince;
      },
      onWord: () => {
        if (run === this.runId) this.lastWordAt = performance.now();
      },
      onEnd: () => {
        if (run === this.runId) this.speaking = false;
      },
    }).then(() => {
      if (run === this.runId) this.speaking = false;
    });
    return true;
  }

  cancel(): void {
    this.runId += 1;
    this.speaking = false;
    this.provider.cancel();
  }

  talk(now: number): number {
    if (!this.speaking) return 0;
    const t = (now - this.speakingSince) / 1000;
    const accent = Math.exp(-(now - this.lastWordAt) / 150);
    const flutter = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 5.1) * Math.sin(t * Math.PI * 2 * 1.55 + 0.6);
    return Math.min(1, 0.22 + 0.52 * flutter + 0.32 * accent);
  }
}

export const buddyVoice = new BuddyVoice();
