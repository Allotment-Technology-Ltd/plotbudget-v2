import React from 'react';
import { View } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import {
  Card,
  HeadlineText,
  BodyText,
  Button,
  useTheme,
} from '@repo/native-ui';
import type { Seed } from '@repo/supabase';
import { AppBottomSheet } from './AppBottomSheet';

interface DeleteSeedConfirmModalProps {
  visible: boolean;
  seed: Seed | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteSeedConfirmModal({
  visible,
  seed,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteSeedConfirmModalProps) {
  const { colors, spacing } = useTheme();

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      enableDynamicSizing
      enablePanDownToClose
    >
      <View style={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
        <Card variant="default" padding="lg" style={{ minWidth: 280 }}>
          <HeadlineText style={{ marginBottom: spacing.sm }}>Delete bill</HeadlineText>
          <BodyText color="secondary" style={{ marginBottom: spacing.lg }}>
            Are you sure you want to delete &quot;{seed?.name ?? ''}&quot;? This action cannot be undone.
          </BodyText>
          <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end' }}>
            <Button variant="outline" onPress={() => { hapticImpact('light'); onClose(); }} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              onPress={() => { hapticImpact('medium'); onConfirm(); }}
              isLoading={isDeleting}
              disabled={isDeleting}
              style={{ backgroundColor: colors.error }}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </View>
        </Card>
      </View>
    </AppBottomSheet>
  );
}
