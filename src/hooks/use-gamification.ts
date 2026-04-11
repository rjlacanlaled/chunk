'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { getXpForTask, getLevel, getStreak } from '@/lib/gamification';
import { getXp, updateXp } from '@/server/actions/gamification';
import type { Task } from '@/types/task';
import { XP_STORAGE_KEY } from '@/lib/storage-keys';

const loadLocalXp = (): number => {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem(XP_STORAGE_KEY);
  return stored ? Number(stored) : 0;
};

const saveLocalXp = (xp: number) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(XP_STORAGE_KEY, String(xp));
};

export const useGamification = (tasks: Task[], userId?: string) => {
  const [xp, setXp] = useState<number | null>(null);
  const [lastXpGain, setLastXpGain] = useState<number | null>(null);
  const pendingPersist = useRef<number | null>(null);

  useEffect(() => {
    setXp(null);
    pendingPersist.current = null;
    if (userId) {
      getXp(userId).then(setXp);
    } else {
      setXp(loadLocalXp());
    }
  }, [userId]);

  const addXp = useCallback((amount: number) => {
    setXp((prev) => {
      if (prev === null) return prev;
      const next = prev + amount;
      pendingPersist.current = next;
      return next;
    });
    setLastXpGain(amount);
    setTimeout(() => setLastXpGain(null), 1500);
  }, []);

  const removeXp = useCallback((amount: number) => {
    setXp((prev) => {
      if (prev === null) return prev;
      const next = Math.max(0, prev - amount);
      pendingPersist.current = next;
      return next;
    });
  }, []);

  // Debounced persist — only writes the latest value after rapid changes settle
  useEffect(() => {
    if (pendingPersist.current === null) return;
    const value = pendingPersist.current;
    const timer = setTimeout(() => {
      pendingPersist.current = null;
      if (userId) {
        updateXp(userId, value);
      } else {
        saveLocalXp(value);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [xp, userId]);

  const displayXp = xp ?? 0;
  const level = useMemo(() => getLevel(displayXp), [displayXp]);

  const completedDates = useMemo(
    () => tasks
      .filter((t) => t.status === 'done')
      .map((t) => new Date(t.updatedAt)),
    [tasks],
  );

  const streak = useMemo(() => getStreak(completedDates), [completedDates]);

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
    xp: displayXp,
    level,
    streak,
    lastXpGain,
    addXp,
    completeTask,
    uncompleteTask,
    getXpForTask,
  };
};
