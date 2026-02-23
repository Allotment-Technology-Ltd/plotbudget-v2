'use client';

import { useState } from 'react';
import type { ModuleFlags, ModuleFlagId } from '@/lib/module-flags';

const MODULE_LABELS: Record<ModuleFlagId, string> = {
  money: 'Money',
  home: 'Home',
  tasks: 'Tasks',
  calendar: 'Calendar',
  meals: 'Meals',
  holidays: 'Holidays',
  vault: 'Vault',
  kids: 'Kids',
};

const MODULE_IDS: ModuleFlagId[] = [
  'money',
  'home',
  'tasks',
  'calendar',
  'meals',
  'holidays',
  'vault',
  'kids',
];

type Props = {
  initialFlags: ModuleFlags;
  preProd: boolean;
};

export function FlagOverridesForm({ initialFlags, preProd }: Props) {
  const [flags, setFlags] = useState<ModuleFlags>(initialFlags);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<'success' | 'error' | null>(null);

  const toggle = (id: ModuleFlagId) => {
    setFlags((prev) => ({ ...prev, [id]: !prev[id] }));
    setMessage(null);
  };

  const apply = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/flag-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleFlags: flags }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? res.statusText);
      }
      setMessage('success');
      window.location.reload();
    } catch {
      setMessage('error');
      setSaving(false);
    }
  };

  const clearOverrides = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/flag-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleFlags: {} }),
      });
      if (!res.ok) throw new Error(res.statusText);
      setMessage('success');
      window.location.reload();
    } catch {
      setMessage('error');
      setSaving(false);
    }
  };

  if (!preProd) {
    return (
      <p className="text-sm text-muted-foreground">
        Flag overrides are only available in pre-production (local or preview). In production, use PostHog to manage flags.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Toggle modules on or off for your session. Overrides are stored in a cookie (24h) and applied only for admins in pre-production. Production continues to use PostHog.
      </p>
      <ul className="space-y-2">
        {MODULE_IDS.map((id) => (
          <li key={id} className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`flag-${id}`}
              checked={flags[id]}
              onChange={() => toggle(id)}
              className="h-5 w-5 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background cursor-pointer shrink-0"
            />
            <label htmlFor={`flag-${id}`} className="text-sm font-medium capitalize">
              {MODULE_LABELS[id]}
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={apply}
          disabled={saving}
          className="rounded-lg border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Apply overrides'}
        </button>
        <button
          type="button"
          onClick={clearOverrides}
          disabled={saving}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          Clear overrides
        </button>
      </div>
      {message === 'success' && (
        <p className="text-sm text-green-600 dark:text-green-400">Saved. Reloading…</p>
      )}
      {message === 'error' && (
        <p className="text-sm text-destructive">Something went wrong. Try again.</p>
      )}
    </div>
  );
}
