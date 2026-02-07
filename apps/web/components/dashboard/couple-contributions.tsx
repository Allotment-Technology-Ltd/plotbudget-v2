'use client';

import { motion } from 'framer-motion';
import type { Household, PayCycle, Seed } from '@/lib/supabase/database.types';

interface CoupleContributionsProps {
  household: Household;
  paycycle: PayCycle;
  seeds: Seed[];
  isPartner?: boolean;
  otherLabel?: string;
}

/**
 * Sum of allocated amounts by payment source (me / partner / joint) for display.
 */
function sumBySource(
  paycycle: PayCycle
): { me: number; partner: number; joint: number } {
  const me =
    paycycle.alloc_needs_me +
    paycycle.alloc_wants_me +
    paycycle.alloc_savings_me +
    paycycle.alloc_repay_me;
  const partner =
    paycycle.alloc_needs_partner +
    paycycle.alloc_wants_partner +
    paycycle.alloc_savings_partner +
    paycycle.alloc_repay_partner;
  const joint =
    paycycle.alloc_needs_joint +
    paycycle.alloc_wants_joint +
    paycycle.alloc_savings_joint +
    paycycle.alloc_repay_joint;
  return { me, partner, joint };
}

/**
 * Joint amount split by household joint_ratio (user portion vs partner portion).
 */
function jointSplit(
  jointTotal: number,
  jointRatio: number
): { me: number; partner: number } {
  const me = jointTotal * jointRatio;
  const partner = jointTotal - me;
  return { me, partner };
}

export function CoupleContributions({
  household,
  paycycle,
  isPartner = false,
  otherLabel = 'Partner',
}: CoupleContributionsProps) {
  const totals = sumBySource(paycycle);
  const ratio = household.joint_ratio ?? 0.5;
  const { me: jointMe, partner: jointPartner } = jointSplit(
    totals.joint,
    ratio
  );

  const youTotal = totals.me + jointMe;
  const partnerTotal = totals.partner + jointPartner;
  const youDisplayTotal = isPartner ? partnerTotal : youTotal;
  const otherDisplayTotal = isPartner ? youTotal : partnerTotal;
  const youJoint = isPartner ? jointPartner : jointMe;
  const otherJoint = isPartner ? jointMe : jointPartner;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-lg p-6 border border-border"
      aria-label="Couple contributions"
    >
      <h2 className="font-heading text-xl uppercase tracking-wider mb-6">
        Couple Contributions
      </h2>

      <div className="space-y-4">
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-muted-foreground">You</span>
          <span className="font-display text-lg min-w-0 break-all">
            £{youDisplayTotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-sm text-muted-foreground">
            {otherLabel}
          </span>
          <span className="font-display text-lg min-w-0 break-all">
            £{otherDisplayTotal.toFixed(2)}
          </span>
        </div>

        {totals.joint > 0 && (
          <div className="pt-4 mt-4 border-t border-border">
            <p className="text-xs font-heading uppercase tracking-wider text-muted-foreground mb-2">
              Joint transfer total
            </p>
            <p className="text-sm text-foreground mb-2">
              £{totals.joint.toFixed(2)} total
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
              <span>You: £{youJoint.toFixed(2)}</span>
              <span>{otherLabel}: £{otherJoint.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
