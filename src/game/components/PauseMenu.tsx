import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GameEntities } from '../types/game';

interface PauseMenuProps {
  visible: boolean;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  entities: GameEntities;
}

const PauseMenu: React.FC<PauseMenuProps> = ({
  visible,
  onResume,
  onRestart,
  onQuit,
  entities,
}) => {
  const navigation = useNavigation();
  
  if (!visible) return null;
  
  const handleQuit = () => {
    onQuit();
    navigation.goBack();
  };
  
  return (
    <View style={styles.overlay}>
      <ImageBackground
        source={require('../../assets/menu-bg.png')} // Update with your background image
        style={styles.background}
        resizeMode="cover"
        blurRadius={10}
      >
        <View style={styles.container}>
          <Text style={styles.title}>GAME PAUSED</Text>
          
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              Distance: {Math.round(entities.pedometer?.totalDistance || 0)}m
            </Text>
            <Text style={styles.statsText}>Score: {entities.gameState.score}</Text>
            <Text style={styles.statsText}>
              Level: {entities.gameState.currentLevel}
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={onResume}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>RESUME</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={onRestart}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>RESTART</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.quitButton]} 
              onPress={handleQuit}
              activeOpacity={0.7}
            >
              <Text style={[styles.buttonText, styles.quitButtonText]}>QUIT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a3c5f',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'Arial', // Consider using a custom font
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    letterSpacing: 2,
  },
  statsContainer: {
    width: '100%',
    backgroundColor: 'rgba(74, 60, 95, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statsText: {
    color: '#fff',
    fontSize: 18,
    marginVertical: 4,
    fontFamily: 'Arial',
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    backgroundColor: '#6a4c93',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8e6cb0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    letterSpacing: 1,
  },
  quitButton: {
    backgroundColor: 'transparent',
    borderColor: '#e74c3c',
    marginTop: 8,
  },
  quitButtonText: {
    color: '#e74c3c',
  },
});

export default PauseMenu;
