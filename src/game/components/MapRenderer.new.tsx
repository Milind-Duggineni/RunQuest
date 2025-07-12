import React, { memo, useMemo } from 'react';
import { View, Image, Text, ViewStyle, TextStyle, ImageSourcePropType } from 'react-native';

interface TilePosition {
  id: number;
  tileId: number;
  sourceX: number;
  sourceY: number;
  renderX: number;
  renderY: number;
  width: number;
  height: number;
}

interface MapRendererProps {
  tiles: number[];
  widthInTiles: number;
  heightInTiles: number;
  tileSize: number;
  tilesetImage: ImageSourcePropType;
  tilesetColumns: number;
  tilesetImageWidth: number;
  tilesetImageHeight: number;
}

const MapRenderer: React.FC<MapRendererProps> = ({
  tiles = [],
  widthInTiles = 0,
  heightInTiles = 0,
  tileSize = 32,
  tilesetImage,
  tilesetColumns = 0,
  tilesetImageWidth = 0,
  tilesetImageHeight = 0,
}) => {
  // Calculate map dimensions in pixels
  const mapWidth = Math.max(0, widthInTiles * tileSize);
  const mapHeight = Math.max(0, heightInTiles * tileSize);

  // Pre-compute tile positions and source rectangles
  const tileData = useMemo(() => {
    if (!tiles?.length || widthInTiles <= 0 || heightInTiles <= 0 || tileSize <= 0) {
      return [];
    }

    const tilesPerRow = Math.floor(tilesetImageWidth / tileSize);
    if (tilesPerRow <= 0) return [];
    
    return tiles
      .map((tileId, index) => {
        if (tileId <= 0) return null;
        
        const x = index % widthInTiles;
        const y = Math.floor(index / widthInTiles);
        const tileIndex = tileId - 1;
        const sourceX = (tileIndex % tilesPerRow) * tileSize;
        const sourceY = Math.floor(tileIndex / tilesPerRow) * tileSize;
        
        return {
          id: index,
          tileId,
          sourceX,
          sourceY,
          renderX: x * tileSize,
          renderY: y * tileSize,
          width: tileSize,
          height: tileSize
        };
      })
      .filter((tile): tile is TilePosition => tile !== null);
  }, [tiles, widthInTiles, heightInTiles, tileSize, tilesetImageWidth]);

  // Container style
  const containerStyle: ViewStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: mapWidth,
    height: mapHeight,
    backgroundColor: 'black',
    overflow: 'hidden',
  };

  // Error container style
  const errorContainerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  };

  // Error text style
  const errorTextStyle: TextStyle = {
    color: 'red',
    textAlign: 'center',
    marginBottom: 5,
  };

  // Debug overlay style
  const debugOverlayStyle: ViewStyle = {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
    borderRadius: 4,
  };

  // Debug text style
  const debugTextStyle: TextStyle = {
    color: 'white',
    fontSize: 10,
  };

  // Early return if no valid tiles to render
  if (tileData.length === 0) {
    return (
      <View style={containerStyle}>
        <View style={errorContainerStyle}>
          <Text style={errorTextStyle}>No valid tile data to render</Text>
          <Text style={errorTextStyle}>• Check if tile IDs are greater than 0</Text>
          <Text style={errorTextStyle}>• Verify tileset image and dimensions</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {tileData.map((tile) => (
        <View
          key={`tile-${tile.id}`}
          style={{
            position: 'absolute',
            overflow: 'hidden',
            width: tile.width,
            height: tile.height,
            left: tile.renderX,
            top: tile.renderY,
          }}
        >
          <Image
            source={tilesetImage}
            style={{
              width: tilesetImageWidth,
              height: tilesetImageHeight,
              marginLeft: -tile.sourceX,
              marginTop: -tile.sourceY,
            }}
            onError={(e) => {
              console.error('Error loading tile image:', e.nativeEvent.error, {
                tileId: tile.tileId,
                sourceX: tile.sourceX,
                sourceY: tile.sourceY,
                tilesetImage: tilesetImage ? Image.resolveAssetSource(tilesetImage) : null
              });
            }}
            resizeMode="stretch"
          />
        </View>
      ))}
      
      {__DEV__ && (
        <View style={debugOverlayStyle}>
          <Text style={debugTextStyle}>
            {widthInTiles}x{heightInTiles} tiles | {tileData.length} rendered | TileSize: {tileSize}
          </Text>
          <Text style={debugTextStyle}>
            Tileset: {tilesetColumns} cols | {tilesetImageWidth}x{tilesetImageHeight}
          </Text>
        </View>
      )}
    </View>
  );
};

// Simple comparison function for React.memo
function areEqual(prevProps: MapRendererProps, nextProps: MapRendererProps): boolean {
  return (
    prevProps.tiles === nextProps.tiles &&
    prevProps.widthInTiles === nextProps.widthInTiles &&
    prevProps.heightInTiles === nextProps.heightInTiles &&
    prevProps.tileSize === nextProps.tileSize &&
    prevProps.tilesetImage === nextProps.tilesetImage
  );
}

export default memo(MapRenderer, areEqual);
