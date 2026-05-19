import { useEffect } from 'react';
import { LS_KEYS } from '../constants';

function getLocalDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function toLocalDateTime(dateStr, hhmm) {
  const [h, m] = (hhmm || '').split(':').map(Number);
  const d = new Date(dateStr);
  d.setHours(Number.isFinite(h) ? h : 0, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
}

export function useExpiryEngine({ habits, habitLogs, setHabitLogs }) {
  useEffect(() => {
    const runTick = () => {
      const now = new Date();
      const todayStr = getLocalDateString(now);

      let tasksChanged = false;
      let logsChanged = false;

      const tasks = JSON.parse(localStorage.getItem(LS_KEYS.DAILY_SKILL_TASKS) || '[]');
      const nextTasks = tasks.map((task) => {
        if (task.date < todayStr && task.completed !== true && task.status !== 'expired' && !task.expired) {
          tasksChanged = true;
          return { ...task, status: 'expired', expired: true };
        }
        if (task.date !== todayStr) return task;
        if (task.completed === true) return task;
        if (task.status === 'expired' || task.expired) return task;
        if (!task.deadlineTime) return task;

        const deadline = toLocalDateTime(todayStr, task.deadlineTime);
        if (now > deadline) {
          tasksChanged = true;
          return { ...task, status: 'expired', expired: true };
        }
        return task;
      });

      if (tasksChanged) {
        localStorage.setItem(LS_KEYS.DAILY_SKILL_TASKS, JSON.stringify(nextTasks));
      }

      const logs = Array.isArray(habitLogs) ? [...habitLogs] : [];
      const alreadyExpiredByHabit = new Set(
        logs
          .filter((l) => l.date === todayStr && (l.status === 'expired' || l.expired))
          .map((l) => l.habitId),
      );

      (habits || []).forEach((habit) => {
        if (!habit.deadlineTime) return;
        const deadline = toLocalDateTime(todayStr, habit.deadlineTime);
        if (now <= deadline) return;

        const completed = logs.some(
          (l) =>
            l.habitId === habit.id &&
            l.date === todayStr &&
            (l.completed === true || (l.completed === undefined && l.status !== 'expired' && !l.expired)),
        );
        if (completed || alreadyExpiredByHabit.has(habit.id)) return;

        logs.push({
          habitId: habit.id,
          date: todayStr,
          completed: false,
          status: 'expired',
          expired: true,
        });
        logsChanged = true;
      });

      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yesterdayStr = getLocalDateString(y);
      const expiredYesterday = new Set(
        logs
          .filter((l) => l.date === yesterdayStr && (l.status === 'expired' || l.expired))
          .map((l) => l.habitId),
      );
      (habits || []).forEach((habit) => {
        const isDaily = !habit.target || habit.target === 'daily' || habit.frequency === 'Daily';
        if (!isDaily) return;
        if (expiredYesterday.has(habit.id)) return;
        const doneYesterday = logs.some(
          (l) =>
            l.habitId === habit.id &&
            l.date === yesterdayStr &&
            (l.completed === true || (l.completed === undefined && l.status !== 'expired' && !l.expired)),
        );
        if (doneYesterday) return;
        logs.push({
          habitId: habit.id,
          date: yesterdayStr,
          completed: false,
          status: 'expired',
          expired: true,
        });
        logsChanged = true;
      });

      if (logsChanged) {
        setHabitLogs(logs);
      }

      if (tasksChanged || logsChanged) {
        window.dispatchEvent(new CustomEvent('tracker-expiry-updated'));
      }
    };

    runTick();
    const id = setInterval(runTick, 60000);
    return () => clearInterval(id);
  }, [habits, habitLogs, setHabitLogs]);
}
