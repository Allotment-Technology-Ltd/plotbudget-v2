import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type OnboardingStatus = {
  completed: boolean | null;
  loading: boolean;
  refetch: () => Promise<void>;
};

const OnboardingStatusContext = createContext<OnboardingStatus | null>(null);

/**
 * Single source of truth for has_completed_onboarding so that when the
 * onboarding screen calls refetch() after submit, AuthGate sees the update
 * and does not redirect back to onboarding.
 */
export function OnboardingStatusProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!session?.user?.id) {
      setCompleted(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('has_completed_onboarding')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      setCompleted(null);
    } else {
      const row = data as { has_completed_onboarding?: boolean } | null;
      setCompleted(row?.has_completed_onboarding ?? false);
    }
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const value: OnboardingStatus = {
    completed,
    loading,
    refetch: fetchStatus,
  };

  return (
    <OnboardingStatusContext.Provider value={value}>
      {children}
    </OnboardingStatusContext.Provider>
  );
}

export function useOnboardingStatus(): OnboardingStatus {
  const ctx = useContext(OnboardingStatusContext);
  if (!ctx) {
    throw new Error('useOnboardingStatus must be used within OnboardingStatusProvider');
  }
  return ctx;
}
