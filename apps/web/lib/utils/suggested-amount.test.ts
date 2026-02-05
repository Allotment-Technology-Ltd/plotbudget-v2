import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  countPayCyclesUntil,
  suggestedSavingsAmount,
  suggestedRepaymentAmount,
} from './suggested-amount';

describe('countPayCyclesUntil', () => {
  it('returns 0 when target is before or equal to start', () => {
    expect(countPayCyclesUntil('2024-06-01', '2024-05-01', 'specific_date')).toBe(0);
    expect(countPayCyclesUntil('2024-06-01', '2024-06-01', 'specific_date')).toBe(0);
  });

  it('monthly: one month apart returns 1', () => {
    expect(countPayCyclesUntil('2024-01-15', '2024-02-15', 'specific_date')).toBe(1);
  });

  it('monthly: three months apart returns 3', () => {
    expect(countPayCyclesUntil('2024-01-01', '2024-04-01', 'last_working_day')).toBe(3);
  });

  it('every_4_weeks: 28 days returns 1', () => {
    expect(countPayCyclesUntil('2024-01-01', '2024-01-29', 'every_4_weeks')).toBe(1);
  });

  it('every_4_weeks: 56 days returns 2', () => {
    expect(countPayCyclesUntil('2024-01-01', '2024-02-26', 'every_4_weeks')).toBe(2);
  });
});

describe('suggestedSavingsAmount', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 when current >= target', () => {
    expect(
      suggestedSavingsAmount(1000, 1000, '2024-01-01', '2024-12-31', 'specific_date')
    ).toBe(0);
    expect(
      suggestedSavingsAmount(1500, 1000, '2024-01-01', '2024-12-31', 'specific_date')
    ).toBe(0);
  });

  it('returns null when targetDate is null', () => {
    expect(
      suggestedSavingsAmount(0, 1000, '2024-01-01', null, 'specific_date')
    ).toBeNull();
  });

  it('splits remaining amount across cycles (monthly)', () => {
    // 1000 remaining, 10 cycles (Jan 15 → Nov 15 = 10 months)
    const amount = suggestedSavingsAmount(
      0,
      1000,
      '2024-01-15',
      '2024-11-15',
      'specific_date'
    );
    expect(amount).toBe(100); // 1000 / 10
  });

  it('rounds up to 2 decimal places', () => {
    const amount = suggestedSavingsAmount(
      0,
      100,
      '2024-01-01',
      '2024-03-01',
      'specific_date'
    );
    expect(amount).toBeGreaterThan(0);
    // Result is rounded to 2 decimals (may have float noise)
    expect(Math.abs((amount! * 100) - Math.round(amount! * 100))).toBeLessThan(0.01);
  });
});

describe('suggestedRepaymentAmount', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 when currentBalance <= 0', () => {
    expect(
      suggestedRepaymentAmount(0, '2024-01-01', '2024-12-31', 'specific_date')
    ).toBe(0);
  });

  it('returns null when targetDate is null', () => {
    expect(
      suggestedRepaymentAmount(5000, '2024-01-01', null, 'specific_date')
    ).toBeNull();
  });

  it('splits balance across cycles', () => {
    const amount = suggestedRepaymentAmount(
      1200,
      '2024-01-15',
      '2024-12-15',
      'specific_date'
    );
    expect(amount).toBeGreaterThan(0);
    expect(amount).toBeLessThanOrEqual(1200);
  });
});
