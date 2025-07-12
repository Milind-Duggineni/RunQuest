// src/navigation/types.ts

// src/navigation/types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  // Auth Flow
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  CharacterSelection: undefined;
  
  // Main App
  Main: {
    screen?: keyof MainTabParamList;
    params?: any;
  } | undefined;
  
  // Dashboard route (used during auth flow)
  Dashboard: {
    screen?: keyof MainTabParamList;
    params?: any;
  } | undefined;
  ActiveDungeon: undefined;

  QuestComplete: { 
    distance: number; 
    time: string; 
    experience: number;
  };
  DungeonGame: {
    dungeonId: string;
    dungeonName: string;
  };
};

export type MainTabParamList = {
  Home: undefined;
  Shop: undefined;
  Dungeon: undefined;
  Profile: undefined;
  Quests: undefined;
  SpecialEvents: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}