// src/screens/CharacterSelection.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  Image,
  Platform // Used for gap property compatibility
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext'; // IMPT: Import useAuth
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

const image = require('../assets/Background.jpg'); // Background image for welcome screen
// Using background image for all placeholders
const DEFAULT_CHARACTER_IMAGE = image;


// Defined a proper interface for Character data
interface CharacterData {
  id: number;
  name: string;
  role: string;
  description: string;
  stats: string;
  playstyle: string;
  // If you have specific images per character, add:
  // image: any; // Use 'any' for require() images
}

// Aligned navigation prop type to NativeStackNavigationProp
type CharacterSelectionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CharacterSelection'>;

// Character data with descriptions and a placeholder image property
const characters: CharacterData[] = [
  {
    id: 1,
    name: 'Warrior',
    role: 'Tank',
    description: 'The Warrior is a resilient fighter who excels at protecting allies. With high defense and health, they can withstand heavy damage while keeping enemies focused on them.',
    stats: 'High HP, High Defense, Melee Combat',
    playstyle: 'Frontline protector who controls the battlefield',
    // image: warriorImage, // Example if you have specific images
  },
  {
    id: 2,
    name: 'Ranger',
    role: 'Ranged DPS',
    description: 'The Ranger is a master of ranged combat, using bows and nature magic to attack from a distance. They excel at dealing consistent damage while staying out of harm\'s way.',
    stats: 'High Ranged Damage, Medium Mobility, Traps',
    playstyle: 'Versatile damage dealer with crowd control',
    // image: rangerImage,
  },
  {
    id: 3,
    name: 'Rogue',
    role: 'Melee DPS',
    description: 'The Rogue specializes in quick, precise strikes and stealth. They can deal massive burst damage and disable key targets before they become a threat.',
    stats: 'High Burst Damage, High Mobility, Stealth',
    playstyle: 'Sneaky assassin who picks off key targets',
    // image: rogueImage,
  },
  {
    id: 4,
    name: 'Druid',
    role: 'Healer',
    description: 'The Druid harnesses the power of nature to heal allies and control the battlefield. They can shift forms to adapt to different situations in combat.',
    stats: 'Healing, Support Buffs, Versatile Forms',
    playstyle: 'Adaptive support with healing and utility',
    // image: druidImage,
  },
  {
    id: 5,
    name: 'Monk',
    role: 'Support',
    description: 'The Monk uses disciplined techniques to enhance allies and weaken enemies. They combine martial arts with spiritual energy to control the flow of battle.',
    stats: 'Balanced Stats, Crowd Control, Buffs/Debuffs',
    playstyle: 'Mobile support with crowd control',
    // image: monkImage,
  },
];

const CharacterSelection = () => {
  const navigation = useNavigation<CharacterSelectionScreenNavigationProp>();
  const { user, updateUserProfile, userProfile } = useAuth(); // IMPT: Get user and updateUserProfile
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState<number>(0);
  const [userName, setUserName] = useState<string>(userProfile?.username || ''); // Pre-fill if profile exists
  const [userAge, setUserAge] = useState<string>(userProfile?.age?.toString() || ''); // Pre-fill if profile exists
  const [allowGPS, setAllowGPS] = useState<boolean>(userProfile?.location_permission_granted ?? true); // Pre-fill or default
  const [allowNotifications, setAllowNotifications] = useState<boolean>(userProfile?.notifications_enabled ?? true); // Pre-fill or default
  const [allowHealthData, setAllowHealthData] = useState<boolean>(userProfile?.is_google_fit_linked ?? true); // Using Google Fit as proxy for 'Health Data'

  // Update local state if userProfile changes (e.g., if user navigates back)
  React.useEffect(() => {
    if (userProfile) {
      setUserName(userProfile.username);
      setUserAge(userProfile.age?.toString() || '');
      setAllowGPS(userProfile.location_permission_granted);
      setAllowNotifications(userProfile.notifications_enabled);
      setAllowHealthData(userProfile.is_google_fit_linked || userProfile.is_apple_health_linked); // Use either for 'Health Data'
    }
  }, [userProfile]);

  const handleContinue = async () => {
    if (!user) {
      console.error('No user found to save character data!');
      alert('You must be logged in to create a character.'); // Use alert only for temporary debugging
      navigation.navigate('Welcome');
      return;
    }

    if (!userName.trim() || !userAge.trim()) {
      alert('Please enter your name and age.');
      return;
    }

    try {
      const selectedChar = characters[selectedCharacterIndex];
      const ageNum = parseInt(userAge);

      // Save character selection and user data to Supabase
      await updateUserProfile({
        username: userName.trim(),
        age: ageNum,
        player_class: selectedChar.name,
        // Update initial stats based on class if you want, otherwise keep AuthContext defaults
        // health: selectedChar.name === 'Warrior' ? 120 : 100, // Example
        location_permission_granted: allowGPS,
        notifications_enabled: allowNotifications,
        // Assuming 'allowHealthData' maps to Google Fit linking for simplicity
        is_google_fit_linked: allowHealthData,
        // is_apple_health_linked: false, // If separate toggle is not provided
      });

      console.log('Character Selected and Profile Updated:', selectedChar.name);

      // After character selection, navigate to the appropriate screen based on auth state
      // Since this is part of the auth flow, we'll use the Main route which will handle the navigation
      navigation.navigate('Main'); // Navigate to the MainNavigator which will handle the rest

    } catch (error: any) {
      console.error('Error during character selection and profile save:', error);
      alert('Failed to save character. Please try again.'); // User-friendly alert
      navigation.navigate('Welcome');
    }
  };

  // Defined CharacterCardProps interface for type safety
  interface CharacterCardProps {
    character: CharacterData;
    isSelected: boolean;
    onPress: () => void;
  }
  const CharacterCard: React.FC<CharacterCardProps> = ({ character, isSelected, onPress }) => (
    <TouchableOpacity
      style={[styles.cardContainer, isSelected && styles.selectedCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.characterImageContainer}>
        {/* Using DEFAULT_CHARACTER_IMAGE for now. Replace with character.image if available. */}
        <Image
          source={DEFAULT_CHARACTER_IMAGE}
          style={styles.characterImage}
          resizeMode="cover"
        />
      </View>
      <Text style={styles.characterName}>{character.name}</Text>
      <Text style={styles.characterRole}>{character.role}</Text>
    </TouchableOpacity>
  );

  const selectedCharacter = characters[selectedCharacterIndex];

  // PermissionItem component is correctly typed already.

  return (
    <ImageBackground source={image} style={styles.background}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Choose Your Character</Text>

          <View style={styles.characterGrid}>
            {characters.map((character, index) => (
              <CharacterCard
                key={character.id}
                character={character}
                isSelected={selectedCharacterIndex === index}
                onPress={() => setSelectedCharacterIndex(index)}
              />
            ))}
          </View>

          <View style={styles.characterInfoContainer}>
            <View style={styles.characterInfo}>
              <Text style={styles.characterNameLarge}>{selectedCharacter.name}</Text>
              <Text style={styles.characterRoleLarge}>{selectedCharacter.role}</Text>
              <Text style={styles.characterDescription}>{selectedCharacter.description}</Text>
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Stats:</Text>
                <Text style={styles.statsText}>{selectedCharacter.stats}</Text>
              </View>
              <Text style={styles.playstyleTitle}>Playstyle:</Text>
              <Text style={styles.playstyleText}>{selectedCharacter.playstyle}</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>Your Information</Text>
              <TextInput
                style={styles.input}
                placeholder="Your Name"
                value={userName}
                onChangeText={setUserName}
                placeholderTextColor="#888"
              />
              <TextInput
                style={styles.input}
                placeholder="Your Age"
                value={userAge}
                onChangeText={setUserAge}
                keyboardType="numeric"
                placeholderTextColor="#888"
              />

              {/* Using the corrected PermissionItem component */}
              <PermissionItem
                text="Allow GPS Tracking"
                isChecked={allowGPS}
                onToggle={() => setAllowGPS(!allowGPS)}
              />
              <PermissionItem
                text="Enable Notifications"
                isChecked={allowNotifications}
                onToggle={() => setAllowNotifications(!allowNotifications)}
              />
              <PermissionItem
                text="Share Health Data"
                isChecked={allowHealthData}
                onToggle={() => setAllowHealthData(!allowHealthData)}
              />

              <TouchableOpacity
                style={[styles.continueButton, (!userName || !userAge) && styles.continueButtonDisabled]}
                onPress={handleContinue}
                disabled={!userName || !userAge}
              >
                <Text style={styles.continueButtonText}>Begin Your Adventure as {selectedCharacter.name}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  characterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    // FIX: Using Platform.select for 'gap' to ensure compatibility across RN versions.
    // If you are on RN 0.71+ you can remove this and just use 'gap: 15,' directly.
    ...(Platform.OS === 'ios' || Platform.OS === 'android' ? { gap: 15 } : {
      marginHorizontal: -7.5, // Half of gap to balance spacing
      marginBottom: -15, // To compensate for vertical margin on items
    }),
    marginBottom: 20,
  },
  cardContainer: {
    width: 120,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...(Platform.OS === 'ios' || Platform.OS === 'android' ? {} : { // Only add if gap isn't supported
      marginHorizontal: 7.5,
      marginBottom: 15,
    }),
  },
  selectedCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  characterImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1, // Added border for clarity
    borderColor: '#eee', // Light border
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  characterName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  characterRole: {
    color: '#bbb',
    fontSize: 12,
    textAlign: 'center',
  },
  characterInfoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 20, // Using gap here too
    justifyContent: 'space-between',
  },
  characterInfo: {
    flex: 1,
    minWidth: 300, // Ensure it takes enough width on larger screens
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
  },
  characterNameLarge: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  characterRoleLarge: {
    color: '#4CAF50',
    fontSize: 16,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  characterDescription: {
    color: '#eee',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  statsContainer: {
    marginBottom: 15,
  },
  statsTitle: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statsText: {
    color: '#ddd',
    fontSize: 13,
    lineHeight: 18,
  },
  playstyleTitle: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  playstyleText: {
    color: '#ddd',
    fontSize: 13,
    fontStyle: 'italic',
  },
  formContainer: {
    flex: 1,
    minWidth: 300, // Ensure it takes enough width on larger screens
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
    borderWidth: 1, // Added border
    borderColor: '#444', // Dark border
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  toggleText: {
    color: '#fff',
    flex: 1,
    fontSize: 14,
  },
  toggle: {
    width: 50,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: '#4CAF50',
  },
  toggleOff: {
    backgroundColor: '#666',
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  toggleCircleOn: {
    transform: [{ translateX: 24 }], // Move to the right
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  continueButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkboxText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  permissionText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
});

// A separate component for the PermissionItem to use the toggle logic correctly
// This avoids duplicating the toggle styles
const PermissionItem = ({ text, isChecked, onToggle }: { text: string; isChecked: boolean; onToggle: () => void }) => (
  <TouchableOpacity
    style={styles.toggleContainer} // Reusing toggleContainer for layout
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <Text style={styles.toggleText}>{text}</Text>
    <View
      style={[styles.toggle, isChecked ? styles.toggleOn : styles.toggleOff]}
    >
      <View style={[styles.toggleCircle, isChecked && styles.toggleCircleOn]} />
    </View>
  </TouchableOpacity>
);

// FIX: Ensure CharacterSelection is the default export
export default CharacterSelection;
