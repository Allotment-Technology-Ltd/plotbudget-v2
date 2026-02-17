import React from 'react';
import { View } from 'react-native';
import { Card, Text, SubheadingText, BodyText, LabelText, useTheme } from '@repo/native-ui';
import { formatCurrency, type CurrencyCode } from '@repo/logic';
import type { Seed } from '@repo/supabase';

export interface RitualTransferSummaryProps {
  seeds: Seed[];
  currency: CurrencyCode;
  isPartner?: boolean;
  otherLabel?: string;
  userInitials?: string;
}

function getJointTransfer(seeds: Seed[]) {
  const jointTransferSeeds = seeds.filter(
    (s) => s.payment_source === 'joint' && (s as Seed & { uses_joint_account?: boolean }).uses_joint_account === true
  );
  const totalJointTransfer = jointTransferSeeds.reduce((sum, s) => sum + Number(s.amount), 0);
  const userJointTransfer = jointTransferSeeds.reduce((sum, s) => sum + Number((s as Seed & { amount_me?: number }).amount_me ?? 0), 0);
  const partnerJointTransfer = jointTransferSeeds.reduce((sum, s) => sum + Number((s as Seed & { amount_partner?: number }).amount_partner ?? 0), 0);
  return { totalJointTransfer, userJointTransfer, partnerJointTransfer };
}

function getUserSetAside(seeds: Seed[]) {
  const userPersonalSeeds = seeds.filter((s) => s.payment_source === 'me');
  const userJointFromOwnAccount = seeds.filter(
    (s) => s.payment_source === 'joint' && (s as Seed & { uses_joint_account?: boolean }).uses_joint_account === false
  );
  return (
    userPersonalSeeds.reduce((sum, s) => sum + Number(s.amount), 0) +
    userJointFromOwnAccount.reduce((sum, s) => sum + Number((s as Seed & { amount_me?: number }).amount_me ?? 0), 0)
  );
}

function getPartnerSetAside(seeds: Seed[]) {
  const partnerPersonalSeeds = seeds.filter((s) => s.payment_source === 'partner');
  const partnerJointFromOwnAccount = seeds.filter(
    (s) => s.payment_source === 'joint' && (s as Seed & { uses_joint_account?: boolean }).uses_joint_account === false
  );
  return (
    partnerPersonalSeeds.reduce((sum, s) => sum + Number(s.amount), 0) +
    partnerJointFromOwnAccount.reduce((sum, s) => sum + Number((s as Seed & { amount_partner?: number }).amount_partner ?? 0), 0)
  );
}

/**
 * Payday Transfers: Transfer to Joint, Your Set-Aside, Partner's Set-Aside. Shown when active cycle + couple. Matches web.
 */
export function RitualTransferSummary({
  seeds,
  currency,
  isPartner = false,
  otherLabel = 'Partner',
  userInitials = '?',
}: RitualTransferSummaryProps) {
  const { colors, spacing } = useTheme();
  const { totalJointTransfer, userJointTransfer, partnerJointTransfer } = getJointTransfer(seeds);
  const userSetAside = getUserSetAside(seeds);
  const partnerSetAside = getPartnerSetAside(seeds);
  const otherName = otherLabel;
  const myJoint = isPartner ? partnerJointTransfer : userJointTransfer;
  const theirJoint = isPartner ? userJointTransfer : partnerJointTransfer;
  const mySetAside = isPartner ? partnerSetAside : userSetAside;
  const theirSetAside = isPartner ? userSetAside : partnerSetAside;

  return (
    <Card variant="default" padding="lg" style={{ marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.accentPrimary + '50' }}>
      <SubheadingText style={{ marginBottom: spacing.md }}>Payday Transfers</SubheadingText>
      <View style={{ gap: spacing.lg }}>
        {totalJointTransfer > 0 && (
          <View>
            <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Transfer to Joint Account</LabelText>
            <View style={{ alignSelf: 'flex-start' }}>
              <Text variant="headline-sm" numberOfLines={1} style={{ color: colors.accentPrimary, marginBottom: spacing.xs }}>
                {formatCurrency(totalJointTransfer, currency)}
              </Text>
            </View>
            <BodyText color="secondary">
              You: {formatCurrency(myJoint, currency)} • {otherName}: {formatCurrency(theirJoint, currency)}
            </BodyText>
          </View>
        )}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
          <View style={{ flex: 1, minWidth: 140 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.accentPrimary + '20', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
              <Text variant="label-sm" style={{ color: colors.accentPrimary }}>{userInitials}</Text>
            </View>
            <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>Your Set-Aside</LabelText>
            <View style={{ alignSelf: 'flex-start' }}>
              <Text variant="headline-sm" numberOfLines={1} style={{ marginBottom: 2 }}>{formatCurrency(mySetAside, currency)}</Text>
            </View>
            <Text variant="body-sm" color="secondary" numberOfLines={2}>Keep this in your account for your bills</Text>
          </View>
          <View style={{ flex: 1, minWidth: 140 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.borderSubtle, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
              <Text variant="label-sm" color="secondary">{(otherName || '?').charAt(0)}</Text>
            </View>
            <LabelText color="secondary" style={{ marginBottom: spacing.xs }}>{otherName}&apos;s Set-Aside</LabelText>
            <View style={{ alignSelf: 'flex-start' }}>
              <Text variant="headline-sm" numberOfLines={1} style={{ marginBottom: 2 }}>{formatCurrency(theirSetAside, currency)}</Text>
            </View>
            <Text variant="body-sm" color="secondary" numberOfLines={2}>They keep this for their bills</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}
