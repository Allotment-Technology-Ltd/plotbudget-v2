import React from 'react';
import { View, Pressable } from 'react-native';
import { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { hapticImpact } from '@/lib/haptics';
import { SubheadingText, BodyText, Text, useTheme } from '@repo/native-ui';
import { format } from 'date-fns';
import { AppBottomSheet } from './AppBottomSheet';
import type { PaycycleOption } from '@/lib/blueprint-data';

interface CyclePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  paycycles: PaycycleOption[];
  selectedPaycycleId: string | null;
  onSelect: (cycleId: string) => void;
}

function cycleLabel(c: PaycycleOption) {
  return c.status === 'active' ? 'Current cycle' : c.status === 'draft' ? 'Next cycle' : format(new Date(c.start_date), 'MMM yyyy');
}

export function CyclePickerSheet({
  visible,
  onClose,
  paycycles,
  selectedPaycycleId,
  onSelect,
}: CyclePickerSheetProps) {
  const { colors, spacing } = useTheme();

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['50%', '90%']}
    >
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
        <SubheadingText style={{ marginBottom: spacing.md }}>Select pay cycle</SubheadingText>
      </View>
      <BottomSheetFlatList<PaycycleOption>
        data={paycycles}
        keyExtractor={(item: PaycycleOption) => item.id}
        renderItem={({ item }: { item: PaycycleOption }) => (
          <Pressable
            onPress={() => { hapticImpact('light'); onSelect(item.id); }}
            style={{
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
            }}>
            <BodyText style={{ fontWeight: selectedPaycycleId === item.id ? '600' : '400' }}>
              {cycleLabel(item)}
            </BodyText>
            <Text variant="label-sm" color="secondary">
              {format(new Date(item.start_date), 'MMM d')} – {format(new Date(item.end_date), 'MMM d, yyyy')}
            </Text>
          </Pressable>
        )}
        ListFooterComponent={
          <Pressable onPress={() => { hapticImpact('light'); onClose(); }} style={{ marginTop: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.md }}>
            <Text variant="label-sm" color="secondary">Cancel</Text>
          </Pressable>
        }
      />
    </AppBottomSheet>
  );
}
