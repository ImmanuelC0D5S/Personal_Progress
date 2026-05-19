import React, { useState, useEffect } from 'react';
import { LS_KEYS } from '../constants';
import {
  Check, Plus, Rocket, X,
  Zap, Layers, Triangle, Circle, Minus, Anchor, Armchair, ChevronDown, Wind,
  Sunrise, Lock, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function DailyOnboarding({ onClose, startStep = 1, initialSelected = [] }) {
  const [step, setStep] = useState(startStep);
  const [skills, setSkills] = useState(() => JSON.parse(localStorage.getItem(LS_KEYS.SKILLS) || '[]'));
  const [habits] = useState(() => JSON.parse(localStorage.getItem(LS_KEYS.HABITS) || '[]'));
  const [habitLogs] = useState(() => JSON.parse(localStorage.getItem(LS_KEYS.HABIT_LOGS) || '[]'));
  
  const [selectedSkillIds, setSelectedSkillIds] = useState(initialSelected);
  
  // Custom skill form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillXp, setNewSkillXp] = useState(100);
  const [skillDeadlines, setSkillDeadlines] = useState({});
  const [trainingType, setTrainingType] = useState('');
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [trainingNote, setTrainingNote] = useState('');

  const getLocalDateString = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  const todayStr = getLocalDateString();
  const existingTraining = (() => {
    try {
      const raw = localStorage.getItem(LS_KEYS.DAILY_TRAINING);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.date === todayStr ? parsed : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (existingTraining) {
      setTrainingType(existingTraining.type || '');
      setSelectedMuscleGroups(existingTraining.muscleGroups || []);
      setTrainingNote(existingTraining.note || '');
    }
    try {
      const existingTasks = JSON.parse(localStorage.getItem(LS_KEYS.DAILY_SKILL_TASKS) || '[]');
      const todayTasks = existingTasks.filter(t => t.date === todayStr);
      const map = {};
      todayTasks.forEach((t) => {
        if (t.skillId) map[t.skillId] = t.deadlineTime || '';
      });
      setSkillDeadlines(map);
    } catch {
      setSkillDeadlines({});
    }
  }, []);

  // Streak calculation (simple total completed logs across all habits)
  const totalHabitStreak = habits.length ? habitLogs.length : 0; 
  // In reality a more complex streak could be used, but keeping it simple for the overlay stats
  
  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    
    const newSkill = {
      id: Date.now(),
      name: newSkillName.trim(),
      category: newSkillCategory.trim() || 'Custom',
      xp: parseInt(newSkillXp) || 100,
      status: 'unlocked',
      progress: 0,
      parent: null
    };
    
    const updatedSkills = [...skills, newSkill];
    setSkills(updatedSkills);
    localStorage.setItem(LS_KEYS.SKILLS, JSON.stringify(updatedSkills));
    
    setSelectedSkillIds([...selectedSkillIds, newSkill.id]);
    
    setNewSkillName('');
    setNewSkillCategory('');
    setNewSkillXp(100);
    setShowAddForm(false);
  };

  const toggleSkill = (id) => {
    if (selectedSkillIds.includes(id)) {
      setSelectedSkillIds(selectedSkillIds.filter(x => x !== id));
    } else {
      setSelectedSkillIds([...selectedSkillIds, id]);
    }
  };

  const handleDeploy = () => {
    if (!trainingType) {
      alert('Select a training type to continue.');
      return;
    }

    if (trainingType !== 'REST' && selectedMuscleGroups.length === 0) {
      alert('Select at least 1 target muscle group to continue.');
      return;
    }

    const existingTasksStr = localStorage.getItem(LS_KEYS.DAILY_SKILL_TASKS);
    let existingTasks = existingTasksStr ? JSON.parse(existingTasksStr) : [];
    existingTasks = existingTasks.filter(t => t.date === todayStr);
    
    const newTasks = [];

    const existingPrayer = existingTasks.find(t => t.task === 'PRAYER');
    if (existingPrayer) {
      newTasks.push(existingPrayer);
    } else {
      newTasks.push({
        id: `dt_prayer_${todayStr}`,
        date: todayStr,
        task: 'PRAYER',
        skillName: 'PRAYER',
        category: 'MANDATORY',
        completed: false,
        xpReward: 10,
        mandatory: true,
        deadlineTime: '23:59',
      });
    }
    
    selectedSkillIds.forEach(id => {
      const existing = existingTasks.find(t => t.skillId === id);
      if (existing) {
        newTasks.push({ ...existing, deadlineTime: skillDeadlines[id] || null });
      } else {
        const skillObj = skills.find(s => s.id === id);
        if (skillObj) {
          newTasks.push({
            id: 'dt_' + Date.now() + '_' + id,
            skillId: id,
            skillName: skillObj.name,
            category: skillObj.category,
            date: todayStr,
            completed: false,
            xpReward: skillObj.xp,
            deadlineTime: skillDeadlines[id] || null,
          });
        }
      }
    });
    
    existingTasks.forEach(et => {
      if (!selectedSkillIds.includes(et.skillId) && et.completed) {
        newTasks.push(et); 
      }
    });

    localStorage.setItem(LS_KEYS.DAILY_SKILLS, JSON.stringify({ date: todayStr, skillIds: selectedSkillIds }));
    localStorage.setItem(LS_KEYS.DAILY_SKILL_TASKS, JSON.stringify(newTasks));
    localStorage.setItem(LS_KEYS.DAILY_ONBOARDING_DATE, todayStr);
    localStorage.setItem(LS_KEYS.DAILY_TRAINING, JSON.stringify({
      date: todayStr,
      type: trainingType,
      muscleGroups: trainingType === 'REST' ? [] : selectedMuscleGroups,
      note: trainingNote.trim()
    }));
    
    onClose(true);
  };

  const availableSkills = skills.filter(s => s.status !== 'complete');
  const selectedSkills = skills.filter(s => selectedSkillIds.includes(s.id));
  const muscleCards = [
    { id: 'chest', label: 'Chest', icon: Zap },
    { id: 'back', label: 'Back', icon: Layers },
    { id: 'legs', label: 'Legs', icon: Triangle },
    { id: 'abs', label: 'Core / Abs', icon: Circle },
    { id: 'shoulders', label: 'Shoulders', icon: Minus },
    { id: 'biceps', label: 'Biceps', icon: Anchor },
    { id: 'triceps', label: 'Triceps', icon: Zap },
    { id: 'glutes', label: 'Glutes', icon: Armchair },
    { id: 'calves', label: 'Calves', icon: ChevronDown },
    { id: 'mobility', label: 'Mobility', icon: Wind },
  ];

  const toggleGroup = (group) => {
    if (selectedMuscleGroups.includes(group)) {
      setSelectedMuscleGroups(selectedMuscleGroups.filter(g => g !== group));
    } else {
      setSelectedMuscleGroups([...selectedMuscleGroups, group]);
    }
  };

  const handleToggleAllGroups = () => {
    const allLabels = muscleCards.map((m) => m.label);
    if (selectedMuscleGroups.length === allLabels.length) {
      setSelectedMuscleGroups([]);
      return;
    }
    setSelectedMuscleGroups(allLabels);
  };

  return (
    <div className="briefing-overlay page-enter" style={{ zIndex: 2000, display: 'flex', flexDirection: 'column', padding: '24px' }}>
      
      {/* Progress Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ 
            width: '12px', height: '12px', borderRadius: '50%', 
            backgroundColor: step >= i ? 'var(--neon-cyan)' : 'transparent',
            border: '1px solid var(--neon-cyan)',
            boxShadow: step >= i ? '0 0 8px var(--neon-cyan)' : 'none',
            transition: 'all 0.3s'
          }} />
        ))}
      </div>

      <div className="briefing-content" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        
        {step === 1 && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h1 className="neon-cyan" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '32px', letterSpacing: '2px', textShadow: '0 0 10px var(--neon-cyan)' }}>
              DAILY SYSTEM BOOT
            </h1>
            <p className="mono" style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>{todayStr}</p>
            
            <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-around', border: '1px solid var(--neon-cyan)', background: 'rgba(0, 213, 255, 0.05)' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px', fontFamily: 'Share Tech Mono, monospace' }}>TOTAL HABIT LOGS</div>
                <div className="neon-cyan" style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalHabitStreak}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px', fontFamily: 'Share Tech Mono, monospace' }}>SYSTEM STATUS</div>
                <div className="neon-green" style={{ fontSize: '24px', fontWeight: 'bold' }}>OPTIMAL</div>
              </div>
            </div>

            <button className="cyber-button" onClick={() => setStep(2)} style={{ padding: '16px', fontSize: '18px', marginTop: '20px' }}>
              INITIATE
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 className="neon-cyan" style={{ fontFamily: 'Orbitron, sans-serif' }}>SELECT SKILL MISSIONS FOR TODAY</h2>
              <p className="mono" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>What are you leveling up today, operative?</p>
            </div>

            <div className="card" style={{
              border: '1px solid var(--neon-amber)',
              boxShadow: '0 0 12px rgba(255, 179, 0, 0.25)',
              padding: '20px',
              position: 'relative',
              background: 'rgba(255, 179, 0, 0.06)'
            }}>
              <Lock size={14} style={{ position: 'absolute', top: '10px', right: '10px', color: '#ffb300' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 179, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffb300'
                }}>
                  <Sunrise size={18} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Orbitron, sans-serif', color: '#ffb300', fontSize: '18px', letterSpacing: '1px' }}>
                    PRAYER
                  </div>
                  <div style={{ fontFamily: '"Share Tech Mono", monospace', color: 'var(--text-secondary)', fontSize: '11px' }}>
                    COMPULSORY DAILY PROTOCOL
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 className="neon-amber" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '15px' }}>TODAY'S PHYSICAL PROTOCOL</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                {['GYM', 'CALISTHENICS', 'REST'].map((t) => {
                  const selected = trainingType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTrainingType(t);
                        if (t === 'REST') {
                          setSelectedMuscleGroups([]);
                        }
                      }}
                      style={{
                        minHeight: '56px',
                        borderRadius: '8px',
                        border: selected ? '1px solid var(--neon-cyan)' : '1px solid var(--border-dim)',
                        background: selected ? 'rgba(0, 213, 255, 0.12)' : 'transparent',
                        color: selected ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                        boxShadow: selected ? '0 0 10px rgba(0, 213, 255, 0.25)' : 'none',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        cursor: 'pointer'
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              {trainingType === 'REST' && (
                <div className="mono" style={{ fontSize: '12px', color: 'var(--neon-green)' }}>
                  RECOVERY MODE ACTIVE. COGNITIVE MISSIONS ONLY.
                </div>
              )}

              {(trainingType === 'GYM' || trainingType === 'CALISTHENICS') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <h4 className="neon-cyan" style={{ fontSize: '13px', marginBottom: '4px' }}>TARGET MUSCLE GROUPS</h4>
                    <p className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Select all you're training today</p>
                  </div>
                  <div className="muscle-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: '8px'
                  }}>
                    {muscleCards.map((groupItem) => {
                      const group = groupItem.label;
                      const Icon = groupItem.icon;
                      const selected = selectedMuscleGroups.includes(group);
                      return (
                        <button
                          key={groupItem.id}
                          type="button"
                          onClick={() => toggleGroup(group)}
                          style={{
                            minHeight: '80px',
                            borderRadius: '10px',
                            border: selected ? '1px solid var(--neon-cyan)' : '1px solid var(--border-dim)',
                            background: selected ? 'rgba(0, 213, 255, 0.14)' : 'transparent',
                            color: selected ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                            boxShadow: selected ? '0 0 8px rgba(0, 213, 255, 0.25)' : 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px',
                            transition: 'border-color 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!selected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)';
                          }}
                          onMouseLeave={(e) => {
                            if (!selected) e.currentTarget.style.borderColor = 'var(--border-dim)';
                          }}
                        >
                          <Icon size={18} />
                          <span style={{ fontSize: '10px', fontFamily: '"Share Tech Mono", monospace', textAlign: 'center' }}>
                            {group}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAllGroups}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'none',
                      border: 'none',
                      color: 'var(--neon-cyan)',
                      fontFamily: '"Share Tech Mono", monospace',
                      fontSize: '11px',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    SELECT ALL
                  </button>
                </div>
              )}

              <div>
                <label className="mono" style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  OPTIONAL WORKOUT NOTE
                </label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="Any specific focus? (optional)"
                  value={trainingNote}
                  onChange={(e) => setTrainingNote(e.target.value)}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', maxHeight: '50vh', overflowY: 'auto', padding: '4px' }}>
              {availableSkills.map(s => {
                const isSelected = selectedSkillIds.includes(s.id);
                return (
                  <div 
                    key={s.id} 
                    className="card" 
                    onClick={() => toggleSkill(s.id)}
                    style={{
                      border: isSelected ? '2px solid var(--neon-cyan)' : '1px solid var(--border-dim)',
                      boxShadow: isSelected ? '0 0 12px rgba(0, 213, 255, 0.3)' : 'none',
                      cursor: 'pointer',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'all 0.2s',
                      background: isSelected ? 'rgba(0, 213, 255, 0.05)' : 'var(--bg-panel)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{s.category}</span>
                      <span className="neon-cyan mono" style={{ fontSize: '12px', fontWeight: 'bold' }}>+{s.xp} XP</span>
                    </div>
                    <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>{s.name}</h4>
                    {isSelected && (
                      <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Deadline:</span>
                        <input
                          type="time"
                          className="cyber-input"
                          value={skillDeadlines[s.id] || ''}
                          onChange={(e) => setSkillDeadlines(prev => ({ ...prev, [s.id]: e.target.value }))}
                          style={{ maxWidth: '120px', fontSize: '11px', padding: '4px 6px' }}
                        />
                      </div>
                    )}
                    <div style={{ height: '4px', background: '#0c0c16', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' }}>
                      <div style={{ height: '100%', width: `${s.progress || 0}%`, background: 'var(--neon-cyan)' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {!showAddForm ? (
              <button 
                className="cyber-button dim" 
                onClick={() => setShowAddForm(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Plus size={16} /> ADD CUSTOM SKILL
              </button>
            ) : (
              <form onSubmit={handleAddCustomSkill} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--neon-green)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="neon-green mono" style={{ fontSize: '14px' }}>NEW SKILL NODE</span>
                  <X size={16} style={{ cursor: 'pointer', color: 'var(--text-dim)' }} onClick={() => setShowAddForm(false)} />
                </div>
                <input 
                  type="text" className="cyber-input" placeholder="Skill Name" 
                  value={newSkillName} onChange={e => setNewSkillName(e.target.value)} required 
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="text" className="cyber-input" placeholder="Category" style={{ flex: 1 }}
                    value={newSkillCategory} onChange={e => setNewSkillCategory(e.target.value)} 
                  />
                  <input 
                    type="number" className="cyber-input" placeholder="XP" style={{ width: '80px' }}
                    value={newSkillXp} onChange={e => setNewSkillXp(e.target.value)} 
                  />
                </div>
                <button type="submit" className="cyber-button green">SAVE TO MATRIX</button>
              </form>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button className="cyber-button dim" onClick={() => setStep(1)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ChevronLeft size={16} /> <span>&lt;-</span>
              </button>
              <button className="cyber-button" onClick={() => setStep(3)} style={{ flex: 2, padding: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span>CONFIRM MISSIONS</span> <ChevronRight size={16} /> <span>-&gt;</span>
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div style={{ textAlign: 'center' }}>
              <h2 className="neon-cyan" style={{ fontFamily: 'Orbitron, sans-serif' }}>TODAY'S MISSION BRIEF</h2>
            </div>
            
            <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--neon-magenta)', background: 'rgba(236, 72, 153, 0.05)' }}>
              {selectedSkills.length > 0 ? (
                selectedSkills.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <div className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{s.category}</div>
                      <div style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{s.name}</div>
                    </div>
                    <div className="neon-magenta mono" style={{ fontWeight: 'bold' }}>+{s.xp} XP</div>
                  </div>
                ))
              ) : (
                <div className="mono" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>NO MISSIONS SELECTED</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="cyber-button dim" onClick={() => setStep(2)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ChevronLeft size={16} /> <span>&lt;-</span>
              </button>
              <button 
                className="cyber-button" 
                onClick={handleDeploy} 
                style={{ flex: 2, padding: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', borderColor: 'var(--neon-magenta)', color: 'var(--neon-magenta)', boxShadow: '0 0 10px rgba(236, 72, 153, 0.2)' }}
              >
                <Rocket size={20} /> DEPLOY
              </button>
            </div>
          </div>
        )}

      </div>
      <style>{`
        @media (max-width: 640px) {
          .muscle-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
}
