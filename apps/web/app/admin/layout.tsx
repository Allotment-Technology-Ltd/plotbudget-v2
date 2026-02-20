/**
 * Admin section: web app and marketing maintenance, email testing.
 * Only users with is_admin = true can access. Others are redirected to dashboard.
 */
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminUser } from '@/lib/auth/admin-gate';
import { Shield, Mail, LayoutDashboard, Map, FileText } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allowed = await isAdminUser();
  if (!allowed) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="content-wrapper flex h-16 items-center justify-between">
          <Link
            href="/admin"
            className="font-heading text-xl uppercase tracking-widest text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
          >
            PLOT Admin
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <span className="flex items-center gap-1.5 text-xs text-primary font-medium uppercase tracking-wider">
              <Shield className="h-4 w-4" aria-hidden />
              Admin
            </span>
          </nav>
        </div>
        <div className="content-wrapper border-t border-border py-2">
          <nav className="flex items-center gap-6 text-sm" aria-label="Admin sections">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              Home
            </Link>
            <Link
              href="/admin/emails"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Mail className="h-4 w-4" aria-hidden />
              Emails
            </Link>
            <Link
              href="/admin/roadmap"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <Map className="h-4 w-4" aria-hidden />
              Roadmap
            </Link>
            <Link
              href="/admin/changelog"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <FileText className="h-4 w-4" aria-hidden />
              Changelog
            </Link>
          </nav>
        </div>
      </header>
      <main className="content-wrapper section-padding">{children}</main>
    </div>
  );
}
