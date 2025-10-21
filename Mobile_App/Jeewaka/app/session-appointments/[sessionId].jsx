import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../../store/authStore';
import { format, parseISO } from 'date-fns';
import MedicalRecordsModal from '../../components/MedicalRecordsModal';
import SessionSummaryHeader from '../../components/SessionSummaryHeader';
import AppointmentSlotCard from '../../components/AppointmentSlotCard';
import EmptySessionState from '../../components/EmptySessionState';
import { useSessionData } from '../../hooks/useSessionData';
import { useSlotHelpers } from '../../hooks/useSlotHelpers';

export default function SessionAppointments() {
  const { sessionId } = useLocalSearchParams();
  const { user, userRole } = useAuthStore();
  const router = useRouter();
  
  const [medicalRecordsVisible, setMedicalRecordsVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Use custom hooks for data management and slot helpers
  const { sessionInfo, timeSlots, loading, refreshing, onRefresh } = useSessionData(sessionId, user, userRole, router);
  const { isSlotOngoing, getPatientName, isSlotPast, handleViewMedicalRecords } = useSlotHelpers(setSelectedPatient, setMedicalRecordsVisible);

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Session Appointments',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#1E293B',
            },
            headerTitleStyle: {
              color: 'white',
              fontSize: 18,
              fontWeight: '600',
            },
            headerTintColor: 'white',
          }}
        />
        
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading session data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: sessionInfo ? `Session - ${format(parseISO(sessionInfo.date), 'MMM dd, yyyy')}` : 'Session Appointments',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1E293B',
          },
          headerTitleStyle: {
            color: 'white',
            fontSize: 18,
            fontWeight: '600',
          },
          headerTintColor: 'white',
        }}
      />
      
      {sessionInfo && (
        <SessionSummaryHeader sessionInfo={sessionInfo} timeSlots={timeSlots} />
      )}
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#008080']}
          />
        }
      >
        {timeSlots.length === 0 ? (
          <EmptySessionState />
        ) : (
          timeSlots.map((slot, index) => (
            <AppointmentSlotCard
              key={`${slot.startTime}-${slot.endTime}-${index}`}
              slot={slot}
              index={index}
              sessionId={sessionId}
              onViewMedicalRecords={handleViewMedicalRecords}
              isSlotOngoing={isSlotOngoing}
              getPatientName={getPatientName}
              isSlotPast={isSlotPast}
            />
          ))
        )}
      </ScrollView>
      
      <MedicalRecordsModal
        visible={medicalRecordsVisible}
        patient={selectedPatient}
        onClose={() => {
          setMedicalRecordsVisible(false);
          setSelectedPatient(null);
        }}
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
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
});