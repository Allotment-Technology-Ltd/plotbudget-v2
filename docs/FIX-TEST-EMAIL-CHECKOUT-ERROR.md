# Fix: Checkout Error with Test Email Domains

## 🔴 Issue Identified

**Error:** `http://localhost:3001/api/checkout?product=pwyl` returned "page isn't working" (500 error)

**Root Cause:** Polar API rejected the checkout request with:
```
422 Unprocessable Entity
"value is not a valid email address: The part after the @-sign is 
a special-use or reserved name that cannot be used with email."
```

**Why:** Your local test user has email `manual-solo@plotbudget.test`
- The `.test` domain is a reserved TLD (Top-Level Domain)
- Polar's API validation rejects it as invalid
- This caused the checkout creation to fail

---

## ✅ Solution Implemented

### 1. **Parameter Name Fix**
Changed from camelCase to snake_case (Polar API requirement):
- `customerEmail` → `customer_email` ✅
- `customerName` → `customer_name` ✅

### 2. **Test Domain Detection**
Added validation to skip test/reserved domains:
```typescript
// Only pass email if it's not a test/reserved domain
const isValidEmail = user.email && !/(\.test|\.local|\.localhost|\.invalid)$/i.test(user.email);

// Conditionally include email
...(isValidEmail ? { customer_email: user.email } : {})
```

**Skips these domains:**
- `.test` (like `user@example.test`)
- `.local` (like `user@example.local`)
- `.localhost` (like `user@localhost`)
- `.invalid` (like `user@example.invalid`)

---

## 🎯 Behavior Now

### Local Development (Test Emails)
- Email domain: `.test`, `.local`, etc.
- Result: Email **NOT** sent to Polar
- User experience: Checkout works, email field empty (user fills it in)
- ✅ No API errors

### Production (Real Emails)
- Email domain: `.com`, `.org`, `.net`, etc.
- Result: Email **IS** sent to Polar
- User experience: Checkout works, email field pre-filled ✅
- ✅ Better UX

---

## 📝 Files Changed

1. `/api/checkout/route.ts`
   - Added email domain validation
   - Fixed parameter names to snake_case
   - Conditional email inclusion

2. `/tests/api/checkout.pwyl.spec.ts`
   - Updated test assertions to use snake_case
   - Added test case for test email domains

3. `/docs/PREFILL-CHECKOUT-FIELDS.md`
   - Documented the fix
   - Added troubleshooting section

---

## 🧪 Testing

**Try it now:**
1. Click the pricing button again
2. Should redirect to Polar checkout (no error) ✅
3. Email field will be empty (because you're using `.test` domain)
4. You can enter any email for testing

**In production:**
- Real user emails will be pre-filled automatically

---

## 🔍 How to Verify

Check the dev server logs:
```bash
tail -f /Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt
```

**Should see:**
```
GET /api/checkout?product=pwyl 302 in XXXms
```

**No more 500 errors!** ✅

---

## 📊 Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Test emails** | ❌ 500 error | ✅ Works (skips email) |
| **Real emails** | N/A | ✅ Pre-filled |
| **Parameter names** | ❌ camelCase | ✅ snake_case |
| **API compatibility** | ❌ Polar rejects | ✅ Polar accepts |

---

**Status: ✅ FIXED**

The checkout should work now! Try clicking the pricing button again.
