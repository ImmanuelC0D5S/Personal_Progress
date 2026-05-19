import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dumbbell, Plus, Trash2, Calendar, Clock, FileText, 
  ChevronDown, ChevronUp, X, Sparkles, Activity, AlertCircle 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip 
} from 'recharts';
import { LS_KEYS } from '../constants';

export default function WorkoutsPage({ workouts, setWorkouts }) {
  // Pre-load sample data if empty on first run
  useEffect(() => {
    if (!localStorage.getItem('tracker_workouts_initialized')) {
      const sampleWorkouts = [];
      setWorkouts(sampleWorkouts);
      localStorage.setItem('tracker_workouts_initialized', 'true');
    }
  }, [setWorkouts]);

  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedWorkouts, setExpandedWorkouts] = useState(new Set());
  const [justSaved, setJustSaved] = useState(false);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Gym'); // Gym, Calisthenics, Other
  const [exercises, setExercises] = useState([{ name: '', sets: 1, reps: 1, weight: 0 }]);
  const [notes, setNotes] = useState('');
  const [todayTraining, setTodayTraining] = useState(null);

  const getLocalDateString = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  // Handle modal backdrop click
  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay') {
      setIsModalOpen(false);
    }
  };

  // Handle Escape key to close modal
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
    if (!isModalOpen) return;
    try {
      const raw = localStorage.getItem(LS_KEYS.DAILY_TRAINING);
      if (!raw) {
        setTodayTraining(null);
        return;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.date !== getLocalDateString()) {
        setTodayTraining(null);
        return;
      }
      setTodayTraining(parsed);
      if (parsed.type === 'GYM') setType('Gym');
      if (parsed.type === 'CALISTHENICS') setType('Calisthenics');
    } catch {
      setTodayTraining(null);
    }
  }, [isModalOpen]);

  // Toggle collapse/expand for individual cards
  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedWorkouts(newExpanded);
  };

  // Add exercise row in form
  const addExerciseRow = () => {
    setExercises([...exercises, { name: '', sets: 1, reps: 1, weight: 0 }]);
  };

  // Remove exercise row in form
  const removeExerciseRow = (index) => {
    if (exercises.length === 1) return;
    setExercises(exercises.filter((_, idx) => idx !== index));
  };

  // Update specific field in specific exercise row
  const updateExerciseField = (index, field, value) => {
    const newExercises = [...exercises];
    newExercises[index][field] = value;
    setExercises(newExercises);
  };

  // Save Workout
  const handleSaveWorkout = (e) => {
    e.preventDefault();
    
    // Filter out blank exercise names
    const validExercises = exercises
      .filter(ex => ex.name.trim() !== '')
      .map(ex => ({
        name: ex.name,
        sets: parseInt(ex.sets) || 0,
        reps: parseInt(ex.reps) || 0,
        weight: parseFloat(ex.weight) || 0
      }));

    if (validExercises.length === 0) {
      alert("Please enter at least one exercise with a valid name.");
      return;
    }

    const newWorkout = {
      id: Date.now(),
      date,
      type,
      exercises: validExercises,
      notes: notes.trim()
    };

    setWorkouts([newWorkout, ...workouts]);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 600);
    
    // Reset form states
    setDate(new Date().toISOString().split('T')[0]);
    setType('Gym');
    setExercises([{ name: '', sets: 1, reps: 1, weight: 0 }]);
    setNotes('');
    setIsModalOpen(false);
  };

  // Delete Workout
  const handleDeleteWorkout = (id, e) => {
    e.stopPropagation(); // Avoid triggering expand/collapse
    if (window.confirm("Wipe this kinetic node from neural history?")) {
      setWorkouts(workouts.filter(w => w.id !== id));
    }
  };

  // Calculate volume chart data (last 7 sessions chronologically)
  const chartData = useMemo(() => {
    const sortedWorkouts = [...workouts]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7); // Last 7 sessions

    return sortedWorkouts.map(w => {
      const totalVolume = w.exercises.reduce((sum, ex) => {
        return sum + (ex.sets * ex.reps * ex.weight);
      }, 0);

      return {
        date: w.date.substring(5), // MM-DD
        volume: totalVolume,
        rawDate: w.date
      };
    });
  }, [workouts]);

  // Get total volume of a single session
  const getSessionVolume = (exercises) => {
    return exercises.reduce((sum, ex) => sum + (ex.sets * ex.reps * ex.weight), 0);
  };

  // Custom tooltips for volume chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#000000',
          border: '1px solid var(--neon-cyan)',
          padding: '10px',
          borderRadius: '4px',
          boxShadow: '0 0 10px rgba(0, 213, 255, 0.3)',
          fontFamily: 'var(--font-mono)'
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>SESSION: {label}</p>
          <p style={{ color: 'var(--neon-cyan)', fontWeight: 'bold', fontSize: '14px' }}>
            VOLUME: {payload[0].value.toLocaleString()} KG
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-enter" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Title & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="neon-cyan" style={{ fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Orbitron, sans-serif' }}>
            <Dumbbell size={24} className="animate-pulse-cyber" />
            KINETIC ENGINE
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'Share Tech Mono, monospace' }}>
            SYSTEM://SOMATIC.OUTPUT_TELEMETRY
          </p>
        </div>
        
        <button 
          className="cyber-button"
          onClick={() => setIsModalOpen(true)}
          style={{ 
            borderColor: 'var(--neon-cyan)', 
            color: 'var(--neon-cyan)', 
            boxShadow: '0 0 8px rgba(0, 213, 255, 0.2)',
            fontFamily: 'Share Tech Mono, monospace'
          }}
        >
          INITIALIZE LOG
        </button>
      </div>

      {/* Volume Visualizer Section */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 className="neon-cyan" style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Share Tech Mono, monospace' }}>
          <Activity size={16} />
          SOMATIC VOLUME HISTOGRAM (LAST 7 SESSIONS)
        </h3>

        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  stroke="var(--text-dim)" 
                  tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }} 
                  tickLine={false}
                />
                <YAxis 
                  stroke="var(--text-dim)" 
                  tick={{ fill: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11 }} 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 213, 255, 0.05)' }} />
                <Bar 
                  dataKey="volume" 
                  fill="var(--neon-cyan)" 
                  radius={[4, 4, 0, 0]}
                  style={{ filter: 'drop-shadow(0 0 6px var(--neon-cyan))' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ display: 'flex', height: '180px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            NO LOCAL RECORDS INDEXED. LOG SESSIONS TO CALIBRATE HISTOGRAM.
          </div>
        )}
      </div>

      {/* Past Sessions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'Share Tech Mono, monospace', borderBottom: '1px solid var(--border-dim)', paddingBottom: '8px' }}>
          LOCAL_DATABASE_ENTRIES // {workouts.length} SESSIONS REGISTERED
        </h3>

        {workouts.length > 0 ? (
          <div className={justSaved ? 'workout-pulse' : ''} style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid transparent', borderRadius: '8px', transition: 'all 0.6s' }}>
            {workouts.map(w => {
              const isExpanded = expandedWorkouts.has(w.id);
              const sessionVolume = getSessionVolume(w.exercises);
              
              // Determine Type Badge styling
              let badgeColor = 'var(--neon-cyan)';
              let badgeBg = 'rgba(0, 213, 255, 0.08)';
              let badgeBorder = '1px solid rgba(0, 213, 255, 0.3)';
              
              if (w.type === 'Calisthenics') {
                badgeColor = 'var(--neon-green)';
                badgeBg = 'rgba(0, 230, 118, 0.08)';
                badgeBorder = '1px solid rgba(0, 230, 118, 0.3)';
              } else if (w.type !== 'Gym') {
                // Amber
                badgeColor = '#ffb300';
                badgeBg = 'rgba(255, 179, 0, 0.08)';
                badgeBorder = '1px solid rgba(255, 179, 0, 0.3)';
              }

              return (
                <div 
                  key={w.id} 
                  className="card"
                  onClick={() => toggleExpand(w.id)}
                  style={{ 
                    cursor: 'pointer',
                    borderColor: isExpanded ? 'rgba(0, 213, 255, 0.4)' : 'var(--border-dim)',
                    boxShadow: isExpanded ? '0 0 12px rgba(0, 213, 255, 0.1)' : 'none',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* Collapsed Header Summary */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div className="mono" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {w.date}
                      </div>

                      {/* Type Badge */}
                      <span style={{ 
                        color: badgeColor, 
                        background: badgeBg, 
                        border: badgeBorder,
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '11px', 
                        fontWeight: 'bold', 
                        fontFamily: 'Share Tech Mono, monospace',
                        letterSpacing: '1px'
                      }}>
                        {w.type.toUpperCase()}
                      </span>

                      <div className="mono" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                        {w.exercises.length} MOVEMENT{w.exercises.length > 1 ? 'S' : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="mono" style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                        VOL: <span className="neon-cyan" style={{ fontWeight: 'bold' }}>{sessionVolume.toLocaleString()} KG</span>
                      </div>
                      
                      <button 
                        onClick={(e) => handleDeleteWorkout(w.id, e)}
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
                        title="Delete Session"
                      >
                        <Trash2 size={15} />
                      </button>

                      {isExpanded ? <ChevronUp size={18} className="neon-cyan" /> : <ChevronDown size={18} style={{ color: 'var(--text-dim)' }} />}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div 
                      onClick={(e) => e.stopPropagation()} // Prevent clicking details from collapsing
                      style={{ 
                        marginTop: '16px', 
                        borderTop: '1px dashed var(--border-dim)', 
                        paddingTop: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        cursor: 'default'
                      }}
                    >
                      {/* Exercise list grid */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div className="exercise-grid-header" style={{ gap: '8px', padding: '0 8px', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'Share Tech Mono, monospace' }}>
                          <div>EXERCISE</div>
                          <div style={{ textAlign: 'center' }}>SETS</div>
                          <div style={{ textAlign: 'center' }}>REPS</div>
                          <div style={{ textAlign: 'center' }}>WEIGHT</div>
                          <div style={{ textAlign: 'right' }}>VOLUME</div>
                        </div>

                        {w.exercises.map((ex, i) => (
                          <div 
                            key={i} 
                            className="exercise-grid-row"
                            style={{ 
                              gap: '8px', 
                              padding: '8px', 
                              borderRadius: '4px', 
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid rgba(255, 255, 255, 0.04)',
                              fontSize: '13px',
                              alignItems: 'center'
                            }}
                          >
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{ex.name}</div>
                            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{ex.sets}</div>
                            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{ex.reps}</div>
                            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{ex.weight} kg</div>
                            <div className="neon-cyan" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                              {(ex.sets * ex.reps * ex.weight).toLocaleString()} kg
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Notes Section */}
                      {w.notes && (
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)', 
                          background: 'rgba(0, 213, 255, 0.02)', 
                          padding: '10px 12px', 
                          borderRadius: '4px', 
                          borderLeft: '2px solid var(--neon-cyan)' 
                        }}>
                          <FileText size={14} className="neon-cyan" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>
                            <strong style={{ color: 'var(--text-primary)', fontStyle: 'normal' }}>COMMS_MEMO:</strong> "{w.notes}"
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <Dumbbell size={28} />
            <span style={{ fontSize: '12px', letterSpacing: '2px', fontFamily: 'Orbitron, sans-serif' }}>
              NO SESSIONS LOGGED. INITIATE TRAINING PROTOCOL.
            </span>
          </div>
        )}
      </div>

      {/* Cyberpunk Interactive Modal Overlay */}
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
              maxWidth: '650px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--neon-cyan)',
              boxShadow: '0 0 20px rgba(0, 213, 255, 0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: 'modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              gap: '20px'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-dim)', paddingBottom: '12px' }}>
              <h3 className="neon-cyan" style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Orbitron, sans-serif' }}>
                <Sparkles size={18} />
                SOMATIC INTERFACE MATRIX
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
            <form onSubmit={handleSaveWorkout} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Top Controls Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'Share Tech Mono, monospace' }}>
                    DATE CALIBRATION
                  </label>
                  <input 
                    type="date" 
                    className="cyber-input" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'Share Tech Mono, monospace' }}>
                    SOMATIC CLASSIFICATION
                  </label>
                  <select 
                    className="cyber-select" 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="Gym">GYM</option>
                    <option value="Calisthenics">CALISTHENICS</option>
                    <option value="Other">OTHER</option>
                  </select>
                </div>
              </div>

              {/* Exercises Row List Builder */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'Share Tech Mono, monospace' }}>
                      EXERCISE LOADS MATRIX
                    </label>
                    {todayTraining?.muscleGroups?.length > 0 && (
                      <span className="mono" style={{ fontSize: '10px', color: 'var(--neon-cyan)' }}>
                        Suggested focus: {todayTraining.muscleGroups.join(' · ')}
                      </span>
                    )}
                  </div>
                  <button 
                    type="button"
                    className="cyber-button"
                    onClick={addExerciseRow}
                    style={{ 
                      padding: '4px 10px', 
                      fontSize: '11px', 
                      borderColor: 'var(--neon-green)', 
                      color: 'var(--neon-green)',
                      boxShadow: 'none'
                    }}
                  >
                    + ADD MOVEMENT
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                  {exercises.map((ex, index) => (
                    <div 
                      key={index}
                      style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        alignItems: 'center', 
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--border-dim)',
                        padding: '8px',
                        borderRadius: '6px'
                      }}
                    >
                      <input 
                        type="text" 
                        placeholder="Movement Name (e.g. Squat)" 
                        className="cyber-input" 
                        value={ex.name}
                        onChange={(e) => updateExerciseField(index, 'name', e.target.value)}
                        required
                        style={{ flex: 3 }}
                      />
                      <input 
                        type="number" 
                        placeholder="Sets" 
                        min="1"
                        className="cyber-input" 
                        value={ex.sets}
                        onChange={(e) => updateExerciseField(index, 'sets', parseInt(e.target.value) || '')}
                        required
                        style={{ flex: 1, minWidth: '50px', textAlign: 'center' }}
                      />
                      <input 
                        type="number" 
                        placeholder="Reps" 
                        min="1"
                        className="cyber-input" 
                        value={ex.reps}
                        onChange={(e) => updateExerciseField(index, 'reps', parseInt(e.target.value) || '')}
                        required
                        style={{ flex: 1, minWidth: '50px', textAlign: 'center' }}
                      />
                      <input 
                        type="number" 
                        placeholder="Weight (kg)" 
                        min="0"
                        className="cyber-input" 
                        value={ex.weight}
                        onChange={(e) => updateExerciseField(index, 'weight', parseFloat(e.target.value) || 0)}
                        required
                        style={{ flex: 1.5, minWidth: '70px', textAlign: 'center' }}
                      />
                      
                      <button 
                        type="button"
                        onClick={() => removeExerciseRow(index)}
                        disabled={exercises.length === 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: exercises.length === 1 ? 'var(--text-dim)' : 'var(--neon-red)',
                          cursor: exercises.length === 1 ? 'not-allowed' : 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Remove Row"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes Area */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', fontFamily: 'Share Tech Mono, monospace' }}>
                  MEMORANDUM & CALIBRATION OBS (OPTIONAL)
                </label>
                <textarea 
                  className="cyber-input" 
                  rows="3" 
                  placeholder="Neural synchrony stable. Movement metrics aligned."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--border-dim)', paddingTop: '16px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="cyber-button dim" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1 }}
                >
                  DISCARD PROTOCOL
                </button>
                <button 
                  type="submit" 
                  className="cyber-button" 
                  style={{ flex: 2, borderColor: 'var(--neon-cyan)', color: 'var(--neon-cyan)' }}
                >
                  COMPILE TO CENTRAL MEMORY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
