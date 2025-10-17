import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isSameDay, parse } from 'date-fns';

const SessionCard = ({ session, isPast = false, onBookSession }) => {
  // Get detailed availability information for session slots
  const getSlotAvailabilityInfo = (session) => {
    if (!session.timeSlots || session.timeSlots.length === 0) {
      return {
        total: 0,
        available: 0,
        booked: 0,
        timePassed: 0,
        isFullyBooked: false,
        isAllTimePassed: false,
        hasAvailableSlots: false,
        displayMessage: 'No Slots Available'
      };
    }

    const sessionDateObj = parseISO(session.date);
    const today = new Date();
    const isToday = isSameDay(sessionDateObj, today);

    let available = 0;
    let booked = 0;
    let timePassed = 0;

    session.timeSlots.forEach(slot => {
      if (slot.status === 'booked') {
        booked++;
      } else if (slot.status === 'available') {
        // Check if this available slot has passed its time today
        if (isToday) {
          const [hours, minutes] = slot.startTime.split(':').map(Number);
          const slotDateTime = new Date(sessionDateObj);
          slotDateTime.setHours(hours, minutes, 0, 0);
          
          if (today > slotDateTime) {
            timePassed++;
          } else {
            available++;
          }
        } else {
          available++;
        }
      } else {
        // Handle other statuses like 'unavailable'
        timePassed++;
      }
    });

    const total = session.timeSlots.length;
    const isFullyBooked = booked === total;
    const isAllTimePassed = timePassed === total && booked === 0;
    const hasAvailableSlots = available > 0;

    let displayMessage = 'Book Appointment';
    if (hasAvailableSlots) {
      displayMessage = 'Book Appointment';
    } else if (isFullyBooked) {
      displayMessage = 'Fully Booked';
    } else if (isAllTimePassed) {
      displayMessage = 'Time Passed';
    } else {
      displayMessage = 'No Available Slots';
    }

    return {
      total,
      available,
      booked,
      timePassed,
      isFullyBooked,
      isAllTimePassed,
      hasAvailableSlots,
      displayMessage
    };
  };

  const slotInfo = getSlotAvailabilityInfo(session);
  
  return (
    <View style={[styles.sessionCard, isPast && styles.pastSessionCard]}>
      <View style={styles.sessionHeader}>
        <Text style={[styles.sessionDate, isPast && styles.pastSessionDate]}>
          {format(parseISO(session.date), 'MMM dd, yyyy')}
        </Text>
        <View style={[styles.sessionTypeBadge, isPast && styles.pastSessionTypeBadge]}>
          <Text style={[styles.sessionTypeText, isPast && styles.pastSessionTypeText]}>
            {session.type === 'in-person' ? 'In-person' : 'Video'}
          </Text>
        </View>
      </View>
      
      <View style={styles.sessionDetails}>
        <View style={styles.sessionDetail}>
          <Ionicons name="time-outline" size={16} color={isPast ? "#9CA3AF" : "#64748B"} />
          <Text style={[styles.sessionDetailText, isPast && styles.pastSessionDetailText]}>
            {session.timeSlots && session.timeSlots.length > 0 
              ? `${session.timeSlots[0].startTime} - ${session.timeSlots[session.timeSlots.length - 1].endTime}` 
              : 'Time not specified'}
          </Text>
        </View>
        
        {Boolean(session.type === 'in-person' && session.hospital) && (
          <View style={styles.sessionDetail}>
            <Ionicons name="location-outline" size={16} color={isPast ? "#9CA3AF" : "#64748B"} />
            <Text style={[styles.sessionDetailText, isPast && styles.pastSessionDetailText]} numberOfLines={1}>
              {session.hospital.name}
            </Text>
          </View>
        )}
        
        <View style={styles.sessionDetail}>
          <Ionicons name="people-outline" size={16} color={isPast ? "#9CA3AF" : "#64748B"} />
          <Text style={[styles.sessionDetailText, isPast && styles.pastSessionDetailText]}>
            {session.timeSlots ? 
              isPast 
                ? `${slotInfo.total} total slots${slotInfo.booked > 0 ? `, ${slotInfo.booked} were booked` : ''}${slotInfo.available > 0 ? `, ${slotInfo.available} were available` : ''}`
                : `${slotInfo.available}/${slotInfo.total} slots available${slotInfo.booked > 0 ? `, ${slotInfo.booked} booked` : ''}${slotInfo.timePassed > 0 ? `, ${slotInfo.timePassed} time passed` : ''}` 
              : 'Slots info not available'}
          </Text>
        </View>
      </View>
      
      {!isPast && (
        <TouchableOpacity
          style={[
            styles.bookButton,
            !slotInfo.hasAvailableSlots && styles.disabledButton
          ]}
          onPress={() => onBookSession && onBookSession(session)}
          disabled={!slotInfo.hasAvailableSlots}
        >
          <Text style={styles.bookButtonText}>
            {slotInfo.displayMessage}
          </Text>
        </TouchableOpacity>
      )}
      
      {isPast && (
        <View style={styles.pastSessionFooter}>
          <Text style={styles.pastSessionLabel}>Session Completed</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sessionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  sessionTypeBadge: {
    backgroundColor: '#008080',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sessionTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  sessionDetails: {
    marginBottom: 16,
  },
  sessionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#334155',
  },
  bookButton: {
    backgroundColor: '#008080',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Past Session Card Styles
  pastSessionCard: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  pastSessionDate: {
    color: '#64748B',
  },
  pastSessionTypeBadge: {
    backgroundColor: '#64748B',
  },
  pastSessionTypeText: {
    color: '#E2E8F0',
  },
  pastSessionDetailText: {
    color: '#64748B',
  },
  pastSessionFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  pastSessionLabel: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SessionCard;