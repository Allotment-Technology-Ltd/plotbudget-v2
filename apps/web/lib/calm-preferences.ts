/**
 * Calm Design preferences: user control over how much PLOT initiates interaction.
 * Stored in localStorage; no server round-trip. Aligns with PLOT Calm Design rules 4, 9.
 */

const STORAGE_KEY_PREFIX = 'plot_calm_';

export const CALM_KEYS = {
  reduceMotion: `${STORAGE_KEY_PREFIX}reduce_motion`,
  celebrations: `${STORAGE_KEY_PREFIX}celebrations`,
} as const;

export type CalmPreferences = {
  reduceMotion: boolean;
  celebrations: boolean;
};

const DEFAULTS: CalmPreferences = {
  reduceMotion: false,
  celebrations: true,
};

function getStoredBoolean(key: string, defaultValue: boolean): boolean {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return raw === 'true';
  } catch {
    return defaultValue;
  }
}

function setStoredBoolean(key: string, value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

export function getCalmPreferences(): CalmPreferences {
  return {
    reduceMotion: getStoredBoolean(CALM_KEYS.reduceMotion, DEFAULTS.reduceMotion),
    celebrations: getStoredBoolean(CALM_KEYS.celebrations, DEFAULTS.celebrations),
  };
}

export function setCalmReduceMotion(value: boolean): void {
  setStoredBoolean(CALM_KEYS.reduceMotion, value);
}

export function setCalmCelebrations(value: boolean): void {
  setStoredBoolean(CALM_KEYS.celebrations, value);
}
