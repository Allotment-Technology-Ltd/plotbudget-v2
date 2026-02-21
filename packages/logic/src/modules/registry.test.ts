import { describe, it, expect } from 'vitest';
import {
  getModule,
  getEnabledModules,
  getTabBarModules,
  getOverflowModules,
  type ModuleId,
} from './registry';

describe('getModule', () => {
  it('returns Money module with correct shape when id is money', () => {
    const money = getModule('money');
    expect(money.id).toBe('money');
    expect(money.isEnabled).toBe(true);
    expect(money.name).toBe('Money');
    expect(money.colorLight).toBe('#0E8345');
    expect(money.colorDark).toBe('#69F0AE');
  });

  it('returns other modules by id', () => {
    expect(getModule('tasks').id).toBe('tasks');
    expect(getModule('calendar').id).toBe('calendar');
  });

  it('throws for unknown module id', () => {
    expect(() => getModule('not-a-module' as ModuleId)).toThrow('Unknown module');
  });
});

describe('getEnabledModules', () => {
  it('returns array including Money', () => {
    const enabled = getEnabledModules();
    expect(Array.isArray(enabled)).toBe(true);
    expect(enabled.length).toBeGreaterThanOrEqual(1);
    expect(enabled[0].id).toBe('money');
  });

  it('returns modules sorted by navOrder', () => {
    const enabled = getEnabledModules();
    for (let i = 1; i < enabled.length; i++) {
      expect(enabled[i].navOrder).toBeGreaterThanOrEqual(enabled[i - 1].navOrder);
    }
  });
});

describe('getTabBarModules', () => {
  it('returns array with Money when enabled', () => {
    const tabBar = getTabBarModules();
    expect(Array.isArray(tabBar)).toBe(true);
    expect(tabBar.some((m) => m.id === 'money')).toBe(true);
  });
});

describe('getOverflowModules', () => {
  it('returns array', () => {
    const overflow = getOverflowModules();
    expect(Array.isArray(overflow)).toBe(true);
  });
});
