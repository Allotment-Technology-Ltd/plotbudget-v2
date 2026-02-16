import React from 'react';
import { View, Pressable } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import { Card, Text, useTheme } from '@repo/native-ui';
import type { Seed } from '@repo/supabase';
import { SeedCard } from './SeedCard';
import type { Payer } from '@/lib/mark-seed-paid';

type SeedType = 'need' | 'want' | 'savings' | 'repay';

const CATEGORY_LABELS: Record<SeedType, string> = {
  need: 'Needs',
  want: 'Wants',
  savings: 'Savings',
  repay: 'Repayments',
};

const CATEGORY_SINGULAR: Record<SeedType, string> = {
  need: 'Need',
  want: 'Want',
  savings: 'Saving',
  repay: 'Repayment',
};

export interface BlueprintCategorySectionProps {
  category: SeedType;
  seeds: Seed[];
  currency: string;
  isRitualMode: boolean;
  isCycleLocked: boolean;
  isJoint: (seed: Seed) => boolean;
  otherLabel: string;
  onAdd: () => void;
  onEdit: (seed: Seed) => void;
  onDelete: (seed: Seed) => void;
  onMarkPaid?: (seedId: string, payer: Payer) => void;
  onUnmarkPaid?: (seedId: string, payer: Payer) => void;
}

export function BlueprintCategorySection({
  category,
  seeds,
  currency,
  isRitualMode,
  isCycleLocked,
  isJoint,
  otherLabel,
  onAdd,
  onEdit,
  onDelete,
  onMarkPaid,
  onUnmarkPaid,
}: BlueprintCategorySectionProps) {
  const { colors, spacing, borderRadius } = useTheme();

  const paidInCat = seeds.filter((s) => s.is_paid).length;
  const canMarkUnmark = !isCycleLocked && isRitualMode;

  return (
    <Card variant="default" padding="md" style={{ marginBottom: spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: spacing.md }}>
        <View>
          <Text variant="sub-sm">
            {CATEGORY_LABELS[category]} ({seeds.length})
          </Text>
          {isRitualMode && seeds.length > 0 && (
            <Text variant="body-sm" color="secondary">
              {paidInCat}/{seeds.length} paid
            </Text>
          )}
        </View>
        {!isCycleLocked && (
          <Pressable
            onPress={() => { hapticImpact('light'); onAdd(); }}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}>
            <Text variant="body-sm">+ Add {CATEGORY_SINGULAR[category]}</Text>
          </Pressable>
        )}
      </View>
      {seeds.length === 0 ? (
        <Text variant="body-sm" color="secondary" style={{ textAlign: 'center', marginVertical: spacing.md }}>
          No {CATEGORY_LABELS[category].toLowerCase()} yet
        </Text>
      ) : (
        seeds.map((seed) => (
          <SeedCard
            key={seed.id}
            seed={seed}
            currency={currency as 'GBP' | 'USD' | 'EUR'}
            isRitualMode={isRitualMode}
            isCycleLocked={isCycleLocked}
            isJoint={isJoint(seed)}
            otherLabel={otherLabel}
            onEdit={() => onEdit(seed)}
            onDelete={() => onDelete(seed)}
            onMarkPaid={canMarkUnmark ? (payer) => onMarkPaid?.(seed.id, payer) : undefined}
            onUnmarkPaid={canMarkUnmark ? (payer) => onUnmarkPaid?.(seed.id, payer) : undefined}
          />
        ))
      )}
    </Card>
  );
}
