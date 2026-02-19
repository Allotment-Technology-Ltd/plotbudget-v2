'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActionState } from 'react';
import { ExternalLink, Pencil, Trash2, Plus } from 'lucide-react';
import {
  createRoadmapFeature,
  updateRoadmapFeature,
  deleteRoadmapFeature,
  updateRoadmapOrder,
} from '@/lib/actions/admin-roadmap-actions';
import type { RoadmapFeature } from '@repo/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STATUS_OPTIONS = ['now', 'next', 'later', 'shipped'] as const;
const ICON_OPTIONS = ['DollarSign', 'Layers', 'CheckSquare', 'Calendar', 'Utensils', 'Plane', 'Lock', 'Home', 'Baby'];

type Props = {
  initialData: RoadmapFeature[] | null;
  initialError: string | null;
};

export function AdminRoadmapPanel({ initialData, initialError }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const [createState, createAction] = useActionState(createRoadmapFeature, undefined);
  const [updateState, updateAction] = useActionState(updateRoadmapFeature, undefined);

  const moveFeature = async (id: string, direction: 'up' | 'down') => {
    const list = initialData ?? [];
    const fromIndex = list.findIndex((f) => f.id === id);
    if (fromIndex === -1) return;
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= list.length) return;
    setReorderError(null);
    const reordered = [...list];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    const result = await updateRoadmapOrder(reordered.map((f) => f.id));
    if (result.error) setReorderError(result.error);
    else router.refresh();
  };

  const handleDelete = async (id: string) => {
    const result = await deleteRoadmapFeature(id);
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

  const features = initialData ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">
            Roadmap
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit roadmap features shown on the roadmap page. Changes appear immediately.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/roadmap"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            View roadmap
          </a>
          <Button
            type="button"
            variant="outline"
            onClick={() => { setShowNew(true); setEditingId(null); }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            New feature
          </Button>
        </div>
      </div>

      {(createState?.error || reorderError) && (
        <p className="text-sm text-destructive">{createState?.error ?? reorderError}</p>
      )}

      {showNew && (
        <RoadmapFeatureForm
          title="New feature"
          defaultValues={{}}
          featureId={null}
          state={createState}
          action={createAction}
          onSuccess={() => { setShowNew(false); router.refresh(); }}
          onCancel={() => setShowNew(false)}
          successKey="create"
        />
      )}

      <div className="space-y-4">
        {features.map((f, index) => (
          <div key={f.id} className="rounded-lg border border-border bg-card p-4">
            {editingId === f.id ? (
              <RoadmapFeatureForm
                title={`Edit: ${f.title}`}
                defaultValues={f}
                featureId={f.id}
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
                    onClick={() => moveFeature(f.id, 'up')}
                    disabled={index === 0}
                    aria-label="Move up"
                  >
                    <span className="text-lg leading-none" aria-hidden>↑</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 w-8 min-w-8 rounded-t-none p-0 text-muted-foreground hover:text-foreground disabled:opacity-40"
                    onClick={() => moveFeature(f.id, 'down')}
                    disabled={index === features.length - 1}
                    aria-label="Move down"
                  >
                    <span className="text-lg leading-none" aria-hidden>↓</span>
                  </Button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-medium uppercase tracking-wider text-foreground">
                    {f.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{f.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {f.module_key} · {f.status} · order {f.display_order}
                    {f.estimated_timeline ? ` · ${f.estimated_timeline}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-2 py-1"
                    onClick={() => { setEditingId(f.id); setShowNew(false); }}
                    aria-label={`Edit ${f.title}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </Button>
                  {deleteConfirmId === f.id ? (
                    <span className="flex items-center gap-2 text-sm">
                      <button
                        type="button"
                        className="text-destructive hover:underline"
                        onClick={() => handleDelete(f.id)}
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
                      onClick={() => setDeleteConfirmId(f.id)}
                      aria-label={`Delete ${f.title}`}
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

      {features.length === 0 && !showNew && (
        <p className="text-sm text-muted-foreground">No roadmap features yet. Add one above.</p>
      )}
    </div>
  );
}

function RoadmapFeatureForm({
  title,
  defaultValues,
  featureId,
  state,
  action,
  onSuccess,
  onCancel,
  successKey,
}: {
  title: string;
  defaultValues: Partial<RoadmapFeature> | Record<string, never>;
  featureId: string | null;
  state: { error?: string; success?: boolean } | undefined;
  action: (prev: unknown, formData: FormData) => void;
  onSuccess: () => void;
  onCancel: () => void;
  successKey: string;
}) {
  const d = defaultValues as Partial<RoadmapFeature>;
  const keyFeaturesStr = Array.isArray(d.key_features) ? d.key_features.join('\n') : '';

  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state?.success, onSuccess]);

  return (
    <form action={action} className="space-y-4">
      {featureId != null && <input type="hidden" name="id" value={featureId} />}
      <p className="font-heading text-sm uppercase tracking-wider text-foreground">{title}</p>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="roadmap-title">Title</Label>
          <Input id="roadmap-title" name="title" defaultValue={d.title} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="roadmap-module_key">Module key</Label>
          <Input id="roadmap-module_key" name="module_key" defaultValue={d.module_key} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="roadmap-description">Description</Label>
        <Input id="roadmap-description" name="description" defaultValue={d.description} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="roadmap-icon_name">Icon</Label>
          <select
            id="roadmap-icon_name"
            name="icon_name"
            defaultValue={d.icon_name ?? 'Layers'}
            className="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-foreground"
          >
            {ICON_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="roadmap-status">Status</Label>
          <select
            id="roadmap-status"
            name="status"
            defaultValue={d.status ?? 'later'}
            className="flex h-11 w-full rounded-md border border-input bg-background px-4 py-2 text-foreground"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="roadmap-display_order">Display order</Label>
          <Input
            id="roadmap-display_order"
            name="display_order"
            type="number"
            min={0}
            defaultValue={d.display_order ?? 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="roadmap-estimated_timeline">Estimated timeline (e.g. Q1 2026)</Label>
          <Input id="roadmap-estimated_timeline" name="estimated_timeline" defaultValue={d.estimated_timeline ?? ''} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="roadmap-key_features">Key features (one per line)</Label>
        <textarea
          id="roadmap-key_features"
          name="key_features"
          rows={6}
          defaultValue={keyFeaturesStr}
          className="flex w-full rounded-md border border-input bg-background px-4 py-2 font-body text-foreground"
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
