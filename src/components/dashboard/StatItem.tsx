// src/components/dashboard/StatItem.tsx

// src/components/dashboard/StatItem.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { StatItemProps } from '../../types/dashboard';

const StatItem: React.FC<StatItemProps> = ({ icon, label, value }) => (
  <View style={styles.statItem}>
    <Image source={icon} style={styles.statIcon} />
    <View style={styles.statTextContainer}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e0d8c0',
  },
  statTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    alignItems: 'baseline',
  },
  statLabel: {
    fontSize: 16,
    fontFamily: 'serif',
    color: '#e0d8c0',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'serif',
    color: '#00ff9d',
    fontWeight: 'bold',
  },
});

export default StatItem;
