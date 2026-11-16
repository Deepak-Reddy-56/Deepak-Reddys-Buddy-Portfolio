import { quips, type Quip } from '../../content/buddyQuips';
import { buddyVoice } from '../../lib/voice/voice';
import type { AccessoryName } from './buddyAccessories';
import { buddyHost } from './buddyHost';
import { buddyQuip } from './buddyQuip';
import { quipLine } from './buddyScript';

/** Click Buddy to cycle his outfits, in this order. */
const OUTFITS: AccessoryName[] = ['none', 'tie', 'shades', 'hardhat'];
const OUTFIT_LINES: Record<AccessoryName, Quip> = { none: quips.none, tie: quips.tie, shades: quips.shades, hardhat: quips.hardhat };
/** Away at least this long and he "dozes off" — and denies it when you come back. */
const AWAY_MS = 20_000;
/** On the home screen this long without moving on: "Ahem. The page keeps going." */
const LINGER_MS = 60_000;

type Host = {
  /** The seat he is sitting at right now (null while flying). */
  activeSeat(): string | null;
  wake(): void;
};

/**
 * Buddy's personality: outfits on click (he twirls, and the new outfit is on
 * when he faces you again, with a line about it), dozing while you're away,
 * and a nudge if you linger on the home screen.
 */
export class BuddyPersonality {
  private readonly host: Host;
  private outfit = 0;
  private awaySince: number | null = null;
  private lingerTimer = 0;
  private wakeTimer = 0;
  private sayTimer = 0;
  private nudged = false;

  constructor(host: Host) {
    this.host = host;
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('blur', this.onAway);
    window.addEventListener('focus', this.onReturn);
  }

  dispose(): void {
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('blur', this.onAway);
    window.removeEventListener('focus', this.onReturn);
    window.clearTimeout(this.lingerTimer);
    window.clearTimeout(this.wakeTimer);
    window.clearTimeout(this.sayTimer);
  }

  private get introPlaying(): boolean {
    return !!document.documentElement.dataset.intro;
  }

  /** The director settled him at a seat (or he left one). */
  onSeat(seat: string | null): void {
    window.clearTimeout(this.lingerTimer);
    if (buddyQuip.current && buddyQuip.current.seat !== seat) buddyQuip.clear();
    if (seat === 'hero' && !this.nudged) this.lingerTimer = window.setTimeout(this.linger, LINGER_MS);
  }

  /** Clicked: the next outfit. */
  click(): void {
    const view = buddyHost.view;
    if (!view || this.introPlaying || view.twirling) return;
    this.outfit = (this.outfit + 1) % OUTFITS.length;
    const name = OUTFITS[this.outfit];
    view.setAccessory(name, true);
    this.host.wake();
    // He announces it as he comes back round to face you.
    window.clearTimeout(this.sayTimer);
    this.sayTimer = window.setTimeout(() => this.say(OUTFIT_LINES[name]), 520);
  }

  private say(quip: Quip): void {
    const seat = this.host.activeSeat();
    if (!seat || seat === 'menu') return;
    buddyQuip.say(seat, quip.caption);
    void buddyVoice.playLine(quipLine(quip));
    this.host.wake();
  }

  private linger = () => {
    if (this.host.activeSeat() !== 'hero') return;
    if (this.introPlaying || document.hidden || buddyVoice.isSpeaking || buddyHost.view?.twirling) {
      this.lingerTimer = window.setTimeout(this.linger, 8000);
      return;
    }
    this.nudged = true;
    this.say(quips.ahem);
  };

  // ── away and back ────────────────────────────────────────────

  private onVisibility = () => (document.hidden ? this.onAway() : this.onReturn());

  private onAway = () => {
    if (this.awaySince === null) this.awaySince = performance.now();
  };

  private onReturn = () => {
    if (document.hidden || this.awaySince === null) return;
    const away = performance.now() - this.awaySince;
    this.awaySince = null;
    const view = buddyHost.view;
    if (away < AWAY_MS || !view || this.introPlaying || !this.host.activeSeat()) return;
    // Caught napping: eyes shut for a beat, then wide awake and in denial.
    view.setSleep(1);
    this.host.wake();
    window.clearTimeout(this.wakeTimer);
    this.wakeTimer = window.setTimeout(() => {
      view.setSleep(0);
      this.say(quips.back);
    }, 900);
  };
}
