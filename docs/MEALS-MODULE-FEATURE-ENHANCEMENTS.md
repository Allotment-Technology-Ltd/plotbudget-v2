# Meals Module Feature Enhancements - Architectural Analysis

## Executive Summary

Three major feature requests for the Meals module:
1. **Improved Recipe Fetching** - Reduce failures when importing recipes from websites
2. **Cooking Mode** - Screen-always-on timer with step navigation
3. **Camera/OCR Recipe Extraction** - Import recipes from photos and screenshots

---

## 1. IMPROVED RECIPE FETCH CAPABILITIES

### Current State
- Single scraper service (likely `importRecipeFromUrl` hook in `apps/web/hooks/use-meals.ts`)
- Fails on websites without structured recipe markup (schema.org/Recipe)
- ~30-40% failure rate on diverse recipe sources

### Technical Approach Options

#### **Option A: Multi-Service Fallback Strategy** ⭐ RECOMMENDED
```
User provides URL
  ↓
Try Service 1: Built-in scraper (schema.org extraction)
  ↓ (Fails)
Try Service 2: Jina.ai (converts HTML→markdown, then parse)
  ↓ (Fails)
Try Service 3: Claude Vision API (image-based extraction)
  ↓ (Fails)
Fallback: Manual form with pre-filled name/URL
```

**Pros:**
- Dramatically higher success rate (85-90%)
- Graceful degradation with manual fallback
- No breaking changes to current API

**Cons:**
- Multiple external API calls (cost/latency)
- Requires API keys (Jina, Anthropic)
- Complexity in orchestration

**Implementation Cost:** Medium (2-3 days)

---

#### **Option B: AI-Powered Single Service**
Replace current scraper with Claude Vision API for all recipes:
- User provides URL → We fetch page → Extract image → Claude Vision analyzes → Structured output

**Pros:**
- Simpler architecture (one service)
- High accuracy on diverse sources
- Human-like understanding of layouts

**Cons:**
- Higher per-recipe cost (~$0.01-0.05)
- Slower (requires image rendering)
- Breaks privacy (sending page content to Anthropic)

**Implementation Cost:** Low (1 day)

---

#### **Option C: User-Assisted Extraction**
When automatic fails, prompt user with semi-smart form:
- Pre-fill: Recipe name (from title tag), servings (regex patterns)
- Manual inputs for: Ingredients, instructions, cook time
- Save as template for future reference

**Pros:**
- No external APIs needed
- Transparent to user ("we couldn't parse it automatically, help us out")
- Aligns with PLOT principle: User autonomy
- Data stays private

**Cons:**
- Requires user effort
- Slower recipe import flow

**Implementation Cost:** Low (1 day)

---

### RECOMMENDATION: **Hybrid Approach (A + C)**

1. **Keep current scraper** for schema.org-enabled sites (fast, reliable)
2. **Add Jina.ai fallback** for text-heavy sites (cost-effective, ~$0.001/call)
3. **Show user-assisted form** if both fail (transparent, private, user-friendly)

**Benefits:**
- Success rate: ~85% with zero user effort
- 10-15% with minimal user input (fill form)
- Respects PLOT principles (transparency, user autonomy, privacy)

**Estimated Implementation:** 2-3 days

---

## 2. COOKING MODE IMPLEMENTATION

### Current State
- No cooking mode exists
- Recipe detail page (`/dashboard/meals/recipes/[id]`) shows full recipe
- No screen-wake lock capability

### Technical Approach

#### **Core Features Needed**
1. **Screen Wake Lock API** - Keep device screen on
2. **Step Navigation** - Large buttons to move through steps
3. **Timer** - Per-step or multiple simultaneous timers
4. **Readability** - Large text, high contrast for kitchen use
5. **Audio/Haptic Feedback** - When timers complete

#### **Architecture Design**

```
Recipe Detail Page
  ↓
[New] "Cooking Mode" Button (top-right)
  ↓
Enters Full-Screen Cooking Interface:
  ├─ Current Step (large text, centered)
  ├─ Step Ingredients/Instructions
  ├─ Timer (tap to add 5/10/15 min)
  ├─ Navigation (← Previous | Next →)
  ├─ Floating Action Button: "Exit Cooking"
  └─ Wake Lock enabled (WakeLock API)
```

#### **Implementation Details**

**Database/Schema:** No changes needed
- Reuse existing recipe & recipe step data
- Store timer state in component state (not persistent)

**Client-Side Code:**
```typescript
// Use Browser Wake Lock API
const wakeLock = await navigator.wakeLock.request('screen');
wakeLock.release(); // On exit

// Listen for screen lock release (user dismisses)
wakeLock.addEventListener('release', () => {
  // Handle gracefully
});
```

**Components to Create:**
1. `CookingModeDialog` - Full-screen modal
2. `CookingStepDisplay` - Current step with large text
3. `CookingTimer` - Timer component (can have multiple)
4. `CookingNavigation` - Step forward/back buttons

**Mobile-First Considerations:**
- Landscape orientation detection (cooking position)
- Responsive text sizing for small screens
- Single-handed navigation (large touch targets)
- Dark mode only (less eye strain in kitchen)

#### **Browser Support**
- ✅ iOS Safari 15+ (WakeLock API)
- ✅ Android Chrome/Firefox
- ❌ Desktop browsers (lower priority for cooking)

**Implementation Cost:** 3-4 days

---

## 3. CAMERA/OCR RECIPE EXTRACTION

### Current State
- No camera integration
- Only URL-based import exists

### Technical Approach Options

#### **Option A: Native Mobile App Feature** ⭐ BEST FOR THIS FEATURE
Only implement in native app (`apps/native/`), not web. Reasons:
- Camera access is native to mobile
- Recipe books are typically used when cooking
- PWA camera access is problematic

**Stack:**
- `expo-camera` (already in native app)
- `expo-file-system` (capture + upload)
- Claude Vision API (process image → extract recipe)

**Flow:**
```
Mobile App: Meals → [New] Camera Icon
  ↓
Open camera → User takes photo of recipe
  ↓
Send image to backend → Claude Vision extracts
  ↓
Pre-fill Create Recipe Dialog with extracted data
  ↓
User reviews/edits before saving
```

**Implementation Cost:** 3-4 days (native app)

---

#### **Option B: Web-Based Screenshot Upload**
For web app users who want to upload screenshots:
- File upload input (accept images only)
- Send to Claude Vision API
- Return structured recipe data

**Pros:**
- Works on web platform
- Useful for recipe screenshots, printed recipes
- Simpler than camera integration

**Cons:**
- Requires user to take screenshot first
- Less mobile-native feeling

**Implementation Cost:** 2 days

---

### RECOMMENDATION: **Phased Approach**

**Phase 1 (Weeks 1-2):** Web app screenshot upload
- File input → Claude Vision → Pre-fill form
- Works immediately for all users
- Low implementation cost
- Low complexity

**Phase 2 (Weeks 3-4):** Native mobile camera
- Real-time camera experience
- Higher UX value for mobile users
- Native integration using Expo

---

## IMPLEMENTATION PRIORITY MATRIX

| Feature | Impact | Effort | Complexity | PLOT Alignment | Recommendation |
|---------|--------|--------|-----------|---|---|
| **Recipe Fetch** | High | Medium | Medium | ✅ User autonomy, privacy | **Do First (2-3 days)** |
| **Cooking Mode** | High | Medium | Medium | ✅ Time respect, autonomy | **Do Second (3-4 days)** |
| **Screenshot Upload** | Medium | Low | Low | ✅ User autonomy | **Do Third (2 days)** |
| **Mobile Camera** | High | High | High | ✅ Ease of use | **Do Last (3-4 days)** |

---

## RECOMMENDED IMPLEMENTATION ORDER

### Week 1-2: Recipe Fetch Improvements
1. Keep current scraper
2. Add Jina.ai fallback
3. Implement user-assisted form fallback
4. Add error messaging explaining what failed

### Week 3-4: Cooking Mode
1. Create cooking mode interface
2. Implement WakeLock API
3. Add step navigation
4. Add timer(s)
5. Test on mobile devices

### Week 5: Screenshot Recipe Upload (Web)
1. Add file input to recipes page
2. Integrate Claude Vision API
3. Pre-fill create recipe dialog

### Week 6-7: Mobile Camera Integration (Native)
1. Add camera button to native app
2. Capture image & send to Claude Vision
3. Pre-fill create recipe dialog
4. Test on iOS/Android

---

## COST ANALYSIS

### API Costs (Monthly Estimates)

**Jina.ai Fallback:**
- ~500 recipe fetches/month × $0.001 = $0.50
- Negligible cost

**Claude Vision API (Screenshot + Mobile):**
- ~100 extractions/month × $0.01 = $1.00
- ~50 mobile extractions/month × $0.015 = $0.75
- **Total: ~$1.75/month** (negligible at scale)

---

## ALIGNMENT WITH PLOT PRINCIPLES

### ✅ Cooking Mode
- **Time Respect:** Respects cooking workflow (no distractions)
- **User Autonomy:** User controls when to advance steps
- **Simplicity:** One thing: cook your recipe step-by-step

### ✅ Recipe Fetch Improvements
- **User Autonomy:** Clear feedback when automated fetch fails
- **Reality:** Honest about limitations ("we couldn't parse this")
- **Privacy:** User-assisted fallback doesn't share data with 3rd parties

### ✅ Camera/OCR Extraction
- **User Autonomy:** User controls when/what to photograph
- **Simplicity:** One clear way to extract recipe from image
- **Time Respect:** Faster than manual typing

---

## BLOCKERS & RISKS

### Recipe Fetch
- **Risk:** Jina.ai downtime → fallback to manual form
- **Mitigations:** Use as fallback only; keep manual form as final option

### Cooking Mode
- **Risk:** WakeLock permission denied on iOS
- **Mitigations:** Graceful fallback (just normal view); educate users to "enable screen lock" in iOS settings

### Camera/OCR
- **Risk:** Claude Vision accuracy on handwritten recipes
- **Mitigations:** Always show user review form; don't auto-save

---

## NEXT STEPS

1. **Approve implementation order** (above)
2. **Decide on recipe fetch strategy** (Hybrid A+C recommended)
3. **Create linear tickets** for each week
4. **Set up API keys** (Jina.ai, Claude Vision)
5. **Begin Week 1 implementation**

