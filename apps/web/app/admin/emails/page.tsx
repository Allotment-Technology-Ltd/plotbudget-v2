import type { Metadata } from 'next';
import { TrialEmailTestingPanel } from '@/components/admin/trial-email-testing-panel';

export const metadata: Metadata = {
  title: 'Admin — Emails',
  description: 'Trial and transactional email testing for PLOT admins.',
};

export default function AdminEmailsPage() {
  return <TrialEmailTestingPanel />;
}
