import React, { useEffect, useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { View, StyleSheet, Text, ActivityIndicator, Dimensions } from 'react-native';
import MapRenderer from '../game/components/MapRenderer';

console.log('🔄 ShadowfellCryptMap module loaded');

const { width, height } = Dimensions.get('window');

// Simple map data structure
interface TMJLayer {
  data: number[];
  width?: number;
  height?: number;
  type?: string;
}

interface TMJMapData {
  width: number;
  height: number;
  tilewidth?: number;
  tileheight?: number;
  layers: TMJLayer[];
}

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

export interface ShadowfellCryptMapProps {
  tileset: any; // Can be require() result or URL string
  mapData: MapData;
  tileWidth?: number;
  tileHeight?: number;
  playerPosition?: { x: number; y: number };
  onError?: (error: string) => void;
  width?: number;
  height?: number;
}

const ShadowfellCryptMap: React.FC<ShadowfellCryptMapProps> = ({
  tileset,
  mapData: initialMapData,
  tileWidth: propTileWidth = 32,
  tileHeight: propTileHeight = 32,
  playerPosition = { x: 0, y: 0 },
  onError,
  width: propWidth = width,
  height: propHeight = height
}) => {
  console.log('🎬 ShadowfellCryptMap: Component mounting');
  const [mapData, setMapData] = useState<MapData | null>(initialMapData || null);
  const [tilesetImage, setTilesetImage] = useState<any>(tileset || null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialMapData || !tileset);

  // Log state changes
  useEffect(() => {
    console.log('📊 ShadowfellCryptMap state updated:', {
      isLoading,
      hasError: !!error,
      hasTileset: !!tilesetImage,
      hasMapData: !!mapData,
      mapData: mapData ? `Map ${mapData.width}x${mapData.height}` : 'No map data',
    });
  }, [isLoading, error, tilesetImage, mapData]);

  // Preload assets using expo-asset
  const preloadAssets = useCallback(async () => {
    console.log('🔍 [Map] Starting asset preloading...');
    try {
      // Preload all required assets
      const assetPromises = [
        Asset.loadAsync(require('../assets/catacombs_tileset.png')),
      ];
      
      console.log('📦 [Map] Starting asset loading...');
      await Promise.all(assetPromises);
      console.log('✅ [Map] All assets preloaded successfully');
      setAssetsLoaded(true);
    } catch (error) {
      console.error('🚨 [Map] Failed to preload assets:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    console.log('🔍 ShadowfellCryptMap: Starting effect to load assets');
    
    const loadMap = async () => {
      console.log('🧩 [Map] Asset loader entered');
      try {
        console.log('⏳ Setting loading state to true');
        setIsLoading(true);
        setError(null);
        
        // Preload assets first
        await preloadAssets();
        
        // Load the tileset image using expo-asset
        console.log('📦 [Map] Loading tileset image...');
        try {
          const tilesetAsset = Asset.fromModule(require('../assets/catacombs_tileset.png'));
          await tilesetAsset.downloadAsync();
          
          console.log('✅ [Map] Tileset loaded successfully:', {
            uri: tilesetAsset.localUri || tilesetAsset.uri,
            width: tilesetAsset.width || 'unknown',
            height: tilesetAsset.height || 'unknown'
          });
          setTilesetImage(tilesetAsset);
        } catch (tilesetError: unknown) {
          const errorMessage = tilesetError instanceof Error ? tilesetError.message : 'Unknown error';
          console.error('🚨 [Map] Failed to load tileset:', tilesetError);
          throw new Error(`Failed to load tileset: ${errorMessage}`);
        }
        
        // Load and parse the TMJ map data
        console.log('🗺️ [Map] Loading map data...');
        let rawMapData;
        try {
          rawMapData = require('../assets/catacombs.tmj.json');
          console.log('✅ [Map] Map data loaded successfully:', {
            width: rawMapData.width,
            height: rawMapData.height,
            layers: rawMapData.layers?.length || 0,
            tileSize: `${rawMapData.tilewidth || 32}x${rawMapData.tileheight || 32}`
          });
        } catch (mapError: unknown) {
          const errorMessage = mapError instanceof Error ? mapError.message : 'Unknown error';
          console.error('🚨 [Map] Failed to load map data:', mapError);
          throw new Error(`Failed to load map data: ${errorMessage}`);
        }
        
        // Validate required fields
        if (!rawMapData.width || !rawMapData.height || !rawMapData.layers) {
          throw new Error('Invalid TMJ map data: missing required fields');
        }
        
        // Convert TMJ data to our format
        const convertedMapData: MapData = {
          width: rawMapData.width,
          height: rawMapData.height,
          tileWidth: rawMapData.tilewidth || 32,
          tileHeight: rawMapData.tileheight || 32,
          layers: rawMapData.layers.map((layer: TMJLayer) => ({
            data: layer.data,
            width: layer.width || rawMapData.width,
            height: layer.height || rawMapData.height,
          })),
        };
        
        console.log('📝 Setting map data state');
        setMapData(convertedMapData);
        console.log('✨ Assets loaded and state updated');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Error loading map:', {
          message: errorMessage,
          error: error
        });
        setError(errorMessage);
        setMapData(null);
        setTilesetImage(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();
  }, []);

  console.log('🔄 ShadowfellCryptMap: Rendering with state:', {
    isLoading,
    hasError: !!error,
    hasTileset: !!tilesetImage,
    hasMapData: !!mapData
  });

  if (isLoading || !assetsLoaded) {
    console.log('⏳ [Map] Rendering loading state', { isLoading, assetsLoaded });
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading map assets...</Text>
        <Text style={styles.debugText}>
          {assetsLoaded ? 'Assets loaded, initializing...' : 'Preloading assets...'}
        </Text>
      </View>
    );
  }

  if (error) {
    console.log('❌ Rendering error state:', error);
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: 'red' }]}>Error: {error}</Text>
        <Text style={styles.loadingText}>Please check the console for more details.</Text>
      </View>
    );
  }

  if (!tilesetImage || !mapData) {
    const errorMsg = !tilesetImage ? 'Tileset image not loaded' : 'Map data not loaded';
    console.log('❌ Rendering missing data state:', errorMsg);
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: 'red' }]}>{errorMsg}</Text>
      </View>
    );
  }

  console.log('✨ [Map] Asset loader completed successfully');
  console.log('🎨 [Map] Rendering MapRenderer with tileset and map data');
  return (
    <View style={styles.container}>
      <MapRenderer
        tileset={tilesetImage}
        mapData={mapData}
        tileWidth={mapData.tileWidth}
        tileHeight={mapData.tileHeight}
        playerPosition={{ x: 0, y: 0 }}
        onError={(error: string) => {
          console.error('MapRenderer error:', error);
          setError(error);
        }}
      />
    </View>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    marginTop: 10,
    fontSize: 16,
  },
  debugText: {
    color: '#aaaaaa',
    marginTop: 5,
    fontSize: 12,
  },
});

export default ShadowfellCryptMap;
