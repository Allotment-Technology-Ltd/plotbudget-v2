/**
 * PLOT Design Tokens - Single Source of Truth
 * 
 * This file is the canonical definition of all design tokens.
 * DO NOT edit tokens.css or native.ts directly.
 * Run `pnpm generate-tokens` to regenerate platform-specific files.
 */

export const colorTokens = {
  light: {
    // Backgrounds
    bgPrimary: '#F5F0EA',
    bgSecondary: '#FFFFFF',
    bgElevated: '#F0EBE4',

    // Text
    textPrimary: '#111111',
    textSecondary: '#555555',

    // Accent — PLOT green
    accentPrimary: '#0E8345',
    accentGlow: 'rgba(14, 131, 69, 0.15)',

    // Borders
    borderSubtle: 'rgba(0, 0, 0, 0.08)',
    borderAccent: 'rgba(14, 131, 69, 0.3)',

    // Overlay
    surfaceOverlay: 'rgba(0, 0, 0, 0.03)',

    // Semantic colors
    success: '#2E7D32',
    error: '#C92A2A',
    warning: '#FF6B35',
    info: '#1A1A1A',

    // Category colors
    needs: '#8DA399',
    wants: '#C78D75',
    repay: '#EF5350',
    savings: '#6EC97C',
  },

  dark: {
    // Backgrounds
    bgPrimary: '#111111',
    bgSecondary: '#1A1A1A',
    bgElevated: '#222222',

    // Text
    textPrimary: '#F5F0EA',
    textSecondary: '#999999',

    // Accent
    accentPrimary: '#69F0AE',
    accentGlow: 'rgba(105, 240, 174, 0.12)',

    // Borders
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderAccent: 'rgba(105, 240, 174, 0.2)',

    // Overlay
    surfaceOverlay: 'rgba(255, 255, 255, 0.03)',

    // Semantic colors
    success: '#2E7D32',
    error: '#C92A2A',
    warning: '#FF6B35',
    info: '#1A1A1A',

    // Category colors
    needs: '#3D5A6B',
    wants: '#9D6B47',
    repay: '#B8554D',
    savings: '#2E7D5F',
  },
} as const;

/** Module accent colours (light/dark) for nav, tabs, and cards. */
export const moduleTokens = {
  money: { light: '#0E8345', dark: '#69F0AE' },
  tasks: { light: '#2563EB', dark: '#60A5FA' },
  calendar: { light: '#7C3AED', dark: '#A78BFA' },
  meals: { light: '#EA580C', dark: '#FB923C' },
  holidays: { light: '#0D9488', dark: '#5EEAD4' },
  vault: { light: '#475569', dark: '#94A3B8' },
  home: { light: '#D97706', dark: '#FCD34D' },
  kids: { light: '#DB2777', dark: '#F472B6' },
} as const;

export const spacingTokens = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

export const borderRadiusTokens = {
  sm: 4,
  DEFAULT: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const typographyTokens = {
  fontFamily: {
    display: 'JetBrainsMono',
    heading: 'SpaceMono',
    body: 'Inter',
  },

  fontSize: {
    // Display sizes
    displayLg: 72,
    displaySm: 40,
    
    // Headline sizes
    headline: 48,
    headlineSm: 28,
    
    // Subtitle sizes
    sub: 24,
    subSm: 18,
    
    // Body sizes
    base: 16,
    sm: 14,
    xs: 12,
    
    // Label sizes
    label: 14,
    labelSm: 12,
    
    // CTA sizes
    cta: 16,
    ctaSm: 14,
  },

  lineHeight: {
    tight: 1.05,
    snug: 1.15,
    normal: 1.3,
    relaxed: 1.4,
  },

  letterSpacing: {
    tighter: -0.02,
    tight: -0.01,
    normal: 0,
    wide: 0.01,
    wider: 0.02,
    widest: 0.04,
    ultraWide: 0.06,
    label: 0.15,
    cta: 0.2,
  },

  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const shadowTokens = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#0E8345',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 4,
  },
} as const;

export const zIndexTokens = {
  dropdown: 50,
  sticky: 100,
  modal: 200,
  popover: 300,
  tooltip: 400,
  toast: 500,
} as const;

// RGB conversion helper (for Tailwind opacity)
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0 0';
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
}

export const rgbTokens = {
  light: {
    accentRgb: hexToRgb(colorTokens.light.accentPrimary),
    bgPrimaryRgb: hexToRgb(colorTokens.light.bgPrimary),
    bgSecondaryRgb: hexToRgb(colorTokens.light.bgSecondary),
    textPrimaryRgb: hexToRgb(colorTokens.light.textPrimary),
    textSecondaryRgb: hexToRgb(colorTokens.light.textSecondary),
  },
  dark: {
    accentRgb: hexToRgb(colorTokens.dark.accentPrimary),
    bgPrimaryRgb: hexToRgb(colorTokens.dark.bgPrimary),
    bgSecondaryRgb: hexToRgb(colorTokens.dark.bgSecondary),
    textPrimaryRgb: hexToRgb(colorTokens.dark.textPrimary),
    textSecondaryRgb: hexToRgb(colorTokens.dark.textSecondary),
  },
};
