import { useState, useEffect, useCallback } from 'react';
import { Pedometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type MovementEvent = {
  type: 'move' | 'encounter' | 'idle';
  position?: { latitude: number; longitude: number };
  steps?: number;
  distance?: number;
  pace?: number; // meters per second
};

type UsePlayerMovementProps = {
  onMove?: (event: MovementEvent) => void;
  onEncounter?: (event: MovementEvent) => void;
  onIdle?: (event: MovementEvent) => void;
  updateInterval?: number;
  minPaceForMovement?: number; // Minimum pace in m/s to consider the player moving
  encounterCheckInterval?: number; // How often to check for encounters (ms)
};

export const usePlayerMovement = ({
  onMove,
  onEncounter,
  onIdle,
  updateInterval = 1000,
  minPaceForMovement = 0.5, // ~1.8 km/h, a slow walking pace
  encounterCheckInterval = 5000,
}: UsePlayerMovementProps = {}) => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [pastStepCount, setPastStepCount] = useState<number>(0);
  const [currentStepCount, setCurrentStepCount] = useState<number>(0);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [lastLocation, setLastLocation] = useState<Location.LocationObject | null>(null);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<{ remove: () => void } | null>(null);

  // Check if pedometer is available on the device
  useEffect(() => {
    const checkPedometer = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      setIsAvailable(isAvailable);
      
      if (isAvailable) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 1);
        
        try {
          const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
          if (pastStepCountResult) {
            setPastStepCount(pastStepCountResult.steps);
          }
        } catch (error) {
          console.warn('Could not get past step count:', error);
        }
      }
    };

    checkPedometer();

    return () => {
      subscription?.remove();
    };
  }, []);

  // Request location permissions and get current position
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Location permission not granted');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      setLastLocation(location);
    })();
  }, []);

  // Calculate pace and movement state
  const updateMovementState = useCallback(async () => {
    if (!currentLocation || !lastLocation) return;

    // Calculate distance between last and current position in meters
    const distance = Location.distanceBetween(
      lastLocation.coords.latitude,
      lastLocation.coords.longitude,
      currentLocation.coords.latitude,
      currentLocation.coords.longitude
    );

    // Calculate time difference in seconds
    const timeDiff = (currentLocation.timestamp - lastLocation.timestamp) / 1000;
    const currentPace = timeDiff > 0 ? distance / timeDiff : 0;

    // Determine if player is moving based on pace
    const wasMoving = isMoving;
    const nowMoving = currentPace >= minPaceForMovement;
    
    if (nowMoving !== wasMoving) {
      setIsMoving(nowMoving);
      
      const event: MovementEvent = {
        type: nowMoving ? 'move' : 'idle',
        position: {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        },
        steps: currentStepCount,
        distance,
        pace: currentPace,
      };

      if (nowMoving) {
        onMove?.(event);
      } else {
        onIdle?.(event);
      }
    }

    setLastLocation(currentLocation);
  }, [currentLocation, lastLocation, currentStepCount, isMoving, minPaceForMovement, onMove, onIdle]);

  // Set up pedometer subscription
  useEffect(() => {
    if (!isAvailable) return;

    const subscribe = async () => {
      const sub = Pedometer.watchStepCount(({ steps }: { steps: number }) => {
        setCurrentStepCount(steps);
      });
      setSubscription(sub);
    };

    subscribe();

    return () => {
      subscription?.remove();
    };
  }, [isAvailable]);

  // Set up location updates
  useEffect(() => {
    if (!currentLocation) return;

    const locationSubscription = Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: updateInterval,
        distanceInterval: 1, // 1 meter
      },
      (newLocation: Location.LocationObject) => {
        setCurrentLocation(newLocation);
      }
    );

    return () => {
      locationSubscription.then((sub) => sub.remove());
    };
  }, [updateInterval]);

  // Set up interval for movement updates
  useEffect(() => {
    const interval = setInterval(() => {
      updateMovementState();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateMovementState, updateInterval]);

  // Set up interval for encounter checks
  useEffect(() => {
    if (!onEncounter) return;

    const interval = setInterval(() => {
      if (isMoving && currentLocation) {
        const event: MovementEvent = {
          type: 'encounter',
          position: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          },
          steps: currentStepCount,
        };
        onEncounter(event);
      }
    }, encounterCheckInterval);

    return () => clearInterval(interval);
  }, [isMoving, currentLocation, currentStepCount, onEncounter, encounterCheckInterval]);

  return {
    isAvailable,
    isMoving,
    currentStepCount,
    totalStepCount: pastStepCount + currentStepCount,
    currentLocation,
  };
};

export default usePlayerMovement;
