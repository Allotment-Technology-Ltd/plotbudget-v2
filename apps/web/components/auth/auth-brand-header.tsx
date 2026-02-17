import Image from 'next/image';
import Link from 'next/link';

interface AuthBrandHeaderProps {
  /** Optional tagline shown under the logo (e.g. "The 20-minute payday ritual") */
  tagline?: string;
  /** Show as link to marketing site when true */
  linkToHome?: boolean;
}

export function AuthBrandHeader({ tagline, linkToHome = false }: AuthBrandHeaderProps) {
  const logo = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-14 w-14 shrink-0">
        <Image
          src="/favicon-light.svg"
          alt="PLOT"
          width={56}
          height={56}
          className="dark:hidden"
          priority
        />
        <Image
          src="/favicon-dark.svg"
          alt="PLOT"
          width={56}
          height={56}
          className="hidden dark:block"
          priority
        />
      </div>
      <div className="text-center space-y-1">
        <span className="font-display text-2xl md:text-3xl font-bold uppercase tracking-[0.2em] text-foreground">
          PLOT
        </span>
        {tagline && (
          <p className="font-body text-sm text-muted-foreground max-w-[280px] mx-auto">
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
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg -m-2 p-2"
        aria-label="PLOT - Budget Together"
      >
        {logo}
      </Link>
    );
  }

  return <div className="block">{logo}</div>;
}
