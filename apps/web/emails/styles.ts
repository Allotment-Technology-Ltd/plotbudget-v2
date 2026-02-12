/**
 * PLOT Email Design System
 * Aligned with docs/design.md and packages/design-tokens
 */

export const colors = {
  /** Light mode accent — Forest Green */
  accent: '#0E8345',
  /** Dark mode accent — Mint (for reference; emails use light by default) */
  accentDark: '#69F0AE',
  /** Background — warm cream */
  bg: '#F5F0EA',
  /** Container background */
  container: '#ffffff',
  /** Primary text */
  text: '#111111',
  /** Secondary/muted text */
  textMuted: '#555555',
  /** Body text */
  body: '#404040',
  /** Footer text */
  footer: '#666666',
  /** Border */
  border: '#e6e6e6',
  /** Link colour — use accent for brand consistency */
  link: '#0E8345',
  /** Warning box background */
  warningBg: '#fff6e5',
  /** Warning box border */
  warningBorder: '#f6d7a8',
  /** Warning text */
  warningText: '#8a5b00',
} as const;

export const fontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif';

export const main = {
  backgroundColor: colors.bg,
  fontFamily,
} as const;

export const container = {
  margin: '0 auto' as const,
  padding: '20px 0',
  maxWidth: '600px',
  backgroundColor: colors.container,
} as const;

export const logo = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  color: colors.text,
  margin: '20px 0',
} as const;

export const h1 = {
  color: colors.text,
  fontSize: '24px',
  fontWeight: 'bold' as const,
  margin: '20px 0',
} as const;

export const text = {
  color: colors.body,
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
} as const;

export const textSmall = {
  color: colors.body,
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
} as const;

export const hr = {
  borderColor: colors.border,
  margin: '26px 0',
} as const;

export const footer = {
  color: colors.footer,
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0',
} as const;

export const link = {
  color: colors.link,
  textDecoration: 'underline' as const,
} as const;

export const button = {
  backgroundColor: colors.text,
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  textDecoration: 'none' as const,
  textAlign: 'center' as const,
  display: 'block' as const,
  padding: '12px 24px',
  margin: '24px 0',
} as const;

export const buttonSecondary = {
  backgroundColor: '#fff',
  borderRadius: '6px',
  border: `1px solid ${colors.text}`,
  color: colors.text,
  fontSize: '16px',
  fontWeight: 'bold' as const,
  textDecoration: 'none' as const,
  textAlign: 'center' as const,
  display: 'block' as const,
  padding: '12px 24px',
  margin: '0 0 20px',
} as const;

export const list = {
  margin: '16px 0',
} as const;

export const listItem = {
  color: colors.body,
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
} as const;

export const warningBox = {
  backgroundColor: colors.warningBg,
  borderRadius: '8px',
  padding: '12px',
  margin: '16px 0',
  border: `1px solid ${colors.warningBorder}`,
} as const;

export const warningTitle = {
  color: colors.warningText,
  fontSize: '15px',
  fontWeight: 'bold' as const,
  margin: '4px 0',
} as const;
