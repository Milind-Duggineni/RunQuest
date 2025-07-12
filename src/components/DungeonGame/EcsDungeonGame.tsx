import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import EcsGameManager from '../../game/ecs/EcsGameManager';

const { width, height } = Dimensions.get('window');

interface EcsDungeonGameProps {
  onStepDetected?: () => void;
}

const EcsDungeonGame: React.FC<EcsDungeonGameProps> = ({ onStepDetected }) => {
  const gameManagerRef = useRef<EcsGameManager | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize the ECS game manager
    gameManagerRef.current = new EcsGameManager({
      canvas: canvasRef.current,
      width,
      height,
    });
    
    // Start the game loop
    gameManagerRef.current.start();
    
    // Clean up on unmount
    return () => {
      gameManagerRef.current?.dispose();
      gameManagerRef.current = null;
    };
  }, []);
  
  // Handle step detection from pedometer
  useEffect(() => {
    if (onStepDetected) {
      gameManagerRef.current?.onStepDetected();
    }
  }, [onStepDetected]);
  
  return (
    <View style={styles.container}>
      <canvas
        ref={canvasRef}
        style={styles.canvas}
        width={width}
        height={height}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  canvas: {
    width: '100%',
    height: '100%',
  },
});

export default EcsDungeonGame;
