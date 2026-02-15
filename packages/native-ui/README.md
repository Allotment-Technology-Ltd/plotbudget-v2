# @repo/native-ui

PLOT Design System for React Native

## Overview

This package provides a complete component library for React Native apps that matches the visual design of the PLOT web application. All components use design tokens from `@repo/design-tokens/native` for consistent theming across platforms.

## Installation

```bash
pnpm add @repo/native-ui @repo/design-tokens
```

## Usage

### 1. Wrap your app with ThemeProvider

```tsx
import { ThemeProvider } from '@repo/native-ui';

export default function App() {
  return (
    <ThemeProvider>
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

### 2. Use components

```tsx
import {
  Button,
  Card,
  Input,
  HeadlineText,
  BodyText,
  Container,
  Section,
} from '@repo/native-ui';

function MyScreen() {
  return (
    <Container>
      <Section spacing="xl">
        <HeadlineText>Welcome to PLOT</HeadlineText>
        <BodyText color="secondary">
          Manage your household budget together
        </BodyText>
      </Section>

      <Section spacing="md">
        <Card variant="elevated" padding="lg">
          <Input
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
          />
          <Button variant="primary" onPress={handleSubmit}>
            Sign In
          </Button>
        </Card>
      </Section>
    </Container>
  );
}
```

## Components

### Theme

- **ThemeProvider** - Provides theme context (colors, spacing, typography, etc.)
- **useTheme()** - Hook to access theme values
- **useColorScheme()** - Hook to get current color scheme ('light' | 'dark')

### Typography

- **Text** - Base text component with variants
- **DisplayText** - Large display text (72px)
- **HeadlineText** - Section headlines (48px)
- **SubheadingText** - Subheadings (24px)
- **BodyText** - Body text (16px)
- **LabelText** - Labels (14px, uppercase)
- **CTAText** - Call-to-action text (16px, uppercase)

**Text Variants:**
- `display-lg`, `display-sm`
- `headline`, `headline-sm`
- `sub`, `sub-sm`
- `body`, `body-sm`
- `label`, `label-sm`
- `cta`, `cta-sm`

**Text Colors:**
- `primary`, `secondary`, `accent`, `success`, `error`, `warning`

### Buttons

**Button** - Pressable button with loading states

**Variants:**
- `primary` - PLOT green background
- `ghost` - Transparent with accent border
- `secondary` - Elevated background
- `outline` - Transparent with subtle border

**Sizes:**
- `sm`, `md`, `lg`

```tsx
<Button variant="primary" size="md" isLoading={loading} onPress={handlePress}>
  Submit
</Button>
```

### Forms

**Input** - Text input with label, error, and helper text

```tsx
<Input
  label="Email Address"
  placeholder="you@example.com"
  value={email}
  onChangeText={setEmail}
  error={error}
  helperText="We'll never share your email"
/>
```

**Label** - Form label with optional required indicator

```tsx
<Label required>Full Name</Label>
```

### Layout

**Card** - Container with border/shadow

**Variants:**
- `default` - Border only
- `elevated` - With shadow
- `outline` - Subtle border

**Padding:**
- `none`, `sm`, `md`, `lg`

```tsx
<Card variant="elevated" padding="lg">
  <BodyText>Card content</BodyText>
</Card>
```

**Container** - Max-width wrapper with horizontal padding

**Max Widths:**
- `narrow` - 520px
- `prose` - 700px
- `content` - 1200px (default)
- `full` - No constraint

```tsx
<Container maxWidth="content" paddingX="md">
  {/* Content */}
</Container>
```

**Section** - Vertical spacing wrapper

**Spacing:**
- `sm`, `md`, `lg`, `xl`, `2xl`

**Background:**
- `primary`, `secondary`, `elevated`

```tsx
<Section spacing="xl" bg="primary">
  {/* Content */}
</Section>
```

## Design Tokens

All components use tokens from `@repo/design-tokens/native`:

- **Colors** - Light/dark mode colors
- **Typography** - Font families, sizes, line heights, letter spacing
- **Spacing** - Consistent spacing scale (xs → 4xl)
- **Border Radius** - Rounded corners (sm → xl)
- **Shadows** - Elevation shadows
- **Z-Index** - Layering system

Access tokens via the `useTheme()` hook:

```tsx
import { useTheme } from '@repo/native-ui';

function MyComponent() {
  const { colors, spacing, typography, borderRadius } = useTheme();

  return (
    <View style={{ 
      backgroundColor: colors.bgPrimary,
      padding: spacing.lg,
      borderRadius: borderRadius.md,
    }}>
      <Text style={{ 
        color: colors.textPrimary,
        fontSize: typography.fontSize.base,
        fontFamily: typography.fontFamily.body,
      }}>
        Hello
      </Text>
    </View>
  );
}
```

## Dark Mode

Dark mode is handled automatically via `ThemeProvider`. The provider detects the system color scheme and provides the appropriate color tokens to all components.

## Typography Setup

The design system uses three font families:

- **Display**: JetBrains Mono
- **Heading**: Space Mono
- **Body**: Inter

Make sure to load these fonts in your app. Example with Expo:

```tsx
import { useFonts } from 'expo-font';

const [loaded] = useFonts({
  'SpaceMono': require('./assets/fonts/SpaceMono-Regular.ttf'),
  'Inter': require('./assets/fonts/Inter-Regular.ttf'),
  'JetBrainsMono': require('./assets/fonts/JetBrainsMono-Regular.ttf'),
});
```

## Visual Consistency with Web

This component library is designed to match the visual design of the PLOT web application (`apps/web`). Key consistency points:

- ✅ Same color palette (PLOT green #0E8345)
- ✅ Same typography scale and font families
- ✅ Same spacing system (4px base)
- ✅ Same border radius values
- ✅ Same component variants (primary, ghost, secondary, outline)
- ✅ Dark mode support matching web

## Development

```bash
# Type check
pnpm type-check

# Lint
pnpm lint
```

## Architecture

This package follows React Native best practices:

- **No CSS variables** - RN doesn't support them, so we use TypeScript constants
- **StyleSheet API** - For optimized style creation
- **Theme Context** - For dynamic theme switching
- **TypeScript** - Full type safety with exported types
- **Platform-agnostic** - Works on iOS, Android, and Web (via React Native Web)
