import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { apiHelpers } from '../services/apiHelpers';
import useAuthStore from '../store/authStore';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login() {
  const { setUser, setUserRole, checkDoctorVerification } = useAuthStore();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      // Firebase authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const user = userCredential.user;
      const uid = user.uid;
      
      // Get Firebase custom claims (role) - wait for token refresh if needed
      let idTokenResult = await user.getIdTokenResult();
      let role = idTokenResult.claims.role;
      
      // If role is not set, wait a moment and try again (Firebase claims might be delayed)
      if (!role) {
        await user.getIdToken(true); // Force token refresh
        idTokenResult = await user.getIdTokenResult();
        role = idTokenResult.claims.role;
      }
      
      if (!role) {
        throw new Error('User role not found. Please contact support.');
      }
      
      // Get user profile data using the new API helper
      const userData = await apiHelpers.getUserProfile(role, uid);
      
      // Set user data and role
      if (userData) {
        const userWithRole = { ...userData, role };
        setUser(userWithRole);
        setUserRole(role);
        
        // Navigate based on user role
        if (role === 'doctor') {
          // Check if doctor is verified before allowing access - FRONTEND APPROACH
          try {
            const { isVerified, verificationData } = await checkDoctorVerification(userData._id);
            
            if (isVerified) {
              // Doctor is verified, can access dashboard
              router.replace('/(tabs)/appointments');  // Direct to My Appointments tab
            } else {
              // Doctor is not verified, redirect to verification page with data
              // Store verification data for the AdminVerificationPending page
              if (verificationData) {
                await AsyncStorage.setItem('verificationData', JSON.stringify(verificationData));
              }
              router.replace(`/AdminVerificationPending?doctorId=${userData._id}&_id=${userData._id}&name=${encodeURIComponent(userData.name)}&email=${encodeURIComponent(userData.email)}`);
            }
          } catch (verificationError) {
            console.error('Error checking verification:', verificationError);
            // On error, redirect to verification page to be safe
            router.replace(`/AdminVerificationPending?doctorId=${userData._id}&_id=${userData._id}&name=${encodeURIComponent(userData.name)}&email=${encodeURIComponent(userData.email)}`);
          }
        } else if (role === 'patient') {
          router.replace('/(tabs)');  // Direct to Jeewaka tab
        } else if (role === 'admin') {
          // Admin dashboard not implemented in mobile app yet, redirect to Jeewaka tab
          router.replace('/(tabs)');
        }
      } else {
        throw new Error('Failed to retrieve user data');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed',
        error.message || 'Failed to log in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Sign In',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1E293B',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
          headerTitleStyle: {
            color: 'white',
            fontSize: 20,
            fontWeight: '600',
          },
          headerTintColor: 'white',
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter your email"
              placeholderTextColor="#94A3B8"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>
          
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.buttonText}>Loading...</Text>
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#334155',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8FAFC',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1E293B', // Added text color for visibility
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#008080',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#008080',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 16,
    color: '#008080',
    fontWeight: '500',
    marginLeft: 4,
  },
});
