import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Cpu, Award, Sparkles, Lock, Unlock, X, ChevronRight, CheckCircle2, Plus, Camera, Trash2, Calendar, TrendingUp, Zap
} from 'lucide-react';

export default function SkillsPage({ skills, setSkills, workouts = [], habits = [], habitLogs = [] }) {
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

  // Profile Picture state
  const fileInputRef = useRef(null);
  const [profilePic, setProfilePic] = useState(() => {
    return localStorage.getItem('tracker_profile_pic') || null;
  });

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result;
        setProfilePic(base64Data);
        localStorage.setItem('tracker_profile_pic', base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const clearProfilePic = (e) => {
    e.stopPropagation();
    setProfilePic(null);
    localStorage.removeItem('tracker_profile_pic');
  };

  // Categories
  const categories = ['All', 'Coding', 'Calisthenics', 'Reading'];

  // Calculate Total Earned XP
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

  // Dynamic 7-day consistency data
  const last7Days = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dd}`;
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      dates.push({ dateStr, label });
    }
    return dates;
  }, []);

  const consistencyGraphData = useMemo(() => {
    return last7Days.map(({ dateStr, label }) => {
      const dailyHabitsCount = habitLogs.filter(
        log => log.date === dateStr && (log.completed === true || log.completed === undefined)
      ).length;
      
      const dailyWorkoutsCount = workouts.filter(w => {
        if (w.date === dateStr) return true;
        if (w.sessions && Array.isArray(w.sessions)) {
          return w.sessions.some(s => s.date === dateStr);
        }
        return false;
      }).length;

      const totalActivities = dailyHabitsCount + dailyWorkoutsCount;
      return { label, count: totalActivities, dateStr };
    });
  }, [last7Days, habitLogs, workouts]);

  const averageDailyConsistency = useMemo(() => {
    if (consistencyGraphData.length === 0) return 0;
    const sum = consistencyGraphData.reduce((total, d) => total + (d.count > 0 ? 1 : 0), 0);
    return Math.round((sum / 7) * 100);
  }, [consistencyGraphData]);

  // Filter skills based on Category Tab
  const filteredSkills = useMemo(() => {
    return skills.filter(s => {
      if (activeTab === 'All') return true;
      return s.category.toLowerCase() === activeTab.toLowerCase();
    });
  }, [skills, activeTab]);

  // Separate active/locked skills from completed ones
  const activeAndLockedSkills = useMemo(() => {
    return filteredSkills.filter(s => s.status !== 'complete');
  }, [filteredSkills]);

  const completedSkills = useMemo(() => {
    return filteredSkills.filter(s => s.status === 'complete');
  }, [filteredSkills]);

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

    if (isCompleted) {
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

  const getParentSkillName = (parentId) => {
    const parent = skills.find(s => s.id === parentId);
    return parent ? parent.name : 'Unknown Node';
  };

  return (
    <div className="page-enter" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Styles for dynamic components & layouts */}
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .skills-layout {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 24px;
        }
        .left-col {
          grid-column: span 4;
        }
        .right-col {
          grid-column: span 8;
        }
        @media (max-width: 1024px) {
          .skills-layout {
            grid-template-columns: 1fr;
          }
          .left-col, .right-col {
            grid-column: span 12;
          }
        }
        .avatar-hover-trigger:hover .avatar-upload-overlay {
          opacity: 1 !important;
        }
        .bar-hover:hover .bar-tooltip {
          opacity: 1 !important;
          transform: translate(-50%, -6px) !important;
        }
      `}</style>

      {/* Header and top XP score */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 className="neon-magenta" style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Orbitron, sans-serif' }}>
            <Cpu size={24} className="animate-pulse-cyber" />
            COGNITIVE TREE & CONSOLE
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'Share Tech Mono, monospace' }}>
            SYSTEM://OPERATOR.INTELLIGENCE_GRID
          </p>
        </div>

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
            CONSOLIDATED XP
          </span>
          <h1 className="neon-cyan" style={{ fontSize: '32px', fontFamily: 'Orbitron, sans-serif', fontWeight: '900', margin: 0, textShadow: '0 0 10px var(--neon-cyan)' }}>
            {totalXp} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>XP</span>
          </h1>
        </div>
      </div>

      <div className="skills-layout">
        
        {/* ================= LEFT COLUMN: PROFILE CARD & CONSISTENCY DASHBOARD ================= */}
        <div className="left-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Cybernetic Operator Profile Card */}
          <div className="card" style={{ border: '1px solid var(--border-dim)', padding: '24px', position: 'relative' }}>
            <div className="mono" style={{ fontSize: '9px', color: 'var(--text-dim)', marginBottom: '14px', letterSpacing: '1px' }}>GRID_OPERATIVE_IDENTITY</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              
              {/* Profile Image Container */}
              <div 
                onClick={triggerFileInput}
                className="avatar-hover-trigger"
                style={{ 
                  width: '130px', 
                  height: '130px', 
                  borderRadius: '10px', 
                  border: '2px solid var(--neon-magenta)', 
                  boxShadow: '0 0 15px rgba(236, 72, 153, 0.25)', 
                  overflow: 'hidden', 
                  position: 'relative',
                  cursor: 'pointer',
                  backgroundColor: '#07070f'
                }}
              >
                {profilePic ? (
                  <img 
                    src={profilePic} 
                    alt="Operative profile" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  // Custom Neon Vector wireframe avatar
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <rect width="100" height="100" fill="#07070f" />
                    <line x1="10" y1="0" x2="10" y2="100" stroke="rgba(236, 72, 153, 0.05)" strokeWidth="0.5" />
                    <line x1="30" y1="0" x2="30" y2="100" stroke="rgba(236, 72, 153, 0.05)" strokeWidth="0.5" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(236, 72, 153, 0.05)" strokeWidth="0.5" />
                    <line x1="70" y1="0" x2="70" y2="100" stroke="rgba(236, 72, 153, 0.05)" strokeWidth="0.5" />
                    <line x1="90" y1="0" x2="90" y2="100" stroke="rgba(236, 72, 153, 0.05)" strokeWidth="0.5" />
                    <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(236, 72, 153, 0.05)" strokeWidth="0.5" />
                    <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(236, 72, 153, 0.05)" strokeWidth="0.5" />
                    <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(236, 72, 153, 0.05)" strokeWidth="0.5" />
                    <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(236, 72, 153, 0.05)" strokeWidth="0.5" />
                    
                    <polygon points="50,15 80,32 80,68 50,85 20,68 20,32" fill="none" stroke="rgba(0, 213, 255, 0.15)" strokeWidth="1" />
                    <path d="M50,22 C40,22 32,30 32,42 C32,54 40,64 50,64 C60,64 68,54 68,42 C68,30 60,22 50,22 Z" fill="none" stroke="var(--neon-magenta)" strokeWidth="1.5" strokeDasharray="30, 2, 4, 2" />
                    <path d="M38,62 L25,82 L75,82 L62,62 Z" fill="none" stroke="var(--neon-magenta)" strokeWidth="1.5" />
                    <circle cx="50" cy="42" r="28" fill="none" stroke="rgba(0, 213, 255, 0.15)" strokeWidth="0.5" />
                    
                    <line x1="50" y1="8" x2="50" y2="25" stroke="var(--neon-cyan)" strokeWidth="0.75" />
                    <line x1="50" y1="75" x2="50" y2="92" stroke="var(--neon-cyan)" strokeWidth="0.75" />
                    <line x1="16" y1="42" x2="28" y2="42" stroke="var(--neon-cyan)" strokeWidth="0.75" />
                    <line x1="72" y1="42" x2="84" y2="42" stroke="var(--neon-cyan)" strokeWidth="0.75" />
                    <line x1="0" y1="45" x2="100" y2="45" stroke="rgba(0, 213, 255, 0.4)" strokeWidth="0.5" />
                  </svg>
                )}

                {/* Upload Hover Overlay */}
                <div 
                  className="avatar-upload-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    color: 'var(--neon-cyan)'
                  }}
                >
                  <Camera size={20} />
                  <span className="mono" style={{ fontSize: '9px', fontWeight: 'bold' }}>UPLOAD PIC</span>
                </div>
              </div>

              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleProfilePicChange} 
                accept="image/*"
                style={{ display: 'none' }}
              />

              {/* Clear pic button if custom pic exists */}
              {profilePic && (
                <button 
                  onClick={clearProfilePic}
                  className="mono"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '-8px'
                  }}
                >
                  <Trash2 size={11} /> REMOVE AVATAR
                </button>
              )}

              {/* Profile Readout text */}
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 className="neon-magenta" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '18px', margin: 0 }}>
                  IMMANUEL-C0D5S
                </h3>
                <span className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  COGNITIVE OPERATIVE // CLASS ALPHA
                </span>
                
                <div style={{ 
                  marginTop: '12px', 
                  display: 'flex', 
                  gap: '8px', 
                  justifyContent: 'center',
                  fontFamily: 'Share Tech Mono, monospace' 
                }}>
                  <div style={{ border: '1px solid rgba(0, 213, 255, 0.2)', padding: '4px 8px', borderRadius: '4px', background: 'rgba(0,213,255,0.02)' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '9px' }}>NODES COMPLETED</span>
                    <div className="neon-cyan" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      {skills.filter(s => s.status === 'complete').length}
                    </div>
                  </div>
                  <div style={{ border: '1px solid rgba(236, 72, 153, 0.2)', padding: '4px 8px', borderRadius: '4px', background: 'rgba(236,72,153,0.02)' }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: '9px' }}>ACTIVE NODES</span>
                    <div className="neon-magenta" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                      {skills.filter(s => s.status === 'unlocked').length}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Consistency Mini Dashboard */}
          <div className="card" style={{ border: '1px solid var(--border-dim)', padding: '24px' }}>
            <h3 className="neon-cyan" style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Share Tech Mono, monospace' }}>
              <TrendingUp size={16} />
              7-DAY SYNC CONSISTENCY
            </h3>

            {/* Graphs / Consistency bars */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-end', 
              height: '110px', 
              paddingBottom: '6px', 
              borderBottom: '1px solid var(--border-dim)',
              marginBottom: '16px',
              paddingInline: '8px'
            }}>
              {consistencyGraphData.map((d, index) => {
                const heightPercentage = Math.min(100, d.count * 25);
                const hasActivity = d.count > 0;
                
                return (
                  <div 
                    key={index} 
                    className="bar-hover"
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      width: '26px', 
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Tooltip on hover */}
                    <div 
                      className="bar-tooltip" 
                      style={{
                        position: 'absolute',
                        bottom: `${heightPercentage + 12}px`,
                        left: '50%',
                        transform: 'translate(-50%, 0)',
                        backgroundColor: '#000',
                        border: `1px solid ${hasActivity ? 'var(--neon-cyan)' : 'var(--border-dim)'}`,
                        color: hasActivity ? 'var(--neon-cyan)' : 'var(--text-secondary)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        whiteSpace: 'nowrap',
                        opacity: 0,
                        transition: 'opacity 0.2s, transform 0.2s',
                        zIndex: 5,
                        pointerEvents: 'none',
                        fontFamily: 'Share Tech Mono, monospace'
                      }}
                    >
                      {d.count} {d.count === 1 ? 'action' : 'actions'}
                    </div>

                    {/* The bar element itself */}
                    <div style={{ 
                      width: '12px', 
                      height: hasActivity ? `${heightPercentage}px` : '4px',
                      background: hasActivity ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.05)',
                      boxShadow: hasActivity ? '0 0 10px var(--neon-cyan)' : 'none',
                      borderRadius: '2px',
                      transition: 'height 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease'
                    }} />
                    
                    {/* Bottom Day Label */}
                    <span className="mono" style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '8px' }}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Metrics readout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'Share Tech Mono, monospace' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>ACTIVE SYNC SCORE:</span>
                <span className="neon-cyan" style={{ fontWeight: 'bold' }}>{averageDailyConsistency}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>LAST 7 DAYS CYCLES:</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {consistencyGraphData.filter(d => d.count > 0).length} / 7 SYNCED
                </span>
              </div>
              
              <div 
                className="card" 
                style={{ 
                  marginTop: '6px', 
                  padding: '10px', 
                  background: 'rgba(0, 213, 255, 0.02)', 
                  border: '1px solid rgba(0, 213, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px' 
                }}
              >
                <Zap size={14} className="neon-cyan" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '10px', color: 'var(--text-dim)', lineHeight: '1.3' }}>
                  Weekly synapses active. Keep up the high cognitive log-rate to maintain maximum streak coefficient!
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* ================= RIGHT COLUMN: SKILLS TREE (ACTIVE / LOCKED) & COMPLETED SEPARATE SUBSECTION ================= */}
        <div className="right-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Tech Tree Panel */}
          <div className="card" style={{ border: '1px solid var(--border-dim)', padding: '24px' }}>
            
            {/* Filter Tabs Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-dim)', paddingBottom: '16px', marginBottom: '20px' }}>
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
                <Plus size={16} /> ADD SKILL NODE
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddCustomSkill} className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--neon-green)', background: 'rgba(0, 230, 118, 0.05)' }}>
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

            {/* Active & Locked Skills Grid */}
            <div>
              <div className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '12px', letterSpacing: '1px' }}>ACTIVE & LOCKED SKILL NODES</div>
              
              <div className="skills-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {activeAndLockedSkills.length > 0 ? (
                  activeAndLockedSkills.map(s => {
                    const isUnlocked = s.status === 'unlocked';
                    const isLocked = s.status === 'locked';

                    let borderStyle = '1px solid var(--border-dim)';
                    let boxShadow = 'none';
                    let opacity = '1';
                    let cursor = 'default';

                    if (isUnlocked) {
                      borderStyle = '1px solid var(--neon-cyan)';
                      boxShadow = '0 0 10px rgba(0, 213, 255, 0.1)';
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
                          padding: '16px',
                          minHeight: '150px',
                          position: 'relative',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                        onMouseEnter={(e) => {
                          if (isUnlocked) {
                            e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                            e.currentTarget.style.boxShadow = '0 0 14px rgba(0, 213, 255, 0.25)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (isUnlocked) {
                            e.currentTarget.style.borderColor = 'var(--neon-cyan)';
                            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 213, 255, 0.1)';
                          }
                        }}
                      >
                        {/* Floating XP animations */}
                        {xpFloats.filter(f => f.skillId === s.id).map(f => (
                          <div key={f.id} className="xp-float" style={{ top: '15px', right: '15px' }}>
                            +{f.amount} XP
                          </div>
                        ))}

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <span className="mono" style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                              {s.category.toUpperCase()} NODE
                            </span>
                            
                            {isUnlocked ? (
                              <span className="mono" style={{
                                color: 'var(--neon-cyan)',
                                background: 'rgba(0, 213, 255, 0.08)',
                                border: '1px solid rgba(0, 213, 255, 0.3)',
                                padding: '1px 6px',
                                borderRadius: '3px',
                                fontSize: '8px',
                                fontWeight: 'bold'
                              }}>
                                UNLOCKED
                              </span>
                            ) : (
                              <span className="mono" style={{
                                color: 'var(--text-dim)',
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--border-dim)',
                                padding: '1px 6px',
                                borderRadius: '3px',
                                fontSize: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <Lock size={8} /> LOCKED
                              </span>
                            )}
                          </div>

                          <h4 className="neon-cyan" style={{ 
                            fontSize: '14px', 
                            fontFamily: 'Orbitron, sans-serif',
                            margin: '0 0 6px 0',
                            color: isLocked ? 'var(--text-secondary)' : 'var(--text-primary)',
                            lineHeight: '1.3'
                          }}>
                            {s.name}
                          </h4>

                          {isLocked && s.parent && (
                            <p className="mono" style={{ fontSize: '9px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', margin: 0 }}>
                              REQ: Complete [{getParentSkillName(s.parent)}]
                            </p>
                          )}
                        </div>

                        <div style={{ marginTop: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'Share Tech Mono, monospace' }}>
                            <span>INTEGRATION</span>
                            <span>{isUnlocked ? `${s.progress || 0}%` : '0%'}</span>
                          </div>

                          <div style={{ height: '3px', backgroundColor: '#0c0c16', borderRadius: '1.5px', overflow: 'hidden', marginBottom: '8px' }}>
                            <div style={{
                              height: '100%',
                              width: isUnlocked ? `${s.progress || 0}%` : '0%',
                              backgroundColor: 'var(--neon-cyan)',
                              boxShadow: isUnlocked ? '0 0 6px var(--neon-cyan)' : 'none',
                              transition: 'width 0.4s ease'
                            }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'Share Tech Mono, monospace' }}>
                            <span style={{ color: 'var(--text-dim)' }}>BASE XP: {s.xp}</span>
                            <span style={{ color: isUnlocked ? 'var(--neon-cyan)' : 'var(--text-dim)', fontWeight: 'bold' }}>
                              +{isUnlocked ? Math.round(s.xp * ((s.progress || 0) / 100)) : 0} XP
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="mono" style={{ gridColumn: '1 / -1', padding: '24px', border: '1px dashed var(--border-dim)', borderRadius: '6px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    NO UNLOCKED OR LOCKED TECH NODES REGISTERED IN THIS INDEX.
                  </div>
                )}
              </div>
            </div>

            {/* Separate Subsection: Archived Integrations (Completed Skills) */}
            <div style={{ marginTop: '36px', borderTop: '1px dashed var(--border-dim)', paddingTop: '28px' }}>
              <h3 className="neon-green" style={{ fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Share Tech Mono, monospace' }}>
                <CheckCircle2 size={16} />
                ARCHIVED COGNITIVE INTEGRATIONS (COMPLETED COGNITIVE NODES)
              </h3>

              <div className="completed-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {completedSkills.length > 0 ? (
                  completedSkills.map(s => (
                    <div 
                      key={s.id}
                      className="card"
                      style={{
                        border: '1px solid var(--neon-green)',
                        background: 'rgba(0, 230, 118, 0.02)',
                        boxShadow: '0 0 8px rgba(0, 230, 118, 0.08)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: '120px',
                        position: 'relative'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <span className="mono" style={{ fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '1px' }}>
                            {s.category.toUpperCase()} NODE
                          </span>
                          <span className="mono neon-green" style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                            <CheckCircle2 size={10} /> INTEGRATED
                          </span>
                        </div>

                        <h4 style={{ 
                          fontSize: '14px', 
                          fontFamily: 'Orbitron, sans-serif',
                          margin: '0',
                          color: 'var(--text-primary)',
                          textDecoration: 'line-through',
                          opacity: 0.8
                        }}>
                          {s.name}
                        </h4>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        <div style={{ height: '3px', backgroundColor: 'var(--neon-green)', borderRadius: '1.5px', boxShadow: '0 0 6px var(--neon-green)', marginBottom: '8px' }} />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'Share Tech Mono, monospace' }}>
                          <span style={{ color: 'var(--text-dim)' }}>CONSOLIDATED XP</span>
                          <span className="neon-green" style={{ fontWeight: 'bold' }}>+{s.xp} XP LOADED</span>
                        </div>
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="mono" style={{ gridColumn: '1 / -1', padding: '20px', border: '1px dashed rgba(0, 230, 118, 0.2)', borderRadius: '6px', backgroundColor: 'rgba(0,230,118,0.01)', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                    NO INTEGRATIONS CURRENTLY COMPLETED. BEGIN CALIBRATING ACTIVE NODES.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Calibration Modal Overlay */}
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

            <form onSubmit={handleSaveProgress} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span className="mono" style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  {editingSkill.category} NODE
                </span>
                <h2 style={{ fontSize: '20px', fontFamily: 'Orbitron, sans-serif', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {editingSkill.name}
                </h2>
              </div>

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
