import { System } from '../ecs/System';
import { PositionComponent } from '../ecs/Component';
import { VelocityComponent } from '../ecs/Component';
import { Entity } from '../ecs/Entity';
import { MovementEvent } from '../../hooks/usePlayerMovement';

export class MovementSystem extends System {
  public componentsRequired = new Set([PositionComponent, VelocityComponent]);
  private lastPosition: { x: number; y: number } | null = null;
  private lastUpdateTime: number = 0;
  private movementUnsubscribe: (() => void) | null = null;

  constructor() {
    super();
    this.setupMovementTracking();
  }

  private setupMovementTracking() {
    // This would be called from a React component in practice
    // For ECS, we'll need to handle the hook differently
    // This is a simplified example - in a real app, you'd want to
    // connect this to your React component tree
  }

  updateEntity(entity: Entity, deltaTime: number): void {
    const position = entity.getComponent(PositionComponent);
    const velocity = entity.getComponent(VelocityComponent);

    if (!position || !velocity) return;

    // Store the last position for distance calculations
    const currentTime = Date.now();
    
    // Only update position if we have a valid last position and time delta
    if (this.lastPosition && this.lastUpdateTime > 0) {
      const timeDelta = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
      if (timeDelta > 0) {
        // Calculate new position based on velocity
        position.x += velocity.vx * timeDelta;
        position.y += velocity.vy * timeDelta;
      }
    }

    this.lastPosition = { x: position.x, y: position.y };
    this.lastUpdateTime = currentTime;
  }

  // This would be called from a React component to handle movement events
  handleMovementEvent(event: MovementEvent) {
    const position = this.entities.values().next().value?.getComponent(PositionComponent);
    if (!position) return;

    switch (event.type) {
      case 'move':
        // Update velocity based on movement
        if (event.pace && event.position) {
          // Calculate direction vector based on position change
          // This is a simplified example - you'd want to convert
          // GPS coordinates to your game's coordinate system
          const velocity = this.entities.values().next().value?.getComponent(VelocityComponent);
          if (velocity) {
            // In a real implementation, you'd want to convert GPS movement
            // to your game's coordinate system here
            velocity.vx = event.pace * 0.1; // Scale as needed
            velocity.vy = event.pace * 0.1;
          }
        }
        break;
      
      case 'encounter':
        // Handle random encounters based on movement
        // You can implement encounter logic here
        break;
        
      case 'idle':
        // Stop movement when player is idle
        const velocity = this.entities.values().next().value?.getComponent(VelocityComponent);
        if (velocity) {
          velocity.vx = 0;
          velocity.vy = 0;
        }
        break;
    }
  }

  // Override the update method to handle cleanup
  update(deltaTime: number): void {
    super.update(deltaTime);
    // Add any per-frame update logic here
  }

  // Add a method to clean up resources
  cleanup() {
    if (this.movementUnsubscribe) {
      this.movementUnsubscribe();
      this.movementUnsubscribe = null;
    }
  }
}
