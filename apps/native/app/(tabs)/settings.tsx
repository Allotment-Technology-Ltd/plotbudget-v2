import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import {
  Card,
  Container,
  HeadlineText,
  BodyText,
  LabelText,
  Button,
  useTheme,
} from '@repo/native-ui';
import { useAuth } from '@/contexts/AuthContext';
import { useThemePreference, type ThemePreference } from '@/contexts/ThemePreferenceContext';
import { SettingsLinkRow } from '@/components/SettingsLinkRow';
import { SettingsSectionHeader } from '@/components/SettingsSectionHeader';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://app.plotbudget.com';
const HELP_EMAIL = 'mailto:hello@plotbudget.com';

/** Minimum touch target: 48dp/pt (Material 48dp, Apple 44pt). */
const MIN_TOUCH_TARGET = 48;

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
}[] = [
  { value: 'dark', label: 'Dark', icon: 'moon-o' },
  { value: 'light', label: 'Light', icon: 'sun-o' },
  { value: 'system', label: 'System', icon: 'adjust' },
];

const SEGMENT_ICON_SIZE = 22;
const SEGMENT_ICON_BOX_HEIGHT = 28;

function AppearanceSegment({
  preference,
  setPreference,
  colors,
  spacing,
  borderRadius,
  typography,
}: {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  colors: import('@repo/design-tokens/native').ColorPalette;
  spacing: typeof import('@repo/design-tokens/native').spacing;
  borderRadius: typeof import('@repo/design-tokens/native').borderRadius;
  typography: typeof import('@repo/design-tokens/native').typography;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs }}>
      {THEME_OPTIONS.map((opt) => {
        const selected = preference === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => setPreference(opt.value)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: MIN_TOUCH_TARGET,
              borderRadius: borderRadius.lg,
              borderWidth: 2,
              borderColor: selected ? colors.accentPrimary : colors.borderSubtle,
              backgroundColor: selected
                ? colors.accentPrimary + '18'
                : pressed
                  ? colors.bgElevated
                  : colors.bgSecondary,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.xs,
            })}>
            <View
              style={{
                height: SEGMENT_ICON_BOX_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.xs,
              }}>
              <FontAwesome
                name={opt.icon}
                size={SEGMENT_ICON_SIZE}
                color={selected ? colors.accentPrimary : colors.textSecondary}
              />
            </View>
            <BodyText
              fontFamily="body"
              numberOfLines={1}
              style={{
                fontSize: typography.fontSize.sm,
                fontWeight: selected ? typography.fontWeight.semibold : typography.fontWeight.regular,
                color: selected ? colors.accentPrimary : colors.textPrimary,
              }}>
              {opt.label}
            </BodyText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { preference, setPreference } = useThemePreference();
  const { colors, spacing, borderRadius, typography } = useTheme();

  const email = session?.user?.email ?? '';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      contentContainerStyle={{ paddingBottom: spacing['2xl'] }}>
      <Container paddingX="md">
        <HeadlineText
          fontFamily="heading"
          style={{
            marginTop: spacing.lg,
            marginBottom: spacing.xs,
            fontSize: typography.fontSize.headlineSm,
            fontWeight: typography.fontWeight.bold,
            textTransform: 'uppercase',
            letterSpacing: typography.letterSpacing.wider,
          }}>
          Settings
        </HeadlineText>
        <BodyText color="secondary" style={{ marginBottom: spacing.lg, fontSize: typography.fontSize.sm }}>
          Manage your account and household preferences.
        </BodyText>

        <Card variant="default" padding="lg" style={{ marginTop: spacing.sm }}>
          <SettingsSectionHeader title="Appearance" />
          <View style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
            <AppearanceSegment
              preference={preference}
              setPreference={setPreference}
              colors={colors}
              spacing={spacing}
              borderRadius={borderRadius}
              typography={typography}
            />
            <LabelText color="secondary" style={{ marginTop: spacing.sm, fontSize: typography.fontSize.xs }}>
              System uses your device light/dark setting
            </LabelText>
          </View>
        </Card>

        <Card variant="default" padding="none" style={{ marginTop: spacing.md }}>
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs }}>
            <SettingsSectionHeader title="Account" />
            <SettingsLinkRow
              label="Manage account"
              sublabel={email}
              onPress={() => WebBrowser.openBrowserAsync(`${APP_URL}/dashboard/settings`)}
              isLastInSection={false}
              noHorizontalPadding
            />
            <SettingsLinkRow
              label="Export my data"
              sublabel="Download CSV from web"
              onPress={() => WebBrowser.openBrowserAsync(`${APP_URL}/dashboard/settings?tab=privacy`)}
              isLastInSection
              noHorizontalPadding
            />
          </View>
        </Card>

        <Card variant="default" padding="none" style={{ marginTop: spacing.md }}>
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs }}>
            <SettingsSectionHeader title="Support" />
            <SettingsLinkRow
              label="Help"
              sublabel="Contact us"
              onPress={() => Linking.openURL(HELP_EMAIL)}
              isLastInSection={false}
              noHorizontalPadding
            />
            <SettingsLinkRow
              label="Pricing"
              sublabel="Plans & support PLOT"
              onPress={() => WebBrowser.openBrowserAsync(`${APP_URL}/pricing`)}
              isLastInSection
              noHorizontalPadding
            />
          </View>
        </Card>

        <Card variant="default" padding="lg" style={{ marginTop: spacing.md }}>
          <Button
            variant="outline"
            size="md"
            onPress={() => void signOut()}
            style={{ minHeight: MIN_TOUCH_TARGET }}>
            Log out
          </Button>
        </Card>

        <Card variant="default" padding="lg" style={{ marginTop: spacing['2xl'] }}>
          <SettingsSectionHeader title="Danger zone" />
          <BodyText
            fontFamily="body"
            color="secondary"
            style={{ fontSize: typography.fontSize.sm, marginBottom: spacing.md }}>
            This action cannot be undone. All your data will be permanently deleted. Manage on web.
          </BodyText>
          <Button
            variant="destructive"
            size="md"
            onPress={() => WebBrowser.openBrowserAsync(`${APP_URL}/dashboard/settings?tab=privacy`)}
            style={{ minHeight: MIN_TOUCH_TARGET }}>
            Delete my account
          </Button>
        </Card>
      </Container>
    </ScrollView>
  );
}
