import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import ProfileMenuItem from './ProfileMenuItem';

export default function ProfileMenuSection({ user, userRole }) {
  const router = useRouter();

  const handleDoctorReviews = () => {
    console.log('Reviews navigation - User object:', JSON.stringify(user, null, 2));
    
    // Try different possible ID fields
    const doctorId = user?._id || user?.id || user?.doctorId;
    console.log('Reviews navigation - Doctor ID found:', doctorId);
    
    if (doctorId) {
      router.push({
        pathname: '/doctor-reviews',
        params: { doctorId: doctorId }
      });
    } else {
      console.error('Doctor ID not found in user object. Available fields:', Object.keys(user || {}));
      Alert.alert(
        'Error', 
        'Unable to access reviews. Doctor ID not found. Please try logging out and back in.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    }
  };

  const patientMenuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      onPress: () => router.push('/edit-profile')
    },
    {
      icon: 'document-text-outline',
      title: 'Medical Records',
      onPress: () => router.push('/medical-records')
    },
    {
      icon: 'card-outline',
      title: 'Payment History',
      onPress: () => router.push('/payment-history')
    }
  ];

  const doctorMenuItems = [
    {
      icon: 'person-outline',
      title: 'Edit Profile',
      onPress: () => router.push('/edit-profile')
    },
    {
      icon: 'wallet-outline',
      title: 'Earnings',
      onPress: () => router.push('/doctor-earnings')
    },
    {
      icon: 'star-outline',
      title: 'Reviews',
      onPress: handleDoctorReviews
    }
  ];

  const commonMenuItems = [
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      onPress: () => router.push('/help-support')
    }
  ];

  const menuItems = userRole === 'patient' ? patientMenuItems : doctorMenuItems;

  return (
    <View style={styles.menuSection}>
      {menuItems.map((item, index) => (
        <ProfileMenuItem
          key={`menu-${index}`}
          icon={item.icon}
          title={item.title}
          onPress={item.onPress}
        />
      ))}
      {commonMenuItems.map((item, index) => (
        <ProfileMenuItem
          key={`common-${index}`}
          icon={item.icon}
          title={item.title}
          onPress={item.onPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menuSection: {
    backgroundColor: 'white',
    marginTop: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
});