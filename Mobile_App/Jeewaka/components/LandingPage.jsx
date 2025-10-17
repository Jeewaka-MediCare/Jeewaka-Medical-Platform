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
    <View style={styles.container}>
      {/* Background Image with Fade Effect */}
      <ImageBackground
        source={require('../assets/images/homeimage.png')} // Using existing image
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle} // Add this line
        resizeMode="contain" // Changed from contain to cover for better positioning
      >
        {/* Fade Overlay for blurred effect */}
        <View style={styles.fadeOverlay} />
        
        {/* Content Container */}
        <View style={styles.content}>
          {/* Top Section - Text Content */}
          <View style={styles.topSection}>
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
          </View>

          {/* Bottom Section - Action Buttons */}
          <View style={styles.bottomSection}>
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
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff', // Fallback background
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    transform: [
      { translateY: -90 } // Move UP by 30px (negative = up, positive = down)
    ],

  },
  fadeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // White overlay with 85% opacity for strong fade effect

  },
  content: {
    flex: 1,
    justifyContent: 'space-between', // This will push top and bottom sections apart
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60, // Add top padding to push text higher
    paddingBottom: 100, // Add bottom padding to push buttons lower
    zIndex: 1, // Ensure content is above background
  },
  topSection: {
    top: 100,
    alignItems: 'center',
    flex: 0, // Don't let this section grow
  },
  bottomSection: {
    alignItems: 'center',
    flex: 0, // Don't let this section grow
    width: '100%',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#027878ff', // Dark gray for better contrast on teal
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24, // Made larger since it's now the main title
    color: '#1b4641ff', // Dark gray for better visibility on teal
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
    color: '#008080', // Dark gray for better contrast on teal
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#008080', // Medium gray for good readability on teal
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonsContainer: {
    width: '100%', // Full width within bottomSection
    paddingHorizontal: 0, // Remove horizontal padding since bottomSection handles it
    alignItems: 'center',
  },
  buttonWrapper: {
    marginBottom: 12, // Reduced margin
    width: '80%', // Control button width here
  },
  primaryButton: {
    backgroundColor: '#008080', // Dark green complementing teal
    paddingVertical: 12, // Reduced padding
    paddingHorizontal: 24, // Added horizontal padding
    borderRadius: 8, // Smaller border radius
    alignItems: 'center',
    elevation: 2, // Reduced elevation
    shadowColor: '#008080',
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
    borderColor: '#047878ff', // Dark green border complementing teal
  },
  secondaryButtonText: {
    color: '#058686ff', // Dark green text complementing teal
    fontSize: 16, // Smaller font
    fontWeight: '600',
  },
});