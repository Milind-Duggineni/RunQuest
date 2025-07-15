// src/screens/Signup.tsx

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  ImageBackground,
  Keyboard,
  TouchableWithoutFeedback,
  Alert, // Using Alert for user feedback
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types'; // Assuming you have this for navigation types


const { width, height } = Dimensions.get('window');
const image = require('../assets/Background.jpg'); // Sign-up background image

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignUp'>;

type Props = {
  navigation: SignUpScreenNavigationProp;
};

export default function SignUp({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, isLoading } = useAuth(); // Get signUp, isLoading from AuthContext
  // Removed userProfile, user from destructuring as they are not used for direct navigation here anymore

  // Firefly animation logic (can be extracted to a separate hook/component)
  const fireflies = Array(15).fill(null).map(() => ({
    position: new Animated.ValueXY({
      x: Math.random() * width,
      y: Math.random() * height,
    }),
    opacity: new Animated.Value(0),
  }));

  useEffect(() => {
    const animationHandles: Animated.CompositeAnimation[] = [];
    fireflies.forEach((firefly) => {
      const animate = () => {
        const animation = Animated.parallel([
          Animated.sequence([
            Animated.timing(firefly.opacity, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(firefly.opacity, {
              toValue: 0.3, // Subtle fade out
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(firefly.position, {
            toValue: {
              x: Math.random() * width,
              y: Math.random() * height,
            },
            duration: 4000,
            useNativeDriver: true,
          }),
        ]);
        animation.start(() => animate()); // Loop the animation
        animationHandles.push(animation);
      };
      animate();
    });

    return () => {
      animationHandles.forEach(animation => animation.stop()); // Cleanup animations
    };
  }, []);

  // Removed the useEffect that handled navigation here.
  // RootNavigator will now solely manage navigation based on AuthContext state.


  const handleSignUp = async () => {
    console.log('Sign up button pressed');
    try {
      // Input validation
      if (!email || !username || !password || !confirmPassword) {
        Alert.alert('Error', 'Please fill in all fields.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', "Passwords don't match.");
        return;
      }

      console.log('Attempting to sign up with:', { email, username });
      await signUp(email, password, username); // Call signUp function from AuthContext
      console.log('Sign up successful. RootNavigator will handle navigation based on auth state.');
      // NO explicit navigation.replace() here. RootNavigator takes over.

    } catch (error: any) {
      console.error('Sign up error:', error);
      Alert.alert('Sign Up Failed', error.message || 'An unknown error occurred during sign up.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <LinearGradient colors={['#0a0f1c', '#0a1f1a', '#103b32']} style={styles.background} />
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
        >
          {/* Render Fireflies */}
          {fireflies.map((firefly, index) => (
            <Animated.View
              key={index}
              style={[
                styles.firefly,
                {
                  transform: firefly.position.getTranslateTransform(),
                  opacity: firefly.opacity,
                },
              ]}
            />
          ))}
          <ImageBackground source={image} resizeMode="cover" style={styles.image}>
            <View style={styles.formContainer}>
              <Text style={styles.title}>SIGN UP</Text>
              <Text style={styles.subtitle}>Begin Your Quest</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#88a8a4"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#88a8a4"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#88a8a4"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#88a8a4"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={{ color: '#88a8a4', textAlign: 'right' }}>
                    {showPassword ? ' Hide Password' : ' Show Password'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Creating Account...' : 'Begin the Adventure'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>Return to Main Gate</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  firefly: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7fff00',
    shadowColor: '#7fff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  formContainer: {
    padding: 20,
    alignItems: 'center',
    width: '90%', // Adjust width for better responsiveness
    maxWidth: 400, // Max width for larger screens
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00ff9d',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: '#00ff9d',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#006644',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%', // Make button take full width of container
  },
  buttonDisabled: {
    backgroundColor: '#003322', // Darker green for disabled
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold', // Added font weight for consistency
  },
  backButton: {
    marginTop: 10,
  },
  backButtonText: {
    color: '#00ff9d',
    fontSize: 14,
  },
});
