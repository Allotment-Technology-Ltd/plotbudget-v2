# Regression Test Pack: Tasks & Calendar (Phase 1 & 2)

This pack covers all new functionality delivered in **Phase 1 (Tasks, Projects, Weekly Reset)** and **Phase 2 (Calendar)**. Use for manual regression, release sign-off, or as the specification for automated E2E/API tests.

---

## 1. Prerequisites

| Item | Requirement |
|------|-------------|
| **Environment** | Web app running (`pnpm dev` in `apps/web`). Supabase migrations applied (`supabase db push` or equivalent). |
| **Auth** | Test user with a **household** (no redirect to onboarding). E2E: use a user prepared by global-setup (e.g. `dashboard@plotbudget.test`). |
| **Data** | Optional: 1+ routine, 1+ project with phases for full flows. Empty state is valid for smoke. |

---

## 2. Phase 1 — Tasks Module

### 2.1 Navigation & access

| ID | Test | Steps | Expected | Priority |
|----|------|--------|----------|----------|
| T-Nav-1 | Tasks reachable from launcher | 1. Go to `/dashboard`. 2. Click Tasks tile (or link to `/dashboard/tasks`). | URL is `/dashboard/tasks`. Page shows "Tasks" heading, view toggle (List / Kanban), "Add task" button. | Smoke |
| T-Nav-2 | Unauthenticated redirect | 1. Log out or use incognito. 2. Open `/dashboard/tasks`. | Redirect to login. | Smoke |
| T-Nav-3 | No household redirect | 1. Use user with no household. 2. Open `/dashboard/tasks`. | Redirect to onboarding (or appropriate gate). | Full |
| T-Nav-4 | Module top bar on Tasks | 1. From launcher go to Tasks. 2. Check header. | Top bar shows: PLOT, Tasks \| Projects \| Weekly reset, notifications, user menu. | Full |

### 2.2 Tasks list view

| ID | Test | Steps | Expected | Priority |
|----|------|--------|----------|----------|
| T-List-1 | List view loads | 1. Open `/dashboard/tasks`. 2. Ensure "List" is selected. | Sections visible: Overdue, Today, This week, Later; Done collapsible. Tasks (if any) appear in correct section. | Smoke |
| T-List-2 | Empty state | 1. Open Tasks with no tasks. | No errors. Message or empty sections (e.g. "No tasks" or empty lists). | Smoke |
| T-List-3 | Complete task from list | 1. Have ≥1 non-done task. 2. Click checkbox on a task card. | Task moves to Done section (or checkbox checked, list updates). No console errors. | Smoke |
| T-List-4 | Due date grouping | 1. Create tasks: one overdue, one today, one this week, one later. | Each appears under correct heading (Overdue, Today, This week, Later). | Full |

### 2.3 Tasks kanban view

| ID | Test | Steps | Expected | Priority |
|----|------|--------|----------|----------|
| T-Kanban-1 | Kanban view loads | 1. Open `/dashboard/tasks`. 2. Click "Kanban". | Four columns: Backlog, To do, In progress, Done. Cards show task name, assignee, due date, priority. | Smoke |
| T-Kanban-2 | Drag task between columns | 1. In Kanban, drag a task to another column. | Task appears in new column; state persists after refresh. | Smoke |
| T-Kanban-3 | Kanban ↔ List consistency | 1. Note a task’s status in List. 2. Switch to Kanban. | Task appears in the column matching its status. | Full |

### 2.4 Create task

| ID | Test | Steps | Expected | Priority |
|----|------|--------|----------|----------|
| T-Create-1 | Open create dialog | 1. On Tasks page click "Add task". | Modal opens: "Add task", fields: Name, Description, Assigned, Priority, Due date, Project (if any). | Smoke |
| T-Create-2 | Create task (minimal) | 1. Open Add task. 2. Enter name only. 3. Submit. | Task created; dialog closes; new task appears in list/kanban. | Smoke |
| T-Create-3 | Create task (full) | 1. Open Add task. 2. Fill name, description, assignee, priority, due date, project (if available). 3. Submit. | Task created with all set; visible in list/kanban with correct metadata. | Full |
| T-Create-4 | Validation | 1. Open Add task. 2. Leave name empty and submit. | Validation error (e.g. name required); no API error. | Full |
| T-Create-5 | Cancel | 1. Open Add task. 2. Click Cancel or close. | Dialog closes; no new task. | Full |

### 2.5 Projects list & detail

| ID | Test | Steps | Expected | Priority |
|----|------|--------|----------|----------|
| T-Proj-1 | Projects list loads | 1. From Tasks top bar click "Projects" or go to `/dashboard/tasks/projects`. | Page "Projects"; grid of project cards (or empty state). Each card: name, status badge, "Budget linked" if linked. | Smoke |
| T-Proj-2 | Back to Tasks | 1. On Projects click "Back to Tasks". | Navigate to `/dashboard/tasks`. | Full |
| T-Proj-3 | Open project detail | 1. Click a project card. | URL `/dashboard/tasks/projects/[id]`. Cover/title, status, progress bar, Budget section (if linked), Phases list. | Smoke |
| T-Proj-4 | Add phase | 1. On project detail click "Add phase". 2. Enter name, submit. | New phase appears in timeline. | Smoke |
| T-Proj-5 | Add task to phase | 1. Expand a phase. 2. Click "Add task". 3. Enter name, submit. | Task appears under that phase; task has phase_id. | Smoke |
| T-Proj-6 | Complete task on project | 1. On project detail, check complete on a phase task. | Task marked done (e.g. checkbox); list updates. | Full |
| T-Proj-7 | Budget links | 1. Open project with linked pot/repayment. | Budget section shows link(s) to Blueprint. | Full |

### 2.6 Weekly reset ceremony

| ID | Test | Steps | Expected | Priority |
|----|------|--------|----------|----------|
| T-Reset-1 | Weekly reset page loads | 1. Go to `/dashboard/tasks/weekly-reset`. | Full-screen view (no sidebar/bottom nav). Progress dots (5). Step 1: greeting with name, "Let's go" button. | Smoke |
| T-Reset-2 | Exit | 1. On weekly reset click X (top right). | Navigate to `/dashboard/tasks` (or previous). | Smoke |
| T-Reset-3 | Step 1 → 2 | 1. Click "Let's go". | Step 2: "Review auto-generated tasks" (list or "No routine tasks"). Next button. | Smoke |
| T-Reset-4 | Step 2 → 3 | 1. From step 2 click Next. | Step 3: "Claim & swap" (unassigned tasks with Me/Partner buttons). | Full |
| T-Reset-5 | Assign on step 3 | 1. On step 3 click "Me" or "Partner" on an unassigned task. | Task assignment updates (or list refreshes). | Full |
| T-Reset-6 | Step 3 → 4 → 5 | 1. Next through steps 4 (Upcoming deadlines) and 5. | Step 5: "All sorted", summary stats, confetti, "Back to Home" button. | Smoke |
| T-Reset-7 | Back to Home | 1. On step 5 click "Back to Home". | Navigate to `/dashboard`. | Full |

---

## 3. Phase 2 — Calendar Module

### 3.1 Navigation & access

| ID | Test | Steps | Expected | Priority |
|----|------|--------|----------|----------|
| C-Nav-1 | Calendar reachable from launcher | 1. Go to `/dashboard`. 2. Click Calendar tile. | URL `/dashboard/calendar`. Page shows "Calendar", view toggle, date nav. | Smoke |
| C-Nav-2 | Unauthenticated redirect | 1. Log out. 2. Open `/dashboard/calendar`. | Redirect to login. | Smoke |
| C-Nav-3 | Module top bar on Calendar | 1. From launcher go to Calendar. | Top bar shows PLOT, Calendar (current), notifications, user menu. | Full |

### 3.2 Calendar views

| ID | Test | Steps | Expected | Priority |
|----|------|--------|----------|----------|
| C-View-1 | Month view default | 1. Open `/dashboard/calendar`. | Month grid for current month; week starts Monday; day cells; current day highlighted. | Smoke |
| C-View-2 | Week view | 1. Select "Week". | Week view: one card per day (Mon–Sun) with events listed. | Smoke |
| C-View-3 | Day view | 1. Select "Day". | Single day: list of events with time (or "All day"). | Smoke |
| C-View-4 | Prev / Next month | 1. In month view click Prev then Next. | Month caption and grid update. | Smoke |
| C-View-5 | Today button | 1. Change month. 2. Click "Today". | View returns to current month/week/day. | Full |
| C-View-6 | Month view: click day | 1. In month view click a day cell. | Cursor moves to that day (e.g. week/day view shows that day, or month stays but selection). | Full |

### 3.3 Events (if create/edit UI exists)

| ID | Test | Steps | Expected | Priority |
|----|------|--------|----------|----------|
| C-Event-1 | Events in range | 1. Create event via API or future UI. 2. Open calendar for that range. | Event appears in correct day(s) in month/week/day. | Smoke |
| C-Event-2 | Recurring event | 1. Create event with recurrence_rule (e.g. weekly). 2. Open month view. | Multiple occurrences in grid. | Full |

---

## 4. API regression (optional)

Use for API-only or Vitest regression.

### 4.1 Tasks API

| ID | Endpoint | Method | Auth | Expected |
|----|----------|--------|------|----------|
| API-T-1 | `/api/tasks` | GET | Yes | 200, array of tasks (or empty). |
| API-T-2 | `/api/tasks` | POST | Yes | 201, body with createTaskSchema. |
| API-T-3 | `/api/tasks/[id]` | GET | Yes | 200, single task. |
| API-T-4 | `/api/tasks/[id]` | PATCH | Yes | 200, updated task. |
| API-T-5 | `/api/tasks/[id]/complete` | PATCH | Yes | 200, task with status done, completed_at set. |
| API-T-6 | `/api/projects` | GET | Yes | 200, array of projects. |
| API-T-7 | `/api/projects/[id]` | GET | Yes | 200, project with phases and tasks. |
| API-T-8 | `/api/projects/[id]/phases` | POST | Yes | 201, new phase. |
| API-T-9 | `/api/routines` | GET | Yes | 200, array of routines. |
| API-T-10 | `/api/routines/generate` | POST | Yes | 200, `{ count, taskIds }`. |

### 4.2 Calendar API

| ID | Endpoint | Method | Auth | Expected |
|----|----------|--------|------|----------|
| API-C-1 | `/api/events?start=...&end=...` | GET | Yes | 200, array of events in range. |
| API-C-2 | `/api/events` | POST | Yes | 201, event with createEventSchema. |
| API-C-3 | `/api/events/[id]` | GET/PATCH/DELETE | Yes | 200/204 as appropriate. |

---

## 5. Smoke vs full regression

- **Smoke (pre-merge / quick check):** T-Nav-1, T-List-1, T-List-2, T-List-3, T-Kanban-1, T-Kanban-2, T-Create-1, T-Create-2, T-Proj-1, T-Proj-3, T-Proj-4, T-Proj-5, T-Reset-1, T-Reset-2, T-Reset-3, T-Reset-6, T-Reset-7, C-Nav-1, C-View-1, C-View-2, C-View-3, C-View-4.
- **Full regression (release):** All tables above; include validation, edge cases, and API checks.

---

## 6. Automated E2E (Playwright)

- Spec file: `apps/web/tests/specs/tasks-calendar.spec.ts`.
- Run: `pnpm test:e2e -- tasks-calendar` (from `apps/web`).
- Uses `TEST_USERS.dashboard` and `ensureBlueprintReady`; requires migrations and global-setup so user has a household.

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-02 | Initial pack: Phase 1 (Tasks, Projects, Weekly Reset) and Phase 2 (Calendar). |
