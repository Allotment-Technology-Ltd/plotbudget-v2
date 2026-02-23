'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, Json } from '@repo/supabase';

type AuditEventInsert = Database['public']['Tables']['audit_events']['Insert'];

export type AuditEventType =
  | 'login'
  | 'logout'
  | 'password_change'
  | 'account_deleted'
  | 'data_export'
  | 'partner_invite_sent'
  | 'partner_invite_revoked'
  | 'partner_joined'
  | 'partner_removed';

/**
 * Write a security audit event. Server-only; uses service role.
 * Never log passwords, tokens, or other secrets in resource_detail.
 */
export async function logAuditEvent(params: {
  userId: string | null;
  eventType: AuditEventType;
  resource?: string | null;
  resourceDetail?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    const admin = createAdminClient() as SupabaseClient<Database, 'public'>;
    const row: AuditEventInsert = {
      user_id: params.userId,
      event_type: params.eventType,
      resource: params.resource ?? null,
      resource_detail: (params.resourceDetail ?? null) as Json | null,
      ip_address: params.ipAddress ?? null,
      user_agent: params.userAgent ?? null,
    };
    // @ts-expect-error Supabase type inference misfires for this table; row is an AuditEventInsert.
    await admin.from('audit_events').insert(row);
  } catch (err) {
    console.error('Audit log write failed:', err);
    // Do not throw; audit failure must not break the main flow
  }
}
