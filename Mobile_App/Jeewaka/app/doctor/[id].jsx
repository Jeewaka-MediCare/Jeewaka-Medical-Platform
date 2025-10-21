import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import ReviewsComponent from '../../components/ReviewsComponent';
import DoctorHeroSection from '../../components/DoctorHeroSection';
import DoctorTabNavigation from '../../components/DoctorTabNavigation';
import DoctorAboutTab from '../../components/DoctorAboutTab';
import DoctorSessionsTab from '../../components/DoctorSessionsTab';
import PastSessionsModal from '../../components/PastSessionsModal';
import { useDoctorData } from '../../hooks/useDoctorData';
import { useSessions } from '../../hooks/useSessions';

export default function DoctorDetails() {
  const { id, doctorData, selectedTab: initialTab } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [selectedTab, setSelectedTab] = useState(initialTab || 'about');
  const [showPastSessions, setShowPastSessions] = useState(false);

  // Parse fallback data if available
  const fallbackData = doctorData ? JSON.parse(doctorData) : null;
  
  console.log('DoctorDetails - Props received:', {
    id,
    hasDoctorData: !!doctorData,
    fallbackDataDoctor: fallbackData?.doctor?.name
  });

  // Use custom hooks for data management
  const { doctor, ratingSummary, sessions, loading } = useDoctorData(id, fallbackData, router);
  const { upcomingSessions, pastSessions, handleBookSession } = useSessions(sessions, user, router, doctor);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading doctor details...</Text>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Doctor not found</Text>
      </SafeAreaView>
    );
  }

  console.log('Rendering doctor:', {
    name: doctor?.name,
    specialization: doctor?.specialization,
    sessionsCount: sessions?.length,
    reviewsCount: doctor?.reviews?.length
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: '',
          headerShown: true,
          headerTransparent: true,
          headerTintColor: '#fff',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <DoctorHeroSection doctor={doctor} />
        
        <DoctorTabNavigation 
          selectedTab={selectedTab} 
          onTabChange={setSelectedTab} 
        />
        
        <View style={styles.contentContainer}>
          {selectedTab === 'about' && (
            <DoctorAboutTab doctor={doctor} />
          )}
          
          {selectedTab === 'sessions' && (
            <DoctorSessionsTab 
              upcomingSessions={upcomingSessions}
              pastSessions={pastSessions}
              onBookSession={handleBookSession}
              onShowPastSessions={() => setShowPastSessions(true)}
            />
          )}
          
          {selectedTab === 'reviews' && (
            <ReviewsComponent doctor={doctor} showRatingSummary={true} />
          )}
        </View>
      </ScrollView>

      <PastSessionsModal 
        visible={showPastSessions}
        onClose={() => setShowPastSessions(false)}
        pastSessions={pastSessions}
        doctorName={doctor?.name}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: 'white',
    minHeight: 300,
  },
});
