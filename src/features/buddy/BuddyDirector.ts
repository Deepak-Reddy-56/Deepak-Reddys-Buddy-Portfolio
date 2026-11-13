import { seatExpressions } from '../../content/dialogue';
import { FrameLoop } from '../../lib/frameLoop';
import { buddyVoice } from '../../lib/voice/voice';
import type { ExpressionName } from './expressions';
import {
  desktopFlight,
  journeyAt,
  laptopFlight,
  mobileFlight,
  planJourney,
  seatInViewport,
  type FlightConfig,
  type Journey,
  type Point,
  type Seat,
} from './flight';
import { collectObstacles, planLeg, pointOnLeg, retime, type Leg } from './route';
import type { BuddyPose } from './three/buddyModel';

/** What the director needs from a renderer (three.js today; swappable). */
export interface BuddyView {
  resize(width: number, height: number): void;
  place(x: number, y: number, size: number): void;
  update(dt: number, pose: BuddyPose, talk: number): boolean;
  render(): void;
  readonly model: {
    setExpression(name: ExpressionName): void;
    setGaze(x: number, y: number): void;
    setBlink(amount: number): void;
  };
}

/** Flight into / out of the menu sheet: a critically damped spring in screen space. */
type MenuFlight = { target: 'menu' | 'page'; v: { x: number; y: number; s: number } };

const SEAT_SELECTOR = '[data-buddy-seat]';
const SCROLL_SETTLE_MS = 180;
const IDLE_BOB_MS = 6000;
const VISIBLE_SCALES = [1, 0.8, 0.7];
const EDGE_SCALE = 0.8;
const ARRIVE_TOLERANCE = 0.003; // legs
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeSine = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);

/**
 * The one clock for Buddy after the intro: scroll → journey → routed flight →
 * pose → face → dialogue → render, all inside a single FrameLoop tick.
 * Sleeps when nothing changes; scroll, resize, pointer, menu or a blink wakes it.
 */
export class BuddyDirector {
  private readonly loop: FrameLoop;
  private seats: Seat[] = [];
  private legs: Leg[] = [];
  private seatEls = new Map<string, HTMLElement>();
  private journey: Journey = { arrive: [0], depart: [0] };
  private cfg: FlightConfig = desktopFlight;
  private viewport = { w: 0, h: 0 };
  private controlsBottom = 0;

  private J = 0; // journey value Buddy is actually at (follows the scroll's J with a speed limit)
  private jv = 0; // its velocity (legs / s)
  private menuFlight: MenuFlight | null = null;
  private menuOpen = false;
  private wasMenuOpen = false;
  private pos: Point = { x: 0, y: 0, size: 0 };
  private vel = { x: 0, y: 0 };
  private rawVel = { x: 0, y: 0, s: 0 };
  private pose: BuddyPose = { bank: 0, pitch: 0, yaw: 0, stretch: 1, bob: 0, flying: 0 };
  private flyingPrev = 0;
  private landedAt = -1e9;
  private lastScrollAt = 0;
  private lastWake = 0;
  private activeSeat: string | null = null;
  private arrivedAt = 0;
  private nextBlinkAt = 2.5; // seconds, director clock
  private blinkStart = -1;
  private pointer: { x: number; y: number; at: number } | null = null;
  private dormant: boolean;
  private time = 0;
  /** The director's clock (ms) — the FrameLoop's time, used for every internal timer. */
  private clock = 0;
  private renders = 0;
  private awakeBecause = '';
  private wakeTimer = 0;
  private measureTimer = 0;
  private readonly resizeObserver: ResizeObserver;
  private readonly mutationObserver: MutationObserver;
  private readonly hoverCapable = window.matchMedia('(hover: hover)').matches;

  constructor(private readonly view: BuddyView) {
    this.loop = new FrameLoop((t, dt) => this.tick(t, dt));
    this.dormant = this.introPlaying();
    this.measure();
    this.J = journeyAt(window.scrollY, this.journey);
    this.pos = this.journeyPosition(this.J);

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(document.body);
    this.mutationObserver = new MutationObserver(() => {
      this.dormant = this.introPlaying();
      this.wake();
    });
    this.mutationObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-intro'] });
    void document.fonts?.ready.then(() => this.onResize());
    this.wake();
  }

  setMenuOpen(open: boolean): void {
    this.menuOpen = open;
    this.wake();
  }

  dispose(): void {
    this.loop.dispose();
    window.clearTimeout(this.wakeTimer);
    window.clearTimeout(this.measureTimer);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointer);
    this.resizeObserver.disconnect();
    this.mutationObserver.disconnect();
    this.seatEls.forEach((el) => el.removeAttribute('data-buddy-active'));
  }

  /** Debug/QA snapshot. */
  snapshot() {
    const seat = this.activeSeat ? this.seats.find((s) => s.id === this.activeSeat) : undefined;
    return {
      J: this.J,
      renders: this.renders,
      awake: this.awakeBecause,
      pos: { ...this.pos },
      activeSeat: this.activeSeat,
      catchUp: !!this.menuFlight,
      talk: buddyVoice.talk(performance.now()),
      speaking: buddyVoice.isSpeaking,
      legs: this.legs.map((l) => (l.kind === 'route' ? { kind: l.kind, scale: l.scale, points: l.pts.length, length: Math.round(l.total) } : { kind: l.kind })),
      seat: seat ? { x: seat.x - window.scrollX, y: seat.y - window.scrollY, size: seat.size } : null,
    };
  }

  // ── events ───────────────────────────────────────────────────

  private onScroll = () => {
    this.lastScrollAt = this.clock;
    this.wake();
  };

  /** Layout changed: re-measure (debounced — routing scans the page). */
  private onResize = () => {
    window.clearTimeout(this.measureTimer);
    this.measureTimer = window.setTimeout(() => {
      this.measure();
      this.wake();
    }, 120);
  };

  private onPointer = (event: PointerEvent) => {
    if (!this.hoverCapable || event.pointerType !== 'mouse') return;
    this.pointer = { x: event.clientX, y: event.clientY, at: this.clock };
    this.wake();
  };

  private introPlaying(): boolean {
    const state = document.documentElement.dataset.intro;
    return state === 'playing' || state === 'leaving';
  }

  private wake(): void {
    this.lastWake = this.clock;
    this.loop.start();
  }

  // ── layout & routes ──────────────────────────────────────────

  private measure(): void {
    this.viewport = { w: window.innerWidth, h: window.innerHeight };
    this.view.resize(this.viewport.w, this.viewport.h);
    this.cfg = this.viewport.w < 760 ? mobileFlight : this.viewport.w < 1200 ? laptopFlight : desktopFlight;
    this.seats = [];
    this.seatEls.clear();
    document.querySelectorAll<HTMLElement>(SEAT_SELECTOR).forEach((el) => {
      const id = el.dataset.buddySeat!;
      this.seatEls.set(id, el);
      if (id === 'menu') return;
      const slot = el.querySelector<HTMLElement>('[data-buddy-slot]');
      if (!slot) return;
      const r = slot.getBoundingClientRect();
      this.seats.push({ id, x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY, size: r.width });
    });
    this.seats.sort((a, b) => a.y - b.y);
    const docW = document.documentElement.clientWidth;
    const docH = document.documentElement.scrollHeight;
    const maxScroll = Math.max(0, docH - window.innerHeight);
    this.journey = planJourney(this.seats, this.viewport.h, maxScroll, this.cfg);

    // Plan every flight around the content (inflated by the arriving seat's size).
    const obstacles = collectObstacles();
    // Fixed chrome: the chapter rail is a fixed column, so its whole column is closed to flights.
    const rail = document.querySelector<HTMLElement>('nav[aria-label="Chapters"]')?.getBoundingClientRect();
    if (rail && rail.width > 0) obstacles.push({ x0: rail.left, x1: rail.right, y0: 0, y1: docH });
    // The top controls are fixed too; flights keep below them (see journeyPosition).
    const controls = document.querySelector<HTMLElement>('nav[aria-label="Site controls"]')?.getBoundingClientRect();
    this.controlsBottom = controls && controls.height > 0 ? controls.bottom : 0;
    this.legs = this.seats.slice(0, -1).map((a, k) => {
      const b = this.seats[k + 1];
      // Where the viewport is when this leg starts and when it ends (scroll is linear in between).
      const views = [this.journey.depart[k], this.journey.arrive[k + 1]];
      const plan = (scale: number, offstage: number): Leg => {
        const size = b.size * scale;
        const opts = { cell: this.cfg.cell, halfW: size * 0.5, halfH: size * 0.44, margin: this.cfg.margin * scale, rightBias: this.cfg.rightBias, offstage };
        const leg = planLeg(a, b, obstacles, docW, docH, opts);
        if (leg.kind !== 'route') return leg;
        const half = size / 2;
        const visible = (p: { x: number; y: number }) =>
          p.x > -half && p.x < docW + half && views.some((sy) => p.y - sy > -half && p.y - sy < this.viewport.h + half);
        return { ...retime(leg, visible), scale };
      };
      // 1. A fully visible route, at full size or gently scaled (never below 70 %).
      for (const scale of VISIBLE_SCALES) {
        const leg = plan(scale, 0);
        if (leg.kind === 'route') return leg;
      }
      // 2. Where the text spans the whole width, the screen edge is the corridor: he arcs out past
      //    the side and back in further down — continuous, scroll-linked, never through content.
      const edgeLeg = plan(EDGE_SCALE, b.size * EDGE_SCALE + 40);
      if (edgeLeg.kind === 'route') return edgeLeg;
      return { kind: 'hop' }; // last resort (no layout of this site currently needs it)
    });
  }

  private seatElement(id: string): HTMLElement | null {
    const known = this.seatEls.get(id);
    return known?.isConnected ? known : document.querySelector<HTMLElement>(`[data-buddy-seat="${id}"]`);
  }

  /** The menu seat only exists while the menu is open, so it is looked up live. */
  private menuSeat(): Point | null {
    const slot = this.seatElement('menu')?.querySelector<HTMLElement>('[data-buddy-slot]');
    if (!slot) return null;
    const r = slot.getBoundingClientRect();
    if (!r.width) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.width };
  }

  /** Buddy's viewport position for journey value J (routed flight or hop). */
  private journeyPosition(J: number): Point & { u: number; hop: boolean } {
    if (!this.seats.length) return { ...this.pos, u: 0, hop: false };
    const k = Math.min(Math.floor(J), this.seats.length - 1);
    const u = J - k;
    const sx = window.scrollX;
    const sy = window.scrollY;
    const a = seatInViewport(this.seats[k], sx, sy);
    if (u <= 0 || k + 1 >= this.seats.length) return { ...a, u: 0, hop: false };
    const b = seatInViewport(this.seats[k + 1], sx, sy);
    const leg = this.legs[k];
    if (!leg || leg.kind === 'hop') {
      // No clear corridor: shrink away at this seat, pop in at the next (never crosses content).
      const out = 1 - smoothstep(0, 0.5, u);
      const inn = smoothstep(0.5, 1, u);
      return u < 0.5
        ? { x: a.x, y: a.y - 12 * (1 - out), size: Math.max(0.001, a.size * out), u, hop: true }
        : { x: b.x, y: b.y - 12 * (1 - inn), size: Math.max(0.001, b.size * inn), u, hop: true };
    }
    const p = pointOnLeg(leg, easeSine(u));
    // Shrink early / grow late, so a big hero Buddy only exists near the hero.
    const sizeT = this.seats[k].size > this.seats[k + 1].size ? smoothstep(0, 0.3, u) : smoothstep(0.7, 1, u);
    // A restrained route is flown tucked in: shrink as he leaves the seat, open up as he lands.
    const tuck = 1 - (1 - leg.scale) * smoothstep(0, 0.12, u) * (1 - smoothstep(0.88, 1, u));
    const size = (a.size + (b.size - a.size) * sizeT) * tuck;
    // In flight, never pass under the fixed top controls (eased in/out so leaving a seat never jumps).
    let y = p.y - sy;
    const minY = this.controlsBottom + 10 + size * 0.44;
    if (this.controlsBottom && y < minY) {
      // Fades with distance, so a Buddy far above (lagging behind a flick) still scrolls away
      // instead of being pinned under the controls — and nothing ever switches on or off abruptly.
      const reach = 1 - smoothstep(size * 0.6, size * 1.8, minY - y);
      const w = smoothstep(0, 0.05, u) * (1 - smoothstep(0.95, 1, u)) * reach;
      y += (minY - y) * w;
    }
    return { x: p.x - sx, y, size, u, hop: false };
  }

  // ── the tick ─────────────────────────────────────────────────

  private tick(t: number, dtMs: number): void {
    this.clock = t;
    const now = t;
    const dt = Math.max(dtMs, 1) / 1000;
    this.time += dt;
    if (!this.seats.length) this.measure();
    if (!this.seats.length) {
      this.loop.stop();
      return;
    }

    // 1. Journey: follow the scroll's J, but never faster than a flight can be flown
    //    (a flick makes him race along his routes rather than jump).
    // Within ~2 px of an arrival line counts as arrived (scroll positions are fractional).
    const rawJ = journeyAt(window.scrollY, this.journey);
    const targetJ = Math.abs(rawJ - Math.round(rawJ)) < ARRIVE_TOLERANCE ? Math.round(rawJ) : rawJ;
    // Exact critically damped step (stable at any frame time), then the speed limit.
    const omega = 16;
    const x = this.J - targetJ;
    const e = Math.exp(-omega * dt);
    const c = (this.jv + omega * x) * dt;
    const jv = clamp((this.jv - omega * c) * e, -this.cfg.maxLegsPerSecond, this.cfg.maxLegsPerSecond);
    const nextX = (x + c) * e;
    // Never move faster than the limit, and never overshoot the scroll's J.
    const limited = clamp(nextX - x, -this.cfg.maxLegsPerSecond * dt, this.cfg.maxLegsPerSecond * dt);
    this.J = x !== 0 && Math.sign(x + limited) !== Math.sign(x) ? targetJ : this.J + limited;
    this.jv = jv;
    if (Math.abs(targetJ - this.J) < 0.002 && Math.abs(this.jv) < 0.05) {
      this.J = targetJ;
      this.jv = 0;
    }
    const journey = this.journeyPosition(this.J);

    // 2. Menu: fly into the sheet's seat (and back) with a screen-space spring.
    const menuSeat = this.menuOpen ? this.menuSeat() : null;
    const wantMenu = this.menuOpen && menuSeat !== null;
    if (wantMenu !== this.wasMenuOpen) this.menuFlight = { target: wantMenu ? 'menu' : 'page', v: { ...this.rawVel } };
    this.wasMenuOpen = wantMenu;

    let next: Point;
    let flying: number;
    if (this.menuFlight) {
      const live = this.menuFlight.target === 'menu' && menuSeat ? menuSeat : journey;
      const v = this.menuFlight.v;
      const w = 10;
      const step = (x: number, to: number, vel: number) => vel + (w * w * (to - x) - 2 * w * vel) * dt;
      v.x = step(this.pos.x, live.x, v.x);
      v.y = step(this.pos.y, live.y, v.y);
      v.s = step(this.pos.size, live.size, v.s);
      next = { x: this.pos.x + v.x * dt, y: this.pos.y + v.y * dt, size: this.pos.size + v.s * dt };
      const sp = Math.hypot(v.x, v.y);
      flying = clamp(sp / 500, 0, 1);
      if (Math.hypot(live.x - next.x, live.y - next.y) < 1.5 && Math.abs(live.size - next.size) < 1 && sp < 60) {
        next = live;
        this.menuFlight = null;
        flying = 0;
      }
    } else if (wantMenu && menuSeat) {
      next = menuSeat;
      flying = 0;
    } else {
      next = journey;
      flying = journey.hop ? 0.4 * Math.sin(Math.PI * journey.u) : Math.sin(Math.PI * journey.u);
    }

    // 3. Motion → body language (only flight tilts him; riding with the page doesn't).
    const vx = (next.x - this.pos.x) / dt;
    const vy = (next.y - this.pos.y) / dt;
    this.rawVel = { x: vx, y: vy, s: (next.size - this.pos.size) / dt };
    const motionWeight = Math.max(flying, this.menuFlight ? 1 : 0);
    const kv = 1 - Math.exp(-dt / 0.1);
    this.vel.x += (vx * motionWeight - this.vel.x) * kv;
    this.vel.y += (vy * motionWeight - this.vel.y) * kv;
    this.pos = next;

    const desktop = this.cfg !== mobileFlight;
    const bankMax = desktop ? 0.45 : 0.25;
    const legU = this.menuFlight || wantMenu ? 0 : journey.u;
    const anticipation = !journey.hop && legU > 0 && legU < 0.12 ? Math.sin((legU / 0.12) * Math.PI) * 0.05 : 0;
    if (this.flyingPrev > 0.05 && flying < 0.01) this.landedAt = now;
    this.flyingPrev = flying;
    const landAge = (now - this.landedAt) / 1000;
    const landing = landAge < 0.7 ? -0.07 * Math.exp(-landAge * 6) * Math.cos(landAge * 16) : 0;
    const speed = Math.hypot(this.vel.x, this.vel.y);
    const seated = flying < 0.01 && !this.menuFlight && (legU === 0 || wantMenu);
    const idleAge = now - Math.max(this.lastScrollAt, this.arrivedAt, this.pointer?.at ?? 0);
    const bobAmp = seated ? 0.022 * clamp(1 - (idleAge - IDLE_BOB_MS) / 1500, 0, 1) : 0;

    this.pose = {
      bank: clamp(-this.vel.x * 0.0007, -bankMax, bankMax),
      pitch: clamp(this.vel.y * 0.00035, -0.3, 0.3),
      yaw: clamp(this.vel.x * 0.0004, -0.35, 0.35),
      stretch: 1 + clamp(speed * 0.00004, 0, 0.06) - anticipation + landing,
      bob: bobAmp * Math.sin(this.time * 1.7),
      flying,
    };

    // 4. Dialogue + expression: only when he has landed and the visitor has paused.
    let seatId: string | null = null;
    if (wantMenu && !this.menuFlight) seatId = 'menu';
    else if (seated && now - this.lastScrollAt > SCROLL_SETTLE_MS) {
      const k = Math.round(this.J);
      if (Math.abs(this.J - k) < 0.002) seatId = this.seats[k]?.id ?? null;
    }
    if (this.dormant && document.documentElement.dataset.intro === 'leaving') seatId = this.seats[0]?.id ?? null;
    if (!seated && !wantMenu) seatId = null;
    if (seatId !== this.activeSeat) this.activate(seatId, now);

    // 5. Face: gaze, blink, expression.
    this.updateGaze(now, seated, flying);
    this.updateBlink();
    this.view.model.setExpression(this.menuFlight || flying > 0.15 ? 'flying' : this.expressionFor(this.activeSeat));

    // 6. Draw (unless the intro is still on screen).
    const talk = buddyVoice.talk(performance.now()); // speech runs on wall time
    const easing = this.view.update(dt, this.pose, talk);
    this.view.place(this.pos.x, this.pos.y, this.pos.size);
    if (!this.dormant) {
      this.view.render();
      this.renders++;
    }

    // 7. Sleep when nothing is changing.
    const reasons: [string, boolean][] = [
      ['menuFlight', !this.dormant && !!this.menuFlight],
      ['journey', Math.abs(targetJ - this.J) > 1e-4 || this.jv !== 0],
      ['flying', flying > 0],
      ['landing', landAge < 0.7],
      ['blink', this.blinkStart >= 0],
      ['bob', bobAmp > 0.0005],
      ['speaking', buddyVoice.isSpeaking],
      ['expression', easing],
      ['velocity', Math.abs(this.vel.x) + Math.abs(this.vel.y) > 2],
      ['woken', now - this.lastWake < 150],
    ];
    this.awakeBecause = reasons.filter(([, on]) => on).map(([name]) => name).join(',');
    if (this.awakeBecause === '' || this.dormant) {
      this.loop.stop();
      window.clearTimeout(this.wakeTimer);
      // Wake for the next blink (alive without rendering every frame).
      this.wakeTimer = window.setTimeout(() => this.wake(), Math.max(200, (this.nextBlinkAt - this.time) * 1000));
    }
  }

  private activate(seatId: string | null, now: number): void {
    if (this.activeSeat) this.seatElement(this.activeSeat)?.removeAttribute('data-buddy-active');
    this.activeSeat = seatId;
    if (seatId) {
      this.seatElement(seatId)?.setAttribute('data-buddy-active', '');
      this.arrivedAt = now;
    }
  }

  private expressionFor(seatId: string | null): ExpressionName {
    return (seatId && seatExpressions[seatId]) || 'idle';
  }

  private updateGaze(now: number, seated: boolean, flying: number): void {
    if (!seated || flying > 0.05) {
      const sp = Math.hypot(this.vel.x, this.vel.y) || 1;
      this.view.model.setGaze((this.vel.x / sp) * 0.9, (-this.vel.y / sp) * 0.7); // look where he's going
      return;
    }
    const sinceArrival = now - this.arrivedAt;
    if (this.activeSeat && this.activeSeat !== 'menu' && this.activeSeat !== this.seats[0]?.id && sinceArrival < 1100) {
      this.view.model.setGaze(0.85, -0.1); // glance at the line he's introducing (to his right)
      return;
    }
    if (this.pointer && now - this.pointer.at < 4000) {
      const dx = (this.pointer.x - this.pos.x) / (this.viewport.w * 0.5);
      const dy = (this.pos.y - this.pointer.y) / (this.viewport.h * 0.5);
      this.view.model.setGaze(dx, dy);
      return;
    }
    this.view.model.setGaze(0, 0); // at the visitor
  }

  private updateBlink(): void {
    if (this.blinkStart < 0 && this.time >= this.nextBlinkAt) this.blinkStart = this.time;
    if (this.blinkStart >= 0) {
      const p = (this.time - this.blinkStart) / 0.16;
      if (p >= 1) {
        this.blinkStart = -1;
        this.view.model.setBlink(0);
        // Natural rhythm: 2.5–6 s, sometimes a quick double blink.
        this.nextBlinkAt = this.time + (Math.random() < 0.18 ? 0.22 : 2.5 + Math.random() * 3.5);
      } else {
        this.view.model.setBlink(Math.sin(Math.PI * p));
      }
    }
  }
}
