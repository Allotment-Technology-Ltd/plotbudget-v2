import React from 'react';
import { View } from 'react-native';
import { Card, Text, SubheadingText, LabelText, BodyText, useTheme } from '@repo/native-ui';
import { formatCurrency, type CurrencyCode } from '@repo/logic';
import type { Seed } from '@repo/supabase';

export interface JointAccountSummaryProps {
  seeds: Seed[];
  currency: CurrencyCode;
  isPartner?: boolean;
  otherLabel?: string;
  userInitials?: string;
}

/**
 * Joint Account & Personal Set-Aside. Shown when couple and NOT active cycle (draft/archived). Matches web logic.
 */
export function JointAccountSummary({
  seeds,
  currency,
  isPartner = false,
  otherLabel = 'Partner',
  userInitials = '?',
}: JointAccountSummaryProps) {
  const { colors, spacing } = useTheme();
  const otherName = otherLabel;

  const jointSeeds = seeds.filter((s) => s.payment_source === 'joint');
  const jointTransferSeeds = jointSeeds.filter((s) => (s as Seed & { uses_joint_account?: boolean }).uses_joint_account === true);
  const jointOwnAccountSeeds = jointSeeds.filter((s) => (s as Seed & { uses_joint_account?: boolean }).uses_joint_account !== true);

  const jointTotal = jointTransferSeeds.reduce((sum, s) => sum + Number(s.amount), 0);
  const userJointTransfer = jointTransferSeeds.reduce((sum, s) => sum + Number((s as Seed & { amount_me?: number }).amount_me ?? 0), 0);
  const partnerJointTransfer = jointTransferSeeds.reduce((sum, s) => sum + Number((s as Seed & { amount_partner?: number }).amount_partner ?? 0), 0);

  const userMeTotal = seeds.filter((s) => s.payment_source === 'me').reduce((sum, s) => sum + Number(s.amount), 0);
  const userJointOwnAccount = jointOwnAccountSeeds.reduce((sum, s) => sum + Number((s as Seed & { amount_me?: number }).amount_me ?? 0), 0);
  const partnerTotal = seeds.filter((s) => s.payment_source === 'partner').reduce((sum, s) => sum + Number(s.amount), 0);
  const partnerJointOwnAccount = jointOwnAccountSeeds.reduce((sum, s) => sum + Number((s as Seed & { amount_partner?: number }).amount_partner ?? 0), 0);

  const userTotalSetAside = userMeTotal + userJointOwnAccount;
  const partnerTotalSetAside = partnerTotal + partnerJointOwnAccount;

  if (jointTotal === 0 && userTotalSetAside === 0 && partnerTotalSetAside === 0) {
    return null;
  }

  const myTransfer = isPartner ? partnerJointTransfer : userJointTransfer;
  const theirTransfer = isPartner ? userJointTransfer : partnerJointTransfer;
  const mySetAside = isPartner ? partnerTotalSetAside : userTotalSetAside;
  const theirSetAside = isPartner ? userTotalSetAside : partnerTotalSetAside;

  return (
    <Card variant="default" padding="lg" style={{ marginBottom: spacing.lg }}>
      <SubheadingText style={{ marginBottom: spacing.md }}>Joint Account & Personal Set-Aside</SubheadingText>
      <View style={{ gap: spacing.md }}>
        {jointTotal > 0 && (
          <View style={{ padding: spacing.md, backgroundColor: colors.accentPrimary + '15', borderRadius: 8, borderWidth: 1, borderColor: colors.accentPrimary + '30' }}>
            <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Transfer to Joint</LabelText>
            <View style={{ alignSelf: 'flex-start' }}>
              <Text variant="headline-sm" numberOfLines={1} style={{ marginBottom: spacing.xs }}>{formatCurrency(jointTotal, currency)}</Text>
            </View>
            <BodyText color="secondary">
              You: {formatCurrency(myTransfer, currency)} • {otherName}: {formatCurrency(theirTransfer, currency)}
            </BodyText>
          </View>
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          <View style={{ flex: 1, minWidth: 140, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentPrimary + '20', alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="label-sm" style={{ color: colors.accentPrimary }}>{userInitials}</Text>
              </View>
              <LabelText color="secondary" numberOfLines={1}>Your Set-Aside</LabelText>
            </View>
            <View style={{ alignSelf: 'flex-start' }}>
              <Text variant="headline-sm" numberOfLines={1} style={{ marginBottom: 2 }}>{formatCurrency(mySetAside, currency)}</Text>
            </View>
            <Text variant="body-sm" color="secondary" numberOfLines={3}>
              {isPartner
                ? `Your bills (${formatCurrency(partnerTotal, currency)}) + your share of joint from own account (${formatCurrency(partnerJointOwnAccount, currency)})`
                : `Your bills (${formatCurrency(userMeTotal, currency)}) + your share of joint from own account (${formatCurrency(userJointOwnAccount, currency)})`}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 140, padding: spacing.md, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.borderSubtle, alignItems: 'center', justifyContent: 'center' }}>
                <Text variant="label-sm" color="secondary">{(otherName || '?').charAt(0)}</Text>
              </View>
              <LabelText color="secondary" numberOfLines={1}>{otherName}&apos;s Set-Aside</LabelText>
            </View>
            <View style={{ alignSelf: 'flex-start' }}>
              <Text variant="headline-sm" numberOfLines={1} style={{ marginBottom: 2 }}>{formatCurrency(theirSetAside, currency)}</Text>
            </View>
            <Text variant="body-sm" color="secondary" numberOfLines={3}>
              Their bills ({formatCurrency(partnerTotal, currency)}) + their share of joint from own account ({formatCurrency(partnerJointOwnAccount, currency)})
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}
