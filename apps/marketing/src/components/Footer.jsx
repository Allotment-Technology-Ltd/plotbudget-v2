const DEFAULT_APP_URL = 'https://app.plotbudget.com';

export default function Footer({ pricingEnabled = false, appUrl = DEFAULT_APP_URL }) {
  const year = new Date().getFullYear();

  const links = [
    ...(pricingEnabled ? [{ label: 'Pricing', href: '#pricing' }] : []),
    { label: 'Get the app', href: appUrl },
    { label: 'Log in', href: `${appUrl}/login` },
    { label: 'Changelog', href: '/changelog' },
    { label: 'Privacy', href: '/privacy' },
    {
      label: 'Cookie settings',
      href: '#',
      onClick: (e) => {
        e.preventDefault();
        window.dispatchEvent(new Event('plot_show_cookie_settings'));
      },
    },
    { label: 'Terms', href: '/terms' },
    { label: 'Contact', href: 'mailto:hello@plotbudget.com' },
  ];

  return (
    <footer
      className="py-10 md:py-14 bg-plot-bg border-t border-plot-border"
      role="contentinfo"
    >
      <div className="content-wrapper">
        <div className="
          flex flex-col md:flex-row items-start md:items-center
          justify-between gap-8
        ">
          <div className="space-y-2">
            <span className="
              font-display font-bold text-xl text-plot-accent
              tracking-[0.25em]
            ">
              PLOT
            </span>
            <p className="font-body text-sm text-plot-muted">
              Household budgeting.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="flex gap-6 flex-wrap">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={link.onClick}
                className="
                  font-heading text-label-sm uppercase tracking-wider
                  text-plot-muted hover:text-plot-accent
                  transition-colors
                "
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href="mailto:hello@plotbudget.com"
            className="
              font-heading text-label-sm text-plot-muted
              hover:text-plot-accent transition-colors
              tracking-wider
            "
          >
            hello@plotbudget.com
          </a>
        </div>

        <p className="
          mt-8 pt-6 border-t border-plot-border
          font-heading text-label-sm text-plot-muted/50
          tracking-wider uppercase text-center md:text-left
        ">
          © {year} Allotment Technology Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
