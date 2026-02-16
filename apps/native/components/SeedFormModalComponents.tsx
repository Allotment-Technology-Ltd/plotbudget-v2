import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { hapticImpact, hapticSelection } from '@/lib/haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BodyText, Text, useTheme } from '@repo/native-ui';

export function PillButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, spacing } = useTheme();
  return (
    <Pressable
      onPress={() => { hapticSelection(); onPress(); }}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 8,
        marginRight: spacing.sm,
        backgroundColor: selected ? colors.accentPrimary : colors.bgElevated,
      }}>
      <BodyText style={{ color: selected ? '#fff' : colors.textPrimary, fontSize: 14 }}>{label}</BodyText>
    </Pressable>
  );
}

export function DatePickerField({
  value,
  onChange,
  showPicker,
  onShowPicker,
  onHidePicker,
  minDate,
  maxDate,
}: {
  value: string;
  onChange: (v: string) => void;
  showPicker: boolean;
  onShowPicker: () => void;
  onHidePicker: () => void;
  minDate?: Date;
  maxDate?: Date;
}) {
  const { colors, spacing, borderRadius } = useTheme();
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Pressable
          onPress={() => { hapticImpact('light'); onShowPicker(); }}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            backgroundColor: colors.bgSecondary,
          }}>
          <BodyText style={{ color: value ? colors.textPrimary : colors.textSecondary }}>
            {value
              ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Pick date'}
          </BodyText>
        </Pressable>
        {value ? (
          <Pressable onPress={() => { hapticImpact('light'); onChange(''); }} style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.sm }}>
            <Text variant="body-sm" style={{ color: colors.error }}>Clear</Text>
          </Pressable>
        ) : null}
      </View>
      {showPicker && (
        <>
          <DateTimePicker
            value={value ? new Date(value + 'T12:00:00') : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={minDate}
            maximumDate={maxDate}
            onChange={(_, date) => {
              if (Platform.OS === 'android') onHidePicker();
              if (date) onChange(date.toISOString().slice(0, 10));
            }}
          />
          {Platform.OS === 'ios' && (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xs }}>
              <Pressable onPress={() => { hapticImpact('light'); onHidePicker(); }} style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
                <BodyText style={{ color: colors.accentPrimary }}>Done</BodyText>
              </Pressable>
            </View>
          )}
        </>
      )}
    </>
  );
}

export function StatusPicker({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { colors, spacing, borderRadius } = useTheme();
  return (
    <View style={{ borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: borderRadius.md, overflow: 'hidden' }}>
      {options.map((opt, idx) => (
        <Pressable
          key={opt.value}
          onPress={() => { hapticSelection(); onChange(opt.value); }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            backgroundColor: value === opt.value ? colors.accentPrimary + '15' : colors.bgSecondary,
            borderBottomWidth: idx < options.length - 1 ? 1 : 0,
            borderBottomColor: colors.borderSubtle,
          }}>
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              borderWidth: 2,
              borderColor: value === opt.value ? colors.accentPrimary : colors.borderSubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {value === opt.value && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentPrimary }} />
            )}
          </View>
          <BodyText style={{ color: value === opt.value ? colors.textPrimary : colors.textSecondary }}>{opt.label}</BodyText>
        </Pressable>
      ))}
    </View>
  );
}
