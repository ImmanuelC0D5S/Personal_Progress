import React, { useEffect, useState } from 'react';
import { Check, X, Calendar, Dumbbell } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { LS_KEYS } from '../constants';

export default function MorningBriefing({ onClose }) {
  const [habits] = useLocalStorage(LS_KEYS.HABITS, []);
  const [habitLogs] = useLocalStorage(LS_KEYS.HABIT_LOGS, []);
  const [workouts] = useLocalStorage(LS_KEYS.WORKOUTS, []);
  const [goals] = useLocalStorage(LS_KEYS.GOALS, []);
  const [skills] = useLocalStorage(LS_KEYS.SKILLS, []);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Yesterday habit status
  const yesterdayCompleted = habits.filter(h =>
    habitLogs.some(l => l.habitId === h.id && l.date === yesterdayStr && (l.completed === true || l.completed === undefined))
  );
  const yesterdayMissed = habits.filter(h =>
    !habitLogs.some(l => l.habitId === h.id && l.date === yesterdayStr && (l.completed === true || l.completed === undefined))
  );

  // Yesterday workout (first found)
  const yesterdayWorkout = workouts.find(w => w.date === yesterdayStr);

  // Today's mission: habits not yet completed today
  const todayHabits = habits.filter(h =>
    !habitLogs.some(l => l.habitId === h.id && l.date === todayStr && (l.completed === true || l.completed === undefined))
  );

  const topUnlockedSkill = skills
    .filter(s => s.status === 'unlocked')
    .sort((a, b) => b.xp - a.xp)[0];

  const upcomingGoals = goals
    .filter(g => {
      if (['complete', 'completed'].includes((g.status || '').toLowerCase())) return false;
      const deadline = new Date(g.deadline);
      const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    })
    .map(g => ({
      ...g,
      remaining: Math.ceil((new Date(g.deadline) - today) / (1000 * 60 * 60 * 24))
    }));

  const markHabit = (habitId) => {
    const logs = JSON.parse(localStorage.getItem(LS_KEYS.HABIT_LOGS) || '[]');
    logs.push({ habitId, date: todayStr, completed: true });
    localStorage.setItem(LS_KEYS.HABIT_LOGS, JSON.stringify(logs));
    // Simple reload to reflect change
    window.location.reload();
  };

  return (
    <div className="briefing-overlay page-enter">
      <div className="briefing-content">
        <h1 className="neon-cyan" style={{ fontFamily: 'Orbitron, sans-serif', textAlign: 'center' }}>GOOD MORNING, OPERATIVE</h1>
        <p style={{ textAlign: 'center', fontFamily: 'Share Tech Mono, monospace', color: 'var(--text-secondary)' }}>{todayStr}</p>
        <section className="briefing-section">
          <h2 style={{ color: 'var(--neon-green)' }}>YESTERDAY'S DEBRIEF</h2>
          <div className="habit-summary">
            {yesterdayCompleted.map(h => (
              <div key={h.id} className="habit-item">
                <Check color="#00ff00" size={16} /> {h.name}
              </div>
            ))}
            {yesterdayMissed.map(h => (
              <div key={h.id} className="habit-item">
                <X color="#ff4444" size={16} /> {h.name}
              </div>
            ))}
          </div>
          {yesterdayWorkout && (
            <p className="yesterday-workout">Workout: {yesterdayWorkout.type} @ {yesterdayWorkout.date}</p>
          )}
        </section>
        <section className="briefing-section">
          <h2 style={{ color: 'var(--neon-cyan)' }}>TODAY'S MISSION</h2>
          <div className="today-habits">
            {todayHabits.map(h => (
              <label key={h.id} className="habit-checkbox" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input type="checkbox" onChange={() => markHabit(h.id)} /> {h.icon} {h.name}
              </label>
            ))}
          </div>
          {topUnlockedSkill && (
            <p className="top-skill">Top Skill: {topUnlockedSkill.name} (XP {topUnlockedSkill.xp})</p>
          )}
          <div className="upcoming-goals" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            {upcomingGoals.map(g => (
              <div key={g.id} className="goal-pill" style={{
                backgroundColor: g.remaining > 60 ? 'var(--neon-cyan)' : g.remaining > 30 ? 'var(--neon-amber)' : 'var(--neon-red)',
                padding: '6px 12px',
                borderRadius: '999px',
                color: '#fff',
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: '12px',
                animation: g.remaining < 30 ? 'pulse 1.5s infinite' : 'none'
              }}>
                {g.title} – {g.remaining}d
              </div>
            ))}
          </div>
        </section>
          <button className="begin-button" onClick={onClose} style={{
            marginTop: '20px',
            width: '100%',
            padding: '12px',
            backgroundColor: 'var(--neon-cyan)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            boxShadow: '0 0 10px var(--neon-cyan)'
          }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>BEGIN DAY</button>
      </div>
    </div>
  );
}
