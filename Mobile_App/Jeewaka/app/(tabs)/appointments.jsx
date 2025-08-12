import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';

export default function Appointments() {
  const { user, userRole, loading } = useAuthStore();
  const router = useRouter();

  // If user is logged in, redirect to the appropriate dashboard
  useEffect(() => {
    if (!loading && user) {
      if (userRole === 'doctor') {
        router.replace('/doctor-dashboard');
      } else if (userRole === 'patient') {
        router.replace('/patient-dashboard');
      }
    }
  }, [user, userRole, loading]);

  // If not logged in, show login prompt
  if (!loading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'My Appointments',
            headerShown: true,
          }}
        />
        
        <View style={styles.content}>
          <Ionicons name="calendar-outline" size={80} color="#94A3B8" style={styles.icon} />
          <Text style={styles.title}>Login Required</Text>
          <Text style={styles.message}>
            You need to log in to view your appointments
          </Text>
          
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={() => router.push('/register')}
          >
            <Text style={styles.registerButtonText}>Create an Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading state while checking authentication
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'My Appointments',
          headerShown: true,
        }}
      />
      
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  registerButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
});
