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
  const [xp, setXp] = useState(0);
  const [lastXpGain, setLastXpGain] = useState<number | null>(null);
  const dbLoaded = useRef(false);

  useEffect(() => {
    if (userId) {
      getXp(userId).then((dbXp) => {
        setXp(dbXp);
        dbLoaded.current = true;
      });
    } else {
      setXp(loadLocalXp());
      dbLoaded.current = true;
    }
  }, [userId]);

  const addXp = useCallback((amount: number) => {
    setXp((prev) => {
      const next = prev + amount;
      if (userId) {
        updateXp(userId, next);
      } else {
        saveLocalXp(next);
      }
      return next;
    });
    setLastXpGain(amount);
    setTimeout(() => setLastXpGain(null), 1500);
  }, [userId]);

  const removeXp = useCallback((amount: number) => {
    setXp((prev) => {
      const next = Math.max(0, prev - amount);
      if (userId) {
        updateXp(userId, next);
      } else {
        saveLocalXp(next);
      }
      return next;
    });
  }, [userId]);

  const level = useMemo(() => getLevel(xp), [xp]);

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
