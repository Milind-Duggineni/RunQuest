import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Button, StatusBar, Platform, Dimensions, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { GameEngine as BaseGameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import * as Haptics from 'expo-haptics';
import { Pedometer } from 'expo-sensors';
import { getPedometer } from '../utils/pedometerMock';

// Import game systems and components
import Physics from '../game/systems/Physics';
import PedometerMovement from '../game/systems/PedometerMovement';
import GameMap from '../game/components/gamemap'; 
import RedDotPlayer from '../game/components/RedDotPlayer'; 
import { GameEntities, GameEngineContext } from '../game/types/game';


type GameEngineRefType = {
  dispatch: (action: { type: string; [key: string]: any }) => void;
  context?: any;
  engine?: Matter.Engine;
  stop?: () => void;
  start?: () => void;
  swap?: (newEntities: any) => void;
};
// Import assets
const TilesetImage = require('../assets/catacombs_tileset.png');

// Constants
const TILE_SIZE = 32;
const PLAYER_SIZE = { width: TILE_SIZE, height: TILE_SIZE };

// Types
type RootStackParamList = {
  DungeonGame: {
    dungeonId: string;
    dungeonName: string;
  };
};

type DungeonGameRouteProp = RouteProp<RootStackParamList, 'DungeonGame'>;



const DungeonGameScreen: React.FC = () => {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
  const navigation = useNavigation();
  const route = useRoute<DungeonGameRouteProp>();
  const { dungeonId, dungeonName } = route.params;

  // Game state
  const [running, setRunning] = useState<boolean>(false);
  const [gameEntities, setGameEntities] = useState<GameEntities | null>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [mapLoading, setMapLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentSteps, setCurrentSteps] = useState<number>(0);
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>('down');
  const [gameScale, setGameScale] = useState(1);
  const [offsets, setOffsets] = useState({ x: 0, y: 0 });
  

  // Refs
  const gameEngineRef = useRef<GameEngineRefType>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  // Initialize game entities
  const initializeGameEntities = useCallback((): GameEntities | null => {
    if (!mapData) {
      console.error('Cannot initialize game entities: Map data not loaded');
      return null;
    }

    console.log('Initializing game entities...');
    const engine = Matter.Engine.create({ enableSleeping: false });
    const world = engine.world;
    world.gravity.y = 0;

    // Create player body
    const playerBody = Matter.Bodies.rectangle(
      TILE_SIZE * 2, // Start at x=2 tiles
      TILE_SIZE * 2, // Start at y=2 tiles
      PLAYER_SIZE.width * 0.6,
      PLAYER_SIZE.height * 0.6,
      {
        label: 'Player',
        isStatic: false,
        friction: 0,
        frictionAir: 0.1,
        frictionStatic: 0,
        restitution: 0,
      }
    );

    Matter.World.add(world, playerBody);

    // Create walls (simplified for testing)
    const walls: Matter.Body[] = [];
    // Add some test walls
    for (let i = 0; i < 10; i++) {
      const wall = Matter.Bodies.rectangle(
        i * TILE_SIZE,
        0,
        TILE_SIZE,
        TILE_SIZE,
        { isStatic: true, label: 'Wall' }
      );
      walls.push(wall);
    }
    Matter.World.add(world, walls);

    return {
      physics: { engine, world, runner: null },
      player: {
        body: playerBody,
        size: PLAYER_SIZE,
        frame: 0,
        frameCount: 4,
        direction: 'down',
        velocity: { x: 0, y: 0 } // Add velocity property
      } as const,
      walls: walls.map(body => ({ body })),
      camera: { focus: playerBody },
      pedometer: {
        lastProcessedRealWorldSteps: 0,
        lastDirectionInput: 'down',
        accumulatedPedometerSteps: 0
      },
      map: {
        tiles: [],
        widthInTiles: 20,
        heightInTiles: 20,
        tileSize: TILE_SIZE,
        tilesetColumns: 10,
        tilesetImageWidth: 320,
        tilesetImageHeight: 320,
      }
    };
  }, [mapData]);

  // Start the game
  const startGame = useCallback(() => {
    console.log('Starting game...');
    const entities = initializeGameEntities();
    if (entities) {
      setGameEntities(entities);
      setRunning(true);
      console.log('Game started');
    }
  }, [initializeGameEntities]);

  // Game loop systems with logging
  const systems = [
    Physics,
    (entities: GameEntities, { time, events, dispatch }: any) => {
      // Log player position
      if (entities.player?.body) {
        console.log('[GameLoop] Player position:', {
          x: entities.player.body.position.x.toFixed(1),
          y: entities.player.body.position.y.toFixed(1),
          direction: entities.player.direction
        });
      }
      
      // Process pedometer movement
      return PedometerMovement(entities, { time, events, dispatch });
    },
  ];

  // Render function
  const renderGame = useCallback((entities: GameEntities | null) => {
    if (!entities) {
      return (
        <View style={styles.loadingContainer}>
          <Text>Loading game...</Text>
        </View>
      );
    }

    return (
      <View style={styles.gameContainer}>
        {entities.player?.body && (
          <RedDotPlayer 
            body={entities.player.body}
            size={PLAYER_SIZE}
          />
        )}
      </View>
    );
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
      if (gameEntities?.physics?.engine) {
        Matter.Engine.clear(gameEntities.physics.engine);
      }
    };
  }, [gameEntities]);

  return (
    <View style={styles.container}>
      {!running ? (
        <View style={styles.startContainer}>
          <Text style={styles.title}>Dungeon Game</Text>
          <Button title="Start Game" onPress={startGame} />
        </View>
      ) : (
        <BaseGameEngine
          ref={gameEngineRef}
          systems={systems}
          entities={gameEntities}
          style={styles.gameEngine}
          running={running}
        >
          <StatusBar hidden />
        </BaseGameEngine>
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
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 20,
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#333',
  },
  gameEngine: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default DungeonGameScreen;
