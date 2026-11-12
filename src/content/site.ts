/**
 * Site-wide facts. Everything here must be confirmed by Deepak.
 * Contact destinations are configurable: set them here, or through
 * VITE_CONTACT_EMAIL / VITE_LINKEDIN_URL (see .env.example). A missing value
 * hides that link rather than rendering a placeholder.
 */
function optionalEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const site = {
  name: 'Deepak Reddy',
  monogram: 'DR',
  tagline: 'I build software, end to end.',
  location: 'Bengaluru, India',
  education: {
    degree: 'B.Tech, Computer Science',
    institution: 'CHRIST (Deemed to be University)',
    graduation: '2028',
  },
  contact: {
    email: optionalEnv(import.meta.env.VITE_CONTACT_EMAIL),
    linkedin: optionalEnv(import.meta.env.VITE_LINKEDIN_URL),
    github: 'https://github.com/Deepak-Reddy-56',
  },
} as const;

export type SocialLink = { label: string; href: string; external: boolean };

/** Social / contact links that actually have a destination. */
export function socialLinks(): SocialLink[] {
  const links: SocialLink[] = [{ label: 'GitHub', href: site.contact.github, external: true }];
  if (site.contact.linkedin) links.push({ label: 'LinkedIn', href: site.contact.linkedin, external: true });
  if (site.contact.email) links.push({ label: 'Email', href: `mailto:${site.contact.email}`, external: false });
  return links;
}
