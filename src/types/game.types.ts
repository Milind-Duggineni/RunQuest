export type GameState = 'idle' | 'moving' | 'inBattle' | 'resting' | 'inMenu' | 'gameOver';

export interface PlayerStats {
  health: number;
  maxHealth: number;
  xp: number;
  xpToNextLevel: number;
  level: number;
  coins: number;
  strength: number;
  agility: number;
  speed: number;
  pace: number; // steps per second
  lastStepTime: number | null;
}

export interface Position {
  x: number;
  y: number;
  dungeonId: string;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'quest' | 'other';
  value: number;
  quantity: number;
  description: string;
  icon: string;
  stats?: {
    health?: number;
    strength?: number;
    agility?: number;
    speed?: number;
  };
}

export interface Encounter {
  id: string;
  name: string;
  description: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  xpReward: number;
  coinReward: number;
  sprite: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  requirements: {
    type: 'steps' | 'defeat' | 'collect' | 'explore';
    target: string | number;
    current: number;
  };
  rewards: {
    xp: number;
    coins: number;
    items?: Item[];
  };
}

export interface GameContextType {
  // Game state
  gameState: GameState;
  setGameState: (state: GameState) => void;
  
  // Player state
  playerStats: PlayerStats;
  position: Position;
  inventory: Item[];
  equippedItems: {
    weapon: Item | null;
    armor: Item | null;
    accessory: Item | null;
  };
  activeQuests: Quest[];
  completedQuests: string[];
  
  // Game actions
  updatePlayerPosition: (position: Partial<Position>) => void;
  updatePlayerStats: (stats: Partial<PlayerStats>) => void;
  addItem: (item: Item) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  equipItem: (itemId: string) => void;
  useItem: (itemId: string) => void;
  startEncounter: (encounter: Encounter) => void;
  completeEncounter: (encounterId: string, wasVictory: boolean) => void;
  updateQuestProgress: (questId: string, progress: number) => void;
  completeQuest: (questId: string) => void;
  
  // Game time and steps
  gameTime: number;
  totalSteps: number;
  addSteps: (steps: number) => void;
  
  // Current encounter
  currentEncounter: Encounter | null;
  
  // Save/load
  saveGame: () => Promise<{ success: boolean; error?: string }>;
  loadGame: () => Promise<{ success: boolean; error?: string }>;
}
