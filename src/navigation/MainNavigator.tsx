// src/navigation/MainNavigator.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native'; // Import Platform for conditional styles

// Import screens (ensure these paths are correct for your project)
import Dashboard from '../screens/Dashboard';
import ShopScreen from '../screens/ShopScreen';
import DungeonScreen from '../screens/DungeonScreen';
import ProfileScreen from '../screens/ProfileScreen'; // <<< Import ProfileScreen
import QuestsScreen from '../screens/QuestsScreen';
import SpecialEventsScreen from '../screens/SpecialEventsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const getTabBarIcon = (routeName: string, focused: boolean, color: string, size: number) => {
  let iconName: keyof typeof Ionicons.glyphMap = 'home';

  switch (routeName) {
    case 'Home':
      iconName = focused ? 'home' : 'home-outline';
      break;
    case 'Shop':
      iconName = focused ? 'cart' : 'cart-outline';
      break;
    case 'Dungeon':
      iconName = focused ? 'skull' : 'skull-outline';
      break;
    case 'Profile':
      iconName = focused ? 'person' : 'person-outline';
      break;
    case 'Quests':
      iconName = focused ? 'list' : 'list-outline';
      break;
    case 'SpecialEvents':
      iconName = focused ? 'star' : 'star-outline';
      break;
  }

  return <Ionicons name={iconName} size={size} color={color} />;
};

export default function MainNavigator() {
  console.log('MainNavigator rendered');
  // ADDED LOG TO CHECK PROFILE SCREEN COMPONENT
  console.log('MainNavigator: ProfileScreen component is:', ProfileScreen); 

  return (
    <Tab.Navigator
      initialRouteName="Home" // This line ensures 'Home' is the first tab shown
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => 
          getTabBarIcon(route.name, focused, color, size),
        tabBarActiveTintColor: '#4CAF50', // Green for active tab
        tabBarInactiveTintColor: 'gray',
        headerShown: false, // Hide header for all screens in this navigator
        tabBarStyle: {
          backgroundColor: '#2c3e50', // Darker background to ensure visibility
          borderTopWidth: 2, // Slightly thicker border
          borderTopColor: '#4CAF50', // Green border for distinction
          height: 60, // Fixed height
          position: 'absolute', // This is crucial for consistent positioning
          left: 0,
          right: 0,
          bottom: 0,
        },
      })}
    >
      {/* The order of these Tab.Screen components now only affects the visual order of the tabs in the bar */}
      <Tab.Screen 
        name="SpecialEvents" 
        component={SpecialEventsScreen} 
        options={{ title: 'Events' }}
      />
      <Tab.Screen name="Dungeon" component={DungeonScreen} />
      <Tab.Screen name="Quests" component={QuestsScreen} />
      <Tab.Screen 
        name="Home" 
        component={Dashboard} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen name="Shop" component={ShopScreen} />
      {/* The problematic Profile screen */}
      <Tab.Screen name="Profile" component={ProfileScreen} /> 
    </Tab.Navigator>
  );
}
