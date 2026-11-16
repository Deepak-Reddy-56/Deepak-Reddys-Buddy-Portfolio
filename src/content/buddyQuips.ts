import type { Line } from './dialogue';

/**
 * Buddy's situational lines (outfits, "you're back", "ahem"). The same ids are
 * in scripts/buddy-lines.json, so recordings can be generated for them; until a
 * recording exists, Buddy mouths the line on a synthetic timeline (captions and
 * mouth stay in step, no sound).
 */
export type Quip = { id: string; text: string; caption: Line };

const q = (id: string, text: string, lead: string, rest?: string): Quip => ({ id, text, caption: { lead, rest } });

export const quips = {
  tie: q('costume-tie', 'Black tie. For a website. I contain multitudes.', 'Black tie.', 'For a website. I contain multitudes.'),
  shades: q('costume-shades', "Shades and headphones. I'm not ignoring you, I'm just extremely famous.", 'Shades and headphones.', 'I’m not ignoring you, I’m just extremely famous.'),
  hardhat: q('costume-hardhat', 'Hard hat. He builds things. I mostly supervise.', 'Hard hat.', 'He builds things. I mostly supervise.'),
  none: q('costume-none', "Naked again. Don't look. It's all head, all the way down.", 'Naked again.', 'Don’t look. It’s all head, all the way down.'),
  back: q('back', "Oh! You're back! I wasn't asleep. I was resting my chrome.", 'Oh! You’re back!', 'I wasn’t asleep. I was resting my chrome.'),
  ahem: q('ahem', 'Ahem. The page keeps going. I checked. Twice.', 'Ahem.', 'The page keeps going. I checked. Twice.'),
} satisfies Record<string, Quip>;
