import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format, parseISO } from 'date-fns';

const SessionSummaryHeader = ({ sessionInfo, timeSlots }) => {
  if (!sessionInfo) return null;

  const bookedSlotsCount = timeSlots.filter(slot => slot.isBooked).length;

  return (
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
  );
};

const styles = StyleSheet.create({
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
});

export default SessionSummaryHeader;