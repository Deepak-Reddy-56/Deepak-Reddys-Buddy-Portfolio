import type { BuddyStatus } from './types';
import type { PaperBuddyView } from './PaperBuddyView';

type Listener = (status: BuddyStatus) => void;

/**
 * The single owner of Buddy's lifecycle. BuddyStage creates the one
 * PaperBuddyView and registers it here; the intro and CSS read from here.
 * `html[data-buddy]` mirrors the status:
 *   loading      the live renderer is starting — the seat stays empty (no stand-in);
 *   live         the Paper body + SVG face are on screen;
 *   unavailable  WebGL/shader failed — the seat stays empty, captions show.
 */
let view: PaperBuddyView | null = null;
let status: BuddyStatus = 'loading';
const listeners = new Set<Listener>();

function publish(next: BuddyStatus): void {
  status = next;
  document.documentElement.dataset.buddy = next;
  listeners.forEach((listener) => listener(next));
}

export const buddyHost = {
  get view(): PaperBuddyView | null {
    return view;
  },
  get status(): BuddyStatus {
    return status;
  },
  attach(next: PaperBuddyView): void {
    view = next;
    publish(next.status);
  },
  detach(previous: PaperBuddyView): void {
    if (view !== previous) return;
    view = null;
    // A remount (React Strict Mode, reduced-motion change) starts again in
    // 'loading': the seat stays empty for that moment; nothing else appears.
    publish('loading');
  },
  report(from: PaperBuddyView, next: BuddyStatus): void {
    if (view === from) publish(next);
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
