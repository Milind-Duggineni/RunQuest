declare module 'react-native-pedometer' {
  export interface PedometerData {
    startDate: string;
    endDate: string;
    steps: number;
    distance?: number;
    floorsAscended?: number;
    floorsDescended?: number;
  }

  export interface PedometerOptions {
    startDate: Date | string | number;
    endDate: Date | string | number;
  }

  export function isStepCountingAvailable(callback: (isAvailable: boolean) => void): void;
  
  export function getStepCountAsync(
    options: PedometerOptions,
    callback: (error: string, result: PedometerData) => void
  ): void;

  export function watchStepCount(
    callback: (data: PedometerData) => void
  ): { remove: () => void };
}
