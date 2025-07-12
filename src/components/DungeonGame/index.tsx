import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import Svg, { Rect, Circle } from 'react-native-svg';

type Entity = {
  body: Matter.Body;
  size: [number, number];
  color: string;
  renderer: React.ReactElement;
};

const { width, height } = Dimensions.get('window');
const boxSize = 50;
const floorHeight = 40;

const Physics = (entities: any, { time }: { time: { delta: number } }) => {
  const engine = entities.physics.engine as Matter.Engine;
  Matter.Engine.update(engine, time.delta);
  return entities;
};

const createPlayer = (world: Matter.World, pos: { x: number; y: number }) => {
  const body = Matter.Bodies.rectangle(pos.x, pos.y, boxSize, boxSize, {
    label: 'player',
    friction: 0,
    restitution: 0.2,
  });
  Matter.World.add(world, [body]);
  return body;
};

const createFloor = (world: Matter.World) => {
  const floor = Matter.Bodies.rectangle(
    width / 2,
    height - floorHeight / 2,
    width,
    floorHeight,
    { isStatic: true, label: 'floor' }
  );
  Matter.World.add(world, [floor]);
  return floor;
};

const createWall = (world: Matter.World, x: number, y: number, width: number, height: number) => {
  const wall = Matter.Bodies.rectangle(x, y, width, height, {
    isStatic: true,
    label: 'wall',
  });
  Matter.World.add(world, [wall]);
  return wall;
};

const DungeonGame = () => {
  const [isRunning, setIsRunning] = useState(true);
  const engine = useRef<Matter.Engine | null>(null);
  const world = useRef<Matter.World | null>(null);
  const player = useRef<Matter.Body | null>(null);
  const floor = useRef<Matter.Body | null>(null);
  const walls = useRef<Matter.Body[]>([]);
  const entities = useRef<{
    physics: { engine: Matter.Engine; world: Matter.World };
    player: Entity;
    floor: Entity;
    walls: Entity[];
  } | null>(null);

  useEffect(() => {
    // Setup physics engine
    engine.current = Matter.Engine.create({ gravity: { x: 0, y: 0.5 } });
    world.current = engine.current.world;

    // Create game objects
    player.current = createPlayer(world.current, { x: width / 2, y: 100 });
    floor.current = createFloor(world.current);
    
    // Create some walls
    walls.current = [
      createWall(world.current, 50, 200, 20, 200),
      createWall(world.current, width - 50, 300, 20, 200),
      createWall(world.current, width / 2, 400, 200, 20),
    ];

    // Setup entities for GameEngine
    entities.current = {
      physics: { engine: engine.current, world: world.current },
      player: {
        body: player.current,
        size: [boxSize, boxSize],
        color: 'blue',
        renderer: <Rect />,
      },
      floor: {
        body: floor.current,
        size: [width, floorHeight],
        color: 'brown',
        renderer: <Rect />,
      },
      walls: walls.current.map((wall) => ({
        body: wall,
        size: [wall.bounds.max.x - wall.bounds.min.x, wall.bounds.max.y - wall.bounds.min.y],
        color: 'gray',
        renderer: <Rect />,
      })),
    };

    // Cleanup
    return () => {
      if (engine.current) {
        Matter.Engine.clear(engine.current);
      }
    };
  }, []);

  const Renderer = ({ entities }: { entities: Record<string, Entity> }) => {
    return (
      <Svg style={styles.container}>
        {Object.keys(entities).map((key) => {
          const entity = entities[key];
          if (!entity.body) return null;
          
          const { position, bounds } = entity.body;
          const width = bounds.max.x - bounds.min.x;
          const height = bounds.max.y - bounds.min.y;
          const x = position.x - width / 2;
          const y = position.y - height / 2;

          if (entity.renderer.type === Rect) {
            return (
              <Rect
                key={key}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={entity.color}
              />
            );
          } else if (entity.renderer.type === Circle) {
            return (
              <Circle
                key={key}
                cx={position.x}
                cy={position.y}
                r={width / 2}
                fill={entity.color}
              />
            );
          }
          return null;
        })}
      </Svg>
    );
  };

  return (
    <View style={styles.container}>
      {entities.current && (
        <GameEngine
          systems={[Physics]}
          entities={entities.current}
          renderer={Renderer}
          running={isRunning}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
});

export default DungeonGame;
