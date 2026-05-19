import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Award, CheckSquare, Dumbbell, Cpu, TrendingUp, 
  ArrowUpRight, RefreshCw, AlertCircle, ShieldCheck
} from 'lucide-react';
import { LS_KEYS, SEED_DATA } from '../constants';

export default function DashboardPage({ 
  workouts, habits, habitLogs, goals, skills, 
  setWorkouts, setHabits, setHabitLogs, setGoals, setSkills 
}) {
  
  // Local date formatting YYYY-MM-DD
  const getLocalDateString = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const todayStr = getLocalDateString(new Date());

  // Handlers for deploying demo data
  const handleDeploySeed = () => {
    // For workouts page sample preloading
    const sampleWorkouts = [];

    // For habits page sample preloading
    const sampleHabits = [
      { id: 1, name: "LeetCode DSA", icon: "🧩", color: "--neon-cyan", target: "daily" },
      { id: 2, name: "Edge AI Study", icon: "🤖", color: "--neon-magenta", target: "daily" },
      { id: 3, name: "Read / Research", icon: "📖", color: "--neon-amber", target: "daily" },
      { id: 4, name: "Project Work", icon: "💻", color: "--neon-green", target: "daily" }
    ];

    // For skills page sample preloading
    const sampleSkills = [
      { id: 1, name: "Python / FastAPI", category: "Coding", status: "complete", xp: 200, parent: null },
      { id: 2, name: "React + TypeScript", category: "Coding", status: "complete", xp: 180, parent: null },
      { id: 3, name: "LangGraph / AI Agents", category: "AI/ML", status: "complete", xp: 150, parent: null },
      { id: 4, name: "Random Forest / Sklearn", category: "AI/ML", status: "complete", xp: 120, parent: null },
      { id: 5, name: "TFLite / ONNX", category: "Edge AI", status: "unlocked", xp: 250, parent: null, progress: 20 },
      { id: 6, name: "Model Quantization & Pruning", category: "Edge AI", status: "locked", xp: 300, parent: 5 },
      { id: 7, name: "ARM / NPU Architecture", category: "Edge AI", status: "locked", xp: 280, parent: 5 },
      { id: 8, name: "C++ Basics", category: "Systems", status: "unlocked", xp: 200, parent: null, progress: 10 },
      { id: 9, name: "Docker", category: "Systems", status: "unlocked", xp: 150, parent: null, progress: 25 },
      { id: 10, name: "DSA - Arrays & Strings", category: "DSA", status: "unlocked", xp: 100, parent: null, progress: 30 },
      { id: 11, name: "DSA - Trees & Graphs", category: "DSA", status: "locked", xp: 200, parent: 10 },
      { id: 12, name: "ESP32 / Embedded C", category: "Systems", status: "complete", xp: 160, parent: null }
    ];

    // Let's set logs that align with sample habits
    const sampleHabitLogs = [];

    // Goals sample
    const sampleGoals = [
      { id: 1, title: "Deploy AeroLung on Raspberry Pi", category: "Project", status: "in-progress", progress: 55, deadline: "2026-08-31", notes: "TFLite conversion + Pi setup pending" },
      { id: 2, title: "Fix CivicFlow TN Security", category: "Project", status: "in-progress", progress: 30, deadline: "2026-06-30", notes: "Firestore rules, Gemini key → Cloud Functions, rate limiting" },
      { id: 3, title: "100+ LeetCode Problems", category: "DSA", status: "in-progress", progress: 0, deadline: "2027-08-01", notes: "Target before placements" },
      { id: 4, title: "Land TVS Embedded PIC Internship", category: "Career", status: "in-progress", progress: 40, deadline: "2026-07-01", notes: "Applied/evaluating" },
      { id: 5, title: "Crack Campus Placement", category: "Career", status: "in-progress", progress: 10, deadline: "2027-08-01", notes: "Target: Qualcomm, NVIDIA" }
    ];

    setWorkouts(sampleWorkouts);
    setHabits(sampleHabits);
    setHabitLogs(sampleHabitLogs);
    setGoals(sampleGoals);
    setSkills(sampleSkills);

    localStorage.setItem('tracker_workouts_initialized', 'true');
    localStorage.setItem('tracker_habits_initialized', 'true');
    localStorage.setItem('tracker_skills_initialized', 'true');
  };

  const handleClearSystem = () => {
    if (window.confirm("CRITICAL: Wipe all local telemetry database?")) {
      setWorkouts([]);
      setHabits([]);
      setHabitLogs([]);
      setGoals([]);
      setSkills([]);
      localStorage.removeItem('tracker_workouts_initialized');
      localStorage.removeItem('tracker_habits_initialized');
      localStorage.removeItem('tracker_skills_initialized');
    }
  };

  const isSystemEmpty = 
    workouts.length === 0 && 
    habits.length === 0 && 
    skills.length === 0;

  // Streak calculation: consecutive days going backward from today where completed === true
  const calculateHabitStreak = (habitId, logs) => {
    const byDate = {};
    logs.filter(log => log.habitId === habitId).forEach((log) => {
      byDate[log.date] = log;
    });

    const today = new Date();
    const todayStr = getLocalDateString(today);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const isDone = (log) =>
      !!log && (log.completed === true || (log.completed === undefined && log.status !== 'expired' && !log.expired));
    const isExpired = (log) => !!log && (log.status === 'expired' || log.expired);
    if (isExpired(byDate[todayStr])) return 0;

    if (!isDone(byDate[todayStr]) && !isDone(byDate[yesterdayStr])) {
      return 0;
    }

    let streak = 0;
    let checkDate = isDone(byDate[todayStr]) ? today : yesterday;

    while (true) {
      const checkStr = getLocalDateString(checkDate);
      if (isExpired(byDate[checkStr])) break;
      if (isDone(byDate[checkStr])) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Stats Calculations
  const totalWorkouts = workouts.length;
  
  const currentStreak = useMemo(() => {
    let prayerBreachToday = false;
    try {
      const penalties = JSON.parse(localStorage.getItem(LS_KEYS.PENALTIES) || '[]');
      prayerBreachToday = penalties.some(p => p.task === 'PRAYER' && p.date === todayStr && p.completed === false);
    } catch {
      prayerBreachToday = false;
    }
    if (prayerBreachToday) return 0;
    if (habits.length === 0) return 0;
    const streaks = habits.map(h => calculateHabitStreak(h.id, habitLogs));
    return Math.max(...streaks, 0);
  }, [habits, habitLogs, todayStr]);

  // Count goals where status !== 'complete' (or case-insensitive Completed)
  const goalsInProgress = goals.filter(g => g.status?.toLowerCase() !== 'complete' && g.status?.toLowerCase() !== 'completed').length;
  // Skills count where status === 'unlocked'
  const skillsUnlocked = skills.filter(s => s.status === 'unlocked').length;

  // 7 columns (Mon-Sun), last 4 weeks rows Heatmap Data (28 cells)
  const heatmapCells = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + distanceToMonday);

    const startDate = new Date(currentMonday);
    startDate.setDate(startDate.getDate() - 21); // Go back 3 full weeks to get 4 weeks total

    const cells = [];
    for (let i = 0; i < 28; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      const dateStr = getLocalDateString(cellDate);

      // Count workouts logged on this day
      const workoutsCount = workouts.filter(w => w.date === dateStr).length;
      
      // Count habits checked on this day
      const habitsCount = habitLogs.filter(log => log.date === dateStr && (log.completed === true || log.completed === undefined)).length;

      const totalActivities = workoutsCount + habitsCount;
      cells.push({
        dateStr,
        count: totalActivities,
        label: cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return cells;
  }, [workouts, habitLogs]);

  // Today's Focus: list of today's incomplete habits
  const incompleteTodayHabits = useMemo(() => {
    return habits.filter(h => {
      const isLoggedToday = habitLogs.some(log => log.habitId === h.id && log.date === todayStr && (log.completed === true || log.completed === undefined));
      return !isLoggedToday;
    });
  }, [habits, habitLogs, todayStr]);

  const expiredTodayHabits = useMemo(() => {
    return habits.filter((h) =>
      habitLogs.some((log) => log.habitId === h.id && log.date === todayStr && (log.status === 'expired' || log.expired)),
    );
  }, [habits, habitLogs, todayStr]);

  const dailyTraining = useMemo(() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.DAILY_TRAINING);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.date === todayStr ? parsed : null;
    } catch {
      return null;
    }
  }, [todayStr]);

  // Quick mark habit complete today
  const handleMarkHabitComplete = (habitId) => {
    setHabitLogs([...habitLogs, { habitId, date: todayStr, completed: true }]);
  };

  return (
    <div className="page-enter" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title & Telemetry Bootstrap Banner */}
      <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="neon-cyan" style={{ fontSize: '20px', marginBottom: '4px', fontFamily: 'Orbitron, sans-serif' }}>
            SYS://MATRIX.STATUS_ONLINE
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'Share Tech Mono, monospace' }}>
            Telemetry synced to local memory. Biometrics active.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {isSystemEmpty && (
            <button 
              className="cyber-button green"
              onClick={handleDeploySeed}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Share Tech Mono, monospace' }}
            >
              <RefreshCw size={14} className="animate-pulse-cyber" />
              DEPLOY TELEMETRY SEED
            </button>
          )}
          {!isSystemEmpty && (
            <button 
              className="cyber-button"
              onClick={handleClearSystem}
              style={{ fontSize: '11px', padding: '6px 12px', borderColor: 'var(--neon-red)', color: 'var(--neon-red)', fontFamily: 'Share Tech Mono, monospace' }}
            >
              WIPE CORE STORAGE
            </button>
          )}
        </div>
      </div>

      {isSystemEmpty ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Activity size={48} className="neon-cyan animate-pulse-cyber" style={{ marginBottom: '16px', marginInline: 'auto' }} />
          <h2 className="neon-cyan" style={{ fontSize: '22px', marginBottom: '8px', fontFamily: 'Orbitron, sans-serif' }}>NO LOCAL DATA DETECTED</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 24px', fontSize: '14px', fontFamily: 'Share Tech Mono, monospace' }}>
            The progress matrices are currently uncalibrated. Deploy telemetry seed or navigate tabs to inject records.
          </p>
          <button 
            className="cyber-button"
            onClick={handleDeploySeed}
            style={{ padding: '12px 24px', fontFamily: 'Share Tech Mono, monospace' }}
          >
            BOOTSTRAP SYSTEM DATA
          </button>
        </div>
      ) : (
        <>
          {/* Top Section — 4 stat cards in a 2x2 grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '16px' 
          }}>
            {/* Stat Card 1: Workouts */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px 20px', minHeight: '115px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', fontFamily: 'Share Tech Mono, monospace', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                  KINETIC_OPERATIONS
                </span>
                <Dumbbell size={16} className="neon-cyan" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                <h1 className="neon-cyan" style={{ 
                  fontSize: '38px', 
                  fontFamily: 'Orbitron, sans-serif', 
                  margin: 0, 
                  lineHeight: 1,
                  textShadow: '0 0 10px var(--neon-cyan), 0 0 20px rgba(0, 213, 255, 0.3)'
                }}>
                  {totalWorkouts}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--neon-green)', fontSize: '11px', fontFamily: 'Share Tech Mono, monospace' }}>
                  <ArrowUpRight size={14} />
                  <span>STABLE</span>
                </div>
              </div>
            </div>

            {/* Stat Card 2: Streak */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px 20px', minHeight: '115px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', fontFamily: 'Share Tech Mono, monospace', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                  SYNAPSE_STREAK
                </span>
                <CheckSquare size={16} className="neon-green" style={{ color: 'var(--neon-green)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                <h1 className="neon-cyan" style={{ 
                  fontSize: '38px', 
                  fontFamily: 'Orbitron, sans-serif', 
                  margin: 0, 
                  lineHeight: 1,
                  textShadow: '0 0 10px var(--neon-cyan), 0 0 20px rgba(0, 213, 255, 0.3)'
                }}>
                  {currentStreak} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>DAYS</span>
                </h1>
                {expiredTodayHabits.length > 0 && (
                  <span className="mono" style={{ fontSize: '10px', color: '#ef4444' }}>STREAK BROKEN</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--neon-green)', fontSize: '11px', fontFamily: 'Share Tech Mono, monospace' }}>
                  <ArrowUpRight size={14} />
                  <span>ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Stat Card 3: Goals */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px 20px', minHeight: '115px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', fontFamily: 'Share Tech Mono, monospace', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                  OBJECTIVES_IN_FLUX
                </span>
                <Award size={16} style={{ color: '#ffb300' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                <h1 className="neon-cyan" style={{ 
                  fontSize: '38px', 
                  fontFamily: 'Orbitron, sans-serif', 
                  margin: 0, 
                  lineHeight: 1,
                  textShadow: '0 0 10px var(--neon-cyan), 0 0 20px rgba(0, 213, 255, 0.3)'
                }}>
                  {goalsInProgress}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--neon-green)', fontSize: '11px', fontFamily: 'Share Tech Mono, monospace' }}>
                  <ArrowUpRight size={14} />
                  <span>PENDING</span>
                </div>
              </div>
            </div>

            {/* Stat Card 4: Skills */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px 20px', minHeight: '115px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '11px', fontFamily: 'Share Tech Mono, monospace', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                  SKILLS_INTEGRATED
                </span>
                <Cpu size={16} style={{ color: '#ec4899' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '12px' }}>
                <h1 className="neon-cyan" style={{ 
                  fontSize: '38px', 
                  fontFamily: 'Orbitron, sans-serif', 
                  margin: 0, 
                  lineHeight: 1,
                  textShadow: '0 0 10px var(--neon-cyan), 0 0 20px rgba(0, 213, 255, 0.3)'
                }}>
                  {skillsUnlocked}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--neon-green)', fontSize: '11px', fontFamily: 'Share Tech Mono, monospace' }}>
                  <ArrowUpRight size={14} />
                  <span>UNLOCKED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section — Weekly Activity Heatmap */}
          <div className="card">
            <h3 className="neon-cyan" style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Share Tech Mono, monospace' }}>
              <TrendingUp size={16} />
              WEEKLY SOMATIC & COGNITIVE ACTIVITY HEATMAP
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', margin: '0 auto' }}>
              {/* Mon-Sun Headers Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <div key={idx} style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'Share Tech Mono, monospace', fontWeight: 'bold' }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid of 28 Cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {heatmapCells.map((cell) => {
                  const count = cell.count;
                  
                  // Color intensities based on number of activities
                  let bg = '#0d0d1a';
                  let boxShadow = 'none';
                  let border = '1px solid rgba(255, 255, 255, 0.03)';
                  
                  if (count === 1) {
                    bg = '#003344';
                  } else if (count === 2) {
                    bg = '#006688';
                  } else if (count >= 3) {
                    bg = 'var(--neon-cyan)';
                    border = '1px solid rgba(0, 213, 255, 0.8)';
                    boxShadow = '0 0 10px var(--neon-cyan), 0 0 15px rgba(0, 213, 255, 0.3)';
                  }

                  return (
                    <div
                      key={cell.dateStr}
                      title={`DATE: ${cell.dateStr} | ACTIVITIES: ${count}`}
                      style={{
                        aspectRatio: '1',
                        borderRadius: '4px',
                        backgroundColor: bg,
                        border: border,
                        boxShadow: boxShadow,
                        transition: 'all 0.2s ease',
                        cursor: 'help'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    />
                  );
                })}
              </div>

              {/* Heatmap Legend */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'Share Tech Mono, monospace' }}>
                <span>LESS ENGAGEMENT</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '1px', backgroundColor: '#0d0d1a' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '1px', backgroundColor: '#003344' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '1px', backgroundColor: '#006688' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '1px', backgroundColor: 'var(--neon-cyan)', boxShadow: '0 0 4px var(--neon-cyan)' }} />
                </div>
                <span>HYPER-ENGAGED</span>
              </div>
            </div>
          </div>

          {/* Bottom Section — Today's Focus */}
          <div className="card">
            <h3 className="neon-green" style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Share Tech Mono, monospace' }}>
              <CheckSquare size={16} />
              TODAY'S SOMATIC & COGNITIVE FOCUS LOOP
            </h3>

            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px dashed var(--border-dim)' }}>
              {dailyTraining ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      border: dailyTraining.type === 'REST' ? '1px solid #ffb300' : '1px solid var(--neon-cyan)',
                      color: dailyTraining.type === 'REST' ? '#ffb300' : 'var(--neon-cyan)',
                      background: dailyTraining.type === 'REST' ? 'rgba(255,179,0,0.12)' : 'rgba(0,213,255,0.12)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {dailyTraining.type}
                    </span>
                  </div>
                  {dailyTraining.muscleGroups?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {dailyTraining.muscleGroups.map((group) => (
                        <span key={group} style={{
                          fontSize: '10px',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-dim)',
                          borderRadius: '999px',
                          padding: '3px 8px',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          {group}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  NO PROTOCOL SET — RUN DAILY BOOT
                </div>
              )}
            </div>

            {incompleteTodayHabits.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {[...expiredTodayHabits, ...incompleteTodayHabits.filter(h => !expiredTodayHabits.some(e => e.id === h.id))].map((h) => {
                  const colorVal = h.color || '--neon-cyan';
                  const habitColor = colorVal.startsWith('--') ? `var(${colorVal})` : colorVal;
                  const missed = expiredTodayHabits.some(e => e.id === h.id);
                  return (
                    <button
                      key={h.id}
                      onClick={() => !missed && handleMarkHabitComplete(h.id)}
                      className="cyber-button"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderColor: missed ? 'rgba(255,36,66,0.5)' : habitColor,
                        color: missed ? 'var(--text-secondary)' : habitColor,
                        padding: '8px 16px',
                        fontSize: '12px',
                        borderRadius: '20px',
                        textDecoration: missed ? 'line-through' : 'none',
                        boxShadow: `0 0 4px rgba(255, 255, 255, 0.02)`,
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        fontFamily: 'Share Tech Mono, monospace',
                        cursor: missed ? 'default' : 'pointer',
                        backgroundColor: missed ? 'rgba(255,36,66,0.04)' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = habitColor;
                        e.currentTarget.style.color = '#000000';
                        e.currentTarget.style.boxShadow = `0 0 10px ${habitColor}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = habitColor;
                        e.currentTarget.style.boxShadow = `0 0 4px rgba(255, 255, 255, 0.02)`;
                      }}
                    >
                      {missed ? (
                        <span className="mono" style={{ fontSize: '10px', color: '#ef4444', border: '1px solid rgba(239,68,68,0.6)', borderRadius: '999px', padding: '2px 6px' }}>MISSED</span>
                      ) : (
                        <span>[ ]</span>
                      )}
                      <span>{h.icon}</span>
                      <span>{h.name.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '24px', 
                border: '1px dashed var(--neon-green)',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 230, 118, 0.02)',
                color: 'var(--neon-green)',
                fontFamily: 'Orbitron, sans-serif'
              }}>
                <ShieldCheck size={28} className="animate-pulse-cyber" style={{ marginBottom: '8px' }} />
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', textShadow: '0 0 10px var(--neon-green)' }}>
                  ALL SYSTEMS NOMINAL
                </h4>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', letterSpacing: '1px', fontFamily: 'Share Tech Mono, monospace' }}>
                  ALL SOMATIC PROTOCOLS LOCKED FOR TODAY CYCLE.
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
