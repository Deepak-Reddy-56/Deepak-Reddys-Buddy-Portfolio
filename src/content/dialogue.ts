/**
 * Buddy's lines. Short, dry, contextual. Each line has a lead (rendered in
 * ink) and an optional continuation (rendered in grey), which is the hook
 * M2/M3 will use for word-timed reveals.
 */
export type Line = { lead: string; rest?: string };

export const dialogue = {
  hero: { lead: 'Oh, hi. I’m Buddy.', rest: 'I live here. Deepak just visits.' },
  menu: { lead: 'Pick a door.', rest: 'I’ll hold the others.' },
  work: { lead: 'Things he actually built.', rest: 'I checked the repos. Twice.' },
  contact: { lead: 'Ahem.', rest: 'This is the part where you say hello.' },
} satisfies Record<string, Line>;
