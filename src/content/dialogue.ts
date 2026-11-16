/**
 * Buddy's lines. Short, dry, contextual — a guide, not a chatbot. Drafts:
 * refine freely; nothing else needs to change. Each line has a lead (ink) and
 * an optional continuation (grey); seats reveal them word by word on arrival.
 */
export type Line = { lead: string; rest?: string };

export const dialogue = {
  /** Buddy's resting line in the hero's top-right corner (the intro speaks its own lines). */
  hero: { lead: 'He built me with React, TypeScript', rest: 'and a little bit of love. Mostly the first two.' },
  about: { lead: 'Let’s meet the person', rest: 'behind the builds.' },
  work: { lead: 'Right, these are the things', rest: 'he’s been making.' },
  contact: { lead: 'Fancy building', rest: 'something together?' },
  menu: { lead: 'Pick a door.', rest: 'I’ll hold the others.' },
} satisfies Record<string, Line>;

/** The spoken form of the first line (punctuation tuned for speech engines). */
export const spokenIntro = 'Hey, I’m Buddy!';

/** Buddy's expression when he settles at each seat. */
export const seatExpressions: Record<string, 'greeting' | 'curious' | 'happy' | 'listening' | 'thinking'> = {
  hero: 'greeting',
  about: 'curious',
  work: 'happy',
  contact: 'listening',
  menu: 'thinking',
};
