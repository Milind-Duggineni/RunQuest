// src/screens/SpecialEventsScreen.tsx

// src/screens/SpecialEventsScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Animated, // For subtle particle effects
  Platform, // For cross-platform adjustments if needed
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient for button

const { width, height } = Dimensions.get('window');

// --- IMPORTANT: REPLACE THESE WITH YOUR ACTUAL LOCAL ASSETS ---
const EVENT_BACKGROUND = require('../assets/Background.jpg'); // e.g., an enchanted forest or glowing portal
const BOSS_PORTRAIT = require('../assets/Background.jpg'); // e.g., a dark entity with glowing eyes
const CARD_PARCHMENT_BACKGROUND = require('../assets/Background.jpg'); // New: Specific parchment for the card

// Reward Icons (Re-used or specific to event)
const REWARD_XP_ICON = require('../assets/Background.jpg');
const REWARD_LOOT_ICON = require('../assets/Background.jpg'); // Unique loot icon for event
const REWARD_COIN_ICON = require('../assets/Background.jpg');


// Utility to format time for countdown
const formatTime = (ms: number) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

// --- Reward Interface (Updated to include rarity) ---
interface Reward {
  type: string;
  icon: any;
  rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
}

// Helper to get rarity color for rewards
const getRewardRarityColor = (rarity?: string) => {
  switch (rarity) {
    case 'Common': return '#AAAAAA';
    case 'Uncommon': return '#00FFAA'; // Green
    case 'Rare': return '#007BFF';   // Blue
    case 'Epic': return '#A020F0';   // Purple
    case 'Legendary': return '#FFD700'; // Gold
    default: return '#e0d8c0'; // Default light color if no rarity specified
  }
};

// Main EventScreen Component
const EventScreen: React.FC = () => {
  // Event data (can be fetched from API in a real app)
  const eventData = {
    title: 'The Shadow Invasion',
    endTime: Date.now() + (2 * 24 * 60 * 60 * 1000) + (4 * 60 * 60 * 1000), // Ends in 2 days, 4 hours from now
    objective: 'Run 2km under 12 minutes',
    bossName: 'Lord Malakor',
    rewards: [
      { type: 'XP Boost', icon: REWARD_XP_ICON, rarity: 'Common' },
      { type: 'Blade of Eternal Night', icon: REWARD_LOOT_ICON, rarity: 'Legendary' }, // Example with Legendary loot
      { type: 'Event Coins (x100)', icon: REWARD_COIN_ICON, rarity: 'Uncommon' }, // Example with Uncommon
    ] as Reward[], // Cast to Reward[]
    storyline: "Whispers speak of Lord Malakor, a shadow entity, emerging from the cursed depths. Only the swiftest and bravest can withstand his influence and reclaim our lands. Prepare for an arduous challenge, heroes!",
  };

  const [timeLeft, setTimeLeft] = useState(eventData.endTime - Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(eventData.endTime - Date.now());
      if (timeLeft <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Animated background particles (simple example)
  const particle1Anim = useRef(new Animated.Value(0)).current;
  const particle2Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(particle1Anim, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(particle1Anim, { toValue: 0, duration: 8000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(4000), // Offset start
        Animated.timing(particle2Anim, { toValue: 1, duration: 7000, useNativeDriver: true }),
        Animated.timing(particle2Anim, { toValue: 0, duration: 7000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const particleStyle1 = {
    opacity: particle1Anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.6, 0],
    }),
    transform: [
      {
        translateY: particle1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, height / 2],
        }),
      },
      {
        rotate: particle1Anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  const particleStyle2 = {
    opacity: particle2Anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.5, 0],
    }),
    transform: [
      {
        translateX: particle2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, width / 4],
        }),
      },
      {
        translateY: particle2Anim.interpolate({
          inputRange: [0, 1],
          outputRange: [height / 2, 0],
        }),
      },
    ],
  };


  return (
    <ImageBackground source={EVENT_BACKGROUND} style={styles.background}>
      {/* Magical Particle Effects */}
      <Animated.View style={[styles.particle, styles.particle1, particleStyle1]} />
      <Animated.View style={[styles.particle, styles.particle2, particleStyle2]} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Banner */}
        <View style={styles.bannerContainer}>
          <Text style={styles.bannerText}>Special Event: {eventData.title}</Text>
        </View>

        {/* Event Card */}
        <View style={styles.eventCard}>
          <ImageBackground source={CARD_PARCHMENT_BACKGROUND} style={styles.cardBackground} imageStyle={styles.cardBackgroundImage}>
            <View style={styles.cardContent}>
              {/* Event Title - FONT COLOR GOLD */}
              <Text style={styles.cardTitle}>{eventData.title}</Text>
              {/* Countdown Timer - FONT COLOR BRIGHT RED */}
              <Text style={styles.countdown}>Ends in {timeLeft > 0 ? formatTime(timeLeft) : 'Event Ended!'}</Text>

              <View style={styles.bossSection}>
                <View style={styles.bossPortraitFrame}>
                  <Image source={BOSS_PORTRAIT} style={styles.bossPortrait} resizeMode="cover" />
                  <View style={styles.bossAura} />
                </View>
                <View style={styles.bossInfo}>
                  <Text style={styles.bossName}>{eventData.bossName}</Text>
                  {/* Objective Text - FONT COLOR LIGHT GRAY */}
                  <Text style={styles.objectiveText}>Objective: {eventData.objective}</Text>
                </View>
              </View>

              <Text style={styles.rewardsTitle}>Rewards:</Text>
              <View style={styles.rewardsContainer}>
                {eventData.rewards.map((reward, index) => (
                  <View key={index} style={styles.rewardItem}>
                    <Image source={reward.icon} style={styles.rewardIcon} />
                    {/* Reward Text - FONT COLOR BASED ON RARITY */}
                    <Text style={[styles.rewardText, { color: getRewardRarityColor(reward.rarity) }]}>
                      {reward.type}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={styles.storylineTitle}>Event Story:</Text>
              {/* Storyline Text - FONT COLOR DARKER GRAY / LIGHT GRAY */}
              <Text style={styles.storylineText}>{eventData.storyline}</Text>
            </View>
          </ImageBackground>
        </View>
      </ScrollView>

      {/* Action Buttons with Gradient Background */}
      <View style={styles.buttonContainer}>
        <LinearGradient
          colors={['#4B0082', '#8B0000']} // Deep purple to crimson gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.actionButtonGradient}
        >
          <TouchableOpacity style={styles.actionButton} onPress={() => alert('Joining Event!')}>
            <Text style={styles.actionButtonText}>Join Event</Text>
          </TouchableOpacity>
        </LinearGradient>

        <LinearGradient
          colors={['#4B0082', '#8B0000']} // Deep purple to crimson gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.actionButtonGradient}
        >
          <TouchableOpacity style={styles.actionButton} onPress={() => alert('Viewing Leaderboard!')}>
            <Text style={styles.actionButtonText}>View Leaderboard</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 255, 157, 0.3)', // Green magical glow
    shadowColor: '#00ff9d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
  },
  particle1: {
    top: '10%',
    left: '10%',
  },
  particle2: {
    bottom: '15%',
    right: '20%',
    backgroundColor: 'rgba(100, 100, 255, 0.3)', // Blue magical glow
    shadowColor: '#6464FF',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 30,
    paddingBottom: 120, // Space for buttons
  },
  bannerContainer: {
    backgroundColor: 'rgba(20, 30, 40, 0.7)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#00ff9d', // Glowing green border
    shadowColor: '#00ff9d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    marginBottom: 30,
    elevation: 10,
  },
  bannerText: {
    fontSize: 28,
    fontFamily: 'serif', // Placeholder for fantasy font
    color: '#e0d8c0',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 255, 157, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textAlign: 'center',
  },
  eventCard: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#7f6f4d', // Golden border
    backgroundColor: 'transparent', // Background handled by ImageBackground
    shadowColor: '#FFD700', // Gold glow
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 15,
    marginBottom: 20,
  },
  cardBackground: {
    flex: 1,
    padding: 20,
  },
  cardBackgroundImage: {
    opacity: 0.9, // Adjust opacity of the parchment image
    borderRadius: 12,
  },
  cardContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Slight overlay for readability
    borderRadius: 10,
    padding: 15,
  },
  cardTitle: {
    fontSize: 24,
    fontFamily: 'serif',
    color: '#FFD700', // Dungeon Name: Gold
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // Added for depth
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  countdown: {
    fontSize: 18,
    fontFamily: 'serif',
    color: '#FF5555', // Timer / Countdown: Bright Red
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  bossSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  bossPortraitFrame: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8A2BE2', // Dark violet for boss frame
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#8A2BE2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  bossPortrait: {
    width: '100%',
    height: '100%',
  },
  bossAura: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 60,
    backgroundColor: 'rgba(138, 43, 226, 0.2)', // Semi-transparent violet aura
    // Could add animated pulse here
  },
  bossInfo: {
    flex: 1,
  },
  bossName: {
    fontSize: 20,
    fontFamily: 'serif',
    color: '#8A2BE2', // Dark violet for boss name
    fontWeight: 'bold',
    marginBottom: 5,
  },
  objectiveText: {
    fontSize: 16,
    fontFamily: 'serif',
    color: '#CCCCCC', // Dungeon Description / Objective: Light Gray
    lineHeight: 22,
  },
  rewardsTitle: {
    fontSize: 18,
    fontFamily: 'serif',
    color: '#ffd700', // Changed to gold color for rewards title
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rewardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  rewardItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D4AF37', // Gold border for icons
    marginBottom: 5,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  rewardText: {
    fontSize: 12,
    fontFamily: 'serif',
    textAlign: 'center',
  },
  storylineTitle: {
    fontSize: 18,
    fontFamily: 'serif',
    color: '#ffd700', // Kept this as dark brown as it's a sub-label
    fontWeight: 'bold',
    marginBottom: 10,
  },
  storylineText: {
    fontSize: 14,
    fontFamily: 'serif',
    color: '#E0E0E0', // Dungeon Description / Storyline: Light Gray
    lineHeight: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  actionButtonGradient: { // New style for LinearGradient wrapper
    flex: 1,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFD700', // Gold glow border
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
    marginHorizontal: 5, // Spacing between buttons
    bottom: 30,
    height: 90,
  },
  actionButton: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 8, // Slightly smaller than gradient for inner look
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', // Take full width of gradient container
    height: '100%',
  },
  actionButtonText: {
    fontSize: 18,
    fontFamily: 'serif',
    color: '#FFFFFF', // Action Button Text: White
    fontWeight: 'bold',
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});

export default EventScreen;