/** Original 24px outline symbols. One consistent stroke, no icon package runtime. */
export function FeatureIcon({
  name,
}: {
  name: 'home' | 'layers' | 'music' | 'sliders' | 'files' | 'timer' | 'calendar';
}) {
  const shapes = {
    home: (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
        <path d="M3.5 10h17M10 10v10.5" />
      </>
    ),
    layers: (
      <>
        <rect x="3.5" y="3.5" width="12" height="12" rx="3" />
        <path d="M19.5 8.5a2 2 0 0 1 1 1.7v8.3a2 2 0 0 1-2 2h-8.3a2 2 0 0 1-1.7-1" />
      </>
    ),
    music: (
      <>
        <path d="M9 17V6l11-2v11M9 9l11-2" />
        <ellipse cx="6" cy="17.5" rx="3" ry="2.5" />
        <ellipse cx="17" cy="15.5" rx="3" ry="2.5" />
      </>
    ),
    sliders: (
      <>
        <path d="M5 3v5m0 5v8M12 3v11m0 5v2M19 3v2m0 5v11" />
        <circle cx="5" cy="10.5" r="2.5" />
        <circle cx="12" cy="16.5" r="2.5" />
        <circle cx="19" cy="7.5" r="2.5" />
      </>
    ),
    files: (
      <>
        <path d="M8 3.5h7l5 5V18a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" />
        <path d="M15 3.5v5h5M3 7v12a3 3 0 0 0 3 3" />
      </>
    ),
    timer: (
      <>
        <circle cx="12" cy="14" r="7.5" />
        <path d="M12 10v4l3 2M9 2.5h6M12 2.5v4M18.5 7.5l2-2" />
      </>
    ),
    calendar: (
      <>
        <rect x="3.5" y="5" width="17" height="16" rx="3" />
        <path d="M8 2.5v5M16 2.5v5M3.5 11h17M8 15h2m4 0h2M8 18h2" />
      </>
    ),
  };
  return (
    <svg
      className="feature-icon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shapes[name]}
    </svg>
  );
}
