import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, Alert, Button, StatusBar } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { GameEngine as BaseGameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';

// Add JSX namespace for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Add any custom JSX elements here if needed
    }
  }
}

// Extend the GameEngine type to include the engine property
interface GameEngineWithRef {
  engine?: {
    dispatch: (action: { type: string; [key: string]: any }) => void;
  };
}

// Define the GameEngine component with the correct ref type
const GameEngine = React.forwardRef<GameEngineWithRef, React.ComponentProps<typeof BaseGameEngine>>(
  (props, ref) => {
    return <BaseGameEngine ref={ref} {...props} />;
  }
);

// Export the component
const DungeonGameScreen: React.FC = () => {
  // Add type for the game engine ref
  const gameEngineRef = useRef<GameEngineWithRef>(null);
import * as Haptics from 'expo-haptics';
import { Pedometer } from 'expo-sensors';
import { getPedometer } from '../utils/pedometerMock'; // Assuming this path is correct

// Import game systems and components (assuming these paths are correct in your project)
import Physics from '../game/systems/Physics';
import PedometerMovement from '../game/systems/PedometerMovement';
import MapRenderer from '../game/components/MapRenderer';
import Player from '../game/components/Player';
// Wall component might not need direct import if only used within Physics system
// import Wall from '../game/components/Wall';

// Import assets (assuming these paths are correct)
// @ts-ignore - XML type is handled by xml.d.ts
import CharacterSpritesheet from '../assets/Warrior.xml';

// Use require for image assets in React Native
// Directly import the tileset image
const TilesetImage = require('../assets/tileset.png');

// Define map interface (consolidated and corrected)
interface TiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: Array<{
    name: string;
    type: string;
    data?: number[]; // Can be tile data for tile layers
    objects?: any[]; // Can be object data for object layers
    width: number; // width of layer in tiles
    height: number; // height of layer in tiles
    x: number; // x offset
    y: number; // y offset
    opacity: number;
    visible: boolean;
  }>;
  tilesets: Array<{
    firstgid: number;
    source: string; // Path to tileset TMX/JSON
    image?: string; // Path to image used by tileset
    imagewidth?: number;
    imageheight?: number;
    tilewidth?: number;
    tileheight?: number;
    columns?: number;
  }>;
}

// Types for navigation parameters
type RootStackParamList = {
  DungeonGame: {
    dungeonId: string;
    dungeonName: string;
  };
};

// Define the RouteProp type for useRoute hook
type DungeonGameRouteProp = RouteProp<RootStackParamList, 'DungeonGame'>;

// Game Entities type (consolidated and corrected)
type GameEntities = {
  physics: { engine: Matter.Engine; world: Matter.World };
  player: {
    body: Matter.Body;
    size: { width: number; height: number };
    frame: number;
    frameCount: number;
    direction: 'up' | 'down' | 'left' | 'right';
    renderer: JSX.Element;
  };
  walls: Array<{ body: Matter.Body; renderer?: JSX.Element }>;
  camera: { focus: Matter.Body };
  map?: { // Make map optional as it's added during setup
    tiles: number[];
    widthInTiles: number;
    heightInTiles: number;
    tileSize: number;
    tilesetImage: { uri: string };
    tilesetColumns: number;
    renderer: JSX.Element | null;
  };
  pedometer?: { // Pedometer data for the game system
    lastProcessedRealWorldSteps: number;
    lastDirectionInput: 'up' | 'down' | 'left' | 'right';
  };
};

const TILE_SIZE = 32;
const PLAYER_SIZE = { width: TILE_SIZE, height: TILE_SIZE };
const PLAYER_FRAME_WIDTH = 32; // Width of each frame in the spritesheet
const PLAYER_FRAME_HEIGHT = 32; // Height of each frame in the spritesheet

const DungeonGameScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<DungeonGameRouteProp>();
  const { dungeonId, dungeonName } = route.params;

  // Game state (consolidated)
  const [running, setRunning] = useState<boolean>(false);
  const [pedometerAvailable, setPedometerAvailable] = useState<boolean>(false);
  const [currentSteps, setCurrentSteps] = useState<number>(0);
  const [dungeonEntrySteps, setDungeonEntrySteps] = useState<number>(0); // Baseline for steps when game starts
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>('down');
  const [gameEntities, setGameEntities] = useState<GameEntities | null>(null);
  const [mapData, setMapData] = useState<TiledMap | null>(null);
  const [mapLoading, setMapLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Refs
  const gameEngineRef = useRef<GameEngine | null>(null);
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);

  // Use the mock pedometer in development and web environments
  const useMock = __DEV__ || Platform.OS === 'web';
  const pedometer = useMemo(() => {
    return getPedometer(useMock);
  }, [useMock]);

  // Type for the pedometer instance (Expo's Pedometer module)
  type PedometerInstance = typeof Pedometer;
  const typedPedometer = pedometer as PedometerInstance;

  // Check pedometer availability on mount
  useEffect(() => {
    const checkPedometerAvailability = async () => {
      try {
        const isAvailable = await typedPedometer.isAvailableAsync();
        setPedometerAvailable(isAvailable);
        console.log('Pedometer available:', isAvailable, useMock ? '(using mock)' : '(using real pedometer)');

        // Log initial steps for mock/debug
        if (useMock && isAvailable) {
          const now = new Date();
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          try {
            const { steps } = await typedPedometer.getStepCountAsync(startOfDay, now);
            console.log('Current step count (initial check):', steps);
          } catch (e) {
            console.warn('Could not get initial step count from pedometer:', e);
          }
        }
      } catch (error) {
        console.error('Error checking pedometer availability:', error);
        setPedometerAvailable(false);
      }
    };
    checkPedometerAvailability();
  }, [useMock, typedPedometer]); // Dependencies for this effect

  // Handle back button press and cleanup
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Prevent default behavior of leaving the screen immediately
      e.preventDefault();

      // Perform cleanup before allowing navigation
      console.log('Cleaning up game resources...');
      if (gameEngineRef.current?.engine) {
        Matter.Engine.clear(gameEngineRef.current.engine);
        console.log("Matter.js engine cleared.");
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
        console.log("Pedometer subscription removed.");
      }

      // Then, dispatch the action to navigate away
      navigation.dispatch(e.data.action);
    });

    return unsubscribe; // Return the unsubscribe function for cleanup
  }, [navigation]);

  // Load map data
  const loadMapData = useCallback(async () => {
    setMapLoading(true); // Set loading state when starting to load
    try {
      console.log('Attempting to load map data...');
      // Using require for static JSON imports is recommended in React Native
      const loadedMap: TiledMap = require('../assets/ShadowfellCrypt.json');

      if (!loadedMap) {
        throw new Error('Map data is empty or undefined after require');
      }

      console.log('Map data loaded successfully:', {
        width: loadedMap.width,
        height: loadedMap.height,
        layers: loadedMap.layers?.length || 0,
        tilesets: loadedMap.tilesets?.length || 0
      });

      // Log first few tiles of the first layer for debugging
      if (loadedMap.layers?.[0]?.data) {
        console.log('First 10 tiles of first layer:', loadedMap.layers[0].data.slice(0, 10));
      }

      setMapData(loadedMap);
      setMapError(null);
      return loadedMap; // Return the loaded data
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error loading map data';
      console.error('Error loading map data:', error);
      setMapError(`Failed to load map data: ${errorMessage}`);
      throw error;
    } finally {
      setMapLoading(false);
    }
  }, []);

  // Trigger map data loading on component mount
  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  // Log the spritesheet for debugging (optional, for development only)
  useEffect(() => {
    console.log('CharacterSpritesheet:', CharacterSpritesheet);
  }, []);

  // Log when game entities are set for debugging
  useEffect(() => {
    if (gameEntities) {
      console.log('Game entities initialized. Player position:', gameEntities.player.body.position);
    }
  }, [gameEntities]);

  // Function to initialize all game entities (physics, player, map, etc.)
  const initializeGameEntities = useCallback((): GameEntities | null => {
    if (!mapData) {
      console.error('Map data not available for game entity initialization.');
      return null;
    }

    console.log('Initializing game entities with map data...');

    // Create physics engine
    const engine = Matter.Engine.create({ enableSleeping: false });
    const world = engine.world;
    world.gravity.y = 0; // No gravity for top-down game

    // Create player body
    const playerBody = Matter.Bodies.rectangle(
      TILE_SIZE * 2, // Initial X position
      TILE_SIZE * 2, // Initial Y position
      PLAYER_SIZE.width * 0.8, // Slightly smaller than tile for movement
      PLAYER_SIZE.height * 0.8,
      {
        label: 'Player',
        isStatic: false,
        friction: 0,
        frictionAir: 0.1,
        frictionStatic: 0,
        restitution: 0,
        // Ensure player collision filter is set if needed for interaction with walls
        // collisionFilter: { category: 0x0001, mask: 0x0002 } // Example
      }
    );
    Matter.World.add(world, playerBody);

    // Create wall bodies from the map's wall layer
    const wallBodies: Matter.Body[] = [];
    const wallsLayer = mapData.layers.find(layer =>
      layer.name === 'Walls' || (layer.type === 'tilelayer' && Array.isArray(layer.data) && layer.data.some(id => id !== 0))
    );

    if (!wallsLayer || !wallsLayer.data) {
      console.warn('No valid walls layer found or walls layer has no data in map data. No static walls will be created.');
    } else {
      const { data, width, height } = wallsLayer;
      console.log(`Processing walls layer: ${wallsLayer.name || 'unnamed'}, size: ${width}x${height}`);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;
          const tileId = data[index];

          if (tileId !== 0) { // Assuming 0 means an empty tile, and non-zero means a wall
            const wall = Matter.Bodies.rectangle(
              x * TILE_SIZE + TILE_SIZE / 2,
              y * TILE_SIZE + TILE_SIZE / 2,
              TILE_SIZE,
              TILE_SIZE,
              { isStatic: true, label: 'Wall' }
            );
            wallBodies.push(wall);
          }
        }
      }
      Matter.World.add(world, wallBodies);
    }

    // Identify the main ground/tile layer for rendering the map background
    const groundLayer = mapData.layers.find(layer =>
      layer.type === 'tilelayer' && Array.isArray(layer.data) && layer.name === 'Ground' // Or whatever your main map layer is named
    );

    return {
      physics: { engine, world },
      player: {
        body: playerBody,
        size: PLAYER_SIZE,
        frame: 0, // Initial frame
        frameCount: 4, // Total frames in animation sequence for a direction
        direction: direction, // Current facing direction
        renderer: (
          <Player
            body={playerBody}
            size={PLAYER_SIZE}
            spritesheet={CharacterSpritesheet}
            frame={0}
            frameCount={4}
            direction={direction}
            frameWidth={PLAYER_FRAME_WIDTH}
            frameHeight={PLAYER_FRAME_HEIGHT}
          />
        ),
      },
      walls: wallBodies.map(body => ({ body })), // Walls don't need a custom renderer in this setup
      camera: { focus: playerBody }, // Camera typically follows the player
      map: {
        tiles: groundLayer?.data || [], // Use data from the identified ground layer
        widthInTiles: mapData.width,
        heightInTiles: mapData.height,
        tileSize: TILE_SIZE,
        tilesetImage: TilesetImage,
        tilesetColumns: mapData.tilesets?.[0]?.columns || 8, // Derive from tileset data or default
        renderer: groundLayer?.data ? (
          <MapRenderer
            tiles={groundLayer.data}
            widthInTiles={mapData.width}
            heightInTiles={mapData.height}
            tileSize={TILE_SIZE}
            tilesetImage={TilesetImage}
            tilesetColumns={mapData.tilesets?.[0]?.columns || 8}
          />
        ) : null,
      },
      pedometer: {
        lastProcessedRealWorldSteps: dungeonEntrySteps,
        lastDirectionInput: 'down', // Initial direction for pedometer movement system
      },
    };
  }, [mapData, direction, dungeonEntrySteps]);

  // Pedometer subscription and step handling
  useEffect(() => {
    const setupPedometerSubscription = async () => {
      if (!running) return;

      try {
        // Check pedometer availability
        const isAvailable = await Pedometer.isAvailableAsync();
        console.log('Pedometer available:', isAvailable);
        setPedometerAvailable(isAvailable);
        
        if (!isAvailable) return;

        // Get initial step count
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        try {
          const { steps: initialSteps } = await Pedometer.getStepCountAsync(startOfDay, now);
          console.log('Initial step count:', initialSteps);
          setDungeonEntrySteps(initialSteps);
          
          // Set up step counter listener
          subscriptionRef.current = Pedometer.watchStepCount(result => {
            const stepsSinceEntry = result.steps - initialSteps;
            const validSteps = Math.max(0, stepsSinceEntry);
            
            console.log('Step count updated:', validSteps);
            setCurrentSteps(validSteps);
            
            if (gameEngineRef.current) {
              gameEngineRef.current.dispatch({
                type: 'REAL_WORLD_STEP_UPDATE',
                steps: validSteps,
              });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                .catch(e => console.log('Haptics failed:', e));
            }
          });
          
        } catch (error) {
          console.error('Error getting initial step count:', error);
          setPedometerAvailable(false);
        }
        
      } catch (error) {
        console.error('Error checking pedometer availability:', error);
        setPedometerAvailable(false);
      }
    };

    setupPedometerSubscription();

    // Cleanup function
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
        console.log('Pedometer subscription cleaned up');
      }
    };
  }, [running]); // Only re-run if running state changes

  // Handle direction button press
  const handleDirectionPress = useCallback((newDirection: 'up' | 'down' | 'left' | 'right') => {
    setDirection(newDirection);
    if (gameEngineRef.current) {
      gameEngineRef.current.dispatch({ type: 'CHANGE_DIRECTION', direction: newDirection });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(e => console.log("Haptics failed:", e));
    }
  }, []);

  // Function to start the game after map data is loaded and conditions are met
  const startGame = useCallback(() => {
    console.log('Attempting to start game logic...');
    const entities = initializeGameEntities(); // Call the function to create entities
    if (entities) {
      setGameEntities(entities);
      setRunning(true);
      console.log('Game started and entities initialized.');
    } else {
      console.error('Failed to initialize game entities, cannot start game.');
    }
  }, [initializeGameEntities]); // Depend on the entity initialization function

  // Render game UI based on loading and game state
  const renderGameUI = (): React.JSX.Element => {
    if (mapLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dungeon map...</Text>
        </View>
      );
    }

    if (mapError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading map: {mapError}</Text>
          <Button
            title="Retry"
            onPress={() => {
              setMapLoading(true);
              setMapError(null);
              loadMapData(); // Retry loading map data
            }}
          />
        </View>
      );
    }

    // Show start screen if map is loaded but game is not running and entities are not yet set
    if (mapData && !running && !gameEntities) {
      return (
        <View style={styles.startContainer}>
          <Text style={styles.title}>Entering {dungeonName}</Text>
          <Text style={styles.subtitle}>Your steps will move your character</Text>
          <Button
            title={pedometerAvailable ? 'Start Adventure' : 'Pedometer Not Available'}
            onPress={startGame}
            disabled={!pedometerAvailable}
          />
          {!pedometerAvailable && (
            <Text style={styles.warning}>
              Step counting is not available on this device or permission denied.
            </Text>
          )}
        </View>
      );
    }

    // Show loading for entities if mapData is available but entities are not yet ready
    if (!gameEntities) {
        return (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Initializing game world...</Text>
            {mapData && (
              <Text style={styles.debugText}>
                Map loaded: {mapData.width}x{mapData.height} tiles
              </Text>
            )}
          </View>
        );
      }

    // Main game screen once entities are ready
    return (
      <>
        <View style={styles.gameContainer}>
          <GameEngine
            ref={gameEngineRef}
            systems={[Physics, PedometerMovement]} // Ensure these are correctly implemented
            entities={gameEntities}
            style={{ flex: 1 }}
            running={running}
          >
            <StatusBar hidden />
            {/* Map Renderer */}
            {gameEntities.map?.renderer && (
              <View key="map-renderer" style={StyleSheet.absoluteFillObject}>
                {gameEntities.map.renderer}
              </View>
            )}
            {/* Player Renderer */}
            {gameEntities.player?.renderer && (
              <View key="player-renderer" style={StyleSheet.absoluteFillObject}>
                {gameEntities.player.renderer}
              </View>
            )}
          </GameEngine>
        </View>
        <View style={styles.controls}>
          <View style={styles.dpad}>
            <Button title="↑" onPress={() => handleDirectionPress('up')} />
            <View style={styles.dpadRow}>
              <Button title="←" onPress={() => handleDirectionPress('left')} />
              <View style={styles.dpadCenter} />
              <Button title="→" onPress={() => handleDirectionPress('right')} />
            </View>
            <Button title="↓" onPress={() => handleDirectionPress('down')} />
          </View>
        </View>
        <View style={styles.stats}>
          <Text style={{ color: '#fff' }}>Steps: {currentSteps}</Text>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {renderGameUI()}
      {/* Debug overlay */}
      <View style={styles.debugOverlay} pointerEvents="none">
        <Text style={styles.debugText}>
          Map: {mapData ? 'Loaded' : 'Loading...'} |
          Game: {running ? 'Running' : 'Paused'} |
          Steps: {currentSteps} |
          Mock: {useMock ? 'Yes' : 'No'} |
          Pos: {gameEntities?.player?.body?.position ?
            `(${Math.round(gameEntities.player.body.position.x)}, ${Math.round(gameEntities.player.body.position.y)})` : 'N/A'}
        </Text>
      </View>
    </View>
  );
};

// Define styles (merged and corrected)
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
    fontSize: 18,
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#300',
    padding: 20,
  },
  errorText: {
    color: '#f88',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  debugText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 10,
  },
  debugOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  gameContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000',
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    padding: 20,
    alignItems: 'center', // Center the dpad horizontally
  },
  dpad: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 10,
  },
  dpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120,
    marginVertical: 5,
  },
  dpadCenter: {
    width: 40,
    // Add height if you want it to push buttons apart vertically
  },
  stats: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000', // Ensure it has a background
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    color: '#aaa',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  warning: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default DungeonGameScreen;
