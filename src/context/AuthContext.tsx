import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Alert } from 'react-native';

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
    location_permission_granted: true;
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
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, username: string) => Promise<{
        user: any | null;
        session: Session | null;
    } | null>;
    signOut: () => Promise<void>;
    fetchUserProfile: (userId: string) => Promise<void>;
    updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
    fetchActiveQuest: () => Promise<UserQuestProgress | null>;
    assignInitialQuest: () => Promise<void>;
    completeQuestAndAwardRewards: (
        userQuestId: string,
        questDetails: QuestData
    ) => Promise<void>;
    updateQuestProgress: (userQuestId: string, progress: number) => Promise<void>;
        // Dungeon helpers
        fetchActiveDungeons: () => Promise<UserDungeonProgress[]>;
        completeDungeonAndAwardRewards: (
            userDungeonId: string,
            dungeonDetails: DungeonData
        ) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // Ref to track if a quest assignment is currently in progress (prevents multiple assignments)
    const isAssigningQuest = useRef(false);
    // Ref to track if the *initial* session and profile processing has completed.
    // This prevents re-running profile creation/initial quest logic on subsequent renders.
    const isInitialAuthProcessingComplete = useRef(false);

    // --- Utility Callbacks (memoized using useCallback to ensure stable function references) ---

    const createProfileForNewUser = useCallback(async (newUser: User, username: string, email: string) => {
        console.log('AuthContext: Attempting to create profile for new user.');
        try {
            const profileToInsert: UserProfile = {
                id: newUser.id,
                username: username,
                email: email,
                age: null,
                player_class: null,
                current_xp: 0,
                xp_to_next_level: 100,
                health: 100,
                strength: 10,
                agility: 10,
                speed: 10,
                coins: 0,
                notifications_enabled: true,
                location_permission_granted: true,
                is_google_fit_linked: false,
                is_apple_health_linked: false,
                equipped_items: [],
                inventory: [],
                active_quest_id: null,
                level: 1,
                created_at: new Date().toISOString(),
                updated_at: null,
            };

            const { error: profileError } = await supabase.from('profiles').insert([
                {
                    ...profileToInsert,
                    equipped_items: JSON.stringify(profileToInsert.equipped_items), // Store as JSON string
                    inventory: JSON.stringify(profileToInsert.inventory),       // Store as JSON string
                },
            ]);

            if (profileError) {
                console.error('AuthContext: Error creating user profile:', profileError);
                throw profileError;
            }
            console.log('AuthContext: User profile created successfully.');

            // Fetch the newly created profile to ensure our state reflects the DB
            const { data: newProfileData, error: fetchNewProfileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', newUser.id)
                .single();

            if (fetchNewProfileError) {
                console.error('AuthContext: Error fetching newly created profile:', fetchNewProfileError);
                throw fetchNewProfileError;
            }
            if (newProfileData) {
                // Parse JSON fields back to objects for local state
                if (typeof newProfileData.equipped_items === 'string') {
                    newProfileData.equipped_items = JSON.parse(newProfileData.equipped_items);
                }
                if (typeof newProfileData.inventory === 'string') {
                    newProfileData.inventory = JSON.parse(newProfileData.inventory);
                }
                setUserProfile(newProfileData as UserProfile);
                return newProfileData as UserProfile;
            }
        } catch (error) {
            console.error('AuthContext: Failed to create profile for new user:', error);
            throw error;
        }
    }, []);

    const fetchUserProfile = useCallback(async (userId: string) => {
        console.log(`AuthContext: fetchUserProfile started for userId: ${userId}`);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
                console.error('AuthContext: Error fetching user profile:', error);
                throw error;
            }

            if (data) {
                if (typeof data.equipped_items === 'string') {
                    data.equipped_items = JSON.parse(data.equipped_items);
                }
                if (typeof data.inventory === 'string') {
                    data.inventory = JSON.parse(data.inventory);
                }
                setUserProfile(data as UserProfile);
                console.log('AuthContext: User profile fetched and set for:', data.username);
            } else {
                console.log('AuthContext: No user profile found for ID, setting userProfile to null.');
                setUserProfile(null);
            }
        } catch (error) {
            console.error('AuthContext: Caught unexpected error in fetchUserProfile:', error);
            setUserProfile(null);
        }
    }, []);

    const updateUserProfile = useCallback(async (profileData: Partial<UserProfile>) => {
        if (!user) {
            console.warn('AuthContext: Cannot update profile: No user logged in.');
            throw new Error('User is not logged in.');
        }
        if (!userProfile) { // Ensure userProfile is not null before merging
            console.warn('AuthContext: Cannot update profile: userProfile state is null.');
            throw new Error('User profile is not loaded or invalid for update operation.');
        }

        setIsLoading(true);
        try {
            // Merge existing profile data with new data
            const mergedProfile: UserProfile = {
                ...(userProfile as UserProfile), // Start with current userProfile state
                ...profileData,
                id: user.id, // Ensure user ID is correct
                updated_at: new Date().toISOString(),
            };

            const payloadToSend: Record<string, any> = { ...mergedProfile };
            // Stringify array/object fields before sending to Supabase
            if (Array.isArray(payloadToSend.equipped_items)) {
                payloadToSend.equipped_items = JSON.stringify(payloadToSend.equipped_items);
            }
            if (Array.isArray(payloadToSend.inventory)) {
                payloadToSend.inventory = JSON.stringify(payloadToSend.inventory);
            }

            const { data, error } = await supabase
                .from('profiles')
                .upsert(payloadToSend)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                // Parse back JSON fields for local state after successful update
                if (typeof data.equipped_items === 'string') {
                    data.equipped_items = JSON.parse(data.equipped_items);
                }
                if (typeof data.inventory === 'string') {
                    data.inventory = JSON.parse(data.inventory);
                }
                setUserProfile(data as UserProfile);
                console.log('AuthContext: Profile updated successfully:', data.username);
            }
        } catch (error: any) {
            console.error('AuthContext: Error updating user profile:', error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [user, userProfile]); // userProfile is a dependency here because we use its current value to create mergedProfile

    const fetchActiveQuest = useCallback(async (): Promise<UserQuestProgress | null> => {
        if (!user) {
            console.log('AuthContext: fetchActiveQuest called but no user is logged in. Returning null.');
            return null;
        }
        try {
            const { data, error } = await supabase
                .from('user_quests')
                .select(`*, quests(*)`) // Select user_quests and join related quest details
                .eq('user_id', user.id)
                .eq('is_completed', false)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
                console.error('AuthContext: Error fetching active quest from DB:', error);
                throw error;
            }

            if (data) {
                // Parse stat_rewards if it's a string (JSONB in DB)
                if (typeof (data.quests as any)?.stat_rewards === 'string') {
                    (data.quests as any).stat_rewards = JSON.parse((data.quests as any).stat_rewards);
                }
                console.log('AuthContext: Active quest fetched from DB:', data.quests.title);
                return data as UserQuestProgress;
            }
            console.log('AuthContext: No active quest found for user in DB.');
            return null;
        } catch (error) {
            console.error('AuthContext: Caught error in fetchActiveQuest:', error);
            return null;
        }
    }, [user]);

    const assignInitialQuest = useCallback(async () => {
        if (!user) {
            console.log('AuthContext: assignInitialQuest called but user is null. Returning.');
            return;
        }

        if (isAssigningQuest.current) {
            console.log('AuthContext: assignInitialQuest already in progress. Skipping.');
            return;
        }

        isAssigningQuest.current = true; // Set flag to prevent concurrent assignments

        try {
            // CRITICAL: Direct database check for an active quest to avoid race conditions/stale state
            const currentActiveQuestInDb = await fetchActiveQuest();
            if (currentActiveQuestInDb) {
                console.log('AuthContext: assignInitialQuest found active quest in DB. Skipping assignment.');
                return;
            }

            console.log('AuthContext: No active quest found in DB. Attempting to assign a new initial quest.');

            // Fetch a suitable initial quest (e.g., difficulty 1, non-repeatable)
            const { data: initialQuests, error: fetchError } = await supabase
                .from('quests')
                .select('*')
                .eq('difficulty_level', 1)
                .eq('is_repeatable', false)
                .limit(1);

            if (fetchError) throw fetchError;

            if (initialQuests && initialQuests.length > 0) {
                const firstQuest = initialQuests[0] as QuestData;

                // Insert the new user quest into user_quests table
                const { data: newUserQuest, error: insertError } = await supabase
                    .from('user_quests')
                    .insert({
                        user_id: user.id,
                        quest_id: firstQuest.id,
                        current_progress: 0,
                        is_completed: false,
                        assigned_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                if (newUserQuest) {
                    // Update user profile with the new active quest ID
                    await updateUserProfile({ active_quest_id: newUserQuest.id });
                    console.log('AuthContext: Successfully assigned new quest:', firstQuest.title);
                    Alert.alert('New Quest!', `You have a new quest: ${firstQuest.title}!`);
                }
            } else {
                console.warn('AuthContext: No initial quests found in the database (quests table). Please ensure initial quests are defined.');
            }
        } catch (error) {
            console.error('AuthContext: Error assigning initial quest:', error);
            Alert.alert('Error assigning initial quest', (error as Error).message);
        } finally {
            isAssigningQuest.current = false; // Reset flag
        }
    }, [user, fetchActiveQuest, updateUserProfile]);

    const completeQuestAndAwardRewards = useCallback(async (
        userQuestId: string,
        questDetails: QuestData
    ) => {
        if (!user || !userProfile) {
            console.warn('AuthContext: Cannot complete quest: User or profile not loaded.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Mark the user quest as completed in the database
            const { error: updateError } = await supabase
                .from('user_quests')
                .update({ is_completed: true, completed_at: new Date().toISOString() })
                .eq('id', userQuestId);

            if (updateError) throw updateError;
            console.log(`AuthContext: User quest ${userQuestId} marked as completed.`);

            // 2. Calculate new profile stats based on quest rewards
            const rewards = questDetails.stat_rewards;
            let newCurrentXp = userProfile.current_xp + (rewards?.xp || 0);
            let newHealth = userProfile.health + (rewards?.health || 0);
            let newStrength = userProfile.strength + (rewards?.strength || 0);
            let newAgility = userProfile.agility + (rewards?.agility || 0);
            let newSpeed = userProfile.speed + (rewards?.speed || 0);
            let newCoins = userProfile.coins + (rewards?.coins || 0);
            let newLevel = userProfile.level;
            let newXpToNextLevel = userProfile.xp_to_next_level;
            const newEquippedItems = [...(userProfile.equipped_items || [])];
            const newInventory = [...(userProfile.inventory || [])];
            let newActiveQuestId: string | null = null; // Default to no active quest after completion

            // Handle leveling up
            if (newCurrentXp >= newXpToNextLevel) {
                const remainingXp = newCurrentXp - newXpToNextLevel;
                newLevel += 1;
                newXpToNextLevel = Math.floor(newXpToNextLevel * 1.5); // XP required for next level increases
                newCurrentXp = remainingXp; // Carry over remaining XP
                Alert.alert('Level Up!', `Congratulations! You reached Level ${newLevel}!`);
            }

            // Handle rare item rewards: Add to inventory
            if (rewards?.rare_item) {
                const newItem: InventoryItemType = {
                    name: rewards.rare_item,
                    quantity: 1,
                    description: `A rare item: ${rewards.rare_item}.`,
                };
                // Check if item already exists in inventory to increment quantity
                const existingItemIndex = newInventory.findIndex(item => item.name === newItem.name);
                if (existingItemIndex !== -1) {
                    newInventory[existingItemIndex].quantity += newItem.quantity;
                } else {
                    newInventory.push(newItem);
                }
                Alert.alert('New Item!', `You received a rare item: ${rewards.rare_item}!`);
            }

            // 3. Determine the next quest to assign (chained or random)
            let nextQuestData: QuestData | null = null;
            if (questDetails.next_quest_id) {
                // Try to get the explicitly chained quest first
                const { data, error } = await supabase
                    .from('quests')
                    .select('*')
                    .eq('id', questDetails.next_quest_id)
                    .single();
                if (error) console.error('AuthContext: Error fetching next chained quest:', error);
                nextQuestData = data as QuestData;
            }

            // If no chained quest or fetch failed, try to find a random repeatable/higher difficulty quest
            if (!nextQuestData) {
                const { data: randomQuests, error: randomError } = await supabase
                    .from('quests')
                    .select('*')
                    .or('is_repeatable.eq.true,difficulty_level.gt.1') // Can be repeatable OR higher difficulty
                    .neq('id', questDetails.id) // Exclude the just-completed quest to avoid re-assigning it immediately
                    .limit(1); // Just pick one random one for simplicity

                if (randomError) console.error('AuthContext: Error fetching random quest:', randomError);
                if (randomQuests && randomQuests.length > 0) {
                    nextQuestData = randomQuests[0] as QuestData;
                } else {
                    console.warn('AuthContext: No suitable next quest found (neither chained nor random). User will not have a new quest immediately.');
                }
            }

            // 4. Assign the next quest if found
            if (nextQuestData) {
                const { data: newAssignedQuest, error: newQuestError } = await supabase
                    .from('user_quests')
                    .insert({
                        user_id: user.id,
                        quest_id: nextQuestData.id,
                        current_progress: 0,
                        is_completed: false,
                        assigned_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                if (newQuestError) throw newQuestError;
                newActiveQuestId = newAssignedQuest.id;
                console.log(`AuthContext: Assigned new quest: ${nextQuestData.title}`);
                Alert.alert('New Quest!', `You have a new quest: ${nextQuestData.title}!`);
            }

            // 5. Perform a SINGLE update to the user profile in the database
            await updateUserProfile({
                current_xp: newCurrentXp,
                health: newHealth,
                strength: newStrength,
                agility: newAgility,
                speed: newSpeed,
                coins: newCoins,
                level: newLevel,
                xp_to_next_level: newXpToNextLevel,
                equipped_items: newEquippedItems,
                inventory: newInventory,
                active_quest_id: newActiveQuestId, // Set to new quest ID or null if no new quest
            });
            console.log('AuthContext: Player profile updated with rewards and new active quest status.');

        } catch (error) {
            console.error('AuthContext: Error completing quest or awarding rewards:', error);
            Alert.alert('Quest Error', 'Failed to complete quest or award rewards.');
        } finally {
            setIsLoading(false);
        }
    }, [user, userProfile, updateUserProfile]); // Dependencies: user, userProfile (for current stats), updateUserProfile (to call it)

    const updateQuestProgress = useCallback(async (userQuestId: string, progress: number) => {
        if (!user) {
            console.log('AuthContext: updateQuestProgress called but user is null.');
            return;
        }
        try {
            const { error } = await supabase
                .from('user_quests')
                .update({ current_progress: progress })
                .eq('id', userQuestId)
                .eq('user_id', user.id);

            if (error) throw error;
            console.log(`AuthContext: Quest ${userQuestId} progress updated to ${progress}`);
        } catch (error) {
            console.error('AuthContext: Error updating quest progress:', error);
        }
    }, [user]);

    // --- Dungeon Helper Functions ---
    const fetchActiveDungeons = useCallback(async (): Promise<UserDungeonProgress[]> => {
        if (!user) return [];
        try {
            const { data, error } = await supabase
                .from('user_dungeons')
                .select('*, dungeons(*)')
                .eq('user_id', user.id)
                .eq('is_completed', false);
            if (error && error.code !== 'PGRST116') throw error;
            const parsed: UserDungeonProgress[] = (data || []).map(d => {
                if (typeof (d.dungeons as any)?.stat_rewards === 'string') {
                    (d.dungeons as any).stat_rewards = JSON.parse((d.dungeons as any).stat_rewards);
                }
                return d as UserDungeonProgress;
            });
            return parsed;
        } catch (err) {
            console.error('AuthContext: fetchActiveDungeons error', err);
            return [];
        }
    }, [user]);

    const completeDungeonAndAwardRewards = useCallback(async (userDungeonId: string, dungeonDetails: DungeonData) => {
        if (!user || !userProfile) return;
        try {
            setIsLoading(true);
            // 1. mark completed
            const { error } = await supabase
                .from('user_dungeons')
                .update({ is_completed: true, completed_at: new Date().toISOString() })
                .eq('id', userDungeonId)
                .eq('user_id', user.id);
            if (error) throw error;

            // 2. rewards logic (reuse quest logic)
            const rewards = dungeonDetails.stat_rewards || {};
            let newCurrentXp = userProfile.current_xp + (rewards.xp || 0);
            let newHealth = userProfile.health + (rewards.health || 0);
            let newStrength = userProfile.strength + (rewards.strength || 0);
            let newAgility = userProfile.agility + (rewards.agility || 0);
            let newSpeed = userProfile.speed + (rewards.speed || 0);
            let newCoins = userProfile.coins + (rewards.coins || 0);

            let newLevel = userProfile.level;
            let newXpToNextLevel = userProfile.xp_to_next_level;
            while (newCurrentXp >= newXpToNextLevel) {
                newCurrentXp -= newXpToNextLevel;
                newLevel += 1;
                newXpToNextLevel = Math.round(newXpToNextLevel * 1.2);
            }

            let newInventory = [...(userProfile.inventory || [])];
            if (rewards.rare_item) {
                const itemName = rewards.rare_item as string;
                const idx = newInventory.findIndex(i => i.name === itemName);
                if (idx !== -1) newInventory[idx].quantity += 1;
                else newInventory.push({ name: itemName, quantity: 1, description: 'Dungeon loot' });
                Alert.alert('Loot!', `You found a rare item: ${itemName}`);
            }

            await updateUserProfile({
                current_xp: newCurrentXp,
                health: newHealth,
                strength: newStrength,
                agility: newAgility,
                speed: newSpeed,
                coins: newCoins,
                level: newLevel,
                xp_to_next_level: newXpToNextLevel,
                inventory: newInventory,
            });
            Alert.alert('Dungeon Cleared', 'Rewards added to your profile');
        } catch (err) {
            console.error('AuthContext: completeDungeonAndAwardRewards error', err);
        } finally {
            setIsLoading(false);
        }
    }, [user, userProfile, updateUserProfile]);

    // --- Authentication Functions ---

    const signIn = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            console.log('AuthContext: User signed in successfully.');
        } catch (error: any) {
            Alert.alert('Sign In Error', error.message);
            console.error('AuthContext: Sign In Error:', error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signUp = async (email: string, password: string, username: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username },
                },
            });
            if (error) throw error;
            if (data.user && data.session) {
                console.log('AuthContext: User signed up successfully. Supabase session and user data received.');
                // createProfileForNewUser will be called by onAuthStateChange subsequent to this.
                return { user: data.user, session: data.session };
            }
            return null;
        } catch (error: any) {
            Alert.alert('Sign Up Error', error.message);
            console.error('AuthContext: Sign Up Error:', error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            // The onAuthStateChange listener will handle clearing local state (session, user, userProfile)
            console.log('AuthContext: User signed out successfully.');
        } catch (error: any) {
            Alert.alert('Sign Out Error', error.message);
            console.error('AuthContext: Sign Out Error:', error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Main Auth State Management Effect ---
    useEffect(() => {
        // This effect is responsible for setting up and tearing down the Supabase auth listener.
        let isMounted = true;
        let subscription: { unsubscribe: () => void } | null = null;

        const handleAuthChange = async (event: string, currentSession: Session | null) => {
            if (!isMounted) return;
            
            console.log(`AuthContext: onAuthStateChange event: ${event}`);

            // Only update state if the session has actually changed
            if (JSON.stringify(session) !== JSON.stringify(currentSession)) {
                setSession(currentSession);
                setUser(currentSession?.user || null);
            }

            try {
                setIsLoading(true);

                if (currentSession?.user) {
                    // User is present. Fetch their profile.
                    console.log('AuthContext: User is present. Fetching user profile...');
                    
                    // Always fetch fresh profile data when auth state changes
                    await fetchUserProfile(currentSession.user.id);

                    // Only run initial setup on first load or after sign in
                    if (!isInitialAuthProcessingComplete.current) {
                        isInitialAuthProcessingComplete.current = true;
                        console.log('AuthContext: Running initial setup...');

                        // Check if profile exists
                        const { data: existingProfile, error: existingProfileError } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('id', currentSession.user.id)
                            .single();

                        if (existingProfileError && existingProfileError.code === 'PGRST116') {
                            console.log('AuthContext: Creating new profile...');
                            await createProfileForNewUser(
                                currentSession.user,
                                (currentSession.user.user_metadata as { username?: string })?.username || 
                                    currentSession.user.email?.split('@')[0] || 'Adventurer',
                                currentSession.user.email!
                            );
                        } else if (existingProfileError) {
                            console.error('AuthContext: Error checking profile:', existingProfileError.message);
                        }

                        // Assign initial quest if needed
                        if (!isAssigningQuest.current) {
                            await assignInitialQuest();
                        }
                    }
                } else {
                    // No user session
                    console.log('AuthContext: No user session');
                    setUserProfile(null);
                    isInitialAuthProcessingComplete.current = false;
                }
            } catch (error) {
                console.error('AuthContext: Error in auth change handler:', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    setIsAuthReady(true);
                }
            }
        };

        // Set up the auth state change listener and capture the actual subscription object
        const {
            data: { subscription: authSubscription },
        } = supabase.auth.onAuthStateChange(handleAuthChange);
        subscription = authSubscription;

        // No manual getSession call is required—the listener above automatically emits
        // an 'INITIAL_SESSION' event (with user or null) immediately. We'll rely on that
        // to set auth readiness and loading state.

        // Cleanup function
        return () => {
            isMounted = false;
            if (subscription) {
                subscription.unsubscribe();
                console.log('AuthContext: Cleaned up auth subscription');
            }
        };
    }, []); // Empty dependency array - only run once on mount

    // --- Context Value ---
    const value = {
        session,
        user,
        isLoading,
        isAuthReady,
        userProfile,
        signIn,
        signUp,
        signOut,
        fetchUserProfile,
        updateUserProfile,
        fetchActiveQuest,
        assignInitialQuest,
        completeQuestAndAwardRewards,
        updateQuestProgress,
        fetchActiveDungeons,
        completeDungeonAndAwardRewards,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
