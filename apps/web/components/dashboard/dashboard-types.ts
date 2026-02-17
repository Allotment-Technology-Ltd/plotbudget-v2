import type { Household, PayCycle, Seed, Pot, Repayment } from '@repo/supabase';

export type HistoricalCycle = Pick<
  PayCycle,
  | 'id'
  | 'name'
  | 'start_date'
  | 'end_date'
  | 'total_income'
  | 'total_allocated'
  | 'alloc_needs_me'
  | 'alloc_needs_partner'
  | 'alloc_needs_joint'
  | 'alloc_wants_me'
  | 'alloc_wants_partner'
  | 'alloc_wants_joint'
  | 'alloc_savings_me'
  | 'alloc_savings_partner'
  | 'alloc_savings_joint'
  | 'alloc_repay_me'
  | 'alloc_repay_partner'
  | 'alloc_repay_joint'
>;

export type IncomeEventDisplay = {
  sourceName: string;
  amount: number;
  date: string;
  payment_source: 'me' | 'partner' | 'joint';
};

export interface DashboardClientProps {
  household: Household;
  currentPaycycle: PayCycle | null;
  seeds: Seed[];
  pots: Pot[];
  repayments: Repayment[];
  historicalCycles: HistoricalCycle[];
  hasDraftCycle: boolean;
  incomeEvents?: IncomeEventDisplay[];
  isPartner?: boolean;
  ownerLabel?: string;
  partnerLabel?: string;
  userId?: string;
  foundingMemberUntil?: string | null;
}
