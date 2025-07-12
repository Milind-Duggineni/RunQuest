// src/components/dashboard/NavigationBar.tsx

// src/components/dashboard/NavigationBar.tsx
import React from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet } from 'react-native';

// Import navigation icons
const navIcons = {
  home: require('../../../assets/Background.jpg'),
  shop: require('../../../assets/Background.jpg'),
  dungeon: require('../../../assets/Background.jpg'),
  profile: require('../../../assets/Background.jpg'),
  quests: require('../../../assets/Background.jpg'),
  event: require('../../../assets/Background.jpg'),
};

const NavigationBar = () => {
  const navItems = [
    { id: 'home', label: 'Home', icon: navIcons.home },
    { id: 'shop', label: 'Shop', icon: navIcons.shop },
    { id: 'dungeon', label: 'Dungeon', icon: navIcons.dungeon },
    { id: 'profile', label: 'Profile', icon: navIcons.profile },
    { id: 'quests', label: 'Quests', icon: navIcons.quests },
    { id: 'event', label: 'Event', icon: navIcons.event, isSpecial: true },
  ];

  const handlePress = (id: string) => {
    // Navigation logic will be implemented here
    console.log(`Navigating to ${id}`);
  };

  return (
    <View style={styles.navigationBar}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={[styles.navItem, item.isSpecial && styles.specialNavItem]}
          onPress={() => handlePress(item.id)}
        >
          <Image
            source={item.icon}
            style={[
              styles.navIcon,
              item.isSpecial && styles.specialNavIcon,
            ]}
          />
          <Text
            style={[
              styles.navText,
              item.isSpecial && styles.specialNavText,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    height: 70,
    backgroundColor: 'rgba(20, 30, 40, 0.9)',
    borderTopWidth: 2,
    borderTopColor: '#7f6f4d',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#00ff9d',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 15,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  specialNavItem: {
    // Additional styles for special navigation items like events
  },
  navIcon: {
    width: 30,
    height: 30,
    tintColor: '#e0d8c0',
    marginBottom: 3,
  },
  specialNavIcon: {
    tintColor: '#8a2be2', // Purple tint for special event icon
  },
  navText: {
    fontSize: 10,
    fontFamily: 'serif',
    color: '#e0d8c0',
  },
  specialNavText: {
    color: '#8a2be2', // Purple text for special event
  },
});

export default NavigationBar;
