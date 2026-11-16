import { buddyLines, type BuddyLine } from '../../content/buddyLines';

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
