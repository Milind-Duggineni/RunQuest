import React from 'react';
import { View, StyleSheet } from 'react-native';

const PLAYER_DOT_SIZE_FACTOR = 0.6; // Matches the factor in DungeonGameScreen

const RedDotPlayer = ({ body, size }) => {
  // body.position.x and body.position.y are updated by Matter.js
  const x = body.position.x - (size.width * PLAYER_DOT_SIZE_FACTOR) / 2;
  const y = body.position.y - (size.height * PLAYER_DOT_SIZE_FACTOR) / 2;

  return (
    <View style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size.width * PLAYER_DOT_SIZE_FACTOR,
      height: size.height * PLAYER_DOT_SIZE_FACTOR,
      backgroundColor: 'red',
      borderRadius: (size.width * PLAYER_DOT_SIZE_FACTOR) / 2, // Makes it a circle
      zIndex: 10, // Ensure player is above map
    }} />
  );
};

export default RedDotPlayer;

