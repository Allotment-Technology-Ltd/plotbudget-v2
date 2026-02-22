/**
 * PLOT module registry — single source of truth for module metadata.
 * Used by web and native for nav, colours, and feature flags.
 */

export type ModuleId =
  | 'money'
  | 'tasks'
  | 'calendar'
  | 'meals'
  | 'holidays'
  | 'vault'
  | 'home'
  | 'kids';

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  icon: string;
  colorLight: string;
  colorDark: string;
  isPro: boolean;
  isEnabled: boolean;
  navOrder: number;
  tabBar: boolean;
}

const MODULES: ModuleDefinition[] = [
  {
    id: 'money',
    name: 'Money',
    description: 'Budget, payday ritual, seeds, pots, repayments',
    icon: 'PoundSterling',
    colorLight: '#0E8345',
    colorDark: '#69F0AE',
    isPro: false,
    isEnabled: true,
    navOrder: 0,
    tabBar: true,
  },
  {
    id: 'home',
    name: 'Home',
    description: 'Activity feed and smart cards',
    icon: 'Home',
    colorLight: '#D97706',
    colorDark: '#FCD34D',
    isPro: false,
    isEnabled: false,
    navOrder: 1,
    tabBar: true,
  },
  {
    id: 'tasks',
    name: 'Tasks',
    description: 'Chores, to-dos, projects',
    icon: 'CheckSquare',
    colorLight: '#2563EB',
    colorDark: '#60A5FA',
    isPro: false,
    isEnabled: true,
    navOrder: 2,
    tabBar: true,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Shared household calendar',
    icon: 'Calendar',
    colorLight: '#7C3AED',
    colorDark: '#A78BFA',
    isPro: false,
    isEnabled: true,
    navOrder: 3,
    tabBar: true,
  },
  {
    id: 'meals',
    name: 'Meals',
    description: 'Meal planning and groceries',
    icon: 'UtensilsCrossed',
    colorLight: '#EA580C',
    colorDark: '#FB923C',
    isPro: false,
    isEnabled: false,
    navOrder: 4,
    tabBar: false,
  },
  {
    id: 'holidays',
    name: 'Holidays',
    description: 'Trips and travel',
    icon: 'Plane',
    colorLight: '#0D9488',
    colorDark: '#5EEAD4',
    isPro: false,
    isEnabled: true,
    navOrder: 5,
    tabBar: false,
  },
  {
    id: 'vault',
    name: 'Vault',
    description: 'Documents and important info',
    icon: 'Vault',
    colorLight: '#475569',
    colorDark: '#94A3B8',
    isPro: false,
    isEnabled: false,
    navOrder: 6,
    tabBar: false,
  },
  {
    id: 'kids',
    name: 'Kids',
    description: 'Kids profiles and activities',
    icon: 'Baby',
    colorLight: '#DB2777',
    colorDark: '#F472B6',
    isPro: false,
    isEnabled: false,
    navOrder: 7,
    tabBar: false,
  },
];

export function getModule(id: ModuleId): ModuleDefinition {
  const m = MODULES.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown module: ${id}`);
  return m;
}

export function getEnabledModules(): ModuleDefinition[] {
  return MODULES.filter((m) => m.isEnabled).sort((a, b) => a.navOrder - b.navOrder);
}

export function getTabBarModules(): ModuleDefinition[] {
  return MODULES.filter((m) => m.tabBar && m.isEnabled).sort((a, b) => a.navOrder - b.navOrder);
}

export function getOverflowModules(): ModuleDefinition[] {
  return MODULES.filter((m) => !m.tabBar && m.isEnabled).sort((a, b) => a.navOrder - b.navOrder);
}

export function getAllModules(): ModuleDefinition[] {
  return [...MODULES].sort((a, b) => a.navOrder - b.navOrder);
}

