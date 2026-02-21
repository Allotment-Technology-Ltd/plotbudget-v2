import { describe, it, expect } from 'vitest';
import { createActivitySchema } from './schemas';

describe('createActivitySchema', () => {
  it('accepts valid input (happy path)', () => {
    const result = createActivitySchema.safeParse({
      actor_type: 'user',
      action: 'created',
      object_name: 'Pot',
      source_module: 'money',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional object_detail, source_entity_id, action_url, metadata', () => {
    const result = createActivitySchema.safeParse({
      actor_type: 'partner',
      action: 'updated',
      object_name: 'Seed',
      object_detail: 'Paid',
      source_module: 'money',
      source_entity_id: '943bd6b2-64d0-466c-858e-863ecb935631',
      action_url: 'https://example.com/seed/1',
      metadata: { key: 'value' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid actor_type (unhappy path)', () => {
    const result = createActivitySchema.safeParse({
      actor_type: 'bot',
      action: 'x',
      object_name: 'y',
      source_module: 'money',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty action (unhappy path)', () => {
    const result = createActivitySchema.safeParse({
      actor_type: 'user',
      action: '',
      object_name: 'Pot',
      source_module: 'money',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty object_name (unhappy path)', () => {
    const result = createActivitySchema.safeParse({
      actor_type: 'user',
      action: 'x',
      object_name: '',
      source_module: 'money',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid source_module (unhappy path)', () => {
    const result = createActivitySchema.safeParse({
      actor_type: 'user',
      action: 'x',
      object_name: 'y',
      source_module: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid source_entity_id (unhappy path)', () => {
    const result = createActivitySchema.safeParse({
      actor_type: 'user',
      action: 'x',
      object_name: 'y',
      source_module: 'money',
      source_entity_id: 'bad-uuid',
    });
    expect(result.success).toBe(false);
  });
});
