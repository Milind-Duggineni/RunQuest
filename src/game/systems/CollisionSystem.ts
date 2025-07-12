import Matter from 'matter-js';
import { GameEntities, GameEvent } from '../types/game';

export const CollisionSystem = (entities: GameEntities, { time, dispatch }: { time: { delta: number }, dispatch: (event: GameEvent) => void }) => {
  const { player, physics } = entities;
  
  if (!player || !physics) return entities;
  
  // Check for collisions between the player and other bodies
  Matter.Events.on(physics.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const { bodyA, bodyB } = pair;
      
      // Check if player is involved in the collision
      if (bodyA === player.body || bodyB === player.body) {
        const otherBody = bodyA === player.body ? bodyB : bodyA;
        const otherEntity = Object.values(entities).find(
          (entity: any) => entity.body && entity.body === otherBody
        );
        
        if (otherEntity) {
          // Handle different types of collisions
          switch (otherEntity.type) {
            case 'enemy':
              dispatch({
                type: 'enemy-collision',
                enemy: otherEntity,
                player: player
              });
              break;
              
            case 'treasure':
              dispatch({
                type: 'treasure-collected',
                treasure: otherEntity,
                player: player
              });
              
              // Remove the treasure from the world
              if (physics.world) {
                Matter.World.remove(physics.world, otherBody);
                // Mark entity for removal
                otherEntity._removed = true;
              }
              break;
              
            case 'trap':
              dispatch({
                type: 'trap-triggered',
                trap: otherEntity,
                player: player
              });
              break;
              
            case 'checkpoint':
              dispatch({
                type: 'checkpoint-reached',
                checkpoint: otherEntity,
                player: player
              });
              break;
          }
        }
      }
    }
  });
  
  // Clean up any removed entities
  Object.keys(entities).forEach(key => {
    const entity = (entities as any)[key];
    if (entity && entity._removed) {
      delete (entities as any)[key];
    }
  });
  
  return entities;
};

export default CollisionSystem;
