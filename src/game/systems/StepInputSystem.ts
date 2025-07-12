import { System } from '../ecs/System';
import { StepInputComponent, VelocityComponent } from '../ecs/Component';
import { Entity } from '../ecs/Entity';

export class StepInputSystem extends System {
  public componentsRequired = new Set([StepInputComponent, VelocityComponent]);
  
  // Configuration
  private stepsPerSecondThreshold = 1.5; // Minimum steps per second to consider it walking
  private baseSpeed = 100; // Pixels per second
  
  updateEntity(entity: Entity, deltaTime: number): void {
    const stepInput = entity.getComponent(StepInputComponent);
    const velocity = entity.getComponent(VelocityComponent);
    
    if (!stepInput || !velocity) return;
    
    const currentTime = Date.now();
    const timeSinceLastStep = (currentTime - stepInput.lastStepTime) / 1000; // Convert to seconds
    
    // Calculate steps per second based on the last step
    const stepsPerSecond = 1 / timeSinceLastStep;
    
    // Only move if steps are frequent enough
    if (stepsPerSecond >= this.stepsPerSecondThreshold) {
      // Calculate speed based on step rate (faster steps = faster movement)
      const speedScale = Math.min(2, stepsPerSecond / this.stepsPerSecondThreshold);
      const speed = this.baseSpeed * speedScale;
      
      // Update velocity (you might want to adjust direction based on game logic)
      velocity.vx = speed;
      velocity.vy = 0; // For now, only move right
    } else {
      // Stop moving if steps are too slow
      velocity.vx = 0;
      velocity.vy = 0;
    }
  }
  
  // Call this method when a step is detected from the pedometer
  public onStepDetected(entityId: string): void {
    const entity = this.ecsWorld?.getEntity(entityId);
    if (!entity) return;
    
    const stepInput = entity.getComponent(StepInputComponent);
    if (!stepInput) return;
    
    // Update step count and timestamp
    stepInput.stepCount += 1;
    stepInput.lastStepTime = Date.now();
  }
}
