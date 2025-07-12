// src/components/DungeonMap.tsx
import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

// --- PLACEHOLDER graphics (replace with real pixel art) ---
const TILE_IMG = require('../../assets/Background.jpg');
const CHAR_SPRITE = require('../../assets/Background.jpg');

const TILE_SIZE = 32;
const TILES_VISIBLE = 12; // simple horiz strip

interface Props {
  depth: number;
}

export default function DungeonMap({ depth }: Props) {
  // Pre-render a flat corridor of tiles
  const tiles = Array.from({ length: TILES_VISIBLE });
  const charIndex = depth % TILES_VISIBLE;

  return (
    <View style={styles.wrapper}>
      {tiles.map((_, idx) => (
        <Image key={idx} source={TILE_IMG} style={styles.tile} />
      ))}
      {/* Character */}
      <Image source={CHAR_SPRITE} style={[styles.char, { left: charIndex * TILE_SIZE }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: TILES_VISIBLE * TILE_SIZE,
    height: TILE_SIZE,
    flexDirection: 'row',
    position: 'relative',
  },
  tile: { width: TILE_SIZE, height: TILE_SIZE },
  char: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    position: 'absolute',
    bottom: 0,
  },
});
