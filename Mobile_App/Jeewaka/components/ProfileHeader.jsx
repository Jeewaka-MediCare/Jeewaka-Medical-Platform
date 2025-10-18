import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ProfileAvatar from './ProfileAvatar';

export default function ProfileHeader({ 
  userProfile, 
  userRole, 
  onAvatarPress 
}) {
  const getDisplayName = () => {
    const nameOptions = [
      userProfile?.name,
      userProfile?.fullName,
      userProfile?.firstName,
      userProfile?.email
    ];
    
    for (const nameOption of nameOptions) {
      if (nameOption && typeof nameOption === 'string' && nameOption.trim()) {
        return nameOption;
      }
    }
    
    return 'User';
  };

  return (
    <View style={styles.profileHeader}>
      <ProfileAvatar
        userProfile={userProfile}
        userRole={userRole}
        onPress={onAvatarPress}
      />
      
      <Text style={styles.userName}>
        {getDisplayName()}
      </Text>
      <Text style={styles.userRole}>
        {userRole === 'doctor' ? 'Doctor' : 'Patient'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
});