import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import Svg, { Rect } from 'react-native-svg';
import useStepTracker from '../hooks/useStepTracker';
import { useGame, GameProvider } from '../context/GameContext';
import ShadowfellCryptMap from '../components/ShadowfellCryptMap';
import Warrior from '../components/Warrior';

// Define the structure of the game entities
type GameEntities = {
    physics: {
        engine: Matter.Engine;
        world: Matter.World;
    };
    player: {
        body: Matter.Body;
    };
    camera: {
        x: number;
        y: number;
    };
    controls: {
        left: boolean;
        right: boolean;
    };
    // You can add more entities here as your game grows (e.g., 'enemies': { ... })
};

const { width, height } = Dimensions.get('window');
const TILE_SIZE = 32; // Standard tile size for map components
const MAP_WIDTH = 40 * TILE_SIZE; // Total width of the game map
const MAP_HEIGHT = 40 * TILE_SIZE; // Total height of the game map
const VIEWPORT_WIDTH = width; // Width of the visible game area (screen width)
const VIEWPORT_HEIGHT = height - (StatusBar.currentHeight || 0); // Height of visible game area

// Warrior character properties
const WARRIOR_SIZE = 48; // Visual size of the warrior character

// Game physics constants
const GRAVITY = 0.5; // Downward acceleration
const JUMP_FORCE = -12; // Upward velocity for jump
const MOVE_SPEED = 5; // Horizontal movement speed

/**
 * Physics system for the React Native Game Engine.
 * Updates the Matter.js engine and handles player movement and camera following.
 * @param entities - The current game entities state.
 * @param { time: { delta } } - Object containing delta time for physics updates.
 */
const Physics = (entities: GameEntities, { time }: { time: { delta: number } }) => {
    // Destructure engine and player body from entities for easier access
    const engine = entities.physics.engine;
    const player = entities.player.body;

    // Defensive check: If engine or player are not yet initialized, return entities as is.
    // This should ideally not be hit if GameEngine is conditionally rendered.
    if (!engine || !player) {
        console.warn('Physics system received uninitialized engine or player body.');
        return entities;
    }

    try {
        // Handle player horizontal movement based on control states
        if (entities.controls.left) {
            Matter.Body.setVelocity(player, { x: -MOVE_SPEED, y: player.velocity.y });
        } else if (entities.controls.right) {
            Matter.Body.setVelocity(player, { x: MOVE_SPEED, y: player.velocity.y });
        } else {
            // Apply a friction-like effect when no horizontal input is given
            Matter.Body.setVelocity(player, {
                x: player.velocity.x * 0.8, // Gradually reduce horizontal velocity
                y: player.velocity.y
            });
        }

        // Update the Matter.js physics simulation with the given delta time
        Matter.Engine.update(engine, time.delta);

        // Update camera position to follow the player
        // The camera's (x, y) coordinates represent the top-left corner of the viewport relative to the map.
        // We subtract player's position to move the map 'behind' the player, centering the player.
        // And then add half the viewport dimensions to precisely center.
        let newCameraX = -player.position.x + VIEWPORT_WIDTH / 2;
        let newCameraY = -player.position.y + VIEWPORT_HEIGHT / 2;

        // Clamp camera position to prevent it from showing areas outside the map boundaries.
        // X-axis clamping:
        //  - newCameraX cannot be greater than 0 (left edge of map aligns with left edge of screen).
        //  - newCameraX cannot be less than -(MAP_WIDTH - VIEWPORT_WIDTH) (right edge of map aligns with right edge of screen).
        newCameraX = Math.min(0, Math.max(-(MAP_WIDTH - VIEWPORT_WIDTH), newCameraX));
        // Y-axis clamping:
        //  - newCameraY cannot be greater than 0 (top edge of map aligns with top edge of screen).
        //  - newCameraY cannot be less than -(MAP_HEIGHT - VIEWPORT_HEIGHT) (bottom edge of map aligns with bottom edge of screen).
        newCameraY = Math.min(0, Math.max(-(MAP_HEIGHT - VIEWPORT_HEIGHT), newCameraY));


        // Update the camera position in the entities object
        entities.camera.x = newCameraX;
        entities.camera.y = newCameraY;

    } catch (error) {
        console.error('Error in Physics system:', error);
    }

    return entities; // Return the updated entities object
};

/**
 * Creates and adds a player physics body to the Matter.js world.
 * @param world - The Matter.js world instance.
 * @param pos - Initial position {x, y} for the player.
 * @returns The created Matter.Body object or null if creation fails.
 */
const createPlayer = (world: Matter.World, pos: { x: number; y: number }): Matter.Body | null => {
    try {
        const body = Matter.Bodies.rectangle(
            pos.x,
            pos.y,
            WARRIOR_SIZE * 0.8, // Body size, slightly smaller than visual for better collision feel
            WARRIOR_SIZE * 0.8,
            {
                label: 'player', // Identifier for this body
                friction: 0.1, // Low friction for horizontal movement
                restitution: 0.0, // No bounciness for player
                inertia: Infinity, // Prevent rotation from impacts (player should remain upright)
                collisionFilter: {
                    category: 0x0002, // Custom collision category for the player
                    mask: 0xFFFFFFFF // Collides with all other categories by default
                }
            }
        );

        if (!body) {
            throw new Error('Failed to create player body.');
        }

        Matter.Body.setVelocity(body, { x: 0, y: 0 }); // Ensure initial velocity is zero
        Matter.Body.setAngularVelocity(body, 0); // Ensure no initial angular velocity
        Matter.World.add(world, [body]); // Add the created body to the physics world
        return body;
    } catch (error) {
        console.error('Error creating player:', error);
        return null;
    }
};

/**
 * Creates static floor and wall boundaries for the game world.
 * @param world - The Matter.js world instance.
 * @returns An object containing the created Matter.Body instances for floor and walls, or null if creation fails.
 */
const createFloor = (world: Matter.World) => {
    try {
        // Floor body (extends beyond map width to cover camera movement)
        const floor = Matter.Bodies.rectangle(
            MAP_WIDTH / 2,
            MAP_HEIGHT + 20, // Positioned slightly below map bottom
            MAP_WIDTH * 2, // Wider than map for robust collision
            40, // Thickness of the floor
            {
                isStatic: true, // Immovable body
                label: 'floor',
                collisionFilter: {
                    category: 0x0001, // Custom collision category for static environment
                    mask: 0xFFFFFFFF
                }
            }
        );

        // Left wall body
        const leftWall = Matter.Bodies.rectangle(
            -20, // Positioned left of map boundary
            MAP_HEIGHT / 2,
            40, // Thickness
            MAP_HEIGHT, // Height of the map
            {
                isStatic: true,
                label: 'wall',
                collisionFilter: {
                    category: 0x0001,
                    mask: 0xFFFFFFFF
                }
            }
        );

        // Right wall body
        const rightWall = Matter.Bodies.rectangle(
            MAP_WIDTH + 20, // Positioned right of map boundary
            MAP_HEIGHT / 2,
            40, // Thickness
            MAP_HEIGHT, // Height of the map
            {
                isStatic: true,
                label: 'wall',
                collisionFilter: {
                    category: 0x0001,
                    mask: 0xFFFFFFFF
                }
            }
        );

        if (!floor || !leftWall || !rightWall) {
            throw new Error('Failed to create floor or walls.');
        }

        // Add all static bodies to the physics world
        Matter.World.add(world, [floor, leftWall, rightWall]);
        return { floor, leftWall, rightWall };
    } catch (error) {
        console.error('Error creating floor and walls:', error);
        return null;
    }
};

/**
 * Renderer component for React Native Game Engine.
 * Responsible for displaying the game world based on the entities.
 * @param { entities } - The current game entities state.
 */
const Renderer = ({ entities }: { entities: GameEntities | null }) => {
    // This check should now ideally not be hit if GameEngine is conditionally rendered.
    // However, it remains a good safety net for partial entity initialization.
    if (!entities || !entities.camera || !entities.player?.body || !entities.physics?.world) {
        return (
            <View style={styles.gameContainer}>
                <Text style={{ color: 'white', textAlign: 'center' }}>Loading game world...</Text>
            </View>
        );
    }

    // Extract camera and player body for rendering
    const cameraX = entities.camera.x;
    const cameraY = entities.camera.y;
    const playerBody = entities.player.body;

    return (
        <View style={styles.gameContainer}>
            {/* The main map container, translated by the camera's inverse position to simulate camera movement */}
            <View
                style={[
                    styles.mapContainer,
                    {
                        transform: [
                            { translateX: cameraX },
                            { translateY: cameraY }
                        ]
                    }
                ]}
            >
                {/* Render the static dungeon map */}
                <ShadowfellCryptMap />

                {/* Render the Warrior character, positioned relative to the map's coordinate system */}
                <Warrior
                    x={playerBody.position.x - WARRIOR_SIZE / 2} // Center warrior visual on its physics body
                    y={playerBody.position.y - WARRIOR_SIZE / 2}
                    width={WARRIOR_SIZE}
                    height={WARRIOR_SIZE}
                    direction={entities.controls.left ? 'left' : 'right'} // Pass direction for animation/sprite flipping
                />

                {/* Debug Overlay: Renders outlines of Matter.js physics bodies in development mode */}
                {__DEV__ && entities.physics.world && (
                    <Svg style={styles.debugOverlay}>
                        {Matter.Composite.allBodies(entities.physics.world).map((body, index) => {
                            // Only render rectangular bodies (skip circles or other shapes for simplicity)
                            if (!body || body.circleRadius) return null;

                            // Calculate position and dimensions for the SVG Rect
                            const { position, bounds } = body;
                            const width = bounds.max.x - bounds.min.x;
                            const height = bounds.max.y - bounds.min.y;
                            const x = position.x - width / 2;
                            const y = position.y - height / 2;

                            return (
                                <Rect
                                    key={`body-${index}`}
                                    x={x}
                                    y={y}
                                    width={width}
                                    height={height}
                                    fill="rgba(255, 0, 0, 0.2)" // Semi-transparent red fill
                                    stroke="red" // Red border
                                    strokeWidth={1}
                                />
                            );
                        })}
                    </Svg>
                )}
            </View>

            {/* Controls overlay: Fixed position on the screen, not affected by camera */}
            <View style={styles.controlsOverlay} pointerEvents="box-none">
                <View style={styles.dpadContainer}>
                    {/* Left movement button */}
                    <TouchableOpacity
                        style={styles.dpadButton}
                        onPressIn={() => {
                            // Directly modify entities.controls. Physics system reads it each frame.
                            // No need to trigger a re-render for this specific control state change.
                            if (entities) entities.controls.left = true;
                        }}
                        onPressOut={() => {
                            if (entities) entities.controls.left = false;
                        }}
                    >
                        <Ionicons name="arrow-back" size={32} color="white" />
                    </TouchableOpacity>

                    {/* Jump button */}
                    <TouchableOpacity
                        style={[styles.dpadButton, styles.jumpButton]}
                        onPress={() => {
                            if (entities && entities.player.body) {
                                const player = entities.player.body;
                                // Allow jump only if player is effectively on the ground (low vertical velocity)
                                if (Math.abs(player.velocity.y) < 0.1) {
                                    Matter.Body.setVelocity(player, {
                                        x: player.velocity.x,
                                        y: JUMP_FORCE
                                    });
                                }
                            }
                        }}
                    >
                        <Ionicons name="arrow-up" size={32} color="white" />
                    </TouchableOpacity>

                    {/* Right movement button */}
                    <TouchableOpacity
                        style={styles.dpadButton}
                        onPressIn={() => {
                            if (entities) entities.controls.right = true;
                        }}
                        onPressOut={() => {
                            if (entities) entities.controls.right = false;
                        }}
                    >
                        <Ionicons name="arrow-forward" size={32} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

/**
 * Inner component responsible for game logic, state management, and rendering.
 * This component is wrapped by `GameProvider`.
 */
const ActiveDungeonInner: React.FC = () => {
    const navigation = useNavigation<any>();
    // Hooks for step tracking and game context
    const { steps, distance, pace, stopTracking, startTracking } = useStepTracker();
    const { state, dispatch } = useGame();

    // State to manage game activity (running/paused)
    const [isActive, setIsActive] = useState(true);

    // `gameEntities` is the source of truth for game initialization.
    // It will be null until the game engine and world are fully set up.
    const [gameEntities, setGameEntities] = useState<GameEntities | null>(null);
    
    // Key to control GameEngine mount/unmount lifecycle
    const [gameEngineKey, setGameEngineKey] = useState<number | null>(null);

    // Ref to ensure game initialization runs only once per component mount cycle
    const initializationAttempted = useRef(false);
    
    // Ref to track if we're in the process of exiting
    const isExitingRef = useRef(false);

    // Effect to initialize the game engine key on mount
    useEffect(() => {
        if (gameEngineKey === null && !isExitingRef.current) {
            console.log('Initializing game engine key...');
            setGameEngineKey(0); // Initialize with key 0 to trigger the main effect
        }
        
        return () => {
            console.log('Game engine key effect cleanup');
        };
    }, [gameEngineKey]);

    /**
     * Effect for initializing and cleaning up the Matter.js game engine and entities.
     * Runs when gameEngineKey changes.
     */
    useEffect(() => {
        // Only initialize if gameEngineKey is not null and initialization hasn't been attempted for this key
        if (gameEngineKey === null || initializationAttempted.current) {
            console.log('ActiveDungeonInner: Skipping initialization (already attempted or key is null)');
            return;
        }
        
        initializationAttempted.current = true; // Mark as attempted for current key

        const initializeGame = async () => {
            try {
                console.log('ActiveDungeonInner: Initializing game engine and world...');

                // 1. Create Matter.js Engine instance
                const newEngine = Matter.Engine.create({
                    gravity: { x: 0, y: GRAVITY },
                    enableSleeping: false
                });
                const newWorld = newEngine.world;

                // 2. Create the player's physics body
                const newPlayerBody = createPlayer(newWorld, {
                    x: MAP_WIDTH / 2,
                    y: MAP_HEIGHT / 2
                });
                if (!newPlayerBody) {
                    throw new Error('Failed to create player body.');
                }

                // 3. Create the static floor and wall boundaries
                const floorAndWalls = createFloor(newWorld);
                if (!floorAndWalls) {
                    throw new Error('Failed to create floor and walls.');
                }

                // 4. Construct the initial gameEntities object
                const initializedGameEntities: GameEntities = {
                    physics: {
                        engine: newEngine,
                        world: newWorld
                    },
                    player: {
                        body: newPlayerBody,
                    },
                    camera: {
                        x: 0, y: 0
                    },
                    controls: {
                        left: false, right: false
                    },
                };

                // Update the state with the initialized entities
                setGameEntities(initializedGameEntities);
                console.log('ActiveDungeonInner: Game initialization complete.');

            } catch (error) {
                console.error('ActiveDungeonInner: Error during game initialization:', error);
            }
        };

        initializeGame();

        // Cleanup function for this useEffect
        return () => {
            if (isExitingRef.current) return; // Skip cleanup if we're already exiting
            
            console.log('ActiveDungeonInner: Cleaning up game engine...');
            
            // Store a local reference to gameEntities to avoid closure issues
            const currentGameEntities = gameEntities;
            
            if (currentGameEntities?.physics.engine) {
                try {
                    console.log('Clearing Matter.js engine...');
                    Matter.Engine.clear(currentGameEntities.physics.engine);
                    console.log('ActiveDungeonInner: Matter.js engine cleared.');
                } catch (error) {
                    console.error('Error during engine cleanup:', error);
                }
            }
            
            // Don't setGameEntities here as it can cause re-renders during cleanup
            initializationAttempted.current = false;
        };
    }, [gameEngineKey]); // Re-run when gameEngineKey changes

    /**
     * Effect to manage game pause/resume and step tracking based on `isActive` state.
     * This now explicitly checks for `gameEntities` to be present before proceeding.
     */
    useEffect(() => {
        // Only proceed if game entities are fully initialized
        if (!gameEntities) {
            console.log('ActiveDungeonInner: Game entities not ready for activity management.');
            return;
        }

        if (isActive) {
            startTracking(); // Start step tracking
            dispatch({ type: 'RESUME' }); // Update game context
        } else {
            stopTracking(); // Stop step tracking
            dispatch({ type: 'PAUSE' }); // Update game context
        }

        // Cleanup function for this effect
        return () => {
            if (isActive) {
                stopTracking(); // Ensure tracking is stopped if `isActive` was true
            }
        };
    }, [isActive, gameEntities, dispatch, startTracking, stopTracking]); // Dependencies for this effect

    /**
     * Effect to trigger game events based on accumulated steps.
     * This also explicitly checks for `gameEntities` to be present.
     */
    useEffect(() => {
        // Only trigger events if game is initialized, active, and in 'walking' mode
        if (!gameEntities || !isActive || state.mode !== 'walking') {
            return;
        }

        // Trigger an encounter every 10 steps
        if (steps > 0 && steps % 10 === 0) {
            console.log(`Triggering encounter at ${steps} steps.`);
            dispatch({ type: 'ENCOUNTER' });
        }
        // Trigger a boss encounter every 50 steps
        if (steps > 0 && steps % 50 === 0) {
            console.log(`Triggering boss encounter at ${steps} steps.`);
            dispatch({ type: 'BOSS_DEFEATED' }); // Or a more specific boss event
        }
        // Update game depth in context based on steps
        dispatch({ type: 'STEP', payload: { steps } });
    }, [steps, isActive, gameEntities, state.mode, dispatch]); // Dependencies for this effect

    // Conditional rendering: Show loading screen until game engine and entities are fully initialized
    if (!gameEntities || gameEngineKey === null) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Initializing game...</Text>
            </View>
        );
    }

    // Main game render: Display GameEngine and HUD
    return (
        <View style={styles.container}>
            {/* Game Area: Contains the GameEngine for rendering physics and game objects */}
            <View style={styles.gameContainer}>
                {/* Conditionally render GameEngine ONLY when gameEntities is not null and gameEngineKey is set */}
                {gameEntities && gameEngineKey !== null && (
                    <GameEngine
                        key={gameEngineKey} // Use the key to force remount when it changes
                        systems={[Physics]}
                        entities={gameEntities}
                        renderer={Renderer}
                        running={isActive}
                    />
                )}
            </View>

            {/* HUD (Heads-Up Display): Overlays game content for stats and controls */}
            <View style={styles.hud} pointerEvents="box-none">
                <View style={styles.hudTop}>
                    {/* Exit Button */}
                    <TouchableOpacity
                        style={styles.exitButton}
                        onPress={async () => {
                            console.log('Exit button pressed: Starting cleanup sequence...');
                            isExitingRef.current = true; // Mark that we're exiting
                            
                            try {
                                // 1. Pause the game loop immediately
                                console.log('Pausing game loop...');
                                setIsActive(false);
                                
                                // 2. Clear game entities first to prevent any updates
                                console.log('Clearing game entities...');
                                setGameEntities(null);
                                
                                // 3. Force unmount GameEngine by changing its key
                                console.log('Triggering GameEngine unmount...');
                                setGameEngineKey(null);
                                
                                // 4. Add a delay to ensure all cleanup completes
                                await new Promise(resolve => setTimeout(resolve, 100));
                                
                                // 5. Clear any remaining timers or intervals
                                console.log('Performing final cleanup...');
                                
                                // 6. Navigate after ensuring everything is cleaned up
                                console.log('Cleanup complete, navigating away...');
                                navigation.navigate('Main', { screen: 'Dungeon' });
                                
                            } catch (error) {
                                console.error('Error during cleanup:', error);
                                // Still navigate even if there was an error
                                navigation.navigate('Main', { screen: 'Dungeon' });
                            }
                        }}
                    >
                        <Ionicons name="exit-outline" size={24} color="white" />
                        <Text style={styles.exitButtonText}>Exit</Text>
                    </TouchableOpacity>

                    {/* Game Stats Display */}
                    <View style={styles.statsContainer}>
                        <Text style={styles.stat}>Depth: {state?.depth || 0}</Text>
                        <Text style={styles.stat}>Steps: {steps}</Text>
                        <Text style={styles.stat}>Pace: {pace} spm</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

/**
 * The main `ActiveDungeonScreen` component.
 * Wraps the `ActiveDungeonInner` with `GameProvider` to ensure context is available.
 */
const ActiveDungeonScreen: React.FC = () => {
    // State to control when the `GameProvider` (and thus `ActiveDungeonInner`) is rendered.
    // A small delay helps ensure all context and native modules are fully ready.
    const [isGameProviderReady, setIsGameProviderReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsGameProviderReady(true);
        }, 100); // Small delay before rendering the game

        return () => clearTimeout(timer); // Cleanup the timer
    }, []);

    // Show a "Preparing game..." loading message during the initial delay
    if (!isGameProviderReady) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Preparing game...</Text>
            </View>
        );
    }

    // Render `ActiveDungeonInner` wrapped in `GameProvider` once ready.
    return (
        <GameProvider>
            <ActiveDungeonInner />
        </GameProvider>
    );
};

// StyleSheet for the component's visual presentation
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        overflow: 'hidden', // Ensures content doesn't spill out
    },
    gameContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    mapContainer: {
        position: 'absolute',
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        // Transformations for camera movement are applied directly via style prop in Renderer
    },
    debugOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
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
        fontWeight: 'bold',
    },
    hud: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        padding: 20,
    },
    hudTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statsContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 10,
        borderRadius: 10,
        alignItems: 'flex-end',
    },
    controlsOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 50,
        padding: 20,
        zIndex: 100,
        alignItems: 'center', // Center the dpad horizontally
    },
    dpadContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background for controls
        borderRadius: 40,
        padding: 10,
    },
    dpadButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    jumpButton: {
        marginBottom: -40, // Adjust position for jump button relative to others
    },
    exitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10,
        borderRadius: 20,
        zIndex: 100,
    },
    exitButtonText: {
        color: 'white',
        marginLeft: 4,
        fontSize: 16,
    },
    stat: {
        color: 'white',
        fontSize: 14,
        marginBottom: 4,
    },
});

export default ActiveDungeonScreen;
