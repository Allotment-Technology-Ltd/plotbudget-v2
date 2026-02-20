/**
 * Consistent page header (title + optional subtitle) for all marketing content pages.
 * Same structure, typography, and spacing so users build a reliable mental model and
 * screen-reader users get predictable landmarks. Supports centered (hero) and narrow (content-page) layouts.
 *
 * @param {{ title: string; subtitle?: string; titleId?: string; variant?: 'centered' | 'left' | 'narrow'; children?: React.ReactNode }} props
 */
export function PageHeader({ title, subtitle, titleId, variant = 'left', children }) {
  const wrapperClass = [
    variant === 'left' ? 'max-w-prose mr-auto' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={wrapperClass.trim() || undefined} aria-label={title}>
      <h1
        id={titleId}
        className="font-heading text-display-sm md:text-display-lg font-bold uppercase tracking-[0.08em] text-plot-text mb-6"
      >
        {title}
      </h1>
      {subtitle && (
        <p className="font-body text-sub-sm md:text-sub text-plot-muted leading-relaxed mb-0">
          {subtitle}
        </p>
      )}
      {children && <div className="mt-6">{children}</div>}
    </header>
  );
}
