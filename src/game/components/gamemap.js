import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import MapRenderer from './MapRenderer';

const GameMap = ({ map, tilesetImage, tilesetImageWidth, tilesetImageHeight }) => {
  // Debug log the props when they change
  useEffect(() => {
    console.log('GameMap mounted/updated with props:', {
      map: map ? {
        tiles: map.tiles ? `Array(${map.tiles.length})` : 'undefined',
        widthInTiles: map.widthInTiles,
        heightInTiles: map.heightInTiles,
        tileSize: map.tileSize,
        tilesetColumns: map.tilesetColumns
      } : 'null',
      tilesetImage: tilesetImage ? 'Image loaded' : 'null',
      tilesetImageWidth,
      tilesetImageHeight
    });
  }, [map, tilesetImage, tilesetImageWidth, tilesetImageHeight]);

  // Validate required props
  if (!map) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Map data is missing</Text>
      </View>
    );
  }

  const { tiles, widthInTiles, heightInTiles, tileSize, tilesetColumns } = map;

  // Check for required map properties
  if (!tiles || !widthInTiles || !heightInTiles || !tileSize || !tilesetColumns) {
    const missingProps = [];
    if (!tiles) missingProps.push('tiles');
    if (!widthInTiles) missingProps.push('widthInTiles');
    if (!heightInTiles) missingProps.push('heightInTiles');
    if (!tileSize) missingProps.push('tileSize');
    if (!tilesetColumns) missingProps.push('tilesetColumns');
    
    console.warn('GameMap: Missing required map properties:', missingProps.join(', '));
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Map data incomplete</Text>
      </View>
    );
  }

  // Check if tiles array has the expected length
  const expectedTilesCount = widthInTiles * heightInTiles;
  if (tiles.length !== expectedTilesCount) {
    console.warn(`GameMap: Tiles array length (${tiles.length}) does not match expected size (${expectedTilesCount})`);
  }

  // Check if tileset image is loaded
  if (!tilesetImage) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading tileset image...</Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <MapRenderer
        tiles={tiles}
        widthInTiles={widthInTiles}
        heightInTiles={heightInTiles}
        tileSize={tileSize}
        tilesetImage={tilesetImage}
        tilesetColumns={tilesetColumns}
        tilesetImageWidth={tilesetImageWidth}
        tilesetImageHeight={tilesetImageHeight}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    marginTop: 10,
  },
});

export default React.memo(GameMap);

