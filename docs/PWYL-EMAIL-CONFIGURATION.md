# PWYL Subscription Emails - Configuration Guide

## 📧 Email Requirements

All subscription-related emails should be sent from: **hello@app.plotbudget.com**

### Email Types Needed

1. **Welcome Email** - When subscription starts (PWYL or fixed)
2. **Receipt Email** - After each successful payment
3. **Payment Failed** - When payment fails or card expires
4. **Subscription Updated** - When PWYL amount changes
5. **Cancellation Confirmation** - When user cancels
6. **Trial Ending Soon** - 3 days before PLOT trial expires (in-app feature)

---

## 🔧 Email Provider Configuration

### Option 1: Polar Native Emails (Recommended for Transactional)

Polar sends automatic emails for subscription events. Configure in Polar dashboard:

#### Polar Email Settings

**Location**: Polar Dashboard → Settings → Emails

**Configuration**:
```
From Name: PLOT
From Email: hello@app.plotbudget.com
Reply-To: hello@plotbudget.com

Email Branding:
├── Logo: [Upload PLOT logo]
├── Brand Color: #[your primary color]
├── Footer Text: "PLOT - Simple, honest budgeting"
└── Support Email: hello@plotbudget.com
```

**Polar Automatic Emails** (enabled by default):
- ✅ Subscription Created → Receipt with amount
- ✅ Payment Successful → Monthly receipt
- ✅ Payment Failed → Retry instructions
- ✅ Subscription Canceled → Confirmation
- ✅ Trial Ending Soon → 3 days before (if Polar trial used)

**Customization**:
- Polar allows custom email templates (HTML)
- Can include PWYL-specific messaging
- Variables available: `{{amount}}`, `{{next_billing_date}}`, `{{customer_name}}`

#### Polar Email Templates to Customize

**1. Subscription Welcome Email**:
```html
Subject: Welcome to PLOT Premium!

Hi {{customer_name}},

Thank you for supporting PLOT with your contribution of {{amount}}/month!

Your premium features are now active:
✓ Unlimited bills and wants
✓ Unlimited savings pots
✓ Unlimited repayments

Manage your subscription anytime: {{portal_link}}

Questions? Reply to this email or visit plotbudget.com/help

Thank you for being part of the PLOT community!

---
PLOT Team
hello@plotbudget.com
```

**2. Payment Receipt**:
```html
Subject: Payment Receipt - PLOT Premium ({{amount}})

Hi {{customer_name}},

Your contribution of {{amount}} for PLOT Premium has been processed.

Payment Date: {{payment_date}}
Next Billing: {{next_billing_date}}
Amount: {{amount}}

Receipt: {{receipt_url}}
Manage Subscription: {{portal_link}}

Thank you for your continued support!

---
PLOT
hello@app.plotbudget.com
```

**PWYL-Specific Addition**:
```html
<p>
  💡 Remember: You can change your contribution amount anytime in Settings.
  Your support, no matter the amount, helps us build a better PLOT.
</p>
```

### Option 2: Resend Custom Emails (For PWYL-Specific Messaging)

Use Resend for custom emails that Polar doesn't send.

#### Resend Configuration

**File**: `apps/web/lib/email/subscription.ts` (new)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPWYLWelcomeEmail({
  email,
  displayName,
  amount,
  householdId,
}: {
  email: string;
  displayName: string | null;
  amount: number;
  householdId: string;
}) {
  const from = process.env.RESEND_FROM_EMAIL || 'PLOT <hello@app.plotbudget.com>';
  
  const subject = amount === 0 
    ? "Welcome to PLOT Premium (Community Supporter)!"
    : `Welcome to PLOT Premium - £${amount}/month`;
  
  const html = await renderPWYLWelcomeTemplate({ 
    displayName: displayName || 'there',
    amount,
    isFree: amount === 0,
  });
  
  return resend.emails.send({
    from,
    to: email,
    subject,
    html,
    replyTo: process.env.RESEND_REPLY_TO || 'hello@plotbudget.com',
    tags: [
      { name: 'type', value: 'pwyl_welcome' },
      { name: 'household_id', value: householdId },
    ],
  });
}

export async function sendPWYLAmountChangedEmail({
  email,
  displayName,
  oldAmount,
  newAmount,
}: {
  email: string;
  displayName: string | null;
  oldAmount: number;
  newAmount: number;
}) {
  const from = process.env.RESEND_FROM_EMAIL || 'PLOT <hello@app.plotbudget.com>';
  
  const html = await renderAmountChangedTemplate({
    displayName: displayName || 'there',
    oldAmount,
    newAmount,
  });
  
  return resend.emails.send({
    from,
    to: email,
    subject: `Your PLOT contribution updated to £${newAmount}/month`,
    html,
    replyTo: process.env.RESEND_REPLY_TO || 'hello@plotbudget.com',
    tags: [{ name: 'type', value: 'pwyl_amount_changed' }],
  });
}
```

#### Email Templates (React Email)

**File**: `apps/web/emails/pwyl-welcome.tsx` (new)

```tsx
import { Html, Head, Body, Container, Heading, Text, Button, Hr } from '@react-email/components';

interface PWYLWelcomeEmailProps {
  displayName: string;
  amount: number;
  isFree: boolean;
}

export default function PWYLWelcomeEmail({ displayName, amount, isFree }: PWYLWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to PLOT Premium!</Heading>
          
          {isFree ? (
            <>
              <Text style={text}>
                Hi {displayName},
              </Text>
              <Text style={text}>
                You're now using PLOT Premium as a <strong>Community Supporter</strong> at no cost.
                Thank you for being part of our community!
              </Text>
              <Text style={text}>
                Your premium features are active:
              </Text>
              <ul style={list}>
                <li>✓ Unlimited bills and wants</li>
                <li>✓ Unlimited savings pots</li>
                <li>✓ Unlimited repayments</li>
              </ul>
              <Text style={supportText}>
                If you'd like to support PLOT's development in the future, you can start 
                contributing anytime through Settings → Subscription.
              </Text>
            </>
          ) : (
            <>
              <Text style={text}>
                Hi {displayName},
              </Text>
              <Text style={text}>
                Thank you for supporting PLOT with your contribution of <strong>£{amount}/month</strong>!
              </Text>
              <Text style={text}>
                Your premium features are now active:
              </Text>
              <ul style={list}>
                <li>✓ Unlimited bills and wants</li>
                <li>✓ Unlimited savings pots</li>
                <li>✓ Unlimited repayments</li>
              </ul>
              <Text style={supportText}>
                Your contribution, no matter the amount, helps us build a better PLOT for everyone.
              </Text>
              <Button style={button} href="https://app.plotbudget.com/dashboard/settings?tab=subscription">
                Manage Subscription
              </Button>
            </>
          )}
          
          <Hr style={hr} />
          
          <Text style={footer}>
            Questions? Just reply to this email or visit <a href="https://plotbudget.com/help">plotbudget.com/help</a>
          </Text>
          
          <Text style={footer}>
            PLOT Team<br />
            hello@plotbudget.com
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' };
const container = { margin: '0 auto', padding: '20px 0', maxWidth: '600px' };
const h1 = { color: '#1a1a1a', fontSize: '24px', fontWeight: 'bold', margin: '20px 0' };
const text = { color: '#404040', fontSize: '16px', lineHeight: '24px', margin: '16px 0' };
const list = { color: '#404040', fontSize: '16px', lineHeight: '24px', paddingLeft: '20px' };
const supportText = { color: '#666', fontSize: '14px', fontStyle: 'italic', margin: '20px 0' };
const button = {
  backgroundColor: '#000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '20px 0',
};
const hr = { borderColor: '#e6e6e6', margin: '20px 0' };
const footer = { color: '#8898aa', fontSize: '12px', lineHeight: '16px', margin: '8px 0' };
```

---

## 📬 Email Flow Configuration

### Polar-Managed Emails (Automatic)

Configure in **Polar Dashboard → Settings → Notifications**:

| Event | Polar Email | Custom Resend Email | When Sent |
|-------|-------------|---------------------|-----------|
| Subscription Created | ✅ Receipt | ✅ Welcome (PWYL-specific) | Immediately after checkout |
| Payment Successful | ✅ Receipt | ❌ (Polar handles) | Every billing cycle |
| Payment Failed | ✅ Alert | ❌ (Polar handles) | When card declines |
| Subscription Canceled | ✅ Confirmation | ✅ Feedback request | When user cancels |
| Trial Ending | ✅ (if used) | ❌ (PLOT trial handled in-app) | 3 days before end |

**Polar Email Settings to Configure**:
```
Sender Settings:
├── From Name: PLOT
├── From Email: hello@app.plotbudget.com
│   └── ⚠️ Requires verification in Polar
├── Reply-To: hello@plotbudget.com
└── BCC: accounting@plotbudget.com (optional, for records)

Email Preferences:
├── Send receipt emails: ✅ Enabled
├── Send payment failed emails: ✅ Enabled
├── Send subscription canceled emails: ✅ Enabled
└── Include invoice PDF: ✅ Enabled
```

### Resend-Managed Emails (Custom PWYL Logic)

Trigger these from webhook handler:

**File**: `apps/web/app/api/webhooks/polar/route.ts`

```typescript
import { sendPWYLWelcomeEmail, sendPWYLAmountChangedEmail } from '@/lib/email/subscription';

export async function POST(req: NextRequest) {
  // ... existing signature validation ...
  
  const { type, data } = event;
  
  // After subscription is stored in database
  if (type === 'subscription.created') {
    const amount = parseFloat(data.metadata?.pwyl_amount || '0');
    const userId = data.metadata?.user_id;
    
    if (userId) {
      // Fetch user email
      const { data: user } = await supabase
        .from('users')
        .select('email, display_name')
        .eq('id', userId)
        .single();
      
      if (user) {
        // Send PWYL-specific welcome email
        await sendPWYLWelcomeEmail({
          email: user.email,
          displayName: user.display_name,
          amount,
          householdId: data.metadata.household_id,
        });
      }
    }
  }
  
  // When amount changes (subscription.updated with different price)
  if (type === 'subscription.updated') {
    // Check if price changed
    const newAmount = parseFloat(data.metadata?.pwyl_amount || '0');
    const oldAmount = parseFloat(data.metadata?.previous_pwyl_amount || newAmount.toString());
    
    if (newAmount !== oldAmount) {
      // Send amount changed email
      await sendPWYLAmountChangedEmail({
        email: user.email,
        displayName: user.display_name,
        oldAmount,
        newAmount,
      });
    }
  }
  
  return NextResponse.json({ received: true });
}
```

---

## 📋 Email Configuration Checklist

### Polar Dashboard Setup

- [ ] **Verify Sender Domain**:
  - [ ] Go to Polar → Settings → Emails
  - [ ] Verify `app.plotbudget.com` domain
  - [ ] Add DNS records if required (SPF, DKIM)
  - [ ] Test email sending

- [ ] **Configure Sender**:
  - [ ] From Name: `PLOT`
  - [ ] From Email: `hello@app.plotbudget.com`
  - [ ] Reply-To: `hello@plotbudget.com`

- [ ] **Customize Templates**:
  - [ ] Subscription Created (add PWYL messaging)
  - [ ] Payment Successful (monthly receipt)
  - [ ] Payment Failed (retry instructions)
  - [ ] Subscription Canceled (feedback request)

- [ ] **Test Emails**:
  - [ ] Complete test checkout in sandbox
  - [ ] Verify email received at test address
  - [ ] Check sender shows as `hello@app.plotbudget.com`
  - [ ] Verify branding (logo, colors)

### Resend Configuration

**Environment Variables** (already configured):
```bash
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=PLOT <hello@app.plotbudget.com>
RESEND_REPLY_TO=hello@plotbudget.com
```

**Domain Verification**:
- [ ] Verify `app.plotbudget.com` in Resend dashboard
- [ ] Add DNS records (provided by Resend)
- [ ] Test sending from `hello@app.plotbudget.com`

**Create Email Templates**:
- [ ] `emails/pwyl-welcome.tsx` - Welcome email for PWYL subscribers
- [ ] `emails/pwyl-amount-changed.tsx` - Confirmation when amount changes
- [ ] `emails/trial-ending.tsx` - PLOT trial ending reminder (not Polar trial)
- [ ] `emails/subscription-canceled.tsx` - Cancellation + feedback

---

## 📝 Email Templates

### 1. PWYL Welcome Email (via Resend)

**Template**: `emails/pwyl-welcome.tsx`

**Variables**:
- `displayName`: User's display name
- `amount`: Monthly contribution (£0-£10)
- `isFree`: Boolean (true if £0)

**Subject Lines**:
- £0: "Welcome to PLOT Premium (Community Supporter)!"
- £1-£10: "Welcome to PLOT Premium - Thank you for your £X/month support!"

**Content Structure**:
```
1. Welcome headline
2. Contribution amount acknowledgment
3. Features list (unlimited pots)
4. Gratitude message (amount-specific)
5. Manage subscription link
6. Support contact info
```

### 2. Amount Changed Email (via Resend)

**Template**: `emails/pwyl-amount-changed.tsx`

**Triggered**: When user changes PWYL amount (£3 → £5)

**Subject**: "Your PLOT contribution updated to £5/month"

**Content**:
```
Hi [Name],

Your PWYL contribution has been updated:

Previous: £3.00/month
New: £5.00/month

Next billing: [Date] at the new amount.

Thank you for increasing your support! Your contribution helps us:
- Build new features
- Improve existing functionality
- Keep PLOT independent and user-focused

Manage your subscription: [Link]

Thank you!
PLOT Team
```

### 3. Trial Ending Email (via Resend)

**Template**: `emails/trial-ending.tsx`

**Triggered**: 3 days before 2nd pay cycle completes (in PLOT, not Polar)

**Subject**: "Your PLOT trial ends in 3 days - Choose your contribution"

**Content**:
```
Hi [Name],

Your PLOT trial is ending soon! You've completed [X] of 2 pay cycles.

In 3 days, your account will move to the Free tier (2 pots, 5 needs/wants).

Want to keep unlimited access? Choose your monthly contribution:

[View Pay-What-You-Like Pricing →]

Our PWYL model means you pay what feels fair:
- £0: Use premium for free (Community Supporter)
- £3: Our suggested amount (most popular)
- £5-£10: Champion supporters

No credit card required to view pricing.

Questions? Just reply to this email.

PLOT Team
hello@plotbudget.com
```

### 4. Free Premium (£0) Monthly Update (via Resend)

**Template**: `emails/free-premium-reminder.tsx`

**Triggered**: Monthly for £0 subscribers (optional, to encourage contribution)

**Subject**: "Your PLOT Premium - Still enjoying it?"

**Content**:
```
Hi [Name],

You've been using PLOT Premium for free for [X] months now. We hope it's been helpful!

If PLOT is saving you time and stress, consider supporting our development:

[Start Contributing →]  (Pay what you like: £1-£10/month)

Even £1/month helps us:
- Keep PLOT ad-free
- Build features you request
- Support hosting and infrastructure

No pressure! You can continue using Premium for free.

Thank you for being part of PLOT,
The PLOT Team
```

**Frequency**: Once per month, max 3 reminders, then stop (avoid annoyance)

---

## 🎯 Email Triggering Logic

### Webhook Handler Integration

```typescript
// apps/web/app/api/webhooks/polar/route.ts

export async function POST(req: NextRequest) {
  // ... validation ...
  
  const { type, data } = event;
  const amount = parseFloat(data.metadata?.pwyl_amount || '0');
  
  // Store subscription first
  await supabase.from('subscriptions').upsert(payload);
  
  // Then send appropriate email
  if (type === 'subscription.created') {
    const user = await fetchUser(data.metadata?.user_id);
    
    if (amount === 0) {
      // Free premium welcome
      await sendPWYLWelcomeEmail({
        email: user.email,
        displayName: user.display_name,
        amount: 0,
        householdId: data.metadata.household_id,
      });
    } else {
      // Paid PWYL welcome
      // Polar already sent receipt; optionally send custom welcome
      await sendPWYLWelcomeEmail({
        email: user.email,
        displayName: user.display_name,
        amount,
        householdId: data.metadata.household_id,
      });
    }
  }
  
  if (type === 'subscription.updated') {
    // Check if amount changed
    const previousAmount = await getPreviousAmount(data.id);
    if (amount !== previousAmount) {
      await sendPWYLAmountChangedEmail({
        email: user.email,
        displayName: user.display_name,
        oldAmount: previousAmount,
        newAmount: amount,
      });
    }
  }
  
  if (type === 'subscription.canceled') {
    // Polar sends cancellation email
    // Optionally send feedback request via Resend
    await sendCancellationFeedbackEmail(user);
  }
  
  return NextResponse.json({ received: true });
}
```

### In-App Email Triggers

**Trial Ending Reminder**:
```typescript
// Could be a cron job or triggered when user logs in
// lib/actions/trial-reminder.ts

export async function checkAndSendTrialReminders() {
  const supabase = createAdminClient();
  
  // Find households with 1 completed cycle (trial ending soon)
  const { data: households } = await supabase
    .from('paycycles')
    .select('household_id, owner_id, status')
    .eq('status', 'completed')
    // Complex query to find those with exactly 1 completed cycle
    
  for (const household of households) {
    const user = await fetchUser(household.owner_id);
    await sendTrialEndingEmail({
      email: user.email,
      displayName: user.display_name,
      cyclesCompleted: 1,
    });
  }
}
```

---

## 🔄 Email Sending Strategy

### Who Sends What?

**Polar Sends** (Automatic, Transactional):
- Payment receipts (every billing cycle)
- Payment failed alerts
- Subscription canceled confirmations
- (Optionally) Trial ending for Polar trials

**Resend Sends** (Custom, Marketing-ish):
- PWYL welcome emails (with custom gratitude messaging)
- Amount changed confirmations
- PLOT trial ending reminders (since Polar doesn't know about our 2-cycle trial)
- Free premium monthly check-ins (optional)
- Cancellation feedback requests

### Avoiding Duplicate Emails

**Problem**: Both Polar and Resend might send "subscription created" emails.

**Solution**:
1. **Polar**: Disable "Subscription Created" email in Polar settings
2. **Resend**: Send custom PWYL welcome email from webhook
3. **Polar**: Keep "Payment Successful" emails (receipts)

**OR** (simpler):
1. **Polar**: Keep all automatic transactional emails
2. **Resend**: Only send PWYL-specific messaging that Polar can't (e.g., £0 welcome, trial ending)

**Recommended**: Use Polar for receipts, Resend for PWYL-specific messaging.

---

## 🎨 Email Branding Guidelines

### Visual Identity

**Logo**: Include PLOT logo in emails (hosted URL)
```html
<img src="https://app.plotbudget.com/logo.png" alt="PLOT" width="120" height="40" />
```

**Colors**:
- Primary: Use your brand color for CTAs
- Text: #1a1a1a (dark) / #666 (muted)
- Background: #f6f9fc (light gray)

**Typography**:
- Headings: Bold, uppercase tracking (matches PLOT's font style)
- Body: Sans-serif, 16px, line-height 1.5
- Footer: 12px, muted

### Tone of Voice

**PWYL Messaging Principles**:
- ✅ Grateful, not entitled
- ✅ Transparent about what contributions fund
- ✅ Welcoming to £0 users
- ✅ Celebrating all contribution levels
- ❌ No guilt-tripping
- ❌ No pressure tactics
- ❌ No scarcity language ("Last chance!")

**Examples**:

**Good**:
- "Thank you for contributing £5/month — you're helping build a better PLOT!"
- "Your £0 contribution is welcome — we're glad you're here."
- "Every bit helps us keep PLOT independent and user-focused."

**Bad**:
- "Only £3/month to unlock premium!" (creates pressure)
- "Support us or we'll have to shut down" (guilt)
- "Most users pay £5 — why aren't you?" (shame)

---

## 🚀 Implementation Steps

### 1. Polar Email Configuration

```bash
# Sandbox first, then production
1. Log into sandbox.polar.sh
2. Go to Settings → Emails
3. Add domain: app.plotbudget.com
4. Verify domain (add DNS records)
5. Set from address: hello@app.plotbudget.com
6. Customize email templates (add PWYL messaging)
7. Test with sandbox checkout
```

### 2. Resend Setup

```bash
# In apps/web
npm install @react-email/components

# Create email templates
mkdir -p emails
# Add pwyl-welcome.tsx, pwyl-amount-changed.tsx, etc.

# Test locally
npm run email:dev  # If you have email preview script
```

### 3. Webhook Email Integration

```typescript
// Update apps/web/app/api/webhooks/polar/route.ts
// Add email sending after DB upsert
// Handle errors gracefully (don't fail webhook if email fails)

try {
  await sendEmail(...);
} catch (emailError) {
  console.error('[webhook] Email send failed', emailError);
  // Still return 200 to Polar (webhook succeeded, email is secondary)
}
```

### 4. Testing

**Email Test Checklist**:
- [ ] Checkout with £0 → Receive Community Supporter welcome
- [ ] Checkout with £3 → Receive £3 contribution thank-you
- [ ] Checkout with £7.50 → Receive custom amount thank-you
- [ ] Change amount £3 → £5 → Receive amount changed email
- [ ] Payment fails → Receive Polar payment failed email
- [ ] Cancel subscription → Receive cancellation confirmation
- [ ] All emails from `hello@app.plotbudget.com`
- [ ] All links work and point to production/staging correctly

---

## 📊 Email Analytics

### Track These Metrics

**In Resend Dashboard**:
- Open rate by email type
- Click-through rate on CTAs
- Bounce rate (monitor deliverability)
- Spam complaints (should be near 0)

**In PostHog** (add events):
```typescript
posthog.capture('email_sent', {
  type: 'pwyl_welcome',
  amount: 3,
  household_id: '...',
});

posthog.capture('email_clicked', {
  type: 'manage_subscription_link',
  source: 'welcome_email',
});
```

**Goals**:
- Open rate: >40% (transactional emails)
- Click rate on "Manage Subscription": >15%
- Unsubscribe rate: <1%

---

## 🔒 Compliance & Privacy

### GDPR Considerations

**Email Consent**:
- Transactional emails (receipts): No consent needed (legitimate interest)
- Marketing emails (reminders): Require opt-in

**Unsubscribe**:
- Transactional emails: Can't unsubscribe (required for service)
- Marketing emails: Must include unsubscribe link

**Data Storage**:
```typescript
// Store email preferences in users table
ALTER TABLE public.users 
ADD COLUMN email_marketing_opt_in BOOLEAN DEFAULT FALSE,
ADD COLUMN email_product_updates_opt_in BOOLEAN DEFAULT TRUE;
```

### Privacy Policy Email Section (Updated)

```html
<h3>4. Marketing Communications</h3>
<p>
  With your consent, we may send you:
</p>
<ul>
  <li>Product updates and feature announcements</li>
  <li>Tips for using PLOT effectively</li>
  <li>Occasional reminders about subscription options (for free premium users)</li>
</ul>
<p>
  You can opt out anytime through Settings → Privacy → Email Preferences.
</p>

<p>
  We will always send transactional emails related to your account and subscription 
  (receipts, payment issues, security alerts) regardless of marketing preferences.
</p>
```

---

## 📧 Email Templates Repository

### Folder Structure

```
apps/web/emails/
├── components/
│   ├── email-layout.tsx         # Shared layout wrapper
│   ├── email-header.tsx         # PLOT logo + branding
│   ├── email-footer.tsx         # Contact info + legal
│   └── email-button.tsx         # Styled CTA button
├── subscription/
│   ├── pwyl-welcome.tsx         # New PWYL subscriber
│   ├── pwyl-free-welcome.tsx    # £0 subscriber
│   ├── amount-changed.tsx       # Amount updated
│   └── subscription-canceled.tsx # Cancellation + feedback
└── trial/
    ├── trial-starting.tsx       # After onboarding (optional)
    ├── trial-ending.tsx         # 3 days before 2nd cycle ends
    └── trial-expired.tsx        # After 2 cycles (upgrade CTA)
```

### React Email Setup

**File**: `apps/web/package.json`

```json
{
  "scripts": {
    "email:dev": "email dev",
    "email:export": "email export"
  },
  "devDependencies": {
    "@react-email/components": "^0.0.25",
    "react-email": "^3.0.0"
  }
}
```

**Preview Emails Locally**:
```bash
cd apps/web
npm run email:dev

# Opens http://localhost:3001
# Shows all email templates with live preview
# Test with different props (amount: 0, 3, 5, 10)
```

---

## 🎁 Bonus: Email Timing Strategy

### Optimal Send Times

**Immediate** (within seconds):
- Subscription created → Welcome email
- Payment successful → Receipt
- Payment failed → Alert

**Delayed** (within 1 hour):
- Amount changed → Confirmation

**Scheduled** (specific timing):
- Trial ending → 9am local time, 3 days before
- Monthly reminder (£0 users) → 1st of month, 9am

### Email Frequency Caps

**For £0 Users**:
- Welcome email: Once
- Monthly reminder: Max 3 total, then stop
- Gap between reminders: Min 30 days

**For Paid Users**:
- Welcome: Once
- Receipts: Every billing cycle (monthly)
- Product updates: Max 1 per month
- No promotional emails (they're already paying!)

---

## 🧪 Testing Email Configuration

### Sandbox Test Plan

```bash
# 1. Configure Polar emails in sandbox
sandbox.polar.sh → Settings → Emails → Configure

# 2. Test Polar automatic emails
# Complete test checkout → Verify receipt email sent from hello@app.plotbudget.com

# 3. Test Resend custom emails
cd apps/web
# Trigger webhook handler manually:
curl -X POST http://localhost:3000/api/webhooks/polar \
  -H "Content-Type: application/json" \
  -H "webhook-signature: test_signature_bypassed" \
  -d @test-fixtures/subscription-created.json

# 4. Verify email in inbox
# Check sender, branding, links, PWYL messaging

# 5. Test all email types
# - £0 subscription → Community Supporter email
# - £3 subscription → Suggested amount thank you
# - £5 subscription → Supporter thank you
# - Change £3→£5 → Amount changed email
```

### Production Verification

- [ ] Update Polar production emails to use `hello@app.plotbudget.com`
- [ ] Test real checkout with small amount (£1)
- [ ] Verify email received correctly
- [ ] Check spam score (use mail-tester.com)
- [ ] Verify all links point to production URLs

---

## 📞 Support Email Setup

**Email**: `hello@plotbudget.com` (replies from users)

**Handling PWYL Questions**:

**Common Questions Template**:
```
Q: Can I change my PWYL amount?
A: Yes! Go to Settings → Subscription → Change Amount anytime.

Q: What happens if I choose £0?
A: You'll still get Premium features as a Community Supporter. We ask that you consider 
   contributing in the future if PLOT is valuable to you.

Q: Do I get a receipt?
A: Yes! You'll receive an email receipt from Polar after each billing cycle. 
   You can also view receipts in Settings → Subscription → Manage Subscription.

Q: Can I cancel anytime?
A: Absolutely. Go to Settings → Subscription → Manage Subscription → Cancel. 
   You'll keep Premium access until the end of your billing period.

Q: Why PWYL instead of fixed pricing?
A: We believe budgeting tools should be accessible to everyone. PWYL lets you pay what 
   feels fair for your situation, while still supporting PLOT's development.
```

---

## ✅ Final Email Configuration Checklist

### Pre-Launch
- [ ] Verify `app.plotbudget.com` domain in both Polar and Resend
- [ ] Set Polar from address to `hello@app.plotbudget.com`
- [ ] Set Resend from address to `hello@app.plotbudget.com`
- [ ] Create all Resend email templates
- [ ] Test templates locally with email preview
- [ ] Customize Polar email templates with PWYL messaging

### Launch
- [ ] Deploy webhook email integration
- [ ] Test £0, £3, £5 checkouts → verify emails
- [ ] Monitor email deliverability (check spam folders)
- [ ] Set up email forwarding for `hello@plotbudget.com` inbox

### Post-Launch
- [ ] Monitor Resend analytics (open rates)
- [ ] Monitor Polar email delivery rates
- [ ] Collect user feedback on email frequency
- [ ] A/B test email subject lines for PWYL welcome

---

**Email configuration ensures users receive appropriate communication for their chosen PWYL amount, with all emails branded as PLOT and sent from hello@app.plotbudget.com.**
