/**
 * Buddy's journey, as pure functions of scroll position.
 *
 * Seats are DOM-measured centres in document space. The journey parameter
 * J ∈ [0, n-1] is a continuous function of scroll:
 *   J = k        → seated at seat k (he moves with the page, glued to his seat)
 *   J ∈ (k, k+1) → flying from seat k to seat k+1
 * He arrives at seat k+1 exactly when it reaches the "arrival line" (a fixed
 * fraction of the viewport), and leaves seat k only when that flight must start.
 * Because J depends only on scroll, scrolling back reverses the same flight.
 * The path of each flight is planned around the content (route.ts).
 */
export type Seat = { id: string; x: number; y: number; size: number };

export type FlightConfig = {
  /** Viewport fraction where a seat is when Buddy lands on it. */
  arriveAt: number;
  /** Scroll distance (in viewport heights) a flight takes. */
  legLength: number;
  /** Routing grid cell (px), clearance margin (px) and preference for the open right side. */
  cell: number;
  margin: number;
  rightBias: number;
  /** Max journey speed when catching up (legs per second). */
  maxLegsPerSecond: number;
};

export const desktopFlight: FlightConfig = { arriveAt: 0.36, legLength: 0.7, cell: 16, margin: 14, rightBias: 0.35, maxLegsPerSecond: 2.4 };
export const laptopFlight: FlightConfig = { arriveAt: 0.36, legLength: 0.7, cell: 16, margin: 12, rightBias: 0.1, maxLegsPerSecond: 2.4 };
export const mobileFlight: FlightConfig = { arriveAt: 0.3, legLength: 0.55, cell: 12, margin: 8, rightBias: 0.6, maxLegsPerSecond: 2 };

export type Journey = { arrive: number[]; depart: number[] };

/** Scroll positions where Buddy arrives at / departs from each seat. */
export function planJourney(seats: Seat[], viewportH: number, maxScroll: number, cfg: FlightConfig): Journey {
  const arrive: number[] = [];
  seats.forEach((seat, k) => {
    const natural = k === 0 ? 0 : seat.y - viewportH * cfg.arriveAt;
    const prev = k === 0 ? -Infinity : arrive[k - 1] + 1;
    arrive.push(Math.min(Math.max(natural, prev, 0), Math.max(maxScroll, prev)));
  });
  const leg = viewportH * cfg.legLength;
  const depart = arrive.map((a, k) => (k + 1 < arrive.length ? Math.max(a, arrive[k + 1] - leg) : a));
  return { arrive, depart };
}

export function journeyAt(scroll: number, j: Journey): number {
  const { arrive, depart } = j;
  const last = arrive.length - 1;
  if (last <= 0 || scroll <= depart[0]) return 0;
  for (let k = 0; k < last; k++) {
    if (scroll < depart[k]) return k;
    if (scroll < arrive[k + 1]) return k + (scroll - depart[k]) / (arrive[k + 1] - depart[k]);
  }
  return last;
}

export type Point = { x: number; y: number; size: number };

/** Seat k's centre in viewport coordinates at this scroll. */
export function seatInViewport(seat: Seat, scrollX: number, scrollY: number): Point {
  return { x: seat.x - scrollX, y: seat.y - scrollY, size: seat.size };
}
