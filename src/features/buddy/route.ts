/**
 * Whitespace-aware flight routing (pure; document coordinates, CSS px).
 *
 * Content (text lines, links, buttons, badges, cards) is rasterised into a
 * grid and inflated by Buddy's half-size, so every free cell is a centre where
 * his whole body clears all content. A* finds a route that prefers open
 * corridors (and, on desktop, the open right side); the route is then
 * straightened and its corners rounded without ever leaving free space.
 * When no corridor exists, the leg becomes a "hop" (shrink away, pop in).
 */
export type Rect = { x0: number; y0: number; x1: number; y1: number };
export type Pt = { x: number; y: number };

export type RouteOptions = {
  cell: number;
  /** Buddy half extents (CSS px) used to inflate obstacles, plus a margin. */
  halfW: number;
  halfH: number;
  margin: number;
  /** Extra cost for cells on the left (0 = none): pushes desktop routes into the open right. */
  rightBias: number;
  /**
   * Width (px) of an off-screen band beyond each side edge that a route may pass through.
   * 0 keeps his whole body on screen. Off-screen cells cost more, so visible corridors win.
   */
  offstage?: number;
};

/** `scale` < 1: a restrained route, flown with Buddy tucked in to that fraction of his size. */
export type Leg = { kind: 'route'; pts: Pt[]; cum: number[]; total: number; scale: number } | { kind: 'hop' };

type Grid = { cols: number; rows: number; cell: number; ox: number; inL: number; inR: number; blocked: Uint8Array; dist: Uint8Array };

function buildGrid(obstacles: Rect[], docW: number, docH: number, o: RouteOptions): Grid {
  const band = o.offstage ?? 0;
  const ox = -band; // grid origin (document x of column 0)
  const cols = Math.ceil((docW + 2 * band) / o.cell);
  const rows = Math.ceil(docH / o.cell);
  const blocked = new Uint8Array(cols * rows);
  const ix = (x: number) => Math.max(0, Math.min(cols - 1, Math.floor((x - ox) / o.cell)));
  const iy = (y: number) => Math.max(0, Math.min(rows - 1, Math.floor(y / o.cell)));
  const padX = o.halfW + o.margin;
  const padY = o.halfH + o.margin;
  for (const r of obstacles) {
    for (let y = iy(r.y0 - padY); y <= iy(r.y1 + padY); y++) {
      for (let x = ix(r.x0 - padX); x <= ix(r.x1 + padX); x++) blocked[y * cols + x] = 1;
    }
  }
  // Without an off-screen band, keep the whole body inside the viewport width.
  if (!band) {
    const edge = Math.ceil(padX / o.cell);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < Math.min(edge, cols); x++) blocked[y * cols + x] = 1;
      for (let x = Math.max(0, cols - edge); x < cols; x++) blocked[y * cols + x] = 1;
    }
  }
  // Columns whose centres keep his body fully on screen (off-screen cells cost extra).
  const inL = Math.ceil((padX - ox) / o.cell);
  const inR = Math.floor((docW - padX - ox) / o.cell) - 1;
  // Distance (in cells, capped) to the nearest blocked cell: routes prefer corridor centres.
  const dist = new Uint8Array(cols * rows).fill(255);
  const queue: number[] = [];
  blocked.forEach((b, i) => {
    if (b) {
      dist[i] = 0;
      queue.push(i);
    }
  });
  for (let h = 0; h < queue.length; h++) {
    const i = queue[h];
    const d = dist[i];
    if (d >= 8) continue;
    const x = i % cols;
    const y = (i - x) / cols;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const j = ny * cols + nx;
      if (dist[j] > d + 1) {
        dist[j] = d + 1;
        queue.push(j);
      }
    }
  }
  return { cols, rows, cell: o.cell, ox, inL, inR, blocked, dist };
}

const free = (g: Grid, x: number, y: number) => x >= 0 && y >= 0 && x < g.cols && y < g.rows && !g.blocked[y * g.cols + x];

function nearestFree(g: Grid, cx: number, cy: number): [number, number] | null {
  for (let r = 0; r <= 12; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (free(g, cx + dx, cy + dy)) return [cx + dx, cy + dy];
  }
  return null;
}

function astar(g: Grid, s: [number, number], t: [number, number], rightBias: number): [number, number][] | null {
  const n = g.cols * g.rows;
  const gScore = new Float32Array(n).fill(Infinity);
  const came = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const open: { i: number; f: number }[] = [];
  const push = (i: number, f: number) => {
    open.push({ i, f });
    let k = open.length - 1;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (open[p].f <= open[k].f) break;
      [open[p], open[k]] = [open[k], open[p]];
      k = p;
    }
  };
  const pop = () => {
    const top = open[0];
    const last = open.pop()!;
    if (open.length) {
      open[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < open.length && open[l].f < open[m].f) m = l;
        if (r < open.length && open[r].f < open[m].f) m = r;
        if (m === k) break;
        [open[m], open[k]] = [open[k], open[m]];
        k = m;
      }
    }
    return top;
  };
  const si = s[1] * g.cols + s[0];
  const ti = t[1] * g.cols + t[0];
  const h = (i: number) => Math.hypot((i % g.cols) - t[0], Math.floor(i / g.cols) - t[1]);
  gScore[si] = 0;
  push(si, h(si));
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  while (open.length) {
    const { i } = pop();
    if (closed[i]) continue; // stale heap entry
    closed[i] = 1;
    if (i === ti) break;
    const x = i % g.cols;
    const y = (i - x) / g.cols;
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (!free(g, nx, ny)) continue;
      if (dx && dy && (!free(g, x + dx, y) || !free(g, x, y + dy))) continue; // no corner cutting
      const j = ny * g.cols + nx;
      if (closed[j]) continue;
      const proximity = Math.max(0, (4 - g.dist[j]) / 4); // 1 next to content, 0 in open space
      const bias = rightBias * (1 - nx / g.cols);
      const offscreen = nx < g.inL || nx > g.inR ? 2 : 0; // prefer staying visible
      const step = Math.hypot(dx, dy) * (1 + 3 * proximity + bias + offscreen);
      const cand = gScore[i] + step;
      if (cand < gScore[j]) {
        gScore[j] = cand;
        came[j] = i;
        push(j, cand + h(j));
      }
    }
  }
  if (!Number.isFinite(gScore[ti])) return null;
  const path: [number, number][] = [];
  for (let i = ti; i !== -1; i = came[i]) path.push([i % g.cols, Math.floor(i / g.cols)]);
  return path.reverse();
}

/** True if the straight segment a→b stays in free cells. */
function clear(g: Grid, a: Pt, b: Pt): boolean {
  const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (g.cell * 0.5)) + 1;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    if (!free(g, Math.floor((a.x + (b.x - a.x) * t - g.ox) / g.cell), Math.floor((a.y + (b.y - a.y) * t) / g.cell))) return false;
  }
  return true;
}

/** String-pull, then round each corner with a quadratic curve that stays clear. */
function smooth(g: Grid, raw: Pt[]): Pt[] {
  const pulled: Pt[] = [raw[0]];
  let anchor = 0;
  for (let i = 2; i < raw.length; i++) {
    if (!clear(g, raw[anchor], raw[i])) {
      pulled.push(raw[i - 1]);
      anchor = i - 1;
    }
  }
  pulled.push(raw[raw.length - 1]);

  const out: Pt[] = [pulled[0]];
  for (let i = 1; i < pulled.length - 1; i++) {
    const p0 = out[out.length - 1];
    const p1 = pulled[i];
    const p2 = pulled[i + 1];
    let r = Math.min(140, Math.hypot(p1.x - p0.x, p1.y - p0.y) / 2, Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2);
    let curve: Pt[] | null = null;
    while (r > 4 && !curve) {
      const a = towards(p1, p0, r);
      const b = towards(p1, p2, r);
      const pts: Pt[] = [];
      for (let s = 0; s <= 8; s++) {
        const t = s / 8;
        const u = 1 - t;
        pts.push({ x: u * u * a.x + 2 * u * t * p1.x + t * t * b.x, y: u * u * a.y + 2 * u * t * p1.y + t * t * b.y });
      }
      const ok = pts.every((p, k) => k === 0 || clear(g, pts[k - 1], p)) && clear(g, p0, a);
      if (ok) curve = pts;
      else r *= 0.6;
    }
    out.push(...(curve ?? [p1]));
  }
  out.push(pulled[pulled.length - 1]);
  return out;
}

function towards(from: Pt, to: Pt, d: number): Pt {
  const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return { x: from.x + ((to.x - from.x) / len) * d, y: from.y + ((to.y - from.y) / len) * d };
}

/** Plan the leg from seat a to seat b (document coordinates). */
export function planLeg(a: Pt, b: Pt, obstacles: Rect[], docW: number, docH: number, o: RouteOptions): Leg {
  const g = buildGrid(obstacles, docW, docH, o);
  const cellOf = (p: Pt): [number, number] => [Math.floor((p.x - g.ox) / o.cell), Math.floor(p.y / o.cell)];
  const s = free(g, ...cellOf(a)) ? cellOf(a) : nearestFree(g, ...cellOf(a));
  const t = free(g, ...cellOf(b)) ? cellOf(b) : nearestFree(g, ...cellOf(b));
  if (!s || !t) return { kind: 'hop' };
  const cells = astar(g, s, t, o.rightBias);
  if (!cells) return { kind: 'hop' };
  const centre = ([x, y]: [number, number]): Pt => ({ x: g.ox + (x + 0.5) * o.cell, y: (y + 0.5) * o.cell });
  const raw = [a, ...cells.map(centre), b];
  const pts = smooth(g, raw);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { kind: 'route', pts, cum, total: cum[cum.length - 1], scale: 1 };
}

/**
 * Re-time a leg so its duration is spent where he can be seen: stretches that are off screen
 * both when the leg starts and when it ends (behind the top edge, past a side edge) are
 * flown at `hiddenWeight` of their length. Purely a re-parametrisation: the path is unchanged.
 */
export function retime(leg: Extract<Leg, { kind: 'route' }>, visible: (p: Pt) => boolean, hiddenWeight = 0.15): Extract<Leg, { kind: 'route' }> {
  const cum = [0];
  for (let i = 1; i < leg.pts.length; i++) {
    const a = leg.pts[i - 1];
    const b = leg.pts[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    // sample the segment (long straight runs can be partly visible)
    const n = Math.max(1, Math.ceil(len / 40));
    let w = 0;
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n;
      w += (visible({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }) ? 1 : hiddenWeight) / n;
    }
    cum.push(cum[i - 1] + len * w);
  }
  return { ...leg, cum, total: cum[cum.length - 1] };
}

/** Point at (visibility-weighted) arc-length fraction f ∈ [0, 1] along a routed leg. */
export function pointOnLeg(leg: Extract<Leg, { kind: 'route' }>, f: number): Pt {
  const d = Math.max(0, Math.min(1, f)) * leg.total;
  let i = 1;
  while (i < leg.cum.length - 1 && leg.cum[i] < d) i++;
  const span = leg.cum[i] - leg.cum[i - 1] || 1;
  const t = (d - leg.cum[i - 1]) / span;
  const p = leg.pts[i - 1];
  const q = leg.pts[i];
  return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
}

/**
 * Readable content in document coordinates: every text line box plus links,
 * buttons, list items/cards and badges. Buddy's seats (slot + caption) are excluded:
 * a caption is hidden while he is away and only revealed once he has landed.
 */
export function collectObstacles(root: ParentNode = document): Rect[] {
  const rects: Rect[] = [];
  const sx = window.scrollX;
  const sy = window.scrollY;
  const add = (r: DOMRect) => {
    if (r.width > 0 && r.height > 0) rects.push({ x0: r.left + sx, y0: r.top + sy, x1: r.right + sx, y1: r.bottom + sy });
  };
  for (const scope of root.querySelectorAll('main, footer')) {
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) =>
        node.textContent?.trim() && !node.parentElement?.closest('[data-buddy-seat], .visually-hidden')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    });
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) add(r);
    }
    scope.querySelectorAll('a, button, li, dl, [class*="context"], [class*="status"], [class*="monogram"]').forEach((el) => {
      if (!el.closest('[data-buddy-seat]')) add(el.getBoundingClientRect());
    });
  }
  return rects;
}
