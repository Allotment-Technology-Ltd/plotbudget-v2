# Checking the Next.js DevTools Error Pop-Up

## 🎯 Where to Look

The error pop-up in Next.js DevTools (the overlay that appears in the bottom-right corner of your app) shows **client-side errors**.

### To see what the error is:

1. **Look at the overlay directly** - It should show an error message
2. **Open Browser DevTools** (F12) → **Console** tab
3. Look for red messages (errors) or yellow messages (warnings)

---

## 🔍 Common Causes

### Most Common: Missing Environment Variables
If you see an error like:
```
Error: POLAR_NEXT_PUBLIC_* is not defined
```

**Fix:**
- Check `.env.local` in `/apps/web/`
- Make sure all POLAR_* variables are set
- Restart dev server after adding them: `pnpm dev`

### Component Hydration Mismatch
If you see:
```
Hydration failed because the initial UI does not match what was rendered on the server
```

**This is usually harmless**, but indicates:**
- Server-rendered and client-rendered output differs
- Often temporary (next page load fixes it)

### TypeScript/Build Errors
If you see:
```
[typescript] Error TS**** at ...
```

**These will show in DevTools with line numbers you can click to see the code**

---

## 📱 How to Check the Browser Console

### Step-by-Step

1. **Open browser** → Visit `http://localhost:3001`
2. **Press F12** (or Cmd+Option+I on Mac) to open DevTools
3. **Click Console tab** at the top
4. **Look for:**
   - 🔴 Red messages = Errors
   - 🟡 Yellow messages = Warnings
   - 🔵 Blue messages = Info/logs
5. **Click on error message** to expand it
6. **Look at stack trace** to see which file caused it

### Example Error Message
```
Uncaught Error: Cannot read properties of undefined (reading 'polar_customer_id')
    at SubscriptionTab (subscription-tab.tsx:96:18)
    at process_start (webpack-internal:///./node_modules/next/dist/compiled/react/index.js:)
```

This tells you:
- **Error type:** Cannot read properties
- **What happened:** Tried to read 'polar_customer_id' from undefined
- **Where:** `subscription-tab.tsx`, line 96
- **Component:** SubscriptionTab

---

## 🛠️ The Error You're Seeing (Likely)

Based on the error banner code we added, if you're seeing a pop-up, it's probably:

### Scenario 1: Error Banner Displaying
```
Portal Error: We couldn't open the subscription portal. 
Please try again.
```

**This is WORKING CORRECTLY!** 

It means:
- ✅ Error detection working
- ✅ Error banner component rendering
- ✅ User feedback working

**Check dev logs:**
```bash
tail -100 /Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt | grep -i "portal\|customer\|error"
```

---

### Scenario 2: React Console Warning

If you see in **Browser DevTools Console:**
```
Warning: Failed prop type: Invalid prop `portalError` supplied to `SettingsView`
```

**This would mean:** The prop type is wrong

**Check the file:** `/components/settings/settings-view.tsx`
- Line 49-51: PortalLink component
- Line 59-60: portalError prop handling

---

## 🔧 Quick Fixes

### If you see ANY error:

1. **Open Browser DevTools** (F12 → Console)
2. **Read the error message** carefully
3. **Click the file/line link** to see the code
4. **Check the stack trace** for context

### Most Likely Fixes:
- [ ] Restart dev server: `pnpm dev`
- [ ] Clear browser cache: Ctrl+Shift+Delete (or Cmd+Shift+Delete)
- [ ] Hard refresh: Ctrl+F5 (or Cmd+Shift+R)
- [ ] Check environment variables: `grep POLAR /apps/web/.env.local`

---

## 🎯 Specific Error Checks

### Check for Portal Component Errors
```bash
# Look for our error logging
grep "Customer portal\|Polar checkout" /Users/adamboon/.cursor/projects/Users-adamboon-PLOT-Workspace/terminals/965192.txt
```

### Check Browser Console for Warnings
**In your browser:**
1. F12 → Console
2. Filter to show only Warnings
3. Look for anything related to:
   - Portal
   - Subscription
   - Props
   - Hydration

---

## 📝 How to Report the Error

When you see the pop-up, tell me:

1. **Exact error message** (screenshot or copy-paste)
2. **When it appears** (on page load, after clicking button, etc.)
3. **What page you're on** (settings, pricing, dashboard, etc.)
4. **Browser DevTools Console** output (red/yellow messages)
5. **Dev server terminal** output (any errors there?)

---

## 🚀 Next Steps

1. **Open browser DevTools** (F12)
2. **Go to Console tab**
3. **Tell me what error you see**
4. **Include:**
   - The error message
   - The file/line it points to
   - Any stack trace

Once you share the specific error message, I can help you fix it immediately!

---

**Note:** The dev server logs look completely clean (all 200/302 status codes), so it's likely a client-side issue that the error banner system is catching (which is exactly what we want it to do!).

Let me know what the error message says! 📍
