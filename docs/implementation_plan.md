# USGA GHIN Handicap Index Calculator – Implementation Plan

## Overview
This document translates the project specification into a detailed, actionable implementation plan for a React SPA with Material Design components that calculates and displays a user’s USGA GHIN handicap index. The app operates in guest mode only, with all data stored locally.

---

## Architecture and Tech Choices
- **Framework**: React with TypeScript, built with Vite.
- **UI**: Material UI (MUI v5) for Material Design components.
- **Routing**: React Router v6.
- **State & Data**:
  - Local persistence: IndexedDB via Dexie (preferred over localStorage for structured data and indexing).
  - Server data fetching/caching: React Query (TanStack Query).
  - Lightweight global UI state (snackbars/theme): Zustand or React Context.
- **Validation**: React Hook Form + Zod.
- **Tooling**: ESLint + Prettier, Vitest/Jest + Testing Library, Playwright/Cypress for E2E.

---

## App Structure
```
src/
  app/
    App.tsx
    routes.tsx
    theme.ts
    providers.tsx            // QueryClientProvider, ThemeProvider, etc.
  components/
    common/                  // Button, Dialogs, ConfirmDelete, Snackbar, EmptyState
    score/                   // ScoreForm, ScoreTable, ScoreEditDialog
    course/                  // CourseAutocomplete, TeeSelect, CourseEditDialog, CourseList
    calc/                    // HandicapSummary, DifferentialList
  features/
    scores/
      scores.api.ts         // React Query hooks (if any remote ops later)
      scores.db.ts          // Dexie schema + CRUD
      scores.model.ts       // Types
      scores.utils.ts       // sort, validate, transforms, date helpers
    courses/
      courses.api.ts        // External API adapter
      courses.db.ts         // Dexie schema + CRUD
      courses.model.ts      // Types
      courses.service.ts    // Merge local + remote sources, de-dup, priorities
    handicap/
      calc.engine.ts        // Pure functions: differential, pairing, selection
      calc.rules.ts         // Rule table for 3–20 scores
      calc.tests.ts         // Unit tests
  pages/
    Dashboard.tsx
    NewScore.tsx
    EditScore.tsx
    ManageCourses.tsx
    Settings.tsx            // optional
  lib/
    idb.ts                  // Dexie init
    format.ts               // date & number formatting helpers
    migration.ts            // DB schema migration (future)
  types/
    index.ts
```

---

## Data Models (TypeScript)
```ts
export type HoleCount = 9 | 18;

export interface Score {
  id: string;
  date: string;               // ISO YYYY-MM-DD
  courseId?: string;          // references local Course when saved
  courseName: string;         // denormalized for quick display
  teeId?: string;
  teeName?: string;
  courseRating: number;       // editable
  slopeRating: number;        // editable
  grossScore: number;
  holes: HoleCount;
  differential?: number;      // cached, 1 decimal; recomputed on edits
}

export interface Course {
  id: string;                 // local UUID or external API ID namespaced
  name: string;
  city?: string;
  state?: string;
  country?: string;
  source: 'api' | 'user';
  tees: Tee[];                // may be lazily hydrated
  updatedAt: string;
}

export interface Tee {
  id: string;
  courseId: string;
  name: string;               // e.g., "Blue"
  courseRating: number;
  slopeRating: number;
  gender?: 'M' | 'F' | 'U';
  holes: HoleCount;
  source: 'api' | 'user';
}

export interface HandicapBreakdown {
  usedDifferentials: Array<{ scoreId: string; differential: number; date: string }>;
  ruleApplied: { scoresCount: number; usedCount: number; multiplier?: number };
  average: number;            // raw average before multiplier & rounding
  index: number;              // final result rounded per rules
  message?: string;           // e.g., insufficient scores
}
```

---

## IndexedDB Schema (Dexie)
Tables and indexes:
```ts
db.version(1).stores({
  scores: 'id, date',
  courses: 'id, name',
  tees: 'id, courseId',
  preferences: 'key',
});
```

- `scores`: indexed by `date` for sorting; contains all saved score entries.
- `courses`: cached local and user-created courses.
- `tees`: tees for courses, allows separate updates and references.
- `preferences`: for favorites, recents (LRU), and UI settings.

---

## External Course API Integration
Define a provider abstraction to allow swapping APIs without touching UI:
```ts
export interface CourseProvider {
  searchCourses(query: string): Promise<Course[]>;
  listTees(courseId: string): Promise<Tee[]>;
}
```

Implementation strategy:
- Create `PublicCourseApiProvider` that maps remote schema → local `Course`/`Tee`.
- In `courses.service.ts`:
  - First return locally saved favorites and most-recent courses (ranked and sectioned).
  - Then query the external API; merge with local items, de-duplicate by normalized name + location.
  - When a course is selected, load tees. If not cached, fetch from API; allow user to add/edit tees inline.
  - Support manual add flow for courses/tees; persist as `source: 'user'`.

Caching:
- Cache course/tee API results in IndexedDB with a TTL (e.g., 7 days).
- Prefer local overrides when present (user-edited values take precedence).

---

## Handicap Calculation Engine
Functions (pure, testable) in `calc.engine.ts`:
- `computeDifferential(score: Score): number`
  - 18 holes: `((grossScore - courseRating) * 113) / slopeRating`, round to 1 decimal.
  - 9 holes: compute and store as 9-hole differential; not directly counted until paired.
- `pairNineHoleDifferentials(scores: Score[]): Array<{ combinedId: string; differential: number; scoreIds: string[]; dates: string[] }>`
  - Pair most recent unmatched 9-hole scores in chronological order to create an 18-hole equivalent differential.
  - Persist pairing metadata or compute on the fly; prefer computing on the fly to avoid data coupling, but store pairing indicators for UX.
- `selectUsedDifferentials(differentials: Array<{ scoreId: string; differential: number; date: string }>): HandicapBreakdown`
  - Apply USGA-like rules per count of available 18-hole-equivalent differentials.
  - For < 3 scores: return breakdown with `message: "At least 3 scores required before receiving a handicap index"`.
  - For 3–20 scores: choose the lowest X differentials and apply multiplier 0.96.
  - For > 20 scores: use the 20 most recent and choose the lowest 10; apply 0.96.
  - Round final index to 1 decimal.

Rule table in `calc.rules.ts` (example):
```ts
export const RULES = [
  { min: 3, max: 3, use: 1, multiplier: 0.96 },
  { min: 4, max: 4, use: 1, multiplier: 0.96 },
  { min: 5, max: 5, use: 1, multiplier: 0.96 },
  { min: 6, max: 6, use: 2, multiplier: 0.96 },
  { min: 7, max: 8, use: 2, multiplier: 0.96 },
  { min: 9, max: 10, use: 3, multiplier: 0.96 },
  { min: 11, max: 12, use: 4, multiplier: 0.96 },
  { min: 13, max: 14, use: 5, multiplier: 0.96 },
  { min: 15, max: 16, use: 6, multiplier: 0.96 },
  { min: 17, max: 17, use: 7, multiplier: 0.96 },
  { min: 18, max: 18, use: 8, multiplier: 0.96 },
  { min: 19, max: 19, use: 9, multiplier: 0.96 },
  { min: 20, max: Infinity, use: 10, multiplier: 0.96 },
];
```

Display details:
- Show the list of differentials, highlight which were used.
- Show the rule applied: "Average of lowest X differentials × 0.96" and the final index.
- If insufficient scores: show the required message and the entered scores.

---

## UI Flows and Screens
### Dashboard (`/`)
- `HandicapSummary`: current index or insufficient-scores message; expandable details with used differentials and rule.
- `ScoreTable`: columns Date, Course, Score, Differential, actions (Edit, Delete). Sorted by date (desc). Delete-all button.

### New Score (`/scores/new`)
- `ScoreForm`:
  - DatePicker (<= today)
  - `CourseAutocomplete`: sections for "Recent & Saved" then "Search results"; fallback to Add Course dialog.
  - `TeeSelect`: loads tees for selected course; supports Add/Edit Tee inline. Auto-populates rating/slope; allow override with a toggle.
  - Holes: 9 or 18 (RadioGroup)
  - Gross score: numeric
  - Live differential preview (updates as inputs change)
  - Submit: persist score; recalc index; navigate to Dashboard with success toast.

### Edit Score (`/scores/:id/edit`)
- Same form as new score, pre-filled. On save, recompute differential and update Dashboard.

### Manage Courses (`/courses`)
- List saved courses (from local DB).
- Expand to show tees; inline edit/delete for courses and tees.
- Ability to search API and "Save to My Courses".

### Settings (optional)
- Theme (light/dark), default hole count, recent-items limit.

---

## Components and Responsibilities
- `CourseAutocomplete`: MUI `Autocomplete` with async search and grouped options; debounced queries; "Add course" CTA when not found.
- `TeeSelect`: MUI `Select`; loads tees by course; allows add/edit tee; rating/slope auto-populate and are editable.
- `ScoreForm`: React Hook Form + Zod, controlled inputs, validation, live preview.
- `ScoreTable`: MUI `Table` or `DataGrid`; serverless sorting by date; action column for edit/delete; delete-all button.
- `ScoreEditDialog`: Wraps `ScoreForm` for editing.
- `HandicapSummary`: displays index, rule, and used differentials with highlighting and details.
- `DifferentialList`: compact list/chips of all differentials.

---

## Validation and UX Details
- Required fields: date, course, tee (or rating/slope), gross score, holes.
- Ranges: slope 55–155, rating 60–80, gross 20–200 (tunable), date not in future.
- Numeric inputs with step, min/max, helper text, and immediate validation feedback.
- Confirm destructive actions with a dialog.
- Snackbar toasts for success/error.
- Accessibility: labels, roles, keyboard-friendly, color contrast.

---

## Data and Caching Strategy
- Maintain recents via `preferences` (LRU of last N courses/tees).
- De-duplicate courses by normalized name + location.
- Cache API results in IndexedDB with TTL; include `source: 'api' | 'user'` for each entity.
- When user edits tee rating/slope in the form, prompt: "Save these values for future use?" If yes, persist as a user tee override and prefer it on selection.

---

## Error Handling
- API failures: show retry and allow manual add; log minimal error detail.
- DB failures: guard Dexie init; provide in-memory fallback with warning toast.
- Validation: inline field errors; disable submit until valid.

---

## Theming and Layout
- MUI custom theme with primary/secondary palette; typography scale.
- Light/dark toggle (persisted in `preferences`).
- Responsive design: mobile-first layouts, sticky form actions on small screens, scrollable table.

---

## Testing Strategy
- Unit tests
  - `calc.engine.ts`: differential math, rounding, 9-hole pairing, rule selection.
  - `courses.service.ts`: merging, de-duplication, precedence of local overrides.
- Component tests (Testing Library)
  - `ScoreForm`: validation, live differential preview, submit behavior.
  - `CourseAutocomplete`: prioritization of saved/recents, API search, add course.
  - `ScoreTable`: sorting, edit, delete, delete-all.
- E2E (Playwright or Cypress)
  - Enter three scores and verify index and used differentials.
  - Edit a score and verify recalculation and UI update.
  - Add custom course/tee and verify persistence and autocomplete priority.
  - Delete all and verify empty state and summary message.

---

## Build & Deployment
- Vite build with env variables for API base URL (e.g., `VITE_COURSE_API_URL`).
- Optional PWA: service worker for offline app shell and IndexedDB for data.
- Deploy to Netlify, Vercel, or GitHub Pages. Add CI for build + tests.

---

## Analytics and Privacy
- No analytics for MVP (anonymous usage). Consider opt-in lightweight analytics later with respect for privacy.

---

## Performance Considerations
- Debounce API search (300–500ms) with cancelation on rapid changes.
- Code-splitting by route; prefetch likely routes.
- Virtualized table if many rows (switch to MUI DataGrid if needed).

---

## Accessibility and i18n
- Use MUI components with proper labeling.
- Announce snackbar messages to screen readers (ARIA live regions).
- Prepare strings for future i18n (e.g., react-intl) if needed.

---

## Milestones and Timeline (Estimate)
- M1: Project setup, theming, routing scaffold, Dexie init (1–2 days)
- M2: Courses module: autocomplete, API provider, local save/edit (3–4 days)
- M3: Score Form: live differential calc, save, validations (3–4 days)
- M4: Handicap engine: 9-hole pairing, rule application, summary UI (3–4 days)
- M5: Dashboard table: edit/delete/delete-all; sorting; details (2–3 days)
- M6: Testing coverage; accessibility pass; polish (3–4 days)
- M7: Build, deploy, documentation (1–2 days)

---

## Risks and Mitigations
- External API variability: abstract with `CourseProvider`; prioritize local overrides; provide manual add/edit.
- 9-hole handling complexity: implement clear pairing logic and visualize pairing status in the breakdown.
- Data integrity on edits: always recompute differential on save; maintain raw values and recompute derived fields.

---

## Implementation Notes and Edge Cases
- Date handling: store dates as `YYYY-MM-DD` (UTC) to avoid timezone drift; sort using date string.
- Rounding: differentials to 1 decimal; final handicap index to 1 decimal. Keep full precision internally until final rounding.
- Mixing 9 and 18 holes: only 18-hole-equivalent differentials count. Pair two 9-hole scores chronologically; show pairing in the UI (e.g., "Paired with round on 2024-06-12").
- Editing tees during score entry: if overridden values differ from API, allow save-as-override for future use.
- Delete all: confirm with explicit irreversible warning; provide undo window optionally via in-memory snapshot for the session.

---

## MVP Acceptance Mapping
- Users can enter, edit, and delete scores with required fields.
- Course/tee search via API; manual add/edit with persistence; prioritization of saved/recents.
- Handicap index calculated per rules, displaying used differentials and calculation details; message for < 3 scores.
- All data stored locally and persists across sessions.
- UI is intuitive, responsive, and accessible, using MUI components.



---

## Actionable Implementation Steps

1. Initial project setup
   - Create project with Vite + React + TypeScript
   - Add ESLint (typescript, react, react-hooks), Prettier, lint-staged + husky (pre-commit)
   - Add libraries: MUI v5, React Router, TanStack Query, Dexie, React Hook Form, Zod, Zustand (or Context), date-fns
   - Add testing: Vitest, @testing-library/react, @testing-library/user-event, jsdom; E2E scaffolding (Playwright/Cypress)
   - Add scripts: test, test:watch, lint, format, format:check, typecheck, build, preview
   - Definition of Done (DoD): All scripts work; sample test passes; lint/format pass

2. App shell, providers, routing, theming
   - Create `App.tsx`, `routes.tsx`, `theme.ts`, `providers.tsx` (ThemeProvider, CssBaseline, QueryClientProvider, Router)
   - Add base pages: `Dashboard`, `NewScore`, `ManageCourses` placeholders
   - Snapshot tests for App rendering and route switching
   - DoD: App renders, routes load, tests + lint/format pass

3. IndexedDB (Dexie) and types
   - Define models: `Score`, `Course`, `Tee`, `HandicapBreakdown`
   - Initialize Dexie in `lib/idb.ts` with stores: scores, courses, tees, preferences
   - Implement CRUD helpers for each table with unit tests (in-memory Dexie)
   - DoD: DB init and CRUD unit tests pass; lint/format pass

4. Handicap calculation engine
   - Implement `calc.engine.ts`: computeDifferential, pairNineHoleDifferentials, selectUsedDifferentials
   - Implement `calc.rules.ts` (3–20 rules and ≥20 case with 0.96 multiplier)
   - Unit tests covering rounding, edge cases (<3 scores message), 9-hole pairing, selection correctness
   - DoD: Engine unit tests pass; lint/format pass

5. Courses provider abstraction and service
   - Define `CourseProvider` interface; implement stub provider (mock API) and real provider wrapper (to be integrated)
   - Implement `courses.service.ts`: merge local + API, de-duplicate, prioritize recents/saved, cache with TTL
   - Unit tests for merge, de-duplication, precedence of overrides, TTL behavior
   - DoD: Service unit tests pass; lint/format pass

6. CourseAutocomplete component
   - Implement async MUI Autocomplete with grouped options: “Recent & Saved” then “Search results”
   - Debounce search, show loading, “Add course” action when not found
   - Component tests with mocked provider/service verifying prioritization, search, add action presence
   - DoD: Component tests pass; lint/format pass

7. TeeSelect component and tee overrides
   - Implement MUI Select loading tees by selected course; support “Add custom tee” and edit tee dialog
   - Auto-populate rating/slope into form; allow “Override values” toggle for per-entry edits
   - Unit/component tests for tee list population, override behavior, add/edit tee flows
   - DoD: Tests pass; lint/format pass

8. ScoreForm with validation and live differential
   - Build form with RHF + Zod: date, course autocomplete, tee select, holes, gross score, rating/slope
   - Live differential preview using engine; validation (ranges, required, date <= today)
   - Unit/component tests: validation, preview updates, submission success path
   - DoD: Tests pass; lint/format pass

9. Scores persistence and CRUD
   - Implement `scores.db.ts` operations; on save/edit recompute differential; normalize date handling (UTC)
   - Add score editing dialog component reusing `ScoreForm`
   - Unit tests: create, read, update (recalc), delete; date sorting correctness
   - DoD: Tests pass; lint/format pass

10. Dashboard: HandicapSummary
   - Implement summary showing current index or “At least 3 scores required…” message
   - Expandable details: rule applied, used differentials list highlighting included ones
   - Component tests with seeded scores verifying calculations and displayed breakdown
   - DoD: Tests pass; lint/format pass

11. Dashboard: ScoreTable (list, sort, edit, delete, delete all)
   - Implement table with Date, Course, Score, Differential; sorted by date desc
   - Row actions: Edit (dialog), Delete (confirm); toolbar “Delete all” (confirm)
   - Component tests: sorting, edit updates recalculation, row delete, delete all
   - DoD: Tests pass; lint/format pass

12. ManageCourses page
   - List saved courses with expandable tees; add/edit/delete for courses and tees
   - Integrate API search to “Save to My Courses”
   - Component tests: CRUD operations, tee edits, saved course priority
   - DoD: Tests pass; lint/format pass

13. 9-hole pairing integration
   - Persist and/or compute pairing of 9-hole scores into 18-hole equivalents for index
   - Indicate pairing status in UI (e.g., tag “Paired with 2024-06-12”); exclude unpaired 9-hole from calculation
   - Unit/component tests: pairing logic across saves/edits/deletes; summary reflects pairs
   - DoD: Tests pass; lint/format pass

14. Error handling and manual fallback
   - Handle API failures with retry and fallback to manual add flows
   - Robust field-level error messages; global snackbar notifications
   - Component tests: simulated API errors, manual add success path
   - DoD: Tests pass; lint/format pass

15. Preferences: recents and favorites
   - Implement `preferences` storage: LRU for recent courses/tees; optional favorites
   - Ensure CourseAutocomplete prioritizes recents/saved before API results
   - Unit tests for LRU updates and prioritization logic
   - DoD: Tests pass; lint/format pass

16. Settings and theming
   - Add Settings page: light/dark toggle persisted; default hole count; recent-items limit
   - Visual regression-friendly tests for theme toggle; unit tests for persistence
   - DoD: Tests pass; lint/format pass

17. E2E happy paths
   - Add basic E2E: enter 3 scores → index shows with breakdown; edit score → recalculation; add custom course/tee; delete all → empty state
   - Stabilize waits and selectors; ensure CI-friendly
   - DoD: E2E pass locally and in CI; lint/format pass

18. Performance and accessibility
   - Debounce search (300–500ms); audit bundle (code-splitting by route)
   - A11y checks: labels, roles, keyboard nav, color contrast; fix issues
   - Automated a11y test pass on key pages (jest-axe/axe-playwright optional)
   - DoD: Perf/a11y checks pass; lint/format pass

19. Build, deploy, docs
   - Configure environment variables (e.g., `VITE_COURSE_API_URL`)
   - Produce production build; deploy to preferred host (Vercel/Netlify/GitHub Pages)
   - Update README with setup, scripts, and development workflow
   - DoD: Deployment live; CI green; lint/format pass

Each step concludes with all tests passing and code linted/formatted.

