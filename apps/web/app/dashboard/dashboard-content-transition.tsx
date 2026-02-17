'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useNavigationProgress } from '@/components/navigation/navigation-progress-context';
import { NavigationProgressBar } from '@/components/navigation/navigation-progress-bar';

function PathnameSync() {
  const pathname = usePathname();
  const { setNavigating } = useNavigationProgress();
  useEffect(() => {
    setNavigating(false);
  }, [pathname, setNavigating]);
  return null;
}

function ContentWithFadeIn({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export function DashboardContentTransition({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavigationProgressBar />
      <PathnameSync />
      <ContentWithFadeIn>{children}</ContentWithFadeIn>
    </>
  );
}
