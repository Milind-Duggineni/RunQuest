// src/components/DungeonMap.tsx
import React from 'react';
import { View, Image, StyleSheet, Dimensions, Text } from 'react-native';

// --- Dungeon assets ---
const TILESET = require('../../assets/catacombs_tileset.png');
const CHAR_SPRITE = require('../../assets/catacombs_tileset.png');

const TILE_SIZE = 32;
const TILES_VISIBLE = 12; // simple horiz strip

interface Props {
  depth: number;
  error?: string;
  isLoading?: boolean;
  mapData?: {
    layers: Array<{
      data: number[];
      width: number;
      height: number;
      tileWidth: number;
      tileHeight: number;
    }>;
  };
}

export default function DungeonMap({ depth, error, isLoading, mapData }: Props) {
  // Pre-render a flat corridor of tiles
  const tiles = Array.from({ length: TILES_VISIBLE });
  const charIndex = depth % TILES_VISIBLE;

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.loadingText}>Please check the console for more details.</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      ) : mapData ? (
        <View style={styles.mapContainer}>
          {/* Draw visible tiles */}
          {mapData.layers[0].data.map((tileId: number, index: number) => {
            if (tileId === 0) return null; // Skip empty tiles
            
            const x = (index % mapData.layers[0].width) * mapData.layers[0].tileWidth;
            const y = Math.floor(index / mapData.layers[0].width) * mapData.layers[0].tileHeight;
            
            return (
              <Image
                key={`tile-${index}`}
                source={TILESET}
                style={[styles.tile, {
                  left: x,
                  top: y,
                }]}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
  },
  mapContainer: {
    position: 'relative',
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    position: 'absolute',
  },
});
