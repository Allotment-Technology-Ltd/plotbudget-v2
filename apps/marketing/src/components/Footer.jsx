import { useTheme } from '../hooks/useTheme';

const DEFAULT_APP_URL = 'https://app.plotbudget.com';

const linkClass = `
  font-heading text-label-sm uppercase tracking-wider
  text-plot-muted hover:text-plot-accent-text transition-colors
`;

export default function Footer({ pricingEnabled = false, appUrl = DEFAULT_APP_URL }) {
  const { theme } = useTheme();
  const year = new Date().getFullYear();

  const productLinks = [
    { label: 'Get the app', href: appUrl },
    { label: 'Log in', href: `${appUrl}/login` },
    ...(pricingEnabled ? [{ label: 'Pricing', href: '/#pricing' }] : []),
  ];

  const aboutLinks = [
    { label: 'Principles', href: '/principles' },
    { label: 'Features', href: '/features' },
    { label: 'Story', href: '/story' },
    { label: 'Roadmap', href: '/roadmap' },
    { label: 'Changelog', href: '/changelog' },
  ];

  const legalLinks = [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    {
      label: 'Cookie settings',
      href: '#',
      onClick: (e) => {
        e.preventDefault();
        window.dispatchEvent(new Event('plot_show_cookie_settings'));
      },
    },
  ];

  return (
    <footer
      className="py-10 md:py-14 bg-plot-bg border-t border-plot-border"
      role="contentinfo"
    >
      <div className="content-wrapper">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 flex flex-col">
            <div className="flex items-center gap-2">
              <img
                src={theme === 'dark' ? '/logo-footer-dark.svg' : '/logo-footer-light.svg'}
                alt=""
                width={28}
                height={28}
                className="shrink-0 w-7 h-7 object-contain"
              />
              <span className="font-display font-bold text-xl text-plot-accent-text tracking-[0.25em]">
                PLOT
              </span>
            </div>
            <p className="font-body text-sm text-plot-muted">
              The household operating system.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-8 md:gap-x-14">
            <nav aria-label="Product" className="flex flex-col gap-3">
              {productLinks.map((link) => (
                <a key={link.label} href={link.href} className={linkClass}>
                  {link.label}
                </a>
              ))}
            </nav>
            <nav aria-label="About" className="flex flex-col gap-3">
              {aboutLinks.map((link) => (
                <a key={link.label} href={link.href} className={linkClass}>
                  {link.label}
                </a>
              ))}
            </nav>
            <nav aria-label="Legal" className="flex flex-col gap-3">
              {legalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={link.onClick}
                  className={linkClass}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <a href="mailto:hello@plotbudget.com" className={linkClass + ' self-start'} aria-label="Contact PLOT">
              Contact
            </a>
          </div>
        </div>

        <p className="mt-10 pt-6 border-t border-plot-border font-heading text-label-sm text-plot-muted/50 tracking-wider uppercase text-center md:text-left">
          © {year} Allotment Technology Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
