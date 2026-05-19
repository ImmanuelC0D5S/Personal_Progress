/**
 * LocalStorage Keys Schema
 */
export const LS_KEYS = {
  WORKOUTS: 'tracker_workouts',
  HABITS: 'tracker_habits',
  HABIT_LOGS: 'tracker_habit_logs',
  GOALS: 'tracker_goals',
  SKILLS: 'tracker_skills',
  DAILY_SKILLS: 'tracker_daily_skills',
  DAILY_SKILL_TASKS: 'tracker_daily_skill_tasks',
  DAILY_ONBOARDING_DATE: 'tracker_daily_onboarding_date',
  DAILY_TRAINING: 'tracker_daily_training',
  PENALTIES: 'tracker_penalties',
  TOTAL_XP_PENALTY: 'tracker_total_xp_penalty',
};

/**
 * Standard templates for initial seed data (available via "Initialize System" action)
 */
export const SEED_DATA = {
  workouts: [
    {
      id: 'w1',
      date: '2026-05-15',
      type: 'Hypertrophy Protocol',
      duration: 45, // minutes
      intensity: 'High',
      notes: 'Neural-motor output at 95%. Focused on cybernetic extension muscles.',
      exercises: [
        { name: 'Core Matrix Lifts', sets: 4, reps: 10, weight: 80 },
        { name: 'Nano-Fiber Pullups', sets: 3, reps: 12, weight: 0 },
        { name: 'Synaptic Squats', sets: 4, reps: 8, weight: 100 }
      ]
    },
    {
      id: 'w2',
      date: '2026-05-17',
      type: 'Synaptic Reflexes',
      duration: 30,
      intensity: 'Extreme',
      notes: 'High velocity training. Reflex response calibrated.',
      exercises: [
        { name: 'Kinesis Punch Matrix', sets: 5, reps: 20, weight: 5 },
        { name: 'Cyber-Sprint Intervals', sets: 6, reps: 1, weight: 0 }
      ]
    }
  ],
  habits: [
    { id: 'h1', name: 'Neural Code Refactoring', category: 'Mental', frequency: 'Daily', streak: 4 },
    { id: 'h2', name: 'Hydration Matrix Integration', category: 'Physical', frequency: 'Daily', streak: 7 },
    { id: 'h3', name: 'Biometric Strength Calibrations', category: 'Physical', frequency: 'Weekly', streak: 2 },
    { id: 'h4', name: 'Cybersecurity Threat Scans', category: 'Mental', frequency: 'Daily', streak: 0 }
  ],
  habitLogs: [
    { date: '2026-05-15', habitId: 'h1' },
    { date: '2026-05-16', habitId: 'h1' },
    { date: '2026-05-17', habitId: 'h1' },
    { date: '2026-05-18', habitId: 'h1' },
    { date: '2026-05-12', habitId: 'h2' },
    { date: '2026-05-13', habitId: 'h2' },
    { date: '2026-05-14', habitId: 'h2' },
    { date: '2026-05-15', habitId: 'h2' },
    { date: '2026-05-16', habitId: 'h2' },
    { date: '2026-05-17', habitId: 'h2' },
    { date: '2026-05-18', habitId: 'h2' },
    { date: '2026-05-15', habitId: 'h3' },
    { date: '2026-05-18', habitId: 'h3' }
  ],
  goals: [
    { id: 'g1', title: 'Complete Neural Network v2', deadline: '2026-06-01', progress: 75, status: 'Active' },
    { id: 'g2', title: 'Achieve 15% Cybernetic Efficiency', deadline: '2026-07-15', progress: 40, status: 'Active' },
    { id: 'g3', title: 'Establish Grid Node Access', deadline: '2026-05-25', progress: 100, status: 'Completed' }
  ],
  skills: [
    { id: 's1', name: 'Cybernetic Hardware Integration', level: 4, maxLevel: 5, category: 'Hardware', xp: 85 },
    { id: 's2', name: 'Sub-Grid Matrix Bypass', level: 2, maxLevel: 5, category: 'Software', xp: 30 },
    { id: 's3', name: 'Biometric Node Diagnostics', level: 3, maxLevel: 5, category: 'Bio-tech', xp: 60 }
  ]
};
