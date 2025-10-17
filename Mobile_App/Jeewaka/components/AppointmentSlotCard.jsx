import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VideoCallButton from './VideoCallButton';

const AppointmentSlotCard = ({ 
  slot, 
  index, 
  sessionId,
  isSlotOngoing,
  isSlotPast,
  getPatientName,
  onViewMedicalRecords 
}) => {
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
                style={[
                  styles.actionButton, 
                  styles.videoCallButton,
                  isPast && styles.disabledButton
                ]}
                title={isPast ? "Call Ended" : "Join Video Call"}
                meetingId={slot.meetingId}
                sessionId={sessionId}
                slotIndex={slot.slotIndex}
                disabled={isPast}
              />
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, styles.medicalRecordsButton]}
              onPress={() => onViewMedicalRecords(slot)}
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

const styles = StyleSheet.create({
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
  disabledButton: {
    backgroundColor: '#61656cff',
    borderColor: '#61656cff',
    opacity: 0.6,
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

export default AppointmentSlotCard;