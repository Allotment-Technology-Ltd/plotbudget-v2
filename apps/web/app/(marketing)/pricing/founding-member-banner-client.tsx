'use client';

import { useState, useEffect } from 'react';
import { getMyFoundingMemberStatus } from '@/lib/actions/household-actions';

export function FoundingMemberBannerClient() {
  const [foundingMemberUntil, setFoundingMemberUntil] = useState<string | null>(null);

  useEffect(() => {
    getMyFoundingMemberStatus().then(({ foundingMemberUntil: until }) => {
      setFoundingMemberUntil(until);
    });
  }, []);

  if (!foundingMemberUntil) return null;

  const end = new Date(foundingMemberUntil);
  if (end <= new Date()) return null;

  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  if (end <= oneMonthFromNow) return null;

  const founderDate = end.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="mb-12 rounded-lg border border-primary/30 bg-primary/5 px-6 py-4 text-center">
      <p className="font-heading text-sm uppercase tracking-wider text-primary mb-2">
        Founding Member
      </p>
      <p className="text-sm text-muted-foreground">
        You have 12 months of Premium access free until {founderDate}. Thanks for being here from the start — your support for PLOT means everything.
      </p>
    </div>
  );
}
