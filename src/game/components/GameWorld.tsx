import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GameEntities, GameEvent } from '../types/game';
import Player from './Player';
import { gameManager } from '../GameManager';

interface GameWorldProps {
  entities: GameEntities;
  onEvent?: (event: GameEvent) => void;
  children?: React.ReactNode;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const GameWorld: React.FC<GameWorldProps> = ({ entities, onEvent, children }) => {
  const worldRef = useRef<View>(null);
  const lastUpdateTime = useRef<number>(0);
  const animationFrameId = useRef<number>();

  // Set up game loop
  useEffect(() => {
    let lastTime = 0;
    
    const gameLoop = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      
      // Update game state
      gameManager.update(deltaTime);
      
      // Request next frame
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };
    
    // Start game loop
    animationFrameId.current = requestAnimationFrame(gameLoop);
    
    // Clean up
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);
  
  // Set up event listeners
  useEffect(() => {
    if (onEvent) {
      gameManager.on('*', onEvent);
      return () => {
        gameManager.off('*', onEvent);
      };
    }
  }, [onEvent]);
  
  // Apply camera transform
  const cameraTransform = entities.camera?.transform || [];
  
  return (
    <View style={styles.container}>
      <View 
        ref={worldRef} 
        style={[
          styles.world,
          {
            width: entities.map.widthInTiles * entities.map.tileSize,
            height: entities.map.heightInTiles * entities.map.tileSize,
            transform: cameraTransform,
          },
        ]}
      >
        {/* Render map layers */}
        {entities.map.layers.map((layer, index) => (
          <View key={index} style={styles.layer}>
            {/* Map rendering would go here */}
          </View>
        ))}
        
        {/* Render player */}
        {entities.player && (
          <Player
            body={entities.player.body}
            size={entities.player.size}
            spritesheet={require('../../assets/player.png')} // Update path as needed
            frame={entities.player.frame}
            frameCount={entities.player.frameCount}
            direction={entities.player.direction}
            frameWidth={32} // Update based on sprite sheet
            frameHeight={32} // Update based on sprite sheet
          />
        )}
        
        {/* Render other entities */}
        {entities.enemies?.map((enemy, index) => (
          <View 
            key={`enemy-${index}`}
            style={[
              styles.entity,
              {
                left: enemy.body.position.x - (enemy.size?.width || 16) / 2,
                top: enemy.body.position.y - (enemy.size?.height || 16) / 2,
                width: enemy.size?.width || 32,
                height: enemy.size?.height || 32,
                backgroundColor: 'red', // Temporary, replace with sprite
              },
            ]}
          />
        ))}
        
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  world: {
    position: 'absolute',
    backgroundColor: '#1a1a1a',
  },
  layer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
  entity: {
    position: 'absolute',
    borderRadius: 4,
  },
});

ex default GameWorld;
