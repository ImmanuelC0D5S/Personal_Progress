import React, { useState, useEffect, useMemo } from 'react';
import DailyOnboarding from './components/DailyOnboarding';


import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutGrid, Dumbbell, CheckSquare, Cpu, Settings } from 'lucide-react';

// Hooks & Constants
import { useLocalStorage } from './hooks/useLocalStorage';
import { useExpiryEngine } from './hooks/useExpiryEngine';
import { LS_KEYS } from './constants';

// Pages
import DashboardPage from './pages/DashboardPage';
import WorkoutsPage from './pages/WorkoutsPage';
import HabitsPage from './pages/HabitsPage';
import SkillsPage from './pages/SkillsPage';
import CoachPanel from './components/CoachPanel';

function App() {
  const RESET_FLASH_KEY = 'tracker_reset_flash';

  // LocalStorage Core States
  const [workouts, setWorkouts] = useLocalStorage(LS_KEYS.WORKOUTS, []);
  const [habits, setHabits] = useLocalStorage(LS_KEYS.HABITS, []);
  const [habitLogs, setHabitLogs] = useLocalStorage(LS_KEYS.HABIT_LOGS, []);
  const [goals, setGoals] = useLocalStorage(LS_KEYS.GOALS, []);
  const [skills, setSkills] = useLocalStorage(LS_KEYS.SKILLS, []);
  useExpiryEngine({ habits, habitLogs, setHabitLogs });

  // Time & Date System State
  const [currentTime, setCurrentTime] = useState('');
  const [showDailyOnboarding, setShowDailyOnboarding] = useState(false);
  const [onboardingStartStep, setOnboardingStartStep] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showResetFlash, setShowResetFlash] = useState(false);
  const [penalties, setPenalties] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEYS.PENALTIES) || '[]');
    } catch {
      return [];
    }
  });
  const [showPenaltyScreen, setShowPenaltyScreen] = useState(false);
  const [currentPenalty, setCurrentPenalty] = useState(null);
  const [penaltyReason, setPenaltyReason] = useState('');

  const getLocalDateString = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  useEffect(() => {
    const todayKey = getLocalDateString(new Date());
    const lastOnboardingDate = localStorage.getItem(LS_KEYS.DAILY_ONBOARDING_DATE);
    const updatedPenalties = [...penalties];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);

    const alreadyTracked = updatedPenalties.some(p => p.date === yesterdayStr && p.task === 'PRAYER');
    if (!alreadyTracked) {
      const tasks = JSON.parse(localStorage.getItem(LS_KEYS.DAILY_SKILL_TASKS) || '[]');
      const prayerTask = tasks.find(t => t.date === yesterdayStr && (t.mandatory || t.task === 'PRAYER' || t.skillName === 'PRAYER'));
      const completed = !!prayerTask?.completed;
      updatedPenalties.push({
        date: yesterdayStr,
        task: 'PRAYER',
        completed,
        penaltyActive: !completed,
        acknowledged: completed,
        reason: completed ? '' : null,
        xpDeducted: 0
      });
    }

    localStorage.setItem(LS_KEYS.PENALTIES, JSON.stringify(updatedPenalties));
    setPenalties(updatedPenalties);

    const nextPenalty = updatedPenalties.find(p => p.task === 'PRAYER' && p.penaltyActive);
    if (nextPenalty) {
      setCurrentPenalty(nextPenalty);
      setShowPenaltyScreen(true);
    } else if (lastOnboardingDate !== todayKey) {
      setOnboardingStartStep(1);
      setShowDailyOnboarding(true);
    }
  }, []);

  useEffect(() => {
    const flash = sessionStorage.getItem(RESET_FLASH_KEY);
    if (flash === '1') {
      setShowResetFlash(true);
      sessionStorage.removeItem(RESET_FLASH_KEY);
      const timeoutId = setTimeout(() => setShowResetFlash(false), 2000);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  const todayStr = getLocalDateString();

  // Habit completion progress calculations
  const habitProgress = useMemo(() => {
    if (habits.length === 0) return 0;
    const completedToday = habits.filter(h => 
      habitLogs.some(log => log.habitId === h.id && log.date === todayStr && (log.completed === true || log.completed === undefined))
    ).length;
    return Math.round((completedToday / habits.length) * 100);
  }, [habits, habitLogs, todayStr]);

  // Color transition based on progress percentage
  const progressColor = useMemo(() => {
    if (habitProgress < 40) return '#ef4444'; // Red
    if (habitProgress < 85) return '#ffb300'; // Amber
    return '#00d5ff'; // Cyan
  }, [habitProgress]);

  // Settings export JSON handler
  const handleExportData = () => {
    try {
      const exportObj = {};
      Object.keys(LS_KEYS).forEach(k => {
        const keyName = LS_KEYS[k];
        const val = localStorage.getItem(keyName);
        if (val !== null) {
          exportObj[keyName] = JSON.parse(val);
        }
      });
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchor = document.createElement('a');
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const filename = `tracker-export-${y}-${m}-${d}.json`;

      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Export failed", e);
      alert("CRITICAL: Local Storage export protocol failed.");
    }
  };

  const handleSoftReset = () => {
    const keysToClear = [
      LS_KEYS.WORKOUTS,
      LS_KEYS.HABIT_LOGS,
      LS_KEYS.DAILY_SKILL_TASKS,
      LS_KEYS.DAILY_ONBOARDING_DATE,
      LS_KEYS.DAILY_SKILLS,
      'tracker_last_briefing',
    ];

    keysToClear.forEach((key) => localStorage.removeItem(key));
    sessionStorage.setItem(RESET_FLASH_KEY, '1');
    window.location.href = '/';
  };

  const handleAcknowledgePenalty = () => {
    if (!currentPenalty || penaltyReason.trim().length < 10) return;
    const updated = penalties.map(p => {
      if (p.date === currentPenalty.date && p.task === 'PRAYER') {
        const alreadyDeducted = p.xpDeducted && p.xpDeducted > 0;
        if (!alreadyDeducted) {
          const currentLoss = parseInt(localStorage.getItem(LS_KEYS.TOTAL_XP_PENALTY) || '0', 10);
          localStorage.setItem(LS_KEYS.TOTAL_XP_PENALTY, String(currentLoss + 50));
        }
        return {
          ...p,
          penaltyActive: false,
          acknowledged: true,
          reason: penaltyReason.trim(),
          xpDeducted: alreadyDeducted ? p.xpDeducted : 50
        };
      }
      return p;
    });
    localStorage.setItem(LS_KEYS.PENALTIES, JSON.stringify(updated));
    setPenalties(updated);
    setShowPenaltyScreen(false);
    setCurrentPenalty(null);
    setPenaltyReason('');
    const todayKey = getLocalDateString(new Date());
    const lastOnboardingDate = localStorage.getItem(LS_KEYS.DAILY_ONBOARDING_DATE);
    if (lastOnboardingDate !== todayKey) {
      setOnboardingStartStep(1);
      setShowDailyOnboarding(true);
    }
  };

  const unackPenalty = penalties.find(p => p.task === 'PRAYER' && p.penaltyActive);
  const breachRows = penalties.filter(p => p.task === 'PRAYER' && p.completed === false);
  const totalXpLost = breachRows.reduce((sum, p) => sum + (p.xpDeducted || 0), 0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>

      {/* Top Header Bar */}
      <header style={{
        height: '56px',
        backgroundColor: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-dim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span 
            className="neon-cyan" 
            style={{ 
              fontFamily: 'var(--font-display)', 
              fontWeight: 900, 
              fontSize: '18px', 
              letterSpacing: '2px' 
            }}
          >
            SYS://PROGRESS
          </span>
          {unackPenalty && (
            <span
              title="PROTOCOL BREACH — TAP TO REVIEW"
              onClick={() => {
                setCurrentPenalty(unackPenalty);
                setShowPenaltyScreen(true);
              }}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                boxShadow: '0 0 10px #ef4444',
                animation: 'softPulse 1.2s infinite',
                cursor: 'pointer'
              }}
            />
          )}
          <span className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)', padding: '2px 6px', border: '1px solid var(--border-dim)', borderRadius: '4px' }}>
            V1.0.8
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            className="mono neon-cyan" 
            style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '14px', 
              letterSpacing: '1px' 
            }}
          >
            {currentTime || 'SYSTEM BOOTING...'}
          </div>
          <button
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--neon-cyan)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            title="System Settings"
          >
            <Settings size={18} />
          </button>
        </div>

        {isSettingsOpen && (
          <div style={{
            position: 'absolute',
            top: '50px',
            right: '16px',
            minWidth: '260px',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-dim)',
            borderRadius: '8px',
            padding: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            zIndex: 300
          }}>
            <button
              className="cyber-button"
              onClick={() => {
                handleExportData();
                setIsSettingsOpen(false);
              }}
              style={{ width: '100%', marginBottom: '8px' }}
            >
              EXPORT SYSTEM TELEMETRY
            </button>
            <button
              className="cyber-button"
              onClick={() => {
                setShowResetConfirm(true);
                setIsSettingsOpen(false);
              }}
              style={{
                width: '100%',
                borderColor: 'var(--neon-amber)',
                color: 'var(--neon-amber)'
              }}
            >
              RESET PROGRESS DATA
            </button>
            <div style={{ marginTop: '10px', borderTop: '1px dashed var(--border-dim)', paddingTop: '10px' }}>
              <div className="mono" style={{ fontSize: '11px', color: '#ef4444', marginBottom: '6px' }}>BREACH LOG</div>
              <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {breachRows.length > 0 ? breachRows.map((b) => (
                  <div key={`${b.date}_${b.task}`} style={{ border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', padding: '6px' }}>
                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-primary)' }}>{b.date}</div>
                    <div className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{b.reason || 'No reason recorded'}</div>
                    <div className="mono" style={{ fontSize: '10px', color: '#ef4444' }}>-{b.xpDeducted || 0} XP</div>
                  </div>
                )) : (
                  <div className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>No breaches logged.</div>
                )}
              </div>
              <div className="mono" style={{ marginTop: '8px', fontSize: '10px', color: '#ef4444' }}>
                TOTAL XP LOST: -{totalXpLost}
              </div>
            </div>
          </div>
        )}

        {showDailyOnboarding && !showPenaltyScreen && (
          <DailyOnboarding
            startStep={onboardingStartStep}
            initialSelected={() => {
              const str = localStorage.getItem(LS_KEYS.DAILY_SKILLS);
              if (!str) return [];
              const obj = JSON.parse(str);
              if (obj.date === getLocalDateString(new Date())) return obj.skillIds || [];
              return [];
            }}
            onClose={() => setShowDailyOnboarding(false)}
          />
        )}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${habitProgress}%`,
            height: '100%',
            backgroundColor: progressColor,
            boxShadow: `0 0 8px ${progressColor}`,
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.4s ease'
          }} />
        </div>
      </header>

      {showResetFlash && (
        <div style={{
          position: 'fixed',
          top: '64px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 230, 118, 0.12)',
          border: '1px solid var(--neon-green)',
          color: 'var(--neon-green)',
          padding: '10px 16px',
          borderRadius: '6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          letterSpacing: '0.8px',
          zIndex: 250
        }}>
          SYSTEM RESET COMPLETE. HISTORY PURGED. SKILLS RETAINED.
        </div>
      )}

      {/* Main Content Area (Scrollable) */}
      <main style={{
        marginTop: '56px',
        marginBottom: '64px',
        flexGrow: 1,
        overflowY: 'auto',
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '1200px',
        marginInline: 'auto'
      }}>
        <Routes>
          <Route 
            path="/" 
            element={
              <DashboardPage 
                workouts={workouts} 
                habits={habits} 
                habitLogs={habitLogs} 
                goals={goals} 
                skills={skills} 
                setWorkouts={setWorkouts}
                setHabits={setHabits}
                setHabitLogs={setHabitLogs}
                setGoals={setGoals}
                setSkills={setSkills}
              />
            } 
          />
          <Route 
            path="/workouts" 
            element={
              <WorkoutsPage 
                workouts={workouts} 
                setWorkouts={setWorkouts} 
              />
            } 
          />
          <Route 
            path="/habits" 
            element={
              <HabitsPage 
                habits={habits} 
                setHabits={setHabits} 
                habitLogs={habitLogs} 
                setHabitLogs={setHabitLogs} 
                skills={skills}
                setSkills={setSkills}
                triggerOnboarding={() => {
                  setOnboardingStartStep(2);
                  setShowDailyOnboarding(true);
                }}
              />
            } 
          />
          <Route 
            path="/skills" 
            element={
              <SkillsPage 
                skills={skills} 
                setSkills={setSkills} 
              />
            } 
          />
        </Routes>
      </main>

      {/* Bottom Console Tab Navigation */}
      <nav style={{
        height: '64px',
        backgroundColor: '#000000',
        borderTop: '1px solid var(--border-dim)',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 8px',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        <NavLink 
          to="/" 
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--neon-cyan)' : 'var(--text-dim)',
            fontFamily: 'var(--font-display)',
            fontSize: '10px',
            fontWeight: 700,
            transition: 'all 0.2s ease',
            gap: '4px',
            width: '25%',
            height: '100%',
            borderBottom: isActive ? '2px solid var(--neon-cyan)' : '2px solid transparent',
            textShadow: isActive ? '0 0 8px rgba(0, 213, 255, 0.5)' : 'none',
            boxShadow: isActive ? 'inset 0 -6px 8px -6px rgba(0, 213, 255, 0.2)' : 'none'
          })}
        >
          {({ isActive }) => (
            <>
              <LayoutGrid 
                size={20} 
                style={{ 
                  strokeWidth: isActive ? 2.5 : 2
                }} 
              />
              <span>DASHBOARD</span>
            </>
          )}
        </NavLink>

        <NavLink 
          to="/workouts" 
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--neon-cyan)' : 'var(--text-dim)',
            fontFamily: 'var(--font-display)',
            fontSize: '10px',
            fontWeight: 700,
            transition: 'all 0.2s ease',
            gap: '4px',
            width: '25%',
            height: '100%',
            borderBottom: isActive ? '2px solid var(--neon-cyan)' : '2px solid transparent',
            textShadow: isActive ? '0 0 8px rgba(0, 213, 255, 0.5)' : 'none',
            boxShadow: isActive ? 'inset 0 -6px 8px -6px rgba(0, 213, 255, 0.2)' : 'none'
          })}
        >
          {({ isActive }) => (
            <>
              <Dumbbell 
                size={20} 
                style={{ 
                  strokeWidth: isActive ? 2.5 : 2
                }} 
              />
              <span>WORKOUTS</span>
            </>
          )}
        </NavLink>

        <NavLink 
          to="/habits" 
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--neon-cyan)' : 'var(--text-dim)',
            fontFamily: 'var(--font-display)',
            fontSize: '10px',
            fontWeight: 700,
            transition: 'all 0.2s ease',
            gap: '4px',
            width: '25%',
            height: '100%',
            borderBottom: isActive ? '2px solid var(--neon-cyan)' : '2px solid transparent',
            textShadow: isActive ? '0 0 8px rgba(0, 213, 255, 0.5)' : 'none',
            boxShadow: isActive ? 'inset 0 -6px 8px -6px rgba(0, 213, 255, 0.2)' : 'none'
          })}
        >
          {({ isActive }) => (
            <>
              <CheckSquare 
                size={20} 
                style={{ 
                  strokeWidth: isActive ? 2.5 : 2
                }} 
              />
              <span>HABITS</span>
            </>
          )}
        </NavLink>

        <NavLink 
          to="/skills" 
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: isActive ? 'var(--neon-cyan)' : 'var(--text-dim)',
            fontFamily: 'var(--font-display)',
            fontSize: '10px',
            fontWeight: 700,
            transition: 'all 0.2s ease',
            gap: '4px',
            width: '25%',
            height: '100%',
            borderBottom: isActive ? '2px solid var(--neon-cyan)' : '2px solid transparent',
            textShadow: isActive ? '0 0 8px rgba(0, 213, 255, 0.5)' : 'none',
            boxShadow: isActive ? 'inset 0 -6px 8px -6px rgba(0, 213, 255, 0.2)' : 'none'
          })}
        >
          {({ isActive }) => (
            <>
              <Cpu 
                size={20} 
                style={{ 
                  strokeWidth: isActive ? 2.5 : 2
                }} 
              />
              <span>SKILLS</span>
            </>
          )}
        </NavLink>
      </nav>

      {/* AI Coach Integration */}
      <CoachPanel />

      {showPenaltyScreen && currentPenalty && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(255,36,66,0.08)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '18px',
          pointerEvents: 'auto'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255, 0, 0, 0.06), rgba(255, 0, 0, 0.06) 1px, transparent 1px, transparent 4px)',
            pointerEvents: 'none',
            zIndex: 0
          }} />
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '620px', border: '1px solid #ef4444', boxShadow: '0 0 20px rgba(239,68,68,0.4)', position: 'relative', zIndex: 2 }}
          >
            <h2 style={{ color: '#ef4444', fontFamily: 'Orbitron, sans-serif', fontSize: '28px', letterSpacing: '2px', marginBottom: '8px' }}>
              ⚠ PROTOCOL BREACH DETECTED
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Prayer protocol was not executed on {currentPenalty.date}
            </p>
            <div style={{ border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '12px', marginBottom: '14px', background: 'rgba(239,68,68,0.08)' }}>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PENALTY ASSIGNED</div>
              <div style={{ color: '#ef4444', fontFamily: 'Orbitron, sans-serif', fontSize: '38px', textShadow: '0 0 10px rgba(239,68,68,0.5)' }}>
                -50 XP
              </div>
            </div>
            <label className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              STATE YOUR REASON (required to proceed)
            </label>
            <input
              type="text"
              className="cyber-input"
              autoFocus
              placeholder="Minimum 10 characters..."
              value={penaltyReason}
              onChange={(e) => setPenaltyReason(e.target.value)}
            />
            <div className="mono" style={{ marginTop: '6px', fontSize: '10px', color: penaltyReason.trim().length >= 10 ? 'var(--neon-green)' : 'var(--text-secondary)' }}>
              {penaltyReason.trim().length}/10 characters
            </div>
            <button
              className="cyber-button dim"
              onClick={() => {
                setShowPenaltyScreen(false);
                setCurrentPenalty(null);
              }}
              style={{ marginTop: '10px', width: '100%' }}
            >
              CLOSE (REVIEW LATER)
            </button>
            <button
              className="cyber-button"
              disabled={penaltyReason.trim().length < 10}
              onClick={handleAcknowledgePenalty}
              style={{
                marginTop: '14px',
                width: '100%',
                borderColor: penaltyReason.trim().length >= 10 ? '#ef4444' : 'var(--border-dim)',
                color: penaltyReason.trim().length >= 10 ? '#ef4444' : 'var(--text-dim)',
                cursor: penaltyReason.trim().length >= 10 ? 'pointer' : 'not-allowed'
              }}
            >
              ACKNOWLEDGE & PROCEED
            </button>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          zIndex: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '560px',
            border: '1px solid var(--neon-amber)'
          }}>
            <h3 className="neon-amber" style={{ marginBottom: '12px' }}>SOFT RESET PROTOCOL</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '18px', fontSize: '14px' }}>
              This will clear activity history, habit logs, workout sessions, daily tasks and heatmap data. Your skills, habit definitions, and goals will be preserved.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="cyber-button"
                onClick={handleSoftReset}
                style={{
                  flex: 1,
                  borderColor: '#ef4444',
                  color: '#ef4444'
                }}
              >
                CONFIRM RESET
              </button>
              <button
                className="cyber-button dim"
                onClick={() => setShowResetConfirm(false)}
                style={{ flex: 1 }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
