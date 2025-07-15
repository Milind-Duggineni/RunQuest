// src/components/dashboard/EquippedItem.tsx

// src/components/dashboard/EquippedItem.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { EquippedItemProps } from '../../types/dashboard';

const getRarityGlow = (rarity: string) => {
  switch (rarity) {
    case 'rare':
      return {
        shadowColor: '#00BFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 8,
      };
    case 'legendary':
      return {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 10,
      };
    default:
      return {};
  }
};

const EquippedItem: React.FC<EquippedItemProps> = ({
  name,
  type,
  rarity,
  image,
}) => {
  // Default item slot icons
  const slotIcons = {
    Weapon: require('../../assets/Background.jpg'),
    Armor: require('../../assets/Background.jpg'),
    Boots: require('../../assets/Background.jpg'),
  };

  return (
    <View style={[styles.equippedItemContainer, getRarityGlow(rarity)]}>
      <View style={styles.itemSlotFrame}>
        <Image
          source={slotIcons[type]}
          style={styles.itemTypeIcon}
        />
        <Image source={image} style={styles.itemImage} />
      </View>
      <Text style={styles.itemName} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  equippedItemContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
    marginVertical: 5,
    padding: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#7f6f4d',
    backgroundColor: 'rgba(58, 45, 29, 0.5)',
  },
  itemSlotFrame: {
    width: 90,
    height: 90,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e0d8c0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  itemTypeIcon: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 25,
    height: 25,
    zIndex: 1,
    opacity: 0.7,
  },
  itemImage: {
    width: '85%',
    height: '85%',
    resizeMode: 'contain',
  },
  itemName: {
    fontSize: 12,
    fontFamily: 'serif',
    color: '#e0d8c0',
    marginTop: 5,
    textAlign: 'center',
    maxWidth: 90,
  },
});

export default EquippedItem;
