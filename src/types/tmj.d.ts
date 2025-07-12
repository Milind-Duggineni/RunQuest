declare module '*.tmj' {
  const value: {
    width: number;
    height: number;
    tilewidth: number;
    tileheight: number;
    layers: Array<{
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
    }>;
    tilesets: Array<{
      firstgid: number;
      source: string;
    }>;
  };
  export default value;
}
