import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
// Define types locally since we can't import from '../types'
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  age: number | null;
  player_class: string | null;
  current_xp: number;
  xp_to_next_level: number;
  health: number;
  strength: number;
  agility: number;
  speed: number;
  coins: number;
  notifications_enabled: boolean;
  location_permission_granted: boolean;
  is_google_fit_linked: boolean;
  is_apple_health_linked: boolean;
  equipped_items: any[];
  inventory: InventoryItemType[];
  level: number;
  active_quest_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  stat_rewards: {
    xp?: number;
    health?: number;
    strength?: number;
    agility?: number;
    speed?: number;
    coins?: number;
    rare_item?: string;
  };
  difficulty_level: number;
  trigger_type: 'distance' | 'pace' | 'repeat' | 'streak' | 'boss_fight';
  trigger_value: number;
  is_repeatable: boolean;
  class_requirement: string | null;
  zone_requirement: string | null;
  next_quest_id: string | null;
}
import * as yup from 'yup';

// Validation schemas
const signInSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const signUpSchema = signInSchema.concat(
  yup.object().shape({
    username: yup.string().min(3, 'Username must be at least 3 characters').required('Username is required'),
  })
);

// Define types
export interface InventoryItemType {
  name: string;
  quantity: number;
  description: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  age: number | null;
  player_class: string | null;
  current_xp: number;
  xp_to_next_level: number;
  health: number;
  strength: number;
  agility: number;
  speed: number;
  coins: number;
  notifications_enabled: boolean;
  location_permission_granted: boolean;
  is_google_fit_linked: boolean;
  is_apple_health_linked: boolean;
  equipped_items: any[];
  inventory: InventoryItemType[];
  level: number;
  active_quest_id: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface QuestData {
  id: string;
  title: string;
  description: string;
  stat_rewards: {
    xp?: number;
    health?: number;
    strength?: number;
    agility?: number;
    speed?: number;
    coins?: number;
    rare_item?: string;
  };
  difficulty_level: number;
  trigger_type: 'distance' | 'pace' | 'repeat' | 'streak' | 'boss_fight';
  trigger_value: number;
  is_repeatable: boolean;
  class_requirement: string | null;
  zone_requirement: string | null;
  next_quest_id: string | null;
}

// --- Dungeon Types ---
export interface DungeonData {
  id: string;
  title: string;
  description: string;
  stat_rewards: {
    xp?: number;
    health?: number;
    strength?: number;
    agility?: number;
    speed?: number;
    coins?: number;
    rare_item?: string;
  };
  difficulty_level: number;
  trigger_type: 'distance' | 'pace' | 'repeat' | 'streak' | 'boss_fight';
  trigger_value: number;
  is_repeatable: boolean;
  zone_requirement: string | null;
  next_dungeon_id: string | null;
}

export interface UserDungeonProgress {
  id: string;
  user_id: string;
  dungeon_id: string;
  current_progress: number;
  is_completed: boolean;
  assigned_at: string;
  completed_at: string | null;
  dungeons: DungeonData;
}

export interface UserQuestProgress {
  id: string;
  user_id: string;
  quest_id: string;
  current_progress: number;
  is_completed: boolean;
  assigned_at: string;
  completed_at: string | null;
  quests: QuestData;
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthReady: boolean;
  userProfile: UserProfile | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string) => Promise<{
    success: boolean;
    data?: { user: any | null; session: Session | null };
    error?: string;
  }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  fetchUserProfile: (userId: string) => Promise<void>;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  fetchActiveQuest: () => Promise<UserQuestProgress | null>;
  assignInitialQuest: () => Promise<{ success: boolean; error?: string }>;
  completeQuestAndAwardRewards: (
    userQuestId: string,
    questDetails: QuestData
  ) => Promise<{ success: boolean; error?: string }>;
  updateQuestProgress: (userQuestId: string, progress: number) => Promise<{ success: boolean; error?: string }>;
  fetchActiveDungeons: () => Promise<{ data: UserDungeonProgress[] | null; error?: string }>;
  completeDungeonAndAwardRewards: (
    userDungeonId: string,
    dungeonDetails: DungeonData
  ) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialAuthProcessingComplete, setIsInitialAuthProcessingComplete] = useState<boolean>(false);

// In AuthContext.tsx, update the auth state listener effect
useEffect(() => {
  if (!supabase) {
    console.warn('Supabase client not initialized');
    setIsAuthReady(true);
    return () => {}; // Return empty cleanup function
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
    console.log('Auth state changed:', session ? 'Authenticated' : 'Unauthenticated');
    setSession(session);
    if (session) {
      try {
        if (!supabase) {
          throw new Error('Supabase client not initialized');
        }
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);
        if (user) {
          await fetchUserProfile(user.id);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    }
  });

  return () => {
    subscription?.unsubscribe();
  };
}, []);

  // Initialize auth state
  useEffect(() => {
    console.log('AuthProvider: Initializing auth state');
    const initializeAuth = async () => {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        setIsAuthReady(true);
        return;
      }
      
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        console.log('AuthProvider: Initial session:', initialSession ? 'Present' : 'Null');
        setSession(initialSession);
        
        if (initialSession) {
          const {
            data: { user: initialUser },
          } = await supabase.auth.getUser();
          console.log('AuthProvider: Initial user:', initialUser ? 'Present' : 'Null');
          setUser(initialUser);
        }
      } catch (error) {
        console.error('AuthProvider: Initialization error:', error);
        setError('Failed to initialize authentication');
      } finally {
        setIsAuthReady(true);
        console.log('AuthProvider: Auth ready state set to true');
      }
    };

    initializeAuth();
  }, []);

  // Refs
  const isAssigningQuest = useRef<boolean>(false);
  const isInitialAuthProcessingCompleteRef = useRef<boolean>(false);

  // Memoized functions
  const clearError = useCallback((): void => setError(null), []);

  // Define all the auth functions with proper types
  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const errorMsg = error.message || 'Failed to sign in';
        Alert.alert('Sign In Error', errorMsg);
        return { success: false, error: errorMsg };
      }

      // Update session and user state
      setSession(data.session);
      setUser(data.user);
      
      // Fetch user profile if it exists
      if (data.user) {
        await fetchUserProfile(data.user.id);
      }

      console.log('AuthContext: User signed in successfully.');
      return { success: true };
    } catch (error: any) {
      const errorMsg = error.message || 'An unknown error occurred during sign in';
      console.error('AuthContext: Sign In Error:', errorMsg);
      Alert.alert('Sign In Error', errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string): Promise<{ success: boolean; error?: string; data?: { user: User; session: Session } }> => {
    setIsLoading(true);
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            email,
            player_class: null,
            current_xp: 0,
            xp_to_next_level: 100,
            level: 1,
            health: 100,
            strength: 5,
            agility: 5,
            speed: 5,
            coins: 0,
            notifications_enabled: true,
            location_permission_granted: true,
            is_google_fit_linked: false,
            is_apple_health_linked: false,
            equipped_items: [],
            inventory: [],
            active_quest_id: null,
          },
        },
      });

      if (error) throw error;

      if (data.user && data.session) {
        console.log('AuthContext: User signed up successfully.');
        return {
          success: true,
          data: {
            user: data.user,
            session: data.session,
          },
        };
      }

      return {
        success: false,
        error: 'Failed to create user account',
      };
    } catch (error: any) {
      const errorMessage = error.message || 'An unknown error occurred during sign up';
      Alert.alert('Sign Up Error', errorMessage);
      console.error('AuthContext: Sign Up Error:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase client not initialized' };
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Sign Out Error:', error.message);
        return { success: false, error: error.message };
      }
      setUserProfile(null);
      setUser(null);
      setSession(null);
      console.log('AuthContext: User signed out successfully.');
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'An unknown error occurred during sign out';
      Alert.alert('Sign Out Error', errorMessage);
      console.error('AuthContext: Sign Out Error:', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetches the user profile from the database
   */
  const fetchUserProfile = useCallback(async (userId: string): Promise<void> => {
    setIsLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        const profile = {
          ...data,
          equipped_items: typeof data.equipped_items === 'string' 
            ? JSON.parse(data.equipped_items)
            : data.equipped_items || [],
          inventory: typeof data.inventory === 'string'
            ? JSON.parse(data.inventory)
            : data.inventory || []
        };
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Updates the user profile in the database
   */
  const updateUserProfile = useCallback(async (profileData: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);

      if (error) throw error;
      
      // Refresh the user profile
      await fetchUserProfile(user.id);
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: 'Failed to update profile' };
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchUserProfile]);

  /**
   * Assigns an initial quest to the user
   */
  const assignInitialQuest = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    if (isAssigningQuest.current) {
      return { success: false, error: 'Quest assignment already in progress' };
    }

    isAssigningQuest.current = true;
    setIsLoading(true);

    try {
      // Check if user already has an active quest
      const { data: activeQuest } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .single();

      if (activeQuest) {
        return { success: true }; // Already has an active quest
      }

      // Get a random quest
      const { data: quest, error } = await supabase
        .from('quests')
        .select('*')
        .eq('difficulty_level', 1) // Start with easiest quests
        .limit(1)
        .single();

      if (error || !quest) {
        throw new Error('No quests available');
      }

      // Assign the quest to the user
      const { error: assignmentError } = await supabase
        .from('user_quests')
        .insert({
          user_id: user.id,
          quest_id: quest.id,
          current_progress: 0,
          is_completed: false,
          assigned_at: new Date().toISOString()
        });

      if (assignmentError) throw assignmentError;

      // Update user's active quest
      await updateUserProfile({ active_quest_id: quest.id });
      return { success: true };
    } catch (error) {
      console.error('Error assigning initial quest:', error);
      return { success: false, error: 'Failed to assign initial quest' };
    } finally {
      isAssigningQuest.current = false;
      setIsLoading(false);
    }
  }, [user, updateUserProfile]);

  /**
   * Completes a quest and awards rewards to the user
   */
  const completeQuestAndAwardRewards = useCallback(async (
    userQuestId: string,
    questDetails: QuestData
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }
    
    if (!user || !userProfile) {
      return { success: false, error: 'User not authenticated' };
    }

    setIsLoading(true);
    try {
      // Mark quest as completed
      const { error: updateError } = await supabase
        .from('user_quests')
        .update({ 
          is_completed: true,
          completed_at: new Date().toISOString() 
        })
        .eq('id', userQuestId);

      if (updateError) throw updateError;

      // Apply rewards
      const rewards = questDetails.stat_rewards || {};
      const updates: Partial<UserProfile> = {
        current_xp: (userProfile.current_xp || 0) + (rewards.xp || 0),
        health: (userProfile.health || 100) + (rewards.health || 0),
        strength: (userProfile.strength || 5) + (rewards.strength || 0),
        agility: (userProfile.agility || 5) + (rewards.agility || 0),
        speed: (userProfile.speed || 5) + (rewards.speed || 0),
        coins: (userProfile.coins || 0) + (rewards.coins || 0),
        active_quest_id: null // Clear active quest
      };

      // Handle level up
      if (updates.current_xp && updates.current_xp >= (userProfile.xp_to_next_level || 100)) {
        updates.level = (userProfile.level || 1) + 1;
        updates.xp_to_next_level = Math.floor((userProfile.xp_to_next_level || 100) * 1.5);
      }

      // Apply updates
      await updateUserProfile(updates);

      // Assign new quest if available
      if (questDetails.next_quest_id) {
        await assignInitialQuest();
      }

      return { success: true };
    } catch (error) {
      console.error('Error completing quest:', error);
      return { success: false, error: 'Failed to complete quest' };
    } finally {
      setIsLoading(false);
    }
  }, [user, userProfile, updateUserProfile, assignInitialQuest]);

  // Add stubs for other required functions to satisfy TypeScript
  const fetchActiveQuest = useCallback(async (): Promise<UserQuestProgress | null> => {
    if (!user) return null;
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return null;
    }
    
    try {
      const { data } = await supabase
        .from('user_quests')
        .select('*, quests(*)')
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .single();
      return data as UserQuestProgress | null;
    } catch (error) {
      console.error('Error fetching active quest:', error);
      return null;
    }
  }, [user]);

  const updateQuestProgress = useCallback(async (
    userQuestId: string, 
    progress: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }
    
    try {
      const { error } = await supabase
        .from('user_quests')
        .update({ current_progress: progress })
        .eq('id', userQuestId);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating quest progress:', error);
      return { success: false, error: 'Failed to update quest progress' };
    }
  }, []);

  const fetchActiveDungeons = useCallback(async (): Promise<{ 
    data: UserDungeonProgress[] | null; 
    error?: string 
  }> => {
    if (!user) return { data: null, error: 'User not authenticated' };
    
    if (!supabase) {
      return { data: null, error: 'Supabase client not initialized' };
    }
    
    try {
      const { data, error } = await supabase
        .from('user_dungeons')
        .select('*, dungeons(*)')
        .eq('user_id', user.id)
        .eq('is_completed', false);
      
      if (error) throw error;
      return { data: data as UserDungeonProgress[] };
    } catch (error) {
      console.error('Error fetching active dungeons:', error);
      return { data: null, error: 'Failed to fetch active dungeons' };
    }
  }, [user]);

  const completeDungeonAndAwardRewards = useCallback(async (
    userDungeonId: string,
    dungeonDetails: DungeonData
  ): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }
    
    if (!user || !userProfile) {
      return { success: false, error: 'User not authenticated' };
    }

    setIsLoading(true);
    try {
      // Mark dungeon as completed
      const { error: updateError } = await supabase
        .from('user_dungeons')
        .update({ 
          is_completed: true,
          completed_at: new Date().toISOString() 
        })
        .eq('id', userDungeonId);

      if (updateError) throw updateError;

      // Apply rewards
      const rewards = dungeonDetails.stat_rewards || {};
      const updates: Partial<UserProfile> = {
        current_xp: (userProfile.current_xp || 0) + (rewards.xp || 0),
        health: (userProfile.health || 100) + (rewards.health || 0),
        strength: (userProfile.strength || 5) + (rewards.strength || 0),
        agility: (userProfile.agility || 5) + (rewards.agility || 0),
        speed: (userProfile.speed || 5) + (rewards.speed || 0),
        coins: (userProfile.coins || 0) + (rewards.coins || 0)
      };

      await updateUserProfile(updates);
      return { success: true };
    } catch (error) {
      console.error('Error completing dungeon:', error);
      return { success: false, error: 'Failed to complete dungeon' };
    } finally {
      setIsLoading(false);
    }
  }, [user, userProfile, updateUserProfile]);

  // The context value that will be provided to child components
  const value = useMemo(() => ({
    session,
    user,
    isLoading,
    isAuthReady,
    userProfile,
    error,
    signIn,
    signUp,
    signOut,
    fetchUserProfile,
    updateUserProfile,
    completeQuestAndAwardRewards,
    assignInitialQuest,
    clearError,
    // Add the missing functions to satisfy AuthContextType
    fetchActiveQuest,
    updateQuestProgress,
    fetchActiveDungeons,
    completeDungeonAndAwardRewards
  }), [
    session,
    user,
    isLoading,
    isAuthReady,
    userProfile,
    error,
    signIn,
    signUp,
    signOut,
    fetchUserProfile,
    updateUserProfile,
    completeQuestAndAwardRewards,
    assignInitialQuest,
    clearError,
    fetchActiveQuest,
    updateQuestProgress,
    fetchActiveDungeons,
    completeDungeonAndAwardRewards
  ]);

  return (
    <AuthContext.Provider value={value}>
      {isAuthReady ? children : null}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context; // <-- return the real context, do NOT override
};
