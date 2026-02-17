import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import { Card, Text, BodyText, useTheme } from '@repo/native-ui';

export interface BlueprintHowItWorksProps {
  isCouple: boolean;
}

/**
 * Expandable "How the Blueprint works" section. Matches web copy and order.
 */
export function BlueprintHowItWorks({ isCouple }: BlueprintHowItWorksProps) {
  const { colors, spacing } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card variant="default" style={{ marginBottom: spacing.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderSubtle }}>
      <Pressable
        onPress={() => {
          hapticImpact('light');
          setExpanded((v) => !v);
        }}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
        }}>
        <Text variant="sub-sm" style={{ color: colors.textPrimary }}>
          How the Blueprint works
        </Text>
        <Text variant="label-sm" color="secondary">
          {expanded ? '▲' : '▼'}
        </Text>
      </Pressable>
      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingHorizontal: spacing.md, paddingBottom: spacing.md, paddingTop: spacing.sm }}>
          <BodyText color="secondary" style={{ marginBottom: spacing.sm }}>
            • Add or edit bills below. Tap a bill to change it, or use the category buttons to add more.
          </BodyText>
          {isCouple && (
            <BodyText color="secondary" style={{ marginBottom: spacing.sm }}>
              • On payday, transfer the amounts shown in Payday Transfers so the right money is in the right place.
            </BodyText>
          )}
          <BodyText color="secondary">
            • Mark each bill as paid using the checkboxes as you pay it. Bills with a due date are marked as paid automatically once that date has passed.
          </BodyText>
        </View>
      )}
    </Card>
  );
}
