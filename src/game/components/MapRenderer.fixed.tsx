import React, { memo, useMemo, useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, ImageSourcePropType, ImageURISource } from 'react-native';

interface TileData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tileX: number;
  tileY: number;
  tileWidth: number;
  tileHeight: number;
}

interface MapRendererProps {
  mapData: {
    layers: Array<{
      data: number[];
      type: string;
    }>;
    tilesets: Array<{
      columns: number;
      imagewidth: number;
      imageheight: number;
      firstgid: number;
      image: string;
      tilewidth: number;
      tileheight: number;
    }>;
    width: number;
    height: number;
    tilewidth: number;
    tileheight: number;
  };
  tilesetImage: ImageSourcePropType;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  debugOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
  },
  debugRow: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  debugLabel: {
    fontWeight: 'bold',
    marginRight: 4,
    color: '#00ff9d',
  },
  debugValue: {
    flex: 1,
    color: '#fff',
  },
});

const MapRenderer: React.FC<MapRendererProps> = ({
  mapData,
  tilesetImage,
}) => {
  // Extract map data
  const { layers, tilesets, width: mapWidth, height: mapHeight, tilewidth: tileWidth, tileheight: tileHeight } = mapData;
  
  // Get the first tileset
  const tileset = tilesets[0];
  if (!tileset) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No tileset found in map data</Text>
      </View>
    );
  }

  const { columns: tilesetColumns, firstgid: tilesetFirstGid, imagewidth: tilesetImageWidth, imageheight: tilesetImageHeight } = tileset;
  
  // Get the first tile layer
  const tileLayer = layers.find(layer => layer.type === 'tilelayer');
  if (!tileLayer) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No tile layer found in map data</Text>
      </View>
    );
  }
  
  const tileData = tileLayer.data;
  
  // Track image loading state
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<Error | null>(null);
  const [tilesetUri, setTilesetUri] = useState<string>('');
  
  // Process tiles into render data
  const tiles = useMemo(() => {
    const processedTiles: TileData[] = [];
    
    for (let y = 0; y < mapHeight; y++) {
      for (let x = 0; x < mapWidth; x++) {
        const index = y * mapWidth + x;
        if (index >= tileData.length) continue;
        
        const tileId = tileData[index];
        if (tileId === 0) continue; // Skip empty tiles
        
        const tileIndex = tileId - tilesetFirstGid;
        if (tileIndex < 0) {
          console.warn(`Invalid tile ID ${tileId} at (${x},${y}): tileIndex is ${tileIndex}`);
          continue;
        }
        
        const tileX = (tileIndex % tilesetColumns) * tileWidth;
        const tileY = Math.floor(tileIndex / tilesetColumns) * tileHeight;
        
        processedTiles.push({
          id: `tile-${x}-${y}`,
          x: x * tileWidth,
          y: y * tileHeight,
          width: tileWidth,
          height: tileHeight,
          tileX,
          tileY,
          tileWidth,
          tileHeight,
        });
      }
    }
    
    return processedTiles;
  }, [mapWidth, mapHeight, tileData, tileWidth, tileHeight, tilesetColumns, tilesetFirstGid]);
  
  // Handle image loading
  useEffect(() => {
    const loadImage = async () => {
      try {
        let uri = '';
        
        // Handle different image source types
        if (typeof tilesetImage === 'number') {
          // Local require() result
          const source = Image.resolveAssetSource(tilesetImage);
          uri = source.uri;
        } else if (typeof tilesetImage === 'string') {
          // URI string
          uri = tilesetImage;
        } else if ('uri' in tilesetImage) {
          // ImageURISource object
          uri = tilesetImage.uri || '';
        }
        
        if (!uri) {
          throw new Error('Could not resolve image URI');
        }
        
        // Verify the image can be loaded
        await new Promise((resolve, reject) => {
          Image.getSize(
            uri,
            (width, height) => {
              console.log(`Tileset image loaded: ${width}x${height}`);
              setTilesetUri(uri);
              setIsImageLoaded(true);
              setImageError(null);
              resolve(true);
            },
            (error) => {
              console.error('Error loading tileset image:', error);
              setImageError(new Error('Failed to load tileset image'));
              setIsImageLoaded(false);
              reject(error);
            }
          );
        });
      } catch (error) {
        console.error('Error processing tileset image:', error);
        setImageError(error instanceof Error ? error : new Error('Failed to process tileset image'));
        setIsImageLoaded(false);
      }
    };
    
    loadImage();
  }, [tilesetImage]);
  
  // Calculate map dimensions in pixels
  const mapPixelWidth = mapWidth * tileWidth;
  const mapPixelHeight = mapHeight * tileHeight;
  
  // Handle loading and error states
  if (imageError) {
    return (
      <View style={[styles.container, { width: mapPixelWidth, height: mapPixelHeight }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading map: {imageError.message}</Text>
        </View>
      </View>
    );
  }
  
  if (!isImageLoaded) {
    return (
      <View style={[styles.container, { width: mapPixelWidth, height: mapPixelHeight }]}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: mapPixelWidth, height: mapPixelHeight }]}>
      <View style={{
        position: 'absolute',
        width: mapPixelWidth,
        height: mapPixelHeight,
        overflow: 'hidden'
      }}>
        {tiles.map((tile) => (
          <View
            key={tile.id}
            style={{
              position: 'absolute',
              left: tile.x,
              top: tile.y,
              width: tile.width,
              height: tile.height,
              overflow: 'hidden'
            }}
          >
            <Image
              source={{ uri: tilesetUri }}
              style={{
                position: 'absolute',
                left: -tile.tileX,
                top: -tile.tileY,
                width: tilesetImageWidth,
                height: tilesetImageHeight
              }}
              resizeMode="stretch"
              onError={(e) => {
                console.error('Error rendering tile:', e.nativeEvent.error);
                setImageError(new Error('Failed to render tile'));
              }}
            />
          </View>
        ))}
      </View>

      {/* Debug overlay */}
      {__DEV__ && (
        <View style={styles.debugOverlay}>
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Map:</Text>
            <Text style={styles.debugText}>{mapWidth}x{mapHeight} tiles</Text>
          </View>
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Tile:</Text>
            <Text style={styles.debugText}>{tileWidth}x{tileHeight}px</Text>
          </View>
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Tileset:</Text>
            <Text style={styles.debugText}>{tilesetImageWidth}x{tilesetImageHeight}px</Text>
          </View>
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Tileset Cols:</Text>
            <Text style={styles.debugText}>{tilesetColumns}</Text>
          </View>
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>First GID:</Text>
            <Text style={styles.debugText}>{tilesetFirstGid}</Text>
          </View>
          <View style={styles.debugRow}>
            <Text style={styles.debugLabel}>Visible Tiles:</Text>
            <Text style={styles.debugText}>{tiles.length}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Simple comparison function for React.memo
function areEqual(prevProps: MapRendererProps, nextProps: MapRendererProps): boolean {
  return (
    prevProps.mapData === nextProps.mapData &&
    prevProps.tilesetImage === nextProps.tilesetImage
  );
}

export default memo(MapRenderer, areEqual);
