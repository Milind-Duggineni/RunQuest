// src/hooks/useStepTracker.ts

/*
  Hook: useStepTracker
  ---------------------
  Lightweight wrapper around Expo Pedometer.
  Returns: { steps, distance, pace }
  - steps   → total steps recorded since the hook mounted
  - distance→ metres travelled (approx – based on average step length)
  - pace    → steps / minute (updated every POLL_INTERVAL ms)

  NOTE: Requires "expo-sensors" in your project (already shipped with managed Expo apps).
  On physical devices, grant Motion & Fitness permission.
*/

import { useEffect, useRef, useState } from 'react';
import { Pedometer } from 'expo-sensors';

const AVG_STEP_LENGTH_METRES = 0.78; // average adult step length (rough)
const POLL_INTERVAL = 4000; // 4 s cadence window

export interface StepData {
  steps: number;
  distance: number; // metres
  pace: number; // steps / min
}

interface StepTrackerResult extends StepData {
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  isTracking: boolean;
}

export default function useStepTracker(): StepTrackerResult {
  const [data, setData] = useState<StepData>({ steps: 0, distance: 0, pace: 0 });
  const [isTracking, setIsTracking] = useState<boolean>(true);
  const prevStepCount = useRef<number>(0);
  const lastTick = useRef<number>(Date.now());
  const pedometerSub = useRef<Pedometer.Subscription | null>(null);
  const paceInterval = useRef<NodeJS.Timeout | null>(null);

  const startTracking = async () => {
    if (isTracking) return;
    
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      console.warn('Pedometer not available');
      return;
    }

    pedometerSub.current = Pedometer.watchStepCount((result) => {
      const steps = result.steps;
      setData((prev) => {
        const distance = steps * AVG_STEP_LENGTH_METRES;
        return { ...prev, steps, distance };
      });
      const now = Date.now();
      const timeElapsed = (now - lastTick.current) / 60000; // minutes
      if (timeElapsed > 0) {
        const currentSteps = data.steps - prevStepCount.current;
        const currentPace = Math.round(currentSteps / timeElapsed);
        setData((prev) => ({
          ...prev,
          pace: currentPace,
        }));
        prevStepCount.current = data.steps;
        lastTick.current = now;
      }
    }, POLL_INTERVAL);

    setIsTracking(true);
  };

  const stopTracking = () => {
    if (pedometerSub.current) {
      pedometerSub.current.remove();
      pedometerSub.current = null;
    }
    if (paceInterval.current) {
      clearInterval(paceInterval.current);
      paceInterval.current = null;
    }
    setIsTracking(false);
  };

  // Initialize tracking on mount
  useEffect(() => {
    startTracking();
    return () => {
      stopTracking();
    };
  }, []);

  return {
    ...data,
    startTracking,
    stopTracking,
    isTracking,
  };
}
