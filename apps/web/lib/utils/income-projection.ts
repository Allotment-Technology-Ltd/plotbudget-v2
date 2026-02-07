/**
 * Projection engine: given a budget cycle window and active income sources,
 * compute total projected income and per-source breakdown (including double-dip for 4-weekly).
 */

import { getPaymentDatesInRange, type FrequencyRule } from './pay-cycle-dates';

export type PaymentSource = 'me' | 'partner' | 'joint';

export interface IncomeSourceForProjection {
  id: string;
  name?: string;
  amount: number;
  frequency_rule: FrequencyRule;
  day_of_month: number | null;
  anchor_date: string | null;
  payment_source: PaymentSource;
}

/** Single income event in a cycle (for display on Dashboard / Blueprint). */
export interface IncomeEvent {
  sourceName: string;
  amount: number;
  date: string;
  payment_source: PaymentSource;
}

export interface ProjectedIncomeResult {
  total: number;
  snapshot_user_income: number;
  snapshot_partner_income: number;
  /** Number of payment events per source (for debugging / UI) */
  eventsPerSource: { sourceId: string; count: number; amount: number }[];
}

/**
 * Project total income for a cycle window from active income sources.
 * Each source's payment dates in [cycleStart, cycleEnd] are counted (double-dip for 4-weekly).
 * Joint income is split by jointRatio into snapshot_user_income and snapshot_partner_income.
 */
export function projectIncomeForCycle(
  cycleStart: string,
  cycleEnd: string,
  sources: IncomeSourceForProjection[],
  jointRatio: number
): ProjectedIncomeResult {
  let total = 0;
  let me = 0;
  let partner = 0;
  const eventsPerSource: { sourceId: string; count: number; amount: number }[] = [];

  for (const src of sources) {
    const dates = getPaymentDatesInRange(
      cycleStart,
      cycleEnd,
      src.frequency_rule,
      src.day_of_month,
      src.anchor_date
    );
    const count = dates.length;
    const amount = Number(src.amount) * count;
    total += amount;
    eventsPerSource.push({ sourceId: src.id, count, amount });

    if (src.payment_source === 'me') {
      me += amount;
    } else if (src.payment_source === 'partner') {
      partner += amount;
    } else {
      me += amount * jointRatio;
      partner += amount * (1 - jointRatio);
    }
  }

  return {
    total: Math.round(total * 100) / 100,
    snapshot_user_income: Math.round(me * 100) / 100,
    snapshot_partner_income: Math.round(partner * 100) / 100,
    eventsPerSource,
  };
}

/**
 * Return all income events (with date and label) falling in [cycleStart, cycleEnd].
 * Use for displaying "Income this month" on Dashboard and Blueprint.
 */
export function getIncomeEventsForCycle(
  cycleStart: string,
  cycleEnd: string,
  sources: (IncomeSourceForProjection & { name: string })[]
): IncomeEvent[] {
  const events: IncomeEvent[] = [];
  for (const src of sources) {
    const dates = getPaymentDatesInRange(
      cycleStart,
      cycleEnd,
      src.frequency_rule,
      src.day_of_month,
      src.anchor_date
    );
    const name = src.name ?? 'Income';
    for (const date of dates) {
      events.push({
        sourceName: name,
        amount: Number(src.amount),
        date,
        payment_source: src.payment_source,
      });
    }
  }
  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
