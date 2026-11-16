import { projects } from './projects';
import { site } from './site';

/**
 * Deepak's profile, shown when Buddy introduces him. Every value here comes
 * from facts already confirmed for the site; nothing is invented.
 */
export const profile = {
  name: 'Deepak',
  role: 'Software developer',
  /**
   * Photo: drop an image in /public (e.g. /public/deepak.jpg) and set its path
   * here. Until then the monogram stands in.
   */
  photo: null as string | null,
  bio: {
    lead: 'I build software, end to end.',
    rest: 'Backend systems, full-stack products and tools that solve a real problem. I like knowing what happens between a click and the response.',
  },
  stats: [
    { term: 'Studying', value: site.education.degree },
    { term: 'University', value: 'CHRIST University' },
    { term: 'Graduating', value: site.education.graduation },
    { term: 'Based in', value: site.location },
    { term: 'Projects', value: String(projects.length).padStart(2, '0') },
  ],
} as const;
