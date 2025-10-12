import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { format, parseISO, addDays } from 'date-fns';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Dimensions } from 'react-native';
import { TextInput, GestureHandlerRootView } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import VideoCallButton from './VideoCallButton';
import { useRouter } from 'expo-router';

const initialLayout = { width: Dimensions.get('window').width };

export default function DoctorSessionContent() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  const [tabIndex, setTabIndex] = useState(0);
  const [routes] = useState([
    { key: 'upcoming', title: 'Upcoming' },
    { key: 'past', title: 'Past' },
  ]);
  
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Session creation modal
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newSession, setNewSession] = useState({
    date: addDays(new Date(), 1),
    startTime: '09:00',
    slotDuration: 15,
    totalSlots: 6,
    sessionType: 'in-person',
    hospital: '',
  });
  
  // Hospital options
  const [hospitals, setHospitals] = useState([]);

  // Fetch sessions
  const fetchSessions = async () => {
    if (!user || !user._id) return;
    
    setLoading(true);
    try {
      const { data } = await api.get('/api/session');
      
      // Filter sessions for this doctor only
      const doctorSessions = (data || []).filter(session => 
        session.doctorId && session.doctorId._id === user._id
      );
      
      setSessions(doctorSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  // Fetch hospitals
  const fetchHospitals = async () => {
    try {
      const { data } = await api.get('/api/hospital');
      setHospitals(data || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSessions();
      fetchHospitals();
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
  };

  // Handle cancel appointment - temporarily disabled
  const handleCancelAppointment = async (appointmentId) => {
    Alert.alert('Coming Soon', 'Appointment cancellation feature will be available soon');
  };

  // Handle session click to navigate to appointments for that session
  const handleSessionPress = useCallback((session) => {
    const bookedSlots = getBookedSlotsCount(session);
    if (bookedSlots > 0) {
      router.push(`/session-appointments/${session._id}`);
    }
  }, [router]);

  // Create time slots array based on form inputs
  const createTimeSlots = useCallback(() => {
    const slots = [];
    const startHour = parseInt(newSession.startTime.split(':')[0]);
    const startMinute = parseInt(newSession.startTime.split(':')[1]);
    
    for (let i = 0; i < newSession.totalSlots; i++) {
      const slotStartMinutes = startHour * 60 + startMinute + (i * newSession.slotDuration);
      const slotEndMinutes = slotStartMinutes + newSession.slotDuration;
      
      // Handle 24-hour wrap-around properly
      const startHourCalculated = Math.floor(slotStartMinutes / 60) % 24;
      const endHourCalculated = Math.floor(slotEndMinutes / 60) % 24;
      
      const startTime = `${startHourCalculated.toString().padStart(2, '0')}:${(slotStartMinutes % 60).toString().padStart(2, '0')}`;
      const endTime = `${endHourCalculated.toString().padStart(2, '0')}:${(slotEndMinutes % 60).toString().padStart(2, '0')}`;
      
      slots.push({
        startTime,
        endTime,
        status: 'available'
      });
    }
    
    return slots;
  }, [newSession.startTime, newSession.totalSlots, newSession.slotDuration]);

  const getSessionEndDateTime = useCallback((session) => {
    const lastSlot = session.timeSlots?.[session.timeSlots.length - 1];
    const firstSlot = session.timeSlots?.[0];
    if (!lastSlot || !firstSlot) return null;
    
    const sessionEndDateTime = new Date(session.date);
    const [endHours, endMinutes] = lastSlot.endTime.split(':');
    const [startHours] = firstSlot.startTime.split(':');
    
    // If end hour is less than start hour, it means the session crosses midnight
    // so we need to add a day to the end time
    if (parseInt(endHours) < parseInt(startHours)) {
      sessionEndDateTime.setDate(sessionEndDateTime.getDate() + 1);
    }
    
    sessionEndDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
    return sessionEndDateTime;
  }, []);

  // Helper function to check if a session is in the past
  const isSessionPast = useCallback((session) => {
    const sessionEndDateTime = getSessionEndDateTime(session);
    if (!sessionEndDateTime) return false;
    return sessionEndDateTime < new Date();
  }, [getSessionEndDateTime]);

  // Helper function to sort sessions (upcoming first, past last)  
  const sortedSessions = useMemo(() => {
    const now = new Date();
    
    // Separate sessions into future and past
    const futureSessions = [];
    const pastSessions = [];
    
    sessions.forEach((session) => {
      const sessionEndTime = getSessionEndDateTime(session);
      
      if (sessionEndTime && sessionEndTime >= now) {
        futureSessions.push(session);
      } else {
        pastSessions.push(session);
      }
    });
    
    // Sort future sessions: earliest first
    futureSessions.sort((a, b) => {
      const dateA = new Date(a.date);
      const firstSlotA = a.timeSlots?.[0];
      if (firstSlotA?.startTime) {
        const [hours, minutes] = firstSlotA.startTime.split(':');
        dateA.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      
      const dateB = new Date(b.date);
      const firstSlotB = b.timeSlots?.[0];
      if (firstSlotB?.startTime) {
        const [hours, minutes] = firstSlotB.startTime.split(':');
        dateB.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      
      return dateA - dateB;
    });
    
    // Sort past sessions: most recent first  
    pastSessions.sort((a, b) => {
      const dateA = new Date(a.date);
      const firstSlotA = a.timeSlots?.[0];
      if (firstSlotA?.startTime) {
        const [hours, minutes] = firstSlotA.startTime.split(':');
        dateA.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      
      const dateB = new Date(b.date);
      const firstSlotB = b.timeSlots?.[0];
      if (firstSlotB?.startTime) {
        const [hours, minutes] = firstSlotB.startTime.split(':');
        dateB.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      
      return dateB - dateA; // Reverse order for past sessions
    });
    
    // Combine: future sessions first, then past sessions
    return [...futureSessions, ...pastSessions];
  }, [sessions, getSessionEndDateTime]);

  // Separate upcoming and past sessions with proper sorting
  const upcomingSessions = useMemo(() => {
    const now = new Date();
    
    // Get future sessions
    const futureSessions = [];
    
    sessions.forEach((session) => {
      const sessionEndTime = getSessionEndDateTime(session);
      
      if (sessionEndTime && sessionEndTime >= now) {
        futureSessions.push(session);
      }
    });
    
    // Sort future sessions: earliest first
    futureSessions.sort((a, b) => {
      const dateA = new Date(a.date);
      const firstSlotA = a.timeSlots?.[0];
      if (firstSlotA?.startTime) {
        const [hours, minutes] = firstSlotA.startTime.split(':');
        dateA.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      
      const dateB = new Date(b.date);
      const firstSlotB = b.timeSlots?.[0];
      if (firstSlotB?.startTime) {
        const [hours, minutes] = firstSlotB.startTime.split(':');
        dateB.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      
      return dateA - dateB;
    });
    
    return futureSessions;
  }, [sessions, getSessionEndDateTime]);

  const pastSessions = useMemo(() => {
    const now = new Date();
    
    // Get past sessions
    const pastSessionsList = [];
    
    sessions.forEach((session) => {
      const sessionEndTime = getSessionEndDateTime(session);
      
      if (sessionEndTime && sessionEndTime < now) {
        pastSessionsList.push(session);
      }
    });
    
    // Sort past sessions: most recent first  
    pastSessionsList.sort((a, b) => {
      const dateA = new Date(a.date);
      const firstSlotA = a.timeSlots?.[0];
      if (firstSlotA?.startTime) {
        const [hours, minutes] = firstSlotA.startTime.split(':');
        dateA.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      
      const dateB = new Date(b.date);
      const firstSlotB = b.timeSlots?.[0];
      if (firstSlotB?.startTime) {
        const [hours, minutes] = firstSlotB.startTime.split(':');
        dateB.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      
      return dateB - dateA; // Reverse order for past sessions
    });
    
    return pastSessionsList;
  }, [sessions, getSessionEndDateTime]);

  // Helper function to get booked slots count
  const getBookedSlotsCount = useCallback((session) => {
    return session.timeSlots?.filter(slot => slot.patientId).length || 0;
  }, []);

  // Handle session cancellation
  const handleCancelSession = useCallback(async (sessionId) => {
    Alert.alert(
      'Cancel Session',
      'Are you sure you want to cancel this session? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/session/${sessionId}`);
              await fetchSessions();
              Alert.alert('Success', 'Session cancelled successfully');
            } catch (error) {
              console.error('Error cancelling session:', error);
              Alert.alert('Error', 'Failed to cancel session');
            }
          },
        },
      ]
    );
  }, [fetchSessions]);

  // Render session card
  const renderSessionCard = useCallback((session) => {
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
            <Ionicons name="chevron-forward" size={20} color="#2563EB" />
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
          <ActivityIndicator size="large" color="#2563EB" />
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
          <ActivityIndicator size="large" color="#2563EB" />
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
      indicatorStyle={{ backgroundColor: '#2563EB' }}
      style={{ backgroundColor: 'white', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}
      labelStyle={{ color: '#1E293B', fontWeight: '500', textTransform: 'none' }}
      activeColor="#2563EB"
      inactiveColor="#64748B"
    />
  ), []);

  // Handle session creation
  const handleCreateSession = useCallback(async () => {
    if (!user) return;
    
    try {
      // Validate required fields
      if (newSession.sessionType === 'in-person' && !newSession.hospital) {
        Alert.alert('Error', 'Please select a hospital for in-person sessions');
        return;
      }
      
      const timeSlots = createTimeSlots();
      
      const payload = {
        doctorId: user._id,
        timeSlots: timeSlots,
        type: newSession.sessionType, // Changed from 'sessionType' to 'type'
        date: format(newSession.date, 'yyyy-MM-dd'),
      };
      
      // Add hospital for in-person sessions
      if (newSession.sessionType === 'in-person' && newSession.hospital) {
        payload.hospital = newSession.hospital;
      }
      
      console.log('Creating session with payload:', payload);
      
      const response = await api.post('/api/session', payload);
      
      if (response.data) {
        Alert.alert('Success', 'Session created successfully!');
        setModalVisible(false);
        
        // Reset form
        setNewSession({
          date: addDays(new Date(), 1),
          startTime: '09:00',
          slotDuration: 30,
          totalSlots: 6,
          sessionType: 'in-person',
          hospital: '',
        });
        
        // Refresh data immediately
        await fetchSessions();
      }
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create session');
    }
  }, [user, newSession, fetchSessions, createTimeSlots]);

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
                    <Ionicons name="chevron-forward" size={20} color="#2563EB" />
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
    backgroundColor: '#2563EB',
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
    borderColor: '#2563EB',
    borderWidth: 2,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#2563EB',
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
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
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
    backgroundColor: '#2563EB',
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
    backgroundColor: '#2563EB',
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