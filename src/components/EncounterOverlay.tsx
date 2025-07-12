// src/components/EncounterOverlay.tsx
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';

const ENEMY_SPRITE = require('../../assets/Background.jpg');

interface Props {
  visible: boolean;
  combatResult?: string;
  onContinue: () => void;
}

export default function EncounterOverlay({ visible, combatResult, onContinue }: Props) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <Image source={ENEMY_SPRITE} style={styles.enemy} />
      {combatResult && <Text style={styles.result}>{combatResult}</Text>}
      <TouchableOpacity style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enemy: { width: 128, height: 128, marginBottom: 20 },
  result: { fontSize: 20, color: '#fff', marginBottom: 20 },
  button: {
    backgroundColor: '#8B0000',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  buttonText: { color: '#fff', fontSize: 18 },
});
