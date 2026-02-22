'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { ModuleFlags } from '@/lib/module-flags';

const ModuleFlagsContext = createContext<ModuleFlags | null>(null);

export function ModuleFlagsProvider({
  moduleFlags,
  children,
}: {
  moduleFlags: ModuleFlags;
  children: ReactNode;
}) {
  return (
    <ModuleFlagsContext.Provider value={moduleFlags}>
      {children}
    </ModuleFlagsContext.Provider>
  );
}

export function useModuleFlags(): ModuleFlags {
  const flags = useContext(ModuleFlagsContext);
  if (!flags) {
    return {
      money: true,
      home: false,
      tasks: false,
      calendar: false,
      meals: false,
      holidays: false,
      vault: false,
      kids: false,
    };
  }
  return flags;
}
