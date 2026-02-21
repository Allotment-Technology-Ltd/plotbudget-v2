/**
 * Module-level feature flags for PLOT expansion (Home feed, Tasks, Calendar, etc.).
 * PostHog with env fallback — same pattern as auth flags.
 * Used to control which modules appear in nav; server resolves via getServerModuleFlags().
 */

/** Module IDs matching packages/logic registry. */
export type ModuleFlagId =
  | 'money'
  | 'home'
  | 'tasks'
  | 'calendar'
  | 'meals'
  | 'holidays'
  | 'vault'
  | 'kids';

export type ModuleFlags = Record<ModuleFlagId, boolean>;

/** Default: only Money is on so existing UX is unchanged. */
export const DEFAULT_MODULE_FLAGS: ModuleFlags = {
  money: true,
  home: false,
  tasks: false,
  calendar: false,
  meals: false,
  holidays: false,
  vault: false,
  kids: false,
};

/** Direct process.env read so Next.js inlines at build time; avoids hydration mismatch. */
export function isModuleMoneyEnabledFromEnv(): boolean {
  const v = process.env.NEXT_PUBLIC_MODULE_MONEY_ENABLED;
  return v === undefined || v === '' || v === 'true';
}

/** Direct process.env read so Next.js inlines at build time. */
export function isModuleHomeEnabledFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_HOME_ENABLED === 'true';
}

/** Direct process.env read so Next.js inlines at build time. */
export function isModuleTasksEnabledFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_TASKS_ENABLED === 'true';
}

/** Direct process.env read so Next.js inlines at build time. */
export function isModuleCalendarEnabledFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_CALENDAR_ENABLED === 'true';
}

/** Direct process.env read so Next.js inlines at build time. */
export function isModuleMealsEnabledFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_MEALS_ENABLED === 'true';
}

/** Direct process.env read so Next.js inlines at build time. */
export function isModuleHolidaysEnabledFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_HOLIDAYS_ENABLED === 'true';
}

/** Direct process.env read so Next.js inlines at build time. */
export function isModuleVaultEnabledFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_VAULT_ENABLED === 'true';
}

/** Direct process.env read so Next.js inlines at build time. */
export function isModuleKidsEnabledFromEnv(): boolean {
  return process.env.NEXT_PUBLIC_MODULE_KIDS_ENABLED === 'true';
}

/** Env-based module flags fallback when PostHog is unavailable. */
export function getModuleFlagsFromEnv(): ModuleFlags {
  return {
    money: isModuleMoneyEnabledFromEnv(),
    home: isModuleHomeEnabledFromEnv(),
    tasks: isModuleTasksEnabledFromEnv(),
    calendar: isModuleCalendarEnabledFromEnv(),
    meals: isModuleMealsEnabledFromEnv(),
    holidays: isModuleHolidaysEnabledFromEnv(),
    vault: isModuleVaultEnabledFromEnv(),
    kids: isModuleKidsEnabledFromEnv(),
  };
}

/** Get a single module flag from env (for client or server). */
export function isModuleEnabledFromEnv(moduleId: ModuleFlagId): boolean {
  const env = getModuleFlagsFromEnv();
  return env[moduleId] ?? DEFAULT_MODULE_FLAGS[moduleId];
}
