import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { format, parseISO, isSameDay } from 'date-fns';

export default function BookSession() {
  const { sessionId, doctorId, doctorName, sessionData, doctorConsultationFee } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const session = JSON.parse(sessionData);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Use the actual time slots from the session (like web app)
  const timeSlots = session.timeSlots || [];

  // Get enhanced slot status information
  const getSlotStatus = (slot) => {
    if (slot.status === 'booked') {
      return { isAvailable: false, statusText: 'Booked', reason: 'booked' };
    }
    
    if (slot.status === 'available') {
      const sessionDateObj = parseISO(session.date);
      const today = new Date();
      
      // Only check for passed slots on the current date
      if (isSameDay(sessionDateObj, today)) {
        const [hours, minutes] = slot.startTime.split(':').map(Number);
        const slotDateTime = new Date(sessionDateObj);
        slotDateTime.setHours(hours, minutes, 0, 0);
        
        if (today > slotDateTime) {
          return { isAvailable: false, statusText: 'Time Passed', reason: 'timePassed' };
        }
      }
      
      return { isAvailable: true, statusText: 'Available', reason: 'available' };
    }
    
    return { isAvailable: false, statusText: 'Unavailable', reason: 'unavailable' };
  };

  const handleSlotSelect = (slot, index) => {
    const slotStatus = getSlotStatus(slot);
    if (!slotStatus.isAvailable) return;
    setSelectedSlot(slot);
    setSelectedSlotIndex(index);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      Alert.alert('Select Time Slot', 'Please select a time slot to continue');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to book an appointment');
      return;
    }
    
    setLoading(true);
    
    try {
      // Get consultation fee from doctor (passed as parameter)
      const consultationFee = parseFloat(doctorConsultationFee) || 0;
      
      if (consultationFee <= 0) {
        Alert.alert('Payment Error', 'Consultation fee not available. Please try again.');
        setLoading(false);
        return;
      }

      // Navigate to payment checkout with all required data
      router.push({
        pathname: '/payment-checkout',
        params: {
          sessionId: sessionId,
          slotIndex: selectedSlotIndex,
          doctorName: doctorName,
          sessionData: JSON.stringify(session),
          amount: consultationFee,
          // Note: Backend gets patient from Firebase UID in JWT token, not this parameter
          patientId: user._id || user.uid || user.id
        }
      });
    } catch (error) {
      console.error('Booking preparation error:', error);
      Alert.alert(
        'Booking Error', 
        'Failed to prepare booking. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Book Appointment',
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
      
      <ScrollView style={styles.content}>
        <View style={styles.bookingDetails}>
          <Text style={styles.doctorName}>{doctorName}</Text>
          <Text style={styles.sessionDate}>
            {format(parseISO(session.date), 'EEEE, MMMM d, yyyy')}
          </Text>
          
          <View style={styles.sessionTypeBadge}>
            <Text style={styles.sessionTypeText}>
              {session.type === 'in-person' ? 'In-Person' : 'Video'}
            </Text>
          </View>
          
          {session.type === 'in-person' && session.hospital && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={18} color="#64748B" />
              <Text style={styles.locationText}>{session.hospital.name}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Time Slot</Text>
          <Text style={styles.sectionSubtitle}>Available time slots</Text>
          
          {timeSlots.length === 0 ? (
            <View style={styles.noSlotsContainer}>
              <Text style={styles.noSlotsText}>No time slots available for this session</Text>
            </View>
          ) : (
            <View style={styles.timeSlotsContainer}>
              {timeSlots.map((slot, index) => {
                const slotStatus = getSlotStatus(slot);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlot,
                      !slotStatus.isAvailable && styles.bookedSlot,
                      selectedSlotIndex === index && styles.selectedSlot
                    ]}
                    onPress={() => handleSlotSelect(slot, index)}
                    disabled={!slotStatus.isAvailable}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        !slotStatus.isAvailable && styles.bookedSlotText,
                        selectedSlotIndex === index && styles.selectedSlotText
                      ]}
                    >
                      {`${slot.startTime} - ${slot.endTime}`}
                    </Text>
                    {!slotStatus.isAvailable && (
                      <Text style={styles.bookedText}>
                        {slotStatus.statusText}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Doctor</Text>
            <Text style={styles.summaryValue}>{doctorName}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>
              {format(parseISO(session.date), 'MMM dd, yyyy')}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time</Text>
            <Text style={styles.summaryValue}>
              {selectedSlot 
                ? `${selectedSlot.startTime} - ${selectedSlot.endTime}`
                : 'Select a time slot'}
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Session Type</Text>
            <Text style={styles.summaryValue}>
              {session.type === 'in-person' ? 'In-Person' : 'Video'}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Consultation Fee</Text>
            <Text style={styles.totalValue}>LKR{parseFloat(doctorConsultationFee) || 0}</Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, (!selectedSlot || loading) && styles.disabledButton]}
          onPress={handleConfirmBooking}
          disabled={!selectedSlot || loading}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Preparing Payment...' : 'Proceed to Payment'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backButton: {
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  bookingDetails: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  sessionDate: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 12,
    textAlign: 'center',
  },
  sessionTypeBadge: {
    backgroundColor: '#008080',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
  },
  sessionTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#64748B',
  },
  sectionContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '48%',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookedSlot: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  selectedSlot: {
    backgroundColor: '#EBF5FF',
    borderColor: '#008080',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  bookedSlotText: {
    color: '#94A3B8',
  },
  selectedSlotText: {
    color: '#008080',
  },
  bookedText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008080',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
  },
  confirmButton: {
    backgroundColor: '#008080',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  noSlotsContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noSlotsText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});
