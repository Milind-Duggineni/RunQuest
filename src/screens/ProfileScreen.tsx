// src/screens/ProfileScreen.tsx

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
  Alert, // For confirmation modals (replace with custom modal later)
  TextInput, // For editable fields
  Modal, // For change password modal
  Switch, // For toggle settings
} from 'react-native';
import { useAuth, UserProfile } from '../context/AuthContext'; // IMPT: Import useAuth and UserProfile

const { width } = Dimensions.get('window');

// --- IMPORTANT: REPLACE THESE WITH YOUR ACTUAL LOCAL ASSETS ---
const PROFILE_BACKGROUND = require('../../assets/Background.jpg'); // e.g., a serene player home, a character portrait background
const USER_ICON = require('../../assets/Background.jpg'); // Placeholder for user/profile icon
const EMAIL_ICON = require('../../assets/Background.jpg'); // Placeholder for email icon
const LOCK_ICON = require('../../assets/Background.jpg');   // Placeholder for lock/password icon
const GOOGLE_FIT_ICON = require('../../assets/Background.jpg'); // Placeholder for Google Fit icon
const APPLE_HEALTH_ICON = require('../../assets/Background.jpg'); // Placeholder for Apple Health icon
const BELL_ICON = require('../../assets/Background.jpg');   // Placeholder for notification icon
const LOCATION_ICON = require('../../assets/Background.jpg'); // Placeholder for location icon
const LOGOUT_ICON = require('../../assets/Background.jpg'); // Placeholder for logout icon
const DELETE_ICON = require('../../assets/Background.jpg'); // Placeholder for delete account icon

const ProfileScreen: React.FC = () => {
  // Add a console log here to check if the component function is being called
  console.log('--- ProfileScreen component function is being executed ---');

  const { user, userProfile, isLoading, signOut, updateUserProfile, fetchUserProfile } = useAuth(); // Get user, profile, and update/fetch functions
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(userProfile?.username || ''); // Initialize with actual profile username
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Effect to update local state if userProfile changes from AuthContext
  useEffect(() => {
    if (userProfile) {
      setNewUsername(userProfile.username);
    }
  }, [userProfile]);

  // Handle loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No profile data available. Please log in or create a profile.</Text>
      </View>
    );
  }


  // --- Handlers for Profile Sections ---

  const handleUpdateUsername = async () => {
    if (newUsername.trim() === '') {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }
    Alert.alert(
      'Confirm Username Change',
      `Change username from "${userProfile.username}" to "${newUsername}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateUserProfile({ username: newUsername.trim() }); // Update username in Supabase
              setIsEditingUsername(false);
              Alert.alert('Success', 'Username updated!');
            } catch (error: any) { // Catch potential errors from updateUserProfile
              console.error('Failed to update username:', error);
              Alert.alert('Error', 'Failed to update username. Please try again: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    Alert.alert(
      'Change Password',
      'Are you sure you want to change your password?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              // This part would ideally use supabase.auth.updateUser({ password: newPassword })
              // However, Supabase's `updateUser` requires re-authentication for password changes.
              // For simplicity in this demo, we'll simulate it. In production, securely handle current password verification.
              console.log('Simulating password change...');
              Alert.alert('Success', 'Your password has been changed (simulated).');
              setIsPasswordModalVisible(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmNewPassword('');
            } catch (error: any) { // Catch potential errors from simulated API call
              console.error('Error changing password:', error);
              Alert.alert('Error', 'Failed to change password. Please try again: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const toggleServiceLink = async (service: 'GoogleFit' | 'AppleHealth') => {
    const isLinkedKey = `is_${service.toLowerCase()}_linked` as keyof UserProfile;
    const currentStatus = userProfile[isLinkedKey] as boolean; // Ensure type is boolean

    Alert.alert(
      'Link Service',
      `Do you want to ${currentStatus ? 'unlink' : 'link'} ${service}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: currentStatus ? 'Unlink' : 'Link',
          onPress: async () => {
            try {
              await updateUserProfile({ [isLinkedKey]: !currentStatus } as Partial<UserProfile>);
              Alert.alert('Success', `${service} has been ${currentStatus ? 'unlinked' : 'linked'}.`);
            } catch (error: any) {
              console.error(`Failed to toggle ${service} link:`, error);
              Alert.alert('Error', `Failed to update ${service} link. Please try again: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const toggleNotifications = async () => {
    const currentStatus = userProfile.notifications_enabled;
    Alert.alert(
      'Notification Settings',
      `Do you want to ${currentStatus ? 'disable' : 'enable'} notifications?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: currentStatus ? 'Disable' : 'Enable',
          onPress: async () => {
            try {
              await updateUserProfile({ notifications_enabled: !currentStatus });
              Alert.alert('Success', `Notifications are now ${currentStatus ? 'disabled' : 'enabled'}.`);
            } catch (error: any) {
              console.error('Failed to toggle notifications:', error);
              Alert.alert('Error', 'Failed to update notification settings. Please try again: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleLocationPermissions = async () => {
    const currentStatus = userProfile.location_permission_granted;
    Alert.alert(
      'Location Permissions',
      `Your current setting is: ${currentStatus ? 'Granted' : 'Denied'}. Do you want to adjust permissions?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open App Settings',
          onPress: async () => {
            console.log('Navigating to app settings for location permissions...');
            Alert.alert('Info', 'Please manually adjust location permissions in your device settings.');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          onPress: async () => {
            try {
              await signOut();
              Alert.alert('Logged Out', 'You have been successfully logged out.');
            } catch (error: any) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to log out. Please try again: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'WARNING: This action is permanent and cannot be undone. Are you absolutely sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Simulating account deletion...');
              Alert.alert('Account Deleted (Simulated)', 'Your account has been permanently deleted (simulated).');
            } catch (error: any) {
              console.error('Error during account deletion:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again: ' + error.message);
            }
          },
        },
      ]
    );
  };

  const ProfileRow: React.FC<{
    icon: any;
    label: string;
    value?: string;
    onPress?: () => void;
    isDestructive?: boolean;
    hasToggle?: boolean;
    toggleValue?: boolean;
    onToggle?: (value: boolean) => void;
  }> = ({ icon, label, value, onPress, isDestructive, hasToggle, toggleValue, onToggle }) => (
    <TouchableOpacity
      style={[styles.profileRow, isDestructive && styles.destructiveRow]}
      onPress={onPress}
      disabled={!onPress && !hasToggle}
      activeOpacity={onPress || hasToggle ? 0.7 : 1}
    >
      <View style={styles.rowContent}>
        {icon && <Image source={icon} style={styles.rowIcon} />}
        <View style={styles.textContainer}>
          <Text style={styles.rowLabel}>{label}</Text>
          {value && <Text style={styles.rowValue}>{value}</Text>}
        </View>
        {hasToggle && onToggle && (
          <Switch
            trackColor={{ false: "#767577", true: "#4CAF50" }}
            thumbColor={toggleValue ? "#f4f3f4" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={onToggle}
            value={toggleValue}
          />
        )}
        {!hasToggle && onPress && <Text style={styles.arrowIcon}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <ImageBackground source={PROFILE_BACKGROUND} style={styles.background}>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.screenTitle}>Account Profile</Text>

          {/* User Info Section */}
          <View style={styles.sectionCard}>
            <ProfileRow
              icon={USER_ICON}
              label="Username"
              value={userProfile.username}
              onPress={() => setIsEditingUsername(true)}
            />
            {isEditingUsername && (
              <View style={styles.editInputContainer}>
                <TextInput
                  style={styles.editInput}
                  value={newUsername}
                  onChangeText={setNewUsername}
                  placeholder="New Username"
                  placeholderTextColor="#888"
                />
                <TouchableOpacity style={styles.saveButton} onPress={handleUpdateUsername}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => {
                    setIsEditingUsername(false);
                    setNewUsername(userProfile.username); // Reset on cancel
                }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
            <ProfileRow icon={EMAIL_ICON} label="Email" value={userProfile.email} />
            <ProfileRow
              icon={LOCK_ICON}
              label="Change Password"
              onPress={() => setIsPasswordModalVisible(true)}
            />
          </View>

          {/* Linked Services Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Linked Services</Text>
            <ProfileRow
              icon={GOOGLE_FIT_ICON}
              label="Link Google Fit"
              value={userProfile.is_google_fit_linked ? 'Linked' : 'Not Linked'}
              hasToggle={true}
              toggleValue={userProfile.is_google_fit_linked}
              onToggle={() => toggleServiceLink('GoogleFit')}
            />
            <ProfileRow
              icon={APPLE_HEALTH_ICON}
              label="Link Apple Health"
              value={userProfile.is_apple_health_linked ? 'Linked' : 'Not Linked'}
              hasToggle={true}
              toggleValue={userProfile.is_apple_health_linked}
              onToggle={() => toggleServiceLink('AppleHealth')}
            />
          </View>

          {/* Permissions/Settings Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Settings</Text>
            <ProfileRow
              icon={BELL_ICON}
              label="Notifications"
              value={userProfile.notifications_enabled ? 'Enabled' : 'Disabled'}
              hasToggle={true}
              toggleValue={userProfile.notifications_enabled}
              onToggle={toggleNotifications}
            />
            <ProfileRow
              icon={LOCATION_ICON}
              label="Location Permissions"
              value={userProfile.location_permission_granted ? 'Granted' : 'Denied'}
              onPress={handleLocationPermissions}
            />
          </View>

          {/* Account Actions Section */}
          <View style={styles.sectionCard}>
            <ProfileRow
              icon={LOGOUT_ICON}
              label="Log Out"
              onPress={handleLogout}
              isDestructive={false}
            />
            <ProfileRow
              icon={DELETE_ICON}
              label="Delete Account"
              onPress={handleDeleteAccount}
              isDestructive={true}
            />
          </View>
        </ScrollView>
      </View>

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPasswordModalVisible}
        onRequestClose={() => setIsPasswordModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Current Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setIsPasswordModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleChangePassword}
              >
                <Text style={styles.buttonText}>Change</Text>
              </TouchableOpacity>
            </View>
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
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Dark overlay
    paddingTop: Platform.OS === 'android' ? 25 : 50,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 40, // Keep some padding at the bottom for content, but let tab bar handle its own space
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e0d8c0',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    fontFamily: 'serif',
    marginBottom: 30,
  },
  sectionCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(58, 45, 29, 0.85)', // Dark parchment
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#7f6f4d', // Golden border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden', // Ensures inner borders don't spill
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37', // Gold for section headers
    fontFamily: 'serif',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomWidth: 1,
    borderBottomColor: '#5a4d3d',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  destructiveRow: {
    backgroundColor: 'rgba(139,0,0,0.7)', // Dark red for destructive actions
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    width: 28,
    height: 28,
    tintColor: '#e0d8c0', // Parchment tint
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    color: '#e0d8c0',
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  rowValue: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: 'serif',
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 20,
    color: '#e0d8c0',
    marginLeft: 10,
  },
  editInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  editInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 5,
    padding: 10,
    color: '#fff',
    fontSize: 14,
    marginRight: 10,
    fontFamily: 'serif',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginRight: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#888',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalView: {
    width: '85%',
    maxWidth: 350,
    backgroundColor: 'rgba(58, 45, 29, 0.95)', // Dark parchment
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7f6f4d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e0d8c0',
    marginBottom: 20,
    fontFamily: 'serif',
  },
  modalInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'serif',
    borderWidth: 1,
    borderColor: '#5a4d3d',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 100,
  },
  modalButtonCancel: {
    backgroundColor: '#888',
    borderColor: '#777',
    marginRight: 10,
  },
  modalButtonSave: {
    backgroundColor: '#4CAF50',
    borderColor: '#388E3C',
    marginLeft: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'serif',
  },
  loadingContainer: { // Added for loading state
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingText: { // Added for loading state
    color: '#e0d8c0',
    fontSize: 20,
    fontFamily: 'serif',
  },
});

export default ProfileScreen;
