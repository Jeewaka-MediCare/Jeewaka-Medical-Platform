import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  TouchableOpacity,
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScaleAnim1 = useRef(new Animated.Value(0.5)).current;
  const buttonScaleAnim2 = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    console.log('Landing page animation starting...');
    
    // Reset values to ensure clean start
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    buttonScaleAnim1.setValue(0.5);
    buttonScaleAnim2.setValue(0.5);
    
    // Start main content animations
    const mainAnimations = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]);

    mainAnimations.start(() => {
      console.log('Main animations completed');
      
      // Start button animations after main content
      Animated.sequence([
        Animated.spring(buttonScaleAnim1, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScaleAnim2, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log('All animations completed');
      });
    });
  }, []);

  const handleSignIn = () => {
    router.push('/login');
  };

  const handleCreateAccount = () => {
    router.push('/register');
  };

  return (
    <ImageBackground 
      source={require('../assets/images/background.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.subtitle}>Your Health, Our Priority</Text>
        </Animated.View>

      {/* Medical Image */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop' }}
          style={styles.medicalImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Welcome Message */}
      <Animated.View
        style={[
          styles.welcomeContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Text style={styles.welcomeTitle}>Welcome Back!</Text>
        <Text style={styles.welcomeText}>
          We're excited to see you again. Please sign in to continue your healthcare journey.
        </Text>
      </Animated.View>

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <Animated.View
          style={[
            styles.buttonWrapper,
            {
              opacity: fadeAnim,
              transform: [{ scale: buttonScaleAnim1 }]
            }
          ]}
        >
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn}>
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.buttonWrapper,
            {
              opacity: fadeAnim,
              transform: [{ scale: buttonScaleAnim2 }]
            }
          ]}
        >
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCreateAccount}>
            <Text style={styles.secondaryButtonText}>Create New Account</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent overlay for better text readability
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF', // Changed to white for better contrast on background
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24, // Made larger since it's now the main title
    color: '#FFFFFF', // Changed to white for better prominence
    fontStyle: 'italic',
    fontWeight: '600', // Added font weight
    textAlign: 'center',
  },
  imageContainer: {
    marginBottom: 30,
  },
  medicalImage: {
    width: width * 0.8,
    height: 200,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF', // Changed to white for better contrast
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#E2E8F0', // Light gray for better readability on background
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    width: '80%', // Made smaller
    paddingHorizontal: 20,
  },
  buttonWrapper: {
    marginBottom: 12, // Reduced margin
  },
  primaryButton: {
    backgroundColor: '#10B981', // Changed to green
    paddingVertical: 12, // Reduced padding
    paddingHorizontal: 24, // Added horizontal padding
    borderRadius: 8, // Smaller border radius
    alignItems: 'center',
    elevation: 2, // Reduced elevation
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16, // Smaller font
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent', // Changed to transparent
    paddingVertical: 12, // Reduced padding
    paddingHorizontal: 24, // Added horizontal padding
    borderRadius: 8, // Smaller border radius
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10B981', // Changed border color to green
    elevation: 1, // Reduced elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  secondaryButtonText: {
    color: '#10B981', // Changed to green
    fontSize: 16, // Smaller font
    fontWeight: '600',
  },
});