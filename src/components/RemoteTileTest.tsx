import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

const RemoteTileTest: React.FC = () => {
  const imageUrl = 'https://i.imgur.com/Nz3Q3C1.png';
  
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: imageUrl,
          width: 320,
          height: 320,
        }}
        style={styles.image}
        resizeMode="contain"
        onError={(error) => console.error('Image loading error:', error.nativeEvent.error)}
        onLoadStart={() => console.log('Image loading started')}
        onLoadEnd={() => console.log('Image loading finished')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: 320,
    height: 320,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});

export default RemoteTileTest;
