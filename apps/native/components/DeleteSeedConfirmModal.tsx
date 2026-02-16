'use client';

import React from 'react';
import { Modal, View, Pressable } from 'react-native';
import {
  Card,
  HeadlineText,
  BodyText,
  Button,
  useTheme,
} from '@repo/native-ui';
import type { Seed } from '@repo/supabase';

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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        }}
        onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card variant="default" padding="lg" style={{ minWidth: 280 }}>
            <HeadlineText style={{ marginBottom: spacing.sm }}>Delete bill</HeadlineText>
            <BodyText color="secondary" style={{ marginBottom: spacing.lg }}>
              Are you sure you want to delete &quot;{seed?.name ?? ''}&quot;? This action cannot be undone.
            </BodyText>
            <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end' }}>
              <Button variant="outline" onPress={onClose} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                onPress={onConfirm}
                isLoading={isDeleting}
                disabled={isDeleting}
                style={{ backgroundColor: colors.error }}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </View>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
