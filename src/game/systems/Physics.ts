import Matter from 'matter-js';
import { GameEntities, GameEngineContext, GameEvent } from '../types/game';

const Physics = (entities: GameEntities, { time, events, dispatch }: GameEngineContext) => {
  const { engine, world } = entities.physics;
  
  // Ensure player has required properties
  if (entities.player && !entities.player.velocity) {
    entities.player.velocity = { x: 0, y: 0 };
  }
  
  // Process any physics-related events
  if (events && events.length) {
    events.forEach((event: GameEvent) => {
      if (event.type === 'apply-force' && event.entity && event.force) {
        const entity = entities[event.entity as keyof GameEntities] as any;
        if (entity?.body) {
          Matter.Body.applyForce(
            entity.body,
            entity.body.position,
            event.force
          );
        }
      }
    });
  }
  
  // Update the physics engine
  Matter.Engine.update(engine, time.delta);
  
  return entities;
};

export default Physics;
