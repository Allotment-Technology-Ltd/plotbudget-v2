import Link from 'next/link';
import { ThemeToggle } from '../components/theme-toggle';

export default function HomePage() {
  return (
    <div className="min-h-screen" data-testid="home-page">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-sticky border-b border-border/8 bg-background/80 backdrop-blur-sm">
        <div className="content-wrapper flex h-16 items-center justify-between">
          <div className="font-heading text-xl uppercase tracking-widest text-foreground">
            PLOT
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <section className="section-padding pt-32">
        <div className="content-wrapper text-center">
          {/* Section Label */}
          <p className="section-label mb-4">BUDGETING FOR COUPLES</p>

          {/* Main Headline */}
          <h1 className="font-heading text-display-sm md:text-display-lg uppercase text-foreground mb-6">
            PLOT YOUR
            <br />
            FUTURE
            <br />
            TOGETHER
            <span className="cursor-blink" />
          </h1>

          {/* Subheadline */}
          <p className="font-body text-sub-sm md:text-sub text-muted-foreground max-w-narrow mx-auto mb-10">
            The 15-minute payday ritual that keeps both partners on the same
            page — without sharing bank access.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="btn-primary transition-colors duration-200"
              data-testid="cta-signup"
            >
              GET EARLY ACCESS
            </Link>
            <Link
              href="#why-plot"
              className="btn-ghost transition-colors duration-200"
              data-testid="cta-learn-more"
            >
              LEARN MORE
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="why-plot" className="section-padding bg-secondary/50">
        <div className="content-wrapper">
          <p className="section-label mb-4 text-center">WHY PLOT</p>
          <h2 className="section-headline text-center mb-12">
            MONEY IS THE #1 SOURCE
            <br />
            OF STRESS IN RELATIONSHIPS
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1 */}
            <div className="card-plot">
              <div className="text-needs font-heading text-label-sm uppercase tracking-widest mb-3">
                THE PROBLEM
              </div>
              <h3 className="font-heading text-headline-sm uppercase text-foreground mb-2">
                ONE PARTNER MANAGES EVERYTHING
              </h3>
              <p className="text-muted-foreground">
                One of you becomes the "Chancellor of the Household" while the
                other stays disconnected and guilty.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card-plot">
              <div className="text-wants font-heading text-label-sm uppercase tracking-widest mb-3">
                THE OLD WAY
              </div>
              <h3 className="font-heading text-headline-sm uppercase text-foreground mb-2">
                SPREADSHEETS DON&apos;T SCALE
              </h3>
              <p className="text-muted-foreground">
                You built a Google Sheet in month one. It&apos;s a monster now
                and only one of you understands it.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card-plot">
              <div className="text-savings font-heading text-label-sm uppercase tracking-widest mb-3">
                THE PLOT WAY
              </div>
              <h3 className="font-heading text-headline-sm uppercase text-foreground mb-2">
                20 MINUTES. MONTHLY.
              </h3>
              <p className="text-muted-foreground">
                Sit down together on payday. Review your allocations. Check off
                bills. Move on with your lives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Colors Demo */}
      <section className="section-padding">
        <div className="content-wrapper">
          <p className="section-label mb-4 text-center">DESIGN SYSTEM TEST</p>
          <h2 className="section-headline text-center mb-12">
            CATEGORY COLORS
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 rounded-lg bg-needs text-white">
              <div className="font-heading text-sm uppercase">Needs</div>
              <div className="text-2xl font-display">£1,200</div>
            </div>
            <div className="p-6 rounded-lg bg-wants text-white">
              <div className="font-heading text-sm uppercase">Wants</div>
              <div className="text-2xl font-display">£400</div>
            </div>
            <div className="p-6 rounded-lg bg-savings text-white">
              <div className="font-heading text-sm uppercase">Savings</div>
              <div className="text-2xl font-display">£300</div>
            </div>
            <div className="p-6 rounded-lg bg-repay text-white">
              <div className="font-heading text-sm uppercase">Repay</div>
              <div className="text-2xl font-display">£150</div>
            </div>
          </div>

          {/* Subtle variants */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-4">
            <div className="p-6 rounded-lg bg-needs-subtle border border-needs/30">
              <div className="font-heading text-sm uppercase text-foreground">
                Needs Subtle
              </div>
            </div>
            <div className="p-6 rounded-lg bg-wants-subtle border border-wants/30">
              <div className="font-heading text-sm uppercase text-foreground">
                Wants Subtle
              </div>
            </div>
            <div className="p-6 rounded-lg bg-savings-subtle border border-savings/30">
              <div className="font-heading text-sm uppercase text-foreground">
                Savings Subtle
              </div>
            </div>
            <div className="p-6 rounded-lg bg-repay-subtle border border-repay/30">
              <div className="font-heading text-sm uppercase text-foreground">
                Repay Subtle
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/8">
        <div className="content-wrapper text-center">
          <p className="text-muted-foreground text-sm">
            © 2026 PLOT. Budgeting for couples.
          </p>
        </div>
      </footer>
    </div>
  );
}
