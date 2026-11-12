/**
 * The story's chapters. Menu numbering, section labels and the section rail
 * all read from here, so the numbers never drift apart.
 */
export type SectionId = 'home' | 'about' | 'work' | 'contact';

export type Section = {
  id: SectionId;
  number: string;
  /** Name in the menu. */
  title: string;
  /** Short name for the rail tooltip and section label. */
  label: string;
};

export const sections: readonly Section[] = [
  { id: 'home', number: '01', title: 'Home', label: 'Hello' },
  { id: 'about', number: '02', title: 'About', label: 'About' },
  { id: 'work', number: '03', title: 'Work', label: 'Work' },
  { id: 'contact', number: '04', title: 'Contact', label: 'Contact' },
];

export const sectionIds = sections.map((section) => section.id);

export function getSection(id: SectionId): Section {
  const section = sections.find((item) => item.id === id);
  if (!section) throw new Error(`Unknown section: ${id}`);
  return section;
}
