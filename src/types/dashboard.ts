// src/types/dashboard.ts

// src/types/dashboard.ts

export interface PlayerData {
  playerClass: string;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  health: number;
  strength: number;
  agility: number;
  speed: number;
  equippedItems: EquippedItem[];
}

export interface EquippedItem {
  name: string;
  type: 'Weapon' | 'Armor' | 'Boots';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  image: any; // This will be a require() statement
}

export interface StatItemProps {
  icon: any; // This will be a require() statement
  label: string;
  value: number;
}

export interface EquippedItemProps extends Omit<EquippedItem, 'image'> {
  image: any; // This will be a require() statement
}
