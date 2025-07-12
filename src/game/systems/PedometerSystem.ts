import { Pedometer } from 'expo-sensors';
import { GameEntities, GameEvent } from '../types/game';

export interface PedometerData {
  steps: number;
  distance: number; // in meters
  lastStepTime: number;
}

class PedometerSystem {
  private subscription: any = null;
  private lastStepCount: number = 0;
  private stepsPerMeter: number = 1.43; // Average steps per meter (adjust based on user's stride)
  
  async startTracking(entities: GameEntities, dispatch: (event: GameEvent) => void): Promise<boolean> {
    // Check if pedometer is available
    const isAvailable = await Pedometer.isAvailableAsync();
    
    if (!isAvailable) {
      console.warn('Pedometer is not available on this device');
      return false;
    }
    
    // Reset step count
    this.lastStepCount = 0;
    
    // Start pedometer updates
    this.subscription = Pedometer.watchStepCount(
      async (result) => {
        try {
          // Calculate new steps since last update
          const newSteps = result.steps - this.lastStepCount;
          
          if (newSteps > 0) {
            // Calculate distance in meters
            const distanceMeters = newSteps / this.stepsPerMeter;
            
            // Update player progress
            if (entities.player) {
              // Convert meters to game progress (adjust scaling factor as needed)
              const progressPerMeter = 10; // 1 meter = 10% progress
              const progress = distanceMeters * progressPerMeter;
              
              // Update player progress (capped at 100%)
              entities.player.pathProgress = Math.min(
                (entities.player.pathProgress || 0) + progress,
                100
              );
              
              // Dispatch progress update event
              dispatch({
                type: 'progress-update',
                steps: newSteps,
                distance: distanceMeters,
                progress: entities.player.pathProgress
              });
            }
            
            // Update last step count
            this.lastStepCount = result.steps;
          }
        } catch (error) {
          console.error('Error processing pedometer data:', error);
        }
      },
      (error) => {
        console.error('Pedometer error:', error);
        dispatch({ type: 'pedometer-error', error });
      }
    );
    
    return true;
  }
  
  stopTracking() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
  
  // Update the steps per meter value (for stride length calibration)
  setStepsPerMeter(stepsPerMeter: number) {
    this.stepsPerMeter = stepsPerMeter;
  }
}

export const pedometerSystem = new PedometerSystem();

export default pedometerSystem;
