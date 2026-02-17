import React from 'react';
import { View, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { hapticImpact } from '@/lib/haptics';
import {
  Card,
  HeadlineText,
  BodyText,
  Text,
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

/**
 * In-app delete confirmation using React Native Modal so it matches app theme
 * and touchables work reliably (no bottom-sheet gesture conflicts).
 */
export function DeleteSeedConfirmModal({
  visible,
  seed,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteSeedConfirmModalProps) {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        }}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={{ width: '100%', maxWidth: 340 }}
        >
          <Card variant="default" padding="lg" style={{ borderWidth: 1, borderColor: colors.borderSubtle }}>
            <HeadlineText style={{ marginBottom: spacing.sm }}>Delete bill</HeadlineText>
            <BodyText color="secondary" style={{ marginBottom: spacing.lg }}>
              Are you sure you want to delete &quot;{seed?.name ?? ''}&quot;? This action cannot be undone.
            </BodyText>
            <View style={{ flexDirection: 'row', gap: spacing.md, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                onPress={() => { hapticImpact('light'); onClose(); }}
                disabled={isDeleting}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text variant="cta-sm" style={{ color: colors.textPrimary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { hapticImpact('medium'); onConfirm(); }}
                disabled={isDeleting}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.lg,
                  backgroundColor: colors.error,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                }}
              >
                {isDeleting ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text variant="cta-sm" style={{ color: '#fff' }}>Deleting...</Text>
                  </>
                ) : (
                  <Text variant="cta-sm" style={{ color: '#fff' }}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </Card>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
