import React from 'react';
import { View, ViewStyle } from 'react-native';
import Matter from 'matter-js';

const PLAYER_DOT_SIZE_FACTOR = 0.6; // Matches the factor in DungeonGameScreen

// Define a simple interface for position to avoid direct dependency on Matter.Vector
interface Position {
  x: number;
  y: number;
}

interface RedDotPlayerProps {
  position: Position;
  size: { width: number; height: number };
  angle?: number;
}

const RedDotPlayer: React.FC<RedDotPlayerProps> = ({ 
  position, 
  size = { width: 32, height: 32 },
  angle = 0 
}) => {
  // If position is not available, don't render anything
  if (!position) {
    return null;
  }

  // Extract x and y with default values
  const { x = 0, y = 0 } = position || {};
  
  // Calculate centered position
  const posX = x - (size.width * PLAYER_DOT_SIZE_FACTOR) / 2;
  const posY = y - (size.height * PLAYER_DOT_SIZE_FACTOR) / 2;

  const playerStyle: ViewStyle = {
    position: 'absolute',
    left: posX,
    top: posY,
    width: size.width * PLAYER_DOT_SIZE_FACTOR,
    height: size.height * PLAYER_DOT_SIZE_FACTOR,
    backgroundColor: 'red',
    borderRadius: (size.width * PLAYER_DOT_SIZE_FACTOR) / 2, // Makes it a circle
    zIndex: 10, // Ensure player is above map
    transform: [{ rotate: `${angle}rad` }],
  };

  return <View style={playerStyle} />;
};

export default React.memo(RedDotPlayer);
