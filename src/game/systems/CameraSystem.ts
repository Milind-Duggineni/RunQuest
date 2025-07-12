import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import { GameEntities } from '../types/game';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CameraState {
  position: { x: number; y: number };
  target: { x: number; y: number } | null;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export const CameraSystem = (entities: GameEntities, { time }: { time: { delta: number } }) => {
  const { player, camera } = entities;
  
  if (!player || !camera) return entities;
  
  // Initialize camera state if it doesn't exist
  if (!camera.state) {
    camera.state = {
      position: { x: 0, y: 0 },
      target: null,
      zoom: 1,
      offsetX: SCREEN_WIDTH / 2,
      offsetY: SCREEN_HEIGHT / 2,
    };
  }
  
  const cameraState = camera.state as CameraState;
  const playerPosition = player.body.position;
  
  // Set target to player position with some lookahead based on velocity
  const lookAheadFactor = 0.3; // How far ahead to look based on velocity
  const velocity = player.body.velocity || { x: 0, y: 0 };
  const targetX = playerPosition.x + (velocity.x * lookAheadFactor * 0.5);
  const targetY = playerPosition.y + (velocity.y * lookAheadFactor * 0.5);
  
  // Smoothly interpolate camera position towards target
  const smoothing = 0.1; // Lower values = smoother follow
  cameraState.position.x += (targetX - cameraState.position.x) * smoothing;
  cameraState.position.y += (targetY - cameraState.position.y) * smoothing;
  
  // Update camera transform
  camera.transform = [
    // Translate to center of screen
    { translateX: SCREEN_WIDTH / 2 },
    { translateY: SCREEN_HEIGHT / 2 },
    // Scale (zoom)
    { scale: cameraState.zoom },
    // Translate to follow player (inverse of player position)
    { translateX: -cameraState.position.x },
    { translateY: -cameraState.position.y },
  ];
  
  return entities;
};

export default CameraSystem;
