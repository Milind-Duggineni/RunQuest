import { Pedometer } from 'expo-sensors';

type PedometerResult = {
  steps: number;
};

type Subscription = {
  remove: () => void;
};

// Define the PedometerMock class
class PedometerMock {
  private steps: number = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private subscribers: ((result: PedometerResult) => void)[] = [];
  // isAvailable is always true for the mock
  private isAvailable: boolean = true;

  // Simulate availability
  async isAvailableAsync(): Promise<boolean> {
    return Promise.resolve(this.isAvailable);
  }

  // Simulate getting step count for a range
  async getStepCountAsync(start: Date, end: Date): Promise<{ steps: number }> {
    // In a real mock, you might calculate steps based on date range.
    // For simplicity, we just return current mock steps.
    return Promise.resolve({ steps: this.steps });
  }

  // Simulate watching step count changes
  watchStepCount(callback: (result: PedometerResult) => void): Subscription {
    console.log('[PedometerMock] New subscriber added');
    this.subscribers.push(callback);

    // Immediately call back with current steps for initial state
    const initialData = { steps: this.steps };
    console.log('[PedometerMock] Sending initial steps:', initialData);
    callback(initialData);

    // Start incrementing steps every second if not already started
    if (this.intervalId === null) {
      console.log('[PedometerMock] Starting step simulation');
      this.intervalId = setInterval(() => {
        this.steps += 1; // Increment step count
        console.log(`[PedometerMock] Step count updated to: ${this.steps}`);
        this.notifySubscribers(); // Notify all active subscribers
      }, 1000); // Trigger a step every 1 second
    }

    // Return a subscription object with a remove method to clean up
    return {
      remove: () => {
        const index = this.subscribers.indexOf(callback);
        if (index > -1) {
          this.subscribers.splice(index, 1); // Remove the specific subscriber

          // If no more subscribers, clear the interval to stop simulating steps
          if (this.subscribers.length === 0 && this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.steps = 0; // Reset steps when no longer watching
            console.log("PedometerMock: All subscriptions removed, interval cleared.");
          }
        }
      },
    };
  }

  // Internal method to notify all subscribed callbacks
  private notifySubscribers() {
    const currentSteps = this.steps;
    const subscriberCount = this.subscribers.length;
    console.log(`[PedometerMock] Notifying ${subscriberCount} subscribers, steps: ${currentSteps}`);
    
    this.subscribers.forEach((callback, index) => {
      try {
        callback({ steps: currentSteps });
      } catch (error) {
        console.error(`[PedometerMock] Error in subscriber ${index}:`, error);
      }
    });
  }
}

// Export a singleton instance of the mock pedometer
export const pedometerMock = new PedometerMock();

// Export a function that conditionally returns the mock or the real Pedometer
export const getPedometer = (useMock: boolean = __DEV__) => {
  // If useMock is true (or in development environment by default), use the mock.
  // Otherwise, use the real Expo Pedometer module.
  console.log(`getPedometer: Using ${useMock ? 'Mock' : 'Real'} Pedometer`);
  return useMock ? pedometerMock : Pedometer;
};
