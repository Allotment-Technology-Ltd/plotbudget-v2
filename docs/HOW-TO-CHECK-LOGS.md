# How to Check Dev Server Logs

## 🔍 Quick Reference for Checking Logs

### Option 1: Real-Time Monitoring (Best Method)

**In your IDE terminal, you can see:**
1. Open the **terminal at the bottom** of Cursor/VS Code
2. Look for the tab running `pnpm dev`
3. Scroll up to see recent logs
4. Watch in real-time as requests come in

**What you're looking for:**
- ✅ `200` status codes = Success
- ⚠️ `400` status codes = Client error
- ❌ `500` status codes = Server error
- ❌ `console.error` messages = Detailed errors

### Option 2: Check Terminal File

The dev server logs are saved to:
```
/Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt
```

**To view the latest entries:**
```bash
tail -50 /Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt
```

### Option 3: Browser DevTools (For Client-Side Errors)

1. Open your browser to `http://localhost:3001`
2. Press `F12` or `Cmd+Option+I` (Mac) to open DevTools
3. Go to **Console** tab
4. Look for red error messages
5. Look for warnings (yellow)

---

## 🎯 Where to Find Different Types of Errors

### Portal Errors
**Look for:**
```
console.error('Customer portal session creation failed:', error)
```

**These appear in:**
- Dev server terminal
- Server logs (where `pnpm dev` is running)

### Webhook Errors
**Look for:**
- `POST /api/webhooks/polar 400` = Signature validation failed
- `POST /api/webhooks/polar 500` = Server error processing webhook

### Checkout Errors
**Look for:**
```
console.error('Polar checkout creation failed:', error, {...})
```

### Client-Side Errors
**Look for:**
- Browser DevTools Console tab (red messages)
- Network tab for failed requests

---

## 📊 Reading HTTP Status Codes

```
GET /pricing 200 in 738ms
├─ GET = HTTP method
├─ /pricing = endpoint
├─ 200 = status code (success)
└─ 738ms = how long it took

POST /api/webhooks/polar 200 in 47ms
├─ POST = HTTP method
├─ /api/webhooks/polar = endpoint
├─ 200 = status code (success)
└─ 47ms = how long it took
```

### Common Status Codes:
- `200` = ✅ Success
- `302` = ↩️ Redirect (normal)
- `400` = ❌ Bad request (client error)
- `401` = 🔐 Unauthorized (needs login)
- `404` = 🚫 Not found
- `500` = ⚠️ Server error

---

## 🔧 Real-Time Log Monitoring

### In the Terminal (One-Time)
```bash
# Show last 100 lines of logs
tail -100 /Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt

# Show last 50 lines
tail -50 /Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt

# Show only error lines
tail -100 /Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt | grep -i error
```

### In the Terminal (Live/Continuous)
```bash
# Watch for new logs (updates every 2 seconds)
watch -n 2 'tail -50 /Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt'

# Or use tail -f for continuous output
tail -f /Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt
```

---

## 🐛 Debugging Portal Errors

### Step 1: Check Dev Server Logs
```bash
# Look for portal-related errors
grep -i "portal\|customer" /Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt
```

**You might see:**
```
❌ Customer portal session creation failed: NetworkError: Failed to fetch
❌ Customer portal session created but no URL returned
```

### Step 2: Check Browser Console
1. Open `http://localhost:3001/dashboard/settings?tab=subscription`
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Look for red error messages
5. Look for blue info messages

### Step 3: Check Network Tab
1. In DevTools, go to **Network** tab
2. Click "Manage Subscription"
3. Look for `/api/customer-portal` request
4. Click it and see:
   - **Status:** Should be `302` (redirect)
   - **Headers:** Look for `Location` header
   - **Response:** Should show redirect URL

### Step 4: Environment Variables
```bash
# Check if required env vars are set
grep POLAR /Users/adamboon/PLOT\ -\ Workspace/plotbudget/apps/web/.env.local
```

**Required variables:**
- `POLAR_ACCESS_TOKEN` = Must be set
- `POLAR_SANDBOX=true` = Should be true for local
- `POLAR_WEBHOOK_SECRET` = Must be set
- `POLAR_SUCCESS_URL` = Should be `http://localhost:3001/dashboard`

---

## 🚨 If You See the Error Pop-Up

### That's the Error Banner! (This is Expected)

If you see a red error banner in the UI saying:
```
Portal Error: We couldn't open the subscription portal. Please try again.
```

**This is working correctly!** It means:
1. ✅ Error detection working
2. ✅ User feedback working
3. ✅ Error banner displaying

**To debug what caused it:**
1. Check dev server logs (see above)
2. Look for `console.error` messages
3. Check environment variables
4. Verify Polar API is accessible

---

## 📝 Common Error Messages & Solutions

### `NetworkError: Failed to fetch`
**Cause:** Network issue or Polar API unreachable
**Solution:**
- Check internet connection
- Verify Polar CLI is running (if using webhooks locally)
- Verify Polar API is up

### `Error: Unauthorized (401)`
**Cause:** `POLAR_ACCESS_TOKEN` is invalid or expired
**Solution:**
- Check `.env.local` has valid token
- Get new token from Polar dashboard
- Restart dev server after updating

### `Customer portal session created but no URL returned`
**Cause:** Polar returned session without portal URL
**Solution:**
- Check Polar API response
- Verify customer ID is valid
- Check Polar dashboard for account issues

### `Cannot find polar_customer_id`
**Cause:** User hasn't subscribed yet
**Solution:**
- This is expected for non-subscribers
- User should be redirected to pricing page
- Not an error, just user flow

---

## 🎯 Typical Log Output (What's Normal)

### Successful Portal Redirect
```
GET /api/customer-portal 302 in 234ms
```
No `console.error` = Working perfectly!

### Failed Portal Redirect
```
GET /api/customer-portal 302 in 1234ms
❌ Customer portal session creation failed: NetworkError: Failed to fetch
```

The 302 is normal (it's a redirect), but the error message tells you what went wrong.

---

## 🔍 Finding the Exact Error

### All Portal Errors
```bash
grep -n "portal\|Portal" /Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt
```

### All Checkout Errors
```bash
grep -n "checkout\|Checkout" /Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt
```

### All Errors (Any Type)
```bash
grep -n "❌\|Error\|error" /Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt
```

---

## 📱 Browser DevTools - Complete Guide

### Console Tab
1. Right-click → Inspect (or press `F12`)
2. Click **Console** tab
3. Look for:
   - Red messages = Errors
   - Yellow messages = Warnings
   - Blue messages = Info/logs

### Network Tab
1. Open **Network** tab
2. Reload page (Cmd+R)
3. Look for requests, click them to see details:
   - **Status:** HTTP response code
   - **Headers:** Request/response headers
   - **Preview:** Formatted response
   - **Response:** Raw response body

### Application Tab
1. Open **Application** tab
2. Look for:
   - **Local Storage:** User data, auth tokens
   - **Session Storage:** Temporary session data
   - **Cookies:** Browser cookies

---

## ⚡ Quick Debug Checklist

When you see the error pop-up:

- [ ] Check dev server terminal for `console.error` messages
- [ ] Open browser DevTools (F12) → Console
- [ ] Look for red error messages
- [ ] Check Network tab for failed requests
- [ ] Verify environment variables are set
- [ ] Restart dev server if env vars changed
- [ ] Check Polar API status
- [ ] Try the operation again

---

## 🎬 Live Example

### Scenario: User Clicks "Manage Subscription"

**Expected logs:**
```
GET /api/customer-portal 302 in 234ms
→ Redirect to Polar portal (successful)

OR

GET /api/customer-portal 302 in 1234ms
❌ Customer portal session creation failed: [error details]
→ Redirect back to settings with error banner (handled error)
```

**In browser DevTools:**
- Console should be clean (no red errors)
- Network should show `/api/customer-portal` as 302
- If error, next request should be redirect back to settings

---

## 📚 More Information

For detailed error scenarios, see:
- `/docs/PORTAL-ERROR-HANDLING.md` - Complete error scenarios
- `/docs/PORTAL-ERROR-HANDLING-TEST-RESULTS.md` - Debugging guide
- `/docs/PORTAL-ERROR-IMPLEMENTATION.md` - How errors are logged

---

**Last Updated:** February 13, 2026  
**For:** Debugging local dev environment errors
