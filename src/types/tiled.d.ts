declare module '*.tmj' {
  const value: {
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
      source: string;
    }>;
  };
  export default value;
}

declare module '*.png' {
  const value: any;
  export default value;
}
