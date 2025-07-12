// src/screens/QuestComplete.tsx

// src/screens/QuestComplete.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function QuestComplete({ route }) {
  const { questId } = route.params;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quest Complete!</Text>
      <Text style={styles.subtitle}>Quest ID: {questId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
