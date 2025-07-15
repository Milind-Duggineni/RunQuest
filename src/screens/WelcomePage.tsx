// src/screens/WelcomePage.tsx

import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');
const image = require('../assets/Background.jpg');

type Firefly = {
  position: Animated.ValueXY;
  opacity: Animated.Value;
};

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

const WelcomePage = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const fireflies = useRef<Firefly[]>(
    Array.from({ length: 15 }, () => ({
      position: new Animated.ValueXY({
        x: Math.random() * width,
        y: Math.random() * height,
      }),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    const animationHandles: Animated.CompositeAnimation[] = [];

    fireflies.forEach((firefly) => {
      const animate = () => {
        const animation = Animated.parallel([
          Animated.sequence([
            Animated.timing(firefly.opacity, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(firefly.opacity, {
              toValue: 0.3,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(firefly.position, {
            toValue: {
              x: Math.random() * width,
              y: Math.random() * height,
            },
            duration: 4000,
            useNativeDriver: true,
          }),
        ]);
        animation.start(animate);
        animationHandles.push(animation);
      };
      animate();
    });

    return () => {
      animationHandles.forEach((animation) => animation.stop());
    };
  }, [fireflies]);

  const handleStartNewQuest = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      navigation.navigate('SignUp');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleContinue = () => {
    navigation.navigate('SignIn');
  };

  const handleSettings = () => {
    console.warn('Settings screen is not directly accessible from the Welcome screen without logging in first.');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0f1c', '#0a1f1a', '#103b32']}
        style={styles.background}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        style={styles.overlay}
      >
        {fireflies.map((firefly, index) => (
          <Animated.View
            key={index}
            style={[
              styles.firefly,
              {
                transform: firefly.position.getTranslateTransform(),
                opacity: firefly.opacity,
              },
            ]}
          />
        ))}
        <ImageBackground source={image} resizeMode="cover" style={styles.image}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>RUNQUEST</Text>
            <Text style={styles.subtitle}>Run to Survive. Level to Conquer.</Text>
            <Text style={styles.tagline}>Your legs are your weapons.</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={handleStartNewQuest}>
              <Text style={styles.buttonText}>Start New Quest</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>Continue Journey</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.settingsButton]}
              onPress={handleSettings}
            >
              <Text style={styles.buttonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  firefly: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7fff00',
    shadowColor: '#7fff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00ff9d',
    textShadowColor: 'rgba(0, 255, 157, 0.75)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#00ff9d',
    marginTop: 5,
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '80%',
    alignItems: 'center',
    alignSelf: 'center',
  },
  button: {
    backgroundColor: 'rgba(0, 255, 157, 0.2)',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 157, 0.5)',
  },
  settingsButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default WelcomePage;
