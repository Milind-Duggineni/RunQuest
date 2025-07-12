import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface WarriorProps {
  width?: number;
  height?: number;
  x: number;
  y: number;
  direction?: 'left' | 'right';
}

const Warrior: React.FC<WarriorProps> = ({
  width = 48,
  height = 48,
  x,
  y,
  direction = 'right',
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          left: x,
          top: y,
          transform: [{ scaleX: direction === 'left' ? -1 : 1 }],
        },
      ]}
    >
      <Image
        source={require('../assets/Warrior.xml')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default Warrior;
