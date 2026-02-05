'use client';

import React, { useState, useMemo } from 'react';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { CelebrationSequence } from '@/components/onboarding/celebration-sequence';
import { AnimatePresence } from 'framer-motion';

/** Strip £, commas, whitespace so "£3,100" or "3100" parse as numbers */
function parseIncome(value: unknown): number {
  if (value === '' || value === null || value === undefined) return NaN;
  const s = String(value).replace(/[£,\s]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

const onboardingSchema = z
  .object({
    mode: z.enum(['solo', 'couple']),
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
    // Pay day 1–31 only validated when "specific date" is selected; empty/absent → undefined
    payDay: z
      .union([z.string(), z.number()])
      .optional()
      .transform((v) => {
        if (v === '' || v == null) return undefined;
        const n = Number(v);
        return Number.isFinite(n) && n >= 1 && n <= 31 ? n : undefined;
      })
      .pipe(z.number().min(1).max(31).optional()),
    // Next pay date only validated when "every 4 weeks" is selected
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
          data.partnerName.trim().length > 0
        );
      }
      return true;
    },
    {
      message: 'Partner income and name required for couple mode',
      path: ['partnerIncome'],
    }
  )
  .refine(
    (data) => {
      if (data.payCycleType === 'specific_date') {
        return data.payDay != null && data.payDay >= 1 && data.payDay <= 31;
      }
      return true;
    },
    {
      message: 'Please select a pay day (1–31)',
      path: ['payDay'],
    }
  )
  .refine(
    (data) => {
      if (data.payCycleType === 'every_4_weeks') {
        return (
          data.anchorDate != null &&
          data.anchorDate.length > 0
        );
      }
      return true;
    },
    {
      message: 'Please enter your next pay date',
      path: ['anchorDate'],
    }
  );

type OnboardingFormData = z.infer<typeof onboardingSchema>;

function calculateCycleStartDate(
  type: 'specific_date' | 'last_working_day' | 'every_4_weeks',
  payDay?: number,
  anchorDate?: string
): string {
  const today = new Date();

  if (type === 'every_4_weeks' && anchorDate) {
    return anchorDate;
  }

  if (type === 'specific_date' && payDay != null) {
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), payDay);
    if (thisMonth > today) {
      const lastMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        payDay
      );
      return lastMonth.toISOString().split('T')[0];
    }
    return thisMonth.toISOString().split('T')[0];
  }

  if (type === 'last_working_day') {
    const lastDay = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );
    return lastDay.toISOString().split('T')[0];
  }

  return today.toISOString().split('T')[0];
}

function calculateCycleEndDate(
  type: 'specific_date' | 'last_working_day' | 'every_4_weeks',
  startDate: string,
  payDay?: number
): string {
  const start = new Date(startDate);

  if (type === 'every_4_weeks') {
    const end = new Date(start);
    end.setDate(end.getDate() + 27);
    return end.toISOString().split('T')[0];
  }

  const nextMonth = new Date(
    start.getFullYear(),
    start.getMonth() + 1,
    payDay ?? 1
  );
  nextMonth.setDate(nextMonth.getDate() - 1);
  return nextMonth.toISOString().split('T')[0];
}

/** Input wrapper with optional £ prefix. Uses forwardRef so react-hook-form's ref attaches to the real input. */
const IncomeInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input> & {
    id: string;
    placeholder?: string;
    error?: boolean;
  }
>(function IncomeInput({ id, placeholder, error, ...props }, ref) {
  return (
    <div className="relative flex">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-muted-foreground pointer-events-none">
        £
      </span>
      <Input
        ref={ref}
        id={id}
        type="number"
        placeholder={placeholder}
        className="pl-8"
        aria-invalid={error}
        {...props}
      />
    </div>
  );
});

export default function OnboardingPage() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema) as Resolver<OnboardingFormData>,
    defaultValues: {
      mode: 'solo',
      myIncome: undefined,
      partnerIncome: undefined,
      partnerName: '',
      payCycleType: 'specific_date',
      payDay: undefined,
      anchorDate: '',
      jointRatio: 50,
    },
  });

  const mode = form.watch('mode');
  const payCycleType = form.watch('payCycleType');
  const myIncome = form.watch('myIncome');
  const partnerIncome = form.watch('partnerIncome');

  // Suggested split ratio (user % of combined income) for couples
  const calculatedRatio = useMemo(() => {
    if (mode !== 'couple' || !myIncome || !partnerIncome) return 50;
    const total = Number(myIncome) + Number(partnerIncome);
    if (total <= 0) return 50;
    return Math.round((Number(myIncome) / total) * 100);
  }, [mode, myIncome, partnerIncome]);

  const isCouple = mode === 'couple';

  const onSubmit = async (data: OnboardingFormData) => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        form.setError('root', { message: 'Not authenticated' });
        return;
      }

      const totalIncome =
        Number(data.myIncome) + (data.partnerIncome ? Number(data.partnerIncome) : 0);
      const finalJointRatio =
        data.mode === 'couple'
          ? (data.jointRatio ?? calculatedRatio) / 100
          : 1.0;

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
      };
      type HouseholdRow = Database['public']['Tables']['households']['Row'];
      const householdResult = await supabase
        .from('households')
        .insert(householdInsert as never)
        .select()
        .single();
      const { data: household, error: householdError } =
        householdResult as { data: HouseholdRow | null; error: unknown };

      if (householdError) {
        form.setError('root', {
          message:
            (householdError as { message?: string })?.message ??
            'Failed to create household',
        });
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
      type PaycycleRow = Database['public']['Tables']['paycycles']['Row'];
      const paycycleResult = await supabase
        .from('paycycles')
        .insert(paycycleInsert as never)
        .select()
        .single();
      const { data: paycycle, error: paycycleError } =
        paycycleResult as { data: PaycycleRow | null; error: unknown };

      if (paycycleError) {
        form.setError('root', {
          message:
            (paycycleError as { message?: string })?.message ??
            'Failed to create paycycle',
        });
        return;
      }

      const userUpdate: Database['public']['Tables']['users']['Update'] = {
        household_id: household?.id ?? null,
        current_paycycle_id: paycycle?.id ?? null,
        monthly_income: data.myIncome,
        has_completed_onboarding: true,
        onboarding_step: 6,
      };
      await supabase
        .from('users')
        .update(userUpdate as never)
        .eq('id', user.id);

      setShowCelebration(true);
    } catch (err) {
      form.setError('root', {
        message:
          err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-2xl mx-auto px-0">
          <div className="bg-card rounded-lg border border-border p-6 md:p-8 shadow-elevated">
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
              aria-label="Onboarding: set up your first paycycle"
            >
              {/* Section 1: Mode */}
              <div className="space-y-4">
                <h1 className="font-heading text-headline-sm md:text-headline uppercase text-foreground">
                  Let&apos;s Set Up Your First Paycycle
                </h1>
                <p className="text-muted-foreground font-body mt-2">
                  Tell us about your household so we can calculate your budget
                </p>
                <Controller
                  name="mode"
                  control={form.control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      name="mode"
                      className="flex flex-col sm:flex-row gap-4"
                      aria-label="Household mode"
                    >
                      <RadioGroupItem value="solo" label="Just Me" />
                      <RadioGroupItem value="couple" label="Me & My Partner" />
                    </RadioGroup>
                  )}
                />
              </div>

              {/* Section 2: Income */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="myIncome">Your Monthly Income</Label>
                  <IncomeInput
                    id="myIncome"
                    placeholder="e.g. 2500"
                    error={!!form.formState.errors.myIncome}
                    {...form.register('myIncome')}
                  />
                  {form.formState.errors.myIncome && (
                    <p
                      id="myIncome-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {form.formState.errors.myIncome.message}
                    </p>
                  )}
                </div>

                {isCouple && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="partnerIncome">
                        Partner&apos;s Monthly Income
                      </Label>
                      <IncomeInput
                        id="partnerIncome"
                        placeholder="e.g. 2800"
                        error={!!form.formState.errors.partnerIncome}
                        {...form.register('partnerIncome')}
                      />
                      {form.formState.errors.partnerIncome && (
                        <p
                          id="partnerIncome-error"
                          className="text-sm text-destructive"
                          role="alert"
                        >
                          {form.formState.errors.partnerIncome.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partnerName">Partner&apos;s Name</Label>
                      <Input
                        id="partnerName"
                        type="text"
                        placeholder="e.g. Alex"
                        aria-invalid={!!form.formState.errors.partnerName}
                        aria-describedby={
                          form.formState.errors.partnerName
                            ? 'partnerName-error'
                            : undefined
                        }
                        {...form.register('partnerName')}
                      />
                      {form.formState.errors.partnerName && (
                        <p
                          id="partnerName-error"
                          className="text-sm text-destructive"
                          role="alert"
                        >
                          {form.formState.errors.partnerName.message}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Section 3: Pay Cycle */}
              <div className="space-y-4">
                <Label>When Do You Get Paid?</Label>
                <Controller
                  name="payCycleType"
                  control={form.control}
                  render={({ field }) => (
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="flex flex-col gap-2"
                      aria-label="Pay cycle type"
                    >
                      <RadioGroupItem
                        value="specific_date"
                        label="Specific date (e.g., 25th)"
                      />
                      <RadioGroupItem
                        value="last_working_day"
                        label="Last working day"
                      />
                      <RadioGroupItem
                        value="every_4_weeks"
                        label="Every 4 weeks"
                      />
                    </RadioGroup>
                  )}
                />

                {payCycleType === 'specific_date' && (
                  <div className="space-y-2">
                    <Label htmlFor="payDay">Pay day of month</Label>
                    <Controller
                      name="payDay"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={
                            field.value != null
                              ? String(field.value)
                              : ''
                          }
                          onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                        >
                          <SelectTrigger
                            id="payDay"
                            aria-invalid={!!form.formState.errors.payDay}
                            aria-describedby={
                              form.formState.errors.payDay
                                ? 'payDay-error'
                                : undefined
                            }
                          >
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(
                              (day) => (
                                <SelectItem
                                  key={day}
                                  value={day.toString()}
                                >
                                  {day}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.payDay && (
                      <p
                        id="payDay-error"
                        className="text-sm text-destructive"
                        role="alert"
                      >
                        {form.formState.errors.payDay.message}
                      </p>
                    )}
                  </div>
                )}

                {payCycleType === 'every_4_weeks' && (
                  <div className="space-y-2">
                    <Label htmlFor="anchorDate">Next Pay Date</Label>
                    <Input
                      id="anchorDate"
                      type="date"
                      aria-invalid={!!form.formState.errors.anchorDate}
                      aria-describedby={
                        form.formState.errors.anchorDate
                          ? 'anchorDate-error'
                          : undefined
                      }
                      {...form.register('anchorDate')}
                    />
                    {form.formState.errors.anchorDate && (
                      <p
                        id="anchorDate-error"
                        className="text-sm text-destructive"
                        role="alert"
                      >
                        {form.formState.errors.anchorDate.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Section 4: Split Ratio (Couples only) */}
              {isCouple && (
                <div className="space-y-4">
                  <Label>How Should You Split Joint Bills?</Label>
                  <p className="text-sm text-muted-foreground">
                    Based on your combined income, we suggest splitting{' '}
                    {calculatedRatio}% / {100 - calculatedRatio}%
                  </p>
                  <Controller
                    name="jointRatio"
                    control={form.control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Slider
                          min={0}
                          max={100}
                          step={5}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          aria-label="Your share of joint bills (percentage)"
                        />
                        <div className="flex justify-between text-sm font-body">
                          <span>You: {field.value}%</span>
                          <span>Partner: {100 - field.value}%</span>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}

              {form.formState.errors.root && (
                <div
                  className="rounded-md bg-destructive/10 border border-destructive/30 p-3"
                  role="alert"
                  aria-live="polite"
                >
                  <p className="text-sm text-destructive">
                    {form.formState.errors.root.message}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? 'Creating Blueprint...' : 'Create Your Blueprint'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCelebration && (
          <CelebrationSequence onComplete={() => setShowCelebration(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
