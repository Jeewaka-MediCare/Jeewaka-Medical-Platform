import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SessionCard from './SessionCard';

const DoctorSessionsTab = ({ 
  upcomingSessions, 
  pastSessions, 
  onBookSession, 
  onShowPastSessions 
}) => {
  return (
    <View style={styles.sessionsContainer}>
      <View style={styles.sessionHeaderRow}>
        <Text style={styles.sectionTitle}>Available Sessions</Text>
        {pastSessions.length > 0 && (
          <TouchableOpacity 
            style={styles.pastSessionsButton}
            onPress={onShowPastSessions}
          >
            <Text style={styles.pastSessionsButtonText}>See Past Sessions</Text>
            <Ionicons name="chevron-forward" size={16} color="#008080" />
          </TouchableOpacity>
        )}
      </View>
      
      {Boolean(upcomingSessions && upcomingSessions.length > 0) ? (
        upcomingSessions.map((session) => (
          <SessionCard 
            key={session._id} 
            session={session} 
            onBookSession={onBookSession}
          />
        ))
      ) : (
        <Text style={styles.noDataText}>No upcoming sessions available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sessionsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pastSessionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  pastSessionsButtonText: {
    color: '#008080',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  noDataText: {
    color: '#94A3B8',
    fontSize: 15,
    fontStyle: 'italic',
  },
});

export default DoctorSessionsTab;