import React, { type PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

type QueryClientProviderProps = React.ComponentProps<typeof QueryClientProvider>;

export function QueryProvider({ children }: PropsWithChildren) {
  const safeChildren = children as QueryClientProviderProps['children'];
  return <QueryClientProvider client={queryClient}>{safeChildren}</QueryClientProvider>;
}
