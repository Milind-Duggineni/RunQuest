// src/context/GameContext.tsx
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type GameState = 'walking' | 'encounter' | 'boss' | 'complete' | 'paused';

export interface EquippedItem {
  name: string;
  agility?: number;
  strength?: number;
}

export interface Item {
  id: string;
  name: string;
  agility?: number;
  strength?: number;
  icon?: any;
}

interface State {
  mode: GameState;
  depth: number; // tiles progressed in dungeon
  dungeonLength: number; // total tiles needed to finish
  equippedItems: EquippedItem[];
  inventory: Item[];
  xp: number;
  level: number;
  coins: number;
  combatResult?: string;
}

interface Action {
  type:
    | 'STEP'
    | 'ENCOUNTER'
    | 'RESOLVE_ENCOUNTER'
    | 'SET_COMBAT_RESULT'
    | 'BOSS_DEFEATED'
    | 'GAIN_REWARD'
    | 'COMPLETE'
  | 'PAUSE'
  | 'RESUME'
  | 'LOAD_STATE';
  payload?: any;
}

const initialState: State = {
  mode: 'walking',
  depth: 0,
  dungeonLength: 100, // default corridor size
  equippedItems: [],
  inventory: [],
  xp: 0,
  level: 1,
  coins: 0,
};

// Save state to AsyncStorage
const saveState = async (state: State) => {
  try {
    const jsonValue = JSON.stringify(state);
    await AsyncStorage.setItem('dungeonState', jsonValue);
  } catch (err) {
    console.error('Failed to save state:', err);
  }
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'STEP': {
      const newDepth = state.depth + (action.payload ?? 1);
      if (newDepth >= state.dungeonLength) {
        return { ...state, depth: newDepth, mode: 'boss' };
      }
      return { ...state, depth: newDepth };
    }
    case 'ENCOUNTER':
      return { ...state, mode: 'encounter' };
    case 'RESOLVE_ENCOUNTER':
      return { ...state, mode: 'walking', combatResult: undefined };
    case 'SET_COMBAT_RESULT':
      return { ...state, combatResult: action.payload };
    case 'BOSS_DEFEATED':
      return { ...state, mode: 'complete' };
    case 'GAIN_REWARD': {
      const { xp = 0, coins = 0, item } = action.payload || {};
      const newXp = state.xp + xp;
      // simple level check using util
      let newLevel = state.level;
      const xpToNext = 100 + state.level * 50; // mirror util
      if (newXp >= xpToNext) {
        newLevel += 1;
      }
      return {
        ...state,
        xp: newXp % xpToNext,
        level: newLevel,
        coins: state.coins + coins,
        inventory: item ? [...state.inventory, item] : state.inventory,
      };
    }
    case 'COMPLETE':
      return { ...state, mode: 'complete' };
    case 'PAUSE':
      return { ...state, mode: 'paused' };
    case 'RESUME':
      return { ...state, mode: 'walking' };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const GameContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [state, dispatch] = useReducer(reducer, initialState);

  // Set loading to false on initial mount without loading state
  useEffect(() => {
    const initialize = async () => {
      try {
        // Clear any existing dungeon state
        await AsyncStorage.removeItem('dungeonState');
      } catch (error) {
        console.error('Error initializing state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);
  
  // Save state whenever it changes
  useEffect(() => {
    if (!isLoading && state.mode !== 'paused') { // Don't save when paused to prevent overwriting
      saveState(state);
    }
  }, [state, isLoading]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};
