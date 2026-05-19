import { useState } from 'react';
import { LS_KEYS } from '../constants';

export function useCoach() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');

  const buildContext = () => {
    // Helper to get raw data
    const getLocal = (key, fallback) => {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
      } catch (error) {
        return fallback;
      }
    };

    const workouts = getLocal(LS_KEYS.WORKOUTS, []);
    const habits = getLocal(LS_KEYS.HABITS, []);
    const habitLogs = getLocal(LS_KEYS.HABIT_LOGS, []);
    const skills = getLocal(LS_KEYS.SKILLS, []);

    // 1. Recent Workouts (last 5)
    const recentWorkouts = workouts
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(w => ({
        date: w.date,
        type: w.type,
        exercises: w.exercises ? w.exercises.map(e => e.name).join(', ') : 'None'
      }));

    // 2. Habit Streaks & Completed Today
    const today = new Date().toISOString().split('T')[0];
    const habitStreaks = habits.map(h => {
      const completedToday = habitLogs.some(log => log.habitId === h.id && log.date === today);
      return {
        name: h.name,
        currentStreak: h.streak || 0,
        completedToday
      };
    });

    // 3. Skill Progress
    const skillProgress = skills.map(s => ({
      name: s.name,
      level: s.level,
      progress: s.xp
    }));

    // 4. Total XP (sum of skill xp)
    const totalXP = skills.reduce((sum, s) => sum + (s.xp || 0), 0);

    return {
      recentWorkouts,
      habitStreaks,
      skillProgress,
      totalXP,
      todayDate: new Date().toISOString()
    };
  };

  const askCoach = async (userPrompt) => {
    setIsLoading(true);
    setResponse('');
    
    try {
      const context = buildContext();
      
      const systemPrompt = "You are a brutally honest but motivating personal coach for an ECE student at SSN College of Engineering, Chennai — targeting Qualcomm and NVIDIA placements in Aug 2027. He is pivoting into Edge AI (TFLite, ONNX, C++, ARM/NPU) and has a Gen-AI internship background. You know his live stats. Keep responses under 5 sentences, punchy and direct. Reference his actual projects (AeroLung, CivicFlow, SentinelEdge) when relevant. Cyberpunk tone. No emojis. Address him as 'operative'.";
      
      const fullPrompt = `${userPrompt}\n\nMy current stats:\n${JSON.stringify(context, null, 2)}`;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [
            {
              parts: [{ text: fullPrompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 300
          }
        })
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI node.';
      setResponse(text);
      
    } catch (error) {
      console.error('AI Coach Error:', error);
      setResponse(`SYSTEM ERROR: Unable to reach AI Coach node. Check API key configuration. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return { askCoach, isLoading, response };
}
