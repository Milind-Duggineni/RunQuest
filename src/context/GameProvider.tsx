import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState, PlayerStats, Position, Item, Encounter, Quest, GameContextType } from '../types/game.types';

// Initial state
const initialPlayerStats: PlayerStats = {
  health: 100,
  maxHealth: 100,
  xp: 0,
  xpToNextLevel: 100,
  level: 1,
  coins: 0,
  strength: 5,
  agility: 5,
  speed: 5,
  pace: 1,
  lastStepTime: null,
};

const initialPosition: Position = {
  x: 0,
  y: 0,
  dungeonId: 'start',
};

interface GameStateType {
  gameState: GameState;
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
  gameTime: number;
  totalSteps: number;
  currentEncounter: Encounter | null;
}

// Initial game state
const initialState: GameStateType = {
  gameState: 'idle',
  playerStats: initialPlayerStats,
  position: initialPosition,
  inventory: [],
  equippedItems: {
    weapon: null,
    armor: null,
    accessory: null,
  },
  activeQuests: [],
  completedQuests: [],
  gameTime: 0,
  totalSteps: 0,
  currentEncounter: null,
};

// Create context with default values
const GameContext = createContext<GameContextType | undefined>(undefined);

// Game Provider Component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { gameState, playerStats, position, inventory, equippedItems, activeQuests } = state;

  // Load saved game state on mount
  useEffect(() => {
    const loadGame = async () => {
      try {
        const savedGame = await AsyncStorage.getItem('gameState');
        if (savedGame) {
          dispatch({ type: 'LOAD_SAVED_GAME', payload: JSON.parse(savedGame) });
        }
      } catch (error) {
        console.error('Failed to load game:', error);
      }
    };
    loadGame();
  }, []);

  // Save game state when it changes
  useEffect(() => {
    const saveGame = async () => {
      try {
        await AsyncStorage.setItem('gameState', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save game:', error);
      }
    };
    saveGame();
  }, [state]);

  // Game actions
  const setGameState = useCallback((newState: GameState) => {
    dispatch({ type: 'SET_GAME_STATE', payload: newState });
  }, []);

  const updatePlayerStats = useCallback((stats: Partial<PlayerStats>) => {
    dispatch({ type: 'UPDATE_PLAYER_STATS', payload: stats });
  }, []);

  const updatePosition = useCallback((position: Partial<Position>) => {
    dispatch({ type: 'UPDATE_POSITION', payload: position });
  }, []);

  const addItem = useCallback((item: Item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  }, []);

  const removeItem = useCallback((itemId: string, quantity: number = 1) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId, quantity } });
  }, []);

  const equipItem = useCallback((item: Item) => {
    if (['weapon', 'armor', 'accessory'].includes(item.type)) {
      dispatch({ type: 'EQUIP_ITEM', payload: item });
    }
  }, []);

  const useItem = useCallback((itemId: string) => {
    // Implement item usage logic here
    console.log(`Using item: ${itemId}`);
  }, []);

  const startEncounter = useCallback((encounter: Encounter) => {
    dispatch({ type: 'START_ENCOUNTER', payload: encounter });
  }, []);

  const completeEncounter = useCallback((wasVictory: boolean) => {
    dispatch({ type: 'COMPLETE_ENCOUNTER', payload: { wasVictory } });
  }, []);

  const updateQuestProgress = useCallback((questId: string, progress: number) => {
    dispatch({ type: 'UPDATE_QUEST_PROGRESS', payload: { questId, progress } });
  }, []);

  const completeQuest = useCallback((questId: string) => {
    dispatch({ type: 'COMPLETE_QUEST', payload: questId });
  }, []);

  const addSteps = useCallback((steps: number) => {
    dispatch({ type: 'ADD_STEPS', payload: steps });
  }, []);

  // Calculate derived stats from equipped items
  const calculateStats = useCallback(() => {
    let stats = { ...initialPlayerStats };
    
    // Apply equipped items stats
    Object.values(equippedItems).forEach(item => {
      if (item?.stats) {
        Object.entries(item.stats).forEach(([stat, value]) => {
          if (stat in stats) {
            stats[stat as keyof PlayerStats] += value;
          }
        });
      }
    });
    
    return stats;
  }, [equippedItems]);

  // Calculate current stats including equipment bonuses
  const currentStats = calculateStats();

  // Context value
  const value: GameContextType = {
    // State
    gameState,
    playerStats: { ...playerStats, ...currentStats },
    position,
    inventory,
    equippedItems,
    activeQuests,
    completedQuests: state.completedQuests,
    gameTime: state.gameTime,
    totalSteps: state.totalSteps,
    currentEncounter: state.currentEncounter,
    
    // Actions
    setGameState,
    updatePlayerPosition: updatePosition,
    updatePlayerStats,
    addItem,
    removeItem,
    equipItem: (itemId: string) => {
      const item = inventory.find(i => i.id === itemId);
      if (item) {
        equipItem(item);
      }
    },
    useItem,
    startEncounter,
    completeEncounter: (encounterId: string, wasVictory: boolean) => {
      completeEncounter(wasVictory);
      // Update quest progress for defeat quests if applicable
      if (wasVictory) {
        updateQuestProgress(`defeat_${encounterId}`, 1);
      }
    },
    updateQuestProgress,
    completeQuest,
    addSteps,
    saveGame: async () => {
      try {
        await AsyncStorage.setItem('gameState', JSON.stringify(state));
        return { success: true };
      } catch (error) {
        console.error('Failed to save game:', error);
        return { success: false, error: 'Failed to save game' };
      }
    },
    loadGame: async () => {
      try {
        const savedGame = await AsyncStorage.getItem('gameState');
        if (savedGame) {
          dispatch({ type: 'LOAD_SAVED_GAME', payload: JSON.parse(savedGame) });
          return { success: true };
        }
        return { success: false, error: 'No saved game found' };
      } catch (error) {
        console.error('Failed to load game:', error);
        return { success: false, error: 'Failed to load game' };
      }
    },
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// Custom hook to use the game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

// Reducer function
type GameAction =
  | { type: 'SET_GAME_STATE'; payload: GameState }
  | { type: 'UPDATE_PLAYER_STATS'; payload: Partial<PlayerStats> }
  | { type: 'UPDATE_POSITION'; payload: Partial<Position> }
  | { type: 'ADD_ITEM'; payload: Item }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string; quantity?: number } }
  | { type: 'EQUIP_ITEM'; payload: Item }
  | { type: 'START_ENCOUNTER'; payload: Encounter }
  | { type: 'COMPLETE_ENCOUNTER'; payload: { wasVictory: boolean } }
  | { type: 'UPDATE_QUEST_PROGRESS'; payload: { questId: string; progress: number } }
  | { type: 'COMPLETE_QUEST'; payload: string }
  | { type: 'ADD_STEPS'; payload: number }
  | { type: 'LOAD_SAVED_GAME'; payload: Partial<GameStateType> };

function gameReducer(state: GameStateType, action: GameAction): GameStateType {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return { ...state, gameState: action.payload };

    case 'UPDATE_PLAYER_STATS':
      return {
        ...state,
        playerStats: { ...state.playerStats, ...action.payload },
      };

    case 'UPDATE_POSITION':
      return {
        ...state,
        position: { ...state.position, ...action.payload },
      };

    case 'ADD_ITEM':
      const existingItem = state.inventory.find(item => item.id === action.payload.id);
      if (existingItem) {
        return {
          ...state,
          inventory: state.inventory.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: (item.quantity || 1) + (action.payload.quantity || 1) }
              : item
          ),
        };
      }
      return {
        ...state,
        inventory: [...state.inventory, { ...action.payload, quantity: action.payload.quantity || 1 }],
      };

    case 'REMOVE_ITEM':
      const { itemId, quantity = 1 } = action.payload;
      const itemToRemove = state.inventory.find(item => item.id === itemId);
      
      if (!itemToRemove) return state;
      
      if (itemToRemove.quantity && itemToRemove.quantity > quantity) {
        return {
          ...state,
          inventory: state.inventory.map(item =>
            item.id === itemId
              ? { ...item, quantity: item.quantity! - quantity }
              : item
          ),
        };
      }
      return {
        ...state,
        inventory: state.inventory.filter(item => item.id !== itemId),
      };

    case 'EQUIP_ITEM':
      const { type } = action.payload;
      if (!type) return state;
      
      // If the item is already equipped, unequip it
      if (state.equippedItems[type as keyof typeof state.equippedItems]?.id === action.payload.id) {
        return {
          ...state,
          equippedItems: { ...state.equippedItems, [type]: null },
        };
      }
      
      // Equip the new item
      return {
        ...state,
        equippedItems: { ...state.equippedItems, [type]: action.payload },
      };

    case 'START_ENCOUNTER':
      return {
        ...state,
        gameState: 'inBattle',
        currentEncounter: action.payload,
      };

    case 'COMPLETE_ENCOUNTER':
      const { wasVictory } = action.payload;
      if (!wasVictory) {
        return {
          ...state,
          gameState: 'idle',
          currentEncounter: null,
        };
      }
      
      if (!state.currentEncounter) return state;
      
      const xpGain = state.currentEncounter.xpReward || 0;
      const coinGain = state.currentEncounter.coinReward || 0;
      
      return {
        ...state,
        gameState: 'idle',
        currentEncounter: null,
        playerStats: {
          ...state.playerStats,
          xp: state.playerStats.xp + xpGain,
          coins: state.playerStats.coins + coinGain,
        },
      };

    case 'UPDATE_QUEST_PROGRESS':
      return {
        ...state,
        activeQuests: state.activeQuests.map(quest =>
          quest.id === action.payload.questId
            ? {
                ...quest,
                requirements: {
                  ...quest.requirements,
                  current: Math.min(
                    quest.requirements.current + action.payload.progress,
                    quest.requirements.target as number
                  ),
                },
              }
            : quest
        ),
      };

    case 'COMPLETE_QUEST':
      const quest = state.activeQuests.find(q => q.id === action.payload);
      if (!quest) return state;
      
      return {
        ...state,
        activeQuests: state.activeQuests.filter(q => q.id !== action.payload),
        completedQuests: [...state.completedQuests, action.payload],
        playerStats: {
          ...state.playerStats,
          xp: state.playerStats.xp + (quest.rewards?.xp || 0),
          coins: state.playerStats.coins + (quest.rewards?.coins || 0),
        },
        inventory: quest.rewards?.items
          ? [...state.inventory, ...quest.rewards.items]
          : state.inventory,
      };

    case 'ADD_STEPS':
      return {
        ...state,
        totalSteps: state.totalSteps + action.payload,
        gameTime: state.gameTime + Math.floor(action.payload / (state.playerStats.pace || 1)),
      };

    case 'LOAD_SAVED_GAME':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}
