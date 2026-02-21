/**
 * Phase 0 platform foundation — smoke test.
 * From repo root: pnpm install && pnpm test:phase0
 * From packages/logic: pnpm run test:phase0
 */

import {
  getModule,
  getEnabledModules,
  getTabBarModules,
  getOverflowModules,
  type ModuleId,
} from './modules/registry';
import type { CrossModuleLink } from './modules/cross-module';
import {
  createNotificationSchema,
  markNotificationReadSchema,
  notificationPreferencesSchema,
} from './notifications/schemas';
import { createActivitySchema } from './activity-feed/schemas';

let passed = 0;
let failed = 0;

function ok(condition: boolean, name: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}`);
  }
}

console.log('\n--- Phase 0: Module registry ---');
const money = getModule('money');
ok(money.id === 'money' && money.isEnabled === true, 'getModule("money") returns enabled Money module');
ok(money.colorLight === '#0E8345' && money.colorDark === '#69F0AE', 'Money module has correct colours');
const enabled = getEnabledModules();
ok(Array.isArray(enabled) && enabled.length >= 1 && enabled[0].id === 'money', 'getEnabledModules() includes Money');
const tabBar = getTabBarModules();
ok(Array.isArray(tabBar) && tabBar.some((m) => m.id === 'money'), 'getTabBarModules() includes Money');
const overflow = getOverflowModules();
ok(Array.isArray(overflow), 'getOverflowModules() returns array');
// Unhappy: unknown module id throws
let getModuleThrew = false;
try {
  getModule('not-a-module' as ModuleId);
} catch {
  getModuleThrew = true;
}
ok(getModuleThrew, 'getModule(unknown id) throws');

console.log('\n--- Phase 0: Cross-module types ---');
const link: CrossModuleLink = {
  sourceModule: 'money',
  sourceEntityId: '00000000-0000-0000-0000-000000000001',
  targetModule: 'tasks',
  targetEntityId: '00000000-0000-0000-0000-000000000002',
  linkType: 'pot_funding',
};
ok(link.sourceModule === 'money' && link.linkType === 'pot_funding', 'CrossModuleLink type works');

console.log('\n--- Phase 0: Notification schemas ---');
const notifValid = createNotificationSchema.safeParse({
  title: 'Test',
  source_module: 'money',
});
ok(notifValid.success === true, 'createNotificationSchema accepts valid input');
const notifInvalid = createNotificationSchema.safeParse({ title: '', source_module: 'invalid' });
ok(notifInvalid.success === false, 'createNotificationSchema rejects invalid module');
ok(createNotificationSchema.safeParse({ title: 'x', source_module: 'money', source_entity_id: 'not-a-uuid' }).success === false, 'createNotificationSchema rejects invalid source_entity_id');
ok(createNotificationSchema.safeParse({ title: 'x', source_module: 'money', action_url: 'not-a-url' }).success === false, 'createNotificationSchema rejects invalid action_url');
ok(createNotificationSchema.safeParse({ title: '', source_module: 'money' }).success === false, 'createNotificationSchema rejects empty title');

const readValid = markNotificationReadSchema.safeParse({ id: '943bd6b2-64d0-466c-858e-863ecb935631' });
ok(readValid.success === true, 'markNotificationReadSchema accepts UUID');
ok(markNotificationReadSchema.safeParse({ id: 'not-a-uuid' }).success === false, 'markNotificationReadSchema rejects non-UUID id');
ok(markNotificationReadSchema.safeParse({}).success === false, 'markNotificationReadSchema rejects missing id');

const prefsValid = notificationPreferencesSchema.safeParse({ money: { push: true } });
ok(prefsValid.success === true, 'notificationPreferencesSchema accepts per-module prefs');
ok(notificationPreferencesSchema.safeParse({ money: { push: 'yes' } }).success === false, 'notificationPreferencesSchema rejects non-boolean push');

console.log('\n--- Phase 0: Activity feed schemas ---');
const activityValid = createActivitySchema.safeParse({
  actor_type: 'user',
  action: 'created',
  object_name: 'Pot',
  source_module: 'money',
});
ok(activityValid.success === true, 'createActivitySchema accepts valid input');
const activityInvalid = createActivitySchema.safeParse({
  actor_type: 'bot',
  action: 'x',
  object_name: 'y',
  source_module: 'money',
});
ok(activityInvalid.success === false, 'createActivitySchema rejects invalid actor_type');
ok(createActivitySchema.safeParse({ actor_type: 'user', action: '', object_name: 'Pot', source_module: 'money' }).success === false, 'createActivitySchema rejects empty action');
ok(createActivitySchema.safeParse({ actor_type: 'user', action: 'x', object_name: '', source_module: 'money' }).success === false, 'createActivitySchema rejects empty object_name');
ok(createActivitySchema.safeParse({ actor_type: 'user', action: 'x', object_name: 'y', source_module: 'invalid' }).success === false, 'createActivitySchema rejects invalid source_module');
ok(createActivitySchema.safeParse({ actor_type: 'user', action: 'x', object_name: 'y', source_module: 'money', source_entity_id: 'bad-uuid' }).success === false, 'createActivitySchema rejects invalid source_entity_id');

console.log('\n--- Summary ---');
console.log(`Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) {
  process.exit(1);
}
