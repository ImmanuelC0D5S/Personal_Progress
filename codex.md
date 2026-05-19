# Progress Codebase A-Z (Codex Notes)

This codebase is a single-page React + Vite app that acts as a local-first personal tracking system (workouts, habits, skills, goals) with a cyberpunk UI and optional AI coach.

## 1) Runtime and Tooling

- Stack: React 18, Vite, React Router DOM, Lucide icons, Recharts.
- Scripts in `package.json`:
  - `npm run dev` -> local dev server
  - `npm run build` -> production build
  - `npm run preview` -> preview built app
  - `npm run lint` -> eslint
- Project layout:
  - `src/` app code
  - `public/` static assets
  - `dist/` build output
  - `.env` for runtime API key (`VITE_GEMINI_API_KEY`)

## 2) Entry Flow and App Shell

- Entry path:
  - `src/main.jsx` mounts `<App />` in `StrictMode`.
  - `src/App.jsx` is the main shell with:
    - top fixed header
    - center route outlet
    - bottom fixed tab nav
    - floating AI coach panel
- Routing in `App.jsx`:
  - `/` -> `DashboardPage`
  - `/workouts` -> `WorkoutsPage`
  - `/habits` -> `HabitsPage`
  - `/skills` -> `SkillsPage`

## 3) State Architecture and Persistence

- Global app state is centralized in `App.jsx` and passed down via props:
  - `workouts`, `habits`, `habitLogs`, `goals`, `skills`
- State persistence:
  - custom hook `useLocalStorage` (`src/hooks/useLocalStorage.js`)
  - writes are debounced by 300ms
- Key schema source:
  - `src/constants.js` -> `LS_KEYS`
  - includes keys for daily onboarding and daily skill tasks

## 4) Storage/Data Contracts

Defined by usage patterns across pages:

- `tracker_workouts`: array of workout sessions
  - fields: `id`, `date`, `type`, `exercises[]`, `notes`
- `tracker_habits`: array of habits
  - fields: `id`, `name`, `icon`, `color`, `target` (or legacy `frequency`)
- `tracker_habit_logs`: array of logs
  - fields: `habitId`, `date`, `completed`
- `tracker_goals`: array of goals
  - fields: `id`, `title`, `deadline`, `status`, `progress`, etc.
- `tracker_skills`: array of skill nodes
  - fields: `id`, `name`, `category`, `xp`, `status`, `progress`, `parent`
- `tracker_daily_skills`: selected skill IDs for a given date
- `tracker_daily_skill_tasks`: generated daily tasks tied to selected skills
- `tracker_daily_onboarding_date`: last date onboarding was completed

## 5) Feature Modules

### Dashboard (`src/pages/DashboardPage.jsx`)

- Bootstraps seed data when system is empty.
- Shows key stats:
  - total workouts
  - max habit streak
  - goals in progress
  - unlocked skills count
- Builds a 28-cell activity heatmap (4 weeks x 7 days).
- Shows incomplete habits for today with quick-complete action.
- Provides destructive “wipe storage” action.

### Workouts (`src/pages/WorkoutsPage.jsx`)

- Modal form to log workouts with dynamic exercise rows.
- Validates that at least one named exercise exists.
- Computes session volume (`sets * reps * weight`) per exercise and session.
- Displays:
  - past sessions list with expand/collapse details
  - last 7 sessions volume histogram using Recharts
- Supports session deletion.

### Habits (`src/pages/HabitsPage.jsx`)

- Manages standard habits and daily mission tasks.
- Calculates streaks by scanning backward day-by-day.
- Tracks today completion and 7-day mini-dot timeline per habit.
- Integrates daily skill tasks:
  - complete task -> marks task completed
  - increments linked skill progress (+10%)
  - sets skill to `complete` at 100%
  - triggers floating XP feedback
- Can open onboarding flow via `triggerOnboarding`.

### Skills (`src/pages/SkillsPage.jsx`)

- Skill tree with status model:
  - `locked`, `unlocked`, `complete`
- Filter tabs by category.
- Total XP computation:
  - complete skill gives full XP
  - unlocked skill gives partial XP based on progress
- Progress editor modal (slider 0-100):
  - updates skill progress/state
  - unlocks child nodes when parent hits 100%
- Add custom skill nodes.

### Daily Onboarding (`src/components/DailyOnboarding.jsx`)

- 3-step daily flow:
  1. daily boot view
  2. select or add today’s skill missions
  3. deploy mission list
- Persists selected missions and generated daily tasks in localStorage.
- Triggered automatically once per day from `App.jsx` if date not set.

### AI Coach (`src/components/CoachPanel.jsx` + `src/hooks/useCoach.js`)

- Floating panel UI with quick prompts and free-text prompt.
- Builds context from local storage:
  - recent workouts
  - habit streak/completion status
  - skill progress
  - total XP
- Sends request to Gemini endpoint using `VITE_GEMINI_API_KEY`.
- Displays responses with a typewriter effect and loading state.

## 6) Styling System

- Global theme in `src/index.css`:
  - CSS variables for colors, typography, borders
  - utility classes (`card`, `cyber-button`, `cyber-input`, etc.)
  - animation helpers and responsive grid helpers
- App heavily uses inline styles on top of shared classes.

## 7) Notable Technical Risks and Gaps

1. State mutation risk in AI coach:
   - `useCoach` does `workouts.sort(...)` directly, which mutates array data.
2. Date consistency risk:
   - local date formatter and UTC `toISOString().split('T')[0]` are mixed.
3. Encoding/mojibake issues:
   - several emoji/text literals appear corrupted (`ðŸ...`, `â...`).
4. Dead/unused feature path:
   - `MorningBriefing` exists but is not integrated into current app flow.
5. Maintainability:
   - extensive inline styles and repeated UI patterns increase refactor cost.

## 8) Practical Next Steps

1. Normalize all date logic to one local-date utility.
2. Fix mutation in `useCoach` (`[...workouts].sort(...)`).
3. Convert affected source files to UTF-8 and clean mojibake strings.
4. Extract repeated inline style blocks into reusable components/classes.
5. Decide whether to integrate or remove `MorningBriefing`.

