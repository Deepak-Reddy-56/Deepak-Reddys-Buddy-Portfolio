import type { ReactNode } from 'react';

type IconName = 'home' | 'sound-on' | 'sound-off' | 'arrow-right' | 'arrow-up-right' | 'arrow-left';

type IconProps = { name: IconName; size?: number; className?: string };

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M4.5 10.2 12 4l7.5 6.2" />
      <path d="M6.5 9v10h4v-5h3v5h4V9" />
    </>
  ),
  'sound-on': (
    <>
      <path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3z" />
      <path d="M15 9.2a4 4 0 0 1 0 5.6" />
      <path d="M17.5 6.8a7.4 7.4 0 0 1 0 10.4" />
    </>
  ),
  'sound-off': (
    <>
      <path d="M4.5 9.5h3l4-3.5v12l-4-3.5h-3z" />
      <path d="m15.5 9.5 5 5M20.5 9.5l-5 5" />
    </>
  ),
  'arrow-right': <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />,
  'arrow-left': <path d="M19 12H5M10.5 6.5 5 12l5.5 5.5" />,
  'arrow-up-right': <path d="M7 17 17 7M9 7h8v8" />,
};

/** Line icons drawn on a 24px grid with a 1.6 stroke. Always decorative. */
export function Icon({ name, size = 16, className }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
