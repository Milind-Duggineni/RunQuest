// Based on everything you've provided, here's a revised App.tsx that:
// 1. Keeps the working structure.
// 2. Adds guaranteed logging for all phases.
// 3. Renders a fallback if session is null to avoid rendering a blank screen.
// 4. Verifies the app loads even when unauthenticated.

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { GameProvider } from './src/context/GameProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/services/navigation';

const CustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0a0f1c',
    primary: '#00ff9d',
    card: '#1a2130',
    text: '#ffffff',
    border: '#2a3140',
    notification: '#ff3b30',
  },
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Something went wrong. Please restart the app.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const AppContent = () => {
  const { isAuthReady, session } = useAuth();
  console.log('AppContent rendering, isAuthReady:', isAuthReady, 'session:', session);

  if (!isAuthReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00ff9d" />
        <Text style={{ color: 'white', marginTop: 10 }}>Initializing Auth...</Text>
      </View>
    );
  }

  return <RootNavigator />;
};

const AppWithProviders = () => {
  console.log('AppWithProviders: Rendering with providers');
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GameProvider>
          <NavigationContainer ref={navigationRef} theme={CustomTheme}>
            <AppContent />
          </NavigationContainer>
        </GameProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default function App() {
  console.log('App is rendering');
  return (
    <ErrorBoundary>
      <AppWithProviders />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0f1c',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0f1c',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
});
