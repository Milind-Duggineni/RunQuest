import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Dimensions, Platform, Image } from 'react-native';
import { Canvas, useImage, Image as SkiaImage, Group, type DataSourceParam, type SkImage } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  canvasContainer: {
    position: 'relative',
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

type TilesetSource = number | { uri: string; width: number; height: number } | string;

interface MapRendererProps {
  mapData: MapData;
  tileset: TilesetSource;
  tileWidth?: number;
  tileHeight?: number;
  playerPosition: { x: number; y: number };
  x?: number;
  y?: number;
  debug?: boolean;
  onError?: (error: string) => void;
  onLoadingStateChange?: (isLoading: boolean) => void;
}

const MapRenderer: React.FC<MapRendererProps> = ({
  mapData,
  tileset,
  tileWidth = 32,
  tileHeight = 32,
  playerPosition,
  debug = false,
  onError,
  onLoadingStateChange,
}) => {
  const [error, setError] = useState<string | null>(null);

  console.log('=== TILESET LOADING DEBUG ===');
  console.log('Tileset source type:', typeof tileset);
  
  const [tilesetImage, setTilesetImage] = useState<ReturnType<typeof useImage> | null>(null);
  const [loadingMethod, setLoadingMethod] = useState<string>('none');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Method 1: Try direct require first
  useEffect(() => {
    const loadImage = async () => {
      if (!tileset) {
        setErrorMsg('No tileset provided');
        return;
      }

      try {
        // Method 1: Handle number (direct require)
        if (typeof tileset === 'number') {
          console.log('🔄 Method 1: Handling direct require...');
          const source = Image.resolveAssetSource(tileset);
          console.log('🔹 Direct source:', JSON.stringify(source, null, 2));
          
          if (source?.uri) {
            const img = useImage(source.uri);
            if (img) {
              console.log('✅ Success with direct require');
              setTilesetImage(img);
              setLoadingMethod('direct');
              return;
            }
          }
        }

        // Method 2: Handle string URI
        if (typeof tileset === 'string') {
          console.log('🔄 Method 2: Handling string URI...');
          try {
            const img = useImage(tileset);
            if (img) {
              console.log('✅ Success with string URI');
              setTilesetImage(img);
              setLoadingMethod('string-uri');
              return;
            }
          } catch (e) {
            console.warn('String URI method failed:', e);
          }
        }

        // Method 3: Try with expo-asset for complex objects
        console.log('🔄 Method 3: Trying expo-asset...');
        try {
          const asset = typeof tileset === 'object' && 'uri' in tileset 
            ? Asset.fromURI(tileset.uri) 
            : Asset.fromModule(tileset as any);
            
          await asset.downloadAsync();
          console.log('🔹 Expo asset:', JSON.stringify(asset, null, 2));
          
          if (asset.localUri || asset.uri) {
            const img = useImage(asset.localUri || asset.uri);
            if (img) {
              console.log('✅ Success with expo-asset');
              setTilesetImage(img);
              setLoadingMethod('expo-asset');
              return;
            }
          }
        } catch (e) {
          console.warn('expo-asset method failed:', e);
        }

        // Method 3: Try with file system
        console.log('🔄 Method 3: Trying file system...');
        try {
          const asset = Asset.fromModule(tileset);
          await asset.downloadAsync();
          
          if (asset.localUri) {
            const fileInfo = await FileSystem.getInfoAsync(asset.localUri);
            if (fileInfo.exists) {
              const img = useImage(asset.localUri);
              if (img) {
                console.log('✅ Success with file system');
                setTilesetImage(img);
                setLoadingMethod('file-system');
                return;
              }
            }
          }
        } catch (e) {
          console.warn('File system method failed:', e);
        }

        // If all methods failed
        setErrorMsg('All loading methods failed');
        console.error('❌ All image loading methods failed');
      } catch (error) {
        console.error('❌ Error in image loading:', error);
        setErrorMsg(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    loadImage();
  }, [tileset]);

  // Debug effect to log when tilesetImage changes
  useEffect(() => {
    if (tilesetImage) {
      console.log('🎉 Tileset loaded successfully via', loadingMethod);
      console.log('Image dimensions:', {
        width: tilesetImage.width(),
        height: tilesetImage.height()
      });
    }
  }, [tilesetImage, loadingMethod]);

  // Notify loading state changes
  useEffect(() => {
    if (!tileset) {
      const msg = 'Tileset source is not provided';
      setError(msg);
      if (onError) onError(msg);
      if (onLoadingStateChange) onLoadingStateChange(false);
      return;
    }
    
    if (errorMsg) {
      setError(errorMsg);
      if (onError) onError(errorMsg);
      if (onLoadingStateChange) onLoadingStateChange(false);
      return;
    }
    
    if (!tilesetImage) {
      if (onLoadingStateChange) onLoadingStateChange(true);
      return;
    }
    
    setError(null);
    if (onLoadingStateChange) onLoadingStateChange(false);
  }, [tileset, tilesetImage, errorMsg, onError, onLoadingStateChange]);

  // Validate required props early return
  if (!tileset || !mapData?.layers) {
    const errorMsg = 'Missing required props: tileset or mapData';
    if (!error) setError(errorMsg);
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      </View>
    );
  }

  // Calculate viewport bounds based on player position
  const viewportWidth = screenWidth;
  const viewportHeight = screenHeight;
  const viewportX = playerPosition.x - viewportWidth / 2;
  const viewportY = playerPosition.y - viewportHeight / 2;

  // Calculate visible tile bounds
  const colMin = Math.floor(viewportX / tileWidth);
  const colMax = Math.ceil((viewportX + viewportWidth) / tileWidth);
  const rowMin = Math.floor(viewportY / tileHeight);
  const rowMax = Math.ceil((viewportY + viewportHeight) / tileHeight);

  // Calculate tileset info once loaded
  const tilesetInfo = useMemo(() => {
    if (!tilesetImage) return null;
    const columns = Math.floor(Number(tilesetImage.width) / tileWidth);
    const rows = Math.floor(Number(tilesetImage.height) / tileHeight);
    return { image: tilesetImage as SkImage, columns, rows };
  }, [tilesetImage, tileWidth, tileHeight]);

  // Calculate visible map tiles (with viewport culling)
  const mapTiles = useMemo(() => {
    if (!mapData.layers?.length || !tilesetInfo) return [];
    const { columns } = tilesetInfo;
    const layer = mapData.layers.find((l: any) => l.type === 'tilelayer');
    if (!layer) return [];

    const cols = mapData.width ?? 0;
    if (cols === 0) return [];

    return layer.data
      .map((tileId: number, index: number) => {
        if (tileId <= 0) return null;

        const sx = ((tileId - 1) % columns) * tileWidth;
        const sy = Math.floor((tileId - 1) / columns) * tileHeight;
        const x = (index % cols) * tileWidth;
        const y = Math.floor(index / cols) * tileHeight;

        const col = x / tileWidth;
        const row = y / tileHeight;

        if (col < colMin || col >= colMax || row < rowMin || row >= rowMax) return null;

        return { tileId, sx, sy, x, y };
      })
      .filter((tile): tile is { tileId: number; sx: number; sy: number; x: number; y: number } => tile !== null);
  }, [mapData, tilesetInfo, tileWidth, tileHeight, colMin, colMax, rowMin, rowMax]);

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.loadingText}>Please check the console for more details.</Text>
        </View>
      </View>
    );
  }

  if (!tilesetImage) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading tileset...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: screenWidth, height: screenHeight }]}>
      <View
        style={[
          styles.canvasContainer,
          {
            width: mapData.width ? mapData.width * tileWidth : screenWidth,
            height: mapData.height ? mapData.height * tileHeight : screenHeight,
          },
        ]}
      >
        <Canvas style={{ flex: 1 }}>
          <Group>
            {mapTiles.map(({ tileId, sx, sy, x, y }) => (
              <SkiaImage
                key={`tile-${x}-${y}`}
                image={tilesetImage}
                x={x}
                y={y}
                width={tileWidth}
                height={tileHeight}
                rect={{ x: sx, y: sy, width: tileWidth, height: tileHeight }}
              />
            ))}
          </Group>
        </Canvas>
      </View>
      {debug && (
        <Text style={styles.debugOverlay}>
          Map: {mapData.width}×{mapData.height} | Tiles: {mapTiles.length}
        </Text>
      )}
    </View>
  );
};

export default MapRenderer;
