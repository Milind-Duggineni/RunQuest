// src/utils/leveling.ts
export function calculateXpToNextLevel(level: number): number {
  return 100 + level * 50;
}
