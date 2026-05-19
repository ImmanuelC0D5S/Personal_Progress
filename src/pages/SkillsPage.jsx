import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, Award, Sparkles, Lock, Unlock, X, ChevronRight, CheckCircle2, Plus 
} from 'lucide-react';

export default function SkillsPage({ skills, setSkills }) {
  // Pre-load sample skills if empty on first run
  useEffect(() => {
    if (!localStorage.getItem('tracker_skills_initialized')) {
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
      setSkills(sampleSkills);
      localStorage.setItem('tracker_skills_initialized', 'true');
    }
  }, [setSkills]);

  // UI States
  const [activeTab, setActiveTab] = useState('All'); // All, Coding, Calisthenics, Reading
  const [editingSkill, setEditingSkill] = useState(null); // skill object being edited
  const [sliderValue, setSliderValue] = useState(0);
  const [xpFloats, setXpFloats] = useState([]);
  
  // Custom skill form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [newSkillXp, setNewSkillXp] = useState(100);

  // Categories
  const categories = ['All', 'Coding', 'Calisthenics', 'Reading'];

  // Calculate Total Earned XP: sum of full XP for complete + partial XP (xp * progress / 100) for unlocked
  const totalXp = useMemo(() => {
    const baseXp = skills.reduce((total, s) => {
      if (s.status === 'complete') {
        return total + s.xp;
      } else if (s.status === 'unlocked') {
        return total + Math.round(s.xp * ((s.progress || 0) / 100));
      }
      return total;
    }, 0);
    const penalty = parseInt(localStorage.getItem('tracker_total_xp_penalty') || '0', 10);
    const bonus = parseInt(localStorage.getItem('tracker_total_xp_bonus') || '0', 10);
    return Math.max(0, baseXp + bonus - penalty);
  }, [skills]);

  // Filter skills based on Category Tab
  const filteredSkills = useMemo(() => {
    return skills.filter(s => {
      if (activeTab === 'All') return true;
      return s.category.toLowerCase() === activeTab.toLowerCase();
    });
  }, [skills, activeTab]);

  // Handle skill click
  const handleSkillClick = (skill) => {
    if (skill.status === 'unlocked') {
      setEditingSkill(skill);
      setSliderValue(skill.progress || 0);
    }
  };

  // Close modal handlers
  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay') {
      setEditingSkill(null);
    }
  };

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
    
    setSkills([...skills, newSkill]);
    
    setNewSkillName('');
    setNewSkillCategory('');
    setNewSkillXp(100);
    setShowAddForm(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setEditingSkill(null);
      }
    };
    if (editingSkill) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingSkill]);

  // Save Progress & Unlock Dependencies
  const handleSaveProgress = (e) => {
    e.preventDefault();
    if (!editingSkill) return;

    const targetProgress = parseInt(sliderValue);
    const isCompleted = targetProgress === 100;

    // Calculate XP gain
    const oldSkill = skills.find(s => s.id === editingSkill.id);
    const oldXp = oldSkill ? (oldSkill.status === 'complete' ? oldSkill.xp : oldSkill.status === 'unlocked' ? Math.round(oldSkill.xp * ((oldSkill.progress || 0) / 100)) : 0) : 0;
    const newXp = isCompleted ? editingSkill.xp : Math.round(editingSkill.xp * (targetProgress / 100));
    const gained = newXp - oldXp;

    if (gained > 0) {
      const floatId = Date.now();
      setXpFloats(prev => [...prev, { id: floatId, amount: gained, skillId: editingSkill.id }]);
      setTimeout(() => {
        setXpFloats(prev => prev.filter(f => f.id !== floatId));
      }, 800);
    }

    // First update the selected skill
    let updatedSkills = skills.map(s => {
      if (s.id === editingSkill.id) {
        return {
          ...s,
          progress: targetProgress,
          status: isCompleted ? 'complete' : 'unlocked'
        };
      }
      return s;
    });

    // If it was completed, scan and unlock child skills
    if (isCompleted) {
      // Find all skills that have this skill as parent and are currently locked
      updatedSkills = updatedSkills.map(s => {
        if (s.parent === editingSkill.id && s.status === 'locked') {
          return {
            ...s,
            status: 'unlocked',
            progress: 0
          };
        }
        return s;
      });
    }

    setSkills(updatedSkills);
    setEditingSkill(null);
  };

  // Helper to find parent skill name
  const getParentSkillName = (parentId) => {
    const parent = skills.find(s => s.id === parentId);
    return parent ? parent.name : 'Unknown Node';
  };

  return (
    <div className="page-enter" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Dynamic SlideUp Modal Animation */}
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header & Total XP Display */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 className="neon-magenta" style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Orbitron, sans-serif' }}>
            <Cpu size={24} className="animate-pulse-cyber" />
            COGNITIVE TREE
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'Share Tech Mono, monospace' }}>
            SYSTEM://NEURAL.EXPERTISE_INDEX
          </p>
        </div>

        {/* Total XP Scoreboard */}
        <div className="card border-glow-cyan" style={{ 
          padding: '12px 24px', 
          backgroundColor: '#000000', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          border: '1px solid var(--neon-cyan)',
          boxShadow: '0 0 10px rgba(0, 213, 255, 0.2)'
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'Share Tech Mono, monospace', letterSpacing: '2px' }}>
            NEURAL_EXP_INTEGRATED
          </span>
          <h1 className="neon-cyan" style={{ fontSize: '32px', fontFamily: 'Orbitron, sans-serif', fontWeight: '900', margin: 0, textShadow: '0 0 10px var(--neon-cyan)' }}>
            {totalXp} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>XP</span>
          </h1>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: isActive ? 'rgba(0, 213, 255, 0.05)' : 'transparent',
                  border: isActive ? '1px solid var(--neon-cyan)' : '1px solid var(--border-dim)',
                  color: isActive ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                  padding: '6px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'Share Tech Mono, monospace',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 6px rgba(0, 213, 255, 0.2)' : 'none'
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
        <button 
          className="cyber-button green" 
          onClick={() => setShowAddForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Share Tech Mono, monospace' }}
        >
          <Plus size={16} /> ADD SKILL
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddCustomSkill} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--neon-green)', background: 'rgba(0, 230, 118, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="neon-green mono" style={{ fontSize: '14px' }}>INJECT NEW COGNITIVE NODE</span>
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

      {/* Skills Grid */}
      <div className="skills-grid">
        {filteredSkills.length > 0 ? (
          filteredSkills.map(s => {
            const isComplete = s.status === 'complete';
            const isUnlocked = s.status === 'unlocked';
            const isLocked = s.status === 'locked';

            // Set styles depending on status
            let borderStyle = '1px solid var(--border-dim)';
            let boxShadow = 'none';
            let opacity = '1';
            let cursor = 'default';
            let glowColor = 'transparent';

            if (isComplete) {
              borderStyle = '1px solid var(--neon-green)';
              glowColor = 'var(--neon-green)';
              boxShadow = '0 0 8px rgba(0, 230, 118, 0.1)';
            } else if (isUnlocked) {
              borderStyle = '1px solid var(--neon-cyan)';
              glowColor = 'var(--neon-cyan)';
              boxShadow = '0 0 10px rgba(0, 213, 255, 0.15)';
              cursor = 'pointer';
            } else if (isLocked) {
              opacity = '0.45';
              borderStyle = '1px dashed var(--border-dim)';
            }

            return (
              <div
                key={s.id}
                className="card"
                onClick={() => isUnlocked && handleSkillClick(s)}
                style={{
                  border: borderStyle,
                  boxShadow: boxShadow,
                  opacity: opacity,
                  cursor: cursor,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '18px',
                  minHeight: '165px',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              onMouseEnter={(e) => {
                if (isUnlocked) {
                  e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                  e.currentTarget.style.boxShadow = '0 0 14px rgba(0, 213, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (isUnlocked) {
                  e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 213, 255, 0.15)';
                }
              }}
              >
                {/* Floating XP Gain micro-interaction */}
                {xpFloats.filter(f => f.skillId === s.id).map(f => (
                  <div key={f.id} className="xp-float" style={{ top: '15px', right: '15px' }}>
                    +{f.amount} XP
                  </div>
                ))}

                {/* Card Top Block */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span className="mono" style={{ 
                    fontSize: '10px', 
                    color: 'var(--text-secondary)',
                    letterSpacing: '1px'
                  }}>
                    {s.category.toUpperCase()} NODE
                  </span>

                  {/* Status Badge */}
                  {isComplete && (
                    <span className="mono" style={{
                      color: 'var(--neon-green)',
                      background: 'rgba(0, 230, 118, 0.08)',
                      border: '1px solid rgba(0, 230, 118, 0.3)',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      letterSpacing: '1px'
                    }}>
                      COMPLETE
                    </span>
                  )}
                  {isUnlocked && (
                    <span className="mono" style={{
                      color: 'var(--neon-cyan)',
                      background: 'rgba(0, 213, 255, 0.08)',
                      border: '1px solid rgba(0, 213, 255, 0.3)',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      letterSpacing: '1px'
                    }}>
                      UNLOCKED
                    </span>
                  )}
                  {isLocked && (
                    <span className="mono" style={{
                      color: 'var(--text-dim)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-dim)',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <Lock size={8} />
                      LOCKED
                    </span>
                  )}
                </div>

                <h3 className="neon-cyan" style={{ 
                  fontSize: '16px', 
                  fontFamily: 'Orbitron, sans-serif',
                  marginBottom: '8px',
                  color: isLocked ? 'var(--text-secondary)' : 'var(--text-primary)',
                  textShadow: isUnlocked ? '0 0 4px rgba(0, 213, 255, 0.3)' : 'none'
                }}>
                  {s.name}
                </h3>

                {/* Lock Dependency Warning for locked nodes */}
                {isLocked && s.parent && (
                  <p className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    REQ: Complete [{getParentSkillName(s.parent)}]
                  </p>
                )}
              </div>

              {/* Progress & XP Bottom Block */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'Share Tech Mono, monospace' }}>
                  <span>NEURAL INTEGRATION</span>
                  <span className="mono">
                    {isComplete ? '100%' : isUnlocked ? `${s.progress || 0}%` : '0%'}
                  </span>
                </div>

                {/* Progress bar: thin (4px), glowing */}
                <div style={{ 
                  height: '4px', 
                  backgroundColor: '#0c0c16', 
                  borderRadius: '2px', 
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    height: '100%',
                    width: isComplete ? '100%' : isUnlocked ? `${s.progress || 0}%` : '0%',
                    backgroundColor: isComplete ? 'var(--neon-green)' : 'var(--neon-cyan)',
                    boxShadow: isComplete ? '0 0 6px var(--neon-green)' : isUnlocked ? '0 0 6px var(--neon-cyan)' : 'none',
                    transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                  }} />
                </div>

                {/* XP details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                  <span className="mono" style={{ color: 'var(--text-dim)' }}>
                    BASE XP: {s.xp}
                  </span>
                  
                  <span className="mono" style={{ 
                    color: isComplete ? 'var(--neon-green)' : isUnlocked ? 'var(--neon-cyan)' : 'var(--text-dim)',
                    fontWeight: 'bold' 
                  }}>
                    {isComplete ? `+${s.xp} XP` : isUnlocked ? `+${Math.round(s.xp * ((s.progress || 0) / 100))} XP` : '0 XP'}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
          <Cpu size={28} />
          <span style={{ fontSize: '12px', letterSpacing: '2px', fontFamily: 'Orbitron, sans-serif' }}>
            SKILL TREE EMPTY. BEGIN KNOWLEDGE ACQUISITION.
          </span>
        </div>
      )}
    </div>

      {/* Progress Editor Modal overlay */}
      {editingSkill && (
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
              maxWidth: '450px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--neon-cyan)',
              boxShadow: '0 0 20px rgba(0, 213, 255, 0.3)',
              animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              gap: '20px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '12px' }}>
              <h3 className="neon-cyan" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Orbitron, sans-serif' }}>
                <Sparkles size={16} />
                CALIBRATE NEURAL NODE
              </h3>
              <button 
                onClick={() => setEditingSkill(null)}
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

            {/* Modal Body */}
            <form onSubmit={handleSaveProgress} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {editingSkill.category} NODE
                </span>
                <h2 style={{ fontSize: '20px', fontFamily: 'Orbitron, sans-serif', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {editingSkill.name}
                </h2>
              </div>

              {/* Slider Controller */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'Share Tech Mono, monospace' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>INTEGRATION COEFFICIENT</span>
                  <span className="neon-cyan" style={{ fontWeight: 'bold', fontSize: '15px' }}>{sliderValue}%</span>
                </div>
                
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(e.target.value)}
                  style={{
                    width: '100%',
                    accentColor: 'var(--neon-cyan)',
                    background: '#07070f',
                    height: '6px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  <span>0% (UNLOCKED)</span>
                  <span>50% (HALFWAY)</span>
                  <span>100% (COMPLETE)</span>
                </div>
              </div>

              {/* XP estimation readout */}
              <div className="card" style={{ 
                padding: '10px 14px', 
                backgroundColor: 'rgba(0, 213, 255, 0.02)', 
                border: '1px solid rgba(0, 213, 255, 0.1)', 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '12px',
                fontFamily: 'Share Tech Mono, monospace'
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>CALCULATED XP LOAD:</span>
                <span className="neon-cyan" style={{ fontWeight: 'bold' }}>
                  {Math.round(editingSkill.xp * (sliderValue / 100))} / {editingSkill.xp} XP
                </span>
              </div>

              {/* Alert message if Slider is 100% */}
              {parseInt(sliderValue) === 100 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  fontSize: '11px', 
                  color: 'var(--neon-green)', 
                  backgroundColor: 'rgba(0, 230, 118, 0.03)',
                  border: '1px solid rgba(0, 230, 118, 0.2)',
                  padding: '8px 12px',
                  borderRadius: '4px'
                }}>
                  <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>CRITICAL: Completing this node unlocks downstream dependencies in tech tree!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-dim)', paddingTop: '16px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="cyber-button dim" 
                  onClick={() => setEditingSkill(null)}
                  style={{ flex: 1 }}
                >
                  ABORT
                </button>
                <button 
                  type="submit" 
                  className="cyber-button" 
                  style={{ flex: 2, borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }}
                >
                  SAVE & TRIGGER SYNAPSE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
