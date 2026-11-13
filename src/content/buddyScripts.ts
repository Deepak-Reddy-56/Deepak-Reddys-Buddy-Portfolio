import type { ExpressionName } from '../features/buddy/expressions';

export type BuddyScript = {
  speech: string;
  expression: ExpressionName;
  autoSpeak?: boolean;
};

/** All narration lives here; keep lines short enough to fit between scroll beats. */
export const buddyScripts: Record<string, BuddyScript> = {
  home: {
    speech: 'Hey, I’m Buddy! Deepak builds the software. I make sure the tour has a little personality.',
    expression: 'greeting',
  },
  about: {
    speech: 'About. This is Deepak. He studies computer science and likes building useful software from the front end to the backend.',
    expression: 'curious',
    autoSpeak: true,
  },
  work: {
    speech: 'Work. Here are the things he has been building. Pick a project and I’ll give you the quick tour.',
    expression: 'happy',
    autoSpeak: true,
  },
  contact: {
    speech: 'Contact. That’s the tour. Have an idea or want to build something together? This is your moment.',
    expression: 'listening',
    autoSpeak: true,
  },
  menu: { speech: 'Pick a door. I’ll hold the others.', expression: 'thinking' },
  'project:secure-bms-provenance': {
    speech: 'Secure B M S Provenance. A component’s journey is recorded on a permissioned ledger, from manufacture through custody and assembly.',
    expression: 'thinking',
  },
  'project:lotlens': {
    speech: 'LotLens. A manufacturing investigation agent that connects past defects and corrective actions to evidence-backed next steps.',
    expression: 'curious',
  },
  'project:sentinellog': {
    speech: 'SentinelLog. A security log monitor that spots suspicious login patterns and records the alerts.',
    expression: 'surprised',
  },
  'project:phishing-shield': {
    speech: 'Phishing Shield. Paste in a suspicious message and it analyses the risk, extracted links and a suggested reply using Gemini.',
    expression: 'listening',
  },
  'project:campuscopilot': {
    speech: 'CampusCopilot. A command-line university assistant made during a five-hour team hackathon.',
    expression: 'happy',
  },
  'project:clara-co': {
    speech: 'Clara and Co. An e-commerce storefront with shopping, product, search, checkout, account and admin sections.',
    expression: 'happy',
  },
};

export const tapReactions: readonly { expression: ExpressionName; speech: string }[] = [
  { expression: 'surprised', speech: 'Oh! A visitor. I was just practising my good side.' },
  { expression: 'wink', speech: 'I saw that coming. I have excellent peripheral vision. Probably.' },
  { expression: 'laughing', speech: 'Ha! You found me. I’m not exactly hiding.' },
  { expression: 'playful', speech: 'Boop received. I’m choosing to take that as a compliment.' },
  { expression: 'happy', speech: 'You can tap me any time. I enjoy the attention.' },
];
