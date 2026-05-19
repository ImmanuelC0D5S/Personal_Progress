import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, Plus, Trash2, Calendar, Award, Shield, 
  Compass, X, Sparkles, AlertCircle, Heart, Rocket, Target, Lock, Clock
} from 'lucide-react';
import { LS_KEYS } from '../constants';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function HabitsPage({ 
  habits, setHabits, 
  habitLogs, setHabitLogs,
  skills, setSkills,
  triggerOnboarding
}) {
  // Pre-load sample habits if empty on first run
  useEffect(() => {
    if (!localStorage.getItem('tracker_habits_initialized')) {
      const sampleHabits = [
        { id: 1, name: "LeetCode DSA", icon: "🧩", color: "--neon-cyan", target: "daily" },
        { id: 2, name: "Edge AI Study", icon: "🤖", color: "--neon-magenta", target: "daily" },
        { id: 3, name: "Read / Research", icon: "📖", color: "--neon-amber", target: "daily" },
        { id: 4, name: "Project Work", icon: "💻", color: "--neon-green", target: "daily" }
      ];
      setHabits(sampleHabits);
      localStorage.setItem('tracker_habits_initialized', 'true');
    }
  }, [setHabits]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flashingHabitId, setFlashingHabitId] = useState(null);
  
  const [dailyTasks, setDailyTasks] = useLocalStorage(LS_KEYS.DAILY_SKILL_TASKS, []);
  const [xpFloats, setXpFloats] = useState([]);
  const [prayerFlash, setPrayerFlash] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📖');
  const [color, setColor] = useState('--neon-cyan');
  const [target, setTarget] = useState('daily'); // daily, weekly
  const [deadlineTime, setDeadlineTime] = useState('');
  const [nowTick, setNowTick] = useState(Date.now());

  // Get local date string YYYY-MM-DD
  const getLocalDateString = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const todayStr = getLocalDateString(new Date());

  // Generate last 7 days from left to right (6 days ago to today)
  const getPastSevenDays = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      const isToday = i === 0;
      dates.push({ dateStr, label, isToday });
    }
    return dates;
  };

  const last7Days = useMemo(() => getPastSevenDays(), []);

  // Streak calculation: consecutive days going backward from today where completed === true
  const calculateStreak = (habitId) => {
    const logsByDate = {};
    habitLogs
      .filter(log => log.habitId === habitId)
      .forEach((log) => {
        logsByDate[log.date] = log;
      });

    const today = new Date();
    const todayStr = getLocalDateString(today);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const isDone = (log) =>
      !!log && (log.completed === true || (log.completed === undefined && log.status !== 'expired' && !log.expired));
    const isExpired = (log) => !!log && (log.status === 'expired' || log.expired);

    if (isExpired(logsByDate[todayStr])) return 0;

    // If neither today nor yesterday is checked, streak is broken
    if (!isDone(logsByDate[todayStr]) && !isDone(logsByDate[yesterdayStr])) {
      return 0;
    }

    let streak = 0;
    let checkDate = isDone(logsByDate[todayStr]) ? today : yesterday;

    while (true) {
      const checkStr = getLocalDateString(checkDate);
      if (isExpired(logsByDate[checkStr])) break;
      if (isDone(logsByDate[checkStr])) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  // Memoized streaks to improve performance
  const streaks = useMemo(() => {
    const map = {};
    habits.forEach(h => {
      map[h.id] = calculateStreak(h.id);
    });
    return map;
  }, [habits, habitLogs]);

  // Toggle habit check-in for a specific date
  const handleToggleLog = (habitId, dateString) => {
    const logIndex = habitLogs.findIndex(log => log.habitId === habitId && log.date === dateString);
    
    if (logIndex > -1) {
      // Uncheck habit
      const newLogs = [...habitLogs];
      newLogs.splice(logIndex, 1);
      setHabitLogs(newLogs);
    } else {
      // Check habit
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setHabitLogs([...habitLogs, { habitId, date: dateString, completed: true, completedAt: `${hh}:${mm}` }]);
      setFlashingHabitId(habitId);
      setTimeout(() => setFlashingHabitId(null), 400);
    }
  };

  // Delete habit node
  const handleDeleteHabit = (id) => {
    if (window.confirm("CRITICAL: Wipe this habit definition and all logs from core memory?")) {
      setHabits(habits.filter(h => h.id !== id));
      setHabitLogs(habitLogs.filter(log => log.habitId !== id));
    }
  };

  const handleToggleTask = (taskId) => {
    const taskIndex = dailyTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const task = dailyTasks[taskIndex];
    if (task.completed) return; // Already completed, don't allow uncheck for now or handle appropriately. We allow uncheck?
    // Requirements say: "On completion... Increment progress... If progress hits 100 flash overlay"
    // So let's only do it on first completion.
    
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const newTasks = [...dailyTasks];
    newTasks[taskIndex] = { ...task, completed: true, completedAt: `${hh}:${mm}` };
    setDailyTasks(newTasks);

    if ((task.task || task.skillName) === 'PRAYER' || task.mandatory) {
      const currentBonus = parseInt(localStorage.getItem('tracker_total_xp_bonus') || '0', 10);
      localStorage.setItem('tracker_total_xp_bonus', String(currentBonus + 10));
      const floatId = Date.now();
      setXpFloats(prev => [...prev, { id: floatId, amount: '+10 XP PROTOCOL BONUS', taskId: task.id, prayer: true }]);
      setPrayerFlash(true);
      setTimeout(() => setPrayerFlash(false), 500);
      setTimeout(() => {
        setXpFloats(prev => prev.filter(f => f.id !== floatId));
      }, 1000);
      return;
    }
    
    // Increment skill progress
    if (skills && setSkills) {
      let updatedSkills = [...skills];
      const skillIndex = updatedSkills.findIndex(s => s.id === task.skillId);
      if (skillIndex > -1) {
        let skill = { ...updatedSkills[skillIndex] };
        let newProgress = (skill.progress || 0) + 10;
        if (newProgress >= 100) {
          newProgress = 100;
          skill.status = 'complete';
          alert(`CRITICAL SUCCESS: SKILL [${skill.name}] INTEGRATED TO 100%`);
        }
        skill.progress = newProgress;
        updatedSkills[skillIndex] = skill;
        setSkills(updatedSkills);
        
        // Show floating XP animation
        const floatId = Date.now();
        setXpFloats(prev => [...prev, { id: floatId, amount: task.xpReward, taskId: task.id }]);
        setTimeout(() => {
          setXpFloats(prev => prev.filter(f => f.id !== floatId));
        }, 1000);
      }
    }
  };

  // Add a new habit synapse
  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newHabit = {
      id: Date.now(),
      name: name.trim(),
      icon: icon.trim() || '🔥',
      color,
      target,
      deadlineTime: deadlineTime || null
    };

    setHabits([...habits, newHabit]);
    
    // Reset fields
    setName('');
    setIcon('📖');
    setColor('--neon-cyan');
    setTarget('daily');
    setDeadlineTime('');
    setIsModalOpen(false);
  };

  // Modal handlers
  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay') {
      setIsModalOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  useEffect(() => {
    const onExpiry = () => {
      try {
        setDailyTasks(JSON.parse(localStorage.getItem(LS_KEYS.DAILY_SKILL_TASKS) || '[]'));
      } catch {
        setDailyTasks([]);
      }
    };
    window.addEventListener('tracker-expiry-updated', onExpiry);
    return () => window.removeEventListener('tracker-expiry-updated', onExpiry);
  }, [setDailyTasks]);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Color config labels
  const colorOptions = [
    { variable: '--neon-cyan', label: 'Cyan', colorCode: '#00d5ff' },
    { variable: '--neon-green', label: 'Green', colorCode: '#00e676' },
    { variable: '--neon-amber', label: 'Amber', colorCode: '#ffb300' },
    { variable: '--neon-magenta', label: 'Magenta', colorCode: '#ec4899' }
  ];

  const todayTasks = useMemo(() => {
    const tasks = dailyTasks.filter(t => t.date === todayStr);
    return tasks.sort((a, b) => {
      const aPrayer = a.mandatory || a.task === 'PRAYER' || a.skillName === 'PRAYER';
      const bPrayer = b.mandatory || b.task === 'PRAYER' || b.skillName === 'PRAYER';
      if (aPrayer && !bPrayer) return -1;
      if (!aPrayer && bPrayer) return 1;
      return 0;
    });
  }, [dailyTasks, todayStr]);

  const minutesUntil = (hhmm) => {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(':').map(Number);
    const d = new Date();
    d.setHours(h || 0, m || 0, 0, 0);
    return Math.floor((d.getTime() - nowTick) / 60000);
  };

  return (
    <div className="page-enter" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Dynamic Keyframe Injection for Pulsing Elements */}
      <style>{`
        @keyframes pulseGlow {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.9);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        .pulsing-streak-dot {
          animation: pulseGlow 1.8s infinite ease-in-out;
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="neon-magenta" style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Orbitron, sans-serif' }}>
            <Target size={24} />
            SKILL MISSIONS
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'Share Tech Mono, monospace' }}>
            SYSTEM://COGNITIVE.DAILY_DIRECTIVES
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="cyber-button"
            onClick={triggerOnboarding}
            style={{ 
              borderColor: 'var(--neon-magenta)',
              color: 'var(--neon-magenta)',
              fontFamily: 'Share Tech Mono, monospace'
            }}
          >
            REPLAN DAY
          </button>
          <button 
            className="cyber-button green"
            onClick={() => setIsModalOpen(true)}
            style={{ 
              boxShadow: '0 0 8px rgba(0, 230, 118, 0.2)',
              fontFamily: 'Share Tech Mono, monospace'
            }}
          >
            INJECT HABIT
          </button>
        </div>
      </div>

      {/* SKILL MISSIONS TODAY SECTION */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        {todayTasks.length > 0 ? (
          todayTasks.map(t => {
            const isPrayer = t.mandatory || t.task === 'PRAYER' || t.skillName === 'PRAYER';
            const isExpired = t.status === 'expired' || t.expired;
            const borderColor = isExpired ? 'rgba(255,36,66,0.3)' : (isPrayer ? 'var(--neon-amber)' : 'var(--border-dim)');
            const glowColor = isPrayer ? 'rgba(255, 179, 0, 0.25)' : 'rgba(236, 72, 153, 0.2)';
            const remaining = minutesUntil(t.deadlineTime);
            const urgentAmber = remaining !== null && remaining <= 60 && remaining > 15;
            const urgentRed = remaining !== null && remaining <= 15;
            const deadlineColor = isExpired ? '#ef4444' : urgentRed ? '#ef4444' : urgentAmber ? '#ffb300' : 'var(--text-secondary)';
            return (
            <div 
              key={t.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                border: t.completed ? `1px solid ${isPrayer ? '#ffb300' : 'var(--neon-magenta)'}` : `1px solid ${borderColor}`,
                boxShadow: t.completed ? `0 0 8px ${glowColor}` : 'none',
                position: 'relative',
                background: isExpired ? 'rgba(255,36,66,0.04)' : (isPrayer && prayerFlash ? 'rgba(255, 179, 0, 0.12)' : undefined)
              }}
            >
              {xpFloats.filter(f => f.taskId === t.id).map(f => (
                <div key={f.id} className="xp-float" style={{ top: '5px', right: '50px', color: f.prayer ? '#ffb300' : 'var(--neon-magenta)' }}>
                  {f.prayer ? f.amount : `+${f.amount} XP`}
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '24px', padding: '8px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: `1px solid rgba(255, 255, 255, 0.05)` }}>
                  <Rocket size={24} className={t.completed ? (isPrayer ? "neon-amber" : "neon-magenta") : ""} />
                </span>
                <div>
                  <h4 style={{ fontSize: '16px', color: isExpired ? 'var(--text-secondary)' : 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isPrayer && <Lock size={13} style={{ color: '#ffb300' }} />}
                    {t.skillName}
                    {t.deadlineTime && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                        <Clock size={12} style={{ color: deadlineColor }} />
                        <span className="mono" style={{ fontSize: '10px', color: deadlineColor, animation: urgentRed ? 'pulseGlow 0.6s infinite' : urgentAmber ? 'pulseGlow 1.3s infinite' : 'none' }}>
                          {t.deadlineTime}
                        </span>
                      </span>
                    )}
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)', background: `rgba(255, 255, 255, 0.02)`, padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                      {t.category}
                    </span>
                    <span className="mono" style={{ fontSize: '11px', fontWeight: 'bold', color: isPrayer ? '#ffb300' : 'var(--neon-magenta)' }}>
                      +{t.xpReward} XP
                    </span>
                  </div>
                </div>
              </div>
              <div>
                {isPrayer && (
                  <span className="mono" style={{
                    fontSize: '9px',
                    color: '#ffb300',
                    border: '1px solid rgba(255, 179, 0, 0.5)',
                    borderRadius: '999px',
                    padding: '2px 8px',
                    marginRight: '10px'
                  }}>
                    MANDATORY
                  </span>
                )}
                <button
                  onClick={() => handleToggleTask(t.id)}
                  disabled={t.completed || isExpired}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    border: `2px solid ${isPrayer ? '#ffb300' : 'var(--neon-magenta)'}`,
                    background: t.completed ? (isPrayer ? '#ffb300' : 'var(--neon-magenta)') : 'transparent',
                    boxShadow: t.completed ? `0 0 10px ${isPrayer ? '#ffb300' : 'var(--neon-magenta)'}` : `0 0 4px rgba(255, 255, 255, 0.05)`,
                    cursor: (t.completed || isExpired) ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  >
                  {isExpired ? (
                    <span className="mono" style={{ fontSize: '10px', color: '#ef4444', border: '1px solid rgba(239,68,68,0.6)', borderRadius: '999px', padding: '2px 6px' }}>
                      MISSED
                    </span>
                  ) : t.completed ? (
                    <span style={{ width: '12px', height: '12px', backgroundColor: '#000', borderRadius: '50%' }} />
                  ) : (
                    <span className="pulsing-streak-dot" style={{ width: '8px', height: '8px', backgroundColor: isPrayer ? '#ffb300' : 'var(--neon-magenta)', borderRadius: '50%' }} />
                  )}
                </button>
              </div>
              {!t.completed && !isExpired && t.deadlineTime && (
                <div style={{ position: 'absolute', left: '14px', right: '14px', bottom: '6px', height: '2px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  {(() => {
                    const [h, m] = t.deadlineTime.split(':').map(Number);
                    const now = new Date(nowTick);
                    const start = new Date(now);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(now);
                    end.setHours(h || 0, m || 0, 0, 0);
                    const total = Math.max(1, end.getTime() - start.getTime());
                    const elapsed = Math.max(0, Math.min(total, now.getTime() - start.getTime()));
                    const remainPct = Math.max(0, 100 - (elapsed / total) * 100);
                    const color = urgentRed ? '#ef4444' : urgentAmber ? '#ffb300' : 'var(--neon-cyan)';
                    return <div style={{ width: `${remainPct}%`, height: '100%', background: color, transition: 'width 60s linear' }} />;
                  })()}
                </div>
              )}
            </div>
          )})
        ) : (
          <div className="empty-state">
            <Target size={28} />
            <span style={{ fontSize: '12px', letterSpacing: '2px', fontFamily: 'Orbitron, sans-serif' }}>
              NO MISSIONS ASSIGNED. RUN DAILY BOOT TO SELECT.
            </span>
            <button className="cyber-button" onClick={triggerOnboarding} style={{ marginTop: '12px', borderColor: 'var(--neon-magenta)', color: 'var(--neon-magenta)' }}>REPLAN DAY</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-dim)' }} />
        <h2 className="neon-green" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Orbitron, sans-serif', margin: 0 }}>
          <CheckSquare size={18} />
          HABIT MATRIX
        </h2>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-dim)' }} />
      </div>

      {/* Habit Cards Matrix list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {habits.length > 0 ? (
          habits.map(h => {
            const currentStreak = streaks[h.id] || 0;
            const todayLog = habitLogs.find(log => log.habitId === h.id && log.date === todayStr);
            const isCompletedToday = !!todayLog && (todayLog.completed === true || (todayLog.completed === undefined && todayLog.status !== 'expired' && !todayLog.expired));
            const isExpiredToday = !!todayLog && (todayLog.status === 'expired' || todayLog.expired);
            const habitColor = h.color || '--neon-cyan';
            const habitColorValue = habitColor.startsWith('--') ? `var(${habitColor})` : habitColor;
            const habitIcon = h.icon || '🔥';
            const habitTarget = h.target || h.frequency || 'daily';

            return (
              <div 
                key={h.id}
                className={`card ${flashingHabitId === h.id ? 'habit-flash' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  padding: '16px 20px',
                  border: `1px solid var(--border-dim)`,
                  transition: 'border-color 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = habitColorValue}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-dim)'}
              >
                {/* Left: Icon + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '1 1 200px' }}>
                  <span style={{ 
                    fontSize: '24px', 
                    padding: '8px', 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    borderRadius: '8px',
                    border: `1px solid rgba(255, 255, 255, 0.05)`
                  }}>
                    {habitIcon}
                  </span>
                  <div>
                    <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '0.5px' }}>
                      {h.name}
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="mono" style={{ 
                        fontSize: '10px', 
                        color: habitColorValue, 
                        background: `rgba(255, 255, 255, 0.02)`,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        border: `1px solid rgba(255,255,255,0.06)`,
                        textTransform: 'uppercase'
                      }}>
                        {habitTarget}
                      </span>
                      <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        STREAK:
                      </span>
                      <span className="mono" style={{ fontSize: '12px', fontWeight: 'bold', color: habitColorValue, textShadow: `0 0 6px ${habitColorValue}` }}>
                        {currentStreak} DAYS
                      </span>
                      {h.deadlineTime && (
                        <span className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                          <Clock size={11} /> {h.deadlineTime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: 7-day mini streak dots */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {last7Days.map(day => {
                      const completed = habitLogs.some(log => log.habitId === h.id && log.date === day.dateStr && (log.completed === true || log.completed === undefined));
                      const isToday = day.isToday;

                      // Decide style of streak circle
                      let bg = 'transparent';
                      let border = '1px solid var(--border-dim)';
                      let className = '';
                      let glowStyle = {};

                      if (completed) {
                        bg = habitColorValue;
                        border = `1px solid ${habitColorValue}`;
                        glowStyle = { boxShadow: `0 0 6px ${habitColorValue}` };
                      } else if (isToday) {
                        border = `1px solid ${habitColorValue}`;
                        className = 'pulsing-streak-dot';
                      }

                      return (
                        <div 
                          key={day.dateStr}
                          title={`${day.label}: ${completed ? 'COMPLETED' : isToday ? 'TODAY (INCOMPLETE)' : 'MISSED'}`}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <div 
                            className={className}
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: bg,
                              border: border,
                              transition: 'all 0.2s ease',
                              ...glowStyle
                            }}
                          />
                          <span style={{ fontSize: '8px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {day.label[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Today's Action checkbox */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    onClick={() => handleToggleLog(h.id, todayStr)}
                    disabled={isExpiredToday}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      border: `2px solid ${habitColorValue}`,
                      background: isCompletedToday ? habitColorValue : 'transparent',
                      boxShadow: isCompletedToday ? `0 0 10px ${habitColorValue}` : `0 0 4px rgba(255, 255, 255, 0.05)`,
                      cursor: isExpiredToday ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative'
                    }}
                    title={isCompletedToday ? "Mark Incomplete" : "Mark Complete Today"}
                  >
                    {isExpiredToday ? (
                      <span className="mono" style={{ fontSize: '9px', color: '#ef4444' }}>MISSED</span>
                    ) : isCompletedToday ? (
                      <span style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#000000',
                        borderRadius: '50%'
                      }} />
                    ) : (
                      <span className="pulsing-streak-dot" style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: habitColorValue,
                        borderRadius: '50%'
                      }} />
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteHabit(h.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-dim)',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                    title="Delete Habit"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <CheckSquare size={28} />
            <span style={{ fontSize: '12px', letterSpacing: '2px', fontFamily: 'Orbitron, sans-serif' }}>
              NO HABITS TRACKED. ESTABLISH DAILY ROUTINES.
            </span>
          </div>
        )}
      </div>

      {/* Info telemetry banner */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Shield size={24} className="neon-cyan" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', fontFamily: 'Orbitron, sans-serif' }}>SYNAPSE CONSISTENCY RULE</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Habit streak compiles dynamically backward from today. Keep the loop closed or the synapse degrades instantly.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Compass size={24} className="neon-amber" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', fontFamily: 'Orbitron, sans-serif' }}>BIOMETRIC STIMULATOR</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Enforce physical somatic calibrations alongside cognitive nodes to level up your entire architecture simultaneously.
            </p>
          </div>
        </div>
      </div>

      {/* Adding Habit Modal */}
      {isModalOpen && (
        <div 
          id="modal-overlay"
          onClick={handleOverlayClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div 
            className="card"
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--neon-green)',
              boxShadow: '0 0 20px rgba(0, 230, 118, 0.3)',
              animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              gap: '20px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '12px' }}>
              <h3 className="neon-green" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Orbitron, sans-serif' }}>
                <Sparkles size={18} />
                INJECT HABIT SYNAPSE
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-secondary)', 
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddHabit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Habit Name input */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'Share Tech Mono, monospace' }}>
                  SYNAPSE IDENTIFIER (HABIT NAME)
                </label>
                <input 
                  type="text" 
                  className="cyber-input" 
                  placeholder="e.g. Morning Meditation, Read 10 Pages..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Emoji Icon + Target Frequency Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'Share Tech Mono, monospace' }}>
                    EMOJI IDENTIFIER
                  </label>
                  <input 
                    type="text" 
                    className="cyber-input" 
                    placeholder="📖, 💻, 👟, 💧..."
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    required
                    style={{ textAlign: 'center', fontSize: '18px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'Share Tech Mono, monospace' }}>
                    FREQUENCY ITERATION
                  </label>
                  <select 
                    className="cyber-select" 
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  >
                    <option value="daily">DAILY CYCLE</option>
                    <option value="weekly">WEEKLY REPETITION</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'Share Tech Mono, monospace' }}>
                  MUST COMPLETE BY (optional)
                </label>
                <input
                  type="time"
                  className="cyber-input"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  style={{ borderColor: 'var(--neon-cyan)', backgroundColor: '#000000' }}
                />
                <p className="mono" style={{ marginTop: '6px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                  Leave empty to expire at end of day
                </p>
              </div>

              {/* Color Selector Grid */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: 'Share Tech Mono, monospace' }}>
                  ACCENT COLOR PROTOCOL
                </label>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                  {colorOptions.map(option => {
                    const isSelected = color === option.variable;
                    return (
                      <button
                        key={option.variable}
                        type="button"
                        onClick={() => setColor(option.variable)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          background: isSelected ? 'rgba(255,255,255,0.02)' : 'transparent',
                          border: isSelected ? `1px solid ${option.colorCode}` : '1px solid var(--border-dim)',
                          padding: '8px 4px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? `0 0 8px ${option.colorCode}` : 'none'
                        }}
                      >
                        <div style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: option.colorCode
                        }} />
                        <span style={{ fontSize: '10px', color: isSelected ? option.colorCode : 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {option.label.toUpperCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-dim)', paddingTop: '16px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="cyber-button dim" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1 }}
                >
                  DISCARD SYNAPSE
                </button>
                <button 
                  type="submit" 
                  className="cyber-button green" 
                  style={{ flex: 2 }}
                >
                  LOAD INTO NEURAL LOOP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
