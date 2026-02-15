# @repo/design-tokens

PLOT Design System Tokens - Single Source of Truth

## 🎯 Overview

This package provides design tokens for all PLOT applications in platform-appropriate formats:
- **Web** (`tokens.css`) - CSS Custom Properties
- **Native** (`native.ts`) - TypeScript constants for React Native

**Both files are automatically generated** from a single source: `tokens.config.ts`

## 🚨 Important: DO NOT Edit Generated Files

- ❌ **DO NOT** edit `tokens.css` directly
- ❌ **DO NOT** edit `native.ts` directly
- ✅ **DO** edit `tokens.config.ts`
- ✅ **DO** run `pnpm generate-tokens` after changes

## 🔄 How Token Sync Works

```
tokens.config.ts (Single Source of Truth)
    │
    ├──> scripts/generate-tokens.ts
    │
    ├──> tokens.css (for Web)
    └──> native.ts (for React Native)
```

### Workflow

1. **Edit tokens** in `src/tokens.config.ts`
2. **Generate outputs** by running:
   ```bash
   pnpm generate-tokens
   ```
3. **Commit all files** (config + generated files)

### Automatic Generation

Token generation runs automatically:
- ✅ Before build (`prebuild` script)
- ✅ In CI/CD pipelines (via Turborepo)
- ✅ Manually via `pnpm generate-tokens`

## 📦 Usage

### Web (Next.js, React)

```tsx
// Import CSS in your global styles
import '@repo/design-tokens/tokens.css';

// Use in Tailwind config
module.exports = {
  theme: {
    extend: {
      colors: {
        plot: {
          bg: 'rgb(var(--plot-bg-primary) / <alpha-value>)',
          accent: 'rgb(var(--plot-accent-primary) / <alpha-value>)',
        },
      },
    },
  },
};

// Or use in CSS
.my-class {
  background: var(--plot-bg-primary);
  color: var(--plot-text-primary);
}
```

### Native (React Native)

```tsx
import { colors, spacing, typography } from '@repo/design-tokens/native';

// Use directly in styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light.bgPrimary,
    padding: spacing.lg,
  },
  text: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.body,
  },
});

// Or via ThemeProvider
import { useTheme } from '@repo/native-ui';

function MyComponent() {
  const { colors, spacing } = useTheme();
  return <View style={{ backgroundColor: colors.bgPrimary }} />;
}
```

## 🎨 Available Tokens

### Colors
- **Backgrounds:** bgPrimary, bgSecondary, bgElevated
- **Text:** textPrimary, textSecondary
- **Accent:** accentPrimary, accentGlow
- **Borders:** borderSubtle, borderAccent
- **Semantic:** success, error, warning, info
- **Categories:** needs, wants, repay, savings

Both light and dark modes supported.

### Spacing
`xs` (4px), `sm` (8px), `md` (16px), `lg` (24px), `xl` (32px), `2xl` (48px), `3xl` (64px), `4xl` (96px)

### Typography
- **Font Families:** display (JetBrains Mono), heading (Space Mono), body (Inter)
- **Font Sizes:** displayLg, headline, sub, base, label, cta, etc.
- **Line Heights:** tight, snug, normal, relaxed
- **Letter Spacing:** tighter → ultraWide, label, cta
- **Font Weights:** regular, medium, semibold, bold

### Border Radius
`sm` (4px), `DEFAULT` (6px), `md` (8px), `lg` (12px), `xl` (16px), `full` (9999px)

### Shadows (React Native)
`sm`, `DEFAULT`, `md`, `lg`, `glow` - includes elevation for Android

### Z-Index
`dropdown` (50), `sticky` (100), `modal` (200), `popover` (300), `tooltip` (400), `toast` (500)

## 🔧 Adding New Tokens

1. Edit `src/tokens.config.ts`:

```typescript
export const colorTokens = {
  light: {
    // ... existing tokens
    newColor: '#FF0000', // Add your new token
  },
  dark: {
    // ... existing tokens
    newColor: '#AA0000',
  },
};
```

2. Run generator:

```bash
pnpm generate-tokens
```

3. Verify both files updated:
- `src/tokens.css` - Should contain `--plot-new-color`
- `src/native.ts` - Should contain `newColor: '#FF0000'`

4. Update TypeScript interface if adding new color properties:

Edit `scripts/generate-tokens.ts` to include new properties in `ColorPalette` interface.

## 🧪 Validation

The generation script ensures:
- ✅ Both files use identical values
- ✅ No manual drift between platforms
- ✅ TypeScript types match runtime values
- ✅ All tokens are exported properly

## 📋 Scripts

- `pnpm generate-tokens` - Generate CSS and TypeScript from config
- `pnpm build` - Runs token generation (via prebuild)

## 🏗️ Development

When working on the token system:

```bash
# Make changes to tokens.config.ts
vim src/tokens.config.ts

# Generate outputs
pnpm generate-tokens

# Verify in consuming apps
cd ../../apps/web && pnpm dev
cd ../../apps/native && pnpm start
```

## 🎯 Design Philosophy

**Single Source of Truth:** One canonical definition prevents drift and ensures visual consistency across platforms.

**Platform Adaptation:** Each platform gets tokens in its native format (CSS variables for web, TypeScript for React Native).

**Type Safety:** Full TypeScript support with autocomplete for all tokens.

**Automatic Sync:** Generation is automatic - no manual copying required.

## 🚀 CI/CD Integration

Token generation runs automatically in:
- Pre-build hooks (Turborepo)
- GitHub Actions (via `turbo build`)
- Vercel builds (web deployments)
- Local development (git hooks)

No special CI configuration needed - just commit `tokens.config.ts` changes and the pipeline handles the rest.
