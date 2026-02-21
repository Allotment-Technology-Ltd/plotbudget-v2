'use client';

/**
 * Trial email testing UI: send/preview templates, trial users, state manipulation, cron simulation.
 * Used by /dev/trial-testing and /admin/emails. APIs are gated by pre-prod or admin.
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { TrialEmailTemplate } from '@/app/api/dev/send-trial-email/route';
import type { TrialUserSummary } from '@/app/api/dev/trial-users/route';
import type { TrialStateAction } from '@/app/api/dev/trial-state/route';
import type { SendForUserTemplate } from '@/app/api/dev/send-trial-email-for-user/route';

const TEMPLATES: { id: TrialEmailTemplate; label: string }[] = [
  { id: 'milestone', label: 'Trial Milestone (1 of 2 complete)' },
  { id: 'ending-soon', label: 'Trial Ending Soon (3 days before)' },
  { id: 'ended-action-required', label: 'Trial Ended — Action Required (over limits)' },
  { id: 'grace-reminder', label: 'Grace Reminder (day 6 of 7)' },
  { id: 'pwyl-welcome-paid', label: 'PWYL Welcome (paid)' },
  { id: 'pwyl-welcome-free', label: 'PWYL Welcome (free)' },
];

const REAL_DATA_TEMPLATES: { id: SendForUserTemplate; label: string }[] = [
  { id: 'milestone', label: 'Milestone' },
  { id: 'ending-soon', label: 'Ending Soon' },
  { id: 'ended-action-required', label: 'Ended Action Required' },
  { id: 'grace-reminder', label: 'Grace Reminder' },
];

const STATE_ACTIONS: { id: TrialStateAction; label: string }[] = [
  { id: 'simulate-cycle-switchover', label: 'Simulate cycle switchover' },
  { id: 'complete-cycle-1', label: 'Set 1 cycle completed' },
  { id: 'complete-cycle-2', label: 'Set 2 cycles, grace started' },
  { id: 'set-grace-6', label: 'Set grace_period_start to 6 days ago' },
  { id: 'set-grace-8', label: 'Set grace_period_start to 8 days ago' },
  { id: 'reset-email-flags', label: 'Reset all email flags' },
];

const DEFAULT_EMAIL =
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TRIAL_TEST_EMAIL
    ? process.env.NEXT_PUBLIC_TRIAL_TEST_EMAIL
    : 'hello@plotbudget.com';

type EmailConfig = { emailConfigured: boolean; hint?: string } | null;

export function TrialEmailTestingPanel() {
  const router = useRouter();
  const [to, setTo] = useState(DEFAULT_EMAIL);
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(null);
  const [loading, setLoading] = useState<TrialEmailTemplate | null>(null);
  const [trialUsers, setTrialUsers] = useState<TrialUserSummary[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [stateLoading, setStateLoading] = useState<TrialStateAction | null>(null);
  const [sendForUserLoading, setSendForUserLoading] = useState<SendForUserTemplate | null>(null);
  const [cronLoading, setCronLoading] = useState<'dry' | 'real' | null>(null);
  const [asOfDate, setAsOfDate] = useState<string>('');
  const [lastSendError, setLastSendError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dev/trial-users')
      .then((r) => r.json())
      .then((data) => {
        if (data.users) setTrialUsers(data.users);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/dev/send-trial-email')
      .then((r) => r.json())
      .then((data) => {
        setEmailConfig({
          emailConfigured: data.emailConfigured === true,
          hint: data.hint,
        });
      })
      .catch(() => setEmailConfig({ emailConfigured: false, hint: 'Could not check config' }));
  }, []);

  async function handleSend(template: TrialEmailTemplate, preview: boolean) {
    setLoading(template);
    try {
      const res = await fetch('/api/dev/send-trial-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, to, preview }),
      });

      if (preview) {
        const html = await res.text();
        const win = window.open('', '_blank');
        if (win) {
          const blob = new Blob([html], { type: 'text/html' });
          win.location.href = URL.createObjectURL(blob);
        } else {
          toast.error('Popup blocked. Allow popups to preview.');
        }
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.hint ? `${data.error} ${data.hint}` : (data.error ?? `Failed: ${res.status}`);
        setLastSendError(msg);
        toast.error(msg);
        return;
      }

      setLastSendError(null);
      toast.success(`Sent to ${to}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(null);
    }
  }

  async function handleStateAction(action: TrialStateAction) {
    if (!selectedUserId) {
      toast.error('Select a trial user first');
      return;
    }
    setStateLoading(action);
    try {
      const res = await fetch('/api/dev/trial-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      toast.success(data.message ?? 'State updated');

      if (action === 'simulate-cycle-switchover' && data.newCycleId) {
        router.push(`/dashboard/money/blueprint?cycle=${data.newCycleId}&newCycle=1`);
        return;
      }

      fetch('/api/dev/trial-users')
        .then((r) => r.json())
        .then((d) => d.users && setTrialUsers(d.users))
        .catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setStateLoading(null);
    }
  }

  async function handleSendForUser(template: SendForUserTemplate) {
    if (!selectedUserId) {
      toast.error('Select a trial user first');
      return;
    }
    setSendForUserLoading(template);
    try {
      const res = await fetch('/api/dev/send-trial-email-for-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, template, forwardTo: to || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      toast.success(`Sent ${template} to ${to || (trialUsers.find((u) => u.id === selectedUserId)?.email ?? 'user')}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSendForUserLoading(null);
    }
  }

  async function handleCronSimulation(dryRun: boolean) {
    setCronLoading(dryRun ? 'dry' : 'real');
    try {
      const res = await fetch('/api/dev/cron-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId || undefined,
          dryRun,
          ...(asOfDate && { asOfDate }),
          ...(to && !dryRun && { forwardTo: to }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      const msg = data.results?.length
        ? `${data.results.length} processed: ${data.results.map((r: { email: string; action: string }) => `${r.email}→${r.action}`).join(', ')}`
        : 'No emails to send';
      toast.success(dryRun ? `Dry run: ${msg}` : msg);
      if (!dryRun && data.results?.length)
        fetch('/api/dev/trial-users')
          .then((r) => r.json())
          .then((d) => d.users && setTrialUsers(d.users))
          .catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setCronLoading(null);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">
          Trial Email Testing
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Send or preview trial/grace period emails. Requires RESEND_API_KEY in
          .env.local. Emails are sent from hello@plotbudget.com (or
          RESEND_FROM_EMAIL).
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          If Resend shows &quot;app.plotbudget.com not verified&quot;, use{' '}
          <code className="rounded bg-muted px-1">RESEND_FROM_EMAIL=PLOT &lt;hello@plotbudget.com&gt;</code>{' '}
          and verify the domain <strong>plotbudget.com</strong> at{' '}
          <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="underline">
            resend.com/domains
          </a>.
        </p>
        {emailConfig && (
          <div
            className={`mt-2 rounded-md border px-3 py-2 text-sm ${
              emailConfig.emailConfigured
                ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400'
                : 'border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-200'
            }`}
          >
            <strong>App email config:</strong>{' '}
            {emailConfig.emailConfigured ? (
              'RESEND_API_KEY is set. Send and Preview will use hello@plotbudget.com.'
            ) : (
              <>
                RESEND_API_KEY is not set in this app. {emailConfig.hint ?? ''}
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="trial-test-email"
          className="block text-sm font-medium text-foreground"
        >
          Recipient email
        </label>
        <input
          id="trial-test-email"
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="hello@plotbudget.com"
          className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          Used for templates above and for forwarding when sending with real data or
          running cron. Trial test user inboxes don&apos;t exist; all emails go here.
        </p>
      </div>

      {lastSendError && (
        <div className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          <strong>Last send error:</strong> {lastSendError}
        </div>
      )}

      <div className="space-y-4">
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">
          Templates
        </h2>
        <ul className="space-y-3">
          {TEMPLATES.map(({ id, label }) => (
            <li
              key={id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
            >
              <span className="text-sm font-medium text-foreground">{label}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSend(id, true)}
                  disabled={loading !== null}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleSend(id, false)}
                  disabled={loading !== null}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading === id ? 'Sending…' : 'Send'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {trialUsers.length > 0 && (
        <>
          <div className="space-y-4 border-t border-border pt-8">
            <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">
              Phase 2: Trial Test Users
            </h2>
            <div className="space-y-2">
              <label
                htmlFor="trial-user-select"
                className="block text-sm font-medium text-foreground"
              >
                Select user
              </label>
              <select
                id="trial-user-select"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
              >
                <option value="">— Choose —</option>
                {trialUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.email} — cycles: {u.trialCyclesCompleted}
                    {u.graceDay != null ? `, grace day ${u.graceDay}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Manipulate state</h3>
              <p className="text-xs text-muted-foreground">
                Cycle switchover: marks active paycycle completed, creates/activates next, increments trial_cycles_completed. Requires an active paycycle (e.g. trial-ending user).
              </p>
              <div className="flex flex-wrap gap-2">
                {STATE_ACTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleStateAction(id)}
                    disabled={!selectedUserId || stateLoading !== null}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                  >
                    {stateLoading === id ? 'Updating…' : label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Send with real data</h3>
              <div className="flex flex-wrap gap-2">
                {REAL_DATA_TEMPLATES.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSendForUser(id)}
                    disabled={!selectedUserId || sendForUserLoading !== null}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {sendForUserLoading === id ? 'Sending…' : `Send ${label}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Cron simulation</h3>
              <div className="space-y-2">
                <label
                  htmlFor="as-of-date"
                  className="block text-xs font-medium text-muted-foreground"
                >
                  Run as if today is (optional)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="as-of-date"
                    type="date"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                  />
                  {asOfDate && (
                    <button
                      type="button"
                      onClick={() => setAsOfDate('')}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCronSimulation(true)}
                  disabled={cronLoading !== null}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {cronLoading === 'dry' ? 'Running…' : 'Dry run'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCronSimulation(false)}
                  disabled={cronLoading !== null}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {cronLoading === 'real' ? 'Running…' : 'Run cron (real)'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedUserId
                  ? 'Runs for selected user only.'
                  : 'Runs for all trial test users.'}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
