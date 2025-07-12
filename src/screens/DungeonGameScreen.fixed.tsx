import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import Matter from 'matter-js';
import MapRenderer from '../game/components/MapRenderer';
import { GameEntities } from '../game/types/game';

// Import map data and assets
import DungeonMapData from '../assets/catacombs.tmj.json';
import DungeonTilesetImage from '../assets/catacombs_tileset.png';

// Types
type Direction = 'up' | 'down' | 'left' | 'right';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TILE_SIZE = 32; // Default tile size

const DungeonGameScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [gameEntities, setGameEntities] = useState<GameEntities | null>(null);
  const gameEngineRef = useRef<any>(null);

  // Initialize game
  useEffect(() => {
    const initGame = async () => {
      try {
        console.log('Initializing game...');
        
        // Create physics engine
        const engine = Matter.Engine.create({
          gravity: { x: 0, y: 0 },
          enableSleeping: false,
        });

        // Create player
        const playerBody = Matter.Bodies.circle(
          (DungeonMapData.width * TILE_SIZE) / 2,
          (DungeonMapData.height * TILE_SIZE) / 2,
          TILE_SIZE / 2,
          { isStatic: false, label: 'player' }
        );

        // Create camera focus
        const cameraFocus = Matter.Bodies.rectangle(0, 0, 10, 10, {
          isStatic: true,
          isSensor: true,
          label: 'cameraFocus',
          render: { visible: false },
        });

        // Add bodies to world
        Matter.Composite.add(engine.world, [playerBody, cameraFocus]);

        // Create runner
        const runner = Matter.Runner.create();
        Matter.Runner.run(runner, engine);

        // Create game entities
        const entities: GameEntities = {
          map: {
            tiles: [],
            widthInTiles: DungeonMapData.width,
            heightInTiles: DungeonMapData.height,
            tileSize: TILE_SIZE,
            tilesetImage: DungeonTilesetImage,
            tilesetColumns: DungeonMapData.tilesets[0]?.columns || 8,
            tilesetImageWidth: DungeonMapData.tilesets[0]?.imagewidth || 256,
            tilesetImageHeight: DungeonMapData.tilesets[0]?.imageheight || 256,
            layers: DungeonMapData.layers || [],
          },
          player: {
            body: playerBody,
            size: { width: TILE_SIZE, height: TILE_SIZE },
            frame: 0,
            frameCount: 4,
            direction: 'down',
            velocity: { x: 0, y: 0 },
          },
          walls: [],
          pedometer: {
            lastProcessedRealWorldSteps: 0,
            lastDirectionInput: 'down',
            accumulatedPedometerSteps: 0,
          },
          physics: {
            engine,
            world: engine.world,
            runner,
          },
          camera: { focus: cameraFocus },
        };

        setGameEntities(entities);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing game:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize game'));
        setIsLoading(false);
      }
    };

    initGame();

    // Cleanup
    return () => {
      if (gameEntities?.physics.runner) {
        Matter.Runner.stop(gameEntities.physics.runner);
      }
    };
  }, []);

  // Show loading or error state
  if (isLoading || !gameEntities) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>
          {error ? `Error: ${error.message}` : 'Loading game...'}
        </Text>
      </View>
    );
  }

  // Render game
  return (
    <View style={styles.container}>
      <MapRenderer
        mapData={{
          ...DungeonMapData,
          width: gameEntities.map.widthInTiles,
          height: gameEntities.map.heightInTiles,
          tilewidth: gameEntities.map.tileSize,
          tileheight: gameEntities.map.tileSize,
          layers: gameEntities.map.layers,
          tilesets: [
            {
              firstgid: 1,
              columns: gameEntities.map.tilesetColumns,
              image: 'catacombs_tileset.png',
              imagewidth: gameEntities.map.tilesetImageWidth,
              imageheight: gameEntities.map.tilesetImageHeight,
              tilewidth: gameEntities.map.tileSize,
              tileheight: gameEntities.map.tileSize,
            },
          ],
        }}
        tilesetImage={DungeonTilesetImage}
      />
      
      {/* Player */}
      {gameEntities.player?.body && (
        <View
          style={{
            position: 'absolute',
            left: gameEntities.player.body.position.x - gameEntities.map.tileSize / 2,
            top: gameEntities.player.body.position.y - gameEntities.map.tileSize / 2,
            width: gameEntities.map.tileSize,
            height: gameEntities.map.tileSize,
            backgroundColor: 'red',
            borderRadius: gameEntities.map.tileSize / 2,
          }}
        />
      )}
    </View>
  );
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
    marginTop: 16,
    fontSize: 16,
  },
});

export default DungeonGameScreen;
