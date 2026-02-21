import { describe, it, expect } from 'vitest';
import {
  createNotificationSchema,
  markNotificationReadSchema,
  notificationPreferencesSchema,
} from './schemas';

describe('createNotificationSchema', () => {
  it('accepts valid input (happy path)', () => {
    const result = createNotificationSchema.safeParse({
      title: 'Test',
      source_module: 'money',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional body, source_entity_id, action_url', () => {
    const result = createNotificationSchema.safeParse({
      title: 'Test',
      body: 'Detail',
      source_module: 'money',
      source_entity_id: '943bd6b2-64d0-466c-858e-863ecb935631',
      action_url: 'https://example.com/path',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid source_module (unhappy path)', () => {
    const result = createNotificationSchema.safeParse({
      title: 'Test',
      source_module: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty title (unhappy path)', () => {
    const result = createNotificationSchema.safeParse({
      title: '',
      source_module: 'money',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid source_entity_id (unhappy path)', () => {
    const result = createNotificationSchema.safeParse({
      title: 'x',
      source_module: 'money',
      source_entity_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid action_url (unhappy path)', () => {
    const result = createNotificationSchema.safeParse({
      title: 'x',
      source_module: 'money',
      action_url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

describe('markNotificationReadSchema', () => {
  it('accepts valid UUID (happy path)', () => {
    const result = markNotificationReadSchema.safeParse({
      id: '943bd6b2-64d0-466c-858e-863ecb935631',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID id (unhappy path)', () => {
    const result = markNotificationReadSchema.safeParse({ id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects missing id (unhappy path)', () => {
    const result = markNotificationReadSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('notificationPreferencesSchema', () => {
  it('accepts per-module push boolean (happy path)', () => {
    const result = notificationPreferencesSchema.safeParse({ money: { push: true } });
    expect(result.success).toBe(true);
  });

  it('rejects non-boolean push (unhappy path)', () => {
    const result = notificationPreferencesSchema.safeParse({ money: { push: 'yes' } });
    expect(result.success).toBe(false);
  });
});
