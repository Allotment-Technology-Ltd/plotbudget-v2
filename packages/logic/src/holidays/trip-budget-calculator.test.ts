import { describe, it, expect } from 'vitest';
import { calculateTripBudget } from './trip-budget-calculator';

describe('calculateTripBudget', () => {
  it('returns empty summary for no items', () => {
    const result = calculateTripBudget([]);
    expect(result.categories).toHaveLength(0);
    expect(result.totalPlanned).toBe(0);
    expect(result.totalActual).toBe(0);
    expect(result.totalDifference).toBe(0);
  });

  it('calculates single item correctly', () => {
    const result = calculateTripBudget([
      { category: 'flights', planned_amount: 500, actual_amount: 450 },
    ]);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0]).toEqual({
      category: 'flights',
      planned: 500,
      actual: 450,
      difference: -50,
    });
    expect(result.totalPlanned).toBe(500);
    expect(result.totalActual).toBe(450);
    expect(result.totalDifference).toBe(-50);
  });

  it('aggregates multiple items in the same category', () => {
    const result = calculateTripBudget([
      { category: 'food', planned_amount: 100, actual_amount: 80 },
      { category: 'food', planned_amount: 50, actual_amount: 60 },
    ]);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0]).toEqual({
      category: 'food',
      planned: 150,
      actual: 140,
      difference: -10,
    });
  });

  it('handles multiple categories', () => {
    const result = calculateTripBudget([
      { category: 'flights', planned_amount: 500, actual_amount: 500 },
      { category: 'accommodation', planned_amount: 300, actual_amount: 320 },
      { category: 'food', planned_amount: 200, actual_amount: 180 },
    ]);
    expect(result.categories).toHaveLength(3);
    expect(result.totalPlanned).toBe(1000);
    expect(result.totalActual).toBe(1000);
    expect(result.totalDifference).toBe(0);
  });

  it('treats null actual_amount as 0', () => {
    const result = calculateTripBudget([
      { category: 'activities', planned_amount: 200, actual_amount: null },
    ]);
    expect(result.categories[0].actual).toBe(0);
    expect(result.categories[0].difference).toBe(-200);
  });

  it('returns positive difference when actual exceeds planned', () => {
    const result = calculateTripBudget([
      { category: 'transport', planned_amount: 50, actual_amount: 75 },
    ]);
    expect(result.categories[0].difference).toBe(25);
    expect(result.totalDifference).toBe(25);
  });
});
