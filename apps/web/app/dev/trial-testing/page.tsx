'use client';

/**
 * Dev-only trial email testing dashboard.
 * Gated by isTrialTestingDashboardAllowed() in layout. Same UI as /admin/emails.
 */
import { TrialEmailTestingPanel } from '@/components/admin/trial-email-testing-panel';

export default function TrialTestingPage() {
  return <TrialEmailTestingPanel />;
}
