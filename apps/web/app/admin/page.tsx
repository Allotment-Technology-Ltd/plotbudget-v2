import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, FileText, Map, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'PLOT admin: web app and marketing maintenance.',
};

export default function AdminPage() {
  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">
          Admin
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Maintain the web app and marketing site. Only assigned admins can access this section.
        </p>
      </div>

      <section className="space-y-4" aria-labelledby="admin-emails-heading">
        <h2 id="admin-emails-heading" className="font-heading text-lg uppercase tracking-wider text-foreground">
          Email testing
        </h2>
        <p className="text-sm text-muted-foreground">
          Send or preview trial, grace, and PWYL emails. Same tool as pre-production dev dashboard; available here for admins in any environment.
        </p>
        <Link
          href="/admin/emails"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Mail className="h-4 w-4" aria-hidden />
          Open email testing
        </Link>
      </section>

      <section className="space-y-4 border-t border-border pt-8" aria-labelledby="admin-content-heading">
        <h2 id="admin-content-heading" className="font-heading text-lg uppercase tracking-wider text-foreground">
          Roadmap &amp; changelog
        </h2>
        <p className="text-sm text-muted-foreground">
          Edit roadmap features and changelog entries from the admin UI. Changes appear on the roadmap and via the changelog API.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin/roadmap"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Map className="h-4 w-4" aria-hidden />
            Edit roadmap
          </Link>
          <Link
            href="/admin/changelog"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FileText className="h-4 w-4" aria-hidden />
            Edit changelog
          </Link>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <a href="/roadmap" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
              View roadmap <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </li>
          <li>
            <a href="https://plotbudget.com/changelog" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
              View changelog (marketing) <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
