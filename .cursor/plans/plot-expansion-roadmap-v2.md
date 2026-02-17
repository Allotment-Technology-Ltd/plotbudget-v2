# PLOT Platform Expansion Roadmap

> **From Couples Budgeting App → The Opinionated Household Operating System**
> Version 2.0 — February 2026

---

## Strategic Vision

PLOT's thesis: **Running a household is a team sport, and every team needs an operating system.**

Today's households juggle 6–10 disconnected tools: a budgeting spreadsheet, a shared calendar, a notes app, a chore rota on the fridge, a WhatsApp group for grocery lists, a folder of insurance documents somewhere. The result is the same friction PLOT already solves for money — mental load imbalance, missed handoffs, and resentment that builds silently.

PLOT becomes the **single pane of glass** for household operations. Money was Module 1. The roadmap below adds six more, each following the same design philosophy: opinionated workflows that tell you *how* to run your household well, not just give you a blank canvas.

### The Linear / Notion Analogy

Linear didn't win by having more features than Jira. Notion didn't win by having more features than Confluence. They won by having **fewer features that work better together**, with strong opinions about how teams should operate. PLOT applies the same principle to the household:

- **Opinionated defaults over infinite configuration** — PLOT tells you "do your 15-minute ritual on payday" rather than letting you build custom dashboards
- **Speed as a feature** — Every interaction should feel instant on mobile. Native gestures. No loading spinners. Offline-capable for grocery lists.
- **Modules that talk to each other** — A grocery list seed auto-creates shopping tasks. A holiday creates a savings pot, calendar events, and vault entries. A kitchen remodel project links to a repayment and generates tasks with phases. This interconnection is the moat.
- **Beautiful constraint** — Each module ships with one great workflow rather than ten mediocre ones

### Identity Framework

PLOT sits at the intersection of two identities:

| Identity | What it means in practice |
|----------|--------------------------|
| **Household-first** | The product is organised around your home, not around individuals. Every module assumes shared ownership and collaboration. |
| **Relationship-first** | Every feature is evaluated through the lens of "does this reduce friction between partners?" If a feature creates more arguments than it resolves, it doesn't ship. |

---

## Platform Architecture

### Multi-Platform Strategy

PLOT runs on two platforms sharing a single logic layer:

```
┌──────────────────┐     ┌──────────────────┐
│   Next.js Web    │     │  React Native    │
│   (App Router)   │     │  (Expo)          │
│                  │     │                  │
│  apps/web        │     │  apps/mobile     │
│  - Marketing     │     │  - Native UI     │
│  - Web Dashboard │     │  - Push Notifs   │
│  - Admin         │     │  - Offline-first │
└────────┬─────────┘     └────────┬─────────┘
         │                        │
         └───────────┬────────────┘
                     │
         ┌───────────▼────────────┐
         │    packages/logic      │
         │  - Zod schemas         │
         │  - Business rules      │
         │  - Calculations        │
         │  - Type definitions    │
         │  - Zustand stores      │
         └───────────┬────────────┘
                     │
         ┌───────────▼────────────┐
         │      Supabase          │
         │  - Auth (PKCE)         │
         │  - PostgreSQL + RLS    │
         │  - Realtime            │
         │  - Storage             │
         │  - Edge Functions      │
         └────────────────────────┘
```

Every business rule, schema, and calculation lives in `packages/logic`. The web and mobile apps are "dumb" UI layers that import shared logic. When we add a new module, the logic is written once and both platforms get it.

### The Module System

Every expansion area is built as a **Module** — a self-contained domain with its own data entities, business rules, and UI surfaces, but sharing the core platform layer.

```
┌─────────────────────────────────────────────────────────────┐
│                       PLOT PLATFORM                         │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐  │
│  │ Money  │ │ Tasks  │ │Calendar│ │ Meals  │ │ Holidays │  │
│  │Module 1│ │Module 2│ │Module 3│ │Module 4│ │ Module 5 │  │
│  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └─────┬────┘  │
│      │          │          │          │             │       │
│  ┌───┴──────────┴──────────┴──────────┴─────────────┴────┐  │
│  │               Shared Platform Layer                    │  │
│  │  Auth · Household · Notifications · Activity Feed     │  │
│  │  Module Navigation · Settings · Subscription Gating   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐                           │
│  │ Vault  │ │  Home  │ │  Kids  │                           │
│  │Module 6│ │Module 7│ │Module 8│                           │
│  └────────┘ └────────┘ └────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### Shared Platform Layer (built progressively)

- **Auth & Household** — Already exists (Supabase Auth, household entity, partner model)
- **Notification Engine** — Centralised in-app + push (Expo) + email (Resend) notifications, consumed by all modules
- **Activity Feed** — "Partner marked Rent as paid," "Partner added Chicken to the grocery list" — a shared heartbeat visible on the dashboard
- **Module Navigation** — Bottom tab bar (mobile) with a "more" overflow for additional modules. Sidebar (web) with module icons. Each module registers its nav entry.
- **Subscription Gating** — Polar.sh integration. Gate at the module level, not per-feature.
- **Global Search** — Search across all modules. "Boiler" finds the boiler service maintenance item, the British Gas vault entry, and the annual service seed.

---

## The Eight Modules

### Module 1: Money (EXISTS — Current Development)

The foundation. Budget planning, payday ritual, seeds, pots, repayments. This module is already built and serves as the template for all future modules.

**Post-launch improvements to layer in during expansion:**

- Activity feed entries for seed payments
- Notification hooks for payday reminders
- Deep links from other modules (e.g., holiday savings pot, project repayment)
- Global search indexing

---

### Module 2: Tasks, Chores & Projects

> *"The fridge rota, Trello board, and project planner — in one place."*

This module handles three related but distinct use cases: recurring household chores, one-off to-dos, and multi-phase household projects. The key insight is that a kitchen remodel and taking out the bins are fundamentally different types of work, but they both need assigning, tracking, and completing.

#### The Opinionated Workflows

**Weekly Reset** — A 5-minute ritual (mirrors the Payday Ritual pattern) every Sunday where partners divvy up the week's household tasks and chores. PLOT auto-generates tasks from routines and surfaces any project tasks that are due.

**Project Planning** — For bigger household undertakings, PLOT provides a structured approach: define the project, break it into phases, populate each phase with tasks. A kanban board gives visual progress tracking.

#### Core Concepts

| Concept | Description |
|---------|-------------|
| **Task** | A single unit of work. Can be standalone, part of a routine, or part of a project phase. Has an assignee, due date, and status. |
| **Routine** | A recurring chore template (e.g., "Clean bathroom — weekly — alternating"). PLOT auto-generates tasks from routines each week. |
| **Project** | A large household undertaking with a defined scope and timeline (e.g., "Remodel Kitchen/Dining Room"). Links to a savings pot and/or repayment. |
| **Phase** | A grouping within a project representing a stage of work (e.g., "Planning", "Demolition", "Installation", "Finishing"). Phases have an order and can have date ranges. |
| **Kanban Board** | Visual board with customisable columns. Default columns: Backlog → To Do → In Progress → Done. Available at both the project level and the "all tasks" level. |
| **Weekly Reset** | The opinionated ceremony. Every Sunday (configurable), PLOT presents the week's auto-generated tasks and lets partners claim, swap, or delegate. |
| **Fairness Score** | PLOT tracks task distribution over time and surfaces imbalance. Informational, not punitive. "Over the last month, Partner A completed 62% of tasks." |

#### Data Entities

**Project**
- `id`, `household_id`, `name`, `description`
- `status`: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
- `start_date`, `target_end_date`
- `linked_pot_id` (nullable FK → Pot) — savings goal funding this project
- `linked_repayment_id` (nullable FK → Repayment) — debt financing this project
- `estimated_budget`, `actual_spend`
- `cover_image_url` (nullable, for visual identification)
- `sort_order`
- `created_at`, `updated_at`

**Phase**
- `id`, `project_id`, `household_id`, `name`
- `description`
- `status`: 'pending' | 'active' | 'completed'
- `sort_order` (determines phase sequence)
- `start_date`, `end_date` (nullable, for timeline view)
- `created_at`

**Task**
- `id`, `household_id`, `name`, `description`
- `assigned_to`: 'me' | 'partner' | 'unassigned'
- `status`: 'backlog' | 'todo' | 'in_progress' | 'done' | 'skipped'
- `priority`: 'low' | 'medium' | 'high' | 'urgent'
- `due_date`, `completed_at`
- `project_id` (nullable FK → Project)
- `phase_id` (nullable FK → Phase)
- `routine_id` (nullable FK → Routine)
- `effort_level`: 'quick' | 'medium' | 'involved' (for fairness weighting)
- `kanban_order` (integer, for drag-and-drop positioning within a column)
- `linked_module`: nullable enum ('money' | 'meals' | 'home' | 'holidays' | 'kids')
- `linked_entity_id`: nullable UUID (FK to the source record in another module)
- `created_at`, `updated_at`

**Routine**
- `id`, `household_id`, `name`
- `frequency`: 'daily' | 'weekly' | 'fortnightly' | 'monthly'
- `day_of_week` (nullable, for weekly routines)
- `assignment_mode`: 'fixed_me' | 'fixed_partner' | 'alternating' | 'unassigned'
- `effort_level`, `category`
- `is_active`
- `created_at`

#### Cross-Module Links

- A **Seed** marked as "needs action" (e.g., "Pay electricity bill") auto-creates a task assigned to the payment source
- **Meal plan** confirmation generates a "Do the weekly shop" task
- **Home maintenance** items due this week appear in the Weekly Reset
- **Holiday** tasks (book flights, pack bags) live as a project with phases
- **Project** links to a **Pot** (savings goal) and/or **Repayment** (loan/credit financing the project)

#### Key Screens

1. **My Tasks** — Default view. Today's tasks + overdue, grouped by source (routine, project, standalone). Swipe to complete on mobile.
2. **Kanban Board** — Drag-and-drop columns. Filter by project, assignee, or "all tasks." Pull-to-refresh on mobile.
3. **Project Detail** — Project overview with phases displayed as a vertical timeline or horizontal swimlanes. Budget tracker linking to pot/repayment. Progress percentage.
4. **Routine Manager** — Configure recurring chores. Set frequency, alternation rules. Toggle routines on/off.
5. **Weekly Reset** — Guided flow: review auto-generated tasks → claim/swap → review project deadlines → confirm.
6. **Fairness Dashboard** — Rolling 30-day task distribution breakdown. Effort-weighted, not just count-based.

#### Project Example: "Remodel Kitchen / Dining Room"

```
PROJECT: Remodel Kitchen / Dining Room
├── Linked Pot: "Kitchen Fund" (£15,000 target)
├── Linked Repayment: "Home Improvement Loan" (£8,000)
├── Estimated Budget: £23,000
│
├── PHASE 1: Planning
│   ├── Task: Research kitchen fitters (Adam, High)
│   ├── Task: Get 3 quotes (Adam, High)
│   ├── Task: Choose tiles and worktop (Both, Medium)
│   ├── Task: Finalise floor plan (Adam, Medium)
│   └── Task: Apply for building regs if needed (Adam, High)
│
├── PHASE 2: Demolition
│   ├── Task: Clear out existing kitchen (Both, Involved)
│   ├── Task: Set up temporary kitchen in dining room (Partner, Medium)
│   └── Task: Contractor: knock through wall (Contractor, Involved)
│
├── PHASE 3: Installation
│   ├── Task: Contractor: install steel beam (Contractor)
│   ├── Task: Contractor: first fix electrics (Contractor)
│   ├── Task: Contractor: first fix plumbing (Contractor)
│   ├── Task: Install kitchen units (Contractor)
│   ├── Task: Fit worktop (Contractor)
│   └── Task: Install appliances (Contractor)
│
├── PHASE 4: Finishing
│   ├── Task: Tiling (Contractor)
│   ├── Task: Paint walls (Both, Involved)
│   ├── Task: Install lighting (Contractor)
│   ├── Task: Fit french doors (Contractor)
│   └── Task: Final snag list walkthrough (Both)
│
└── PHASE 5: Completion
    ├── Task: Deep clean (Both)
    ├── Task: Update home insurance (Adam, Quick)
    └── Task: File all receipts in Vault (Adam, Quick)
```

The budget tracker on this project shows: Pot balance (£12,400 / £15,000), Loan remaining (£7,200 / £8,000), Total spent so far (£5,800 / £23,000 estimated).

---

### Module 3: Shared Calendar

> *"One calendar to rule them all."*

#### The Opinionated Workflow

PLOT doesn't try to replace Google Calendar. Instead, it provides a **Household Calendar Layer** — a unified view that pulls in events from all modules plus manually added events. The key insight: most household scheduling friction comes from not having visibility into what the other person has committed to.

#### Core Concepts

| Concept | Description |
|---------|-------------|
| **Event** | A time-bound calendar entry. Can be manual or auto-generated from other modules. |
| **Auto-Events** | Generated automatically: payday dates from Money, task due dates, meal prep days, maintenance due dates, holiday dates, school events. |
| **Availability View** | A "who's around" overlay. Partners mark work schedules, travel, social plans. At a glance: can we both do the school run on Thursday? |
| **Weekly Lookahead** | Part of the Sunday Weekly Reset. After tasks are divvied, review the week's calendar together. 5-minute addition to the ceremony. |

#### Data Entities

**Event**
- `id`, `household_id`, `title`, `description`
- `start_at`, `end_at`, `is_all_day`
- `created_by`: 'me' | 'partner' | 'system'
- `source_module`: 'manual' | 'money' | 'tasks' | 'meals' | 'home' | 'holidays' | 'kids'
- `source_entity_id`: nullable FK to the originating record
- `recurrence_rule`: iCal RRULE string (nullable)
- `color`: inherits from source module's category colour
- `reminder_minutes`: array of integers (e.g., [30, 1440] = 30 min + 1 day before)
- `location`: nullable string

#### Integration Strategy

1. **Phase 1:** Native PLOT calendar with manual events + auto-events from all modules
2. **Phase 2:** Google Calendar two-way sync via API (Pro tier). PLOT events push to Google. Google events display as read-only in PLOT.
3. **Phase 3:** Apple Calendar sync via CalDAV. School calendar iCal import.

#### Key Screens

1. **Month View** — Colour-coded dots by module source. Tap a day to expand.
2. **Week View** — Availability overlay. See at a glance who's free when.
3. **Day View** — Timeline with task deadlines, calendar events, meals, and school events.
4. **Lookahead Widget** — Dashboard card showing "next 7 days" highlights.

---

### Module 4: Meals & Groceries

> *"'What's for dinner?' — answered before it's asked."*

#### The Opinionated Workflow

**Meal Ritual** — A weekly planning ceremony (piggybacks on the Weekly Reset or stands alone). Pick meals for the week from saved recipes or suggestions. PLOT auto-generates the grocery list with aggregated quantities. Check items off as you shop — synced in real-time between partners.

#### Core Concepts

| Concept | Description |
|---------|-------------|
| **Recipe** | A saved meal with ingredients, servings, prep time, and tags. Not a full recipe app — a catalogue of "things we eat." |
| **Meal Plan** | A week's worth of meal assignments. Day + meal type + recipe or free-text. |
| **Grocery List** | Auto-generated from the meal plan plus manually added items. Grouped by aisle/category. Real-time sync via Supabase Realtime. |
| **Meal Ritual** | The ceremony: plan next week → generate list → assign shopping task. |

#### Data Entities

**Recipe**
- `id`, `household_id`, `name`
- `servings`, `prep_time_minutes`, `cook_time_minutes`
- `tags`: string array (vegetarian, kid-friendly, freezable, quick, etc.)
- `ingredients`: JSON array of `{ name, quantity, unit, category }`
- `notes`, `source_url`
- `is_favourite`

**MealPlanEntry**
- `id`, `household_id`, `date`
- `meal_type`: 'breakfast' | 'lunch' | 'dinner' | 'snack'
- `recipe_id` (nullable FK → Recipe)
- `custom_name` (for meals not in the recipe book)
- `servings_override`

**GroceryItem**
- `id`, `household_id`, `name`
- `quantity`, `unit`, `category` (produce, dairy, bakery, etc.)
- `is_checked`
- `source`: 'meal_plan' | 'manual'
- `meal_plan_entry_id` (nullable)
- `sort_order` (within category)

#### Cross-Module Links

- Confirming a meal plan → auto-creates a **Task** ("Do the weekly shop")
- Grocery spending → links to a **Seed** in Money (e.g., "Groceries" need)
- Meal prep time → creates **Calendar** events
- Holiday meal planning → uses the same recipe/grocery system

#### Key Screens

1. **Meal Planner** — Week grid. Tap to assign recipe or type freeform. Swipe between weeks.
2. **Recipe Book** — Searchable, filterable cards. Favourite toggle. Import from URL (Pro).
3. **Grocery List** — Checklist grouped by category. Real-time checkmarks sync between partners in-store. Pull-down to add item.
4. **Meal Ritual** — Guided flow: plan → generate list → assign shop.

---

### Module 5: Holidays & Trip Planning

> *"From 'let's go somewhere' to boarding the plane — one place."*

#### The Opinionated Workflow

A holiday in PLOT is a **Project** with travel-specific superpowers. It uses the Project → Phase → Task structure from Module 2, but adds itinerary, packing lists, budget tracking, and document storage. Every holiday auto-creates a savings pot (or links to an existing one), and payment deadlines appear on the calendar.

#### Core Concepts

| Concept | Description |
|---------|-------------|
| **Trip** | A holiday/trip entity extending the Project model with travel-specific fields (destination, dates, travellers). |
| **Itinerary** | Day-by-day plan with time slots. "Day 3: Morning — Sagrada Familia. Afternoon — Gothic Quarter walking tour. Evening — dinner at Cal Pep." |
| **Packing List** | Per-person checklists with templates (beach holiday, city break, skiing, etc.). Items can be checked off. |
| **Trip Budget** | Breakdown of costs by category (flights, accommodation, activities, food, transport). Links to a savings pot for the total. Individual payment deadlines create calendar events and tasks. |
| **Trip Vault** | A filtered view of the Vault showing only documents tagged to this trip: booking confirmations, insurance, passport scans, tickets, maps. |

#### Data Entities

**Trip**
- `id`, `household_id`, `name`, `description`
- `destination`, `country`
- `start_date`, `end_date`
- `status`: 'dreaming' | 'planning' | 'booked' | 'in_progress' | 'completed'
- `linked_pot_id` (FK → Pot) — savings goal for this trip
- `linked_project_id` (FK → Project) — the underlying project for task management
- `cover_image_url`
- `travellers`: JSON array of `{ name, is_household_member }`
- `created_at`, `updated_at`

**ItineraryEntry**
- `id`, `trip_id`, `household_id`
- `date`, `time_slot`: 'morning' | 'afternoon' | 'evening' | 'all_day'
- `title`, `description`
- `location`, `location_url` (Google Maps link)
- `booking_reference` (nullable)
- `cost` (nullable)
- `category`: 'transport' | 'accommodation' | 'activity' | 'food' | 'other'
- `sort_order`

**TripBudgetItem**
- `id`, `trip_id`, `household_id`
- `name` (e.g., "Flights — Ryanair")
- `category`: 'flights' | 'accommodation' | 'activities' | 'food' | 'transport' | 'insurance' | 'other'
- `amount`, `currency`
- `is_paid`
- `payment_due_date` (nullable — triggers calendar event + task)
- `payment_source`: 'me' | 'partner' | 'joint' | 'pot'
- `linked_seed_id` (nullable FK → Seed)
- `notes`

**PackingItem**
- `id`, `trip_id`, `household_id`
- `name`, `category` (clothes, toiletries, documents, electronics, etc.)
- `for_person`: 'me' | 'partner' | 'shared' | child name
- `is_packed`
- `sort_order`

#### Integration Opportunity: GetYourGuide

GetYourGuide offers an affiliate API and a partner programme. Integration approach:

1. **Phase 1 (Lightweight):** When a user enters a destination, show a "Find activities" link that deep-links to GetYourGuide's search for that destination with an affiliate tag. Revenue share on bookings.
2. **Phase 2 (Deeper):** Use GetYourGuide's API to search and display activities inline within the itinerary planner. User can browse, pick activities, and add them directly to their itinerary with costs auto-populating the trip budget.
3. **Phase 3 (Premium):** Booking confirmation webhooks auto-create vault entries (confirmation PDFs) and calendar events.

Other potential travel integrations: Skyscanner (flight search affiliate), Booking.com (accommodation affiliate), Rome2Rio (transport routing), TravelPerk (for premium/business travel).

#### Cross-Module Links

- Trip creation → auto-creates a **Pot** (savings goal) with target = estimated total budget
- Payment due dates → **Calendar** events + **Tasks** ("Book flights by Friday — £340 deposit due")
- Trip documents → **Vault** items tagged to this trip (insurance policy, passport scans, booking confirmations)
- Trip dates → **Calendar** events (travel days, activity bookings)
- Pre-trip tasks → **Tasks** via the linked project ("Pack bags", "Set out-of-office", "Arrange pet sitter")
- Packing list → standalone checklist accessible offline (Expo offline storage)

#### Key Screens

1. **Trip Dashboard** — Cover image, countdown, budget summary (saved vs target), next action due.
2. **Itinerary** — Day-by-day timeline. Tap to expand entries. Add activities from GetYourGuide (Pro).
3. **Trip Budget** — Category breakdown with progress bars. Pie chart of spend allocation. Payment timeline.
4. **Packing Lists** — Per-person tabs. Template selector. Checkbox list with swipe-to-delete.
5. **Trip Vault** — Filtered vault view showing only this trip's documents and links.
6. **Trip Planning Project** — Kanban board for pre-trip tasks, reusing the Projects infrastructure.

#### Example Trip: "Barcelona — August 2026"

```
TRIP: Barcelona — August 2026
├── Status: Planning
├── Dates: 15 Aug → 22 Aug (7 nights)
├── Linked Pot: "Barcelona Fund" (£800 / £2,400 target)
│
├── BUDGET
│   ├── Flights — Ryanair: £340 (PAID, Joint)
│   ├── Apartment — Airbnb: £980 (£200 deposit PAID, balance due 1 Aug)
│   ├── Activities: £400 (estimated)
│   ├── Food & Drink: £500 (estimated)
│   └── Transport: £180 (estimated)
│   Total: £2,400
│
├── ITINERARY
│   ├── Day 1: Arrive, check in, La Boqueria market, tapas dinner
│   ├── Day 2: Sagrada Familia (booked, 10am), Park Güell (afternoon)
│   ├── Day 3: Gothic Quarter walking tour (GetYourGuide, £28pp)
│   └── ... (remaining days)
│
├── PACKING (Adam)          PACKING (Partner)
│   ├── ☑ Passport          ├── ☑ Passport
│   ├── ☐ Sunscreen         ├── ☐ Sunscreen
│   ├── ☐ Adaptor plug      ├── ☐ Beach towel
│   └── ...                 └── ...
│
├── VAULT
│   ├── Ryanair confirmation (PDF)
│   ├── Airbnb booking (link)
│   ├── Travel insurance policy (PDF)
│   ├── EHIC/GHIC cards (photo)
│   └── Sagrada Familia tickets (PDF)
│
└── PROJECT TASKS
    ├── PHASE: Booking
    │   ├── ☑ Book flights (Adam)
    │   ├── ☑ Book accommodation (Partner)
    │   ├── ☐ Book Sagrada Familia tickets (Adam, due 1 Jul)
    │   └── ☐ Buy travel insurance (Adam, due 1 Aug)
    │
    └── PHASE: Pre-departure
        ├── ☐ Arrange cat sitter (Partner, due 10 Aug)
        ├── ☐ Set out-of-office (Both, due 14 Aug)
        ├── ☐ Pack bags (Both, due 14 Aug)
        └── ☐ Download offline maps (Adam, due 14 Aug)
```

---

### Module 6: Vault (Documents & Info)

> *"Where did we put the boiler warranty?"*

#### The Opinionated Workflow

PLOT provides an **Info Vault** — a structured repository for critical household documents and information. Instead of generic file storage, PLOT provides **pre-built categories** with prompts for what to store, and tracks expiry/renewal dates.

#### Core Concepts

| Concept | Description |
|---------|-------------|
| **Vault Item** | A document upload or structured info entry. Has a category, optional expiry/renewal date, and metadata. |
| **Category** | Pre-defined categories with suggested items. "Insurance" → home, contents, life, car, pet. "Utilities" → gas, electric, water, broadband, council tax. |
| **Expiry Alerts** | PLOT tracks renewal dates and notifies 30 days before expiry. "Your home insurance renews in 30 days." |
| **Emergency Card** | A one-page summary: key contacts, policy numbers, NHS numbers, vet details, neighbour's number, stopcock location. Exportable as PDF. Shareable via time-limited link. |
| **Trip Vault** | A filtered view showing documents tagged to a specific trip (Module 5 integration). |

#### Data Entities

**VaultItem**
- `id`, `household_id`, `name`
- `category`: 'insurance' | 'utilities' | 'property' | 'vehicles' | 'medical' | 'legal' | 'financial' | 'travel' | 'education' | 'other'
- `subcategory`: string (e.g., "Home Insurance", "Passport")
- `file_url`: nullable (Supabase Storage)
- `file_type`, `file_size`
- `structured_data`: JSON (for key-value info like policy numbers, account numbers)
- `expiry_date`: nullable
- `renewal_reminder_days`: integer (default 30)
- `linked_trip_id` (nullable FK → Trip)
- `linked_child_id` (nullable FK → ChildProfile)
- `notes`
- `created_at`, `updated_at`

**EmergencyContact**
- `id`, `household_id`, `name`, `relationship`, `phone`, `email`, `notes`
- `sort_order`

#### Storage & Cost

Supabase Storage with a household-scoped bucket. RLS ensures only household members can access. Free tier: 50MB (enough for scanned docs). Pro tier: 1GB. Files are stored as-is with optional thumbnail generation for images via Supabase Edge Functions.

#### Key Screens

1. **Vault Home** — Category cards with completion indicators ("Insurance: 3/5 suggested items added")
2. **Category View** — List with expiry status badges (green = valid, amber = expiring soon, red = expired)
3. **Item Detail** — Document preview, structured data fields, expiry settings, module links
4. **Emergency Card** — Single-page summary. Export PDF. Share link. Accessible offline.

---

### Module 7: Home Maintenance

> *"Your house is trying to tell you something."*

#### The Opinionated Workflow

**Home Health Check** — A quarterly ceremony (15 minutes) where you walk through a seasonal maintenance checklist. PLOT pre-populates based on your property type and the time of year. For larger maintenance work, it becomes a **Project** (Module 2) with phases, budget tracking, and contractor management.

#### Core Concepts

| Concept | Description |
|---------|-------------|
| **Property Profile** | Property type, age, heating type, garden. Drives which maintenance templates apply. |
| **Maintenance Item** | A recurring or one-off home task. Small items are Tasks. Large items become Projects. |
| **Seasonal Checklist** | Auto-generated quarterly: Spring (gutters, garden), Summer (AC, windows), Autumn (boiler, draughts), Winter (pipes, emergency kit). |
| **Home Health Check** | The ceremony: review seasonal checklist → mark done/skipped/scheduled → create tasks or projects for outstanding items. |
| **Contractor Book** | Address book for trusted tradespeople with ratings and notes. |

#### The Project Escalation Pattern

This is where Modules 2 and 7 interconnect powerfully:

- **Small maintenance** (annual boiler service, bleed radiators) → stays as a simple **Task** with a linked seed for cost
- **Medium maintenance** (repaint bedroom, fix fence) → becomes a **Task** with subtask checklist
- **Large maintenance** (new boiler, loft conversion, kitchen remodel) → escalates to a **Project** with phases, budget tracking via Pot/Repayment, contractor assignments, and a kanban board

The user doesn't need to decide upfront. They can escalate a maintenance item to a project at any point.

#### Data Entities

**PropertyProfile**
- `id`, `household_id`
- `property_type`: 'detached' | 'semi' | 'terraced' | 'flat' | 'maisonette' | 'bungalow' | 'other'
- `ownership`: 'own' | 'rent'
- `has_garden`, `has_garage`, `has_driveway`
- `heating_type`: 'gas' | 'electric' | 'heat_pump' | 'oil' | 'other'
- `approximate_age`: 'pre_1930' | '1930_1970' | '1970_2000' | 'post_2000'
- `bedrooms`: integer
- `notes`

**MaintenanceItem**
- `id`, `household_id`, `name`
- `frequency`: 'one_off' | 'monthly' | 'quarterly' | 'biannual' | 'annual'
- `season`: 'spring' | 'summer' | 'autumn' | 'winter' | 'any'
- `last_completed_at`, `next_due_at`
- `contractor_id` (nullable FK → Contractor)
- `estimated_cost`
- `is_template` (system-provided vs user-created)
- `linked_project_id` (nullable FK → Project — when escalated)
- `linked_task_id` (nullable FK → Task — for simple items)
- `notes`

**Contractor**
- `id`, `household_id`, `name`, `trade`
- `phone`, `email`, `website`
- `notes`, `rating` (1–5 personal rating)
- `jobs_completed`: integer (auto-incremented when linked tasks are marked done)

#### Cross-Module Links

- Maintenance costs → **Seed** in Money (e.g., "Boiler service — £85")
- Large jobs → **Project** with Pot/Repayment links
- Due dates → **Calendar** events
- Outstanding items → **Tasks**
- Contractor details and receipts → **Vault**
- Post-project insurance updates → **Vault** expiry update + task

#### Key Screens

1. **Home Dashboard** — Property card, seasonal status, next due items, contractor quick-access
2. **Maintenance Schedule** — Timeline/list view filtered by season, status, urgency
3. **Quarterly Health Check** — Guided checklist. Swipe: done / skip / schedule / escalate to project.
4. **Contractor Book** — Trade-filtered address book. Tap to call/email.
5. **Project View** — When a maintenance item escalates, links directly to the Project in Module 2.

---

### Module 8: Kids (Pro Tier Only)

> *"School runs, activities, and growth — without the WhatsApp chaos."*

The most complex expansion module. Only built once the platform is mature and user demand is validated.

#### Core Concepts

| Concept | Description |
|---------|-------------|
| **Child Profile** | Name, DOB, school, year group, dietary needs, medical notes, allergies, clothing sizes. |
| **School Calendar** | Term dates, inset days, parents' evenings, sports days. Manual entry with iCal import support. |
| **Activities** | Recurring extracurriculars: football Tuesday 4pm, piano Wednesday 5pm. Auto-creates calendar events and transport tasks. |
| **Childcare Rota** | Who's doing pickup/dropoff. Linked to Calendar availability. |
| **Growth Log** | Milestones, shoe sizes, clothing sizes, height/weight. Simple records for reference. |
| **School Connector** | Future integration layer for UK school platforms. |

#### School App Integration Strategy

Most UK school platforms (Satchel/ClassCharts, Arbor, ParentMail, etc.) don't offer public APIs. The pragmatic approach:

1. **Phase 1 (Now):** Manual entry + iCal import. Most schools publish term dates as downloadable calendars. Parents manually add key dates. This covers 90% of the use case with zero integration complexity.
2. **Phase 2 (Medium-term):** Email parsing. Forward school emails to a PLOT-specific email address. Supabase Edge Function parses dates, events, and adds them to the calendar. Works with any school that sends email notifications.
3. **Phase 3 (Long-term):** Direct integrations where APIs exist. Partner with school platforms that offer developer access. ClassCharts has a limited parent API. Arbor is building an API layer. ParentMail has webhook capabilities for some schools.
4. **Phase 4 (Aspirational):** Become the "parent layer" that school apps push to. If PLOT has enough parent users, school platforms have incentive to integrate with us rather than the other way around.

#### Data Entities

**ChildProfile**
- `id`, `household_id`, `name`, `date_of_birth`
- `school_name`, `year_group`
- `dietary_requirements`: string array
- `medical_notes`, `allergies`: string array
- `nhs_number` (encrypted)
- `clothing_sizes`: JSON (`{ shirt, trousers, shoes, coat }`)
- `notes`

**ChildActivity**
- `id`, `child_id`, `household_id`, `name`
- `day_of_week`, `start_time`, `end_time`
- `location`, `cost_per_session`
- `term_dates`: JSON (start/end pairs)
- `transport_needed`: boolean
- `transport_assigned_to`: 'me' | 'partner' | 'alternating'
- `notes`

**SchoolEvent**
- `id`, `child_id`, `household_id`
- `title`, `description`
- `date`, `start_time`, `end_time`
- `event_type`: 'term_start' | 'term_end' | 'inset_day' | 'parents_evening' | 'sports_day' | 'school_trip' | 'other'
- `source`: 'manual' | 'ical_import' | 'email_parse'
- `requires_action`: boolean (e.g., consent form, costume needed)
- `action_notes`

**GrowthEntry**
- `id`, `child_id`, `household_id`
- `date`, `entry_type`: 'height' | 'weight' | 'shoe_size' | 'milestone' | 'note'
- `value`, `unit`
- `notes`

#### Cross-Module Links

- Activity costs → **Seed** in Money (e.g., "Piano lessons — £120/term")
- Activity transport → **Tasks** (auto-generated pickup/dropoff tasks)
- School events → **Calendar** (with reminders)
- School event actions → **Tasks** ("Sign consent form for school trip")
- Child documents → **Vault** (birth certificates, vaccination records, school reports)
- Holiday packing → **Packing Lists** in Module 5 with per-child lists
- Childcare rota → **Calendar** availability overlay

#### Key Screens

1. **Kids Dashboard** — Child cards with this week's schedule, upcoming events, next activity.
2. **Child Profile** — Details, sizes, medical info, linked documents. Quick-reference card.
3. **School Calendar** — Term view with colour-coded event types. iCal import button.
4. **Activities Manager** — Weekly timetable of all children's activities. Cost summary. Transport assignments.
5. **Childcare Rota** — Weekly grid: who's doing pickup/dropoff for each child, each day.
6. **Growth Log** — Timeline of entries. Simple charts for height/weight over time.

---

## Ceremony Summary

PLOT's ceremonies are its soul. Every module either has its own ceremony or participates in an existing one:

| Ceremony | Frequency | Modules Involved | Duration | Description |
|----------|-----------|------------------|----------|-------------|
| **Payday Ritual** | Monthly (payday) | Money | 15 min | Review allocations, check off bills, confirm cycle |
| **Weekly Reset** | Weekly (configurable) | Tasks, Calendar, Meals, Kids | 10 min | Divvy tasks, review calendar, plan meals, check school week |
| **Quarterly Health Check** | Quarterly | Home Maintenance | 15 min | Walk through seasonal checklist, schedule work |
| **Trip Planning Session** | Per trip | Holidays, Vault, Calendar, Money | 20 min | Build itinerary, set budget, assign pre-trip tasks |
| **Annual Review** | Yearly (January) | All modules | 30 min | Year in review: financial progress, task fairness, goals |

The **Annual Review** is a future capstone ceremony: a guided walkthrough of the year's financial progress, task fairness trends, home maintenance completion, trip memories, and goals for next year. It's the ceremony that ties all modules together and reinforces the "operating system" positioning.

---

## Development Phases

### Phase 0: Platform Foundation (4–6 weeks)

Before adding new modules, upgrade the existing codebase to support the module system.

**Deliverables:**

1. **Notification Engine** — Database table for notifications. In-app bell (web). Push notifications (Expo). Email digest (Resend). Each module writes notifications through a shared `createNotification()` server action in `packages/logic`.
2. **Activity Feed** — Database table for household activity. "Adam marked Rent as paid." Dashboard widget + dedicated feed screen.
3. **Module Navigation** — Bottom tab bar (mobile, 4 tabs + "more" overflow). Sidebar (web) with module icons. Each module registers its nav entry through a config in `packages/logic`.
4. **Global Search** — Search across all modules. Powered by Supabase full-text search (tsvector). Results grouped by module.
5. **Subscription Tier Gating** — Polar.sh integration. Free tier = Money + Tasks (limited). Pro = all modules. Gate at module level.
6. **Shared Logic Patterns** — Establish the patterns for cross-module linking, entity references, and auto-event/auto-task generation that all future modules will use.

**Database additions:**

```sql
-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  source_module TEXT NOT NULL,
  source_entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  push_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Feed
CREATE TABLE public.activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  source_module TEXT NOT NULL,
  source_entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on both tables following household_id pattern
```

---

### Phase 1: Tasks, Chores & Projects Module (5–6 weeks)

The most natural expansion from Money. It uses the same "ritual" pattern (Weekly Reset mirrors Payday Ritual) and the same "fairness" concept (split ratio → fairness score). The Project entity establishes the pattern reused by Holidays and Home Maintenance.

**Week 1–2:** Data models for Project, Phase, Task, Routine. Zod schemas in `packages/logic`. Server actions for CRUD. Recurrence engine (generates tasks from routines).

**Week 3–4:** Task views — "My Tasks" list, Kanban board with drag-and-drop (web: @dnd-kit, mobile: react-native-gesture-handler). Routine Manager. Mark complete/skip flows.

**Week 4–5:** Project detail screen with phase timeline. Budget tracker linking to Pot/Repayment. Cross-module link: seeds → tasks.

**Week 5–6:** Weekly Reset ceremony. Fairness Score calculation. Activity feed integration. Notifications for due tasks. Polish and testing.

---

### Phase 2: Shared Calendar Module (4–5 weeks)

Depends on Phase 1 (task due dates) and Phase 0 (notification engine for reminders).

**Week 1–2:** Event data model. CRUD. Recurrence (iCal RRULE parsing via `rrule` library). Auto-event generation from Money (payday) and Tasks (due dates).

**Week 3:** Calendar UI — month, week, day views. Mobile: react-native-calendars or custom. Web: custom with Tailwind grid.

**Week 4:** Weekly Lookahead integration into Weekly Reset. Dashboard widget. Availability overlay.

**Week 5:** Google Calendar two-way sync via API (Pro tier). Apple Calendar export via .ics download.

---

### Phase 3: Meals & Groceries Module (5–6 weeks)

Depends on Phase 1 (auto-creates shopping task) and Phase 2 (meal prep calendar events).

**Week 1–2:** Recipe and MealPlanEntry data models. Recipe CRUD with ingredient management.

**Week 3:** Meal Planner week grid UI. Tap-to-assign on mobile. Drag-and-drop on web.

**Week 4:** Grocery List auto-generation with ingredient aggregation. Supabase Realtime for live sync between partners. Offline support via Expo's AsyncStorage.

**Week 5:** Meal Ritual ceremony. Cross-module links: tasks (shopping), calendar (prep), money (grocery seed).

**Week 6:** Recipe import from URL (schema.org Recipe parsing). Pro tier feature.

---

### Phase 4: Holidays & Trip Planning Module (5–6 weeks)

Depends on Phase 1 (projects for pre-trip tasks), Phase 2 (calendar for trip dates), Phase 6 (vault for documents). Note: if Vault isn't built yet, Trip Vault features can be deferred.

**Week 1–2:** Trip, ItineraryEntry, TripBudgetItem, PackingItem data models. Trip creation flow that auto-creates a linked Pot and Project.

**Week 3:** Itinerary builder — day-by-day timeline with time slots. Trip budget tracker with category breakdown.

**Week 4:** Packing lists with templates and per-person tabs. Offline support for in-trip use.

**Week 5:** GetYourGuide affiliate integration (Phase 1: deep-link to search). Trip Vault filtered view.

**Week 6:** Polish. Trip Dashboard with countdown, budget progress, next action. Calendar integration for all trip dates and payment deadlines.

---

### Phase 5: Vault Module (3–4 weeks)

Lower complexity but high retention value. Needed by Holidays (trip documents) and Kids (school documents).

**Week 1–2:** VaultItem and EmergencyContact data models. Supabase Storage bucket with RLS. File upload with preview. Category system with suggested items. Mobile: camera capture for scanning documents.

**Week 3:** Expiry tracking and renewal reminders via notification engine. Cross-module links: calendar events for renewals, tasks for action items.

**Week 4:** Emergency Card generator (PDF via server-side rendering). Shareable link with time-limited token. Vault completion score per category.

---

### Phase 6: Home Maintenance Module (3–4 weeks)

Depends on Phase 1 (tasks + projects), Phase 2 (calendar), Phase 5 (vault for contractor docs).

**Week 1:** PropertyProfile setup flow. MaintenanceItem and Contractor data models. Seasonal template library (UK-specific: boiler service, gutter cleaning, etc.).

**Week 2:** Maintenance schedule UI. Contractor book. Escalation flow: maintenance item → project.

**Week 3:** Quarterly Health Check ceremony. Auto-generates tasks and calendar events. Cross-module links to Money (costs → seeds), Vault (receipts, warranties).

**Week 4:** Polish. Home Dashboard with seasonal status indicators and next-due items.

---

### Phase 7: Kids Module (5–6 weeks) — Pro Tier Only

The most complex module. Only built once platform is mature and demand is validated.

**Week 1–2:** ChildProfile, ChildActivity, SchoolEvent data models. Profile setup flow. Activity manager with recurring schedule.

**Week 3:** School calendar with manual entry and iCal import. School event → calendar sync. Action items from school events → tasks.

**Week 4:** Childcare rota UI with calendar availability integration. Transport task auto-generation for activities.

**Week 5:** Growth log. Dashboard "Kids" summary card. Per-child vault section for documents.

**Week 6:** Email parsing for school notifications (Supabase Edge Function). Polish and testing.

---

## Subscription Model

| Feature | Free | Pro (£4.99/mo) |
|---------|------|-----------------|
| Money Module | Full | Full |
| Tasks Module | 10 routines, 2 projects max | Unlimited |
| Calendar Module | View only, no sync | Full + Google/Apple sync |
| Meals Module | — | Full |
| Holidays Module | — | Full |
| Vault Module | 5 items, no file upload | Unlimited + 1GB storage |
| Home Module | — | Full |
| Kids Module | — | Full |
| Activity Feed | Last 7 days | Full history |
| Global Search | Basic | Full cross-module search |
| Household members | 2 (couple) | 2 + future family plan |

**Pricing philosophy:** Money is free forever. It's the hook. Tasks are free-with-limits to demonstrate the module pattern. Everything else is Pro. This mirrors Linear's generous free tier that gets teams hooked before they pay.

---

## Technical Considerations

### Shared Logic Layer (`packages/logic`)

Every calculation, validation, and business rule lives here. Both Next.js and Expo import from the same package. This means:

- Zod schemas validate on both platforms
- Date calculations (pay cycles, recurrence) run on both platforms
- Cross-module linking logic is centralised
- Zustand stores work on both (zustand is platform-agnostic)

### Database Growth

Each module adds 2–6 tables. Total projected schema at full build: ~35 tables. Well within Supabase free/pro tier. RLS on every table following the `household_id` pattern.

### Supabase Realtime

Enable selectively to manage connection costs. Critical for: grocery list sync (two partners shopping simultaneously), task board updates, activity feed. Use Supabase channels scoped to `household_id`.

### Offline Support (Mobile)

Priority offline features via Expo's AsyncStorage + a sync queue:

1. Grocery list (check items while shopping with no signal)
2. Packing list (check items while travelling)
3. Emergency card (accessible without internet)
4. Task completion (mark done, sync when back online)

### Performance Budget

Each module lazy-loads on both platforms. Next.js: dynamic imports and route-level code splitting. Expo: lazy screens in the navigation stack. The Money module loads instantly. Other modules load on first navigation.

---

## Competitive Positioning

| Competitor | What they do | Why PLOT wins |
|------------|-------------|---------------|
| **FamilyWall** | Calendar, lists, locations | Feature list, not a product. No financial module. No opinionated workflows. |
| **Cozi** | Family calendar + lists | Calendar-first, everything else is an afterthought. US-focused. Dated design. |
| **OurHome** | Chore management + rewards | Gamified for families with kids. No finance. Infantilising for adult couples. |
| **Splitwise** | Expense splitting | Tracks spending after the fact. Doesn't help you plan. |
| **YNAB** | Budget management | Powerful but complex. Individual-focused. No household operations. |
| **Notion** | Everything tool | Infinitely flexible but requires setup. No household-specific opinions. |
| **PLOT** | Household operating system | Opinionated ceremonies. Beautiful mobile-first design. Modules that interconnect. Built for relationships, not individuals. Linear's focus meets Notion's breadth, for the household. |

---

## Build Timeline Summary

| Phase | Module | Duration | Running Total |
|-------|--------|----------|---------------|
| Current | Complete Money module | In progress | — |
| 0 | Platform Foundation | 4–6 weeks | ~6 weeks |
| 1 | Tasks, Chores & Projects | 5–6 weeks | ~12 weeks |
| 2 | Shared Calendar | 4–5 weeks | ~17 weeks |
| 3 | Meals & Groceries | 5–6 weeks | ~23 weeks |
| 4 | Holidays & Trip Planning | 5–6 weeks | ~29 weeks |
| 5 | Vault (Documents) | 3–4 weeks | ~33 weeks |
| 6 | Home Maintenance | 3–4 weeks | ~37 weeks |
| 7 | Kids | 5–6 weeks | ~43 weeks |

**Total estimated build: ~10–11 months from start of Phase 0.**

Build order rationale: Tasks first (reuses ritual pattern). Calendar second (Tasks needs it). Meals third (strongest cross-module flywheel). Holidays fourth (uses Projects + Calendar + Vault concepts, high excitement factor for users). Vault fifth (utility module needed by Holidays and Kids). Home sixth (depends on Tasks + Projects + Vault). Kids last (most complex, needs all other modules mature).

---

*End of Roadmap — Version 2.0*
