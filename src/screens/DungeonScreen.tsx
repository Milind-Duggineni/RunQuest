// src/screens/DungeonScreen.tsx
import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native'; // Add this import
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { Dungeon } from '../services/dungeonService';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  Platform, // Used for gap property compatibility
} from 'react-native';

const { width, height } = Dimensions.get('window');

// --- IMPORTANT: REPLACE THESE WITH YOUR ACTUAL LOCAL ASSETS ---
// Ensure your image files exist at these relative paths in your project.
const DUNGEON_BACKGROUND = require('../assets/Background.jpg'); // Dungeon background image
const REWARD_GOLD_ICON = require('../assets/Background.jpg'); // Gold coin icon
const REWARD_GEAR_ICON = require('../assets/Background.jpg'); // Armor or weapon icon
const REWARD_XP_ICON = require('../assets/Background.jpg'); // XP icon

// Placeholder dungeon portal images (replace with unique art for each type)
const DUNGEON_PORTAL_FIRE = require('../assets/Background.jpg'); // Glowing lava portal
const DUNGEON_PORTAL_ICE = require('../assets/Background.jpg'); // Ancient ice gate
const DUNGEON_PORTAL_SHADOW = require('../assets/Background.jpg'); // Dark, shadowy gate
const DUNGEON_PORTAL_VINE = require('../assets/Background.jpg'); // Overgrown vine portal

// Extend the Dungeon type for UI purposes
interface UIDungeon extends Dungeon {
  image: any;
  rewards: { type: string; icon: any; value?: number | string }[];
  difficultyModifier: number;
}

// --- DungeonCard Component ---
interface DungeonCardProps {
  dungeon: Dungeon;
  onEnter: (dungeonId: string) => void;
}

const DungeonCard: React.FC<{ dungeon: UIDungeon; onEnter: (id: string) => void }> = ({ dungeon, onEnter }) => {
  const getGlowColor = (level: number) => {
    if (level < 5) return '#00ff9d'; // Green glow
    if (level < 10) return '#ffd700'; // Gold glow
    return '#ff4500'; // Orange-red glow for high levels
  };

  const glowStyle = {
    shadowColor: getGlowColor(dungeon.level),
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 12,
  };

  return (
    <View style={[styles.dungeonCard, glowStyle]}>
      <ImageBackground source={dungeon.image} style={styles.cardImage}>
        <View style={styles.cardOverlay}>
          <Text style={styles.dungeonName}>{dungeon.name}</Text>
          <Text style={styles.dungeonDescription}>{dungeon.description}</Text>

          <View style={styles.rewardsPreview}>
            <Text style={styles.rewardsTitle}>Rewards:</Text>
            <View style={styles.rewardsIconsRow}>
              {dungeon.rewards.map((reward: { type: string; icon: any; value?: number | string }, idx: number) => (
                <View key={idx} style={styles.rewardItem}>
                  <Image source={reward.icon} style={styles.rewardIcon} />
                  {reward.value && <Text style={styles.rewardValue}>{reward.value}</Text>}
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.enterDungeonButton} onPress={() => onEnter(dungeon.id)}>
            <Text style={styles.enterDungeonButtonText}>Enter Dungeon</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
};


// --- DungeonScreen Component ---
const DungeonScreen: React.FC = () => {
  const navigation = useNavigation();
  const [dungeons, setDungeons] = useState<UIDungeon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dungeons from Supabase when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const fetchDungeons = async () => {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('dungeons')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            throw error;
          }

          setDungeons(data || []);
          setError(null);
        } catch (err) {
          console.error('Error fetching dungeons:', err);
          setError('Failed to load dungeons. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      fetchDungeons();

      // Set up real-time subscription for dungeons
      const subscription = supabase
        .channel('dungeons')
        .on('postgres_changes', 
          { 
            event: '*',
            schema: 'public',
            table: 'dungeons' 
          }, 
          (payload) => {
            console.log('Dungeon change received!', payload);
            fetchDungeons();
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    }, [])
  );

  const handleEnterDungeon = async (id: string) => {
    try {
      console.log(`Entering dungeon: ${id}`);
      const selectedDungeon = dungeons.find(d => d.id === id);
      if (selectedDungeon) {
        // @ts-ignore - Navigation type will be inferred from the navigation prop
        navigation.navigate('DungeonGame', {
          dungeonId: id,
          dungeonName: selectedDungeon.name
        });
      }
      
      // In a real game, you might want to update the dungeon status or track progress here
    } catch (err) {
      console.error('Error entering dungeon:', err);
    }
  };

  if (loading) {
    return (
      <ImageBackground source={DUNGEON_BACKGROUND} style={[styles.background, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading dungeons...</Text>
      </ImageBackground>
    );
  }

  if (error) {
    return (
      <ImageBackground source={DUNGEON_BACKGROUND} style={[styles.background, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => setLoading(true)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={DUNGEON_BACKGROUND} style={styles.background}>
      <Text style={styles.screenTitle}>Available Dungeons</Text>
      {dungeons.length === 0 ? (
        <View style={[styles.centerContent, { flex: 1 }]}>
          <Text style={styles.noDungeonsText}>No dungeons available. Check back later!</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dungeonsScrollViewContent}
        >
          {dungeons.map((dungeon) => (
            <DungeonCard 
              key={dungeon.id}
              dungeon={{
                ...dungeon,
                image: DUNGEON_PORTAL_FIRE, // Use a default image or map from dungeon type
                rewards: dungeon.rewards.map(reward => ({
                  ...reward,
                  icon: reward.type === 'Gold' ? REWARD_GOLD_ICON : 
                        reward.type === 'Gear' ? REWARD_GEAR_ICON : REWARD_XP_ICON
                })),
                difficultyModifier: dungeon.difficulty_modifier
              }}
              onEnter={handleEnterDungeon}
            />
          ))}
        </ScrollView>
      )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  noDungeonsText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#e0d8c0', // Parchment color
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginBottom: 20,
    marginTop: 40, // Give some space from top status bar
    fontFamily: 'serif', // Fantasy font placeholder
  },
  dungeonsScrollViewContent: {
    paddingHorizontal: width * 0.05, // Padding on sides for partial card view
    alignItems: 'center', // Center cards vertically
    paddingBottom: 40, // Space at the bottom
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    justifyContent: 'flex-end',
  },
  cardOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
    width: '100%',
  },
  dungeonCard: {
    width: width * 0.85,
    height: height * 0.6,
    marginHorizontal: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
  },
  dungeonName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e0d8c0',
    marginBottom: 5,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontFamily: 'serif',
  },
  dungeonDescription: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
    fontFamily: 'serif',
  },
  rewardsPreview: {
    width: '100%',
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D4AF37', // Gold for rewards section
  },
  rewardsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37', // Gold text
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  rewardsIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    // FIX: Using Platform.select for 'gap' to ensure compatibility across RN versions.
    // If you are on RN 0.71+ you can remove this and just use 'gap: 10,' directly.
    ...(Platform.OS === 'ios' || Platform.OS === 'android' ? { gap: 10 } : {
      marginHorizontal: -5, // Half of gap to balance spacing
      marginBottom: -10, // To compensate for vertical margin on items
    }),
  },
  rewardItem: {
    alignItems: 'center',
    ...(Platform.OS === 'ios' || Platform.OS === 'android' ? {} : { // Only add if gap isn't supported
      marginHorizontal: 5,
      marginBottom: 10,
    }),
  },
  rewardIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: '#e0d8c0',
  },
  rewardValue: {
    fontSize: 12,
    color: '#e0d8c0',
    marginTop: 2,
    fontFamily: 'serif',
  },
  enterDungeonButton: {
    backgroundColor: '#8B0000', // Deep red for action
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFD700', // Gold glow border
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
    marginTop: 15,
  },
  enterDungeonButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e0d8c0', // Parchment color
    textShadowColor: 'rgba(255,215,0,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    fontFamily: 'serif',
  },
});

export default DungeonScreen;
