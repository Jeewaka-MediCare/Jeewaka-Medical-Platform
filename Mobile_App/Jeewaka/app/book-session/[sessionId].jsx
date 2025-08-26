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
import { format, parseISO } from 'date-fns';

export default function BookSession() {
  const { sessionId, doctorId, doctorName, sessionData } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const session = JSON.parse(sessionData);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Generate time slots based on session data
  const generateTimeSlots = () => {
    const slots = [];
    const startTime = session.startTime;
    const [hours, minutes] = startTime.split(':').map(Number);
    const slotDuration = session.slotDuration || 30;
    
    for (let i = 0; i < session.totalSlots; i++) {
      const slotStartMinutes = hours * 60 + minutes + (i * slotDuration);
      const slotHour = Math.floor(slotStartMinutes / 60);
      const slotMinute = slotStartMinutes % 60;
      
      const formattedStartTime = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
      
      const endMinutes = slotStartMinutes + slotDuration;
      const endHour = Math.floor(endMinutes / 60);
      const endMinute = endMinutes % 60;
      
      const formattedEndTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      const slotStatus = session.bookedSlots && session.bookedSlots.includes(i) ? 'booked' : 'available';
      
      slots.push({
        id: i,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        status: slotStatus,
      });
    }
    
    return slots;
  };
  
  const timeSlots = generateTimeSlots();

  const handleSlotSelect = (slot) => {
    if (slot.status === 'booked') return;
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
      Alert.alert('Select Time Slot', 'Please select a time slot to continue');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data } = await api.post('/api/session/book', {
        sessionId,
        doctorId,
        slotIndex: selectedSlot.id,
        patientId: user._id,
      });
      
      if (data.success) {
        Alert.alert(
          'Booking Successful',
          'Your appointment has been booked successfully!',
          [
            { text: 'View My Appointments', onPress: () => router.push('/appointments') },
            { text: 'OK', onPress: () => router.push('/') }
          ]
        );
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert(
        'Booking Failed', 
        error.response?.data?.message || 'Failed to book appointment. Please try again.'
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
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#1E293B" />
            </TouchableOpacity>
          ),
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
              {session.sessionType === 'in-person' ? 'In-Person' : 'Video Call'}
            </Text>
          </View>
          
          {session.sessionType === 'in-person' && session.hospital && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={18} color="#64748B" />
              <Text style={styles.locationText}>{session.hospital.name}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Time Slot</Text>
          <Text style={styles.sectionSubtitle}>Each slot is {session.slotDuration} minutes</Text>
          
          <View style={styles.timeSlotsContainer}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[
                  styles.timeSlot,
                  slot.status === 'booked' && styles.bookedSlot,
                  selectedSlot?.id === slot.id && styles.selectedSlot
                ]}
                onPress={() => handleSlotSelect(slot)}
                disabled={slot.status === 'booked'}
              >
                <Text
                  style={[
                    styles.timeSlotText,
                    slot.status === 'booked' && styles.bookedSlotText,
                    selectedSlot?.id === slot.id && styles.selectedSlotText
                  ]}
                >
                  {`${slot.startTime} - ${slot.endTime}`}
                </Text>
                {slot.status === 'booked' && (
                  <Text style={styles.bookedText}>Booked</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
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
              {session.sessionType === 'in-person' ? 'In-Person' : 'Video Call'}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Consultation Fee</Text>
            <Text style={styles.totalValue}>${session.fee || 0}</Text>
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
            {loading ? 'Booking...' : 'Confirm Booking'}
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
    backgroundColor: '#2563EB',
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
    borderColor: '#2563EB',
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
    color: '#2563EB',
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
    marginBottom: 80,
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
    color: '#2563EB',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
  },
  confirmButton: {
    backgroundColor: '#2563EB',
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
});
