import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GameEntities } from '../types/game';

interface GameOverScreenProps {
  visible: boolean;
  onRestart: () => void;
  onQuit: () => void;
  entities: GameEntities;
  isVictory?: boolean;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  visible,
  onRestart,
  onQuit,
  entities,
  isVictory = false,
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
        source={require('../../assets/game-over-bg.jpg')} // Update with your background image
        style={styles.backgroundImage}
        resizeMode="cover"
        blurRadius={5}
      >
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>
              {isVictory ? 'VICTORY!' : 'GAME OVER'}
            </Text>
            
            {isVictory ? (
              <Image
                source={require('../../assets/victory.png')} // Update with your victory image
                style={styles.victoryImage}
                resizeMode="contain"
              />
            ) : (
              <Image
                source={require('../../assets/game-over.png')} // Update with your game over image
                style={styles.gameOverImage}
                resizeMode="contain"
              />
            )}
            
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>YOUR STATS</Text>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Distance:</Text>
                <Text style={styles.statValue}>
                  {Math.round(entities.pedometer?.totalDistance || 0)}m
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Steps:</Text>
                <Text style={styles.statValue}>
                  {entities.pedometer?.totalSteps || 0}
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Score:</Text>
                <Text style={styles.statValue}>
                  {entities.gameState.score}
                </Text>
              </View>
              
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Level Reached:</Text>
                <Text style={styles.statValue}>
                  {entities.gameState.currentLevel}
                </Text>
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.primaryButton]} 
                onPress={onRestart}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>PLAY AGAIN</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={handleQuit}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  MAIN MENU
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.shareButton}
                activeOpacity={0.8}
              >
                <Text style={styles.shareButtonText}>SHARE YOUR SCORE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 300,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'Arial',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  gameOverImage: {
    width: 200,
    height: 150,
    marginBottom: 20,
  },
  victoryImage: {
    width: 250,
    height: 200,
    marginBottom: 20,
  },
  statsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Arial',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontFamily: 'Arial',
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Arial',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: '#6a4c93',
    borderWidth: 2,
    borderColor: '#8e6cb0',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6a4c93',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    letterSpacing: 1,
  },
  secondaryButtonText: {
    color: '#8e6cb0',
  },
  shareButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a90e2',
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
  },
  shareButtonText: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Arial',
  },
});

export default GameOverScreen;
