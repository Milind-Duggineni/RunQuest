import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Dimensions, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

// Simple map data structure
interface MapData {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  layers: {
    data: number[];
    width: number;
    height: number;
  }[];
}

const ShadowfellCryptMap = () => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [tilesetImage, setTilesetImage] = useState<any>(null);

  useEffect(() => {
    // Load the map data
    const loadMap = async () => {
      try {
        // Load the tileset image
        setTilesetImage(require('../assets/ShadowfellCryptMap.png'));
        
        // Create a simple map data structure
        const mapData: MapData = {
          width: 40,
          height: 40,
          tileWidth: 32,
          tileHeight: 32,
          layers: [
            {
              data: Array(40 * 40).fill(0).map((_, i) => {
                // Simple pattern for testing - replace with your actual map data
                if (i > 30 * 40) return 1; // Bottom 10 rows are solid
                return 0; // Empty space
              }),
              width: 40,
              height: 40,
            },
          ],
        };
        
        setMapData(mapData);
      } catch (error) {
        console.error('Error loading map:', error);
      }
    };

    loadMap();
  }, []);

  if (!mapData || !tilesetImage) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  // Simple renderer that just shows a grid
  return (
    <View style={styles.container}>
      {mapData.layers[0].data.map((tileId, index) => {
        if (tileId === 0) return null; // Skip empty tiles
        
        const x = (index % mapData.width) * mapData.tileWidth;
        const y = Math.floor(index / mapData.width) * mapData.tileHeight;
        
        return (
          <Image
            key={`tile-${index}`}
            source={tilesetImage}
            style={[{
              position: 'absolute',
              left: x,
              top: y,
              width: mapData.tileWidth,
              height: mapData.tileHeight,
              opacity: 0.7, // Make tiles semi-transparent for now
            }]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default ShadowfellCryptMap;
