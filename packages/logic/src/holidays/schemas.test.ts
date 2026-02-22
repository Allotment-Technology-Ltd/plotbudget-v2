import { describe, it, expect } from 'vitest';
import {
  createTripSchema,
  updateTripSchema,
  createItineraryEntrySchema,
  updateItineraryEntrySchema,
  createTripBudgetItemSchema,
  updateTripBudgetItemSchema,
  createPackingItemSchema,
  updatePackingItemSchema,
} from './schemas';

describe('createTripSchema', () => {
  it('accepts valid minimal input', () => {
    const result = createTripSchema.safeParse({
      name: 'Paris Trip',
      destination: 'Paris, France',
      start_date: '2026-06-01',
      end_date: '2026-06-08',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = createTripSchema.safeParse({
      destination: 'Paris',
      start_date: '2026-06-01',
      end_date: '2026-06-08',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      expect(fields.name).toBeDefined();
    }
  });

  it('rejects name over 200 characters', () => {
    const result = createTripSchema.safeParse({
      name: 'a'.repeat(201),
      destination: 'Paris',
      start_date: '2026-06-01',
      end_date: '2026-06-08',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.name?.[0];
      expect(msg).toBe('Trip name must be under 200 characters');
    }
  });

  it('rejects invalid date format', () => {
    const result = createTripSchema.safeParse({
      name: 'Paris Trip',
      destination: 'Paris',
      start_date: '01/06/2026',
      end_date: '2026-06-08',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.start_date?.[0];
      expect(msg).toBe('Start date must be in YYYY-MM-DD format');
    }
  });

  it('rejects end_date before start_date', () => {
    const result = createTripSchema.safeParse({
      name: 'Paris Trip',
      destination: 'Paris',
      start_date: '2026-06-08',
      end_date: '2026-06-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.end_date?.[0];
      expect(msg).toBe('End date must not be before start date');
    }
  });

  it('accepts same start_date and end_date (day trip)', () => {
    const result = createTripSchema.safeParse({
      name: 'Day Trip',
      destination: 'Brighton',
      start_date: '2026-06-01',
      end_date: '2026-06-01',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid status enum', () => {
    const result = createTripSchema.safeParse({
      name: 'Paris Trip',
      destination: 'Paris',
      start_date: '2026-06-01',
      end_date: '2026-06-08',
      status: 'unknown',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid status values', () => {
    const statuses = ['draft', 'planning', 'booked', 'in_progress', 'completed', 'cancelled'];
    for (const status of statuses) {
      const result = createTripSchema.safeParse({
        name: 'Test',
        destination: 'Test',
        start_date: '2026-06-01',
        end_date: '2026-06-08',
        status,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('updateTripSchema', () => {
  it('accepts valid update with id', () => {
    const result = updateTripSchema.safeParse({
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID for id', () => {
    const result = updateTripSchema.safeParse({ id: 'not-a-uuid', name: 'Test' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.id?.[0];
      expect(msg).toBe('Trip ID must be a valid UUID');
    }
  });
});

describe('createItineraryEntrySchema', () => {
  it('accepts valid minimal input', () => {
    const result = createItineraryEntrySchema.safeParse({
      trip_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      date: '2026-06-02',
      title: 'Eiffel Tower visit',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid time format', () => {
    const result = createItineraryEntrySchema.safeParse({
      trip_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      date: '2026-06-02',
      title: 'Visit',
      start_time: '9:00 AM',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.start_time?.[0];
      expect(msg).toContain('HH:mm format');
    }
  });

  it('rejects invalid time values like 99:99', () => {
    const result = createItineraryEntrySchema.safeParse({
      trip_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      date: '2026-06-02',
      title: 'Visit',
      start_time: '99:99',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid entry_type values', () => {
    const types = ['travel', 'accommodation', 'activity', 'dining', 'other'];
    for (const entry_type of types) {
      const result = createItineraryEntrySchema.safeParse({
        trip_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        date: '2026-06-02',
        title: 'Visit',
        entry_type,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('createTripBudgetItemSchema', () => {
  it('accepts valid input', () => {
    const result = createTripBudgetItemSchema.safeParse({
      trip_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      category: 'flights',
      name: 'Return flights',
      planned_amount: 500,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative planned_amount', () => {
    const result = createTripBudgetItemSchema.safeParse({
      trip_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Flights',
      planned_amount: -100,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.planned_amount?.[0];
      expect(msg).toBe('Planned amount must be 0 or more');
    }
  });

  it('accepts all valid category values', () => {
    const categories = ['flights', 'accommodation', 'car_rental', 'activities', 'food', 'transport', 'other'];
    for (const category of categories) {
      const result = createTripBudgetItemSchema.safeParse({
        trip_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        category,
        name: 'Test',
        planned_amount: 100,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('createPackingItemSchema', () => {
  it('accepts valid input', () => {
    const result = createPackingItemSchema.safeParse({
      trip_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'Passport',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createPackingItemSchema.safeParse({
      trip_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.flatten().fieldErrors.name?.[0];
      expect(msg).toBe('Item name is required');
    }
  });

  it('accepts valid assignee values', () => {
    const assignees = ['me', 'partner', 'shared'];
    for (const assignee of assignees) {
      const result = createPackingItemSchema.safeParse({
        trip_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Item',
        assignee,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe('updatePackingItemSchema', () => {
  it('rejects missing id', () => {
    const result = updatePackingItemSchema.safeParse({ name: 'Passport' });
    expect(result.success).toBe(false);
  });
});
