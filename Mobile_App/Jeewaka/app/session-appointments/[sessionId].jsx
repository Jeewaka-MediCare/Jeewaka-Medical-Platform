import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { format, parseISO } from 'date-fns';
import VideoCallButton from '../../components/VideoCallButton';
import MedicalRecordsModal from '../../components/MedicalRecordsModal';

export default function SessionAppointments() {
  const { sessionId } = useLocalSearchParams();
  const { user, userRole } = useAuthStore();
  const router = useRouter();
  
  const [sessionInfo, setSessionInfo] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [medicalRecordsVisible, setMedicalRecordsVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Fetch session data and prepare time slots with patient info
  const fetchSessionData = async () => {
    if (!user || !user._id || !sessionId) return;
    
    setLoading(true);
    try {
      console.log('Fetching session data for session:', sessionId);
      const { data } = await api.get(`/api/session/${sessionId}`);
      
      if (!data) {
        Alert.alert('Error', 'Session not found');
        router.back();
        return;
      }

      console.log('Session data received:', data);
      console.log('Hospital info:', data.hospital);
      console.log('Session type:', data.type);
      console.log('Time slots with patient data:', data.timeSlots);

      setSessionInfo(data);
      
      // Backend now includes patient information in timeSlots when accessed by authenticated doctor
      // No need to make separate API call to get all patients
      const slotsWithInfo = (data.timeSlots || []).map((slot, index) => {
        console.log(`Slot ${index}:`, slot);
        console.log(`Patient data for slot ${index}:`, slot.patient);
        console.log(`PatientId for slot ${index}:`, slot.patientId);
        
        return {
          ...slot,
          slotIndex: index,
          sessionDate: data.date,
          sessionType: data.type,
          hospital: data.hospital,
          isBooked: slot.patientId && slot.status !== 'available'
        };
      });

      setTimeSlots(slotsWithInfo);
    } catch (error) {
      console.error('Error fetching session data:', error);
      Alert.alert('Error', 'Failed to load session data');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchSessionData();
  };

  // Fetch session data when component mounts
  useEffect(() => {
    if (user && userRole === 'doctor' && sessionId) {
      fetchSessionData();
    }
  }, [user, userRole, sessionId]);

  // Helper function to check if slot is currently ongoing
  const isSlotOngoing = (slot) => {
    if (!slot.isBooked) return false;
    
    try {
      const now = new Date();
      const dateOnly = slot.sessionDate.split('T')[0];
      const slotStartDate = parseISO(`${dateOnly}T${slot.startTime}`);
      const slotEndDate = parseISO(`${dateOnly}T${slot.endTime}`);
      
      return now >= slotStartDate && now <= slotEndDate;
    } catch (error) {
      console.error('Error checking if slot is ongoing:', error);
      return false;
    }
  };

  // Helper function to extract patient name from slot data
  const getPatientName = (slot) => {
    console.log('Getting patient name for slot:', slot);
    console.log('slot.patient:', slot.patient);
    console.log('slot.patientId:', slot.patientId);
    
    // Try different possible data structures
    if (slot.patient?.name) {
      console.log('Found patient name in slot.patient.name:', slot.patient.name);
      return slot.patient.name;
    }
    
    if (slot.patientId?.name) {
      console.log('Found patient name in slot.patientId.name:', slot.patientId.name);
      return slot.patientId.name;
    }
    
    if (slot.patientId?.firstName && slot.patientId?.lastName) {
      const fullName = `${slot.patientId.firstName} ${slot.patientId.lastName}`;
      console.log('Found patient name from firstName + lastName:', fullName);
      return fullName;
    }
    
    if (slot.patientId?.firstName) {
      console.log('Found patient firstName only:', slot.patientId.firstName);
      return slot.patientId.firstName;
    }
    
    // Log what we actually have for debugging
    console.log('Could not find patient name. Available data:');
    console.log('- slot.patient keys:', slot.patient ? Object.keys(slot.patient) : 'null');
    console.log('- slot.patientId keys:', slot.patientId ? Object.keys(slot.patientId) : 'null');
    console.log('- slot.patientId type:', typeof slot.patientId);
    console.log('- slot.patientId value:', slot.patientId);
    
    return 'Unknown';
  };

  // Helper function to check if slot is in the past
  const isSlotPast = (slot) => {
    try {
      const now = new Date();
      const dateOnly = slot.sessionDate.split('T')[0];
      const slotEndDate = parseISO(`${dateOnly}T${slot.endTime}`);
      
      return slotEndDate <= now;
    } catch (error) {
      console.error('Error checking if slot is past:', error);
      return false;
    }
  };

  // Handle viewing medical records
  const handleViewMedicalRecords = useCallback(async (slot) => {
    if (!slot.patient && !slot.patientId) {
      Alert.alert('Error', 'No patient information available for this appointment.');
      return;
    }
    
    console.log('Slot data for medical records:', slot);
    console.log('Patient data:', slot.patient);
    console.log('PatientId data:', slot.patientId);
    
    // Use patient data if available, otherwise use patientId info
    let patientInfo;
    
    if (slot.patient) {
      patientInfo = {
        _id: slot.patient._id,
        name: slot.patient.name,
        email: slot.patient.email || 'No email available'
      };
    } else if (slot.patientId) {
      // Handle different possible structures of patientId
      const patientIdData = slot.patientId;
      const patientName = getPatientName(slot);
      
      patientInfo = {
        _id: typeof patientIdData === 'object' ? patientIdData._id : patientIdData,
        name: patientName,
        email: (typeof patientIdData === 'object' ? patientIdData.email : null) || 'No email available'
      };
    }
    
    console.log('Final patient info for medical records:', patientInfo);
    console.log('Patient _id type:', typeof patientInfo._id);
    console.log('Patient _id value:', patientInfo._id);
    console.log('Patient _id length:', patientInfo._id?.length);
    console.log('Is valid ObjectId format:', /^[0-9a-fA-F]{24}$/.test(patientInfo._id));
    
    setSelectedPatient(patientInfo);
    setMedicalRecordsVisible(true);
  }, []);

  // Render slot card (booked or available)
  const renderSlotCard = (slot, index) => {
    const isOngoing = isSlotOngoing(slot);
    const isPast = isSlotPast(slot);
    
    return (
      <View 
        key={`${slot.startTime}-${slot.endTime}-${index}`}
        style={[
          styles.slotCard,
          slot.isBooked && styles.bookedSlotCard,
          isOngoing && styles.ongoingSlotCard,
          isPast && styles.pastSlotCard
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.slotTime}>
            {slot.startTime} - {slot.endTime}
          </Text>
          
          <View style={styles.badgeContainer}>
            {slot.isBooked ? (
              isOngoing ? (
                <View style={[styles.statusBadge, styles.ongoingBadge]}>
                  <Text style={styles.statusText}>Ongoing</Text>
                </View>
              ) : isPast ? (
                <View style={[styles.statusBadge, styles.completedBadge]}>
                  <Text style={styles.statusText}>Completed</Text>
                </View>
              ) : (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Booked</Text>
                </View>
              )
            ) : isPast ? (
              <View style={[styles.statusBadge, styles.passedBadge]}>
                <Text style={[styles.statusText, styles.passedText]}>Passed</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.availableBadge]}>
                <Text style={[styles.statusText, styles.availableText]}>Available</Text>
              </View>
            )}
          </View>
        </View>
        
        {slot.isBooked ? (
          <>
            <View style={styles.slotDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={18} color="#64748B" />
                <Text style={styles.detailText}>
                  Patient - {getPatientName(slot)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons 
                  name={slot.sessionType === 'in-person' ? 'location-outline' : 'videocam-outline'} 
                  size={18} 
                  color="#64748B" 
                />
                <Text style={styles.detailText}>
                  {slot.sessionType === 'in-person' 
                    ? (slot.hospital?.name || 'Hospital') 
                    : 'Video Consultation'
                  }
                </Text>
              </View>
              
              {isOngoing && (
                <View style={styles.detailRow}>
                  <Ionicons name="radio-outline" size={18} color="#F59E0B" />
                  <Text style={[styles.detailText, styles.ongoingText]}>
                    In Progress
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.cardActions}>
              {(slot.sessionType === 'online' || slot.sessionType === 'video') && (
                <VideoCallButton
                  style={[styles.actionButton, styles.videoCallButton]}
                  title="Join Video Call"
                  sessionId={sessionId}
                  slotIndex={slot.slotIndex}
                />
              )}
              
              <TouchableOpacity
                style={[styles.actionButton, styles.medicalRecordsButton]}
                onPress={() => handleViewMedicalRecords(slot)}
              >
                <Ionicons name="document-text-outline" size={16} color="#0066CC" />
                <Text style={[styles.actionButtonText, styles.medicalRecordsButtonText]}>
                  View Medical Records
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.notBookedContainer}>
            <Ionicons name="calendar-outline" size={24} color="#94A3B8" />
            <Text style={styles.notBookedText}>Not booked</Text>
          </View>
        )}
      </View>
    );
  };

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

  const bookedSlotsCount = timeSlots.filter(slot => slot.isBooked).length;

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
        <View style={styles.sessionSummary}>
          <Text style={styles.sessionSummaryTitle}>
            {sessionInfo.type === 'in-person' 
              ? `Hospital Session${sessionInfo.hospital?.name ? ` - ${sessionInfo.hospital.name}` : ''}`
              : 'Video Consultation Session'
            }
          </Text>
          <Text style={styles.sessionSummarySubtitle}>
            {sessionInfo.timeSlots?.[0]?.startTime} - {sessionInfo.timeSlots?.[sessionInfo.timeSlots.length - 1]?.endTime}
          </Text>
          <Text style={styles.sessionSummaryStats}>
            {bookedSlotsCount}/{timeSlots.length} slot{timeSlots.length !== 1 ? 's' : ''} booked
          </Text>
        </View>
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
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={60} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Time Slots</Text>
            <Text style={styles.emptyMessage}>This session has no time slots defined</Text>
          </View>
        ) : (
          timeSlots.map((slot, index) => renderSlotCard(slot, index))
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
  sessionSummary: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sessionSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  sessionSummarySubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  sessionSummaryStats: {
    fontSize: 12,
    color: '#008080',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  slotCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookedSlotCard: {
    borderColor: '#008080',
    borderWidth: 2,
  },
  ongoingSlotCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  pastSlotCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#008080',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availableBadge: {
    backgroundColor: '#10B981',
  },
  passedBadge: {
    backgroundColor: '#64748B',
  },
  ongoingBadge: {
    backgroundColor: '#F59E0B',
  },
  completedBadge: {
    backgroundColor: '#6B7280',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  availableText: {
    color: 'white',
  },
  passedText: {
    color: 'white',
  },
  slotDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  ongoingText: {
    color: '#F59E0B',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  videoCallButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  medicalRecordsButton: {
    backgroundColor: 'white',
    borderColor: '#0066CC',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  medicalRecordsButtonText: {
    color: '#0066CC',
  },
  notBookedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  notBookedText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '500',
  },
});