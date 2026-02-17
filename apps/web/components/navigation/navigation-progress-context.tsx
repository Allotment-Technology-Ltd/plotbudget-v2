'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type NavigationProgressContextValue = {
  isNavigating: boolean;
  setNavigating: (value: boolean) => void;
};

const NavigationProgressContext = createContext<NavigationProgressContextValue | null>(null);

export function useNavigationProgress() {
  const ctx = useContext(NavigationProgressContext);
  return ctx ?? { isNavigating: false, setNavigating: () => {} };
}

export function NavigationProgressProvider({ children }: { children: ReactNode }) {
  const [isNavigating, setNavigatingState] = useState(false);
  const setNavigating = useCallback((value: boolean) => {
    setNavigatingState(value);
  }, []);
  const value: NavigationProgressContextValue = { isNavigating, setNavigating };
  return (
    <NavigationProgressContext.Provider value={value}>
      {children}
    </NavigationProgressContext.Provider>
  );
}
