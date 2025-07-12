// src/utils/combat.ts
/*
  Simple combat resolution helper, detached from UI.
  The formula mirrors the pseudo-code shared by the user.
*/

export interface Stats {
  strength: number;
  agility: number;
}

export interface EquippedItem {
  strength?: number;
  agility?: number;
}

export interface Enemy {
  level: number;
  baseHit: number;
  baseDodge: number;
  health: number;
}

export type CombatResult = 'Dodged' | 'Hit Enemy' | 'Player Hit';

const BASE_DODGE = 0.1;
const BASE_HIT = 0.7;
const PACE_THRESHOLD = 100; // steps / min

export function resolveCombat(
  pace: number,
  player: Stats,
  enemy: Enemy,
  equipped: EquippedItem[] = []
): CombatResult {
    const bonusAgility = equipped.reduce((sum, it) => sum + (it.agility ?? 0), 0);
  const bonusStrength = equipped.reduce((sum, it) => sum + (it.strength ?? 0), 0);
  const modAgility = player.agility + bonusAgility;
  const modStrength = player.strength + bonusStrength;

  const dodgeChance = BASE_DODGE + modAgility * 0.02 + (pace > PACE_THRESHOLD ? 0.2 : -0.1);
  const hitChance = BASE_HIT + modStrength * 0.03 + (pace > PACE_THRESHOLD ? 0.1 : -0.05);

  const roll = Math.random();
  if (roll < dodgeChance) return 'Dodged';
  if (roll < dodgeChance + hitChance) return 'Hit Enemy';
  return 'Player Hit';
}
