// src/screens/ShopScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert, // Added for user feedback (age-appropriate)
} from 'react-native';
import { useAuth } from '../context/AuthContext'; // IMPT: Import useAuth
import { EquippedItem as EquippedItemType } from '../types/dashboard'; // Import EquippedItemType for consistency

const { width } = Dimensions.get('window');

// --- IMPORTANT: REPLACE THESE WITH YOUR ACTUAL LOCAL ASSETS ---
const SHOP_BACKGROUND = require('../assets/Background.jpg'); // Shop background image
const COIN_ICON = require('../assets/Background.jpg');
const XP_BOOST_POTION_ICON = require('../assets/Background.jpg');
const SPEED_BOOST_POTION_ICON = require('../assets/Background.jpg');
const SWORD_ICON = require('../assets/Background.jpg');
const ARMOR_ICON = require('../assets/Background.jpg');
const BOOTS_ICON = require('../assets/Background.jpg');
const RING_ICON = require('../assets/Background.jpg');
const GEM_PACK_ICON = require('../assets/Background.jpg'); // Gem pack icon for premium currency
const PREMIUM_CRATE_ICON = require('../assets/Background.jpg');
const COSMETIC_ICON = require('../assets/Background.jpg');

// --- Interfaces for Shop Items ---
interface StatBoosts {
  health?: number;
  strength?: number;
  agility?: number;
  speed?: number;
}

// InGameShopItem and PremiumShopItem can remain the same if they just define shop data
interface InGameShopItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'boots' | 'ring' | 'potion';
  priceCoins: number;
  statBoosts?: StatBoosts;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  description: string;
  icon: any; // Local asset via require()
}

interface PremiumShopItem {
  id: string;
  name: string;
  type: 'coin_pack' | 'gear_pack' | 'cosmetic';
  priceUSD: string; // e.g., "$0.99"
  description: string;
  icon: any; // Local asset via require()
  coinsAmount?: number; // For coin packs
}

// Interface for player inventory item (simplified for local state, but equipped_items from profile will use EquippedItemType)
interface InventoryItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'boots' | 'ring' | 'potion' | 'cosmetic';
  rarity?: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  statBoosts?: StatBoosts;
  quantity?: number; // Optional, for stackable items like potions
  image?: any; // Add image for inventory display if needed
}


// --- Dummy Data (Can be externalized later or fetched from backend if static) ---
const inGameItems: InGameShopItem[] = [
  {
    id: 'boots-swiftness',
    name: 'Boots of Swiftness',
    type: 'boots',
    priceCoins: 200,
    statBoosts: { speed: 2 },
    rarity: 'Rare',
    description: 'Lightweight boots infused with wind magic, granting extra agility.',
    icon: BOOTS_ICON,
  },
  {
    id: 'xp-potion-small',
    name: 'Small XP Potion',
    type: 'potion',
    priceCoins: 50,
    rarity: 'Common',
    description: 'A basic elixir that grants a small burst of experience.',
    icon: XP_BOOST_POTION_ICON,
  },
  {
    id: 'iron-sword',
    name: 'Iron Sword',
    type: 'weapon',
    priceCoins: 100,
    statBoosts: { strength: 1 },
    rarity: 'Common',
    description: 'A sturdy iron sword, standard issue for new adventurers.',
    icon: SWORD_ICON,
  },
  {
    id: 'leather-armor',
    name: 'Leather Armor',
    type: 'armor',
    priceCoins: 120,
    statBoosts: { health: 5 },
    rarity: 'Common',
    description: 'Basic leather protection, flexible and durable.',
    icon: ARMOR_ICON,
  },
  {
    id: 'ring-of-vitality',
    name: 'Ring of Vitality',
    type: 'ring',
    priceCoins: 350,
    statBoosts: { health: 15 },
    rarity: 'Epic',
    description: 'A glowing ring that subtly enhances the wearer\'s life force.',
    icon: RING_ICON,
  },
  {
    id: 'speed-potion',
    name: 'Speed Potion',
    type: 'potion',
    priceCoins: 75,
    rarity: 'Common',
    description: 'A quick gulp of this grants a temporary burst of speed.',
    icon: SPEED_BOOST_POTION_ICON,
  },
];

const premiumItems: PremiumShopItem[] = [
  {
    id: 'coin-pack-500',
    name: '500 Coins Pack',
    type: 'coin_pack',
    priceUSD: '$0.99',
    description: 'A modest bag of gold coins to aid your journey.',
    icon: COIN_ICON,
    coinsAmount: 500,
  },
  {
    id: 'coin-pack-2500',
    name: '2500 Coins Pack',
    type: 'coin_pack',
    priceUSD: '$4.99',
    description: 'A substantial fortune for serious adventurers.',
    icon: COIN_ICON,
    coinsAmount: 2500,
  },
  {
    id: 'premium-gear-crate',
    name: 'Premium Gear Crate',
    type: 'gear_pack',
    priceUSD: '$9.99',
    description: 'Guaranteed Rare or Epic gear, and a chance for Legendary!',
    icon: PREMIUM_CRATE_ICON,
  },
  {
    id: 'shadow-skin-pack',
    name: 'Shadowfell Cosmetic Pack',
    type: 'cosmetic',
    priceUSD: '$14.99',
    description: 'Unlock exclusive shadowy armor skins and a dark aura effect.',
    icon: COSMETIC_ICON,
  },
];

// --- Item Card Components ---

interface InGameShopItemCardProps {
  item: InGameShopItem;
  currentCoins: number;
  onBuy: (item: InGameShopItem) => void;
  onEquip: (item: EquippedItemType) => void; // Changed to EquippedItemType
  isOwned: boolean; // New prop to indicate if the player already owns this equippable item
}

const InGameShopItemCard: React.FC<InGameShopItemCardProps> = ({ item, currentCoins, onBuy, onEquip, isOwned }) => {
  const canAfford = currentCoins >= item.priceCoins;
  const isEquippable = item.type !== 'potion'; // Potions are consumed, not equipped

  // Determine border color based on rarity
  const rarityBorderColor = {
    'Common': '#888',
    'Rare': '#00BFFF', // Deep Sky Blue
    'Epic': '#9932CC', // Dark Orchid
    'Legendary': '#FFD700', // Gold
  }[item.rarity];

  return (
    <View style={[styles.itemCard, { borderColor: rarityBorderColor }]}>
      <View style={styles.itemCardHeader}>
        <Image source={item.icon} style={styles.itemIcon} />
        <View style={styles.itemTitleContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={[styles.itemRarity, { color: rarityBorderColor }]}>{item.rarity}</Text>
        </View>
      </View>
      <Text style={styles.itemDescription}>{item.description}</Text>

      {item.statBoosts && (
        <View style={styles.statBoostsContainer}>
          {Object.entries(item.statBoosts).map(([stat, value]) => (
            <Text key={stat} style={styles.statBoostText}>
              +{value} {stat.charAt(0).toUpperCase() + stat.slice(1)}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.priceContainer}>
        <Image source={COIN_ICON} style={styles.coinIconSmall} />
        <Text style={styles.itemPrice}>{item.priceCoins}</Text>
      </View>

      <View style={styles.itemActions}>
        {isEquippable && isOwned ? ( // Show "Equipped" or "Equip" if owned
          <TouchableOpacity 
            style={[styles.equipButton, styles.equippedStatusButton]} // Use a different style for equipped status
            onPress={() => onEquip({
              name: item.name,
              type: item.type === 'weapon' ? 'Weapon' : item.type === 'armor' ? 'Armor' : 'Boots',
              rarity: item.rarity.toLowerCase() as EquippedItemType['rarity'],
              image: item.icon // Pass the item's icon as image
            })} // Pass equipped item type to onEquip
          >
            <Text style={styles.equipButtonText}>{isOwned ? 'Equip' : 'Buy to Equip'}</Text>
          </TouchableOpacity>
        ) : isEquippable && !isOwned ? (
            <TouchableOpacity 
                style={[styles.equipButton, styles.equipButtonDisabled]} 
                disabled={true}
            >
                <Text style={styles.equipButtonText}>Equip (Buy First)</Text>
            </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[
            styles.buyButton,
            !canAfford && styles.buyButtonDisabled,
            isEquippable && isOwned && { flex: 0.5, marginLeft: 5 }, // Adjust width if equip button is also shown
            isEquippable && !isOwned && { flex: 1, marginLeft: 0 } // Takes full width if not owned and equip button is disabled
          ]}
          onPress={() => onBuy(item)}
          disabled={!canAfford}
        >
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


interface PremiumShopItemCardProps {
  item: PremiumShopItem;
  onPurchase: (item: PremiumShopItem) => void;
}

const PremiumShopItemCard: React.FC<PremiumShopItemCardProps> = ({ item, onPurchase }) => {
  return (
    <View style={[styles.itemCard, styles.premiumItemCard]}>
      <View style={styles.itemCardHeader}>
        <Image source={item.icon} style={styles.itemIcon} />
        <View style={styles.itemTitleContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemRarity}>{item.type === 'coin_pack' ? `+${item.coinsAmount} Coins` : ''}</Text>
        </View>
      </View>
      <Text style={styles.itemDescription}>{item.description}</Text>

      <View style={styles.priceContainer}>
        <Text style={styles.premiumItemPrice}>{item.priceUSD}</Text>
      </View>

      <TouchableOpacity
        style={styles.premiumPurchaseButton}
        onPress={() => onPurchase(item)}
      >
        <Text style={styles.premiumPurchaseButtonText}>Purchase</Text>
      </TouchableOpacity>
    </View>
  );
};


// --- Main ShopScreen Component ---
const ShopScreen: React.FC = () => {
  const { userProfile, updateUserProfile, isLoading } = useAuth(); // Get userProfile and updateUserProfile
  const [activeTab, setActiveTab] = useState<'inGame' | 'premium'>('inGame');

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Shop...</Text>
      </View>
    );
  }

  // Handle case where userProfile is not yet loaded or doesn't exist
  if (!userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please log in or create a profile to access the shop.</Text>
      </View>
    );
  }

  const playerCoins = userProfile.coins; // Get coins from Supabase profile
  const playerEquippedItems: EquippedItemType[] = userProfile.equipped_items || []; // Get equipped items from Supabase profile

  const handleBuyInGameItem = async (item: InGameShopItem) => {
    if (playerCoins >= item.priceCoins) {
      // Logic for adding to inventory (not yet stored in Supabase, will need a separate table or complex JSON)
      // For now, let's just update coins and alert that it's added
      
      let updatedEquippedItems = [...playerEquippedItems];
      if (item.type !== 'potion') { // If it's equipabble gear
        const newItem: EquippedItemType = {
          name: item.name,
          type: item.type === 'weapon' ? 'Weapon' : item.type === 'armor' ? 'Armor' : 'Boots',
          rarity: item.rarity.toLowerCase() as EquippedItemType['rarity'],
          image: item.icon
        };
        // Check if item of same type is already equipped. If so, replace it.
        const existingItemIndex = updatedEquippedItems.findIndex(eItem => eItem.type === newItem.type);
        if (existingItemIndex > -1) {
          updatedEquippedItems[existingItemIndex] = newItem;
        } else {
          updatedEquippedItems.push(newItem);
        }
      }

      try {
        await updateUserProfile({ 
          coins: playerCoins - item.priceCoins,
          equipped_items: updatedEquippedItems // Save updated equipped items
        });

        Alert.alert(
          'Purchase Successful!',
          `You have purchased ${item.name} for ${item.priceCoins} coins. Your coins: ${playerCoins - item.priceCoins}.`,
          [{ text: 'OK' }]
        );
      } catch (error: any) {
        console.error('Failed to buy item:', error);
        Alert.alert('Error', 'Failed to complete purchase. Please try again: ' + error.message);
      }

    } else {
      Alert.alert(
        'Not Enough Coins',
        `You need ${item.priceCoins} coins to purchase ${item.name}, but you only have ${playerCoins}.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleEquipItem = async (item: EquippedItemType) => {
    // This function assumes item is already owned (or bought).
    // It updates the equipped_items in the user's profile.
    let updatedEquippedItems = [...playerEquippedItems];
    const existingItemIndex = updatedEquippedItems.findIndex(eItem => eItem.type === item.type);

    if (existingItemIndex > -1) {
      // Replace existing item of the same type
      updatedEquippedItems[existingItemIndex] = item;
    } else {
      // Add new item
      updatedEquippedItems.push(item);
    }

    try {
      await updateUserProfile({ equipped_items: updatedEquippedItems });
      Alert.alert(
        'Item Equipped!',
        `You have equipped ${item.name}. Check your Dashboard for updated equipped items!`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Failed to equip item:', error);
      Alert.alert('Error', 'Failed to equip item. Please try again: ' + error.message);
    }
  };

  const handlePurchasePremiumItem = async (item: PremiumShopItem) => {
    Alert.alert(
      'Confirm Purchase',
      `Do you want to purchase ${item.name} for ${item.priceUSD}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Purchase cancelled'),
        },
        {
          text: 'Buy Now',
          onPress: async () => {
            // This is where Stripe/RevenueCat or other in-app purchase SDKs would be integrated.
            // For this demo, we'll simulate a successful purchase and update coins if applicable.
            console.log(`Simulating purchase for ${item.name} (${item.priceUSD})`);

            try {
              if (item.type === 'coin_pack' && item.coinsAmount) {
                await updateUserProfile({ coins: playerCoins + item.coinsAmount });
                Alert.alert(
                  'Purchase Successful!',
                  `You received ${item.coinsAmount} coins! Total coins: ${playerCoins + item.coinsAmount}.`,
                  [{ text: 'OK' }]
                );
              } else {
                // For other premium items, you'd add to inventory or unlock features
                // For now, we'll just alert and log
                Alert.alert(
                  'Purchase Successful!',
                  `${item.name} added to your inventory/unlocks! (Simulated)`,
                  [{ text: 'OK' }]
                );
                // Example of adding to equipped_items for a premium gear pack (assuming it's directly equipped or added to inventory)
                // if (item.type === 'gear_pack') {
                //     const newEquippedItem: EquippedItemType = { name: item.name, type: 'Armor', rarity: 'legendary', image: item.icon };
                //     const updatedEquippedItems = [...playerEquippedItems.filter(e => e.type !== newEquippedItem.type), newEquippedItem];
                //     await updateUserProfile({ equipped_items: updatedEquippedItems });
                // }
              }
            } catch (error: any) {
              console.error('Failed premium purchase:', error);
              Alert.alert('Error', 'Failed to complete premium purchase: ' + error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ImageBackground source={SHOP_BACKGROUND} style={styles.background}>
      <View style={styles.overlay}>
        {/* Top Header: Coin Balance */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Shop</Text>
          <View style={styles.coinBalanceContainer}>
            <Image source={COIN_ICON} style={styles.coinIcon} />
            <Text style={styles.coinBalanceText}>{playerCoins}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'inGame' && styles.tabButtonActive]}
            onPress={() => setActiveTab('inGame')}
          >
            <Image source={COIN_ICON} style={styles.tabIcon} />
            <Text style={styles.tabText}>In-Game Store</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'premium' && styles.tabButtonActive]}
            onPress={() => setActiveTab('premium')}
          >
            {/* You might want a dollar sign icon here */}
            <Text style={styles.tabIcon}>{`💵`}</Text>
            <Text style={styles.tabText}>Premium Store</Text>
          </TouchableOpacity>
        </View>

        {/* Content based on Active Tab */}
        <ScrollView contentContainerStyle={styles.shopContent}>
          {activeTab === 'inGame' ? (
            // In-Game Store Content
            inGameItems.map(item => (
              <InGameShopItemCard
                key={item.id}
                item={item}
                currentCoins={playerCoins}
                onBuy={handleBuyInGameItem}
                onEquip={handleEquipItem}
                isOwned={playerEquippedItems.some(eItem => eItem.name === item.name)} // Check if item is already equipped
              />
            ))
          ) : (
            // Premium Store Content
            premiumItems.map(item => (
              <PremiumShopItemCard
                key={item.id}
                item={item}
                onPurchase={handlePurchasePremiumItem}
              />
            ))
          )}
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay for readability
    paddingTop: Platform.OS === 'android' ? 25 : 50, // Adjust for status bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e0d8c0', // Parchment color
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    fontFamily: 'serif',
  },
  coinBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#FFD700', // Gold border
  },
  coinIcon: {
    width: 25,
    height: 25,
    marginRight: 8,
  },
  coinBalanceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700', // Gold color
    fontFamily: 'serif',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    marginHorizontal: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(50, 40, 30, 0.7)', // Darker background for tabs
    borderWidth: 1,
    borderColor: '#7f6f4d', // Golden stone border
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(80, 60, 40, 0.9)', // Active tab background
    borderBottomWidth: 3,
    borderBottomColor: '#FFD700', // Gold highlight
  },
  tabIcon: {
    fontSize: 20, // For emoji icon, adjust as needed for image icon
    width: 24, // For image icon
    height: 24, // For image icon
    marginRight: 8,
    color: '#e0d8c0', // For emoji icon
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e0d8c0',
    fontFamily: 'serif',
  },
  shopContent: {
    paddingHorizontal: 10,
    paddingBottom: 40,
    alignItems: 'center', // Center cards
  },
  itemCard: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: 'rgba(58, 45, 29, 0.85)', // Dark brown parchment
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  premiumItemCard: {
    borderColor: '#8A2BE2', // Violet border for premium items
    shadowColor: '#8A2BE2',
  },
  itemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#e0d8c0',
    marginRight: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  itemTitleContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e0d8c0',
    fontFamily: 'serif',
  },
  itemRarity: {
    fontSize: 14,
    fontStyle: 'italic',
    fontFamily: 'serif',
    marginTop: 2,
  },
  itemDescription: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 10,
    fontFamily: 'serif',
  },
  statBoostsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  statBoostText: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: 'bold',
    marginRight: 10,
    marginBottom: 5,
    fontFamily: 'serif',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
  coinIconSmall: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700', // Gold color for coin price
    fontFamily: 'serif',
  },
  premiumItemPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8A2BE2', // Violet for real money price
    fontFamily: 'serif',
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  equipButton: {
    flex: 1,
    backgroundColor: '#4e6d5e', // Dark green
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
    borderWidth: 1,
    borderColor: '#3a5c4d',
  },
  equipButtonDisabled: {
    backgroundColor: '#3a4b40', // Grayed out green
    opacity: 0.6,
  },
  equippedStatusButton: { // Style for when item is already equipped
    backgroundColor: '#5a7d6d', // Slightly different green
  },
  equipButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e0d8c0',
    fontFamily: 'serif',
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#8B0000', // Deep red
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
    borderWidth: 1,
    borderColor: '#6a0000',
  },
  buyButtonDisabled: {
    backgroundColor: '#550000', // Darker red when disabled
    opacity: 0.6,
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'serif',
  },
  premiumPurchaseButton: {
    backgroundColor: '#8A2BE2', // Violet for premium purchase
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#BA55D3', // Medium Orchid border
    shadowColor: '#BA55D3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 5,
  },
  premiumPurchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'serif',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: {
    color: '#e0d8c0',
    fontSize: 20,
    fontFamily: 'serif',
  }
});

export default ShopScreen;
