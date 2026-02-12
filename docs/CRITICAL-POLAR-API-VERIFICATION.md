# 🚨 CRITICAL: Polar API Verification Required

## ⚠️ BLOCKER: Custom Price Creation

**Status**: ❌ Not Yet Verified

The entire PWYL implementation depends on Polar supporting dynamic price creation at checkout time.

---

## 🧪 Test Required IMMEDIATELY

### Test Command

```bash
# Use your sandbox access token
export POLAR_TOKEN="polar_oat_cG5eIiPqVf7e0rQNDGTq8reppDahsJWACEpo50WpGBy"

# Create PWYL product first in Polar dashboard, then:
curl -X POST https://sandbox-api.polar.sh/v1/checkouts \
  -H "Authorization: Bearer $POLAR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_price_create": {
      "product_id": "YOUR_PWYL_PRODUCT_ID",
      "type": "recurring",
      "recurring_interval": "month",
      "price_amount": 750,
      "price_currency": "GBP"
    },
    "success_url": "http://localhost:3000/success?checkout_id={CHECKOUT_ID}"
  }'
```

---

## ✅ If API Works (Response 200)

**You'll get**:
```json
{
  "id": "checkout_xxx",
  "url": "https://sandbox.polar.sh/checkout/xxx",
  "status": "open",
  ...
}
```

**Next Steps**:
1. ✅ PWYL implementation can proceed as designed
2. Remove `as any` cast from checkout route
3. Update SDK types or wait for Polar to add them
4. Full £0-£10 range supported dynamically

**Production Path**:
- Create PWYL product in production Polar (GBP)
- No need for preset prices
- All amounts created dynamically

---

## ❌ If API Fails (Response 400/500)

**You might get**:
```json
{
  "error": "invalid_request",
  "message": "product_price_create not supported"
}
```

**Fallback Plan: Preset Prices Only**

### Create 21 Prices in Polar (Manual)

For each £ amount from £0-£10:
```
Products → PWYL Product → Add Price:

Price 1: £0.00/month → Copy ID → POLAR_PWYL_PRICE_0
Price 2: £0.50/month → Copy ID → POLAR_PWYL_PRICE_050
Price 3: £1.00/month → Copy ID → POLAR_PWYL_PRICE_1
...
Price 21: £10.00/month → Copy ID → POLAR_PWYL_PRICE_10
```

### Update Checkout Route (Preset Mapping)

```typescript
// apps/web/app/api/checkout/route.ts

function getPWYLPresetPriceId(amountInPence: number): string | undefined {
  const presets: Record<number, string | undefined> = {
    0: process.env.POLAR_PWYL_PRICE_0,
    50: process.env.POLAR_PWYL_PRICE_050,
    100: process.env.POLAR_PWYL_PRICE_1,
    150: process.env.POLAR_PWYL_PRICE_150,
    200: process.env.POLAR_PWYL_PRICE_2,
    250: process.env.POLAR_PWYL_PRICE_250,
    300: process.env.POLAR_PWYL_PRICE_3,
    // ... up to 1000
  };
  
  return presets[amountInPence];
}

// In GET handler:
if (config.mode === 'pwyl_custom') {
  const priceId = getPWYLPresetPriceId(config.amount);
  
  if (!priceId) {
    return NextResponse.json({
      error: `No preset price for £${amount}. Available amounts: £0, £0.50, £1, ..., £10`
    }, { status: 400 });
  }
  
  checkout = await polar.checkouts.create({
    products: [priceId],
    successUrl: process.env.POLAR_SUCCESS_URL!,
    metadata: { household_id, user_id, pwyl_amount: amount },
  });
}
```

**UI Impact**:
- Slider still £0-£10
- Amounts round to nearest £0.50 increment
- Show "Rounded to £X.50" message before checkout

---

## 📋 Verification Checklist

### Before Proceeding with Implementation

- [ ] **Test curl command** with your Polar sandbox token
- [ ] **Verify response** (200 = works, 400/500 = doesn't work)
- [ ] **If works**: Continue with current implementation
- [ ] **If fails**: Switch to preset-based approach
- [ ] **Document findings** in this file
- [ ] **Update implementation plan** based on result

### Test Results Log

**Date**: _____________
**Tester**: _____________
**Result**: ❌ Not Tested | ✅ Works | ❌ Fails

**Response**:
```
Paste curl response here
```

**Decision**:
- [ ] Proceed with dynamic pricing (API works)
- [ ] Switch to preset pricing (API doesn't support it)

---

## 🔄 Alternative: Contact Polar Support

If the API capability is unclear:

**Email**: support@polar.sh
**Subject**: "Dynamic Price Creation at Checkout - API Support?"

**Message**:
```
Hi Polar team,

We're implementing a pay-what-you-like subscription model where users can choose 
any amount between £0-£10/month.

Question: Does the Polar API support creating custom prices dynamically at checkout time?

Specifically, can we use this API call:

POST /v1/checkouts
{
  "product_price_create": {
    "product_id": "...",
    "type": "recurring",
    "recurring_interval": "month",
    "price_amount": 750,  // £7.50
    "price_currency": "GBP"
  },
  ...
}

If not, we'll pre-create 21 prices (£0.00, £0.50, £1.00, ..., £10.00), but dynamic would be cleaner.

Thanks!
PLOT Team
```

---

## 🚀 Implementation Path Forward

### Path A: API Works (Ideal)

**Code**:
- ✅ Current checkout implementation is correct
- Cast `as any` is fine (TypeScript types lag behind API)
- No preset prices needed

**Polar Setup**:
- Create 1 PWYL product (GBP)
- No prices needed (created dynamically)
- Clean dashboard

**User Experience**:
- Full £0-£10 range
- Any amount (£3.76, £7.23, etc.)
- Smooth UX

### Path B: API Doesn't Work (Fallback)

**Code**:
- Update checkout route with preset mapping
- Round slider values to £0.50 increments
- Show rounding message in UI

**Polar Setup**:
- Create 1 PWYL product (GBP)
- Create 21 preset prices (£0-£10 in £0.50 steps)
- More manual setup

**User Experience**:
- £0-£10 range, but rounded
- "Your £3.76 will be rounded to £4.00"
- Still functional, slightly less flexible

---

## ⏱️ Time Sensitivity

**This verification must happen before**:
- Creating more components
- Updating webhook handler
- Setting up production Polar

**Estimated time**: 5 minutes to test
**Impact**: Determines entire PWYL implementation approach

---

## 📞 Need Help Testing?

If you're unsure how to run the curl command:

```bash
# 1. Open Terminal
# 2. Copy this command (replace YOUR_PWYL_PRODUCT_ID):

curl -X POST https://sandbox-api.polar.sh/v1/checkouts \
  -H "Authorization: Bearer polar_oat_cG5eIiPqVf7e0rQNDGTq8reppDahsJWACEpo50WpGBy" \
  -H "Content-Type: application/json" \
  -d '{
    "product_price_create": {
      "product_id": "YOUR_PWYL_PRODUCT_ID",
      "type": "recurring",
      "recurring_interval": "month",
      "price_amount": 750,
      "price_currency": "GBP"
    },
    "success_url": "http://localhost:3000/success"
  }'

# 3. Press Enter
# 4. Copy/paste the response
# 5. Update this doc with result
```

**OR** test via the app once deployed:
- Visit `/api/checkout?product=pwyl&amount=7.50&household_id=test`
- Check response/logs
- If it works → dynamic pricing confirmed

---

**🎯 Action Required: Test this API call before proceeding with remaining implementation.**
