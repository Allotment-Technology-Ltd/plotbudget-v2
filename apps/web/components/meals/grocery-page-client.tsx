'use client';

import { useEffect, useRef } from 'react';
import {
  useGroceryList,
  useUpdateGroceryItem,
  useCreateGroceryItem,
  useGenerateGroceryFromMealPlan,
  useDeleteGroceryItem,
} from '@/hooks/use-meals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ShoppingCart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function GroceryPageClient() {
  const { data: items, isLoading, error } = useGroceryList();
  const updateItem = useUpdateGroceryItem();
  const createItem = useCreateGroceryItem();
  const generateFromPlan = useGenerateGroceryFromMealPlan();
  const deleteItem = useDeleteGroceryItem();
  const qc = useQueryClient();
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Realtime: subscribe to grocery_items changes for this household (client-only)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('grocery_items')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'grocery_items' },
        () => {
          qc.invalidateQueries({ queryKey: ['grocery'] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const addItem = () => {
    const name = newName.trim();
    if (!name) return;
    createItem.mutate(
      { name, quantity_text: newQty.trim() || undefined },
      {
        onSuccess: () => {
          setNewName('');
          setNewQty('');
        },
      }
    );
  };

  const toggleChecked = (id: string, is_checked: boolean) => {
    updateItem.mutate({ id, is_checked: !is_checked });
  };

  if (error) {
    return (
      <p className="text-destructive" data-testid="grocery-error">
        {error.message}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-2xl uppercase tracking-widest text-foreground">
          Shopping list
        </h1>
        <Button
          onClick={() =>
            generateFromPlan.mutate(
              { create_shopping_task: true },
              {
                onSuccess: (data) => {
                  if (data.created > 0) setGenerateMessage(`Added ${data.created} item${data.created !== 1 ? 's' : ''} from your meal plan.`);
                  else setGenerateMessage('No recipe-based meals in your plan this week. Add recipes to your meal plan first.');
                  setTimeout(() => setGenerateMessage(null), 5000);
                },
                onError: () => {
                  setGenerateMessage(null);
                },
              }
            )
          }
          disabled={generateFromPlan.isPending}
          variant="outline"
          className="gap-2"
          data-testid="grocery-generate-from-plan"
        >
          <ShoppingCart className="h-4 w-4" />
          {generateFromPlan.isPending
            ? 'Generating…'
            : 'Generate from meal plan'}
        </Button>
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

      <div className="flex flex-wrap gap-2" data-testid="grocery-add">
        <Input
          placeholder="Add item"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          className="max-w-xs"
          data-testid="grocery-new-name"
        />
        <Input
          placeholder="Qty"
          value={newQty}
          onChange={(e) => setNewQty(e.target.value)}
          className="w-20"
          data-testid="grocery-new-qty"
        />
        <Button
          onClick={addItem}
          disabled={!newName.trim() || createItem.isPending}
          data-testid="grocery-add-button"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm" data-testid="grocery-loading">
          Loading…
        </p>
      ) : !items || items.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground"
          data-testid="grocery-empty"
        >
          <p>Your shopping list is empty.</p>
          <p className="mt-1 text-sm">
            Add items above or generate from your meal plan.
          </p>
        </div>
      ) : (
        <ul ref={listRef} className="space-y-2" data-testid="grocery-list">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2"
              data-testid={`grocery-item-${item.id}`}
            >
              <input
                type="checkbox"
                checked={item.is_checked}
                onChange={() => toggleChecked(item.id, item.is_checked)}
                aria-label={`Mark ${item.name} as ${item.is_checked ? 'unchecked' : 'checked'}`}
                data-testid={`grocery-check-${item.id}`}
                className="h-4 w-4 rounded border-border"
              />
              <span
                className={
                  item.is_checked
                    ? 'flex-1 text-muted-foreground line-through'
                    : 'flex-1 text-foreground'
                }
              >
                {item.name}
                {item.quantity_text && (
                  <span className="ml-2 text-muted-foreground">
                    {item.quantity_text}
                  </span>
                )}
              </span>
              <Button
                variant="ghost"
                className="text-sm py-1.5 px-2"
                onClick={() => deleteItem.mutate(item.id)}
                disabled={deleteItem.isPending}
                aria-label={`Remove ${item.name}`}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
