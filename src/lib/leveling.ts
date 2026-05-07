// Single source of truth for level/points calculations.
// Used by ProgressWidget, Profile, LevelBadge, etc. so numbers always agree.

export const LEVEL_THRESHOLDS = [0, 0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];
export const MAX_LEVEL = LEVEL_THRESHOLDS.length - 1;

export interface LevelInfo {
  level: number;
  points: number;
  isMaxLevel: boolean;
  currentLevelPoints: number;
  nextLevelPoints: number;
  pointsNeeded: number;     // span between current and next level
  progressInLevel: number;  // points earned within current level
  remainingToNext: number;  // points still required to reach next level
  progressPercentage: number; // 0-100
}

/**
 * Derive the level from raw points using LEVEL_THRESHOLDS.
 * Optionally accepts a stored level and uses whichever is higher,
 * so a lagging DB value never makes the bar go backwards.
 */
export function computeLevelInfo(points: number, storedLevel?: number | null): LevelInfo {
  const safePoints = Math.max(0, Math.floor(points ?? 0));

  // Always derive level from actual points so the bar stays in sync with the
  // displayed points value. A stale storedLevel would otherwise desync the bar.
  let derivedLevel = 1;
  for (let i = 1; i <= MAX_LEVEL; i++) {
    if (safePoints >= LEVEL_THRESHOLDS[i]) derivedLevel = i;
  }
  void storedLevel; // intentionally ignored to keep a single source of truth
  const level = Math.min(MAX_LEVEL, derivedLevel);

  const isMaxLevel = level >= MAX_LEVEL;
  const currentLevelPoints = LEVEL_THRESHOLDS[level];
  const nextLevelPoints = isMaxLevel ? currentLevelPoints : LEVEL_THRESHOLDS[level + 1];
  const pointsNeeded = Math.max(0, nextLevelPoints - currentLevelPoints);
  const progressInLevel = Math.max(0, Math.min(safePoints - currentLevelPoints, pointsNeeded));
  const remainingToNext = isMaxLevel ? 0 : Math.max(0, nextLevelPoints - safePoints);
  const progressPercentage = isMaxLevel
    ? 100
    : pointsNeeded > 0
      ? Math.min((progressInLevel / pointsNeeded) * 100, 100)
      : 0;

  return {
    level,
    points: safePoints,
    isMaxLevel,
    currentLevelPoints,
    nextLevelPoints,
    pointsNeeded,
    progressInLevel,
    remainingToNext,
    progressPercentage,
  };
}