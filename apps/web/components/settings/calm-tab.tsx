'use client';

import { useCalm } from '@/components/providers/calm-provider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function CalmTab() {
  const { reduceMotion, setReduceMotion, celebrations, setCelebrations } = useCalm();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground max-w-xl">
        You decide how much PLOT initiates interaction. These settings put you in control — no
        surprises, no extra pings.
      </p>

      <section className="bg-card rounded-lg border border-border p-6 space-y-6">
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">
          Motion &amp; animation
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="calm-reduce-motion" className="text-base font-medium">
              Reduce motion
            </Label>
            <p className="text-sm text-muted-foreground">
              Minimise or skip animations and transitions. We also respect your system
              accessibility setting.
            </p>
          </div>
          <Switch
            id="calm-reduce-motion"
            checked={reduceMotion}
            onCheckedChange={setReduceMotion}
            aria-describedby="calm-reduce-motion-desc"
          />
        </div>
      </section>

      <section className="bg-card rounded-lg border border-border p-6 space-y-6">
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground">
          Celebrations
        </h2>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="calm-celebrations" className="text-base font-medium">
              Show celebration screens
            </Label>
            <p className="text-sm text-muted-foreground">
              After onboarding or finishing your payday ritual, show a short celebration. Turn off
              for a quicker, minimal flow.
            </p>
          </div>
          <Switch
            id="calm-celebrations"
            checked={celebrations}
            onCheckedChange={setCelebrations}
            aria-describedby="calm-celebrations-desc"
          />
        </div>
      </section>

      <section className="bg-card rounded-lg border border-border p-6">
        <h2 className="font-heading text-lg uppercase tracking-wider text-foreground mb-2">
          Notifications
        </h2>
        <p className="text-sm text-muted-foreground">
          We only send a payday reminder by default — no &quot;we miss you&quot; or re-engagement
          messages. You control when PLOT reaches out. Manage notifications in your device or
          browser settings.
        </p>
      </section>
    </div>
  );
}
