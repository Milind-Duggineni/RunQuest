// src/navigation/RootNavigator.tsx

import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

// --- IMPORTANT: Ensure these import paths are 100% correct relative to RootNavigator.tsx ---
import WelcomePage from '../screens/WelcomePage';
import SignIn from '../screens/SignIn';
import SignUp from '../screens/Signup'; // Corrected to 'SignUp' based on common naming convention
import CharacterSelection from '../screens/CharacterSelection';
import MainNavigator from './MainNavigator'; // IMPORT THE NEW MAIN NAVIGATOR
import ActiveDungeonScreen from '../screens/ActiveDungeonScreen';
import DungeonGameScreen from '../screens/DungeonGameScreen';

import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  // Use isAuthReady from AuthContext for initial loading check
  const { session, isAuthReady, userProfile } = useAuth(); 

  useEffect(() => {
    console.log('RootNavigator State Update:');
    console.log('  isAuthReady:', isAuthReady); // Log new state for debugging
    console.log('  session:', session ? 'Present' : 'Null');
    console.log('  userProfile:', userProfile ? 'Present' : 'Null');
    if (userProfile) {
      console.log('  userProfile.player_class:', userProfile.player_class);
    }
  }, [session, isAuthReady, userProfile]); // Log whenever these dependencies change

  // Show loading screen until initial authentication and profile fetch is complete
  if (!isAuthReady) { // NEW: Use isAuthReady here
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff9d" />
        <Text style={styles.loadingText}>Loading RunQuest...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        // User is authenticated (has a session)
        userProfile && userProfile.player_class ? ( // Check if profile exists AND character selected
          // User has a profile AND has completed character selection (player_class is set)
          // ActiveDungeon is now only accessible through navigation
          // Navigate to the MainNavigator, which will handle the tabs (Dashboard, Shop, etc.)
          <Stack.Group>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen name="ActiveDungeon" component={ActiveDungeonScreen} />
            <Stack.Screen name="DungeonGame" component={DungeonGameScreen} />
          </Stack.Group>
        ) : (
          // User is authenticated but has NOT completed character selection OR userProfile is still null initially
          // This should be the immediate destination after successful SignUp
          <Stack.Screen name="CharacterSelection" component={CharacterSelection} />
        )
      ) : (
        // User is NOT authenticated (no session)
        // Show the public-facing screens
        <>
          <Stack.Screen name="Welcome" component={WelcomePage} />
          <Stack.Screen name="SignIn" component={SignIn} />
          <Stack.Screen name="SignUp" component={SignUp} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0f1c', // Dark background theme
  },
  loadingText: {
    marginTop: 10,
    color: '#00ff9d', // Green glow text
    fontSize: 18,
  },
});

export default RootNavigator;
