import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../store/authStore';
import { format, parseISO, isSameDay } from 'date-fns';
import { TabView, TabBar } from 'react-native-tab-view';
import { Dimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import SessionFilters from './SessionFilters';
import useDoctorSessionsLogic from '../hooks/useDoctorSessionsLogic';

export default function DoctorSessionContent() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  // Use the custom hook for all business logic
  const {
    // State
    tabIndex,
    setTabIndex,
    routes,
    sessions,
    filteredSessions,
    loading,
    refreshing,
    filters,
    setFilters,
    
    // Modal state
    modalVisible,
    setModalVisible,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    newSession,
    setNewSession,
    
    // Data
    hospitals,
    hospitalNames,
    upcomingSessions,
    pastSessions,
    sortedSessions,
    
    // Functions
    fetchSessions,
    fetchHospitals,
    handleFiltersChange,
    handleSectionChange,
    onRefresh,
    handleSessionPress,
    createTimeSlots,
    getSessionEndDateTime,
    isSessionPast,
    getBookedSlotsCount,
    handleCancelSession,
    handleCreateSession,
  } = useDoctorSessionsLogic(user, router);

  // Render session card
  const renderSessionCard = useCallback((session) => {
    const bookedSlots = getBookedSlotsCount(session);
    const totalSlots = session.timeSlots?.length || 0;
    const isPast = isSessionPast(session);
    const isToday = isSameDay(new Date(), parseISO(session.date));
    const canCancel = !isPast && bookedSlots === 0; // Only show cancel if NOT past AND no bookings
    const hasBookings = bookedSlots > 0; // Check if session has any bookings

    return (
      <TouchableOpacity 
        key={session._id} 
        style={[
          styles.sessionCard, 
          isPast && styles.pastSessionCard,
          hasBookings && !isToday && styles.clickableSessionCard, // Only apply if not today
          !isPast && isToday && styles.todaySessionCard, // Today takes priority
        ]}
        onPress={() => handleSessionPress(session)}
        disabled={!hasBookings}
        activeOpacity={hasBookings ? 0.7 : 1}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.sessionDate, isPast && styles.pastSessionText]}>
            {format(parseISO(session.date), 'EEE, MMM dd, yyyy')}
          </Text>
          <View style={styles.badgeContainer}>
            {isPast && (
              <View style={[styles.statusBadge, { backgroundColor: '#64748B' }]}>
                <Text style={styles.statusText}>Past</Text>
              </View>
            )}
            <View style={styles.sessionStats}>
              <Text style={styles.sessionStatsText}>
                {bookedSlots}/{totalSlots} booked
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.sessionDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color="#64748B" />
            <Text style={styles.detailText}>
              {session.timeSlots?.[0]?.startTime} - {session.timeSlots?.[session.timeSlots.length - 1]?.endTime}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Ionicons 
              name={session.type === 'in-person' ? 'location-outline' : 'videocam-outline'} 
              size={18} 
              color="#64748B" 
            />
            <Text style={styles.detailText}>
              {session.type === 'in-person' 
                ? (session.hospital?.name || 'Hospital') 
                : 'Video Consultation'
              }
            </Text>
          </View>

          {/* Display individual slot times */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color="#64748B" />
            <View style={styles.slotTimesContainer}>
              <Text style={styles.detailText}>
                Available slots: 
              </Text>
              <View style={styles.slotTimesWrapper}>
                {session.timeSlots?.map((slot, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.slotTimeChip,
                      slot.patientId && styles.bookedSlotChip
                    ]}
                  >
                    <Text style={[
                      styles.slotTimeText,
                      slot.patientId && styles.bookedSlotText
                    ]}>
                      {slot.startTime}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        {canCancel && (
          <View style={styles.cardActionsRight}>
            <TouchableOpacity 
              style={[styles.smallCancelButton]}
              onPress={() => handleCancelSession(session._id)}
            >
              <Text style={styles.smallCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Add visual indicator if session has bookings */}
        {hasBookings && (
          <View style={styles.clickableIndicator}>
            <Ionicons name="chevron-forward" size={20} color="#008080" />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [getBookedSlotsCount, isSessionPast, handleSessionPress, handleCancelSession]);

  // Upcoming Sessions Scene
  const UpcomingSessionsScene = useCallback(() => (
    <View style={styles.scene}>
      <View style={styles.createSessionHeader}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create Session</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008080" />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : (
        <ScrollView 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {upcomingSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={60} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Upcoming Sessions</Text>
              <Text style={styles.emptyMessage}>Create your first session to start accepting appointments</Text>
            </View>
          ) : (
            upcomingSessions.map(renderSessionCard)
          )}
        </ScrollView>
      )}
    </View>
  ), [upcomingSessions, refreshing, onRefresh, modalVisible, renderSessionCard, loading]);

  // Past Sessions Scene
  const PastSessionsScene = useCallback(() => (
    <View style={styles.scene}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008080" />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : (
        <ScrollView 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {pastSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={60} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Past Sessions</Text>
              <Text style={styles.emptyMessage}>Your completed sessions will appear here</Text>
            </View>
          ) : (
            pastSessions.map(renderSessionCard)
          )}
        </ScrollView>
      )}
    </View>
  ), [pastSessions, refreshing, onRefresh, renderSessionCard, loading]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'upcoming':
        return UpcomingSessionsScene();
      case 'past':
        return PastSessionsScene();
      default:
        return null;
    }
  };

  const renderTabBar = useCallback(props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#008080' }}
      style={{ backgroundColor: 'white', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}
      labelStyle={{ color: '#1E293B', fontWeight: '500', textTransform: 'none' }}
      activeColor="#008080"
      inactiveColor="#64748B"
    />
  ), []);

  // Sessions Scene  
  const SessionsScene = useCallback(() => (
    <View style={styles.scene}>
      <View style={styles.createSessionHeader}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create Session</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {sortedSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={60} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Sessions</Text>
            <Text style={styles.emptyMessage}>Create your first session to start accepting appointments</Text>
          </View>
        ) : (
          sortedSessions.map((session) => {
            const bookedSlots = getBookedSlotsCount(session);
            const totalSlots = session.timeSlots?.length || 0;
            const isPast = isSessionPast(session);
            const canCancel = !isPast && bookedSlots === 0; // Only show cancel if NOT past AND no bookings
            const hasBookings = bookedSlots > 0; // Check if session has any bookings

            return (
              <TouchableOpacity 
                key={session._id} 
                style={[
                  styles.sessionCard, 
                  isPast && styles.pastSessionCard,
                  hasBookings && styles.clickableSessionCard
                ]}
                onPress={() => handleSessionPress(session)}
                disabled={!hasBookings}
                activeOpacity={hasBookings ? 0.7 : 1}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.sessionDate, isPast && styles.pastSessionText]}>
                    {format(parseISO(session.date), 'EEE, MMM dd, yyyy')}
                  </Text>
                  <View style={styles.badgeContainer}>
                    {isPast && (
                      <View style={[styles.statusBadge, { backgroundColor: '#64748B' }]}>
                        <Text style={styles.statusText}>Past</Text>
                      </View>
                    )}
                    <View style={styles.sessionStats}>
                      <Text style={styles.sessionStatsText}>
                        {bookedSlots}/{totalSlots} booked
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.sessionDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={18} color="#64748B" />
                    <Text style={styles.detailText}>
                      {session.timeSlots?.[0]?.startTime} - {session.timeSlots?.[session.timeSlots.length - 1]?.endTime}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Ionicons 
                      name={session.type === 'in-person' ? 'location-outline' : 'videocam-outline'} 
                      size={18} 
                      color="#64748B" 
                    />
                    <Text style={styles.detailText}>
                      {session.type === 'in-person' 
                        ? (session.hospital?.name || 'Hospital') 
                        : 'Video Consultation'
                      }
                    </Text>
                  </View>

                  {/* Display individual slot times */}
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={18} color="#64748B" />
                    <View style={styles.slotTimesContainer}>
                      <Text style={styles.detailText}>
                        Available slots: 
                      </Text>
                      <View style={styles.slotTimesWrapper}>
                        {session.timeSlots?.map((slot, index) => (
                          <View 
                            key={index} 
                            style={[
                              styles.slotTimeChip,
                              slot.patientId && styles.bookedSlotChip
                            ]}
                          >
                            <Text style={[
                              styles.slotTimeText,
                              slot.patientId && styles.bookedSlotText
                            ]}>
                              {slot.startTime}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>

                {/* Action buttons */}
                {canCancel && (
                  <View style={styles.cardActionsRight}>
                    <TouchableOpacity 
                      style={[styles.smallCancelButton]}
                      onPress={() => handleCancelSession(session._id)}
                    >
                      <Text style={styles.smallCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {/* Add visual indicator if session has bookings */}
                {hasBookings && (
                  <View style={styles.clickableIndicator}>
                    <Ionicons name="chevron-forward" size={20} color="#008080" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  ), [sortedSessions, refreshing, onRefresh, modalVisible, getBookedSlotsCount, isSessionPast, handleCancelSession, handleSessionPress]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.scene}>
        {/* Session Filters */}
        <SessionFilters
          onFiltersChange={handleFiltersChange}
          onSectionChange={handleSectionChange}
          currentSection={tabIndex === 0 ? 'upcoming' : 'past'}
          hospitals={hospitalNames}
        />
        
        <TabView
          navigationState={{ index: tabIndex, routes }}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
          onIndexChange={setTabIndex}
          initialLayout={{ width: Dimensions.get('window').width }}
        />
      </View>
      
      {/* Session Creation Modal - Moved outside TabView */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Session</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.actionButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date</Text>
                <TouchableOpacity 
                  style={styles.formInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {format(newSession.date, 'PPP')}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#64748B" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={newSession.date}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setNewSession(prev => ({ ...prev, date: selectedDate }));
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Start Time</Text>
                <TouchableOpacity 
                  style={styles.formInput}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {newSession.startTime}
                  </Text>
                  <Ionicons name="time-outline" size={20} color="#64748B" />
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={(() => {
                      // Create a proper Date object for the time picker
                      const [hours, minutes] = newSession.startTime.split(':');
                      const date = new Date();
                      date.setHours(parseInt(hours) || 9, parseInt(minutes) || 0, 0, 0);
                      return date;
                    })()}
                    mode="time"
                    display="default"
                    onChange={(event, selectedTime) => {
                      setShowTimePicker(false);
                      if (selectedTime) {
                        // Get hours and minutes properly
                        let hours = selectedTime.getHours();
                        let minutes = selectedTime.getMinutes();
                        
                        // Ensure hours are in valid 24-hour format (0-23)
                        hours = hours % 24;
                        
                        // Round minutes to nearest 15-minute interval for cleaner times
                        minutes = Math.round(minutes / 15) * 15;
                        if (minutes === 60) {
                          hours = (hours + 1) % 24;
                          minutes = 0;
                        }
                        
                        // Format with proper 24-hour format (00-23)
                        const formattedHours = hours.toString().padStart(2, '0');
                        const formattedMinutes = minutes.toString().padStart(2, '0');
                        const timeString = `${formattedHours}:${formattedMinutes}`;
                        
                        setNewSession(prev => ({ ...prev, startTime: timeString }));
                      }
                    }}
                  />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Slot Duration (minutes)</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity 
                    style={styles.stepperButton}
                    onPress={() => setNewSession(prev => ({ 
                      ...prev, 
                      slotDuration: Math.max(15, prev.slotDuration - 5) 
                    }))}
                  >
                    <Ionicons name="remove" size={20} color="#64748B" />
                  </TouchableOpacity>
                  <View style={styles.stepperValue}>
                    <Text style={styles.stepperText}>{newSession.slotDuration} min</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.stepperButton, { borderRightWidth: 0 }]}
                    onPress={() => setNewSession(prev => ({ 
                      ...prev, 
                      slotDuration: Math.min(120, prev.slotDuration + 5) 
                    }))}
                  >
                    <Ionicons name="add" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>Duration per appointment slot (15-120 minutes)</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Number of Slots</Text>
                <View style={styles.stepperContainer}>
                  <TouchableOpacity 
                    style={styles.stepperButton}
                    onPress={() => setNewSession(prev => ({ 
                      ...prev, 
                      totalSlots: Math.max(1, prev.totalSlots - 1) 
                    }))}
                  >
                    <Ionicons name="remove" size={20} color="#64748B" />
                  </TouchableOpacity>
                  <View style={styles.stepperValue}>
                    <Text style={styles.stepperText}>{newSession.totalSlots}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.stepperButton, { borderRightWidth: 0 }]}
                    onPress={() => setNewSession(prev => ({ 
                      ...prev, 
                      totalSlots: Math.min(20, prev.totalSlots + 1) 
                    }))}
                  >
                    <Ionicons name="add" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>Total appointment slots available for this session</Text>
              </View>

              <View style={[styles.formGroup, { marginBottom: newSession.sessionType === 'video' ? 40 : 20 }]}>
                <Text style={styles.formLabel}>Session Type</Text>
                <View style={styles.sessionTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.sessionTypeButton,
                      newSession.sessionType === 'in-person' && styles.sessionTypeButtonActive
                    ]}
                    onPress={() => setNewSession(prev => ({ ...prev, sessionType: 'in-person' }))}
                  >
                    <Ionicons 
                      name="location-outline" 
                      size={20} 
                      color={newSession.sessionType === 'in-person' ? 'white' : '#64748B'} 
                    />
                    <Text style={[
                      styles.sessionTypeText,
                      newSession.sessionType === 'in-person' && styles.sessionTypeTextActive
                    ]}>In-Person</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sessionTypeButton,
                      newSession.sessionType === 'video' && styles.sessionTypeButtonActive
                    ]}
                    onPress={() => setNewSession(prev => ({ ...prev, sessionType: 'video' }))}
                  >
                    <Ionicons 
                      name="videocam-outline" 
                      size={20} 
                      color={newSession.sessionType === 'video' ? 'white' : '#64748B'} 
                    />
                    <Text style={[
                      styles.sessionTypeText,
                      newSession.sessionType === 'video' && styles.sessionTypeTextActive
                    ]}>Video Call</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {newSession.sessionType === 'in-person' && (
                <View style={[styles.formGroup, { marginBottom: 40 }]}>
                  <Text style={styles.formLabel}>Hospital</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={newSession.hospital}
                      style={styles.picker}
                      onValueChange={(itemValue) =>
                        setNewSession(prev => ({ ...prev, hospital: itemValue }))
                      }
                    >
                      <Picker.Item label="Select a hospital" value="" />
                      {hospitals.map((hospital) => (
                        <Picker.Item 
                          key={hospital._id || hospital.id} 
                          label={hospital.name} 
                          value={hospital._id || hospital.id} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalCreateButton}
                onPress={handleCreateSession}
              >
                <Text style={styles.createSessionButtonText}>Create Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabView: {
    flex: 1,
  },
  scene: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  createSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008080',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
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
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  clickableSessionCard: {
    borderColor: '#008080',
    borderWidth: 2,
    backgroundColor: '#F8FAFC',
  },
  todaySessionCard: {
    backgroundColor: '#d1f4f4ff', // Very light teal
    borderColor: '#008080',
    borderWidth: 2, // Use thicker border like clickable cards
  },
  clickableIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 4,
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
  sessionDate: {
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
  completedBadge: {
    backgroundColor: '#10B981',
  },
  pastAppointmentCard: {
    opacity: 0.8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  sessionStats: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  sessionStatsText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  appointmentDetails: {
    marginBottom: 16,
  },
  sessionDetails: {
    marginBottom: 0,
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
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    minWidth: 100,
    alignItems: 'center',
  },
  videoCallButton: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  cancelButton: {
    borderColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  cancelButtonText: {
    color: '#EF4444',
  },
  medicalRecordsButton: {
    borderColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  medicalRecordsButtonText: {
    color: '#0066CC',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#1E293B',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
    color: '#1E293B',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  sessionTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
  },
  sessionTypeButtonActive: {
    backgroundColor: '#008080',
    borderColor: '#008080',
  },
  sessionTypeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  sessionTypeTextActive: {
    color: 'white',
  },
  createSessionButton: {
    backgroundColor: '#008080',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createSessionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 16,
  },
  modalCancelButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  modalCancelText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCreateButton: {
    backgroundColor: '#008080',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 140,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  stepperButton: {
    padding: 12,
    borderRightWidth: 1,
    borderColor: '#D1D5DB',
  },
  stepperValue: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  stepperText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  pastSessionCard: {
    opacity: 0.7,
    borderColor: '#E2E8F0',
  },
  pastSessionText: {
    color: '#64748B',
  },
  slotTimesContainer: {
    flex: 1,
    marginLeft: 8,
  },
  slotTimesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  slotTimeChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookedSlotChip: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  slotTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  bookedSlotText: {
    color: '#DC2626',
  },
  smallCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  smallCancelText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
  },
  cardActionsRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
});