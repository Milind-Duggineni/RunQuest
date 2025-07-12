import React from 'react';
import Matter from 'matter-js';

export interface PathPoint {
  x: number;
  y: number;
  type?: 'start' | 'checkpoint' | 'encounter' | 'treasure' | 'trap' | 'boss';
  metadata?: any;
}

export interface GameEntity {
  type: string;
  body: Matter.Body;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  renderer?: React.ReactNode;
  onCollide?: (other: GameEntity) => void;
  _removed?: boolean;
}

export interface PlayerEntity extends GameEntity {
  type: 'player';
  path?: PathPoint[];
  currentPathIndex: number;
  pathProgress: number;
  health: number;
  maxHealth: number;
  speed: number;
  direction: 'up' | 'down' | 'left' | 'right';
  frame: number;
  frameCount: number;
  velocity: { x: number; y: number };
  isMoving: boolean;
}

export interface EnemyEntity extends GameEntity {
  type: 'enemy';
  health: number;
  damage: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
}

export interface TreasureEntity extends GameEntity {
  type: 'treasure';
  value: number;
  itemType: 'gold' | 'health' | 'weapon' | 'key';
}

export interface TrapEntity extends GameEntity {
  type: 'trap';
  damage: number;
  isActive: boolean;
  cooldown: number;
  lastTriggerTime: number;
}

export interface CheckpointEntity extends GameEntity {
  type: 'checkpoint';
  checkpointId: string;
  isActive: boolean;
}

export interface CameraEntity {
  type: 'camera';
  target: Matter.Body | null;
  position: { x: number; y: number };
  zoom: number;
  offsetX: number;
  offsetY: number;
  transform?: any[];
  state?: any;
}

export interface GameEntities {
  // Core physics
  physics: {
    engine: Matter.Engine;
    world: Matter.World;
    runner: Matter.Runner | null;
  };
  
  // Player
  player: PlayerEntity;
  
  // Camera
  camera: CameraEntity;
  
  // Map data
  map: {
    tiles: number[];
    widthInTiles: number;
    heightInTiles: number;
    tileSize: number;
    tilesetImage: any;
    tilesetColumns: number;
    tilesetImageWidth: number;
    tilesetImageHeight: number;
    layers: any[];
    collisionLayer?: any;
    objectLayers: any[];
  };
  
  // Game entities
  walls: Array<{ body: Matter.Body }>;
  enemies: EnemyEntity[];
  treasures: TreasureEntity[];
  traps: TrapEntity[];
  checkpoints: CheckpointEntity[];
  
  // Game state
  gameState: {
    isPaused: boolean;
    isGameOver: boolean;
    score: number;
    currentLevel: number;
    lastCheckpoint?: string;
  };
  
  // Pedometer integration
  pedometer: {
    lastProcessedRealWorldSteps: number;
    lastDirectionInput: 'up' | 'down' | 'left' | 'right';
    accumulatedPedometerSteps: number;
    stepsPerMeter: number;
    totalDistance: number;
    totalSteps: number;
  };
  
  // Path following
  path: {
    points: PathPoint[];
    currentIndex: number;
    isLooping: boolean;
  };
}

export type GameEventType = 
  // Core game events
  | 'game-start'
  | 'game-pause'
  | 'game-resume'
  | 'game-over'
  | 'game-win'
  | 'level-complete'
  | 'level-start'
  
  // Player events
  | 'player-move'
  | 'player-stop'
  | 'player-damage'
  | 'player-heal'
  | 'player-death'
  | 'player-respawn'
  
  // Pedometer events
  | 'pedometer-update'
  | 'pedometer-error'
  | 'steps-updated'
  | 'distance-updated'
  
  // Combat events
  | 'enemy-spawn'
  | 'enemy-damage'
  | 'enemy-death'
  | 'player-attack'
  | 'enemy-attack'
  
  // Item events
  | 'item-collect'
  | 'item-use'
  | 'treasure-found'
  | 'trap-triggered'
  
  // Progress events
  | 'checkpoint-reached'
  | 'path-progress'
  | 'path-complete'
  
  // UI events
  | 'ui-update'
  | 'show-message'
  | 'hide-message'
  
  // Debug events
  | 'debug-info'
  | 'physics-debug'
  
  // Generic events
  | 'CHANGE_DIRECTION'
  | 'UPDATE_STEPS'
  | 'PEDOMETER_UPDATE'
  | 'apply-force'
  
  // Allow for any string type to prevent type errors
  | string;

export interface GameEvent {
  type: GameEventType;
  timestamp?: number;
  
  // Common event properties
  source?: string;
  target?: string;
  
  // Movement events
  direction?: 'up' | 'down' | 'left' | 'right';
  position?: { x: number; y: number };
  velocity?: { x: number; y: number };
  
  // Pedometer events
  steps?: number;
  distance?: number;
  progress?: number;
  
  // Combat events
  damage?: number;
  health?: number;
  maxHealth?: number;
  
  // Item/treasure events
  itemType?: string;
  value?: number;
  
  // Path/Progress events
  checkpointId?: string;
  pathIndex?: number;
  pathPoint?: PathPoint;
  
  // Entity references
  entity?: any;
  player?: any;
  enemy?: any;
  trap?: any;
  treasure?: any;
  checkpoint?: any;
  
  // Generic data
  data?: any;
  force?: { x: number; y: number };
  [key: string]: any; // Allow for additional properties
}

export interface GameEngineContextType {
  time: { delta: number };
  delta: number;
  dispatch: (event: GameEvent) => void;
  events: GameEvent[];
}

export const GameEngineContext = React.createContext<GameEngineContextType | null>(null);
