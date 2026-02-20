import Image from 'next/image';
import Link from 'next/link';

/**
 * Linear-style minimal auth header: centred logo + single line of text.
 * Use on login/signup hub screens for a clean, minimal look.
 */
export function AuthMinimalHeader({ title }: { title: string }) {
  return (
    <header className="flex flex-col items-center text-center gap-4" aria-label={title}>
      <div className="relative h-12 w-12 shrink-0">
        <Image
          src="/favicon-light.svg"
          alt=""
          width={48}
          height={48}
          className="dark:hidden"
          priority
        />
        <Image
          src="/favicon-dark.svg"
          alt=""
          width={48}
          height={48}
          className="hidden dark:block"
          priority
        />
      </div>
      <h1 className="font-heading text-xl font-semibold text-foreground tracking-tight uppercase">
        {title}
      </h1>
    </header>
  );
}

/**
 * Compact logo + wordmark for use inside auth cards (login, signup, reset).
 * Horizontal bar pattern: logo and wordmark on one line, optional tagline below.
 * Keeps branding visible without competing with the form (best practice: logo supports, not dominates).
 */
export function AuthCardBrand({ tagline }: { tagline?: string }) {
  return (
    <header className="flex flex-col gap-1.5" aria-label="PLOT">
      <div className="flex items-center gap-3">
        <div className="relative h-9 w-9 shrink-0">
          <Image
            src="/favicon-light.svg"
            alt=""
            width={36}
            height={36}
            className="dark:hidden"
            priority
          />
          <Image
            src="/favicon-dark.svg"
            alt=""
            width={36}
            height={36}
            className="hidden dark:block"
            priority
          />
        </div>
        <span className="font-display text-lg font-bold uppercase tracking-[0.18em] text-foreground">
          PLOT
        </span>
      </div>
      {tagline && (
        <p className="font-body text-xs text-muted-foreground">{tagline}</p>
      )}
    </header>
  );
}

interface AuthBrandHeaderProps {
  /** Optional tagline shown under the logo (e.g. "The 20-minute payday ritual") */
  tagline?: string;
  /** Show as link to marketing site when true */
  linkToHome?: boolean;
}

export function AuthBrandHeader({ tagline, linkToHome = false }: AuthBrandHeaderProps) {
  const logo = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-12 w-12 shrink-0">
        <Image
          src="/favicon-light.svg"
          alt="PLOT"
          width={48}
          height={48}
          className="dark:hidden"
          priority
        />
        <Image
          src="/favicon-dark.svg"
          alt="PLOT"
          width={48}
          height={48}
          className="hidden dark:block"
          priority
        />
      </div>
      <div className="text-center space-y-0.5">
        <span className="font-display text-2xl font-bold uppercase tracking-[0.2em] text-foreground">
          PLOT
        </span>
        {tagline && (
          <p className="font-body text-sm text-muted-foreground whitespace-nowrap">
            {tagline}
          </p>
        )}
      </div>
    </div>
  );

  if (linkToHome) {
    return (
      <Link
        href="https://plotbudget.com"
        className="block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg -m-2 p-2"
        aria-label="PLOT - Budget Together"
      >
        {logo}
      </Link>
    );
  }

  return <div className="block">{logo}</div>;
}
