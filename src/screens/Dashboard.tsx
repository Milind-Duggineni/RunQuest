// src/screens/Dashboard.tsx

import React, { useState, useEffect } from 'react'; // Import useState
import {
    StyleSheet,
    View,
    Text,
    Image,
    Dimensions,
    ImageBackground,
    ScrollView,
    TouchableOpacity,
    Modal, // Import Modal component
} from 'react-native';
import { useAuth, UserProfile, InventoryItemType } from '../context/AuthContext'; // IMPT: Import useAuth, UserProfile, and InventoryItemType
import StatItem from '../components/dashboard/StatItem';
import EquippedItem from '../components/dashboard/EquippedItem';

const { width } = Dimensions.get('window');

// Using Background.jpg from the root assets directory as placeholders
const PLACEHOLDER_IMAGE = require('../../assets/Background.jpg');
const BACKGROUND_IMAGE = require('../../assets/Background.jpg');

// Stat icons - IMPORTANT: Replace with actual assets (e.g., specific icons for health, strength etc.)
const statIcons = {
    health: require('../../assets/Background.jpg'), // e.g., require('../../assets/icons/health_icon.png')
    strength: require('../../assets/Background.jpg'), // e.g., require('../../assets/icons/strength_icon.png')
    agility: require('../../assets/Background.jpg'), // e.g., require('../../assets/icons/agility_icon.png')
    speed: require('../../assets/Background.jpg'), // e.g., require('../../assets/icons/speed_icon.png')
};

const calculateXpProgress = (current: number, total: number) => {
    return (total > 0) ? (current / total) * 100 : 0;
};

const Dashboard = () => {
    const { userProfile, isLoading, user, updateUserProfile } = useAuth(); // Added updateUserProfile for equip/unequip
    const [isItemsModalVisible, setItemsModalVisible] = useState(false); // State for modal visibility

    // Inventory manipulation helpers
    const equipItem = async (item: InventoryItemType, index: number) => {
        if (!userProfile) return;
        // Remove from inventory and add to equipped_items
        const newInventory = [...(userProfile.inventory || [])];
        newInventory.splice(index, 1);
        const newEquipped = [...(userProfile.equipped_items || []), item];
        try {
            await updateUserProfile({ inventory: newInventory, equipped_items: newEquipped });
            setItemsModalVisible(false); // optional: close modal after equip
        } catch (e) {
            console.error('Dashboard: Failed to equip item', e);
        }
    };

    const unequipItem = async (index: number) => {
        if (!userProfile) return;
        const item = userProfile.equipped_items[index];
        const newEquipped = [...userProfile.equipped_items];
        newEquipped.splice(index, 1);
        const newInventory = [...(userProfile.inventory || []), item];
        try {
            await updateUserProfile({ inventory: newInventory, equipped_items: newEquipped });
        } catch (e) {
            console.error('Dashboard: Failed to unequip item', e);
        }
    };

    // NOW USING: Inventory items from userProfile (will be empty if userProfile is not loaded or inventory is empty)
    // Ensure userProfile and userProfile.inventory exist before accessing
    const inventoryItems: InventoryItemType[] = userProfile?.inventory || [];

    // Show loading or prompt for login if data isn't ready
    if (isLoading || !userProfile) { // Check userProfile here to ensure it's loaded
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading Dashboard...</Text>
            </View>
        );
    }

    // If there's a user but no profile (e.g., very first login before character selection or profile creation delay)
    if (user && !userProfile) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>No player profile found. Please complete character creation.</Text>
                {/* You might want a button here to navigate to CharacterSelection explicitly */}
            </View>
        );
    }

    // If no user at all, this screen shouldn't typically be reached but as a fallback
    if (!user) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Please log in to view your dashboard.</Text>
            </View>
        );
    }

    // Use data from userProfile once it's loaded
    const xpProgress = calculateXpProgress(
        userProfile.current_xp,
        userProfile.xp_to_next_level
    );

    return (
        <ImageBackground source={BACKGROUND_IMAGE} style={styles.background}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {/* Top Section: Class, Level, XP Bar */}
                <View style={styles.topPanel}>
                    <Text style={styles.classText}>{userProfile.player_class || 'Adventurer'}</Text>
                    <Text style={styles.levelText}>Level {userProfile.level || 1}</Text>
                    <View style={styles.xpBarBackground}>
                        <View
                            style={[styles.xpBarProgress, { width: `${xpProgress}%` }]}
                        />
                        <Text style={styles.xpText}>
                            {userProfile.current_xp} / {userProfile.xp_to_next_level} XP
                        </Text>
                    </View>
                </View>

                {/* Center Section: Character Render & Stats */}
                <View style={styles.centerSection}>
                    <View style={styles.characterDisplayFrame}>
                        <Image
                            source={PLACEHOLDER_IMAGE} // Replace with actual character render
                            style={styles.characterImage}
                            resizeMode="contain"
                        />
                        <View style={styles.runeEffect} />
                    </View>

                    <View style={styles.statsPanel}>
                        <Text style={styles.statsTitle}>Stats</Text>
                        <StatItem
                            icon={statIcons.health}
                            label="Health"
                            value={userProfile.health}
                        />
                        <StatItem
                            icon={statIcons.strength}
                            label="Strength"
                            value={userProfile.strength}
                        />
                        <StatItem
                            icon={statIcons.agility}
                            label="Agility"
                            value={userProfile.agility}
                        />
                        <StatItem
                            icon={statIcons.speed}
                            label="Speed"
                            value={userProfile.speed}
                        />
                    </View>
                </View>

                {/* Equipped Items Section */}
                <View style={styles.equippedItemsSection}>
                    <Text style={styles.sectionTitle}>Equipped Items</Text>
                    <View style={styles.itemsRow}>
                        {(userProfile.equipped_items || []).map((item: any, index: number) => (
                            <View key={index} style={styles.equippedWrapper}>
                                <EquippedItem
                                    name={item.name || 'Unknown Item'}
                                    type={item.type || 'Weapon'}
                                    rarity={item.rarity || 'common'}
                                    image={item.image || PLACEHOLDER_IMAGE}
                                />
                                <TouchableOpacity style={styles.removeIcon} onPress={() => unequipItem(index)}>
                                    <Text style={styles.removeIconText}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                        {(userProfile.equipped_items && userProfile.equipped_items.length === 0) && (
                            <Text style={styles.noItemsText}>No items equipped yet!</Text>
                        )}
                    </View>
                </View>

                {/* New: View My Items Button */}
                <TouchableOpacity
                    style={styles.viewItemsButton}
                    onPress={() => setItemsModalVisible(true)}
                >
                    <Text style={styles.viewItemsButtonText}>View My Items</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Items Modal */}
            <Modal
                animationType="fade" // Use fade animation for a smoother transition
                transparent={true}
                visible={isItemsModalVisible}
                onRequestClose={() => setItemsModalVisible(false)} // Android back button handling
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Your Inventory</Text>
                        <ScrollView style={styles.inventoryList}>
                            {inventoryItems.length > 0 ? (
                                inventoryItems.map((item, index) => (
                                    <TouchableOpacity key={index} style={styles.inventoryItem} onPress={() => equipItem(item, index)}>
                                        <Text style={styles.inventoryItemName}>{item.name} (x{item.quantity})</Text>
                                        <Text style={styles.inventoryItemDescription}>{item.description}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={styles.noItemsText}>Your inventory is empty!</Text>
                            )}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setItemsModalVisible(false)}
                        >
                            <Text style={styles.closeModalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingTop: 60,
        paddingBottom: 80, // INCREASED this padding to ensure space for the 60px height nav bar + some margin
        alignItems: 'center',
    },
    topPanel: {
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#7f6f4d',
        width: '90%',
    },
    classText: {
        fontSize: 24,
        fontFamily: 'serif',
        color: '#e0d8c0',
        fontWeight: 'bold',
        textShadowColor: '#3a2d1d',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    levelText: {
        fontSize: 18,
        fontFamily: 'serif',
        color: '#00ff9d',
        marginBottom: 5,
    },
    xpBarBackground: {
        width: '100%',
        height: 20,
        backgroundColor: '#3a4b40',
        borderRadius: 10,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#7f6f4d',
    },
    xpBarProgress: {
        height: '100%',
        backgroundColor: '#00ff9d',
        borderRadius: 10,
        position: 'absolute',
        left: 0,
    },
    xpText: {
        fontSize: 12,
        color: '#e0d8c0',
        fontWeight: 'bold',
        zIndex: 1,
    },
    centerSection: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '90%',
        marginBottom: 30,
    },
    characterDisplayFrame: {
        width: width * 0.45,
        height: width * 0.45,
        borderRadius: (width * 0.45) / 2,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 3,
        borderColor: '#7f6f4d',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 15,
        elevation: 10,
    },
    characterImage: {
        width: '120%',
        height: '120%',
        position: 'absolute',
        bottom: -20,
    },
    runeEffect: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: (width * 0.45) / 2,
        borderWidth: 2,
        borderColor: 'rgba(0, 255, 157, 0.3)',
    },
    statsPanel: {
        backgroundColor: 'rgba(58, 45, 29, 0.7)',
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#7f6f4d',
        padding: 15,
        width: width * 0.4,
        shadowColor: '#00ff9d',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
    },
    statsTitle: {
        fontSize: 20,
        fontFamily: 'serif',
        color: '#e0d8c0',
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        textShadowColor: '#3a2d1d',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    equippedItemsSection: {
        width: '90%',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#7f6f4d',
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'serif',
        color: '#e0d8c0',
        fontWeight: 'bold',
        marginBottom: 15,
        textShadowColor: '#3a2d1d',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    equippedWrapper: {
        position: 'relative',
    },
    removeIcon: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeIconText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        lineHeight: 14,
    },
    itemsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        flexWrap: 'wrap',
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
    },
    noItemsText: {
        color: '#ccc',
        fontSize: 14,
        marginTop: 10,
        textAlign: 'center',
    },
    // Styles for View My Items Button
    viewItemsButton: {
        backgroundColor: '#8B4513', // A rustic brown
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        marginTop: 20,
        borderWidth: 2,
        borderColor: '#D2B48C', // Lighter brown for border
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8, // For Android shadow
    },
    viewItemsButtonText: {
        color: '#FFD700', // Gold color for text
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'serif',
        textShadowColor: '#3a2d1d',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    // Styles for Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dark semi-transparent overlay
    },
    modalContent: {
        backgroundColor: '#3a2d1d', // Darker rustic background for modal
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#7f6f4d',
        padding: 25,
        width: '85%',
        maxHeight: '70%',
        shadowColor: '#00ff9d',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 15,
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: 'serif',
        color: '#e0d8c0',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    inventoryList: {
        flexGrow: 1, // Allow scrolling if content overflows
        maxHeight: '80%', // Limit height of the scroll view
    },
    inventoryItem: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#7f6f4d',
    },
    inventoryItemName: {
        color: '#FFD700', // Gold for item name
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'serif',
    },
    inventoryItemDescription: {
        color: '#ccc',
        fontSize: 12,
        marginTop: 5,
    },
    closeModalButton: {
        backgroundColor: '#8B4513', // Rustic brown
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 20,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: '#D2B48C',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    closeModalButtonText: {
        color: '#e0d8c0',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'serif',
    },
});

export default Dashboard;
