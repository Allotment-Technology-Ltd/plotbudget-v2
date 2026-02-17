import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  totalRepaymentCost,
  getCycleEndDateForTarget,
  projectRepaymentOverTime,
  projectSavingsOverTimeFixedCycles,
  cyclesToClearFromAmount,
} from './forecast-projection';

const monthlyConfig = {
  payCycleType: 'specific_date' as const,
  payDay: 15,
  anchorDate: null as string | null,
};

describe('projectSavingsOverTimeFixedCycles', () => {
  it('projects balance over fixed cycles without target ceiling', () => {
    const pts = projectSavingsOverTimeFixedCycles(
      100,
      50,
      '2024-01-01',
      monthlyConfig,
      12
    );
    expect(pts).toHaveLength(12);
    expect(pts[0]!.balance).toBe(150);
    expect(pts[1]!.balance).toBe(200);
    expect(pts[11]!.balance).toBe(700);
  });

  it('respects numCycles and does not stop at target', () => {
    const pts = projectSavingsOverTimeFixedCycles(
      0,
      500,
      '2024-01-01',
      monthlyConfig,
      24
    );
    expect(pts).toHaveLength(24);
    expect(pts[23]!.balance).toBe(12000);
  });

  it('handles amount 0 (balance stays constant)', () => {
    const pts = projectSavingsOverTimeFixedCycles(
      1000,
      0,
      '2024-01-01',
      monthlyConfig,
      6
    );
    expect(pts).toHaveLength(6);
    pts.forEach((p) => expect(p.balance).toBe(1000));
  });
});

describe('totalRepaymentCost', () => {
  it('returns zero when balance is zero', () => {
    const result = totalRepaymentCost(0, 100, '2024-01-01', monthlyConfig);
    expect(result).toEqual({ totalPaid: 0, cycles: 0 });
  });

  it('returns zero when amount per cycle is zero', () => {
    const result = totalRepaymentCost(1000, 0, '2024-01-01', monthlyConfig);
    expect(result).toEqual({ totalPaid: 0, cycles: 0 });
  });

  it('no interest: total paid equals principal', () => {
    const result = totalRepaymentCost(1000, 100, '2024-01-01', monthlyConfig);
    expect(result.totalPaid).toBe(1000);
    expect(result.cycles).toBe(10);
  });

  it('no interest: last payment is partial when balance does not divide evenly', () => {
    const result = totalRepaymentCost(105, 100, '2024-01-01', monthlyConfig);
    expect(result.totalPaid).toBe(105);
    expect(result.cycles).toBe(2);
  });

  it('with interest: total paid exceeds principal', () => {
    const result = totalRepaymentCost(1000, 100, '2024-01-01', monthlyConfig, {
      interestRateAnnualPercent: 12,
    });
    expect(result.totalPaid).toBeGreaterThan(1000);
    expect(result.cycles).toBeGreaterThan(10);
  });

  it('with interest: overpaying reduces total cost', () => {
    const at100 = totalRepaymentCost(1000, 100, '2024-01-01', monthlyConfig, {
      interestRateAnnualPercent: 12,
    });
    const at200 = totalRepaymentCost(1000, 200, '2024-01-01', monthlyConfig, {
      interestRateAnnualPercent: 12,
    });
    expect(at200.totalPaid).toBeLessThan(at100.totalPaid);
    expect(at200.cycles).toBeLessThan(at100.cycles);
  });

  it('respects maxCycles when debt is not cleared', () => {
    const result = totalRepaymentCost(100000, 1, '2024-01-01', monthlyConfig, {
      maxCycles: 5,
    });
    expect(result.cycles).toBe(5);
    expect(result.totalPaid).toBe(5);
  });
});

describe('getCycleEndDateForTarget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a date string for target in first cycle', () => {
    const result = getCycleEndDateForTarget(
      '2024-01-01',
      '2024-01-15',
      monthlyConfig
    );
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(result).getTime()).toBeGreaterThanOrEqual(
      new Date('2024-01-15').getTime()
    );
  });

  it('returns cycle end for target in a later cycle', () => {
    const result = getCycleEndDateForTarget(
      '2024-01-01',
      '2024-04-15',
      monthlyConfig
    );
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const resultDate = new Date(result);
    expect(resultDate.getFullYear()).toBe(2024);
    expect(resultDate.getMonth()).toBeGreaterThanOrEqual(3);
  });

  it('works with every_4_weeks cycle type', () => {
    const config = {
      payCycleType: 'every_4_weeks' as const,
      payDay: undefined,
      anchorDate: '2024-01-01',
    };
    const result = getCycleEndDateForTarget(
      '2024-01-01',
      '2024-02-15',
      config
    );
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('projectRepaymentOverTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns points until balance is zero', () => {
    const points = projectRepaymentOverTime(
      300,
      100,
      '2024-01-01',
      monthlyConfig
    );
    expect(points.length).toBe(3);
    expect(points[0]!.balance).toBe(200);
    expect(points[1]!.balance).toBe(100);
    expect(points[2]!.balance).toBe(0);
  });

  it('with interest: balance decreases more slowly', () => {
    const noInterest = projectRepaymentOverTime(
      1000,
      100,
      '2024-01-01',
      monthlyConfig
    );
    const withInterest = projectRepaymentOverTime(
      1000,
      100,
      '2024-01-01',
      monthlyConfig,
      { includeInterest: true, interestRateAnnualPercent: 12 }
    );
    expect(withInterest.length).toBeGreaterThan(noInterest.length);
  });
});

describe('cyclesToClearFromAmount', () => {
  it('returns 0 when balance is zero', () => {
    expect(cyclesToClearFromAmount(0, 100)).toBe(0);
  });

  it('returns Infinity when amount is zero', () => {
    expect(cyclesToClearFromAmount(1000, 0)).toBe(Infinity);
  });

  it('calculates exact division', () => {
    expect(cyclesToClearFromAmount(1000, 100)).toBe(10);
  });

  it('rounds up for partial cycles', () => {
    expect(cyclesToClearFromAmount(105, 100)).toBe(2);
  });
});
