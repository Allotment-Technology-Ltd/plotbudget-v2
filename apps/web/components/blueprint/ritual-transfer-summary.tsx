'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { currencySymbol } from '@/lib/utils/currency';
import type { Database } from '@/lib/supabase/database.types';

type Seed = Database['public']['Tables']['seeds']['Row'];
type Household = Database['public']['Tables']['households']['Row'];

interface RitualTransferSummaryProps {
  seeds: Seed[];
  household: Household;
  userAvatarUrl?: string | null;
  /** Fallback initials when no OAuth avatar (e.g. "A" or "FL"). */
  userInitials?: string;
  isPartner?: boolean;
  otherLabel?: string;
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
  userInitials = '?',
  isPartner = false,
  otherLabel = 'Partner',
}: RitualTransferSummaryProps) {
  const { totalJointTransfer, userJointTransfer, partnerJointTransfer } =
    getJointTransfer(seeds);
  const userSetAside = getUserSetAside(seeds);
  const partnerSetAside = getPartnerSetAside(seeds);
  const otherName = otherLabel;
  const currency = household.currency || 'GBP';

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
              {currencySymbol(currency)}{totalJointTransfer.toFixed(2)}
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>You: {currencySymbol(currency)}{(isPartner ? partnerJointTransfer : userJointTransfer).toFixed(2)}</p>
              <p>{otherName}: {currencySymbol(currency)}{(isPartner ? userJointTransfer : partnerJointTransfer).toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="space-y-2 flex flex-col">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 shrink-0 rounded-full border border-border">
              {userAvatarUrl ? (
                <AvatarImage src={userAvatarUrl} alt="" className="avatar-pixelated object-cover" />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-display">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              Your Set-Aside
            </p>
          </div>
          <p className="text-3xl font-display text-foreground">
            {currencySymbol(currency)}{(isPartner ? partnerSetAside : userSetAside).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            Keep this in your account for your bills
          </p>
        </div>

        <div className="space-y-2 flex flex-col">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 shrink-0 rounded-full border border-border">
              <AvatarFallback className="bg-secondary/10 text-secondary-foreground text-sm font-display">
                {(otherName || '?').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              {otherName}&apos;s Set-Aside
            </p>
          </div>
          <p className="text-3xl font-display text-foreground">
            {currencySymbol(currency)}{(isPartner ? userSetAside : partnerSetAside).toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">
            They keep this for their bills
          </p>
        </div>
      </div>
    </div>
  );
}
