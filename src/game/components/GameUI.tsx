import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { GameEntities } from '../types/game';

interface GameUIProps {
  entities: GameEntities;
  onPause: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ entities, onPause }) => {
  const { player, gameState } = entities;
  
  // Calculate health percentage for the health bar
  const healthPercentage = player 
    ? Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100)) 
    : 0;
  
  // Format distance (in meters)
  const formatDistance = (meters: number) => {
    return meters < 1000 
      ? `${Math.round(meters)}m`
      : `${(meters / 1000).toFixed(1)}km`;
  };
  
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top Bar */}
      <View style={styles.topBar}>
        {/* Health Bar */}
        <View style={styles.healthContainer}>
          <Text style={styles.healthText}>HP</Text>
          <View style={styles.healthBarBackground}>
            <View 
              style={[
                styles.healthBarFill, 
                { 
                  width: `${healthPercentage}%`,
                  backgroundColor: healthPercentage > 30 ? '#4CAF50' : '#F44336',
                }
              ]} 
            />
          </View>
          <Text style={styles.healthText}>
            {Math.round(player?.health || 0)}/{player?.maxHealth || 100}
          </Text>
        </View>
        
        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>Score: {gameState.score}</Text>
        </View>
        
        {/* Pause Button */}
        <View style={styles.pauseButton} onTouchEnd={onPause}>
          <Text style={styles.pauseButtonText}>II</Text>
        </View>
      </View>
      
      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>DISTANCE</Text>
            <Text style={styles.statValue}>
              {formatDistance(entities.pedometer?.totalDistance || 0)}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>STEPS</Text>
            <Text style={styles.statValue}>
              {entities.pedometer?.totalSteps || 0}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>LEVEL</Text>
            <Text style={styles.statValue}>{gameState.currentLevel}</Text>
          </View>
        </View>
      </View>
      
      {/* Debug Info (visible in development) */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            X: {player?.body.position.x.toFixed(1)}
          </Text>
          <Text style={styles.debugText}>
            Y: {player?.body.position.y.toFixed(1)}
          </Text>
          <Text style={styles.debugText}>
            Facing: {player?.direction}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 4,
    minWidth: 120,
  },
  healthText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginHorizontal: 4,
  },
  healthBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  scoreContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  scoreText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pauseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    transform: [{ rotate: '90deg' }],
  },
  bottomBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  debugContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 8,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
  },
});

export default GameUI;
