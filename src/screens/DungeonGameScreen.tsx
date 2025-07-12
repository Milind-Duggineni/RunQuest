import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp,
  StyleSheetProperties,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { GameEngine as BaseGameEngine, GameEngineProperties } from 'react-native-game-engine';
import type { GameEngine } from '../game/types/gameEngine';

interface GameEngineInstance {
  start: () => void;
  stop: () => void;
  swap: (entities: any) => void;
  dispatch: (event: any) => void;
  context: any;
  engine: any;
}

type GameEngineRef = React.RefObject<GameEngineInstance>;
import Matter from 'matter-js';
import * as Haptics from 'expo-haptics';
import Player from '../game/components/Player';
import { useImage } from '@shopify/react-native-skia';

// Import game systems and components
import Physics from '../game/systems/Physics'; // Assuming Physics system is defined here
import PedometerMovement from '../game/systems/PedometerMovement'; // Assuming PedometerMovement system is defined here
import MapRenderer from '../game/components/MapRenderer';
import RedDotPlayer from '../game/components/RedDotPlayer'; // Corrected casing
import { GameEntities, GameEvent, GameEngineContext } from '../game/types/game';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Use the GameEngineRef type from our type definitions

const INITIAL_MAP_DIMENSIONS = {
  width: 20,
  height: 15
};
// Define interfaces for type safety
interface TilesetData {
  firstgid: number;
  columns: number;
  tilewidth: number;
  tileheight: number;
  image: string | any;
  imagewidth: number;
  imageheight: number;
  margin: number;
  spacing: number;
  [key: string]: any;
}

interface MapLayer {
  data: number[];
  width: number;
  height: number;
  type: string;
  [key: string]: any;
}

interface MapData {
  tilewidth: number;
  tileheight: number;
  width: number;
  height: number;
  layers: MapLayer[];
  tilesets: TilesetData[];
  [key: string]: any;
}

// Default map data structure with proper typing
const DEFAULT_MAP_DATA: MapData = {
  tilewidth: 32,
  tileheight: 32,
  width: 20,
  height: 15,
  layers: [{
    data: [],
    width: 20,
    height: 15,
    type: 'tilelayer',
    name: 'ground',
    opacity: 1,
    visible: true,
    x: 0,
    y: 0
  }],
  tilesets: [{
    firstgid: 1,
    columns: 8,
    tilewidth: 32,
    tileheight: 32,
    image: '',
    imagewidth: 256,
    imageheight: 256,
    margin: 0,
    spacing: 0
  }]
};

// Try to import the map data with error handling
let DungeonMapData: MapData;
try {
  const importedData: Partial<MapData> = require('../assets/catacombs.tmj.json');
  // Merge with default to ensure all required fields exist
  DungeonMapData = { ...DEFAULT_MAP_DATA, ...importedData };
  
  // Ensure layers array exists and has at least one layer
  if (!DungeonMapData.layers || DungeonMapData.layers.length === 0) {
    console.warn('No layers found in map data, using default layer');
    DungeonMapData.layers = [...DEFAULT_MAP_DATA.layers];
  }
  
  // Ensure tilesets array exists and has at least one tileset
  if (!DungeonMapData.tilesets || DungeonMapData.tilesets.length === 0) {
    console.warn('No tilesets found in map data, using default tileset');
    DungeonMapData.tilesets = [...DEFAULT_MAP_DATA.tilesets];
  }
} catch (error) {
  console.error('Failed to load map data, using default:', error);
  DungeonMapData = { ...DEFAULT_MAP_DATA };
}

// Import your tileset image using a direct require
const DungeonTilesetImage = '../assets/catacombs_tileset.png';

type Direction = 'up' | 'down' | 'left' | 'right';

const DungeonGameScreen: React.FC = () => {
  // Game state
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [gameScale, setGameScale] = useState(1);
  const [currentSteps, setCurrentSteps] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameEntities, setGameEntities] = useState<GameEntities | null>(null);
  const [tilesetError, setTilesetError] = useState<string | null>(null);
  
  // Refs and state that must be declared at the top level
  const gameEngineRef = useRef<GameEngineRef>(null);
  const [isTilesetLoaded, setIsTilesetLoaded] = useState(false);
  const [tilesetLoadError, setTilesetLoadError] = useState<Error | null>(null);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  
  // Handle loading and error states
  const handleTilesetLoad = useCallback(() => {
    console.log('Tileset image loaded successfully');
    setIsTilesetLoaded(true);
    setTilesetLoadError(null);    
  }, []);
  
  const handleTilesetError = useCallback((error: string) => {
    console.error('Failed to load tileset image:', error);
    const err = new Error(error);
    setTilesetLoadError(err);
    setTilesetError(error);
    setIsTilesetLoaded(false);
  }, []);
  
  // Update player position when game entities change
  useEffect(() => {
    if (gameEntities?.player?.body?.position) {
      setPlayerPosition({
        x: gameEntities.player.body.position.x,
        y: gameEntities.player.body.position.y
      });
    }
  }, [gameEntities?.player?.body?.position]);

  // Initialize game state and entities
  useEffect(() => {
    console.log('Initializing game state...');
    setCurrentSteps(0);
    setGameScale(1);

    // Create Matter.js engine and world
    const engine = Matter.Engine.create({ gravity: { x: 0, y: 0 } });
    const world = engine.world;

    // Initialize game entities
    const playerBody = Matter.Bodies.rectangle(
      SCREEN_WIDTH / 2, // Center X
      SCREEN_HEIGHT / 2, // Center Y
      30, // Width
      30, // Height
      { isStatic: false, label: 'player' }
    );

    const initialEntities: GameEntities = {
      physics: {
        engine,
        world,
        runner: null,
      },
      player: {
        type: 'player',
        body: playerBody,
        position: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
        size: { width: 30, height: 30 },
        renderer: <RedDotPlayer position={{ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 }} size={{ width: 30, height: 30 }} />,
        path: [],
        currentPathIndex: 0,
        pathProgress: 0,
        health: 100,
        maxHealth: 100,
        speed: 5,
        direction: 'down',
        frame: 0,
        frameCount: 4,
        velocity: { x: 0, y: 0 },
        isMoving: false
      },
      camera: {
        type: 'camera',
        target: playerBody,
        position: { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 },
        zoom: 1,
        offsetX: 0,
        offsetY: 0
      },
      map: {
        tiles: Array(50 * 50).fill(1), // Fill with floor tiles
        widthInTiles: 50,
        heightInTiles: 50,
        tileSize: 32,
        tilesetImage: require('../assets/catacombs_tileset.png'),
        tilesetColumns: 10,
        tilesetImageWidth: 320,
        tilesetImageHeight: 320,
        layers: [
          {
            data: Array(50 * 50).fill(1), // Fill with floor tiles
            width: 50,
            height: 50,
            type: 'tilelayer'
          }
        ],
        objectLayers: [],
        collisionLayer: null
      },
      walls: [],
      enemies: [],
      treasures: [],
      traps: [],
      checkpoints: [],
      gameState: {
        isPaused: false,
        isGameOver: false,
        score: 0,
        currentLevel: 1,
        lastCheckpoint: undefined
      },
      pedometer: {
        lastProcessedRealWorldSteps: 0,
        lastDirectionInput: 'down' as const,
        accumulatedPedometerSteps: 0,
        stepsPerMeter: 1,
        totalDistance: 0,
        totalSteps: 0
      },
      path: {
        points: [],
        currentIndex: 0,
        isLooping: false
      }
    };

    console.log('Setting initial game entities:', initialEntities);
    setGameEntities(initialEntities);
  }, []);
  
  // Game engine context
  const gameEngine = useMemo(() => ({
    dispatch: (action: { type: string; [key: string]: any }) => {
      const engine = gameEngineRef.current as unknown as GameEngineInstance;
      if (engine) {
        engine.dispatch(action);
      }
    }
  }), []);

  // Event handlers
  const handleScreenTouch = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    const event = {
      type: 'touch',
      payload: { x: locationX, y: locationY }
    } as const;
    
    const engine = gameEngineRef.current as unknown as GameEngineInstance;
    engine?.dispatch(event);
  };
  
  const handleDirectionPress = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const engine = gameEngineRef.current as unknown as GameEngineInstance;
    if (!engine) return;
    
    // Dispatch the direction change to the game engine
    engine.dispatch({
      type: 'change_direction',
      direction
    });

    // Optional: Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // Handle pedometer updates
  const handlePedometerUpdate = useCallback((steps: number) => {
    setCurrentSteps(steps);
    
    // Update game state with pedometer data
    try {
      const direction = gameEntities?.player?.direction || 'down';
      gameEngine.dispatch({
        type: 'update_pedometer',
        steps,
        direction
      });
    } catch (err) {
      console.error('Error dispatching pedometer update:', err);
    }
  }, [gameEngine, gameEntities?.player?.direction]);

  // GameEngine Renderer function
  const gameEngineRenderer = (entities: GameEntities | null) => {
    console.log('Rendering game engine, entities:', entities ? 'present' : 'null');
    if (!entities) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: '#1a1a1a' }]}>
          <Text style={styles.loadingText}>Loading game...</Text>
          {tilesetError && (
            <Text style={styles.errorText}>
              Tileset Error: {tilesetError}
            </Text>
          )}
        </View>
      );
    }
  
    const player = entities.player;
    const map = entities.map;
  
    if (!gameEntities?.player || !map) return null;
  
    // Calculate camera position (center on player)
    const playerX = gameEntities?.player?.body?.position?.x ?? 0;
    const playerY = gameEntities?.player?.body?.position?.y ?? 0;
    const cameraX = playerX * gameScale - SCREEN_WIDTH / 2 + offsetX;
    const cameraY = playerY * gameScale - SCREEN_HEIGHT / 2 + offsetY;
    
    // Calculate map dimensions in pixels with fallback values
    const mapWidthPixels = (map.widthInTiles || 20) * (map.tileSize || 32);
    const mapHeightPixels = (map.heightInTiles || 15) * (map.tileSize || 32);
  
    // Show loading state while tileset is loading
    if (!isTilesetLoaded) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: '#1a1a1a' }]}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>
            {tilesetLoadError ? 'Error loading assets' : 'Loading game assets...'}
          </Text>
          {tilesetLoadError && (
            <Text style={styles.errorText}>
              {tilesetLoadError.message}
            </Text>
          )}
        </View>
      );
    }

    return (
      <GameEngineContext.Provider value={(gameEngineRef.current as unknown as GameEngineInstance)?.context || {}}>
        <View style={styles.gameContainer}>
          <View 
            style={[
              styles.gameViewport,
              {
                transform: [
                  { translateX: -cameraX },
                  { translateY: -cameraY },
                  { scale: gameScale },
                ],
                width: mapWidthPixels,
                height: mapHeightPixels,
              },
            ]}
          >
            <MapRenderer
              mapData={{
                tilewidth: map.tileSize || 32,
                tileheight: map.tileSize || 32,
                width: map.widthInTiles || 20,
                height: map.heightInTiles || 15,
                layers: map.layers || [{
                  data: map.tiles || [],
                  width: map.widthInTiles || 20,
                  height: map.heightInTiles || 15,
                  type: 'tilelayer',
                  name: 'ground',
                  opacity: 1,
                  visible: true,
                  x: 0,
                  y: 0
                }],
                tilesets: [{
                  firstgid: 1,
                  columns: 8, // cs-blue-00f.png has 8 columns
                  tilewidth: 32, // Standard tile size
                  tileheight: 32, // Standard tile size
                  image: 'cs-blue-00f',
                  imagewidth: 256, // 8 tiles * 32px = 256px
                  imageheight: 256, // 8 tiles * 32px = 256px
                  margin: 0,
                  spacing: 0
                }]
              }}
              tileset={require('../assets/cs-blue-00f.png')}
              onError={handleTilesetError}
              playerPosition={playerPosition}
              screenWidth={SCREEN_WIDTH}
              screenHeight={SCREEN_HEIGHT}
              debug={__DEV__}
              onLoadingStateChange={(isLoading) => {
                console.log('MapRenderer loading state:', isLoading);
                setIsTilesetLoaded(!isLoading);
              }}
              // Add a key to force remount if the image changes
              key={`map-${DungeonTilesetImage}`}
              // Explicitly set the image dimensions if known
              tileWidth={32}
              tileHeight={32}
            />
  
            {gameEntities?.player?.body?.position && (
              <RedDotPlayer
                position={gameEntities.player.body.position}
                size={gameEntities.player.size || { width: 30, height: 30 }}
                angle={gameEntities.player.body.angle || 0}
              />
            )}
          </View>
        </View>
      </GameEngineContext.Provider>
    );
  };

  // Handle game engine events
  const onEvent = (e: { type: string; [key: string]: any }) => {
    if (e.type === 'game_over') {
      // Handle game over
      console.log('Game Over');
    }
  };

  // Show error if tileset failed to load
  if (tilesetLoadError) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#1a1a1a' }]}>
        <Text style={[styles.loadingText, { color: '#ff6b6b', marginBottom: 20 }]}>
          Error Loading Tileset
        </Text>
        <Text style={styles.errorText}>{tilesetLoadError.message}</Text>
        <Text style={styles.hintText}>
          Please check if the tileset image exists at: assets/catacombs_tileset.png
        </Text>
      </View>
    );
  }

  // Add loading state if entities aren't ready or tileset is still loading
  if (!gameEntities || !isTilesetLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#1a1a1a' }]}>
        <Text style={styles.loadingText}>
          {!gameEntities ? 'Initializing game world...' : 'Loading tileset...'}
        </Text>
        <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.screenRootContainer}>
      <View style={styles.gameEngineContainer}>
        <GameEngineContext.Provider value={{
          time: { delta: 0 },
          delta: 0,
          dispatch: (event: any) => {
            if (gameEngineRef.current?.current) {
              gameEngineRef.current.current.dispatch(event);
            }
          },
          events: []
        }}>
          <BaseGameEngine
            ref={gameEngineRef as any} // Temporary type assertion
            systems={[
              (entities: any, { time }: { time: number }) => Physics(entities, { time } as any),
              (entities: any, context: any) => PedometerMovement(entities, context)
            ]}
            entities={gameEntities}
            renderer={gameEngineRenderer}
            onEvent={onEvent}
            style={styles.gameEngine}
            running={running}
          >
            <StatusBar hidden />
          </BaseGameEngine>
        </GameEngineContext.Provider>
      </View>
    </View>
  );
};

  const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 5,
  },
  hintText: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  screenRootContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameEngineContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameEngine: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameViewport: {
    position: 'absolute',
    backgroundColor: '#000',
  },
});

export default DungeonGameScreen;
