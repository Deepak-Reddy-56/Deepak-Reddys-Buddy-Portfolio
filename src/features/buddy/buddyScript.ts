import { buddyLines, type BuddyLine } from '../../content/buddyLines';
import type { Quip } from '../../content/buddyQuips';

/** One of Buddy's lines by id (generated from scripts/buddy-lines.json). */
export function line(id: string): BuddyLine {
  const found = buddyLines[id];
  if (!found) throw new Error('Unknown Buddy line: ' + id);
  return found;
}

/**
 * A random line from a group ("self" jokes, "deepak" jokes…), never the one
 * this visitor heard last time — so the jokes change from visit to visit.
 */
export function pickLine(group: string): BuddyLine {
  const pool = Object.values(buddyLines).filter((l) => l.group === group);
  if (!pool.length) throw new Error('No Buddy lines in group: ' + group);
  const key = 'buddy:last-line:' + group;
  let last: string | null = null;
  try {
    last = window.localStorage.getItem(key);
  } catch {
    /* storage unavailable */
  }
  const choices = pool.length > 1 ? pool.filter((l) => l.id !== last) : pool;
  const chosen = choices[Math.floor(Math.random() * choices.length)];
  try {
    window.localStorage.setItem(key, chosen.id);
  } catch {
    /* storage unavailable */
  }
  return chosen;
}

/**
 * A situational line: its recording if one has been generated, otherwise a
 * silent synthetic timeline (a loudness envelope shaped from the words and
 * punctuation) so the caption and mouth still move together.
 */
export function quipLine(quip: Quip): BuddyLine {
  const recorded = buddyLines[quip.id];
  if (recorded) return recorded;
  const FPS = 60;
  const env: number[] = [];
  const silence = (s: number) => {
    for (let i = 0; i < Math.round(s * FPS); i++) env.push(0);
  };
  silence(0.05);
  const words = quip.text.split(/\s+/);
  words.forEach((word, wi) => {
    const letters = word.replace(/[^a-z]/gi, '').length || 1;
    const syllables = Math.max(1, (word.toLowerCase().match(/[aeiouy]+/g) ?? []).length);
    const frames = Math.round((0.11 + 0.042 * letters) * FPS); // an unhurried, easy-to-follow pace
    for (let i = 0; i < frames; i++) {
      const x = (i / frames) * syllables;
      env.push(Number((0.35 + 0.65 * Math.abs(Math.sin(Math.PI * x))).toFixed(2)));
    }
    if (wi < words.length - 1) {
      if (/[.!?…]["”’)]*$/.test(word)) silence(0.3);
      else if (/[,;:—–]$/.test(word)) silence(0.14);
      else env.push(0.12);
    }
  });
  silence(0.1);
  return { id: quip.id, group: 'quip', text: quip.text, caption: quip.caption, src: '', duration: env.length / FPS, envelope: env };
}
