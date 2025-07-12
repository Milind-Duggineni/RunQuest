import React from 'react';
import { View } from 'react-native';

type WallProps = {
  width: number;
  height: number;
  x: number;
  y: number;
};

const Wall: React.FC<WallProps> = ({ width, height, x, y }) => {
  return (
    <View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        backgroundColor: '#8B4513', // Brown color for walls
      }}
    />
  );
};

export default Wall;
