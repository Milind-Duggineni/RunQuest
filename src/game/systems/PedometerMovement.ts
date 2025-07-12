import Matter from 'matter-js';
import { GameEntities, GameEvent } from '../types/game';

// Define the context type for the system
interface PedometerMovementContext {
  dispatch: (event: GameEvent) => void;
  events: GameEvent[];
  time: {
    current: number;
    delta: number;
    previousTime: number | null;
  };
}

// --- Configuration for Player Movement ---
const PIXELS_PER_EFFECTIVE_STEP = 4; // Increased for more noticeable movement
const PEDOMETER_STEPS_PER_EFFECTIVE_STEP = 5; // Reduced steps needed for movement
const TILE_SIZE = 32; // Ensure this matches the TILE_SIZE in DungeonGameScreen
const MAX_MOVEMENTS_PER_FRAME = 3; // Limit movements per frame for performance

// Types are now imported from game.ts

const PedometerMovement = (entities: GameEntities, { dispatch, events }: PedometerMovementContext) => {
  // Debug: Log when PedometerMovement is called
  console.log('[PedometerMovement] Tick - Events to process:', events.length);
  
  // Early return if required entities are not available
  if (!entities.player || !entities.pedometer) {
    console.warn('[PedometerMovement] Missing required entities:', {
      player: !!entities.player,
      pedometer: !!entities.pedometer,
      walls: entities.walls ? 'present' : 'missing'
    });
    return entities;
  }
  
  // Initialize pedometer properties if they don't exist
  if (entities.pedometer.accumulatedPedometerSteps === undefined) {
    entities.pedometer.accumulatedPedometerSteps = 0;
  }
  if (entities.pedometer.lastProcessedRealWorldSteps === undefined) {
    entities.pedometer.lastProcessedRealWorldSteps = 0;
  }
  
  // Ensure player has required properties
  const player = entities.player;
  const playerBody = player.body; // Direct reference to player's Matter.js body
  
  // Initialize direction if not set
  if (!player.direction) {
    player.direction = 'down';
  }
  
  // Debug: Log current player state
  console.log('[PedometerMovement] Player state:', {
    position: playerBody.position,
    direction: player.direction,
    accumulatedSteps: entities.pedometer.accumulatedPedometerSteps,
    lastProcessedSteps: entities.pedometer.lastProcessedRealWorldSteps,
    velocity: playerBody.velocity
  });

  // Process incoming events from the GameEngine
  let directionChanged = false;
  
  events.forEach((event: GameEvent) => {
    console.log(`[PedometerMovement] Processing event: ${event.type}`, event);
    
    switch (event.type) {
      case 'REAL_WORLD_STEP_UPDATE':
        if (event.steps !== undefined) {
          const newSteps = event.steps;
          const lastSteps = entities.pedometer.lastProcessedRealWorldSteps;
          
          console.log(`[PedometerMovement] Step update - New: ${newSteps}, Last: ${lastSteps}`);
          
          if (newSteps > lastSteps) {
            const rawStepsTaken = newSteps - lastSteps;
            entities.pedometer.accumulatedPedometerSteps += rawStepsTaken;
            entities.pedometer.lastProcessedRealWorldSteps = newSteps;
            
            console.log(`[PedometerMovement] Steps processed - Raw: ${rawStepsTaken}, ` +
                        `Accumulated: ${entities.pedometer.accumulatedPedometerSteps}`);
          } else if (newSteps < lastSteps) {
            // Reset if step count decreases (pedometer reset)
            entities.pedometer.lastProcessedRealWorldSteps = newSteps;
            console.log(`[PedometerMovement] Step count reset detected. New step count: ${newSteps}`);
          } else {
            console.log(`[PedometerMovement] No new steps. Current: ${newSteps}, Last: ${lastSteps}`);
          }
        } else {
          console.warn('[PedometerMovement] REAL_WORLD_STEP_UPDATE event missing steps property');
        }
        break;
      
      case 'CHANGE_DIRECTION':
        if (event.direction && player.direction !== event.direction) {
          player.direction = event.direction;
          if (entities.pedometer) {
            entities.pedometer.lastDirectionInput = event.direction;
          }
          directionChanged = true;
          console.log('[PedometerMovement] Player direction changed to:', event.direction);
        }
        break;
    }
  });
  
  // If direction changed, update the player's velocity
  if (directionChanged) {
    // Reset velocity to prevent sliding
    Matter.Body.setVelocity(playerBody, { x: 0, y: 0 });
  }

  // --- Core Movement Logic (executes in every game loop tick) ---
  // Check if we have enough steps to move and a valid direction
  const currentAccumulatedSteps = entities.pedometer.accumulatedPedometerSteps || 0;
  const currentDirection = player.direction || 'down';
  console.log(`[PedometerMovement] Checking movement - Steps: ${currentAccumulatedSteps}/${PEDOMETER_STEPS_PER_EFFECTIVE_STEP}, Direction: ${currentDirection}`);
  
  // Process all pending movements based on accumulated steps
  let stepsToProcess = Math.floor(currentAccumulatedSteps / PEDOMETER_STEPS_PER_EFFECTIVE_STEP);
  
  if (stepsToProcess > 0) {
    // Limit the number of movements per frame for performance
    stepsToProcess = Math.min(stepsToProcess, MAX_MOVEMENTS_PER_FRAME);
    
    // Calculate how many steps we'll actually process
    const stepsProcessed = stepsToProcess * PEDOMETER_STEPS_PER_EFFECTIVE_STEP;
    entities.pedometer.accumulatedPedometerSteps = Math.max(0, currentAccumulatedSteps - stepsProcessed);
    
    console.log(`[PedometerMovement] Processing ${stepsToProcess} movements (${stepsProcessed} steps)`);
    
    const moveAmount = PIXELS_PER_EFFECTIVE_STEP;
    const direction = player.direction || 'down';
    
    for (let i = 0; i < stepsToProcess; i++) {
      // Calculate new position based on current direction
      const currentPos = playerBody.position;
      let newX = currentPos.x;
      let newY = currentPos.y;
      
      switch (direction) {
        case 'up':
          newY -= moveAmount;
          break;
        case 'down':
          newY += moveAmount;
          break;
        case 'left':
          newX -= moveAmount;
          break;
        case 'right':
          newX += moveAmount;
          break;
      }
      
      // Check for wall collisions if walls exist
      let canMove = true;
      if (entities.walls && entities.walls.length > 0) {
        const wallBodies = entities.walls.map(wall => wall.body);
        const nextPosition = { x: newX, y: newY };
        
        // Create a temporary body at the new position to check for collisions
        const tempBody = Matter.Bodies.circle(newX, newY, playerBody.circleRadius || TILE_SIZE / 2, {
          isSensor: true
        });
        
        const collisions = Matter.Query.collides(tempBody, wallBodies);
        canMove = collisions.length === 0;
      }
      
      // Update position if movement is allowed
      if (canMove) {
        Matter.Body.setPosition(playerBody, { x: newX, y: newY });
        
        // Update velocity for smooth movement
        const velocityScale = 0.8; // Higher for more responsive movement
        Matter.Body.setVelocity(playerBody, {
          x: (newX - currentPos.x) * velocityScale,
          y: (newY - currentPos.y) * velocityScale
        });
        
        console.log(`[PedometerMovement] Player moved ${direction} to: (${Math.round(newX)}, ${Math.round(newY)})`);
      } else {
        console.warn('[PedometerMovement] Movement blocked by wall');
        break; // Stop processing movements if we hit a wall
      }
    }
  }

  // It's crucial to always return the entities object after processing.
  // This allows the GameEngine to update the state for the next frame.
  return entities;
};

export default PedometerMovement;
