const getThresholdIndex = (score: number): number => {
  if (score <= 5) return 0;
  if (score <= 15) return 1;
  if (score <= 30) return 2;
  if (score <= 100) return 3;
  if (score <= 500) return 4;
  return 5;
};

const TEXT_COLORS = [
  'text-emerald-400',
  'text-amber-400',
  'text-orange-400',
  'text-red-400',
  'text-purple-400',
  'text-pink-400',
];

const DOT_COLORS = [
  'bg-emerald-400',
  'bg-amber-400',
  'bg-orange-400',
  'bg-red-400',
  'bg-purple-400',
  'bg-pink-400',
];

const BORDER_COLORS = [
  'border-l-emerald-400/50',
  'border-l-amber-400/50',
  'border-l-orange-400/50',
  'border-l-red-400/50',
  'border-l-purple-400/50',
  'border-l-pink-400/50',
];

export const getScoreColor = (score: number): string => TEXT_COLORS[getThresholdIndex(score)];

export const getScoreDotColor = (score: number): string => DOT_COLORS[getThresholdIndex(score)];

export const getScoreBorderColor = (score: number | null): string => {
  if (!score) return 'border-l-border/40';
  return BORDER_COLORS[getThresholdIndex(score)];
};
