import { describe, it, expect } from 'vitest';
import { projectIncomeForCycle } from './income-projection';

describe('projectIncomeForCycle', () => {
  it('returns zeros when no sources', () => {
    const r = projectIncomeForCycle('2024-01-01', '2024-01-31', [], 0.5);
    expect(r.total).toBe(0);
    expect(r.snapshot_user_income).toBe(0);
    expect(r.snapshot_partner_income).toBe(0);
    expect(r.eventsPerSource).toHaveLength(0);
  });

  it('single me source: one payment in range', () => {
    const r = projectIncomeForCycle(
      '2024-01-01',
      '2024-01-31',
      [
        {
          id: '1',
          amount: 2000,
          frequency_rule: 'specific_date',
          day_of_month: 25,
          anchor_date: null,
          payment_source: 'me',
        },
      ],
      0.5
    );
    expect(r.total).toBe(2000);
    expect(r.snapshot_user_income).toBe(2000);
    expect(r.snapshot_partner_income).toBe(0);
    expect(r.eventsPerSource).toEqual([{ sourceId: '1', count: 1, amount: 2000 }]);
  });

  it('double-dip 4-weekly: two payments in cycle', () => {
    const r = projectIncomeForCycle(
      '2024-01-01',
      '2024-02-29',
      [
        {
          id: '1',
          amount: 1000,
          frequency_rule: 'every_4_weeks',
          day_of_month: null,
          anchor_date: '2024-01-15',
          payment_source: 'me',
        },
      ],
      0.5
    );
    expect(r.total).toBe(2000);
    expect(r.snapshot_user_income).toBe(2000);
    expect(r.eventsPerSource[0].count).toBe(2);
  });

  it('splits joint income by ratio', () => {
    const r = projectIncomeForCycle(
      '2024-01-01',
      '2024-01-31',
      [
        {
          id: '1',
          amount: 1000,
          frequency_rule: 'specific_date',
          day_of_month: 1,
          anchor_date: null,
          payment_source: 'joint',
        },
      ],
      0.6
    );
    expect(r.total).toBe(1000);
    expect(r.snapshot_user_income).toBe(600);
    expect(r.snapshot_partner_income).toBe(400);
  });

  it('sums me + partner + joint', () => {
    const r = projectIncomeForCycle(
      '2024-01-01',
      '2024-01-31',
      [
        {
          id: 'a',
          amount: 500,
          frequency_rule: 'specific_date',
          day_of_month: 1,
          anchor_date: null,
          payment_source: 'me',
        },
        {
          id: 'b',
          amount: 500,
          frequency_rule: 'specific_date',
          day_of_month: 15,
          anchor_date: null,
          payment_source: 'partner',
        },
        {
          id: 'c',
          amount: 200,
          frequency_rule: 'specific_date',
          day_of_month: 25,
          anchor_date: null,
          payment_source: 'joint',
        },
      ],
      0.5
    );
    expect(r.total).toBe(1200);
    expect(r.snapshot_user_income).toBe(600); // 500 + 100
    expect(r.snapshot_partner_income).toBe(600); // 500 + 100
  });
});
