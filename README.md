# Personal Progress

Personal Progress is a local-first productivity and self-discipline tracker built with React + Vite.  
It combines habits, workout logging, skill missions, daily onboarding, AI coaching, protocol penalties, and deadline-based expiry in one interface.

## Features

- Daily onboarding flow with:
  - mandatory `PRAYER` task (always included)
  - physical protocol selection (Gym / Calisthenics / Rest)
  - muscle-group targeting
  - skill mission selection with per-mission deadlines
- Habit system with streaks, daily logs, optional deadline per habit, and expiry-aware misses
- Skill mission system with XP rewards and mission completion tracking
- Skill tree progression with lock/unlock dependencies and progress editing
- Workout logger with exercise sets/reps/weight and volume chart
- Dashboard with:
  - KPI cards
  - activity heatmap
  - protocol-aware today focus
  - streak break indicators
- Prayer breach/penalty flow:
  - missed prayer detection
  - mandatory reason capture
  - XP deduction ledger
  - breach alert indicator and breach log
- Settings tools:
  - JSON export
  - soft reset (history-only purge, definitions preserved)

## Tech Stack

- React 18
- Vite
- React Router DOM
- Recharts
- Lucide React
- localStorage persistence via custom hooks

## Project Structure

```txt
src/
  components/
    CoachPanel.jsx
    DailyOnboarding.jsx
    MorningBriefing.jsx
  hooks/
    useCoach.js
    useExpiryEngine.js
    useLocalStorage.js
  pages/
    DashboardPage.jsx
    HabitsPage.jsx
    SkillsPage.jsx
    WorkoutsPage.jsx
  App.jsx
  constants.js
  index.css
  main.jsx
public/
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env`:
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

3. Run:
```bash
npm run dev
```

4. Build:
```bash
npm run build
```

## Routes

- `/` Dashboard
- `/workouts` Workouts
- `/habits` Habits + daily missions
- `/skills` Skill tree

## Data Model (localStorage)

### Core
- `tracker_workouts`
- `tracker_habits`
- `tracker_habit_logs`
- `tracker_goals`
- `tracker_skills`

### Daily orchestration
- `tracker_daily_skills`
- `tracker_daily_skill_tasks`
- `tracker_daily_training`
- `tracker_daily_onboarding_date`

### Discipline / penalty
- `tracker_penalties`
- `tracker_total_xp_penalty`
- `tracker_total_xp_bonus`

### Utility / legacy
- `tracker_last_briefing`

## Deadline + Expiry System

- Habits support optional `deadlineTime` (`HH:MM`, 24-hour).
- Daily skill tasks support optional `deadlineTime`.
- Prayer task is fixed to `23:59`.
- `useExpiryEngine` runs globally every 60 seconds and marks overdue items as expired.
- Expired tasks/habits:
  - are non-completable
  - show missed state in UI
  - break streak continuity for that day

## Prayer Protocol and Penalties

- Prayer is mandatory every day and pinned at top of mission list.
- If prayer is missed, a penalty entry is generated.
- On next app open, a breach screen appears before onboarding:
  - user must provide reason (minimum 10 chars)
  - XP penalty is applied (`-50`)
  - breach marked acknowledged
- Settings includes a `BREACH LOG` view with dates, reasons, and total XP lost.

## Soft Reset Behavior

`RESET PROGRESS DATA` clears only history/session keys:

- `tracker_workouts`
- `tracker_habit_logs`
- `tracker_daily_skill_tasks`
- `tracker_daily_onboarding_date`
- `tracker_daily_skills`
- `tracker_last_briefing`

It preserves:

- `tracker_skills`
- `tracker_habits`
- `tracker_goals`

## Notes

- Persistence is browser-local (no backend DB).
- The app is designed for deterministic offline usage with periodic UI-time updates.
- AI coach features require a valid Gemini key and outbound API connectivity.
