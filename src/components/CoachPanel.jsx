import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Cpu } from 'lucide-react';
import { useCoach } from '../hooks/useCoach';

export default function CoachPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const { askCoach, isLoading, response } = useCoach();
  const responseEndRef = useRef(null);

  // Auto-scroll to bottom of response area
  useEffect(() => {
    if (responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedText, isLoading]);

  // Typewriter effect when response changes
  useEffect(() => {
    if (response && !isLoading) {
      setDisplayedText('');
      setIsTyping(true);
      
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(response.slice(0, i + 1));
        i++;
        if (i >= response.length) {
          clearInterval(intervalId);
          setIsTyping(false);
        }
      }, 18);
      
      return () => clearInterval(intervalId);
    }
  }, [response, isLoading]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    // Clear previous text
    setDisplayedText('');
    askCoach(inputText);
    setInputText('');
  };

  const handleQuickNudge = (prompt) => {
    setDisplayedText('');
    askCoach(prompt);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'transparent',
          border: '2px solid var(--neon-magenta, #ff00ff)',
          color: 'var(--neon-magenta, #ff00ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 99,
          boxShadow: '0 0 15px rgba(255, 0, 255, 0.5)',
          transition: 'all 0.3s ease',
          outline: 'none',
          ...(isOpen ? { transform: 'scale(0)' } : {})
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 0, 255, 0.8)';
          e.currentTarget.style.backgroundColor = 'rgba(255, 0, 255, 0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 255, 0.5)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Cpu size={28} />
      </button>

      {/* Overlay (Optional, but good for focus) */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 101
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-up Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60vh',
          backgroundColor: 'var(--bg-panel, #0a0a0a)',
          borderTop: '1px solid var(--neon-magenta, #ff00ff)',
          boxShadow: '0 -5px 20px rgba(255, 0, 255, 0.2)',
          zIndex: 102,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 300ms ease',
          display: 'flex',
          flexDirection: 'column',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          maxWidth: '800px',
          margin: '0 auto'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-dim, #333)'
        }}>
          <div style={{
            fontFamily: 'var(--font-display, "Orbitron", sans-serif)',
            color: 'var(--neon-magenta, #ff00ff)',
            fontSize: '18px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Bot size={20} />
            // AI COACH
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary, #aaa)',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Quick Nudges */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          overflowX: 'auto',
          borderBottom: '1px solid var(--border-dim, #333)',
          flexShrink: 0
        }}>
          {["Analyze my week", "What should I train today?", "Roast my consistency"].map((nudge) => (
            <button
              key={nudge}
              onClick={() => handleQuickNudge(nudge)}
              disabled={isLoading || isTyping}
              style={{
                backgroundColor: 'rgba(255, 0, 255, 0.05)',
                border: '1px solid rgba(255, 0, 255, 0.3)',
                color: 'var(--neon-magenta, #ff00ff)',
                fontFamily: 'var(--font-mono, "Share Tech Mono", monospace)',
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: (isLoading || isTyping) ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                opacity: (isLoading || isTyping) ? 0.5 : 1
              }}
              onMouseOver={(e) => {
                if (!isLoading && !isTyping) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 0, 255, 0.2)';
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading && !isTyping) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 0, 255, 0.05)';
                }
              }}
            >
              {nudge}
            </button>
          ))}
        </div>

        {/* Response Area */}
        <div style={{
          flexGrow: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {isLoading ? (
            <div style={{
              fontFamily: 'var(--font-mono, "Share Tech Mono", monospace)',
              color: 'var(--neon-cyan, #00ffff)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}>
              <span>PROCESSING</span>
              <span className="blinking-cursor">_</span>
            </div>
          ) : displayedText ? (
            <div style={{
              fontFamily: 'var(--font-mono, "Share Tech Mono", monospace)',
              color: 'var(--neon-cyan, #00ffff)',
              fontSize: '15px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              textShadow: '0 0 5px rgba(0, 255, 255, 0.3)'
            }}>
              {displayedText}
              {isTyping && <span className="blinking-cursor" style={{ marginLeft: '4px' }}>█</span>}
            </div>
          ) : (
            <div style={{
              fontFamily: 'var(--font-mono, "Share Tech Mono", monospace)',
              color: 'var(--text-dim, #555)',
              margin: 'auto',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              AWAITING INPUT...
            </div>
          )}
          <div ref={responseEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border-dim, #333)',
          backgroundColor: 'rgba(0,0,0,0.2)'
        }}>
          <form 
            onSubmit={handleSend}
            style={{
              display: 'flex',
              gap: '12px'
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Query AI Coach..."
              disabled={isLoading || isTyping}
              style={{
                flexGrow: 1,
                backgroundColor: 'var(--bg-input, #111)',
                border: '1px solid var(--border-dim, #333)',
                color: 'var(--text-primary, #fff)',
                fontFamily: 'var(--font-mono, "Share Tech Mono", monospace)',
                padding: '12px',
                borderRadius: '4px',
                outline: 'none',
                transition: 'border-color 0.2s',
                opacity: (isLoading || isTyping) ? 0.5 : 1
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--neon-magenta, #ff00ff)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-dim, #333)'}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading || isTyping}
              style={{
                backgroundColor: 'rgba(255, 0, 255, 0.1)',
                border: '1px solid var(--neon-magenta, #ff00ff)',
                color: 'var(--neon-magenta, #ff00ff)',
                padding: '0 20px',
                borderRadius: '4px',
                cursor: (!inputText.trim() || isLoading || isTyping) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: (!inputText.trim() || isLoading || isTyping) ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (inputText.trim() && !isLoading && !isTyping) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 0, 255, 0.3)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 0, 255, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                if (inputText.trim() && !isLoading && !isTyping) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 0, 255, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
      
      {/* Blinking Cursor Animation */}
      <style>
        {`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .blinking-cursor {
            animation: blink 1s step-end infinite;
          }
        `}
      </style>
    </>
  );
}
