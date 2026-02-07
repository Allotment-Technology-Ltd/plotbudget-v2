'use client';

import { User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Database } from '@/lib/supabase/database.types';

type Seed = Database['public']['Tables']['seeds']['Row'];
type Household = Database['public']['Tables']['households']['Row'];

interface RitualTransferSummaryProps {
  seeds: Seed[];
  household: Household;
  userAvatarUrl?: string | null;
  avatarEnabled?: boolean;
}

/**
 * Transfer to Joint: only JOINT seeds with uses_joint_account = true.
 * Sum total and split by amount_me / amount_partner.
 */
function getJointTransfer(seeds: Seed[]) {
  const jointTransferSeeds = seeds.filter(
    (s) => s.payment_source === 'joint' && s.uses_joint_account === true
  );
  const totalJointTransfer = jointTransferSeeds.reduce(
    (sum, s) => sum + Number(s.amount),
    0
  );
  const userJointTransfer = jointTransferSeeds.reduce(
    (sum, s) => sum + Number(s.amount_me),
    0
  );
  const partnerJointTransfer = jointTransferSeeds.reduce(
    (sum, s) => sum + Number(s.amount_partner),
    0
  );
  return { totalJointTransfer, userJointTransfer, partnerJointTransfer };
}

/**
 * Your Set-Aside: personal bills (payment_source = 'me') + joint bills paid from own account (uses_joint_account = false), user's share.
 */
function getUserSetAside(seeds: Seed[]) {
  const userPersonalSeeds = seeds.filter((s) => s.payment_source === 'me');
  const userJointFromOwnAccount = seeds.filter(
    (s) => s.payment_source === 'joint' && s.uses_joint_account === false
  );
  return (
    userPersonalSeeds.reduce((sum, s) => sum + Number(s.amount), 0) +
    userJointFromOwnAccount.reduce((sum, s) => sum + Number(s.amount_me), 0)
  );
}

/**
 * Partner's Set-Aside: partner's personal bills + joint from own account (partner's share).
 */
function getPartnerSetAside(seeds: Seed[]) {
  const partnerPersonalSeeds = seeds.filter(
    (s) => s.payment_source === 'partner'
  );
  const partnerJointFromOwnAccount = seeds.filter(
    (s) => s.payment_source === 'joint' && s.uses_joint_account === false
  );
  return (
    partnerPersonalSeeds.reduce((sum, s) => sum + Number(s.amount), 0) +
    partnerJointFromOwnAccount.reduce(
      (sum, s) => sum + Number(s.amount_partner),
      0
    )
  );
}

export function RitualTransferSummary({
  seeds,
  household,
  userAvatarUrl,
  avatarEnabled = false,
}: RitualTransferSummaryProps) {
  const { totalJointTransfer, userJointTransfer, partnerJointTransfer } =
    getJointTransfer(seeds);
  const userSetAside = getUserSetAside(seeds);
  const partnerSetAside = getPartnerSetAside(seeds);
  const partnerName = household.partner_name || 'Partner';

  return (
    <div
      className="bg-card rounded-lg p-6 border border-primary/30 mb-8"
      aria-labelledby="ritual-transfer-heading"
    >
      <h2
        id="ritual-transfer-heading"
        className="font-heading text-xl uppercase tracking-wider text-foreground mb-6"
      >
        Payday Transfers
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {totalJointTransfer > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              Transfer to Joint Account
            </p>
            <p className="text-3xl font-display text-primary">
              £{totalJointTransfer.toFixed(2)}
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>You: £{userJointTransfer.toFixed(2)}</p>
              <p>{partnerName}: £{partnerJointTransfer.toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="space-y-2 flex flex-col">
          <div className="flex items-center gap-2">
            {avatarEnabled && userAvatarUrl ? (
              <Avatar className="h-10 w-10 shrink-0 rounded-full border border-border">
                <AvatarImage src={userAvatarUrl} alt="" className="avatar-pixelated object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  <User className="w-5 h-5" aria-hidden />
                </AvatarFallback>
              </Avatar>
            ) : null}
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              Your Set-Aside
            </p>
          </div>
          <p className="text-3xl font-display text-foreground">
            £{userSetAside.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            Keep this in your account for your bills
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            {partnerName}&apos;s Set-Aside
          </p>
          <p className="text-3xl font-display text-foreground">
            £{partnerSetAside.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            They keep this for their bills
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-md bg-muted" role="status">
        <p className="text-sm text-foreground">
          <strong className="text-primary">How it works:</strong> Transfer the
          amounts above on payday, then check off each bill as you pay it
          throughout the month.
        </p>
      </div>
    </div>
  );
}
