import { Component, RefObject } from 'react';
import { GameEngine as BaseGameEngine, GameEngineProperties } from 'react-native-game-engine';

declare module 'react-native-game-engine' {
  class GameEngine extends Component<GameEngineProperties> {
    start: () => void;
    stop: () => void;
    swap: (entities: any) => void;
    dispatch: (event: any) => void;
    context: any;
    engine: any;
  }
}

export type GameEngine = InstanceType<typeof GameEngine>;
export type GameEngineRef = RefObject<GameEngine>;
