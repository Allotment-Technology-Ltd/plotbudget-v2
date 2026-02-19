'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { ExternalLink, Pencil, Trash2, Plus } from 'lucide-react';
import {
  createChangelogEntry,
  updateChangelogEntry,
  deleteChangelogEntry,
  updateChangelogOrder,
} from '@/lib/actions/admin-changelog-actions';
import type { ChangelogEntry } from '@repo/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  initialData: ChangelogEntry[] | null;
  initialError: string | null;
};

export function AdminChangelogPanel({ initialData, initialError }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const [createState, createAction] = useActionState(createChangelogEntry, undefined);
  const [updateState, updateAction] = useActionState(updateChangelogEntry, undefined);

  const moveEntry = async (id: string, direction: 'up' | 'down') => {
    const list = initialData ?? [];
    const fromIndex = list.findIndex((e) => e.id === id);
    if (fromIndex === -1) return;
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= list.length) return;
    setReorderError(null);
    const reordered = [...list];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    const result = await updateChangelogOrder(reordered.map((e) => e.id));
    if (result.error) setReorderError(result.error);
    else router.refresh();
  };

  const handleDelete = async (id: string) => {
    const result = await deleteChangelogEntry(id);
    if (result.error) {
      alert(result.error);
    } else {
      setDeleteConfirmId(null);
      router.refresh();
    }
  };

  if (initialError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {initialError}
      </div>
    );
  }

  const entries = initialData ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">
            Changelog
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit changelog entries for What&apos;s new. Served via API for app and marketing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://plotbudget.com/changelog"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            View changelog
          </a>
          <Button
            type="button"
            variant="outline"
            onClick={() => { setShowNew(true); setEditingId(null); }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            New entry
          </Button>
        </div>
      </div>

      {(createState?.error || reorderError) && (
        <p className="text-sm text-destructive">{createState?.error ?? reorderError}</p>
      )}

      {showNew && (
        <ChangelogEntryForm
          title="New entry"
          defaultValues={{}}
          state={createState}
          action={createAction}
          onSuccess={() => { setShowNew(false); router.refresh(); }}
          onCancel={() => setShowNew(false)}
          successKey="create"
        />
      )}

      <div className="space-y-4">
        {entries.map((e, index) => (
          <div key={e.id} className="rounded-lg border border-border bg-card p-4">
            {editingId === e.id ? (
              <ChangelogEntryForm
                title={`Edit: ${e.version}`}
                defaultValues={e}
                entryId={e.id}
                state={updateState}
                action={updateAction}
                onSuccess={() => { setEditingId(null); router.refresh(); }}
                onCancel={() => setEditingId(null)}
                successKey="update"
              />
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex shrink-0 flex-col rounded border border-input bg-muted/30">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 w-8 min-w-8 rounded-b-none p-0 text-muted-foreground hover:text-foreground disabled:opacity-40"
                    onClick={() => moveEntry(e.id, 'up')}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <span className="text-lg leading-none" aria-hidden>↑</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 w-8 min-w-8 rounded-t-none p-0 text-muted-foreground hover:text-foreground disabled:opacity-40"
                    onClick={() => moveEntry(e.id, 'down')}
                    disabled={index === entries.length - 1}
                    aria-label="Move down"
                  >
                    <span className="text-lg leading-none" aria-hidden>↓</span>
                  </Button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-medium uppercase tracking-wider text-foreground">
                    {e.version}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(e.released_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  {e.content && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {e.content.replace(/#+/g, '').trim().slice(0, 120)}…
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-2 py-1"
                    onClick={() => { setEditingId(e.id); setShowNew(false); }}
                    aria-label={`Edit ${e.version}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                  {deleteConfirmId === e.id ? (
                    <span className="flex items-center gap-2 text-sm">
                      <button
                        type="button"
                        className="text-destructive hover:underline"
                        onClick={() => handleDelete(e.id)}
                      >
                        Confirm delete
                      </button>
                      <button
                        type="button"
                        className="text-muted-foreground hover:underline"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-2 py-1 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirmId(e.id)}
                      aria-label={`Delete ${e.version}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {entries.length === 0 && !showNew && (
        <p className="text-sm text-muted-foreground">No changelog entries yet. Add one above.</p>
      )}
    </div>
  );
}

function ChangelogEntryForm({
  title,
  defaultValues,
  entryId,
  state,
  action,
  onSuccess,
  onCancel,
  successKey,
}: {
  title: string;
  defaultValues: Partial<ChangelogEntry> | Record<string, never>;
  entryId?: string;
  state: { error?: string; success?: boolean } | undefined;
  action: (prev: unknown, formData: FormData) => void;
  onSuccess: () => void;
  onCancel: () => void;
  successKey: string;
}) {
  const d = defaultValues as Partial<ChangelogEntry>;
  const releasedAt = d.released_at
    ? new Date(d.released_at).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state?.success, onSuccess]);

  return (
    <form action={action} className="space-y-4">
      {entryId != null && <input type="hidden" name="id" value={entryId} />}
      <p className="font-heading text-sm uppercase tracking-wider text-foreground">{title}</p>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="changelog-version">Version (e.g. 1.4.0)</Label>
          <Input id="changelog-version" name="version" defaultValue={d.version} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="changelog-released_at">Release date</Label>
          <Input
            id="changelog-released_at"
            name="released_at"
            type="date"
            defaultValue={releasedAt}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="changelog-content">Content (Markdown)</Label>
        <textarea
          id="changelog-content"
          name="content"
          rows={12}
          defaultValue={d.content ?? ''}
          className="flex w-full rounded-md border border-input bg-background px-4 py-2 font-mono text-sm text-foreground"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="changelog-display_order">Display order (higher = first)</Label>
        <Input
          id="changelog-display_order"
          name="display_order"
          type="number"
          min={0}
          defaultValue={d.display_order ?? 0}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
