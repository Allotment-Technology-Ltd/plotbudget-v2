# Sanity CMS Audit & Content Strategy Brief

> **Purpose:** This document is a complete technical and strategic audit of the current Sanity CMS
> implementation in the PLOT marketing site. Use it as a starting point in Claude (or any AI
> assistant) to plan Sanity schema enhancements, new document types, and an SEO-driven internal
> linking strategy.

---

## 1. Current Sanity Setup

### 1.1 Studio Configuration

| Property | Value |
|----------|-------|
| Sanity version | `5.11.0` |
| Project ID | `a2vzaekn` |
| Dataset | `production` |
| Studio title | `plot-blog` |
| Plugins enabled | `structureTool()`, `visionTool()` |

**File:** `sanity-studio/sanity.config.ts`

The studio currently only knows about the blog. No custom desk structure, no custom input
components, no document-level actions beyond the defaults.

---

### 1.2 Blog Post Schema — All Fields

**File:** `sanity-studio/schemaTypes/post.ts`

| Field name | Type | Required | Notes |
|---|---|---|---|
| `title` | `string` | ✅ | Post title |
| `slug` | `slug` (from title, max 96 chars) | ✅ | URL identifier |
| `author` | `reference → author` | ❌ | Author profile |
| `mainImage` | `image` (hotspot + required `alt`) | ❌ | Featured image with accessibility requirement |
| `categories` | `array of reference → category` | ❌ | Multiple categories supported |
| `publishedAt` | `datetime` | ✅ | Publication timestamp |
| `archived` | `boolean` (default `false`) | ❌ | Hides from index; direct link still works |
| `body` | `blockContent` (Portable Text) | ❌ | Rich text body (see §1.4) |
| `seo.metaTitle` | `string` (max 60 chars) | ❌ | SEO title (warn > 60) |
| `seo.metaDescription` | `text` (max 160 chars, 3 rows) | ❌ | SEO description (warn > 160) |
| `seo.focusKeyword` | `string` | ❌ | Primary ranking keyword |
| `seo.additionalKeywords` | `array of string` (tag layout) | ❌ | Secondary keywords |

**Missing fields (notable gaps):**
- No `excerpt` / `summary` field — the blog listing currently shows no description text, only title and date
- No `readingTime` (computed or manually set)
- No `relatedPosts` cross-reference array
- No `internalLinks` / `canonicalUrl` override
- No `og:image` override separate from `mainImage`
- No `lastModified` field for sitemap freshness signalling

---

### 1.3 Supporting Schema Types

**Author** (`sanity-studio/schemaTypes/author.ts`)

| Field | Type |
|-------|------|
| `name` | `string` |
| `slug` | `slug` (from name) |
| `image` | `image` (hotspot) |
| `bio` | `array of block` (plain paragraphs only) |

**Category** (`sanity-studio/schemaTypes/category.ts`)

| Field | Type |
|-------|------|
| `title` | `string` |
| `description` | `text` |

---

### 1.4 `blockContent` Rich Text Definition

**File:** `sanity-studio/schemaTypes/blockContent.ts`

```
Styles:   Normal, H1, H2, H3, H4, Blockquote
Lists:    Bullet only (no numbered lists)
Marks:    Strong, Italic
Links:    External URL annotations only
Embeds:   Inline images with required alt text
```

**Notable gaps in blockContent:**
- No ordered/numbered lists
- No `internalLink` annotation type (links to other Sanity documents)
- No `callout` or `highlight` custom block type
- No video embed support
- No code block support

---

### 1.5 GROQ Query Pattern — Live Client-Side Fetching

**Yes, GROQ queries are used.** There is no static export at build time.

**File:** `apps/marketing/src/lib/blog.js`

**Client setup** (`apps/marketing/src/lib/sanity.js`):
- Lazy-initialised singleton `createClient`
- Routes through a server-side proxy (`/api/sanity/*`) in production to avoid exposing the project
  token and for CSP compliance
- `useCdn: false` — always fetches from the Sanity API, not the CDN edge cache
- API version pinned to `2024-01-01`

**Query 1 — Blog index (all published posts, newest first):**

```groq
*[_type == "post" && !(_id in path("drafts.**")) && archived != true]
| order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  "imageUrl": mainImage.asset->url
}
```

Fields projected: `_id`, `title`, `slug`, `publishedAt`, `imageUrl` — **no excerpt, no categories**.

**Query 2 — Single post by slug:**

```groq
*[_type == "post" && !(_id in path("drafts.**"))
  && (slug.current == $slug || slug.current == $slugWithBlog)][0] {
  title,
  slug,
  body,
  publishedAt,
  "imageUrl": mainImage.asset->url
}
```

Slug normalisation handles slugs stored with or without a `blog/` prefix.
Falls back to a full-list scan + `_id` lookup if the direct slug query returns nothing.

**Fields not projected in single-post query:** `seo`, `author`, `categories`, `archived` —
the SEO object is fetched but never consumed by the `<Helmet>` component in `BlogPostPage.jsx`.

**Query 3 — Draft preview** (`apps/api/sanity-preview.js`):
Fetches by `_id` (including draft documents). Served from a Vercel serverless function.

---

### 1.6 How Blog Posts Are Rendered

**File:** `apps/marketing/src/pages/BlogPostPage.jsx`

- Calls `getBlogPost(slug)` on mount via `useEffect`
- Renders body with `@portabletext/react` inside `<BlogPostContent />`
- Uses `react-helmet-async` for `<title>` and meta tags — but only uses the post `title`; the
  `seo.metaTitle`, `seo.metaDescription`, `seo.focusKeyword` fields are fetched but **not passed
  to `<Helmet>`**. This is a bug/gap.
- No structured data (JSON-LD) for articles — only the global `SoftwareApplication` schema from
  the `<SEO>` component fires on every page.

---

## 2. Pages to Move to Sanity

### 2.1 Roadmap Page

**File:** `apps/marketing/src/pages/RoadmapPage.jsx`

#### Current page structure

The page is a client-side React component with four visible sections:

1. **Hero** — `PageHeader` with title "Roadmap" and subtitle "From budgeting app to household
   operating system." plus two descriptive paragraphs (hardcoded JSX).
2. **Why an Operating System?** callout — three bullet points explaining module interconnection
   (hardcoded JSX).
3. **Roadmap timeline** — three labelled lanes (Now / Next / Later), each containing expandable
   `ModuleCard` components rendered from the `roadmap` JS object below.
4. **How we decide what to build** — three bullet points + CTA link to `APP_URL` (hardcoded JSX).

The `ModuleCard` renders: icon (Lucide), name, description, status badge, and an expandable
panel with a feature list and optional note.

Status badge styles are driven by a `statusStyles` map keyed on the string value:

```
"Live in Beta"          → accent/green tones
"In Development"        → amber tones
"Planned - Next"        → muted/grey tones
"Planned"               → muted/grey tones
"Planned - Conditional" → muted/grey tones
```

Icon names are Lucide component names resolved at runtime via an `iconMap` object:
`PoundSterling`, `Layers`, `CheckSquare`, `Calendar`, `Utensils`, `Plane`, `Lock`, `Home`, `Baby`.

#### Full hardcoded `roadmap` data object

There are **9 modules** across 3 buckets. This is the complete current content:

**`now` (1 module — "Currently available")**

| Field | Value |
|---|---|
| id | `money` |
| name | Money |
| iconKey | `PoundSterling` |
| description | Budget planning and the 20-minute payday ritual |
| status | Live in Beta |
| features | Monthly payday ritual (20-minute guided ceremony); Blueprint planning (allocate income across categories); Seed tracking (bills, savings, wants, repayments); Fair split calculator (for couples with separate accounts); Pay cycle management (solo or couple mode); 50/30/10/10 framework with visual breakdowns |
| note | — |

**`next` (3 modules — "In active development")**

| id | name | iconKey | description | status |
|---|---|---|---|---|
| `platform` | Platform Foundation | `Layers` | Core infrastructure for the module ecosystem | In Development |
| `tasks` | Tasks & Projects | `CheckSquare` | Chores, to-dos, and multi-phase household projects | In Development |
| `calendar` | Calendar | `Calendar` | Shared household calendar, not individual schedules | Planned - Next |

Platform Foundation features: Notification engine (in-app + email digests); Activity feed
(household timeline of all actions); Module navigation (mobile bottom tabs + web sidebar);
Global search (across all modules); Subscription tier gating (Free vs Pro).

Tasks & Projects features: Weekly Reset ceremony (10-minute Sunday ritual); Recurring chore
templates (auto-generate weekly tasks); Project planning (phases, kanban boards, timelines);
Fairness tracking (task distribution over time); Cross-module linking (project → repayment,
meal → shopping task).

Calendar features: Household view (everyone's commitments visible); Event categories (work,
personal, family, home maintenance); Weekly Lookahead integration with Weekly Reset; iCal sync
(import external calendars); Reminder system (integrated with notifications).

**`later` (5 modules — "Planned for future")**

| id | name | iconKey | description | status |
|---|---|---|---|---|
| `meals` | Meals & Groceries | `Utensils` | Meal planning and shopping list management | Planned |
| `holidays` | Holidays & Trips | `Plane` | Trip planning from idea to packing list | Planned |
| `vault` | Vault | `Lock` | Secure document storage and renewal tracking | Planned |
| `home` | Home Maintenance | `Home` | Track maintenance, repairs, and seasonal tasks | Planned |
| `kids` | Kids | `Baby` | Child profiles, activities, and school calendar | Planned - Conditional |

Kids module note: *"This module ships only if user demand validates it. We don't build
speculatively."*

#### API fallback (live app override)

The page runs `GET /api/public/roadmap` on mount and replaces `roadmapData` state if the
response contains a `features` array. The `mapApiFeaturesToRoadmap()` function maps:
`status: "now" | "shipped"` → `now`, `status: "next"` → `next`, `status: "later"` → `later`.
If the API is unavailable (network error or non-OK response), the hardcoded data above is used
as the fallback — so the hardcoded content must remain accurate.

**Recommendation options:**

| Option | Pros | Cons |
|---|---|---|
| **A. Single `roadmap` document** with inline array of module objects | Simple — one document, one GROQ call | Hard to reorder modules; editors must manage nested objects |
| **B. Multiple `roadmapItem` documents** with a `bucket` field (`now`/`next`/`later`) and `order` number | Independent editing per module; drag-to-reorder possible with the `orderable-document-list` Sanity plugin | Requires multi-document GROQ query; slightly more schema work |
| **C. Hybrid** — `roadmapPage` singleton (intro text, section descriptions) + `roadmapItem` documents | Best separation of concerns; keeps page copy editable and modules independently editable | Two document types to maintain |

**Recommended answer:** **Option C — Hybrid**.  
The intro copy ("From budgeting app to household operating system") should be editable without a
deploy. Each module card should be an independent document so the team can update status badges and
feature lists without touching the others.

---

### 2.2 Principles Page

**File:** `apps/marketing/src/pages/PrinciplesPage.jsx`

#### Current page structure

The page has four visible sections:

1. **Hero** — `PageHeader` with title "Principles" and subtitle "PLOT is built on beliefs about
   how households should work, how software should serve people, and what makes life liveable."
   (hardcoded JSX).
2. **Principle cards** — 8 animated `<article>` elements rendered from the `principles` array,
   each showing: numbered id, title, main body paragraph, "PLOT's approach:" label + paragraph,
   and a pull-quote blockquote.
3. **In Practice** table — 8 rows mapping a product feature to the principle it embodies,
   rendered from the `inPracticeItems` array.
4. **Footer CTA** — `FounderSignOff` component (date: "February 2026") + link to `APP_URL`.

#### Full hardcoded `principles` array (8 entries)

---

**Principle 01 — The Sisyphean Condition**

> *main:* Life is repetitive. Bills need paying every month. Chores need doing every week. Meals
> need planning. Home maintenance never ends. The boulder always rolls back down the hill. Most
> apps promise to eliminate the boulder through automation or optimisation. But they can't. The
> boulder is life.
>
> *approach:* Accept the boulder. Make pushing it bearable. Turn repetition into ritual.
>
> *quote:* 20 minutes at payday. 10 minutes on Sunday. The rest of your time? Live your life.

---

**Principle 02 — Household Labour is Real Work**

> *main:* Budgeting, meal planning, chore management, document tracking—this is real work. It
> takes time, attention, and energy. In most households, one person does most of this work
> invisibly. They manage the spreadsheet. They chase updates. They hold the mental load. This
> isn't just inefficient. It's unfair.
>
> *approach:* Make household work visible. Distribute it equitably. No one should be the
> household chancellor.
>
> *quote:* Households are teams, not hierarchies.

---

**Principle 03 — Tools Should Serve, Not Surveil**

> *main:* Most budgeting apps want to connect to your bank. They harvest your transactions. They
> analyse your behaviour. Some sell this data. Others use it to shape your spending. This is
> surveillance capitalism—extracting value from your data without your meaningful consent.
>
> *approach:* No bank connections. No transaction harvesting. No behavioural extraction. You
> enter the numbers. You make the decisions. You own the data.
>
> *quote:* We're paid by optional Pay What You Like contributions, not by your data. This changes
> everything.

---

**Principle 04 — Autonomy Over Optimisation**

> *main:* Your household isn't an algorithm. Your values aren't data points. Software shouldn't
> decide for you—it should help you decide together.
>
> *approach:* The tool helps. You decide. We give you structure, visibility, and shared control.
> The judgment is yours.
>
> *quote:* Software is infrastructure, not a parent.

---

**Principle 05 — Constraint as Kindness**

> *main:* When you have infinite options, decision-making becomes exhausting. When your budgeting
> app has 47 configuration screens, you spend more time setting it up than using it. Too much
> freedom is a burden.
>
> *approach:* Make the hard decisions so you don't have to. One or two great ways to do each
> thing. Opinionated workflows refined through years of real use. Simple systems beat complex ones.
>
> *quote:* We've made the mistakes so you don't have to.

---

**Principle 06 — Respect for Time**

> *main:* Most apps optimise for engagement. More notifications. More daily check-ins. More
> screen time. This is the attention economy—your time is the product being sold.
>
> *approach:* We want 20 minutes of your month. Not your life. Get in, handle it, get out. Good
> tools disappear when you're not using them.
>
> *quote:* The goal is to spend LESS time in PLOT, not more.

---

**Principle 07 — Reality Over Aspiration**

> *main:* Most productivity apps sell transformation. 'Unlock your potential.' 'Achieve your
> dreams.' But household admin isn't aspirational. It's mundane. Bills, chores, groceries—this
> is life's unglamorous scaffolding.
>
> *approach:* Honesty. We're not here to transform you. We're here to make the boring parts of
> life less painful so you have more time for what matters: love, connection, presence, meaning.
>
> *quote:* Because managing your life shouldn't consume it.

---

**Principle 08 — Built With, Not For**

> *main:* My partner has tested PLOT since day one. Founding members vote on what gets built
> next. This isn't my product. It's ours.
>
> *approach:* Products built in isolation from their users serve the builder, not the user. We
> listen. We adapt. We build with you.
>
> *quote:* The best tools emerge from conversation, not command.

---

#### Full hardcoded `inPracticeItems` array (8 entries)

| Feature | Principle mapping |
|---|---|
| No bank connections | Surveillance capitalism rejection (Principle 3) |
| 20-minute rituals | Time respect (Principle 6) |
| Fairness tracking | Labour equity (Principle 2) |
| Opinionated workflows | Constraint as kindness (Principle 5) |
| Pay-what-you-like founding members | Built with users (Principle 8) |
| Manual input | Reality over automation fantasy (Principles 1, 7) |
| Shared visibility | No household hierarchies (Principle 2) |
| You control the system | User autonomy (Principle 4) |

**Recommendation options:**

| Option | Pros | Cons |
|---|---|---|
| **A. Single `principlesPage` document** with an array of principle objects | Simplest; one document in Sanity | Rich text not possible for individual `main` / `approach` fields unless using `blockContent` |
| **B. Multiple `principle` documents** | Independent editing; reordering; could reference related blog posts | Overkill for static content that rarely changes |
| **C. Single document with rich text arrays per principle** | Principles page rarely changes; rich text `main` / `approach` fields enable formatting | Authors must navigate deeply nested arrays |

**Recommended answer:** **Option A — Single `principlesPage` document** with an inline array.  
The principles are brand-bedrock copy — they almost never change. A single document is easier to
audit and version. Each principle can have `main` and `approach` as plain strings or simple
`blockContent` arrays if formatting is ever needed.

---

### 2.3 Story Page

**File:** `apps/marketing/src/pages/StoryPage.jsx`

#### Current page structure

The page has four visible sections:

1. **Hero** — `PageHeader` with title "Why PLOT Exists" and subtitle "The story of how a decade
   of spreadsheet frustration became a household operating system." (hardcoded JSX).
2. **Story arc with timeline** — 5 animated `<article>` elements rendered from the `beats` array.
   A vertical line runs down the left; each beat has a numbered circular node, a headline as `<h2>`,
   body paragraphs, and an optional pull-quote `<blockquote>`.
3. **Founder signature** — `FounderSignOff` component (date: "February 2026").
4. **CTA section** — heading "Ready to join?", paragraph about pricing/founding members, link to
   `APP_URL`.

CTA paragraph text (hardcoded): *"PLOT is free forever on Pay What You Like. The first 100
households are Founding Members — full access free for 12 months. Everyone else gets a 2-cycle
trial, then a permanent free tier."*

#### Full hardcoded `beats` array (5 entries)

---

**Beat 01 — "For 10 years, I was the 'chancellor' of my household."**

> Every payday, I'd update our spreadsheet. Every week, I'd chase my partner to send her
> transaction list. Every month, I'd copy-paste formulas, update tabs, and hope nothing broke.
>
> I was the one who knew where the money was. I was the one who said 'yes' or 'no' to spending.
> I didn't want that power. My partner didn't want to be dependent on me for it.
>
> But every budgeting app we tried made it worse.

Pull-quote: none.

---

**Beat 02 — "I tried everything."**

> YNAB was too expensive and overwhelming. Banking apps wanted too much data and didn't fit our
> workflow. Spreadsheets were flexible but broke every time life changed.
>
> After 10 years of 'build-measure-learn' on a Google Sheet that required constant maintenance, I
> realised: I'm solving the wrong problem.
>
> We didn't need better transaction tracking. We needed to agree on the plan BEFORE payday,
> together, in 20 minutes.

Pull-quote: none.

---

**Beat 03 — "Then came the pub conversation."**

> One night, a colleague mentioned he was 'the household chancellor.' Everyone around the table
> nodded. Someone said: 'I thought that was just me.'
>
> That's when I realised this isn't a personal problem. It's universal.
>
> Couples don't need better spreadsheets. They need a way to plan together, without one person
> becoming the gatekeeper.

Pull-quote: *"I thought that was just me."*

---

**Beat 04 — "But it wasn't just money."**

> As I talked to more people, I realised: the spreadsheet problem isn't just budgeting. It's
> meal plans. Shopping lists. Holiday planning. Renovation tracking. Document storage. Home
> maintenance.
>
> People were managing their entire households across 6 disconnected apps, 3 spreadsheets, and
> 47 sticky notes.
>
> You don't want 6 subscriptions. You want one operating system.
>
> PLOT became that system.

Pull-quote: none.

---

**Beat 05 — "My partner has been testing PLOT since day one."**

> She's given me honest feedback about what works, what doesn't, what makes sense, what she
> wouldn't use.
>
> PLOT isn't built in isolation. It's built in conversation—with my partner, with founding
> members, with every household that joins.
>
> Because the best tools emerge from partnership, not command.
>
> This is the tool I wish I'd had 10 years ago. Now it's yours too.

Pull-quote: none.

**Recommendation:** **Single `storyPage` document** with a `beats` array field.  
Each beat object: `label` (string), `headline` (string), `body` (blockContent for paragraphs),
`pullQuote` (string, optional). This is founder narrative that occasionally needs small updates
(dates, product names, new milestones) — keeping it editable without a deploy is valuable.

---

### 2.4 Signup / Call-to-Action

There is no standalone signup page in the marketing site. Signup is handled by the main app at
`APP_URL` (the web app, `apps/web`). All marketing pages link to it via an `<a href={APP_URL}>`.

**Recommendation:** Keep signup in the main app (auth-critical, session management).  
However, a **`callToAction` document type** (or a `ctaBlock` object type reused across pages)
would be useful for:
- The text of the CTA button (`"Join as a founding household →"`)
- The paragraph above the CTA (`"PLOT is free forever on Pay What You Like…"`)
- Whether to show the CTA at all on a given page

This avoids deploying to update CTA copy, which currently appears hardcoded on 5+ pages.

---

### 2.5 Other Pages Worth Considering

| Page | File | Recommendation |
|------|------|---------------|
| **Changelog** | `ChangelogPage.jsx` + `data/publicChangelog.js` | Move to a `changelogEntry` document type. Currently a static JS file requiring a deploy to update. |
| **Features** | `FeaturesPage.jsx` | Low priority — move only if feature descriptions need frequent updating. |
| **Home (hero / sections)** | `HomePage.jsx` | Medium priority — hero headline/subtitle and section copy could use a `homePage` singleton. |
| **Pricing** | `PricingPage.jsx` | Keep in code for now; pricing tiers are tightly coupled to Polar subscription product IDs. |
| **Privacy / Terms** | `PrivacyPage.jsx`, `TermsPage.jsx` | Move to Sanity as `legalPage` documents — legal copy changes should not require a deploy. |

---

## 3. Internal Linking Strategy

### 3.1 Current State

There is **no internal linking infrastructure** in the marketing site. All links are hard-coded
`<a href>` or React Router `<Link to>` elements written at development time. There is no:

- Cross-reference field on blog posts pointing to other posts or pages
- Build-time crawler or link validator
- Studio plugin surfacing related content during editing
- `internalLink` annotation in the blockContent rich text definition (links in body always use
  plain external `url` type)

### 3.2 SEO Internal Linking Goals — Three Options

| Option | Description | Effort | Quality |
|---|---|---|---|
| **A. Automatic crawler** | A build-time script reads all Sanity documents, extracts keyword fields (`focusKeyword`, `additionalKeywords`, titles), then scans all `body` blockContent and suggests or auto-injects `internalLink` annotations where keyword matches are found | High | Medium — keyword matching is noisy; may inject irrelevant links |
| **B. Manual with studio helpers** | A Sanity Studio plugin (custom input component or `@sanity/assist` integration) shows a "Related content" sidebar panel when editing. Editor clicks to insert an internal link. Links are stored as `internalLink` annotations in the document's rich text | Medium | High — editorial judgement ensures relevance |
| **C. Both (recommended)** | Manual editorial control is the primary mechanism. A build-time crawler runs as a CI check to: (1) validate that all `internalLink` references still resolve, (2) flag pages with high topical overlap but zero mutual links (link gaps), (3) generate a report of orphaned pages (pages with no inbound links) | Medium-High | High — humans decide; automation validates and fills gaps |

**Recommended answer: Option C.**

The automated crawler should **never auto-inject** links without editorial review (this would
compromise copy quality and could create awkward or misleading links). Instead, the crawler
produces a build-time report that surfaces:

1. **Broken links** — `internalLink` references where the target document is archived, deleted, or
   unpublished
2. **Link gap report** — pairs of documents that share 2+ keywords but have no reciprocal link
3. **Orphan report** — published documents with zero inbound internal links

---

## 4. Recommended Schema Additions — Priority Order

### Phase 1 — Fix existing gaps (no new document types)

1. **Add `excerpt` field to `post`** — `string` or short `text`, max 200 chars. Used in the blog
   index listing and Open Graph description.
2. **Add `relatedPosts` field to `post`** — `array of reference → post`, max 3 items. Enables
   manual related-posts linking without a crawler.
3. **Add `internalLink` annotation to `blockContent`** — references a `post`, `page`, or
   `roadmapItem` document; rendered as a standard `<Link>` in JSX.
4. **Wire `seo` fields to `<Helmet>`** in `BlogPostPage.jsx` — the schema already has
   `metaTitle`, `metaDescription`, and `focusKeyword` but they are fetched and then dropped.

### Phase 2 — New document types for static pages

1. `roadmapPage` singleton (intro copy)
2. `roadmapItem` document type (one per module, with `bucket` and `order` fields)
3. `storyPage` singleton (5-beat founder narrative)
4. `principlesPage` singleton (8 principles)
5. `changelogEntry` document type (replaces `data/publicChangelog.js`)

### Phase 3 — Internal linking infrastructure

1. `callToAction` reusable object type (button text, supporting copy, target URL)
2. Build-time link audit script (`scripts/sanity-link-audit.js`) — GROQ query → keyword extraction
   → gap/orphan/broken link report → fail CI if broken links exist
3. Studio "Related Content" panel (custom Sanity plugin or `@sanity/assist`)

### Phase 4 — Content types for SEO-driven growth

1. `faqPage` document or reusable `faqItem` array on existing pages — structured data for FAQ
   rich results
2. `glossaryEntry` document type — definitions of terms like "payday ritual", "household
   chancellor", "50/30/10/10" — high long-tail SEO value, easy to internally link from blog posts
3. `caseStudy` document type — household stories (anonymised) — social proof + long-form content
4. Article structured data (`JSON-LD`) injected per blog post using `schema.org/Article`

---

## 5. Technical Notes for Implementation

### 5.1 GROQ Query Changes Needed

When adding `excerpt` and `relatedPosts` to `post`, update the index query projection:

```groq
*[_type == "post" && !(_id in path("drafts.**")) && archived != true]
| order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  "imageUrl": mainImage.asset->url,
  "categories": categories[]->title
}
```

And the single-post query:

```groq
*[_type == "post" && !(_id in path("drafts.**"))
  && (slug.current == $slug || slug.current == $slugWithBlog)][0] {
  title,
  slug,
  excerpt,
  body,
  publishedAt,
  "imageUrl": mainImage.asset->url,
  "author": author->{ name, "imageUrl": image.asset->url },
  "categories": categories[]->title,
  "relatedPosts": relatedPosts[]->{ title, slug, excerpt, publishedAt, "imageUrl": mainImage.asset->url },
  seo
}
```

### 5.2 `internalLink` Annotation Schema

Add to `blockContent.ts` alongside the existing `url` annotation:

```typescript
{
  title: 'Internal Link',
  name: 'internalLink',
  type: 'object',
  fields: [
    {
      name: 'reference',
      type: 'reference',
      to: [
        { type: 'post' },
        { type: 'roadmapItem' },
        // add other page types as they are created
      ],
    },
  ],
}
```

In the React renderer, resolve the reference slug at query time:

```groq
// Inside body GROQ projection
"markDefs": body[].markDefs[]{
  ...,
  _type == "internalLink" => {
    "slug": reference->slug.current,
    "type": reference->_type
  }
}
```

### 5.3 Singleton Pages Pattern

For `roadmapPage`, `storyPage`, `principlesPage` singletons in Sanity Studio, use the
[singleton pattern](https://www.sanity.io/guides/singleton-document) with a custom desk structure:

```typescript
// sanity.config.ts — custom structure
import { structureTool } from 'sanity/structure'

structureTool({
  structure: (S) =>
    S.list()
      .title('Content')
      .items([
        S.listItem().title('Blog Posts').schemaType('post').child(S.documentTypeList('post')),
        S.divider(),
        S.listItem().title('Roadmap Page').schemaType('roadmapPage')
          .child(S.document().schemaType('roadmapPage').documentId('roadmapPage')),
        S.listItem().title('Story Page').schemaType('storyPage')
          .child(S.document().schemaType('storyPage').documentId('storyPage')),
        S.listItem().title('Principles Page').schemaType('principlesPage')
          .child(S.document().schemaType('principlesPage').documentId('principlesPage')),
        S.divider(),
        S.listItem().title('Roadmap Items').schemaType('roadmapItem')
          .child(S.documentTypeList('roadmapItem')),
        S.listItem().title('Changelog Entries').schemaType('changelogEntry')
          .child(S.documentTypeList('changelogEntry')),
      ]),
})
```

### 5.4 `useCdn: false` — Consider Enabling the CDN

The current client sets `useCdn: false`. For public-facing content that changes infrequently
(blog posts, roadmap), the Sanity CDN provides faster read performance. Consider:

- `useCdn: true` for index and page fetches (public, cacheable)
- `useCdn: false` only for preview mode (draft documents need the live API)

---

## 6. Answers to the Three Original Questions

### Q1: Current blog document schema

**Fields:** `title` (string, required), `slug` (slug, required), `author` (reference),
`mainImage` (image + required alt), `categories` (array of references), `publishedAt` (datetime,
required), `archived` (boolean), `body` (Portable Text / blockContent), `seo` object containing
`metaTitle`, `metaDescription`, `focusKeyword`, `additionalKeywords`.

**Key gaps:** no `excerpt`, no `relatedPosts`, no `internalLink` annotation, SEO fields not
consumed by the React component.

### Q2: GROQ queries or static export?

**GROQ queries — live client-side fetching.** No static export. Data is fetched on component mount
via `useEffect`. Queries go through a server-side proxy (`/api/sanity/*`) for security. Preview
mode uses a separate serverless function querying draft documents. There is no ISR or SSG — the
marketing app is a client-side SPA.

### Q3: Pages to move to Sanity

| Page | Recommended document type | Structure |
|---|---|---|
| **Roadmap** | `roadmapPage` singleton + `roadmapItem` documents | Multiple `roadmapItem` docs with `bucket` (`now`/`next`/`later`) and `order` fields |
| **Principles** | `principlesPage` singleton | Single document with inline array of 8 principle objects |
| **Story** | `storyPage` singleton | Single document with `beats` array (label, headline, body blockContent, pullQuote) |
| **Signup** | Stay in React (auth-critical) | Add a shared `callToAction` object type for editable CTA copy |

**Internal linking:** Implement **Option C (both)** — manual editorial links via an `internalLink`
blockContent annotation, plus a build-time CI script that validates links, reports gaps, and flags
orphaned pages. No auto-injection of links.

---

## 7. Quick-Start Prompts for Claude

Use the following prompts in a Claude project after loading this document:

**For schema design:**
> "Based on the PLOT Sanity audit doc, generate the TypeScript schema definition for a
> `roadmapItem` document type with `name`, `iconKey`, `description`, `status`, `features`,
> `bucket`, and `order` fields. Follow the same `defineField`/`defineType` pattern used in
> `post.ts`."

**For GROQ queries:**
> "Write a GROQ query to fetch the `storyPage` singleton document including all beat fields.
> Follow the proxy-safe pattern from `blog.js` and export it as `getStoryPage()`."

**For the link audit script:**
> "Write a Node.js script for `scripts/sanity-link-audit.js` that: (1) queries all published
> posts from Sanity using GROQ, (2) extracts `focusKeyword` and `additionalKeywords`, (3) scans
> all `body` blockContent for `internalLink` annotations, (4) reports orphaned posts (no inbound
> links), and (5) reports keyword-overlap pairs with no mutual link. Exit with code 1 if any
> broken `internalLink` references are found."

**For the `callToAction` object type:**
> "Generate a reusable Sanity `callToAction` object type with fields: `buttonText` (string),
> `supportingCopy` (text, optional), `targetUrl` (url, optional — defaults to APP_URL if empty)."
