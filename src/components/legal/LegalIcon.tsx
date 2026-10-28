// Line icons drawn on the same 24px grid and stroke as components/Icon.tsx.
const paths = {
  agreement: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h3.5',
  renew: 'M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4',
  device:
    'M5 15.5v-9A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v9M2.5 15.5h19l-.6 1.9a1 1 0 0 1-1 .6H4.1a1 1 0 0 1-1-.6z',
  review: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM16 16l4.5 4.5M7.5 10.5l2 2 3.5-3.5',
  account: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c1.4-3.2 4.3-5 7.5-5s6.1 1.8 7.5 5M4 4l16 16',
  ads: 'M3 3l18 18M10.6 5.1Q11.3 5 12 5c5 0 9 5 10 7-.5 1-1.3 2.2-2.4 3.3M6.6 6.6C4.4 8 2.9 10.1 2 12c1 2 5 7 10 7 1.8 0 3.4-.6 4.8-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2',
  sell: 'M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6zM9 12l2 2 4-4',
  check: 'm5 12.5 4.2 4.2L19 7',
  hash: 'M5 9h15M4 15h15M10.5 3 8.5 21M15.5 3l-2 18',
  chevron: 'm6 9 6 6 6-6',
  external: 'M7 17 17 7M8 7h9v9',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  up: 'M12 20V4m-6 6 6-6 6 6',
  mail: 'M3.5 6.5h17v11h-17zM4 7l8 6 8-6',
  calendar: 'M4.5 6h15v14h-15zM4.5 10h15M8.5 3.5V7M15.5 3.5V7',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2',
  sections: 'M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01',
  person: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c1.4-3.2 4.3-5 7.5-5s6.1 1.8 7.5 5',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8v.5M12 17h.01',
} as const;

export type LegalIconName = keyof typeof paths;

export function LegalIcon({ name, size = 20 }: { name: LegalIconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
