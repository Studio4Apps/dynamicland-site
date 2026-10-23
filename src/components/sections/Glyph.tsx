// Line glyphs drawn on a 32-unit grid. Every stroke carries pathLength="1"
// so a parent with [data-draw] can trace it in.
const glyphs = {
  widgets: ['M5 5h9v9H5z', 'M18 5h9v9h-9z', 'M5 18h9v9H5z', 'M18 22.5h9M22.5 18v9'],
  music: ['M12 23V8l14-3v15', 'M12 23a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z', 'M26 20a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z'],
  wave: ['M4 16h2M9 11v10M14 7v18M19 12v8M24 9v14M28 16h0'],
  clipboard: ['M11 6H8a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3', 'M12 4h8v4h-8z', 'M11 15h10M11 20h7'],
  tray: ['M4 18l3.5-10h17L28 18', 'M4 18v7h24v-7h-7a5 5 0 0 1-10 0z', 'M16 4v9M12.5 9.5 16 13l3.5-3.5'],
  timer: ['M16 28a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M16 13v5l3 2', 'M13 4h6'],
  bubbles: ['M11 21a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z', 'M23.5 25a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z', 'M24 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  lyrics: ['M5 8h22', 'M5 14h16', 'M5 20h22', 'M5 26h11'],
  output: ['M6 22a10 10 0 0 1 20 0', 'M10 22a6 6 0 0 1 12 0', 'M16 22v.01', 'M9 27h14'],
  playlist: ['M5 8h15M5 14h15M5 20h9', 'M25 25V12l4 2', 'M25 25a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z'],
  hover: ['M4 6h24', 'M11 6c0 3 1.5 4.5 5 4.5S21 9 21 6', 'M16 15v8', 'M12.5 19.5 16 23l3.5-3.5'],
  window: ['M4 7h24v18H4z', 'M4 12h24', 'M8 9.5h.01M11 9.5h.01'],
  resize: ['M5 5h9v9H5z', 'M18 18h9v9h-9z', 'M18 5h9v9', 'M5 18v9h9'],
  download: ['M16 4v15M10 13l6 6 6-6', 'M5 21v6h22v-6'],
  notch: ['M3 9h26', 'M11 9c0 2.6 1.4 4 5 4s5-1.4 5-4', 'M6 9v16h20V9'],
  pill: ['M8 9h16a4 4 0 0 1 0 8H8a4 4 0 0 1 0-8Z', 'M6 25h20'],
  glass: ['M5 10h22a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3Z', 'M8 13.5c2-1.5 5-1.5 7 0'],
  spark: ['M16 4v6M16 22v6M4 16h6M22 16h6', 'M8 8l3.5 3.5M20.5 20.5 24 24M8 24l3.5-3.5M20.5 11.5 24 8'],
} as const;

export type GlyphName = keyof typeof glyphs;

export function Glyph({ name, size = 32 }: { name: GlyphName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyphs[name].map((d) => (
        <path key={d} d={d} pathLength={1} />
      ))}
    </svg>
  );
}
