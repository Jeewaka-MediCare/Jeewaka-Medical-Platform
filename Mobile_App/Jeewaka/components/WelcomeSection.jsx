import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function WelcomeSection({ 
  greeting, 
  doctorName, 
  profileImage 
}) {
  return (
    <View style={styles.welcomeSection}>
      <View style={styles.welcomeContent}>
        <Text style={styles.greeting}>{greeting},</Text>
        <Text style={styles.doctorName}>{doctorName || 'Doctor'}</Text>
        <Text style={styles.welcomeMessage}>Welcome to your dashboard</Text>
      </View>
      <Image 
        source={
          profileImage 
            ? { uri: profileImage } 
            : require('../assets/images/doctor-placeholder.png')
        } 
        style={styles.profileImage} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  welcomeContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  welcomeMessage: {
    fontSize: 14,
    color: '#64748B',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
});