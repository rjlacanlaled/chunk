export const LEVELS = [
  { name: 'Starter', xp: 0, medal: '/chunk-gamification/chunk-medal-1-starter.svg' },
  { name: 'Builder', xp: 100, medal: '/chunk-gamification/chunk-medal-2-builder.svg' },
  { name: 'Chunker', xp: 500, medal: '/chunk-gamification/chunk-medal-3-chunker.svg' },
  { name: 'Crusher', xp: 1500, medal: '/chunk-gamification/chunk-medal-4-crusher.svg' },
  { name: 'Champion', xp: 3500, medal: '/chunk-gamification/chunk-medal-5-champion.svg' },
  { name: 'Legend', xp: 10000, medal: '/chunk-gamification/chunk-medal-6-legend.svg' },
];

export const getXpForTask = (score: number | null): number => {
  const s = score ?? 5;
  if (s <= 5) return 5;
  if (s <= 15) return 15;
  if (s <= 30) return 30;
  if (s <= 100) return 50;
  return 100;
};

export const getLevel = (xp: number) => {
  let current = LEVELS[0];
  let next: typeof LEVELS[number] | null = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
      break;
    }
  }
  return { current, next, xp };
};

export const getStreak = (completedDates: Date[]): number => {
  if (completedDates.length === 0) return 0;

  const toDateStr = (d: Date) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  const uniqueDays = [...new Set(completedDates.map(toDateStr))].sort().reverse();
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const current = new Date(uniqueDays[i - 1]);
    const prev = new Date(uniqueDays[i]);
    const diffMs = current.getTime() - prev.getTime();
    const diffDays = Math.round(diffMs / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};
