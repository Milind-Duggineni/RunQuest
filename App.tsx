// App.tsx
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/services/navigation';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Toggle between different test modes
type TestMode = 'local' | 'remote' | 'app';
const TEST_MODE = 'app' as const; // Use const assertion to infer literal type

// Custom theme for navigation with proper typing
const CustomTheme: typeof DefaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f5f5f5',
    primary: '#4CAF50',
    card: '#ffffff',
    text: '#333333',
    border: '#e0e0e0',
    notification: '#ff3b30',
  },
  // Ensure fonts are properly typed for both platforms
  fonts: Platform.select({
    ios: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900' as const,
      },
    },
    android: {
      regular: {
        fontFamily: 'Roboto',
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: 'Roboto-Medium',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'Roboto-Bold',
        fontWeight: '700' as const,
      },
      heavy: {
        fontFamily: 'Roboto-Black',
        fontWeight: '900' as const,
      },
    },
  })!,
};

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
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

const AppContent: React.FC = () => {
  // Use type assertion to tell TypeScript we've checked the value
  const mode = TEST_MODE as TestMode;
  // For testing image loading
  if (mode === 'remote') {
    const RemoteTileTest = React.lazy(() => import('./src/components/RemoteTileTest'));
    return (
      <React.Suspense fallback={<View style={styles.loading}><Text>Loading Remote Test...</Text></View>}>
        <RemoteTileTest />
      </React.Suspense>
    );
  }
  
  if (mode === 'local') {
    const LocalImageTest = React.lazy(() => import('./src/components/LocalImageTest'));
    return (
      <React.Suspense fallback={<View style={styles.loading}><Text>Loading Local Test...</Text></View>}>
        <LocalImageTest />
      </React.Suspense>
    );
  }

  // Main app
  return <RootNavigator />;
};

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer 
            ref={navigationRef}
            theme={CustomTheme}
          >
            <AppContent />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});