# USGA GHIN Handicap Index Calculator – Project Specification

## Overview
A single-page React application using Material Design components that allows users to calculate and track their USGA GHIN handicap index. The app is designed for anonymous/guest usage, storing all data locally in the browser.

---

## Core Features

### 1. Score Entry Flow
- **Fields Required:**
  - Date of round (date picker)
  - Golf course name (autocomplete, prioritizing previous selections)
  - Tees played (dropdown, populated by course selection)
  - Course rating (auto-populated, editable)
  - Course slope (auto-populated, editable)
  - Gross score (numeric input)
  - 9 or 18 holes (radio/dropdown)
- **Course & Tee Data:**
  - Sourced from a public golf course API.
  - If not found, user can add a new course/tee manually.
  - Course rating and slope are editable in case of outdated/incorrect API data.
- **Persistence:**
  - Manually added/edited courses and tees are saved for future quick selection.

### 2. Saved Courses/Tees Management
- Users can view, edit, or delete their saved courses and tees from a dedicated management/settings page.

### 3. User Data & Authentication
- No login or registration required.
- All user data (scores, saved courses/tees) is stored locally in the browser (e.g., localStorage or IndexedDB).
- No data is synced across devices.

### 4. Dashboard & Score History
- Main dashboard displays:
  - Current handicap index (prominently)
  - Table of past scores, with columns:
    - Date
    - Course
    - Score
    - Differential
  - Table features:
    - Sorted by date (most recent first)
    - Edit any row (score, course rating, slope, date)
    - Delete any row
    - Button to delete all entries

### 5. Handicap Index Calculation
- Follows official USGA rules:
  - If 3–20 scores: uses USGA’s “less than 20 scores” rules (e.g., 3 scores = lowest 1 differential × 0.96, etc.).
  - If fewer than 3 scores: displays message “At least 3 scores required before receiving a handicap index” and shows entered scores.
- Displays:
  - Which differentials were used in the calculation.
  - Step-by-step breakdown of the calculation (e.g., “Average of lowest X differentials × 0.96”).
  - Optionally, a tooltip or expandable section for calculation details.

---

## Additional Considerations (for future expansion)
- Mobile responsiveness.
- Dark mode.
- Data export/import (e.g., CSV or JSON).
- User authentication and cloud sync.
- Integration with official GHIN/USGA APIs for score posting.

---

## Tech Stack
- **Frontend:** React (SPA)
- **UI Components:** Material Design (e.g., Material-UI)
- **Data Storage:** Browser localStorage or IndexedDB
- **APIs:** Public golf course data API

---

## Out of Scope
- No backend or server-side components.
- No official GHIN/USGA account integration (for now).
- No user authentication or cloud sync (for now).

---

## MVP Acceptance Criteria
- Users can enter, edit, and delete golf scores with all required fields.
- Users can search for courses/tees, add new ones, and edit/save them.
- Handicap index is calculated and displayed per USGA rules, with clear breakdown.
- All data is stored locally and persists across browser sessions.
- The UI is intuitive and responsive, using Material Design components.
