'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar, Plus, RefreshCw } from 'lucide-react';
import type { Database } from '@/lib/supabase/database.types';

type Paycycle = Database['public']['Tables']['paycycles']['Row'];
type Household = Database['public']['Tables']['households']['Row'];

interface PaycycleOption {
  id: string;
  name: string | null;
  start_date: string;
  end_date: string;
  status: string;
}

interface BlueprintHeaderProps {
  paycycle: Paycycle;
  household: Household;
  allPaycycles: PaycycleOption[];
  onCycleChange: (cycleId: string) => void;
  onCreateNext?: () => void;
  onResyncDraft?: () => void;
}

export function BlueprintHeader({
  paycycle,
  household,
  allPaycycles,
  onCycleChange,
  onCreateNext,
  onResyncDraft,
}: BlueprintHeaderProps) {
  const startDate = format(new Date(paycycle.start_date), 'MMM d');
  const endDate = format(new Date(paycycle.end_date), 'MMM d, yyyy');

  return (
    <header className="border-b border-border bg-card sticky top-0 z-10">
      <div className="content-wrapper py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-headline-sm md:text-headline uppercase text-foreground">
              Your Blueprint
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>
                {household.is_couple
                  ? `Managing £${Number(paycycle.total_income).toFixed(2)} together`
                  : `Managing £${Number(paycycle.total_income).toFixed(2)} monthly`}
              </span>
              <span className="flex items-center gap-1" aria-label="Pay cycle dates">
                <Calendar className="w-4 h-4" aria-hidden />
                {startDate} – {endDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={paycycle.id}
              onValueChange={onCycleChange}
              aria-label="Select pay cycle"
            >
              <SelectTrigger className="min-w-[240px] w-full max-w-[320px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allPaycycles.map((cycle) => (
                  <SelectItem key={cycle.id} value={cycle.id}>
                    {cycle.name || format(new Date(cycle.start_date), 'MMM yyyy')}
                    {cycle.status === 'active' && ' (Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {paycycle.status === 'active' && onCreateNext && (
              <Button
                variant="outline"
                className="px-4 py-2 text-sm"
                onClick={onCreateNext}
              >
                <Plus className="w-4 h-4 mr-2" aria-hidden />
                Create Next Cycle
              </Button>
            )}
            {paycycle.status === 'draft' && onResyncDraft && (
              <Button
                variant="outline"
                className="px-4 py-2 text-sm"
                onClick={onResyncDraft}
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden />
                Resync from current
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
