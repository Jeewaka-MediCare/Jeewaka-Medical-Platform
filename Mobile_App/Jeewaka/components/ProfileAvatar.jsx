import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileAvatar({ 
  userProfile, 
  userRole, 
  onPress,
  showCameraIcon = true 
}) {
  const getAvatarInitial = () => {
    const nameOptions = [
      userProfile?.name,
      userProfile?.fullName, 
      userProfile?.firstName,
      userProfile?.email?.charAt(0)
    ];
    
    for (const nameOption of nameOptions) {
      if (nameOption && typeof nameOption === 'string' && nameOption.trim()) {
        return nameOption.charAt(0).toUpperCase();
      }
    }
    
    return userRole === 'doctor' ? 'D' : 'P';
  };

  return (
    <TouchableOpacity 
      style={styles.avatarContainer}
      onPress={onPress}
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
            {getAvatarInitial()}
          </Text>
        </View>
      )}
      {showCameraIcon && (
        <View style={styles.cameraIconContainer}>
          <Ionicons name="camera" size={16} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#008080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#008080',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
});