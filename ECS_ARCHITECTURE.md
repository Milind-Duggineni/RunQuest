# ECS Architecture for RunQuest

This document outlines the Entity-Component-System (ECS) architecture implemented in the RunQuest game.

## Overview

The ECS architecture is a design pattern that separates data (components) from behavior (systems) and uses entities as containers for components. This approach provides several benefits:

- **Decoupling**: Game logic is separated from rendering and input handling
- **Performance**: Efficient processing of game entities
- **Flexibility**: Easy to add new features by creating new components and systems
- **Maintainability**: Clear separation of concerns makes the codebase easier to understand and modify

## Core Components

### Entity
- A simple container for components with a unique ID
- Can have zero or more components attached
- Can be tagged for easy querying

### Component
- Pure data containers with no behavior
- Examples: Position, Velocity, Sprite, Health
- Added to entities to give them specific data properties

### System
- Contains game logic that operates on entities with specific components
- Examples: MovementSystem, RenderSystem, CollisionSystem
- Systems process entities in the game loop

### World
- Manages all entities and systems
- Handles the game loop and updates all systems
- Provides methods to add/remove entities and systems

## Key Systems

### MovementSystem
- Updates entity positions based on their velocity
- Processes entities with both Position and Velocity components

### StepInputSystem
- Handles pedometer input for player movement
- Converts step data into game movement
- Can be extended to support different movement mechanics

### RenderSystem
- Handles rendering of all drawable entities
- Uses Skia for high-performance 2D rendering
- Supports layering and camera controls

## Getting Started

### Creating a New Component

```typescript
import { Component } from './ecs/Component';

export class HealthComponent extends Component {
  constructor(
    entityId: string,
    public current: number,
    public max: number
  ) {
    super(entityId);
  }
}
```

### Creating a New System

```typescript
import { System } from '../ecs/System';
import { HealthComponent } from '../components/HealthComponent';

export class HealthSystem extends System {
  public componentsRequired = new Set([HealthComponent]);

  updateEntity(entity: Entity, deltaTime: number): void {
    const health = entity.getComponent(HealthComponent);
    if (!health) return;

    // Update health logic here
  }
}
```

### Using the ECS in Your Game

```typescript
// Initialize the game
const gameManager = new EcsGameManager({
  canvas: canvasElement,
  width: 800,
  height: 600,
});

// Add a new entity
const enemy = new Entity('enemy');
enemy
  .addComponent(new PositionComponent(enemy.id, 100, 100))
  .addComponent(new VelocityComponent(enemy.id, 50, 0))
  .addComponent(new HealthComponent(enemy.id, 100, 100));

gameManager.getWorld().addEntity(enemy);

// Start the game loop
gameManager.start();
```

## Best Practices

1. **Keep Components Small**: Each component should represent a single aspect of an entity
2. **Systems Should Do One Thing Well**: Each system should have a single responsibility
3. **Use Tags for Querying**: Tag entities for efficient querying
4. **Avoid Direct Component Manipulation**: Use systems to modify component data
5. **Profile Performance**: Monitor performance when adding many entities or complex systems

## Next Steps

- Add more components and systems as needed
- Implement spatial partitioning for better performance with many entities
- Add event system for communication between systems
- Implement save/load functionality for game state
