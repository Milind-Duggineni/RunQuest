// src/screens/QuestsScreen.tsx

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
  ActivityIndicator, // For loading state
  Alert, // For user feedback
} from 'react-native';
import { useAuth, QuestData, UserQuestProgress, UserProfile } from '../context/AuthContext'; // Import QuestData and UserQuestProgress
import { supabase } from '../lib/supabase'; // Import supabase instance

const { width, height } = Dimensions.get('window');

// --- IMPORTANT: REPLACE THESE WITH YOUR ACTUAL LOCAL ASSETS ---
const QUEST_BACKGROUND = require('../../assets/Background.jpg'); // e.g., a map, a town square, or an adventurer's camp
const REWARD_XP_ICON = require('../../assets/Background.jpg');
const REWARD_HEALTH_ICON = require('../../assets/Background.jpg');
const REWARD_STRENGTH_ICON = require('../../assets/Background.jpg');
const REWARD_AGILITY_ICON = require('../../assets/Background.jpg');
const REWARD_SPEED_ICON = require('../../assets/Background.jpg');
const REWARD_COIN_ICON = require('../../assets/Background.jpg');
const REWARD_GEAR_ICON = require('../../assets/Background.jpg');
const REWARD_ITEM_PLACEHOLDER = require('../../assets/Background.jpg'); // For generic items


// Helper to get reward icon based on type (if not explicitly provided in stat_rewards)
const getRewardIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'xp': return REWARD_XP_ICON;
    case 'health': return REWARD_HEALTH_ICON;
    case 'strength': return REWARD_STRENGTH_ICON;
    case 'agility': return REWARD_AGILITY_ICON;
    case 'speed': return REWARD_SPEED_ICON;
    case 'coins': return REWARD_COIN_ICON;
    case 'gear': return REWARD_GEAR_ICON;
    case 'rare_item': return REWARD_ITEM_PLACEHOLDER;
    default: return REWARD_ITEM_PLACEHOLDER;
  }
};


// --- QuestCard Component ---
interface QuestCardProps {
  userQuest: UserQuestProgress;
  onComplete: (userQuestId: string, questDetails: QuestData) => void;
  // onUpdateProgress: (userQuestId: string, newProgress: number) => void; // Optional for real progress
}

const QuestCard: React.FC<QuestCardProps> = ({ userQuest, onComplete }) => {
  const quest = userQuest.quests; // Access the nested quest data

  // Determine progress display based on trigger_type
  let progressDisplay = '';
  if (quest.trigger_type === 'distance') {
    progressDisplay = `${userQuest.current_progress.toFixed(1)} / ${quest.trigger_value} km`;
  } else if (quest.trigger_type === 'pace') {
    progressDisplay = `Target Pace: ${quest.trigger_value} min/km`;
    // For pace, current_progress could be user's best pace, or just 'awaiting run'
  } else if (quest.trigger_type === 'repeat' || quest.trigger_type === 'streak') {
    progressDisplay = `${userQuest.current_progress} / ${quest.trigger_value} ${quest.trigger_type}s`;
  } else if (quest.trigger_type === 'boss_fight') {
    progressDisplay = `Defeat Boss: ${userQuest.current_progress} / ${quest.trigger_value}`;
  }

  const handleManualProgress = () => {
    // This is for demonstration. In a real app, this would be updated by game logic (e.g., fitness data)
    Alert.alert(
      "Update Progress (Simulated)",
      "In a real app, your progress would update automatically from your runs or actions!",
      [
        {
          text: "Simulate Progress",
          onPress: () => {
            // For simplicity, let's just complete it for now.
            // A real update would increment current_progress and save it.
            // onUpdateProgress(userQuest.id, userQuest.current_progress + 1); // Example increment
            Alert.alert("Simulated", "Progress has been simulated!");
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };


  return (
    <View style={[styles.questCard, userQuest.is_completed && styles.questCardCompleted]}>
      <View style={styles.questCardHeader}>
        <Text style={styles.questTitle}>{quest.title}</Text>
        {userQuest.is_completed && <Text style={styles.completedText}>COMPLETED</Text>}
      </View>
      <Text style={styles.questDescription}>{quest.description}</Text>
      <Text style={styles.questGoal}>Goal: {progressDisplay}</Text>

      {/* Optional: Class and Zone Requirements */}
      {(quest.class_requirement || quest.zone_requirement) && (
        <View style={styles.requirementsContainer}>
          {quest.class_requirement && <Text style={styles.requirementText}>Class: {quest.class_requirement}</Text>}
          {quest.zone_requirement && <Text style={styles.requirementText}>Zone: {quest.zone_requirement}</Text>}
        </View>
      )}

      <View style={styles.rewardsContainer}>
        <Text style={styles.rewardsLabel}>Rewards:</Text>
        <View style={styles.rewardsIconsRow}>
          {/* Dynamically display rewards from stat_rewards JSONB */}
          {quest.stat_rewards && Object.entries(quest.stat_rewards).map(([key, value]) => (
            <View key={key} style={styles.rewardItem}>
              <Image source={getRewardIcon(key)} style={styles.rewardIcon} />
              <Text style={styles.rewardText}>
                {key === 'rare_item' ? value : `+${value}`} {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {!userQuest.is_completed && (
        <TouchableOpacity style={styles.completeButton} onPress={() => onComplete(userQuest.id, quest)}>
          <Text style={styles.completeButtonText}>Mark As Complete (Simulated)</Text>
        </TouchableOpacity>
      )}
      {/* If you want to show a button for repeatable quests to re-accept */}
      {userQuest.is_completed && quest.is_repeatable && (
          <TouchableOpacity style={styles.resetQuestButton} onPress={() => Alert.alert('Quest Reset', 'This quest is repeatable! It will be available again.')}>
              <Text style={styles.resetQuestButtonText}>Ready for Next Time</Text>
          </TouchableOpacity>
      )}
    </View>
  );
};


// --- QuestScreen Component ---
const QuestScreen: React.FC = () => {
  const { user, userProfile, isLoading, assignInitialQuest, completeQuestAndAwardRewards } = useAuth();
  const [activeUserQuests, setActiveUserQuests] = useState<UserQuestProgress[]>([]);
  const [isQuestsLoading, setIsQuestsLoading] = useState(true);

  // Effect to load active quests or assign a new one if none
  useEffect(() => {
    const loadQuests = async () => {
      if (user && userProfile && !isLoading) {
        setIsQuestsLoading(true);

        // Fetch ALL active (incomplete) quests for the user
        const { data, error } = await supabase
          .from('user_quests')
          .select('*, quests(*)')
          .eq('user_id', user.id)
          .eq('is_completed', false);

        if (error && error.code !== 'PGRST116') {
          console.error('QuestsScreen: Error fetching quests', error);
        }

        let activeQuests: UserQuestProgress[] = data || [];

        // If no quests, try to assign an initial one
        if (activeQuests.length === 0 && userProfile.player_class) {
          await assignInitialQuest();
          const { data: refetched } = await supabase
            .from('user_quests')
            .select('*, quests(*)')
            .eq('user_id', user.id)
            .eq('is_completed', false);
          activeQuests = refetched || [];
        }

        // Parse stat_rewards JSON strings if needed
        activeQuests.forEach(q => {
          if (typeof (q.quests as any)?.stat_rewards === 'string') {
            (q.quests as any).stat_rewards = JSON.parse((q.quests as any).stat_rewards);
          }
        });

        setActiveUserQuests(activeQuests);
        setIsQuestsLoading(false);
      } else if (!isLoading && !user) {
        setIsQuestsLoading(false);
      }
    };
    loadQuests();
  }, [user, userProfile, isLoading, assignInitialQuest]);


  const handleQuestCompletion = async (userQuestId: string, questDetails: QuestData) => {
    Alert.alert(
      'Complete Quest?',
      `Are you sure you want to mark "${questDetails.title}" as complete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsQuestsLoading(true);
            try {
              await completeQuestAndAwardRewards(userQuestId, questDetails);
              // After completion, reload list to reflect changes / new assignments
              const { data: refreshed } = await supabase
                .from('user_quests')
                .select('*, quests(*)')
                .eq('user_id', user!.id)
                .eq('is_completed', false);
              const parsed = (refreshed || []).map(q => {
                if (typeof (q.quests as any)?.stat_rewards === 'string') {
                  (q.quests as any).stat_rewards = JSON.parse((q.quests as any).stat_rewards);
                }
                return q as UserQuestProgress;
              });
              setActiveUserQuests(parsed);
              Alert.alert('Success!', `Quest "${questDetails.title}" completed and rewards awarded!`);
            } catch (error: any) {
              console.error('Error completing quest:', error);
              Alert.alert('Error', 'Failed to complete quest: ' + error.message);
            } finally {
              setIsQuestsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Display loading or messages based on state
  if (isLoading || isQuestsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff9d" />
        <Text style={styles.loadingText}>Loading Quests...</Text>
      </View>
    );
  }

  if (!user || !userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please log in to view your quests.</Text>
      </View>
    );
  }

  if (!userProfile.player_class) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please select a character to receive quests.</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={QUEST_BACKGROUND} style={styles.background}>
      <Text style={styles.screenTitle}>Your Quests</Text>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {activeUserQuests.length > 0 ? (
          activeUserQuests.map(q => (
            <QuestCard key={q.id} userQuest={q} onComplete={handleQuestCompletion} />
          ))
        ) : (
          <View style={styles.noQuestsContainer}>
            <Text style={styles.noQuestsText}>No active quests. Time to explore!</Text>
            {/* If no quests are found, maybe a button to manually assign a basic quest */}
            <TouchableOpacity style={styles.exploreButton} onPress={assignInitialQuest}>
              <Text style={styles.exploreButtonText}>Find New Quests</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* You could add a section for completed quests here by fetching them separately */}
        {/* For example: */}
        {/* <View style={styles.completedQuestsSection}>
            <Text style={styles.completedQuestsTitle}>Completed Quests</Text>
            <Text style={styles.completedQuestItem}>✓ The First Steps</Text>
        </View> */}
      </ScrollView>
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
  scrollViewContent: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#e0d8c0',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 40,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontFamily: 'serif', // Placeholder for fantasy font
  },
  questCard: {
    width: width * 0.9,
    maxWidth: 450,
    backgroundColor: 'rgba(58, 45, 29, 0.8)', // Dark brown/parchment background
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#7f6f4d', // Golden border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  questCardCompleted: {
    opacity: 0.7,
    borderColor: '#4CAF50',
  },
  questCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e0d8c0',
    fontFamily: 'serif',
    flexShrink: 1, // Allow text to wrap
    marginRight: 10,
  },
  completedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  questDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 10,
    lineHeight: 20,
    fontFamily: 'serif',
  },
  questGoal: {
    fontSize: 15,
    color: '#D4AF37', // Gold color for goals
    fontWeight: 'bold',
    marginBottom: 15,
    fontFamily: 'serif',
  },
  requirementsContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#5a4d3d',
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 12,
    color: '#e0d8c0',
    fontFamily: 'serif',
  },
  rewardsContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#5a4d3d', // Darker brown border
  },
  rewardsLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e0d8c0',
    marginBottom: 8,
    fontFamily: 'serif',
  },
  rewardsIconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    // Using Platform.select for 'gap' to ensure compatibility across RN versions.
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
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  rewardText: {
    fontSize: 11,
    color: '#e0d8c0',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'serif',
    maxWidth: 70, // Prevent text from being too wide
  },
  completeButton: {
    backgroundColor: '#4CAF50', // Green for complete
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#388E3C', // Darker green border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'serif',
  },
  resetQuestButton: { // Style for repeatable quest completion notice
    backgroundColor: 'rgba(58, 45, 29, 0.7)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7f6f4d',
    marginTop: 10,
  },
  resetQuestButtonText: {
    fontSize: 14,
    color: '#e0d8c0',
    fontFamily: 'serif',
  },
  noQuestsContainer: {
    marginTop: 50,
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#7f6f4d',
  },
  noQuestsText: {
    fontSize: 18,
    color: '#e0d8c0',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'serif',
  },
  exploreButton: {
    backgroundColor: '#8B0000', // Deep red
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFD700', // Gold glow
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e0d8c0',
    fontFamily: 'serif',
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
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
});

export default QuestScreen;
