// src/navigation/RootNavigator.tsx

import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';

import WelcomePage from '../screens/WelcomePage';
import SignIn from '../screens/SignIn';
import SignUp from '../screens/Signup';
import CharacterSelection from '../screens/CharacterSelection';
import MainNavigator from './MainNavigator';
import ActiveDungeonScreen from '../screens/ActiveDungeonScreen';
import DungeonGameScreen from '../screens/DungeonGameScreen';

import { RootStackParamList } from './types';
import ScreenContentWrapper from '../components/ScreenContentWrapper';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { session, isAuthReady, userProfile } = useAuth();

  useEffect(() => {
    console.log('RootNavigator State Update:');
    console.log('  isAuthReady:', isAuthReady);
    console.log('  session:', session ? 'Present' : 'Null');
    console.log('  userProfile:', userProfile ? 'Present' : 'Null');
    if (userProfile) {
      console.log('  userProfile.player_class:', userProfile.player_class);
    }
    console.log('  Current Stack:', session ? 'Main' : 'Guest (Welcome/SignIn)');
  }, [session, isAuthReady, userProfile]);

  if (!isAuthReady) {
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
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="CharacterSelection" component={CharacterSelection} />
          <Stack.Screen name="ActiveDungeon" component={ActiveDungeonScreen} />
          <Stack.Screen name="DungeonGame" component={DungeonGameScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome">
            {() => (
              <ScreenContentWrapper>
                <WelcomePage />
              </ScreenContentWrapper>
            )}
          </Stack.Screen>
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
    backgroundColor: '#0a0f1c',
  },
  loadingText: {
    marginTop: 10,
    color: '#00ff9d',
    fontSize: 18,
  },
});

export default RootNavigator;
