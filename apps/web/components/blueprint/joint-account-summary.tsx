'use client';

import { Wallet, User, Users } from 'lucide-react';
import type { Database } from '@/lib/supabase/database.types';

type Household = Database['public']['Tables']['households']['Row'];
type Seed = Database['public']['Tables']['seeds']['Row'];

interface JointAccountSummaryProps {
  household: Household;
  seeds: Seed[];
}

export function JointAccountSummary({
  household,
  seeds,
}: JointAccountSummaryProps) {
  if (!household.is_couple) return null;

  const partnerName = household.partner_name || 'Partner';

  const jointSeeds = seeds.filter((s) => s.payment_source === 'joint');
  const jointTransferSeeds = jointSeeds.filter((s) => s.uses_joint_account);
  const jointOwnAccountSeeds = jointSeeds.filter((s) => !s.uses_joint_account);

  const jointTotal = jointTransferSeeds.reduce((sum, s) => sum + s.amount, 0);
  const userJointTransfer = jointTransferSeeds.reduce(
    (sum, s) => sum + s.amount_me,
    0
  );
  const partnerJointTransfer = jointTransferSeeds.reduce(
    (sum, s) => sum + s.amount_partner,
    0
  );

  const userMeTotal = seeds
    .filter((s) => s.payment_source === 'me')
    .reduce((sum, s) => sum + s.amount, 0);

  const userJointOwnAccount = jointOwnAccountSeeds.reduce(
    (sum, s) => sum + s.amount_me,
    0
  );

  const partnerTotal = seeds
    .filter((s) => s.payment_source === 'partner')
    .reduce((sum, s) => sum + s.amount, 0);

  const partnerJointOwnAccount = jointOwnAccountSeeds.reduce(
    (sum, s) => sum + s.amount_partner,
    0
  );

  const userTotalSetAside = userMeTotal + userJointOwnAccount;
  const partnerTotalSetAside = partnerTotal + partnerJointOwnAccount;

  if (jointTotal === 0 && userTotalSetAside === 0 && partnerTotalSetAside === 0) {
    return null;
  }

  return (
    <section
      className="bg-card rounded-lg p-6 border border-border"
      aria-labelledby="joint-summary-heading"
    >
      <h2
        id="joint-summary-heading"
        className="font-heading text-xl uppercase tracking-wider text-foreground mb-4 flex items-center gap-2"
      >
        <Users className="w-5 h-5" aria-hidden />
        Joint Account &amp; Personal Set-Aside
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        {jointTotal > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-md bg-primary/5 border border-primary/20">
            <Wallet className="w-5 h-5 text-primary mt-0.5" aria-hidden />
            <div>
              <p className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
                Transfer to Joint
              </p>
              <p className="text-xl font-display text-foreground">
                £{jointTotal.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You: £{userJointTransfer.toFixed(2)} • {partnerName}: £
                {partnerJointTransfer.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 rounded-md bg-background border border-border">
          <User className="w-5 h-5 text-primary mt-0.5" aria-hidden />
          <div>
            <p className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
              Your Set-Aside
            </p>
            <p className="text-xl font-display text-foreground">
              £{userTotalSetAside.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your bills (£{userMeTotal.toFixed(2)}) + your share of joint
              paid from own account (£{userJointOwnAccount.toFixed(2)})
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-md bg-background border border-border">
          <User className="w-5 h-5 text-primary mt-0.5" aria-hidden />
          <div>
            <p className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
              {partnerName}&apos;s Set-Aside
            </p>
            <p className="text-xl font-display text-foreground">
              £{partnerTotalSetAside.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Their bills (£{partnerTotal.toFixed(2)}) + their share of joint
              paid from own account (£{partnerJointOwnAccount.toFixed(2)})
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
