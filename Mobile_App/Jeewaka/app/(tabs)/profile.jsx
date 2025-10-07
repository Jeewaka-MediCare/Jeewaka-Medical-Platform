import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import api from '../../services/api';
import ImagePickerComponent from '../../components/ImagePicker';

export default function Profile() {
  const { user, userRole, logout, loading } = useAuthStore();
  const router = useRouter();
  const [profileImageModalVisible, setProfileImageModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userProfile, setUserProfile] = useState(user);

  // Debug logging to understand user data structure
  console.log('Profile Debug - User Role:', userRole);
  console.log('Profile Debug - User Object:', JSON.stringify(user, null, 2));
  console.log('Profile Debug - User Name:', user?.name);
  console.log('Profile Debug - User Profile:', user?.profile);

  // Get avatar initial with comprehensive fallback
  const getAvatarInitial = () => {
    console.log('getAvatarInitial called');
    const nameOptions = [
      user?.name,
      user?.fullName, 
      user?.firstName,
      user?.email?.charAt(0)
    ];
    
    console.log('Name options:', nameOptions);
    
    for (const nameOption of nameOptions) {
      if (nameOption && typeof nameOption === 'string' && nameOption.trim()) {
        const initial = nameOption.charAt(0).toUpperCase();
        console.log('Found initial:', initial);
        return initial;
      }
    }
    
    // Final fallback based on role
    const fallback = userRole === 'doctor' ? 'D' : 'P';
    console.log('Using fallback initial:', fallback);
    return fallback;
  };

  // Get display name with comprehensive fallback
  const getDisplayName = () => {
    const nameOptions = [
      user?.name,
      user?.fullName,
      user?.firstName,
      user?.email
    ];
    
    for (const nameOption of nameOptions) {
      if (nameOption && typeof nameOption === 'string' && nameOption.trim()) {
        return nameOption;
      }
    }
    
    return 'User';
  };

  // When user logs out, redirect to home
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Image picker functions
  const showImageOptions = () => {
    setProfileImageModalVisible(true);
  };

  const handleImageSelected = async (imageResult) => {
  console.log('handleImageSelected called with:', imageResult);
  
  if (!imageResult || imageResult === null) {
    // Handle image removal
    console.log('Removing image...');
    await removeImage();
    return;
  }

  // Handle image upload
  console.log('Uploading image...');
  await uploadImage(imageResult);
};

  // Replace the uploadImage function with this corrected version:

  const uploadImage = async (imageAsset) => {
    setUploading(true);
    try {
      console.log('Image asset received:', imageAsset);
      
      // Handle both URL and base64 image formats
      let imageData;
      if (imageAsset.uri && imageAsset.uri.startsWith('data:image/')) {
        // If it's already a data URL
        imageData = imageAsset.uri;
      } else if (imageAsset.base64) {
        // If we have base64 data, create data URL
        imageData = `data:image/jpeg;base64,${imageAsset.base64}`;
      } else if (imageAsset.uri) {
        // If it's just a URI (for URL input)
        imageData = imageAsset.uri;
      } else {
        throw new Error('Invalid image format');
      }

      // Validate image size (optional but recommended)
      if (imageData.startsWith('data:image/')) {
        const sizeInBytes = (imageData.length * (3/4));
        const sizeInMB = sizeInBytes / (1024 * 1024);
        console.log('Image size:', sizeInMB.toFixed(2), 'MB');
        
        if (sizeInMB > 5) {
          Alert.alert(
            "Image Too Large", 
            `Image size is ${sizeInMB.toFixed(2)}MB. Please use an image smaller than 5MB.`
          );
          return;
        }
      }

      console.log('Uploading image data (first 50 chars):', imageData.substring(0, 50));
      
      const updateData = { profile: imageData };
      const endpoint = userRole === 'doctor' 
        ? `/api/doctor/${user._id}` 
        : `/api/patient/${user._id}`;

      console.log('API Request:', 'PUT', endpoint);
      const response = await api.put(endpoint, updateData);
      
      console.log('API Response:', response.data);

      // Check for successful response - be more flexible with response structure
      if (response.data && (response.data.success !== false)) {
        Alert.alert('Success', 'Profile image updated successfully!');
        
        // Update local state
        const updatedProfile = { ...userProfile, profile: imageData };
        setUserProfile(updatedProfile);
        
        // Close modal
        setProfileImageModalVisible(false);
      } else {
        throw new Error(response.data?.message || 'Failed to update profile image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      let errorMessage = 'Failed to update profile image. Please try again.';
      if (error.response?.status === 413) {
        errorMessage = 'Image is too large. Please use a smaller image.';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid image format. Please try a different image.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
  setUploading(true);
  try {
    console.log('Removing profile image for user:', user._id);
    
    // Send null or empty string to remove the image
    const updateData = { profile: null };
    const endpoint = userRole === 'doctor' 
      ? `/api/doctor/${user._id}` 
      : `/api/patient/${user._id}`;

    console.log('API Request:', 'PUT', endpoint, updateData);
    const response = await api.put(endpoint, updateData);
    
    console.log('Remove API Response:', response.data);

    // Check for successful response
    if (response.data && (response.data.success !== false)) {
      Alert.alert('Success', 'Profile image removed successfully!');
      
      // Update local state - remove the profile image
      const updatedProfile = { ...userProfile, profile: null };
      setUserProfile(updatedProfile);
      
      // Close modal
      setProfileImageModalVisible(false);
    } else {
      throw new Error(response.data?.message || 'Failed to remove profile image');
    }
  } catch (error) {
    console.error('Remove error:', error);
    console.error('Remove error details:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to remove profile image. Please try again.';
    if (error.response?.status === 404) {
      errorMessage = 'User not found. Please try logging in again.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid request. Please try again.';
    }
    
    Alert.alert('Error', errorMessage);
  } finally {
    setUploading(false);
  }
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
          <View style={styles.profileHeader}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={showImageOptions}
              activeOpacity={0.7}
            >
              {userProfile?.profile ? (
                <Image 
                  source={{ uri: userProfile.profile }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {userProfile?.name?.charAt(0)?.toUpperCase() || 
                     userProfile?.email?.charAt(0)?.toUpperCase() || 
                     (userRole === 'doctor' ? 'D' : 'P')}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
            
            <Text style={styles.userName}>
              {userProfile?.name || userProfile?.email || 'User'}
            </Text>
            <Text style={styles.userRole}>{userRole === 'doctor' ? 'Doctor' : 'Patient'}</Text>
          </View>
      
      <View style={styles.menuSection}>
        {userRole === 'patient' ? (
          // Patient menu options
          <>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/edit-profile')}
            >
              <Ionicons name="person-outline" size={24} color="#1E293B" />
              <Text style={styles.menuText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/medical-records')}
            >
              <Ionicons name="document-text-outline" size={24} color="#1E293B" />
              <Text style={styles.menuText}>Medical Records</Text>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </>
        ) : (
          // Doctor menu options - removed dashboard link since it's now in appointments tab
          <>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/edit-profile')}
            >
              <Ionicons name="person-outline" size={24} color="#1E293B" />
              <Text style={styles.menuText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </>
        )}
        
        {/* Common menu items for both roles */}
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#1E293B" />
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/help-support')}
        >
          <Ionicons name="help-circle-outline" size={24} color="#1E293B" />
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
      
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#64748B',
  },
  menuSection: {
    backgroundColor: 'white',
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 12,
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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});
