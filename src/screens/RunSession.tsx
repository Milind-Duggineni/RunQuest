// src/screens/RunSession.tsx

// c:\Users\duggi\OneDrive\RunQuest\RunQuest\src\screens\RunSession.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RunSession() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Run Session</Text>
      {/* Add your run session UI here */}
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
    marginBottom: 20,
  },
});