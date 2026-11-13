/**
 * Buddy's lines. Short, dry, contextual — a guide, not a chatbot. Drafts:
 * refine freely; nothing else needs to change. Each line has a lead (ink) and
 * an optional continuation (grey); seats reveal them word by word on arrival.
 */
export type Line = { lead: string; rest?: string };

export const dialogue = {
  /** First appearance — also spoken aloud at the end of the intro. */
  hero: { lead: 'Hey, I’m Buddy!' },
  about: { lead: 'Let’s meet the person', rest: 'behind the builds.' },
  work: { lead: 'Right, these are the things', rest: 'he’s been making.' },
  contact: { lead: 'Fancy building', rest: 'something together?' },
  menu: { lead: 'Pick a door.', rest: 'I’ll hold the others.' },
} satisfies Record<string, Line>;

/** The spoken form of the first line (punctuation tuned for speech engines). */
export const spokenIntro = 'Hey, I’m Buddy!';

/** Buddy's expression when he settles at each seat. */
export const seatExpressions: Record<string, 'greeting' | 'curious' | 'happy' | 'listening' | 'thinking' | 'surprised' | 'wink' | 'laughing' | 'playful'> = {
  hero: 'greeting',
  about: 'curious',
  work: 'happy',
  contact: 'listening',
  menu: 'thinking',
};
