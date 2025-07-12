import Matter from 'matter-js';
import { GameEngine } from 'react-native-game-engine';
import { GameEntities, GameEvent, GameEventType, PlayerEntity } from './types/game';
import PathFollowingSystem from './systems/PathFollowingSystem';
import CollisionSystem from './systems/CollisionSystem';
import CameraSystem from './systems/CameraSystem';
import { pedometerSystem } from './systems/PedometerSystem';
import GameObjectFactory from './factories/GameObjectFactory';
import { PathPoint } from './types/game';

class GameManager {
  private engine: Matter.Engine;
  private world: Matter.World;
  private gameEngine: GameEngine | null = null;
  private entities: GameEntities;
  private systems: any[] = [];
  private eventHandlers: Map<GameEventType, Array<(event: GameEvent) => void>> = new Map();
  
  constructor() {
    // Initialize physics engine
    this.engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 },
      enableSleeping: false
    });
    
    this.world = this.engine.world;
    
    // Initialize game state
    this.entities = this.createInitialEntities();
    
    // Set up systems
    this.setupSystems();
  }
  
  private createInitialEntities(): GameEntities {
    // Create player
    const player = GameObjectFactory.createPlayer(0, 0, 32, 32);
    
    // Create camera
    const camera = {
      type: 'camera',
      target: player.body,
      position: { x: 0, y: 0 },
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      transform: []
    };
    
    return {
      physics: {
        engine: this.engine,
        world: this.world,
        runner: null
      },
      player,
      camera,
      map: {
        tiles: [],
        widthInTiles: 0,
        heightInTiles: 0,
        tileSize: 32,
        tilesetImage: null,
        tilesetColumns: 0,
        tilesetImageWidth: 0,
        tilesetImageHeight: 0,
        layers: [],
        objectLayers: []
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
        lastDirectionInput: 'right',
        accumulatedPedometerSteps: 0,
        stepsPerMeter: 1.43,
        totalDistance: 0,
        totalSteps: 0
      },
      path: {
        points: [],
        currentIndex: 0,
        isLooping: false
      }
    };
  }
  
  private setupSystems() {
    // Add systems in the order they should be processed
    this.systems = [
      PathFollowingSystem,
      CollisionSystem,
      CameraSystem
    ];
    
    // Set up event handlers
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    // Handle pedometer updates
    this.on('pedometer-update', (event) => {
      // Update player progress based on steps
      if (event.steps && this.entities.player) {
        const distanceMeters = event.steps / this.entities.pedometer.stepsPerMeter;
        const progress = distanceMeters * 10; // 1 meter = 10% progress
        
        // Update player progress
        this.entities.player.pathProgress = Math.min(
          (this.entities.player.pathProgress || 0) + progress,
          100
        );
        
        // Update total distance and steps
        this.entities.pedometer.totalDistance += distanceMeters;
        this.entities.pedometer.totalSteps += event.steps;
        
        // Emit progress update
        this.emit({
          type: 'progress-update',
          steps: event.steps,
          distance: distanceMeters,
          progress: this.entities.player.pathProgress
        });
      }
    });
    
    // Handle checkpoint reached
    this.on('checkpoint-reached', (event) => {
      if (event.checkpointId) {
        this.entities.gameState.lastCheckpoint = event.checkpointId;
        this.emit({
          type: 'show-message',
          message: 'Checkpoint reached!',
          duration: 2000
        });
      }
    });
    
    // Handle treasure collected
    this.on('treasure-found', (event) => {
      if (event.value) {
        this.entities.gameState.score += event.value;
        this.emit({
          type: 'ui-update',
          score: this.entities.gameState.score
        });
      }
    });
    
    // Handle trap triggered
    this.on('trap-triggered', (event) => {
      if (this.entities.player && event.damage) {
        this.entities.player.health = Math.max(0, this.entities.player.health - event.damage);
        
        this.emit({
          type: 'player-damage',
          damage: event.damage,
          health: this.entities.player.health,
          maxHealth: this.entities.player.maxHealth
        });
        
        if (this.entities.player.health <= 0) {
          this.gameOver();
        }
      }
    });
  }
  
  // Public methods
  
  public setGameEngine(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }
  
  public async start() {
    // Start pedometer tracking
    await pedometerSystem.startTracking(this.entities, (event) => {
      this.emit(event);
    });
    
    // Start the game loop
    this.emit({ type: 'game-start' });
  }
  
  public pause() {
    this.entities.gameState.isPaused = true;
    this.emit({ type: 'game-pause' });
  }
  
  public resume() {
    this.entities.gameState.isPaused = false;
    this.emit({ type: 'game-resume' });
  }
  
  public reset() {
    // Reset game state
    this.entities = this.createInitialEntities();
    this.emit({ type: 'game-reset' });
  }
  
  public gameOver() {
    this.entities.gameState.isGameOver = true;
    this.emit({ type: 'game-over' });
  }
  
  public setPath(points: PathPoint[], isLooping: boolean = false) {
    this.entities.path = {
      points,
      currentIndex: 0,
      isLooping
    };
    
    // Set player's initial position to the first point if available
    if (points.length > 0 && this.entities.player) {
      Matter.Body.setPosition(this.entities.player.body, {
        x: points[0].x,
        y: points[0].y
      });
      
      // Update camera target
      if (this.entities.camera) {
        this.entities.camera.target = this.entities.player.body;
      }
    }
  }
  
  // Event handling
  public on(eventType: GameEventType, handler: (event: GameEvent) => void) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)?.push(handler);
  }
  
  public off(eventType: GameEventType, handler: (event: GameEvent) => void) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  public emit(event: GameEvent) {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
    
    // Also emit to game engine if available
    if (this.gameEngine) {
      this.gameEngine.dispatch(event);
    }
  }
  
  // Getters
  public getEntities(): GameEntities {
    return this.entities;
  }
  
  public getSystems() {
    return this.systems;
  }
  
  public getPlayer(): PlayerEntity | null {
    return this.entities.player || null;
  }
  
  // Update method to be called from the game loop
  public update(deltaTime: number) {
    if (this.entities.gameState.isPaused || this.entities.gameState.isGameOver) {
      return;
    }
    
    // Update physics
    Matter.Engine.update(this.engine, deltaTime);
    
    // Update player position based on path following
    if (this.entities.player && this.entities.path.points.length > 0) {
      const { points, currentIndex } = this.entities.path;
      
      if (currentIndex < points.length) {
        const targetPoint = points[currentIndex];
        const dx = targetPoint.x - this.entities.player.body.position.x;
        const dy = targetPoint.y - this.entities.player.body.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Move towards the target point
        if (distance > 5) {
          const speed = (this.entities.player.speed || 100) * (deltaTime / 1000);
          const vx = (dx / distance) * speed;
          const vy = (dy / distance) * speed;
          
          Matter.Body.setVelocity(this.entities.player.body, {
            x: vx,
            y: vy
          });
          
          // Update player direction for animation
          if (Math.abs(vx) > Math.abs(vy)) {
            this.entities.player.direction = vx > 0 ? 'right' : 'left';
          } else if (vy !== 0) {
            this.entities.player.direction = vy > 0 ? 'down' : 'up';
          }
          
          this.entities.player.isMoving = true;
        } else {
          // Reached the current point, move to the next one
          this.entities.path.currentIndex++;
          
          // If looping and we've reached the end, start over
          if (this.entities.path.isLooping && this.entities.path.currentIndex >= points.length) {
            this.entities.path.currentIndex = 0;
          }
          
          // Stop the player if we've reached the end of the path
          if (this.entities.path.currentIndex >= points.length) {
            Matter.Body.setVelocity(this.entities.player.body, { x: 0, y: 0 });
            this.entities.player.isMoving = false;
            this.emit({ type: 'path-complete' });
          }
        }
      }
    }
    
    // Update camera
    if (this.entities.camera && this.entities.player) {
      // Simple camera follow - can be enhanced with smoothing, bounds, etc.
      this.entities.camera.position.x = this.entities.player.body.position.x;
      this.entities.camera.position.y = this.entities.player.body.position.y;
    }
  }
}

// Export a singleton instance
export const gameManager = new GameManager();
export default gameManager;
