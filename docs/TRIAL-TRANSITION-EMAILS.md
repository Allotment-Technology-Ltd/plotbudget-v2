# Trial Transition Emails - Complete Flow

## 🎯 Overview

Guide users through the transition from Trial → Free tier OR Trial → Premium (PWYL), with clear communication about restrictions and options.

---

## 📅 Email Timeline

### Trial Period (First 2 Pay Cycles)

```
Day 0: User completes onboarding
↓
Email 1: Welcome to PLOT (Day 0)
↓
Day ~25: First pay cycle nearing completion
↓
Email 2: Trial Milestone - 1 of 2 cycles complete (Day 25)
↓
Day ~50: Second pay cycle nearing completion
↓
Email 3: Trial Ending Soon - 3 days warning (Day 50)
↓
Day ~53: Trial expires, Free tier restrictions activate
↓
Email 4: Trial Ended - Action Required (Day 53)
↓
Day 60: If still on Free tier with excess pots
↓
Email 5: Free Tier Reminder - Reduce or Upgrade (Day 60)
```

---

## 📧 Email Templates

### Email 1: Welcome to PLOT (Onboarding Complete)

**Sent**: Immediately after onboarding completion
**From**: hello@app.plotbudget.com
**Subject**: "Welcome to PLOT - Your trial has started!"

**Content**:
```
Hi [Name],

Welcome to PLOT! Your budgeting journey starts now.

🎁 Your Trial Benefits:
- 2 complete pay cycles to try everything
- Unlimited pots during trial (no restrictions)
- Full access to all features

What happens next:
1. Set up your budget and run your first pay cycle ritual
2. After 2 complete pay cycles, choose your plan:
   • Free: 2 pots, 5 needs, 5 wants (forever free)
   • Premium (PWYL): Unlimited everything, pay £0-£10/month (you choose)

No credit card required for trial.

[Get Started →] (links to /dashboard)

Questions? Just reply to this email.

Happy plotting!
PLOT Team
```

**Trigger**: Server action after onboarding completion

---

### Email 2: Trial Milestone (1 of 2 Cycles Complete)

**Sent**: When first pay cycle completes (status changes to 'completed')
**From**: hello@app.plotbudget.com
**Subject**: "PLOT Trial Update - Halfway there!"

**Content**:
```
Hi [Name],

You've completed your first pay cycle with PLOT! 🎉

Trial Progress: 1 of 2 cycles complete

You have one more pay cycle to explore all features before choosing your plan.

After your trial:
• Free tier: 2 savings pots, 5 bills, 5 wants
• Premium (PWYL): Unlimited pots, pay what feels fair (£0-£10/month)

Current pot count: [X] pots
↓ If you have more than 2 pots, you'll need to either:
  - Reduce to 2 pots to stay on Free tier
  - Upgrade to Premium to keep unlimited pots

[View Pricing Options →]

Enjoying PLOT? We'd love to hear your feedback!

PLOT Team
```

**Trigger**: Webhook or cron job monitoring `paycycles` table for completed cycles

---

### Email 3: Trial Ending Soon (3 Days Warning)

**Sent**: 3 days before 2nd pay cycle completes
**From**: hello@app.plotbudget.com
**Subject**: "⏰ Your PLOT trial ends in 3 days"

**Content**:
```
Hi [Name],

Your PLOT trial is ending soon!

Timeline:
✓ First pay cycle: Complete
✓ Second pay cycle: Ending in ~3 days
↓ After trial: Choose your plan

Your Current Setup:
- [X] bills (Free tier limit: 5)
- [X] wants (Free tier limit: 5)
- [X] savings pots (Free tier limit: 2)
- [X] repayments (Free tier limit: 2)

⚠️ Action Needed:

If you have more items than the free tier allows, you'll need to:

Option 1: Reduce to Free Tier Limits
[Review Your Pots →] (link to /dashboard/blueprint)
- Delete or archive excess pots
- Keep your 2 most important savings goals
- Keep your 2 highest priority repayments

Option 2: Upgrade to Premium (PWYL)
[View Pricing →] (link to /pricing)
- Pay what feels fair: £0-£10/month
- Keep all your pots (unlimited)
- No need to delete anything

Option 3: Do Nothing
- Trial will expire automatically
- Excess pots will be archived (not deleted)
- You can restore them anytime if you upgrade

What happens to archived pots?
- Your data is safe and can be restored
- Just won't appear in your current budget
- Upgrade anytime to restore them

Questions? Reply to this email.

PLOT Team
hello@plotbudget.com
```

**Trigger**: Scheduled job 3 days before estimated 2nd cycle completion

---

### Email 4: Trial Ended - Immediate Action

**Sent**: When 2nd pay cycle completes (trial officially ends)
**From**: hello@app.plotbudget.com
**Subject**: "Your PLOT trial has ended - Action required"

**Content**:
```
Hi [Name],

Your PLOT trial has ended. Here's what happens next:

Your Account Status:
- Current tier: Free
- Active pots: [X] ([Y] over limit)
- Status: ⚠️ Action Required

Free Tier Limits:
• 2 savings pots (you have [X])
• 2 repayments (you have [X])
• 5 bills/needs (you have [X])
• 5 wants (you have [X])

🚨 You currently have [Y] items over the free tier limit.

What You Need to Do:

1. REDUCE TO FREE TIER LIMITS (within 7 days)
   [Go to Blueprint →]
   
   Which pots to keep?
   - Focus on your top priorities
   - Archive the rest (you can restore them later)
   
   What happens if you don't reduce?
   - After 7 days, we'll automatically archive excess pots
   - Your data won't be deleted, just hidden from your budget
   - You can restore them anytime by upgrading to Premium

2. OR UPGRADE TO PREMIUM (PWYL)
   [View Pricing →]
   
   Pay what feels fair:
   - £0/month: Use Premium for free (Community Supporter)
   - £3/month: Our suggested amount (most popular)
   - £5-£10/month: Champion support
   
   ✓ Keep all your pots (unlimited)
   ✓ No need to archive anything
   ✓ Cancel or change amount anytime

Timeline:
- Today: Free tier restrictions active
- Day 7: Excess pots auto-archived if not reduced
- Anytime: Upgrade to restore full access

Need help deciding which pots to keep?
[Read Our Guide: Choosing Your Top Priorities →]

Questions? We're here to help - just reply to this email.

PLOT Team
hello@plotbudget.com

P.S. Remember, all your data is safe. Nothing is ever deleted without your explicit action.
```

**Trigger**: When 2nd pay cycle completes AND user has more pots than free tier allows

---

### Email 5: Free Tier Grace Period Ending (Day 7 Post-Trial)

**Sent**: 7 days after trial expires, IF user hasn't reduced pots OR upgraded
**From**: hello@app.plotbudget.com
**Subject**: "Final reminder: Reduce your pots or upgrade (tomorrow)"

**Content**:
```
Hi [Name],

Quick reminder: Your 7-day grace period ends tomorrow.

Current Status:
- You have [X] pots ([Y] over the free tier limit of 2)
- Free tier: 2 pots, 5 needs, 5 wants
- You're still on the Free tier

Tomorrow, we'll automatically archive your excess pots to:
- [Pot Name 1]
- [Pot Name 2]
- [Pot Name 3]

Your Options:

1. Reduce Now (5 minutes)
   [Go to Blueprint →]
   Archive the pots you want to pause
   
2. Upgrade to Premium (2 minutes)
   [Upgrade with PWYL - from £0/month →]
   Keep all your pots, pay what feels fair
   
3. Do Nothing
   We'll archive excess pots tomorrow
   You can restore them anytime by upgrading

What happens when pots are archived?
✓ Your data is saved (not deleted)
✓ Archived pots don't appear in your budget
✓ You can view archived pots in Settings
✓ Upgrade anytime to restore them instantly

[Reduce Pots Now →]  [Upgrade to Premium →]

Need help? Reply to this email.

PLOT Team
```

**Trigger**: 7 days after trial expiry, IF user still has excess pots

---

### Email 6: Pots Archived Notification

**Sent**: After automatic archiving occurs (Day 8 post-trial)
**From**: hello@app.plotbudget.com
**Subject**: "Your pots have been archived (not deleted)"

**Content**:
```
Hi [Name],

We've archived some of your pots to fit within the free tier limits.

Archived Pots:
- [Pot Name 1] ([Savings Goal])
- [Pot Name 2] ([Repayment])
- [Pot Name 3] ([Savings Goal])

Your Active Pots (Free Tier):
- [Active Pot 1]
- [Active Pot 2]

Important: Your data is safe!
✓ Nothing was deleted
✓ Archived pots are stored securely
✓ You can view them in Settings → Archived Pots
✓ Upgrade to Premium anytime to restore them instantly

[Restore All Pots - Upgrade to PWYL from £0/month →]

Current Free Tier Limits:
• 2 savings pots + 2 repayments
• 5 bills/needs, 5 wants
• All pay cycle features

Want to restore your archived pots?
Upgrade to Premium and choose what you pay (£0-£10/month).
Even at £0, you'll get unlimited pots back.

[Upgrade Now →]  [View Archived Pots →]

Questions? Reply to this email.

PLOT Team
```

**Trigger**: After automatic archiving script runs

---

## 🛠️ Implementation Details

### Database Schema for Archiving

```sql
-- Add archived_at column to seeds/pots/repayments
ALTER TABLE public.seeds ADD COLUMN archived_at TIMESTAMPTZ NULL;
ALTER TABLE public.pots ADD COLUMN archived_at TIMESTAMPTZ NULL;
ALTER TABLE public.repayments ADD COLUMN archived_at TIMESTAMPTZ NULL;

-- Archived items are filtered out from active queries
-- Can be restored by setting archived_at = NULL
```

### Auto-Archiving Logic

**File**: `apps/web/lib/actions/tier-enforcement.ts` (new)

```typescript
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPotsArchivedEmail } from '@/lib/email/trial-transition';

export async function enforceFreeTierLimits(householdId: string) {
  const supabase = createAdminClient();
  
  // Check if household is on free tier
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('current_tier')
    .eq('household_id', householdId)
    .maybeSingle();
  
  if (subscription?.current_tier === 'pro') {
    return; // Premium users have no limits
  }
  
  // Get all pots
  const { data: pots } = await supabase
    .from('pots')
    .select('id, name, category, target_amount')
    .eq('household_id', householdId)
    .is('archived_at', null)
    .order('created_at', { ascending: true });
  
  const { data: repayments } = await supabase
    .from('repayments')
    .select('id, name, current_balance')
    .eq('household_id', householdId)
    .is('archived_at', null)
    .order('created_at', { ascending: true });
  
  // Free tier limits
  const FREE_POT_LIMIT = 2;
  const FREE_REPAYMENT_LIMIT = 2;
  
  // Archive excess pots (keep oldest 2)
  if (pots && pots.length > FREE_POT_LIMIT) {
    const toArchive = pots.slice(FREE_POT_LIMIT);
    
    await supabase
      .from('pots')
      .update({ archived_at: new Date().toISOString() })
      .in('id', toArchive.map(p => p.id));
    
    // Send notification email
    const { data: user } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('household_id', householdId)
      .single();
    
    if (user) {
      await sendPotsArchivedEmail({
        email: user.email,
        displayName: user.display_name,
        archivedPots: toArchive,
        activePots: pots.slice(0, FREE_POT_LIMIT),
      });
    }
  }
  
  // Archive excess repayments
  if (repayments && repayments.length > FREE_REPAYMENT_LIMIT) {
    const toArchive = repayments.slice(FREE_REPAYMENT_LIMIT);
    
    await supabase
      .from('repayments')
      .update({ archived_at: new Date().toISOString() })
      .in('id', toArchive.map(r => r.id));
  }
  
  // Similarly for seeds (needs/wants limits)
  // ...
}
```

### Scheduled Job for Email Sending

**File**: `apps/web/app/api/cron/trial-emails/route.ts` (new)

```typescript
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  sendTrialMilestoneEmail, 
  sendTrialEndingSoonEmail,
  sendTrialEndedEmail,
  sendGracePeriodEndingEmail,
} from '@/lib/email/trial-transition';

// Vercel Cron: runs daily at 9am UTC
// Or use: https://vercel.com/docs/cron-jobs

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = createAdminClient();
  const today = new Date();
  
  // Find households nearing trial milestones
  const { data: households } = await supabase
    .from('users')
    .select(`
      id, 
      email, 
      display_name, 
      household_id, 
      created_at,
      households!inner(
        id,
        owner_id,
        paycycles(id, status, created_at, closed_at)
      )
    `)
    .not('household_id', 'is', null);
  
  for (const user of households || []) {
    const cycles = user.households.paycycles;
    const completedCycles = cycles.filter(c => c.status === 'completed').length;
    const activeCycle = cycles.find(c => c.status === 'active');
    
    // Calculate days since onboarding
    const daysSinceOnboarding = Math.floor(
      (today.getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Email 2: First cycle complete
    if (completedCycles === 1 && !user.trial_milestone_email_sent) {
      await sendTrialMilestoneEmail({
        email: user.email,
        displayName: user.display_name,
        cyclesCompleted: 1,
      });
      
      // Mark as sent
      await supabase
        .from('users')
        .update({ trial_milestone_email_sent: true })
        .eq('id', user.id);
    }
    
    // Email 3: Trial ending soon (3 days before 2nd cycle ends)
    if (completedCycles === 1 && activeCycle) {
      // Estimate when active cycle will complete (rough)
      const cycleStartDate = new Date(activeCycle.created_at);
      const estimatedCycleDays = 30; // Approximate
      const estimatedEndDate = new Date(cycleStartDate.getTime() + estimatedCycleDays * 24 * 60 * 60 * 1000);
      const daysUntilEnd = Math.floor((estimatedEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilEnd === 3 && !user.trial_ending_email_sent) {
        // Get pot counts
        const { count: potCount } = await supabase
          .from('pots')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', user.household_id)
          .is('archived_at', null);
        
        const { count: needsCount } = await supabase
          .from('seeds')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', user.household_id)
          .eq('seed_type', 'need');
        
        await sendTrialEndingSoonEmail({
          email: user.email,
          displayName: user.display_name,
          currentCounts: {
            pots: potCount || 0,
            repayments: 0, // query separately
            needs: needsCount || 0,
            wants: 0,
          },
          freeTierLimits: {
            pots: 2,
            repayments: 2,
            needs: 5,
            wants: 5,
          },
        });
        
        await supabase
          .from('users')
          .update({ trial_ending_email_sent: true })
          .eq('id', user.id);
      }
    }
    
    // Email 4: Trial ended
    if (completedCycles >= 2 && !user.trial_ended_email_sent) {
      // Check if user has excess pots
      const { count: potCount } = await supabase
        .from('pots')
        .select('id', { count: 'exact', head: true })
        .eq('household_id', user.household_id)
        .is('archived_at', null);
      
      if ((potCount || 0) > 2) {
        await sendTrialEndedEmail({
          email: user.email,
          displayName: user.display_name,
          excessPots: (potCount || 0) - 2,
          gracePeriodDays: 7,
        });
        
        await supabase
          .from('users')
          .update({ 
            trial_ended_email_sent: true,
            grace_period_start: new Date().toISOString(),
          })
          .eq('id', user.id);
      }
    }
    
    // Email 5: Grace period ending (Day 7 post-trial)
    if (user.grace_period_start) {
      const daysSinceGrace = Math.floor(
        (today.getTime() - new Date(user.grace_period_start).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceGrace === 6 && !user.grace_period_reminder_sent) {
        await sendGracePeriodEndingEmail({
          email: user.email,
          displayName: user.display_name,
        });
        
        await supabase
          .from('users')
          .update({ grace_period_reminder_sent: true })
          .eq('id', user.id);
      }
      
      // Day 8: Actually archive pots
      if (daysSinceGrace >= 7) {
        await enforceFreeTierLimits(user.household_id);
      }
    }
  }
  
  return NextResponse.json({ processed: households?.length || 0 });
}
```

---

## 📊 Database Schema for Email Tracking

```sql
-- Add email tracking fields to users table
ALTER TABLE public.users
ADD COLUMN trial_milestone_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN trial_ending_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN trial_ended_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN grace_period_start TIMESTAMPTZ NULL,
ADD COLUMN grace_period_reminder_sent BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.users.grace_period_start IS '7-day grace period after trial ends for users to reduce pots before auto-archiving';
```

---

## 🎨 Email Design System

### Visual Hierarchy

```
┌────────────────────────────────────────┐
│  [PLOT Logo]                           │ Header
├────────────────────────────────────────┤
│  Headline (Clear status/action)        │
│                                        │
│  Hi [Name],                            │
│                                        │
│  Context paragraph                     │
│                                        │ Body
│  ┌──────────────────────────────────┐ │
│  │  Status Box (counts, timeline)   │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Options:                              │
│  1. Option A (description)             │
│     [CTA Button]                       │
│                                        │
│  2. Option B (description)             │
│     [CTA Button]                       │
├────────────────────────────────────────┤
│  Questions? Reply or visit help        │ Footer
│  PLOT Team                             │
│  hello@plotbudget.com                  │
└────────────────────────────────────────┘
```

### CTA Button Hierarchy

**Primary CTA** (most prominent):
- Dark background (#000 or primary color)
- Top option (usually "Upgrade")

**Secondary CTA** (outline):
- Border only, transparent background
- Secondary option (usually "Reduce pots")

**Tertiary** (link):
- Plain link styling
- Info actions ("View archived pots")

---

## 🧮 Calculating Trial Timeline

### Dynamic Trial Duration

Since trial = 2 pay cycles, duration varies:

```typescript
// lib/utils/trial-timeline.ts

export function estimateTrialEndDate(
  onboardingDate: Date,
  payCycleType: 'specific_date' | 'last_working_day' | 'every_4_weeks',
  payDay: number | null
): Date {
  // Rough estimation for email scheduling
  
  if (payCycleType === 'every_4_weeks') {
    // 2 cycles × 28 days = 56 days
    return addDays(onboardingDate, 56);
  }
  
  if (payCycleType === 'specific_date' || payCycleType === 'last_working_day') {
    // 2 cycles × ~30 days = 60 days
    return addDays(onboardingDate, 60);
  }
  
  // Default: 60 days
  return addDays(onboardingDate, 60);
}

export function estimateSecondCycleEndDate(firstCycleClosedAt: Date, payCycleType: string): Date {
  // More accurate: use actual first cycle duration
  // This is called after first cycle completes
  
  const cycleDuration = // Calculate based on actual closed date vs created date
  return addDays(firstCycleClosedAt, cycleDuration);
}
```

### Email Trigger Timing

**Approach**: Scheduled cron job (daily) + event-based triggers

**Cron Job** (daily at 9am UTC):
```bash
# vercel.json
{
  "crons": [{
    "path": "/api/cron/trial-emails",
    "schedule": "0 9 * * *"
  }]
}
```

**Event-Based** (immediate):
- Trial starts → Welcome email (from onboarding completion)
- 1st cycle completes → Milestone email (from webhook when paycycle.status → 'completed')
- Trial ends → Immediate email (from webhook when 2nd cycle completes)

---

## 📧 Complete Email Series

### Email Templates Summary

| # | Name | Subject | Trigger | Time | Action |
|---|------|---------|---------|------|--------|
| 1 | Welcome | "Welcome to PLOT - Your trial has started!" | Onboarding complete | Immediate | Start using PLOT |
| 2 | Milestone | "Trial Update - Halfway there!" | 1st cycle complete | Immediate | Continue exploring |
| 3 | Ending Soon | "⏰ Your trial ends in 3 days" | ~3 days before 2nd cycle ends | 9am UTC | Prepare for transition |
| 4 | Ended | "Trial ended - Action required" | 2nd cycle complete | Immediate | Reduce or upgrade |
| 5 | Grace Reminder | "Final reminder: Reduce or upgrade (tomorrow)" | Day 6 of grace period | 9am UTC | Last chance |
| 6 | Archived | "Your pots have been archived" | Day 8 post-trial | 9am UTC | Explain archiving |
| 7 | PWYL Welcome | "Welcome to PLOT Premium!" | Subscription created | Immediate | Enjoy unlimited |

### Optional Follow-Up Emails

**For Free Tier Users** (stayed after trial):
```
Day 30: "How's the free tier working for you?"
- Check-in email
- Offer help
- Subtle PWYL mention
```

**For £0 Premium Users** (monthly):
```
Month 1, 3, 6: "Still enjoying PLOT Premium?"
- Appreciation for using PLOT
- Gentle reminder that contributions help
- No pressure
```

---

## 🎯 Reducing to Free Tier - User Guide Email

### Educational Content

**Email Include**: Link to help article explaining how to choose which pots to keep

**Help Article**: `apps/marketing/public/help/choosing-pots.html` (new)

**Content Outline**:
```markdown
# Choosing Your Top 2 Pots (Free Tier)

When transitioning from trial to free tier, you need to reduce to 2 savings pots and 2 repayments.

## How to Choose

### Savings Pots Priority Framework

1. **Emergency Fund** (always keep if you have one)
   - Critical for financial stability
   - Recommended: 3-6 months expenses

2. **Short-Term Goals** (next 3-6 months)
   - Holiday fund
   - Car repairs
   - Upcoming expenses

3. **Long-Term Goals** (can pause)
   - House deposit (years away)
   - Long-term savings
   - Consider pausing these

### Repayments Priority

1. **Highest Interest First**
   - Credit cards (typically 20%+ APR)
   - Store cards
   
2. **Smallest Balance** (for quick wins)
   - Personal loans
   - Small debts

### What Happens to Archived Pots?

✓ All data is saved securely
✓ You can view archived pots in Settings
✓ Upgrade to Premium anytime to restore them
✓ No data loss ever

## How to Archive a Pot

1. Go to Blueprint
2. Click the pot you want to pause
3. Click "Archive"
4. Confirm

OR let PLOT archive excess pots automatically (keeps your oldest 2 by default).

## Want to Keep Everything?

Upgrade to Premium with our pay-what-you-like pricing:
- From £0/month (yes, really!)
- Suggested: £3/month
- Up to £10/month
- You choose what's fair

[View Pricing →]
```

---

## 🔔 In-App Notifications (Complement Emails)

### Dashboard Banners

**During Trial** (after 1st cycle):
```tsx
// components/dashboard/trial-progress-banner.tsx
<div className="trial-banner">
  <div className="flex items-center gap-3">
    <div className="trial-progress">
      <CircularProgress value={50} /> {/* 1 of 2 cycles */}
    </div>
    <div>
      <h4>Trial: 1 of 2 pay cycles complete</h4>
      <p>You have one more cycle to decide: Free tier or Premium (PWYL)</p>
    </div>
  </div>
  <Button asChild variant="outline">
    <Link href="/pricing">View Options</Link>
  </Button>
</div>
```

**Trial Ending** (last 3 days):
```tsx
<div className="trial-ending-banner bg-yellow-50">
  <AlertTriangle />
  <div>
    <h4>Trial ending in ~3 days</h4>
    <p>You have [X] pots (Free tier allows 2). Choose your plan soon.</p>
  </div>
  <Button asChild>
    <Link href="/pricing">Upgrade (from £0/mo)</Link>
  </Button>
</div>
```

**Trial Expired** (grace period):
```tsx
<div className="trial-expired-banner bg-red-50">
  <AlertCircle />
  <div>
    <h4>Trial ended - Action required</h4>
    <p>Reduce to 2 pots or upgrade within 7 days to avoid auto-archiving.</p>
    <p className="text-sm">Day {graceDayCount} of 7</p>
  </div>
  <div className="flex gap-2">
    <Button asChild variant="outline">
      <Link href="/dashboard/blueprint">Reduce Pots</Link>
    </Button>
    <Button asChild>
      <Link href="/pricing">Upgrade</Link>
    </Button>
  </div>
</div>
```

---

## 🚀 Implementation Checklist

### Email Infrastructure

- [ ] **Resend Setup**:
  - [ ] Verify domain `app.plotbudget.com` in Resend
  - [ ] Test sending from `hello@app.plotbudget.com`
  - [ ] Install `@react-email/components`
  - [ ] Create email templates folder structure

- [ ] **Polar Email Setup**:
  - [ ] Configure sender: `hello@app.plotbudget.com`
  - [ ] Customize Polar email templates (add PWYL messaging)
  - [ ] Test Polar automatic emails in sandbox
  - [ ] Verify email branding (logo, colors)

- [ ] **Database Schema**:
  - [ ] Add email tracking fields to `users` table
  - [ ] Add `archived_at` to pots/repayments/seeds tables
  - [ ] Add `grace_period_start` to `users` table

### Email Templates (Resend)

- [ ] `emails/components/email-layout.tsx`
- [ ] `emails/subscription/pwyl-welcome.tsx`
- [ ] `emails/subscription/pwyl-free-welcome.tsx`
- [ ] `emails/subscription/amount-changed.tsx`
- [ ] `emails/trial/trial-milestone.tsx`
- [ ] `emails/trial/trial-ending-soon.tsx`
- [ ] `emails/trial/trial-ended.tsx`
- [ ] `emails/trial/grace-period-ending.tsx`
- [ ] `emails/trial/pots-archived.tsx`

### Email Sending Logic

- [ ] `lib/email/subscription.ts` - PWYL subscription emails
- [ ] `lib/email/trial-transition.ts` - Trial transition emails
- [ ] `app/api/webhooks/polar/route.ts` - Trigger subscription emails
- [ ] `app/api/cron/trial-emails/route.ts` - Scheduled trial emails
- [ ] `lib/actions/tier-enforcement.ts` - Auto-archiving logic

### Help Content

- [ ] Create help article: "Choosing which pots to keep"
- [ ] Create help article: "Understanding PLOT trials"
- [ ] Create help article: "What happens to archived pots"
- [ ] Add FAQ section for PWYL pricing

### Testing

- [ ] Test trial milestone email (after 1st cycle)
- [ ] Test trial ending email (mock 3 days before)
- [ ] Test trial ended email (mock 2nd cycle complete)
- [ ] Test auto-archiving (mock Day 8)
- [ ] Test PWYL welcome emails (£0, £3, £5, £10)
- [ ] Test amount changed email
- [ ] Verify all emails from `hello@app.plotbudget.com`

---

## 💡 Email Best Practices

### Timing Optimization

**Time Zone Considerations**:
```typescript
// Send at 9am in user's local time zone (if stored)
// Or default to 9am UTC (10am UK time during DST)

const userTimeZone = user.timezone || 'Europe/London';
const sendTime = getNextOccurrence('09:00', userTimeZone);
```

### Deliverability Tips

1. **Warm Up Sender Domain**:
   - Start with small batches (10/day)
   - Gradually increase volume
   - Monitor bounce/spam rates

2. **Email Content**:
   - Avoid spam trigger words ("FREE!", "ACT NOW!")
   - Keep HTML simple (no complex CSS)
   - Always include plain text version
   - Include unsubscribe link (for marketing emails)

3. **Authentication**:
   - SPF record for `app.plotbudget.com`
   - DKIM signature (Resend provides)
   - DMARC policy (monitor)

### A/B Testing Ideas

**Subject Lines** (trial ending):
- A: "⏰ Your PLOT trial ends in 3 days"
- B: "Action needed: Choose your PLOT plan"
- C: "Your PLOT trial is ending - here's what to do"

**CTA Copy** (upgrade button):
- A: "Upgrade to Premium"
- B: "Keep Unlimited Pots - from £0/mo"
- C: "Choose Your Contribution (£0-£10)"

Test with 50/50 split, measure conversion rate.

---

## 📋 Production Email Checklist

### Before Launch

- [ ] Domain verification complete (Resend + Polar)
- [ ] All templates created and tested
- [ ] Cron job deployed and verified
- [ ] Email sending logs implemented
- [ ] Error handling for failed emails
- [ ] Unsubscribe links working (for marketing emails)

### Launch Day

- [ ] Send test email to team addresses
- [ ] Monitor first real emails sent
- [ ] Check spam folder placement
- [ ] Verify open rates in Resend dashboard
- [ ] Monitor Polar email delivery status

### Post-Launch Monitoring

**Daily** (first week):
- Email delivery rates
- Open rates by template
- Bounce rates
- User replies to `hello@plotbudget.com`

**Weekly** (ongoing):
- Conversion: Trial ending email → Upgrade rate
- Effectiveness: Which CTA gets more clicks
- Complaints: Any spam reports

---

**Email configuration complete. All trial transition, PWYL subscription, and tier restriction emails planned with clear triggers and templates.**
