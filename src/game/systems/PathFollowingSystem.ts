import Matter from 'matter-js';
import { GameEntities, GameEvent } from '../types/game';

export interface PathPoint {
  x: number;
  y: number;
  type?: string; // 'start' | 'checkpoint' | 'encounter' | 'treasure' | 'trap'
  metadata?: any;
}

const PathFollowingSystem = (entities: GameEntities, { time, dispatch }: { time: { delta: number }, dispatch: (event: GameEvent) => void }) => {
  const { player, physics } = entities;
  
  if (!player || !physics) return entities;
  
  const { engine } = physics;
  const { path, currentPathIndex, pathProgress } = player;
  
  // If no path is defined, don't do anything
  if (!path || path.length === 0) return entities;
  
  // Get the current target point on the path
  const targetPoint = path[Math.min(currentPathIndex || 0, path.length - 1)];
  
  // Calculate direction to target
  const dx = targetPoint.x - player.body.position.x;
  const dy = targetPoint.y - player.body.position.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // If we're close enough to the current target point, move to the next one
  if (distance < 5 && currentPathIndex < path.length - 1) {
    player.currentPathIndex = (currentPathIndex || 0) + 1;
    
    // Handle special point types
    if (targetPoint.type) {
      dispatch({
        type: `path-${targetPoint.type}`,
        point: targetPoint,
        progress: (currentPathIndex || 0) / path.length
      });
    }
  }
  
  // Only move if we have progress to make
  if (pathProgress && pathProgress > 0) {
    // Calculate movement speed based on progress
    const speed = 100 * (pathProgress / 100); // pixels per second
    const velocity = {
      x: (dx / distance) * speed * (time.delta / 1000),
      y: (dy / distance) * speed * (time.delta / 1000)
    };
    
    // Apply velocity to the player's body
    Matter.Body.setVelocity(player.body, velocity);
    
    // Reset progress after using it
    player.pathProgress = 0;
  } else {
    // Stop the player if there's no progress
    Matter.Body.setVelocity(player.body, { x: 0, y: 0 });
  }
  
  return entities;
};

export default PathFollowingSystem;
