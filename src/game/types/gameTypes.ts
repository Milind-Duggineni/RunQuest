import { Body } from 'matter-js';

export interface TilesetData {
  firstgid: number;
  source?: string;
  name?: string;
  type?: string;
  tilewidth: number;
  tileheight: number;
  spacing?: number;
  margin?: number;
  columns: number;
  image: string | number;
  imagewidth: number;
  imageheight: number;
  tilecount?: number;
  tiles?: Record<string, unknown>;
}

export interface LayerData {
  data: number[];
  height: number;
  id: number;
  name: string;
  opacity: number;
  type: string;
  visible: boolean;
  width: number;
  x: number;
  y: number;
}

export interface TileMapData {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: LayerData[];
  tilesets: TilesetData[];
  [key: string]: any; // For any additional properties from Tiled
}

export interface GameEntity {
  body: Body;
  size: { width: number; height: number };
  renderer?: any; // You might want to create a proper type for the renderer
}

export interface GameEntities {
  player: GameEntity;
  map: {
    widthInTiles: number;
    heightInTiles: number;
    tileSize: number;
    tilesetImage: any;
    tilesetColumns: number;
    tilesetImageWidth: number;
    tilesetImageHeight: number;
    layers: any[]; // You might want to create a proper type for layers
  };
  // Add other game entities as needed
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface GameEngineRef {
  current: {
    stop: () => void;
    dispatch: (event: { type: string; [key: string]: any }) => void;
  } | null;
}
