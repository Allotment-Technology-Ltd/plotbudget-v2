# Portal Error Handling

## Overview

When users attempt to manage their subscription via the Polar customer portal, errors can occur during the transition between the PLOT app and Polar's hosted portal. This document describes the error handling improvements made to catch and display these errors gracefully.

## Error Scenarios

### 1. Missing Polar Customer ID
- **When:** User hasn't subscribed yet or data is corrupted
- **Handler:** `/api/customer-portal` redirects to `/pricing` 
- **UX:** User can see pricing and subscribe

### 2. Missing Polar Access Token
- **When:** Environment variable not set
- **Handler:** API returns 500 error
- **UX:** Error page shown (server logs contain detailed error)

### 3. Session Creation Fails
- **When:** Polar API is unreachable or returns error
- **Handler:** `/api/customer-portal` catches error and redirects with `portal_error=true`
- **UX:** Settings page shows error banner

### 4. Session Created But No Portal URL
- **When:** Polar returns session without `customerPortalUrl`
- **Handler:** `/api/customer-portal` catches and redirects with `portal_error=true`
- **UX:** Settings page shows error banner

## Error Display Flow

```
User clicks "Manage Subscription"
    ↓
Link to /api/customer-portal
    ↓
Route validates auth, fetches polar_customer_id
    ↓
Route attempts to create Polar session
    ↓
SUCCESS: Redirect to Polar portal → Return to app → No error
FAILURE: Redirect to /dashboard/settings?tab=subscription&portal_error=true
    ↓
Settings page receives portal_error=true
    ↓
SettingsView displays error banner
```

## Code Changes

### 1. `/api/customer-portal/route.ts`
**Added:** Detailed error logging for debugging
- Logs when session is created without URL
- Logs the actual error if session creation fails
- Includes context (polarCustomerId, returnUrl)

### 2. `/app/dashboard/settings/page.tsx`
**Added:** Query parameter parsing for `portal_error`
- Detects `portal_error=true` in URL
- Passes flag to SettingsView component

### 3. `/components/settings/settings-view.tsx`
**Added:** Error banner display
- Shows user-friendly error message when `portal_error=true`
- Banner appears above settings tabs
- Uses destructive color variant for visibility

### 4. `/components/settings/subscription-tab.tsx`
**Added:** Portal link wrapper component
- Prepares infrastructure for enhanced error handling
- Can add loading states in future
- Currently uses standard Next.js Link component

## User Experience

### Success Case
1. User clicks "Manage Subscription"
2. Redirected to Polar portal smoothly
3. User manages subscription (change amount, update payment, etc.)
4. User clicks "Return to PLOT"
5. Back at settings page, no error

### Error Case
1. User clicks "Manage Subscription"
2. Session creation fails (network, API issue)
3. Redirected back to settings with error banner
4. Banner shows: "Portal Error: We couldn't open the subscription portal. Please try again."
5. User can retry by clicking button again
6. Dev team can check logs for root cause

## Testing

To test error handling, you can:

1. **Test missing customer ID:** Create a user without a subscription, try to access portal
   - Expected: Redirect to `/pricing`

2. **Test session creation failure:** Stop ngrok or Polar API, try to access portal
   - Expected: Error banner with message on return

3. **Check server logs:** Look for `Customer portal session creation failed:` or `Checkout created without URL:`
   - These logs include context for debugging

## Debugging Tips

When users report "Portal Error", check:

1. **Dev Server Logs**
   ```
   Customer portal session creation failed: [error details]
   ```

2. **Network Tab (Browser DevTools)**
   - Check `/api/customer-portal` response (should be redirect)
   - Verify Polar portal URL is valid

3. **Polar Sandbox Dashboard**
   - Check if API keys are valid
   - Verify customer portal is enabled for product

4. **Database**
   - Verify user has `polar_customer_id` set
   - Check subscription record exists for household

## Future Enhancements

- [ ] Add retry button in error banner
- [ ] Show specific error types (e.g., "API unreachable", "Invalid customer ID")
- [ ] Add telemetry to track error frequency
- [ ] Implement exponential backoff for retries
- [ ] Add timeout handling for slow connections
