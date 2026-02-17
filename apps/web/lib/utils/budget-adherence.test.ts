import { describe, it, expect } from 'vitest';
import { formatBudgetAdherenceDiff } from './budget-adherence';

describe('formatBudgetAdherenceDiff', () => {
  it('returns "X% over target of Y%" when actual exceeds target', () => {
    expect(formatBudgetAdherenceDiff(25, 22)).toBe('3% over target of 22%');
    expect(formatBudgetAdherenceDiff(30, 20)).toBe('10% over target of 20%');
    expect(formatBudgetAdherenceDiff(18, 10)).toBe('8% over target of 10%');
  });

  it('returns "X% under target of Y%" when actual is below target', () => {
    expect(formatBudgetAdherenceDiff(19, 22)).toBe('3% under target of 22%');
    expect(formatBudgetAdherenceDiff(8, 10)).toBe('2% under target of 10%');
    expect(formatBudgetAdherenceDiff(0, 25)).toBe('25% under target of 25%');
  });

  it('returns "On target (Y%)" when actual equals target', () => {
    expect(formatBudgetAdherenceDiff(22, 22)).toBe('On target (22%)');
    expect(formatBudgetAdherenceDiff(10, 10)).toBe('On target (10%)');
    expect(formatBudgetAdherenceDiff(0, 0)).toBe(null); // target 0, not "on target"
  });

  it('returns null when target is 0 or not set', () => {
    expect(formatBudgetAdherenceDiff(25, 0)).toBe(null);
    expect(formatBudgetAdherenceDiff(50, 0)).toBe(null);
  });
});
