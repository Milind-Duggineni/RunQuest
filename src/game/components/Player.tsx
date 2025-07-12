import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Matter from 'matter-js';

interface PlayerProps {
  body: Matter.Body;
  size: { width: number; height: number };
  spritesheet: any;
  frame: number;
  frameCount: number;
  direction: 'up' | 'down' | 'left' | 'right';
  frameWidth: number;
  frameHeight: number;
}

const Player: React.FC<PlayerProps> = ({
  body,
  size,
  spritesheet,
  frame,
  frameCount,
  direction,
  frameWidth,
  frameHeight,
}) => {
  const x = body.position.x - size.width / 2;
  const y = body.position.y - size.height / 2;

  // Calculate frame position in spritesheet
  const frameX = (frame % frameCount) * frameWidth;
  const frameY = {
    down: 0,
    left: frameHeight,
    right: frameHeight * 2,
    up: frameHeight * 3,
  }[direction];

  return (
    <View style={[styles.container, { left: x, top: y, width: size.width, height: size.height }]}>
      <Image
        source={spritesheet}
        style={[
          styles.sprite,
          {
            width: frameWidth * frameCount,
            height: frameHeight * 4, // 4 directions
            left: -frameX,
            top: -frameY,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    overflow: 'hidden',
  },
  sprite: {
    position: 'absolute',
  },
});

// Custom comparison function for React.memo
const areEqual = (prevProps: PlayerProps, nextProps: PlayerProps) => {
  // Only re-render if these props change
  return (
    prevProps.frame === nextProps.frame &&
    prevProps.direction === nextProps.direction &&
    prevProps.frameCount === nextProps.frameCount &&
    prevProps.frameWidth === nextProps.frameWidth &&
    prevProps.frameHeight === nextProps.frameHeight &&
    prevProps.size.width === nextProps.size.width &&
    prevProps.size.height === nextProps.size.height &&
    // Only check position changes beyond a certain threshold to prevent excessive re-renders
    Math.abs(prevProps.body.position.x - nextProps.body.position.x) < 0.5 &&
    Math.abs(prevProps.body.position.y - nextProps.body.position.y) < 0.5
  );
};

export default memo(Player, areEqual);
