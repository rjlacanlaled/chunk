'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { getXpForTask, getLevel, getStreak } from '@/lib/gamification';
import type { Task } from '@/types/task';

const XP_STORAGE_KEY = 'chunk-xp';

const loadXp = (): number => {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem(XP_STORAGE_KEY);
  return stored ? Number(stored) : 0;
};

const saveXp = (xp: number) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(XP_STORAGE_KEY, String(xp));
};

export const useGamification = (tasks: Task[]) => {
  const [xp, setXp] = useState(loadXp);
  const [lastXpGain, setLastXpGain] = useState<number | null>(null);

  useEffect(() => {
    setXp(loadXp());
  }, []);

  const addXp = useCallback((amount: number) => {
    setXp((prev) => {
      const next = prev + amount;
      saveXp(next);
      return next;
    });
    setLastXpGain(amount);
    setTimeout(() => setLastXpGain(null), 1500);
  }, []);

  const level = useMemo(() => getLevel(xp), [xp]);

  const completedDates = useMemo(
    () => tasks
      .filter((t) => t.status === 'done')
      .map((t) => new Date(t.updatedAt)),
    [tasks],
  );

  const streak = useMemo(() => getStreak(completedDates), [completedDates]);

  const removeXp = useCallback((amount: number) => {
    setXp((prev) => {
      const next = Math.max(0, prev - amount);
      saveXp(next);
      return next;
    });
  }, []);

  const completeTask = useCallback((task: Task) => {
    const earned = getXpForTask(task.score);
    addXp(earned);
    return earned;
  }, [addXp]);

  const uncompleteTask = useCallback((task: Task) => {
    const lost = getXpForTask(task.score);
    removeXp(lost);
  }, [removeXp]);

  return {
    xp,
    level,
    streak,
    lastXpGain,
    addXp,
    completeTask,
    uncompleteTask,
    getXpForTask,
  };
};
