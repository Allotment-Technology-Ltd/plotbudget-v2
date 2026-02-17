import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import { z } from 'zod';
import type { Database } from '@repo/supabase';
import {
  Container,
  Section,
  Card,
  HeadlineText,
  BodyText,
  LabelText,
  Input,
  Button,
  useTheme,
} from '@repo/native-ui';
import {
  calculateCycleStartDate,
  calculateCycleEndDate,
  parseIncome,
  type CurrencyCode,
} from '@repo/logic';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboardingStatus } from '@/contexts/OnboardingStatusContext';
import { supabase } from '@/lib/supabase';
import { createIncomeSourceApi } from '@/lib/income-source-api';

/** Dropdown that matches web Select: tap to open modal, pick one option. */
function SelectDropdown<T extends string>({
  value,
  onValueChange,
  options,
  placeholder,
  label,
  helperText,
  colors,
  spacing,
  borderRadius,
}: {
  value: T | '';
  onValueChange: (v: T) => void;
  options: { value: T; label: string }[];
  placeholder: string;
  label?: string;
  helperText?: string;
  colors: import('@repo/design-tokens/native').ColorPalette;
  spacing: typeof import('@repo/design-tokens/native').spacing;
  borderRadius: typeof import('@repo/design-tokens/native').borderRadius;
}) {
  const [visible, setVisible] = useState(false);
  const selectedLabel = value ? options.find((o) => o.value === value)?.label ?? value : null;

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label != null && (
        <LabelText style={{ marginBottom: spacing.xs }}>{label}</LabelText>
      )}
      <Pressable
        onPress={() => setVisible(true)}
        style={{
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          borderRadius: borderRadius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          backgroundColor: colors.bgSecondary,
        }}>
        <BodyText style={{ color: selectedLabel ? colors.textPrimary : colors.textSecondary }}>
          {selectedLabel ?? placeholder}
        </BodyText>
      </Pressable>
      {helperText != null && (
        <BodyText color="secondary" style={{ marginTop: spacing.xs, fontSize: 12 }}>
          {helperText}
        </BodyText>
      )}
      <Modal visible={visible} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}
          onPress={() => setVisible(false)}>
          <Pressable
            style={{
              marginHorizontal: spacing.lg,
              backgroundColor: colors.bgPrimary,
              borderRadius: borderRadius.lg,
              maxHeight: 320,
            }}
            onPress={(e) => e.stopPropagation()}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onValueChange(item.value);
                    setVisible(false);
                  }}
                  style={{
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderSubtle,
                  }}>
                  <BodyText
                    style={{
                      color: item.value === value ? colors.accentPrimary : colors.textPrimary,
                      fontWeight: item.value === value ? '600' : '400',
                    }}>
                    {item.label}
                  </BodyText>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const onboardingSchema = z
  .object({
    mode: z.enum(['solo', 'couple']),
    myName: z.string().optional(),
    currency: z.enum(['GBP', 'USD', 'EUR']),
    myIncome: z
      .union([z.string(), z.number(), z.undefined()])
      .transform((v) => {
        const n = parseIncome(v);
        return Number.isFinite(n) ? n : 0;
      })
      .pipe(z.number().min(0.01, 'Income must be greater than 0')),
    partnerIncome: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => {
        if (v === '' || v == null) return undefined;
        const n = parseIncome(v);
        return Number.isFinite(n) ? n : undefined;
      })
      .pipe(z.number().min(0).optional()),
    partnerName: z.string().optional(),
    payCycleType: z.enum([
      'specific_date',
      'last_working_day',
      'every_4_weeks',
    ]),
    payDay: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => {
        if (v === '' || v == null) return undefined;
        const n = Number(v);
        return Number.isFinite(n) && n >= 1 && n <= 31 ? n : undefined;
      })
      .pipe(z.number().min(1).max(31).optional()),
    anchorDate: z
      .string()
      .optional()
      .transform((s) => (typeof s === 'string' && s.trim() ? s.trim() : undefined)),
    jointRatio: z.number().min(0).max(100),
  })
  .refine(
    (data) => {
      if (data.mode === 'couple') {
        return (
          data.partnerIncome != null &&
          data.partnerIncome > 0 &&
          data.partnerName != null &&
          data.partnerName.trim().length > 0 &&
          data.myName != null &&
          data.myName.trim().length > 0
        );
      }
      return true;
    },
    { message: 'Your name, partner income and partner name required for couple mode', path: ['myName'] }
  )
  .refine(
    (data) => {
      if (data.payCycleType === 'specific_date') {
        return data.payDay != null && data.payDay >= 1 && data.payDay <= 31;
      }
      return true;
    },
    { message: 'Please select a pay day (1–31)', path: ['payDay'] }
  )
  .refine(
    (data) => {
      if (data.payCycleType === 'every_4_weeks') {
        return data.anchorDate != null && data.anchorDate.length > 0;
      }
      return true;
    },
    { message: 'Please enter your next pay date', path: ['anchorDate'] }
  );

const CURRENCIES: { value: CurrencyCode; label: string }[] = [
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

const PAY_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1) as `${number}`,
  label: String(i + 1),
}));

export default function OnboardingScreen() {
  const { session } = useAuth();
  const { refetch: refetchOnboarding } = useOnboardingStatus();
  const router = useRouter();
  const { colors, spacing, borderRadius } = useTheme();

  const [mode, setMode] = useState<'solo' | 'couple'>('solo');
  const [myName, setMyName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('GBP');
  const [myIncome, setMyIncome] = useState('');
  const [partnerIncome, setPartnerIncome] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [payCycleType, setPayCycleType] = useState<
    'specific_date' | 'last_working_day' | 'every_4_weeks'
  >('specific_date');
  const [payDay, setPayDay] = useState<string>('');
  const [anchorDate, setAnchorDate] = useState('');
  const [anchorDateObj, setAnchorDateObj] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [jointRatio, setJointRatio] = useState(50);
  const [loading, setLoading] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  const calculatedRatio = useMemo(() => {
    if (mode !== 'couple' || !myIncome || !partnerIncome) return 50;
    const my = parseIncome(myIncome);
    const partner = parseIncome(partnerIncome);
    if (!Number.isFinite(my) || !Number.isFinite(partner)) return 50;
    const total = my + partner;
    if (total <= 0) return 50;
    return Math.round((my / total) * 100);
  }, [mode, myIncome, partnerIncome]);

  const isCouple = mode === 'couple';

  const handleSubmit = async () => {
    setRootError(null);
    const raw = {
      mode,
      myName: myName.trim() || undefined,
      currency,
      myIncome: myIncome || undefined,
      partnerIncome: partnerIncome || undefined,
      partnerName: partnerName.trim() || undefined,
      payCycleType,
      payDay: payDay ? Number(payDay) : undefined,
      anchorDate: anchorDate.trim() || undefined,
      jointRatio: isCouple ? jointRatio : 50,
    };
    const parsed = onboardingSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg =
        (first.myName?.[0]) ??
        (first.payDay?.[0]) ??
        (first.anchorDate?.[0]) ??
        (first.myIncome?.[0]) ??
        parsed.error.message;
      setRootError(msg);
      return;
    }

    const user = session?.user;
    if (!user) {
      setRootError('Not authenticated');
      return;
    }

    setLoading(true);
    try {
      const data = parsed.data;
      const totalIncome =
        Number(data.myIncome) + (data.partnerIncome ? Number(data.partnerIncome) : 0);
      const finalJointRatio =
        data.mode === 'couple' ? (data.jointRatio ?? calculatedRatio) / 100 : 1.0;

      const householdInsert: Database['public']['Tables']['households']['Insert'] = {
        owner_id: user.id,
        is_couple: data.mode === 'couple',
        partner_name: data.partnerName ?? null,
        partner_income: data.partnerIncome ?? 0,
        total_monthly_income: totalIncome,
        pay_cycle_type: data.payCycleType,
        pay_day: data.payDay ?? null,
        pay_cycle_anchor: data.anchorDate ?? null,
        joint_ratio: finalJointRatio,
        currency: data.currency,
      };

      type HouseholdRow = Database['public']['Tables']['households']['Row'];
      const householdResult = await supabase
        .from('households')
        .insert(householdInsert as never)
        .select()
        .single();
      const householdError = (householdResult as { error: unknown }).error;
      const { data: household } = householdResult as {
        data: HouseholdRow | null;
        error: unknown;
      };

      if (householdError) {
        setRootError(
          (householdError as { message?: string })?.message ?? 'Failed to create household'
        );
        return;
      }

      const startDate = calculateCycleStartDate(
        data.payCycleType,
        data.payDay ?? undefined,
        data.anchorDate
      );
      const endDate = calculateCycleEndDate(
        data.payCycleType,
        startDate,
        data.payDay ?? undefined
      );

      type PaycycleRow = Database['public']['Tables']['paycycles']['Row'];
      const paycycleInsert: Database['public']['Tables']['paycycles']['Insert'] = {
        household_id: household?.id ?? '',
        status: 'active',
        name: 'First Paycycle',
        start_date: startDate,
        end_date: endDate,
        total_income: totalIncome,
        snapshot_user_income: data.myIncome,
        snapshot_partner_income: data.partnerIncome ?? 0,
      };

      const paycycleResult = await supabase
        .from('paycycles')
        .insert(paycycleInsert as never)
        .select()
        .single();
      const { data: paycycle, error: paycycleError } = paycycleResult as {
        data: PaycycleRow | null;
        error: unknown;
      };

      if (paycycleError) {
        setRootError(
          (paycycleError as { message?: string })?.message ?? 'Failed to create paycycle'
        );
        return;
      }

      const userUpdate: Database['public']['Tables']['users']['Update'] = {
        household_id: household?.id ?? null,
        current_paycycle_id: paycycle?.id ?? null,
        monthly_income: data.myIncome,
        has_completed_onboarding: true,
        onboarding_step: 6,
        ...(data.myName?.trim() && { display_name: data.myName.trim() }),
      };
      await supabase.from('users').update(userUpdate as never).eq('id', user.id);

      const householdId = household?.id ?? '';
      const frequencyRule = data.payCycleType as 'specific_date' | 'last_working_day' | 'every_4_weeks';
      const dayOfMonth = frequencyRule === 'specific_date' ? (data.payDay ?? 1) : null;
      const anchorDate = frequencyRule === 'every_4_weeks' && data.anchorDate?.trim() ? data.anchorDate.trim() : null;
      const canCreateIncomeSources =
        frequencyRule !== 'every_4_weeks' || anchorDate != null;

      if (householdId && data.myIncome > 0 && canCreateIncomeSources) {
        const myResult = await createIncomeSourceApi({
          household_id: householdId,
          name: 'My salary',
          amount: data.myIncome,
          frequency_rule: frequencyRule,
          day_of_month: dayOfMonth,
          anchor_date: anchorDate,
          payment_source: 'me',
          sort_order: 0,
        });
        if ('error' in myResult && __DEV__) {
          console.warn('[Onboarding] Could not create my income source:', myResult.error);
        }
      }
      if (householdId && data.mode === 'couple' && (data.partnerIncome ?? 0) > 0 && canCreateIncomeSources) {
        const partnerResult = await createIncomeSourceApi({
          household_id: householdId,
          name: 'Partner salary',
          amount: data.partnerIncome ?? 0,
          frequency_rule: frequencyRule,
          day_of_month: dayOfMonth,
          anchor_date: anchorDate,
          payment_source: 'partner',
          sort_order: 1,
        });
        if ('error' in partnerResult && __DEV__) {
          console.warn('[Onboarding] Could not create partner income source:', partnerResult.error);
        }
      }

      await refetchOnboarding();
      router.replace('/(tabs)/two' as import('expo-router').Href);
    } catch (err) {
      setRootError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const incomePlaceholder =
    currency === 'USD' ? '3000' : currency === 'EUR' ? '2800' : '2500';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
        style={{ flex: 1 }}>
        <Container paddingX="md">
          <Section spacing="xl">
            <Card variant="default" padding="lg">
              {/* Section 1: Mode (same as web) */}
              <HeadlineText
                style={{ marginBottom: spacing.xs, textTransform: 'uppercase' }}>
                Let&apos;s Set Up Your First Paycycle
              </HeadlineText>
              <BodyText color="secondary" style={{ marginBottom: spacing.lg }}>
                Tell us about your household so we can calculate your budget
              </BodyText>
              <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
                <Pressable
                  onPress={() => setMode('solo')}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.sm,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: mode === 'solo' ? colors.accentPrimary : colors.borderSubtle,
                    backgroundColor: mode === 'solo' ? colors.accentPrimary + '15' : undefined,
                  }}>
                  <BodyText
                    style={{
                      textAlign: 'center',
                      fontWeight: mode === 'solo' ? '600' : '400',
                      color: mode === 'solo' ? colors.accentPrimary : colors.textPrimary,
                    }}>
                    Just Me
                  </BodyText>
                </Pressable>
                <Pressable
                  onPress={() => setMode('couple')}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.sm,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: mode === 'couple' ? colors.accentPrimary : colors.borderSubtle,
                    backgroundColor: mode === 'couple' ? colors.accentPrimary + '15' : undefined,
                  }}>
                  <BodyText
                    style={{
                      textAlign: 'center',
                      fontWeight: mode === 'couple' ? '600' : '400',
                      color: mode === 'couple' ? colors.accentPrimary : colors.textPrimary,
                    }}>
                    Me & My Partner
                  </BodyText>
                </Pressable>
              </View>

              {/* User's name → User's salary → Partner's name → Partner's salary → Currency */}
              {isCouple && (
                <Input
                  label="Your Name"
                  placeholder="e.g. Adam"
                  value={myName}
                  onChangeText={(t) => setMyName(t.toUpperCase())}
                  inputStyle={{ textTransform: 'uppercase' }}
                  helperText="How you'd like to be called in the app (e.g. first name)."
                  containerStyle={{ marginBottom: spacing.md }}
                />
              )}

              <Input
                label="Your Monthly Income"
                placeholder={`e.g. ${incomePlaceholder}`}
                value={myIncome}
                onChangeText={(t) => setMyIncome(t.toUpperCase())}
                keyboardType="decimal-pad"
                inputStyle={{ textTransform: 'uppercase' }}
                helperText="Rough estimate for now. You can add specific income sources (with pay dates and amounts) in Settings after setup."
                containerStyle={{ marginBottom: spacing.md }}
              />

              {isCouple && (
                <>
                  <Input
                    label="Partner's Name"
                    placeholder="e.g. Alex"
                    value={partnerName}
                    onChangeText={(t) => setPartnerName(t.toUpperCase())}
                    inputStyle={{ textTransform: 'uppercase' }}
                    containerStyle={{ marginBottom: spacing.md }}
                  />
                  <Input
                    label="Partner's Monthly Income"
                    placeholder={`e.g. ${incomePlaceholder}`}
                    value={partnerIncome}
                    onChangeText={(t) => setPartnerIncome(t.toUpperCase())}
                    keyboardType="decimal-pad"
                    inputStyle={{ textTransform: 'uppercase' }}
                    containerStyle={{ marginBottom: spacing.md }}
                  />
                </>
              )}

              <SelectDropdown
                label="Currency"
                placeholder="Select currency"
                options={CURRENCIES}
                value={currency}
                onValueChange={setCurrency}
                helperText="Used for all income and bills in your budget."
                colors={colors}
                spacing={spacing}
                borderRadius={borderRadius}
              />

              {/* When Do You Get Paid? - same labels as web */}
              <LabelText style={{ marginBottom: spacing.sm }}>When Do You Get Paid?</LabelText>
              <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
                {(
                  [
                    { value: 'specific_date' as const, label: 'Specific date (e.g., 25th)' },
                    { value: 'last_working_day' as const, label: 'Last working day' },
                    { value: 'every_4_weeks' as const, label: 'Every 4 weeks' },
                  ] as const
                ).map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setPayCycleType(opt.value)}
                    style={{
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor:
                        payCycleType === opt.value ? colors.accentPrimary : colors.borderSubtle,
                      backgroundColor:
                        payCycleType === opt.value ? colors.accentPrimary + '10' : undefined,
                    }}>
                    <BodyText
                      style={{
                        color:
                          payCycleType === opt.value ? colors.accentPrimary : colors.textPrimary,
                      }}>
                      {opt.label}
                    </BodyText>
                  </Pressable>
                ))}
              </View>

              {payCycleType === 'specific_date' && (
                <SelectDropdown
                  label="Pay day of month"
                  placeholder="Select day"
                  options={PAY_DAY_OPTIONS}
                  value={payDay}
                  onValueChange={setPayDay}
                  colors={colors}
                  spacing={spacing}
                  borderRadius={borderRadius}
                />
              )}

              {payCycleType === 'every_4_weeks' && (
                <View style={{ marginBottom: spacing.lg }}>
                  <LabelText style={{ marginBottom: spacing.xs }}>Next Pay Date</LabelText>
                  <Pressable
                    onPress={() => setShowDatePicker(true)}
                    style={{
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      borderRadius: borderRadius.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.md,
                      backgroundColor: colors.bgSecondary,
                    }}>
                    <BodyText
                      style={{
                        color: anchorDate ? colors.textPrimary : colors.textSecondary,
                      }}>
                      {anchorDate
                        ? new Date(anchorDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Select date'}
                    </BodyText>
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={anchorDateObj ?? new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(_, date) => {
                        if (Platform.OS === 'android') setShowDatePicker(false);
                        if (date) {
                          setAnchorDateObj(date);
                          setAnchorDate(date.toISOString().slice(0, 10));
                        }
                      }}
                      onTouchCancel={() => setShowDatePicker(false)}
                    />
                  )}
                  {Platform.OS === 'ios' && showDatePicker && (
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xs }}>
                      <Pressable
                        onPress={() => setShowDatePicker(false)}
                        style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
                        <BodyText style={{ color: colors.accentPrimary }}>Done</BodyText>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* How Should You Split Joint Bills? (couple) - slider like web */}
              {isCouple && (
                <View style={{ marginBottom: spacing.lg }}>
                  <LabelText style={{ marginBottom: spacing.xs }}>
                    How Should You Split Joint Bills?
                  </LabelText>
                  <BodyText color="secondary" style={{ marginBottom: spacing.sm, fontSize: 14 }}>
                    Based on your combined income, we suggest splitting{' '}
                    {calculatedRatio}% / {100 - calculatedRatio}%
                  </BodyText>
                  <Slider
                    minimumValue={0}
                    maximumValue={100}
                    step={1}
                    value={jointRatio}
                    onValueChange={(v) => setJointRatio(Math.round(v))}
                    minimumTrackTintColor={colors.accentPrimary}
                    maximumTrackTintColor={colors.borderSubtle}
                    thumbTintColor={colors.accentPrimary}
                    style={{ width: '100%', height: 40 }}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginTop: spacing.xs,
                    }}>
                    <BodyText style={{ fontSize: 14 }}>You: {jointRatio}%</BodyText>
                    <BodyText style={{ fontSize: 14 }}>Partner: {100 - jointRatio}%</BodyText>
                  </View>
                </View>
              )}

              {rootError && (
                <View
                  style={{
                    backgroundColor: colors.error + '20',
                    borderWidth: 1,
                    borderColor: colors.error,
                    borderRadius: 8,
                    padding: spacing.md,
                    marginBottom: spacing.md,
                  }}>
                  <BodyText style={{ color: colors.error }}>{rootError}</BodyText>
                </View>
              )}

              <Button
                onPress={() => void handleSubmit()}
                disabled={loading}
                isLoading={loading}>
                {loading ? 'Creating Blueprint...' : 'Create Your Blueprint'}
              </Button>
            </Card>
          </Section>
        </Container>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
