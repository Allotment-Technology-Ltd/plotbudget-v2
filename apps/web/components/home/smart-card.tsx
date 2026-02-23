'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getModule } from '@repo/logic';
import type { ModuleId } from '@repo/logic';

interface SmartCardProps {
  title: string;
  description: string;
  moduleId: ModuleId;
  href: string;
  icon?: string;
}

export function SmartCard({ title, description, moduleId, href }: SmartCardProps) {
  const moduleInfo = getModule(moduleId);
  const borderColor = moduleInfo.colorLight;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border/8 bg-card p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
    >
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-medium uppercase tracking-wide text-foreground">
          {title}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
