import React from 'react';
import { View, Image, StyleSheet, Text, Platform, ActivityIndicator } from 'react-native';

// Import the local image
const localImage = require('../assets/cs-blue-00f.png');

const LocalImageTest: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (error: any) => {
    console.error('Local image loading error:', error);
    setError('Failed to load image');
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Local Image Test</Text>
      <View style={styles.imageContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        )}
        <Image 
          source={localImage} 
          style={[styles.image, { opacity: isLoading ? 0 : 1 }]}
          resizeMode="contain"
          onLoadEnd={handleLoadEnd}
          onError={handleError}
        />
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.path}>
          Path: {JSON.stringify(localImage)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  imageContainer: {
    position: 'relative',
    width: 320,
    height: 320,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  path: {
    marginTop: 20,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  errorText: {
    marginTop: 20,
    color: '#f44336',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LocalImageTest;
