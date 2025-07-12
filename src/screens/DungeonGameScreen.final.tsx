import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import Matter from 'matter-js';
import MapRenderer from '../game/components/MapRenderer';
import { GameEntities } from '../game/types/game';

// Import map data and assets
import DungeonMapData from '../assets/catacombs.tmj.json';
import DungeonTilesetImage from '../assets/catacombs_tileset.png';

// Constants
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TILE_SIZE = DungeonMapData.tilewidth || 32;

// Types
type Direction = 'up' | 'down' | 'left' | 'right';

interface GameEngineRef {
  current: {
    stop: () => void;
    dispatch: (event: { type: string; [key: string]: any }) => void;
  } | null;
}

const DungeonGameScreen: React.FC = () => {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [gameEntities, setGameEntities] = useState<GameEntities | null>(null);
  
  // Refs
  const gameEngineRef = useRef<GameEngineRef['current']>(null);
  const gameEntitiesRef = useRef<GameEntities | null>(null);
  const moveInterval = useRef<NodeJS.Timeout | undefined>(undefined);
  const subscriptionRef = useRef<{ remove: () => void } | undefined>(undefined);
  const currentMoveIndexRef = useRef<number>(0);
  const directionRef = useRef<Direction>('down');
  const moveSpeed = 500; // ms between moves

  // Calculate map dimensions in pixels
  const mapWidthPixels = (DungeonMapData.width || 20) * TILE_SIZE;
  const mapHeightPixels = (DungeonMapData.height || 15) * TILE_SIZE;

  const gameScale = Math.min(SCREEN_WIDTH / mapWidthPixels, SCREEN_HEIGHT / mapHeightPixels, 1);
  const offsetX = (SCREEN_WIDTH - mapWidthPixels * gameScale) / 2;
  const offsetY = (SCREEN_HEIGHT - mapHeightPixels * gameScale) / 2;

  // Game initialization
  useEffect(() => {
    const initGame = async () => {
      try {
        setIsLoading(true);
        
        // TODO: Initialize game entities
        // const entities = await createGameEntities();
        // setGameEntities(entities);
        
        // Set up game loop
        const gameLoop = setInterval(() => {
          // Update game state here
        }, 1000 / 60);
        
        // Cleanup
        return () => {
          clearInterval(gameLoop);
          if (gameEngineRef.current) {
            gameEngineRef.current.stop();
          }
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize game'));
      } finally {
        setIsLoading(false);
      }
    };
    
    initGame();
  }, []);

  // Render loading or error state
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: 'red' }]}>
            Error: {error.message}
          </Text>
        </View>
      );
    }

    if (!gameEntities) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Failed to load game entities</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.gameContainer}>
          <View style={styles.mapContainer}>
            <MapRenderer
              mapData={{
                ...DungeonMapData,
                width: gameEntities.map.widthInTiles,
                height: gameEntities.map.heightInTiles,
                tilewidth: gameEntities.map.tileSize,
                tileheight: gameEntities.map.tileSize,
                layers: gameEntities.map.layers,
                tilesets: [{
                  firstgid: 1,
                  source: 'catacombs.tsx',
                  name: 'catacombs',
                  tilewidth: gameEntities.map.tileSize,
                  tileheight: gameEntities.map.tileSize,
                  columns: gameEntities.map.tilesetColumns,
                  image: DungeonTilesetImage,
                  imagewidth: gameEntities.map.tilesetImageWidth,
                  imageheight: gameEntities.map.tilesetImageHeight,
                }]
              }}
              tilesetData={{
                firstgid: 1,
                source: 'catacombs.tsx',
                name: 'catacombs',
                tilewidth: gameEntities.map.tileSize,
                tileheight: gameEntities.map.tileSize,
                columns: gameEntities.map.tilesetColumns,
                image: DungeonTilesetImage,
                imagewidth: gameEntities.map.tilesetImageWidth,
                imageheight: gameEntities.map.tilesetImageHeight,
              }}
            />
          </View>
        </View>
        
        {/* Debug Info */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Player: {Math.round(gameEntities.player.body.position.x / TILE_SIZE)}, 
            {Math.round(gameEntities.player.body.position.y / TILE_SIZE)}
          </Text>
          <Text style={styles.debugText}>
            Direction: {directionRef.current}
          </Text>
        </View>
      </View>
    );
  };

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    position: 'relative',
  },
  debugInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
});

export default DungeonGameScreen;
