import { PathPoint } from '../types/game';

/**
 * Generates a path from a series of points
 */
export const createPath = (points: Array<{x: number, y: number}>, type?: string): PathPoint[] => {
  return points.map(point => ({
    x: point.x,
    y: point.y,
    type: type as any
  }));
};

/**
 * Smooths a path using Chaikin's algorithm
 */
export const smoothPath = (path: PathPoint[], iterations = 2): PathPoint[] => {
  if (path.length < 3) return path;
  
  let currentPath = [...path];
  
  for (let i = 0; i < iterations; i++) {
    const newPath: PathPoint[] = [currentPath[0]];
    
    for (let j = 0; j < currentPath.length - 1; j++) {
      const p0 = currentPath[j];
      const p1 = currentPath[j + 1];
      
      const q = {
        x: p0.x * 0.75 + p1.x * 0.25,
        y: p0.y * 0.75 + p1.y * 0.25,
        type: p0.type
      };
      
      const r = {
        x: p0.x * 0.25 + p1.x * 0.75,
        y: p0.y * 0.25 + p1.y * 0.75,
        type: p1.type
      };
      
      newPath.push(q, r);
    }
    
    newPath.push(currentPath[currentPath.length - 1]);
    currentPath = newPath;
  }
  
  return currentPath;
};

/**
 * Samples points along a path at a fixed interval
 */
export const samplePath = (path: PathPoint[], interval: number): PathPoint[] => {
  if (path.length < 2) return path;
  
  const result: PathPoint[] = [path[0]];
  
  for (let i = 1; i < path.length; i++) {
    const p0 = path[i - 1];
    const p1 = path[i];
    
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(dist / interval);
    
    if (steps > 1) {
      for (let j = 1; j < steps; j++) {
        const t = j / steps;
        result.push({
          x: p0.x + dx * t,
          y: p0.y + dy * t,
          type: p0.type
        });
      }
    }
    
    result.push(p1);
  }
  
  return result;
};

/**
 * Finds the closest point on a path to a given position
 */
export const findClosestPointOnPath = (path: PathPoint[], x: number, y: number): { point: PathPoint, index: number, distance: number } => {
  let closestPoint = path[0];
  let closestIndex = 0;
  let minDistance = Infinity;
  
  for (let i = 0; i < path.length; i++) {
    const point = path[i];
    const dx = point.x - x;
    const dy = point.y - y;
    const distance = dx * dx + dy * dy; // No need for sqrt for comparison
    
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
      closestIndex = i;
    }
  }
  
  return {
    point: closestPoint,
    index: closestIndex,
    distance: Math.sqrt(minDistance)
  };
};

/**
 * Calculates the total length of a path
 */
export const calculatePathLength = (path: PathPoint[]): number => {
  let length = 0;
  
  for (let i = 1; i < path.length; i++) {
    const p0 = path[i - 1];
    const p1 = path[i];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  
  return length;
};

/**
 * Gets a point at a specific distance along the path
 */
export const getPointAtDistance = (path: PathPoint[], distance: number): { point: PathPoint, index: number } => {
  if (path.length === 0) {
    throw new Error('Path is empty');
  }
  
  if (path.length === 1 || distance <= 0) {
    return { point: path[0], index: 0 };
  }
  
  let currentDistance = 0;
  
  for (let i = 1; i < path.length; i++) {
    const p0 = path[i - 1];
    const p1 = path[i];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);
    
    if (currentDistance + segmentLength >= distance) {
      const t = (distance - currentDistance) / segmentLength;
      return {
        point: {
          x: p0.x + dx * t,
          y: p0.y + dy * t,
          type: p0.type
        },
        index: i - 1
      };
    }
    
    currentDistance += segmentLength;
  }
  
  // If we get here, the distance is longer than the path
  return { point: path[path.length - 1], index: path.length - 1 };
};
