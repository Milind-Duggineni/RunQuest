import Matter from 'matter-js';
import { PlayerEntity, EnemyEntity, TreasureEntity, TrapEntity, CheckpointEntity, GameEntity, PathPoint } from '../types/game';

class GameObjectFactory {
  private static idCounter = 0;
  
  private static getNextId(prefix: string = 'obj'): string {
    return `${prefix}_${GameObjectFactory.idCounter++}`;
  }
  
  static createPlayer(x: number, y: number, width: number, height: number): PlayerEntity {
    const body = Matter.Bodies.rectangle(x, y, width, height, {
      label: 'player',
      friction: 0,
      restitution: 0,
      inertia: Infinity,
      inverseInertia: 0,
      mass: 1,
      inverseMass: 1,
      frictionAir: 0.1,
      frictionStatic: 0.5,
      slop: 0,
      timeScale: 1,
      render: {
        fillStyle: '#3498db',
        strokeStyle: '#1a5276',
        lineWidth: 1,
        visible: false // We'll use a sprite instead
      }
    });
    
    return {
      type: 'player',
      body,
      position: { x, y },
      size: { width, height },
      currentPathIndex: 0,
      pathProgress: 0,
      health: 100,
      maxHealth: 100,
      speed: 100,
      direction: 'right',
      frame: 0,
      frameCount: 4,
      velocity: { x: 0, y: 0 },
      isMoving: false
    };
  }
  
  static createEnemy(x: number, y: number, width: number, height: number, options: Partial<EnemyEntity> = {}): EnemyEntity {
    const body = Matter.Bodies.rectangle(x, y, width, height, {
      label: 'enemy',
      isSensor: true,
      render: {
        fillStyle: '#e74c3c',
        strokeStyle: '#c0392b',
        lineWidth: 1,
        visible: false // We'll use a sprite instead
      },
      ...options
    });
    
    return {
      type: 'enemy',
      body,
      position: { x, y },
      size: { width, height },
      health: options.health || 50,
      damage: options.damage || 10,
      speed: options.speed || 50,
      attackRange: options.attackRange || 100,
      attackCooldown: options.attackCooldown || 1000,
      lastAttackTime: 0,
      ...options
    };
  }
  
  static createTreasure(x: number, y: number, width: number, height: number, options: Partial<TreasureEntity> = {}): TreasureEntity {
    const body = Matter.Bodies.rectangle(x, y, width, height, {
      label: 'treasure',
      isSensor: true,
      isStatic: true,
      render: {
        fillStyle: '#f1c40f',
        strokeStyle: '#f39c12',
        lineWidth: 1,
        visible: false // We'll use a sprite instead
      }
    });
    
    return {
      type: 'treasure',
      body,
      position: { x, y },
      size: { width, height },
      value: options.value || 10,
      itemType: options.itemType || 'gold',
      ...options
    };
  }
  
  static createTrap(x: number, y: number, width: number, height: number, options: Partial<TrapEntity> = {}): TrapEntity {
    const body = Matter.Bodies.rectangle(x, y, width, height, {
      label: 'trap',
      isSensor: true,
      isStatic: true,
      render: {
        fillStyle: '#9b59b6',
        strokeStyle: '#8e44ad',
        lineWidth: 1,
        visible: false // We'll use a sprite instead
      }
    });
    
    return {
      type: 'trap',
      body,
      position: { x, y },
      size: { width, height },
      damage: options.damage || 20,
      isActive: true,
      cooldown: options.cooldown || 5000,
      lastTriggerTime: 0,
      ...options
    };
  }
  
  static createCheckpoint(x: number, y: number, width: number, height: number, checkpointId: string): CheckpointEntity {
    const body = Matter.Bodies.rectangle(x, y, width, height, {
      label: 'checkpoint',
      isSensor: true,
      isStatic: true,
      render: {
        fillStyle: '#2ecc71',
        strokeStyle: '#27ae60',
        lineWidth: 1,
        visible: false // We'll use a sprite instead
      }
    });
    
    return {
      type: 'checkpoint',
      body,
      position: { x, y },
      size: { width, height },
      checkpointId,
      isActive: true
    };
  }
  
  static createWall(x: number, y: number, width: number, height: number, options: Matter.IChamferableBodyDefinition = {}): GameEntity {
    const body = Matter.Bodies.rectangle(x, y, width, height, {
      isStatic: true,
      label: 'wall',
      render: {
        fillStyle: '#7f8c8d',
        strokeStyle: '#2c3e50',
        lineWidth: 1,
        visible: false // We'll use tilemap rendering for walls
      },
      ...options
    });
    
    return {
      type: 'wall',
      body,
      position: { x, y },
      size: { width, height }
    };
  }
  
  static createPathPoint(x: number, y: number, type?: string, metadata?: any): PathPoint {
    return {
      x,
      y,
      type: type as any,
      metadata
    };
  }
}

export default GameObjectFactory;
