'use client';

import { useEffect, useRef, useState } from 'react';
import {
  useShoppingLists,
  useCreateShoppingList,
  useUpdateShoppingList,
  useDeleteShoppingList,
  useGroceryList,
  useUpdateGroceryItem,
  useCreateGroceryItem,
  useGenerateGroceryFromMealPlan,
  useDeleteGroceryItem,
} from '@/hooks/use-meals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, ShoppingCart, Check, Star, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import type { GroceryItem, ShoppingList } from '@repo/supabase';

// ─── Styled checkbox ───────────────────────────────────────────────────────────
function GroceryCheckbox({
  checked,
  onToggle,
  label,
  testId,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  testId?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      data-testid={testId}
      onClick={onToggle}
      className={[
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        checked
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background hover:border-primary/60',
      ].join(' ')}
    >
      {checked && <Check className="h-4 w-4" strokeWidth={3} />}
    </button>
  );
}

// ─── Single grocery item row ───────────────────────────────────────────────────
function GroceryItemRow({
  item,
  onToggleChecked,
  onToggleStaple,
  onPriceChange,
  onDelete,
}: {
  item: GroceryItem;
  onToggleChecked: (item: GroceryItem) => void;
  onToggleStaple: (item: GroceryItem) => void;
  onPriceChange: (item: GroceryItem, price: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(item.actual_price != null ? String(item.actual_price) : '');

  const commitPrice = () => {
    setEditingPrice(false);
    onPriceChange(item, priceInput);
  };

  return (
    <li
      className="group flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
      data-testid={`grocery-item-${item.id}`}
    >
      <GroceryCheckbox
        checked={item.is_checked}
        onToggle={() => onToggleChecked(item)}
        label={`Mark ${item.name} as ${item.is_checked ? 'unchecked' : 'checked'}`}
        testId={`grocery-check-${item.id}`}
      />

      <span
        className={[
          'flex-1 text-base',
          item.is_checked ? 'text-muted-foreground line-through' : 'text-foreground',
        ].join(' ')}
      >
        {item.name}
        {item.quantity_text && (
          <span className="ml-2 text-sm text-muted-foreground">{item.quantity_text}</span>
        )}
        {item.is_staple && (
          <Badge variant="outline" className="ml-2 gap-1 py-0 text-xs text-amber-600 border-amber-300">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            Staple
          </Badge>
        )}
      </span>

      {/* Actual price */}
      {editingPrice ? (
        <Input
          type="number"
          min="0"
          step="0.01"
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          onBlur={commitPrice}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitPrice();
            else if (e.key === 'Escape') setEditingPrice(false);
          }}
          className="w-24 h-8 text-sm"
          placeholder="0.00"
          autoFocus
          data-testid={`grocery-price-input-${item.id}`}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingPrice(true)}
          className="min-w-[4rem] rounded px-2 py-1 text-right text-sm text-muted-foreground hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={item.actual_price != null ? `Price: £${item.actual_price.toFixed(2)}, tap to edit` : 'Add price'}
          data-testid={`grocery-price-${item.id}`}
        >
          {item.actual_price != null ? `£${item.actual_price.toFixed(2)}` : <span className="opacity-40">+ price</span>}
        </button>
      )}

      {/* Staple toggle */}
      <button
        type="button"
        onClick={() => onToggleStaple(item)}
        aria-label={item.is_staple ? 'Remove staple flag' : 'Mark as staple'}
        className={[
          'rounded p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          item.is_staple
            ? 'text-amber-500 hover:text-amber-600'
            : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-amber-500',
        ].join(' ')}
        data-testid={`grocery-staple-${item.id}`}
      >
        <Star className={['h-4 w-4', item.is_staple ? 'fill-amber-400' : ''].join(' ')} />
      </button>

      <Button
        variant="ghost"
        className="h-8 w-8 shrink-0 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
        onClick={() => onDelete(item.id)}
        aria-label={`Remove ${item.name}`}
        data-testid={`grocery-delete-${item.id}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

// ─── Shopping list panel ───────────────────────────────────────────────────────
function ShoppingListPanel({
  list,
  onMarkDone,
  onDelete,
  onRename,
}: {
  list: ShoppingList;
  onMarkDone: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  const { data: items, isLoading } = useGroceryList({ shoppingListId: list.id });
  const updateItem = useUpdateGroceryItem();
  const createItem = useCreateGroceryItem();
  const deleteItem = useDeleteGroceryItem();
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(list.title);
  const [collapsed, setCollapsed] = useState(list.status === 'done');
  const listRef = useRef<HTMLUListElement>(null);

  const isDone = list.status === 'done';
  const checkedCount = items?.filter((i) => i.is_checked).length ?? 0;
  const totalCount = items?.length ?? 0;
  const totalActual = items?.reduce((sum, i) => sum + (i.actual_price ?? 0), 0) ?? 0;

  const addItem = () => {
    const name = newName.trim();
    if (!name) return;
    createItem.mutate(
      { name, quantity_text: newQty.trim() || undefined, shopping_list_id: list.id },
      { onSuccess: () => { setNewName(''); setNewQty(''); } }
    );
  };

  const commitTitle = () => {
    setEditingTitle(false);
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== list.title) onRename(list.id, trimmed);
    else setTitleInput(list.title);
  };

  return (
    <div
      className={[
        'rounded-xl border bg-card shadow-sm',
        isDone ? 'border-border/50 opacity-75' : 'border-border',
      ].join(' ')}
      data-testid={`shopping-list-${list.id}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        {editingTitle ? (
          <Input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              else if (e.key === 'Escape') { setTitleInput(list.title); setEditingTitle(false); }
            }}
            className="h-8 flex-1 text-base font-semibold"
            autoFocus
            data-testid={`shopping-list-title-input-${list.id}`}
          />
        ) : (
          <button
            type="button"
            onClick={() => { if (!isDone) setEditingTitle(true); }}
            className={[
              'flex-1 text-left font-heading text-base font-semibold text-foreground',
              !isDone ? 'hover:underline cursor-text' : 'cursor-default',
            ].join(' ')}
            aria-label={isDone ? list.title : `Rename list: ${list.title}`}
            data-testid={`shopping-list-title-${list.id}`}
          >
            {list.title}
          </button>
        )}

        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {checkedCount}/{totalCount}
        </span>
        {totalActual > 0 && (
          <span className="text-sm font-mono text-foreground whitespace-nowrap">
            £{totalActual.toFixed(2)}
          </span>
        )}

        {isDone ? (
          <Badge variant="outline" className="shrink-0 border-green-300 text-green-700 dark:border-green-700 dark:text-green-400">
            Done
          </Badge>
        ) : (
          <Button
            className="shrink-0 gap-1.5 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950 px-3 py-1.5 text-sm"
            variant="outline"
            onClick={() => onMarkDone(list.id)}
            data-testid={`shopping-list-done-${list.id}`}
          >
            <Check className="h-3.5 w-3.5" />
            Mark done
          </Button>
        )}

        <Button
          variant="ghost"
          className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(list.id)}
          aria-label={`Delete list: ${list.title}`}
          data-testid={`shopping-list-delete-${list.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          className="h-8 w-8 shrink-0 p-0 text-muted-foreground"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand list' : 'Collapse list'}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {!collapsed && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {/* Add item row — only for active lists */}
          {!isDone && (
            <div className="flex flex-wrap gap-2" data-testid={`grocery-add-${list.id}`}>
              <Input
                placeholder="Add item"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                className="max-w-xs"
                data-testid={`grocery-new-name-${list.id}`}
              />
              <Input
                placeholder="Qty"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="w-20"
                data-testid={`grocery-new-qty-${list.id}`}
              />
              <Button
                onClick={addItem}
                disabled={!newName.trim() || createItem.isPending}
                data-testid={`grocery-add-button-${list.id}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : !items || items.length === 0 ? (
            <p className="text-muted-foreground text-sm py-2">No items yet. Add one above.</p>
          ) : (
            <ul ref={listRef} className="space-y-2" data-testid={`grocery-list-${list.id}`}>
              {items.map((item) => (
                <GroceryItemRow
                  key={item.id}
                  item={item}
                  onToggleChecked={(i) => updateItem.mutate({ id: i.id, is_checked: !i.is_checked })}
                  onToggleStaple={(i) => updateItem.mutate({ id: i.id, is_staple: !i.is_staple })}
                  onPriceChange={(i, price) => {
                    const parsed = parseFloat(price);
                    updateItem.mutate({ id: i.id, actual_price: isNaN(parsed) ? null : parsed });
                  }}
                  onDelete={(id) => deleteItem.mutate(id)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Staples panel ─────────────────────────────────────────────────────────────
function StaplesPanel({ activeListId }: { activeListId: string | null }) {
  const { data: staples, isLoading } = useGroceryList({ isStaple: true });
  const createItem = useCreateGroceryItem();
  const [open, setOpen] = useState(false);

  const ungroupedStaples = staples?.filter((s) => !s.is_checked) ?? [];
  if (ungroupedStaples.length === 0 && !isLoading) return null;

  const addToList = (staple: GroceryItem) => {
    if (!activeListId) return;
    createItem.mutate({ name: staple.name, quantity_text: staple.quantity_text ?? undefined, shopping_list_id: activeListId, is_staple: false });
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
        <span className="flex-1 font-heading text-sm font-semibold text-foreground">
          Staples ({ungroupedStaples.length})
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t border-amber-200 dark:border-amber-800 px-4 pb-3 pt-2 space-y-1.5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-2">
                Tap to add to your current list. Staples are items you buy regularly.
              </p>
              <div className="flex flex-wrap gap-2">
                {ungroupedStaples.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addToList(s)}
                    disabled={!activeListId || createItem.isPending}
                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-background px-3 py-1 text-sm hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 dark:border-amber-700 dark:hover:bg-amber-950"
                    data-testid={`staple-add-${s.id}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {s.name}
                    {s.quantity_text && <span className="text-muted-foreground">{s.quantity_text}</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function GroceryPageClient() {
  const { data: lists, isLoading: listsLoading, error: listsError } = useShoppingLists();
  const createList = useCreateShoppingList();
  const updateList = useUpdateShoppingList();
  const deleteList = useDeleteShoppingList();
  const generateFromPlan = useGenerateGroceryFromMealPlan();
  const qc = useQueryClient();
  const [newListTitle, setNewListTitle] = useState('');
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);

  const activeLists = lists?.filter((l) => l.status === 'active') ?? [];
  const doneLists = lists?.filter((l) => l.status === 'done') ?? [];
  const activeListId = activeLists[0]?.id ?? null;

  // Realtime: subscribe to both shopping_lists and grocery_items
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('grocery_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_items' }, () => {
        qc.invalidateQueries({ queryKey: ['grocery'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_lists' }, () => {
        qc.invalidateQueries({ queryKey: ['shopping-lists'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const handleCreateList = () => {
    const title = newListTitle.trim() || 'Shopping list';
    createList.mutate({ title }, {
      onSuccess: () => { setNewListTitle(''); setShowNewListInput(false); },
    });
  };

  if (listsError) {
    return <p className="text-destructive" data-testid="grocery-error">{listsError.message}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl uppercase tracking-widest text-foreground">
          Shopping lists
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => generateFromPlan.mutate(
              { create_shopping_task: true },
              {
                onSuccess: (data) => {
                  if (data.created > 0) setGenerateMessage(`Added ${data.created} item${data.created !== 1 ? 's' : ''} from your meal plan.`);
                  else setGenerateMessage('No recipe-based meals in your plan this week.');
                  setTimeout(() => setGenerateMessage(null), 5000);
                },
              }
            )}
            disabled={generateFromPlan.isPending}
            variant="outline"
            className="gap-2"
            data-testid="grocery-generate-from-plan"
          >
            <ShoppingCart className="h-4 w-4" />
            {generateFromPlan.isPending ? 'Generating…' : 'Generate from meal plan'}
          </Button>
          <Button
            onClick={() => setShowNewListInput((v) => !v)}
            className="gap-2"
            data-testid="grocery-new-list-button"
          >
            <Plus className="h-4 w-4" />
            New list
          </Button>
        </div>
      </div>

      {generateFromPlan.error && (
        <p className="text-destructive text-sm" data-testid="grocery-generate-error">
          {generateFromPlan.error.message}
        </p>
      )}
      {generateMessage && (
        <p className="text-muted-foreground text-sm" data-testid="grocery-generate-message">
          {generateMessage}
        </p>
      )}

      {/* New list form */}
      {showNewListInput && (
        <div className="flex gap-2" data-testid="grocery-new-list-form">
          <Input
            placeholder="List title, e.g. Weekly shop"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateList();
              else if (e.key === 'Escape') setShowNewListInput(false);
            }}
            className="max-w-xs"
            autoFocus
            data-testid="grocery-new-list-title"
          />
          <Button onClick={handleCreateList} disabled={createList.isPending} data-testid="grocery-new-list-submit">
            Create
          </Button>
          <Button variant="outline" onClick={() => setShowNewListInput(false)}>
            Cancel
          </Button>
        </div>
      )}

      {listsLoading ? (
        <p className="text-muted-foreground text-sm" data-testid="grocery-loading">Loading…</p>
      ) : activeLists.length === 0 && doneLists.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground"
          data-testid="grocery-empty"
        >
          <p>No shopping lists yet.</p>
          <p className="mt-1 text-sm">Create a new list to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active lists */}
          {activeLists.map((list) => (
            <ShoppingListPanel
              key={list.id}
              list={list}
              onMarkDone={(id) => updateList.mutate({ id, status: 'done' })}
              onDelete={(id) => deleteList.mutate(id)}
              onRename={(id, title) => updateList.mutate({ id, title })}
            />
          ))}

          {/* Staples quick-add */}
          <StaplesPanel activeListId={activeListId} />

          {/* Completed lists */}
          {doneLists.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Completed ({doneLists.length})
              </h2>
              {doneLists.map((list) => (
                <ShoppingListPanel
                  key={list.id}
                  list={list}
                  onMarkDone={(id) => updateList.mutate({ id, status: 'done' })}
                  onDelete={(id) => deleteList.mutate(id)}
                  onRename={(id, title) => updateList.mutate({ id, title })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

