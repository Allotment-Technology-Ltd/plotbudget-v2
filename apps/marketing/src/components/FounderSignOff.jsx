/**
 * Consistent founder sign-off for content pages (Story, Principles, etc.).
 * Uses first-person, clear role ("Founder, PLOT"), and optional tagline/date.
 * Aligns with COO/design: personal, not corporate "we"; same format everywhere.
 */
export function FounderSignOff({ tagline = 'Built with my partner since day one', date, children }) {
  return (
    <div className="font-body text-plot-text space-y-1">
      <p>— Adam</p>
      <p className="font-medium">Founder, PLOT</p>
      {tagline && <p className="text-plot-muted">{tagline}</p>}
      {date && <p className="text-label-sm text-plot-muted">{date}</p>}
      {children}
    </div>
  );
}
