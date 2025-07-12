import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { Canvas, useImage, Image as SkiaImage, type DataSourceParam, type SkImage } from '@shopify/react-native-skia';

// Define interfaces
interface Tile {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  srcX: number;
  srcY: number;
}

interface TilesetInfo {
  width: number;
  height: number;
  columns: number;
  rows: number;
}

// Define styles outside the component to avoid recreation
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  debugInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    maxWidth: '90%',
  },
  debugText: {
    color: '#ffffff',
    fontSize: 12,
    marginVertical: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  debugOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
});

interface MapData {
  tilewidth?: number;
  tileheight?: number;
  width?: number;
  height?: number;
  layers?: Array<{
    data: number[];
    width?: number;
    height?: number;
    type?: string;
  }>;
  [key: string]: any;
}

interface MapRendererProps {
  mapData: MapData;
  playerPosition: { x: number; y: number };
  tileset: DataSourceParam | { uri: string } | { default: DataSourceParam };
  screenWidth?: number;
  screenHeight?: number;
  tileWidth?: number;
  tileHeight?: number;
  debug?: boolean;
  onError?: (error: string) => void;
  onLoadingStateChange?: (isLoading: boolean) => void;
  tilesetImageWidth?: number;
  tilesetImageHeight?: number;
}

const MapRenderer: React.FC<MapRendererProps> = ({
  mapData,
  playerPosition = { x: 0, y: 0 },
  tileset,
  screenWidth: propScreenWidth,
  screenHeight: propScreenHeight,
  tileWidth = 32,
  tileHeight = 32,
  tilesetImageWidth = 256,
  tilesetImageHeight = 256,
  debug = false,
  onError,
  onLoadingStateChange,
}) => {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tilesetLoaded, setTilesetLoaded] = useState(false);
  const [tilesetInfo, setTilesetInfo] = useState<TilesetInfo | null>(null);
  
  // Get screen dimensions using React Native's Dimensions API
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
  const screenWidth = propScreenWidth ?? windowWidth;
  const screenHeight = propScreenHeight ?? windowHeight;

  // Handle different types of tileset sources with proper type checking
  const tilesetSource = useMemo<DataSourceParam>(() => {
    try {
      // Handle string or number sources
      if (typeof tileset === 'string' || typeof tileset === 'number') {
        return tileset;
      }
      
      // Handle object sources
      if (tileset && typeof tileset === 'object') {
        // Handle ESModule default import
        if ('default' in tileset) {
          const tilesetWithDefault = tileset as { default: DataSourceParam };
          const defaultImport = tilesetWithDefault.default;
          if (typeof defaultImport === 'string' || typeof defaultImport === 'number') {
            return defaultImport;
          }
        }
        // Handle URI objects
        if ('uri' in tileset) {
          const tilesetWithUri = tileset as { uri: string };
          return tilesetWithUri.uri;
        }
      }
      
      throw new Error('Unsupported tileset format');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process tileset source';
      console.warn(errorMsg, tileset);
      onError?.(errorMsg);
      return '';
    }
  }, [tileset, onError]);

  // Load the tileset image
  const tilesetImage: SkImage | null = useImage(tilesetSource);

  // Handle tileset image loading and processing
  useEffect(() => {
    if (tilesetImage) {
      console.log('Tileset image loaded successfully');

      const columns = Math.floor(tilesetImageWidth / tileWidth);
      const rows = Math.floor(tilesetImageHeight / tileHeight);

      setTilesetInfo({
        width: tilesetImageWidth,
        height: tilesetImageHeight,
        columns,
        rows,
      });

      console.log(`Tileset info: ${columns}x${rows} tiles (${tileWidth}x${tileHeight} each)`);

      setTilesetLoaded(true);
      setError(null);
      setIsLoading(false);
      onLoadingStateChange?.(false);
    } else if (tilesetImage === null) {
      const errorMsg = 'Failed to load tileset image: Image is null or invalid';
      console.error(errorMsg);
      setError(errorMsg);
      setTilesetLoaded(false);
      setIsLoading(false);
      onError?.(errorMsg);
      onLoadingStateChange?.(false);
    } else {
      console.log('Tileset still loading...');
      setIsLoading(true);
      onLoadingStateChange?.(true);
    }
  }, [tilesetImage, tileWidth, tileHeight, tilesetImageWidth, tilesetImageHeight, onError, onLoadingStateChange]);

  useEffect(() => {
    console.log('Tileset image state changed:', {
      hasImage: !!tilesetImage,
      isLoading,
      tilesetLoaded,
      error,
    });

    if (tilesetImage) {
      console.log('Tileset loaded successfully');
      setTilesetLoaded(true);
      setError(null);
      setIsLoading(false);
      onLoadingStateChange?.(false);
    } else if (tilesetImage === null) {
      if (!error) {
        const errorMsg = 'Failed to load tileset image: Image is null';
        console.error(errorMsg);
        setError(errorMsg);
        onError?.(errorMsg);
      }
      setTilesetLoaded(false);
      setIsLoading(false);
      onLoadingStateChange?.(false);
    } else {
      console.log('Tileset still loading...');
      setIsLoading(true);
      onLoadingStateChange?.(true);
    }
  }, [
    tilesetImage, 
    tileWidth, 
    tileHeight, 
    tilesetImageWidth, 
    tilesetImageHeight, 
    onError, 
    onLoadingStateChange
  ]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { width: screenWidth, height: screenHeight }]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading map resources...</Text>
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Tileset: {typeof tileset === 'string' ? tileset : 'Image object'}
            </Text>
            <Text style={styles.debugText}>
              Tile size: {tileWidth}x{tileHeight}
            </Text>
            {tilesetInfo && (
              <Text style={styles.debugText}>
                Tileset: {tilesetInfo.width}x{tilesetInfo.height} ({tilesetInfo.columns}x{tilesetInfo.rows} tiles)
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  // Calculate visible tiles
  const visibleTiles = useMemo<Tile[]>(() => {
    if (!tilesetInfo) return [];
    
    const tiles: Tile[] = [];
    const { columns, rows } = tilesetInfo;
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const tileId = y * columns + x + 1;
        tiles.push({
          id: tileId,
          x: x * tileWidth,
          y: y * tileHeight,
          width: tileWidth,
          height: tileHeight,
          srcX: (tileId - 1) % columns * tileWidth,
          srcY: Math.floor((tileId - 1) / columns) * tileHeight,
        });
      }
    }
    
    return tiles;
  }, [tilesetInfo, tileWidth, tileHeight]);

  // Show loading state if tileset isn't ready
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { width: screenWidth, height: screenHeight }]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading map resources...</Text>
        {__DEV__ && tilesetInfo && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Tileset: {tilesetInfo.width}x{tilesetInfo.height}
            </Text>
            <Text style={styles.debugText}>
              Tiles: {tilesetInfo.columns}x{tilesetInfo.rows}
            </Text>
            <Text style={styles.debugText}>
              Tile size: {tileWidth}x{tileHeight}
            </Text>
          </View>
        )}
      </View>
    );
  }

  if (error || !tilesetLoaded) {
    return (
      <View style={[styles.errorContainer, { width: screenWidth, height: screenHeight }]}>
        <Text style={styles.errorText}>
          {error || 'Failed to load tileset'}
        </Text>
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Tileset source: {typeof tileset === 'string' ? tileset : 'Image object'}
            </Text>
            {tilesetInfo && (
              <Text style={styles.debugText}>
                Tileset: {tilesetInfo.width}x{tilesetInfo.height}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: screenWidth, height: screenHeight }]}>
      <Canvas style={styles.canvas}>
        {tilesetImage && visibleTiles.map((tile) => (
          <SkiaImage
            key={`tile-${tile.id}`}
            image={tilesetImage as SkImage}
            x={tile.x}
            y={tile.y}
            width={tile.width}
            height={tile.height}
            rect={{
              x: tile.srcX,
              y: tile.srcY,
              width: tileWidth,
              height: tileHeight,
            }}
          />
        ))}
        {debug && tilesetImage && (
          <SkiaImage
            image={tilesetImage as SkImage}
            x={0}
            y={0}
            width={tileWidth}
            height={tileHeight}
            rect={{
              x: 0,
              y: 0,
              width: tileWidth,
              height: tileHeight,
            }}
          />
        )}
      </Canvas>
      {debug && tilesetInfo && (
        <View style={styles.debugOverlay} pointerEvents="none">
          <Text style={styles.debugText}>
            Tileset: {tilesetInfo.width}x{tilesetInfo.height}
          </Text>
          <Text style={styles.debugText}>
            Tiles: {tilesetInfo.columns}x{tilesetInfo.rows}
          </Text>
          <Text style={styles.debugText}>
            Player: {Math.round(playerPosition.x)}, {Math.round(playerPosition.y)}
          </Text>
        </View>
      )}
    </View>
  );
};



export default MapRenderer;