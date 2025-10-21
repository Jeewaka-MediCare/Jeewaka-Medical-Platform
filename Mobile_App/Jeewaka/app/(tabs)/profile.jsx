import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import ImagePickerComponent from '../../components/ImagePicker';
import ProfileHeader from '../../components/ProfileHeader';
import ProfileMenuSection from '../../components/ProfileMenuSection';
import { useProfileImageManager } from '../../hooks/useProfileImageManager';

export default function Profile() {
  const { user, userRole, logout, loading, updateUser } = useAuthStore();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(user);

  const {
    profileImageModalVisible,
    uploading,
    showImageOptions,
    handleImageSelected,
    setProfileImageModalVisible
  } = useProfileImageManager(user, userRole, userProfile, setUserProfile, updateUser);

  // When user logs out, redirect to home
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // If not logged in, show login prompt
  if (!loading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'My Profile',
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
        
        <View style={styles.content}>
          <Ionicons name="person-circle-outline" size={80} color="#94A3B8" style={styles.icon} />
          <Text style={styles.title}>Login Required</Text>
          <Text style={styles.message}>
            You need to log in to access your profile
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
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'My Profile',
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
        
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show user profile if logged in
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'My Profile',
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
      
      {user ? (
        <>
          <ProfileHeader 
            userProfile={userProfile}
            userRole={userRole}
            onAvatarPress={showImageOptions}
          />
      
          <ProfileMenuSection 
            userRole={userRole}
            user={user}
            router={router}
          />
      
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>Loading user data...</Text>
        </View>
      )}

      {/* Profile Image Picker */}
      <ImagePickerComponent
        visible={profileImageModalVisible}
        onClose={() => setProfileImageModalVisible(false)}
        onImageSelected={handleImageSelected}
        currentImage={userProfile?.profile}
        uploading={uploading}
        title="Update Profile Image"
      />
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
    backgroundColor: '#008080',
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
    borderColor: '#008080',
  },
  registerButtonText: {
    color: '#008080',
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
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
