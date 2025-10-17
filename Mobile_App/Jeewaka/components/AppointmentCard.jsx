import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import VideoCallButton from './VideoCallButton';

export default function AppointmentCard({ 
  appointment, 
  type = 'upcoming', // 'upcoming' or 'past'
  onViewDoctor,
  onViewPayment,
  onWriteReview,
  loadingPaymentId,
  isOngoing = false 
}) {
  const isPast = type === 'past';

  return (
    <View 
      style={[
        styles.appointmentCard,
        isOngoing && styles.ongoingAppointmentCard
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.appointmentDate}>
          {format(parseISO(appointment.date), 'EEE, MMM dd, yyyy')}
        </Text>
        
        <View style={styles.badgeContainer}>
          {isOngoing ? (
            <View style={[styles.statusBadge, styles.ongoingBadge]}>
              <Text style={styles.statusText}>Ongoing</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, isPast && styles.pastBadge]}>
              <Text style={styles.statusText}>
                {isPast ? 'Completed' : 'Confirmed'}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={18} color="#64748B" />
          <Text style={styles.detailText}>
            {appointment.startTime} - {appointment.endTime}
          </Text>
          {isOngoing && (
            <Text style={styles.ongoingText}> • In Progress</Text>
          )}
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="medical-outline" size={18} color="#64748B" />
          <Text style={styles.detailText}>
            {appointment.doctor?.specialization && appointment.doctor?.name
              ? `${appointment.doctor.specialization} - ${appointment.doctor.name}`
              : appointment.doctor?.name || 'Doctor'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons 
            name={appointment.type === 'in-person' ? 'location-outline' : 'videocam-outline'} 
            size={18} 
            color="#64748B" 
          />
          <Text style={styles.detailText}>
            {appointment.type === 'in-person' 
              ? (appointment.hospital?.name || 'Hospital') 
              : 'Video Consultation'
            }
          </Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onViewDoctor(appointment.doctor?._id || appointment.doctor)}
        >
          <Text style={styles.actionButtonText}>View Doctor</Text>
        </TouchableOpacity>
        
        {(appointment.type === 'online' || appointment.type === 'video') && !isPast && (
          <VideoCallButton
            style={[styles.actionButton, styles.videoCallButton]}
            title="Video Call"
            sessionId={appointment.sessionId}
            slotIndex={appointment.slotIndex}
          />
        )}
        
        {isPast ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.reviewButton]}
            onPress={() => onWriteReview(appointment)}
          >
            <Text style={[styles.actionButtonText, styles.reviewButtonText]}>
              Write Review
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.paymentButton]}
            onPress={() => onViewPayment(appointment)}
            disabled={loadingPaymentId === appointment._id}
          >
            <Ionicons name="card-outline" size={16} color="#008080" />
            <Text style={[styles.actionButtonText, styles.paymentButtonText]}>
              {loadingPaymentId === appointment._id ? 'Loading...' : 'View Payment'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ongoingAppointmentCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    backgroundColor: '#008080',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  ongoingBadge: {
    backgroundColor: '#F59E0B',
  },
  pastBadge: {
    backgroundColor: '#64748B',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  appointmentDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#334155',
  },
  ongoingText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontWeight: '500',
    color: '#1E293B',
  },
  paymentButton: {
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentButtonText: {
    color: '#008080',
  },
  reviewButton: {
    backgroundColor: '#ECFDF5',
  },
  reviewButtonText: {
    color: '#10B981',
  },
  videoCallButton: {
    backgroundColor: '#49bdeaff',
  },
});