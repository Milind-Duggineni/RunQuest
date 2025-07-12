declare module '*.png' {
  import { ImageSourcePropType } from 'react-native';
  const value: ImageSourcePropType;
  export default value;
}

// Define the TiledMap interface
export interface TiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: Array<{
    name: string;
    type: string;
    data: number[];
    width: number;
    height: number;
    x: number;
    y: number;
    opacity: number;
    visible: boolean;
  }>;
  tilesets: Array<{
    firstgid: number;
    source?: string;
    image?: string;
    imagewidth?: number;
    imageheight?: number;
    tilewidth: number;
    tileheight: number;
  }>;
}

declare module '*.tmj' {
  import { TiledMap } from './assets';
  const value: TiledMap;
  export default value;
}
