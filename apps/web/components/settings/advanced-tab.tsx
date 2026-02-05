'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface CategoryRatios {
  needs: number;
  wants: number;
  savings: number;
  repay: number;
}

interface AdvancedTabProps {
  categoryRatios: CategoryRatios;
}

export function AdvancedTab({ categoryRatios }: AdvancedTabProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <section className="bg-card rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-6">
          Theme Preference
        </h2>
        <RadioGroup
          value={theme ?? 'system'}
          onValueChange={(value) => setTheme(value)}
          className="grid gap-3"
          aria-label="Theme preference"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="theme-light" />
            <Label htmlFor="theme-light" className="flex items-center gap-2 cursor-pointer font-body text-sm">
              <Sun className="h-4 w-4" aria-hidden />
              Light
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dark" id="theme-dark" />
            <Label htmlFor="theme-dark" className="flex items-center gap-2 cursor-pointer font-body text-sm">
              <Moon className="h-4 w-4" aria-hidden />
              Dark
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="system" id="theme-system" />
            <Label htmlFor="theme-system" className="flex items-center gap-2 cursor-pointer font-body text-sm">
              <Monitor className="h-4 w-4" aria-hidden />
              System
            </Label>
          </div>
        </RadioGroup>
        <p className="text-sm text-muted-foreground mt-4">
          Choose your preferred color scheme. System uses your device settings.
        </p>
      </section>

      <section className="bg-card rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-6">
          Budget Category Ratios
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex justify-between items-center rounded-md border border-border p-4">
            <span className="font-heading text-sm uppercase tracking-wider text-foreground">
              Needs
            </span>
            <span className="font-display text-lg text-foreground">
              {categoryRatios.needs ?? 50}%
            </span>
          </div>
          <div className="flex justify-between items-center rounded-md border border-border p-4">
            <span className="font-heading text-sm uppercase tracking-wider text-foreground">
              Wants
            </span>
            <span className="font-display text-lg text-foreground">
              {categoryRatios.wants ?? 30}%
            </span>
          </div>
          <div className="flex justify-between items-center rounded-md border border-border p-4">
            <span className="font-heading text-sm uppercase tracking-wider text-foreground">
              Savings
            </span>
            <span className="font-display text-lg text-foreground">
              {categoryRatios.savings ?? 10}%
            </span>
          </div>
          <div className="flex justify-between items-center rounded-md border border-border p-4">
            <span className="font-heading text-sm uppercase tracking-wider text-foreground">
              Repay
            </span>
            <span className="font-display text-lg text-foreground">
              {categoryRatios.repay ?? 10}%
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          These are your current budget ratios. To change them, use the
          Blueprint page.
        </p>
      </section>
    </div>
  );
}
