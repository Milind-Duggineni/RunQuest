// src/components/ScreenContentWrapper.tsx
import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

const ScreenContentWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ImageBackground
      source={require('../assets/Background.jpg')} // Make sure this path is correct
      style={styles.background}
    >
      {children}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
});

export default ScreenContentWrapper;
