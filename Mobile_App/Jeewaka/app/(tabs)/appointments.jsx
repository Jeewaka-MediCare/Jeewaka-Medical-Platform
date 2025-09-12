import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { format, parseISO } from 'date-fns';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Dimensions } from 'react-native';
import VideoCallButton from '../../components/VideoCallButton';
import DoctorDashboardContent from '../../components/DoctorDashboardContent';

const initialLayout = { width: Dimensions.get('window').width };

export default function Appointments() {
  const { user, userRole, loading } = useAuthStore();
  const router = useRouter();
  
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'upcoming', title: 'Upcoming' },
    { key: 'past', title: 'Past' },
  ]);
  
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch patient appointments
  const fetchAppointments = async () => {
    if (!user || !user._id) return;
    
    setAppointmentsLoading(true);
    try {
      console.log('Fetching appointments for patient:', user._id);
      const { data } = await api.get('/api/session');
      
      // Filter sessions that have appointments for this patient
      const patientSessions = (data || []).filter(session =>
        session.timeSlots && session.timeSlots.some(slot =>
          slot.patientId && slot.patientId === user._id
        )
      );
      
      // Transform session data into individual appointments
      const appointments = [];
      patientSessions.forEach(session => {
        // Get all time slots and find ones for this patient
        session.timeSlots.forEach((slot, originalSlotIndex) => {
          if (slot.patientId && slot.patientId === user._id) {
            appointments.push({
              _id: `${session._id}_${slot.startTime}_${slot.endTime}`,
              sessionId: session._id,
              slotIndex: originalSlotIndex, // Use original slot index for backend API calls
              date: session.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              status: slot.status,
              appointmentStatus: slot.appointmentStatus,
              doctor: session.doctorId,
              hospital: session.hospital,
              meetingLink: session.meetingLink,
              type: session.type
            });
          }
        });
      });
      
      console.log('Appointments received:', appointments.length, 'appointments');
      
      // Filter appointments into upcoming and past
      const now = new Date();
      console.log('Current time:', now.toISOString());
      
      const upcoming = appointments.filter(apt => {
        try {
          // Extract just the date part from the ISO string and combine with end time
          // Appointment is upcoming if it hasn't ended yet
          const dateOnly = apt.date.split('T')[0]; // Get '2025-02-08' from '2025-02-08T00:00:00.000Z'
          const appointmentEndDate = parseISO(`${dateOnly}T${apt.endTime}`);
          console.log(`Appointment: ${dateOnly}T${apt.startTime}-${apt.endTime} -> End: ${appointmentEndDate.toISOString()}`);
          return appointmentEndDate > now;
        } catch (error) {
          console.error('Error parsing appointment date:', apt.date, apt.endTime, error);
          return false;
        }
      });
      
      const past = appointments.filter(apt => {
        try {
          // Extract just the date part from the ISO string and combine with end time
          // Appointment is past only when it has completely ended
          const dateOnly = apt.date.split('T')[0]; // Get '2025-02-08' from '2025-02-08T00:00:00.000Z'
          const appointmentEndDate = parseISO(`${dateOnly}T${apt.endTime}`);
          return appointmentEndDate <= now;
        } catch (error) {
          console.error('Error parsing appointment date:', apt.date, apt.endTime, error);
          return false;
        }
      });
      
      console.log('Total appointments processed:', appointments.length);
      console.log('Upcoming appointments:', upcoming.length);
      console.log('Past appointments:', past.length);
      
      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setAppointmentsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  // Fetch appointments when user is available
  useEffect(() => {
    if (user && userRole === 'patient') {
      fetchAppointments();
    }
  }, [user, userRole]);

  // Handle cancel appointment - temporarily disabled
  const handleCancelAppointment = async (appointmentId) => {
    Alert.alert('Coming Soon', 'Appointment cancellation feature will be available soon');
  };

  // Helper function to check if appointment is currently ongoing
  const isAppointmentOngoing = (appointment) => {
    try {
      const now = new Date();
      const dateOnly = appointment.date.split('T')[0];
      const appointmentStartDate = parseISO(`${dateOnly}T${appointment.startTime}`);
      const appointmentEndDate = parseISO(`${dateOnly}T${appointment.endTime}`);
      
      return now >= appointmentStartDate && now <= appointmentEndDate;
    } catch (error) {
      console.error('Error checking if appointment is ongoing:', error);
      return false;
    }
  };

  // Handle view doctor profile
  const handleViewDoctor = (doctorId) => {
    router.push(`/doctor/${doctorId}`);
  };

  // If not logged in, show login prompt
  if (!loading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'My Appointments',
            headerShown: true,
          }}
        />
        
        <View style={styles.content}>
          <Ionicons name="calendar-outline" size={80} color="#94A3B8" style={styles.icon} />
          <Text style={styles.title}>Login Required</Text>
          <Text style={styles.message}>
            You need to log in to view your appointments
          </Text>
          
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={() => router.push('/register')}
          >
            <Text style={styles.registerButtonText}>Create an Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // If user is doctor, show doctor dashboard directly in appointments tab
  if (!loading && user && userRole === 'doctor') {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Dashboard',
            headerShown: true,
          }}
        />
        <DoctorDashboardContent />
      </SafeAreaView>
    );
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'My Appointments',
            headerShown: true,
          }}
        />
        
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Tab scenes
  const UpcomingAppointmentsScene = () => (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2563EB']}
        />
      }
    >
      {upcomingAppointments.length > 0 ? (
        upcomingAppointments.map((appointment) => {
          const isOngoing = isAppointmentOngoing(appointment);
          
          return (
            <View 
              key={appointment._id} 
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
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Confirmed</Text>
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
                    {appointment.doctor?.name || 'Doctor'}
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
                  onPress={() => handleViewDoctor(appointment.doctor?._id || appointment.doctor)}
                >
                  <Text style={styles.actionButtonText}>View Doctor</Text>
                </TouchableOpacity>
                
                {appointment.type === 'online' && (
                  <VideoCallButton
                    style={[styles.actionButton, styles.videoCallButton]}
                    title="Join Video Call"
                    sessionId={appointment.sessionId}
                    slotIndex={appointment.slotIndex}
                  />
                )}
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleCancelAppointment(appointment._id)}
                >
                  <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Upcoming Appointments</Text>
          <Text style={styles.emptyText}>
            You don't have any upcoming appointments. Book a consultation with a doctor.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.emptyActionText}>Find Doctors</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const PastAppointmentsScene = () => (
    <ScrollView
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#2563EB']}
        />
      }
    >
      {pastAppointments.length > 0 ? (
        pastAppointments.map((appointment) => (
          <View key={appointment._id} style={styles.appointmentCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.appointmentDate}>
                {format(parseISO(appointment.date), 'EEE, MMM dd, yyyy')}
              </Text>
              
              <View style={styles.badgeContainer}>
                <View style={[styles.statusBadge, styles.pastBadge]}>
                  <Text style={styles.statusText}>Completed</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.appointmentDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={18} color="#64748B" />
                <Text style={styles.detailText}>
                  {appointment.startTime} - {appointment.endTime}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="medical-outline" size={18} color="#64748B" />
                <Text style={styles.detailText}>
                  {appointment.doctor?.name || 'Doctor'}
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
                onPress={() => handleViewDoctor(appointment.doctor?._id || appointment.doctor)}
              >
                <Text style={styles.actionButtonText}>View Doctor</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.reviewButton]}
                onPress={() => router.push({
                  pathname: '/write-review',
                  params: {
                    doctorId: appointment.doctor._id,
                    doctorName: appointment.doctor.name,
                    appointmentId: appointment._id
                  }
                })}
              >
                <Text style={[styles.actionButtonText, styles.reviewButtonText]}>
                  Write Review
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Past Appointments</Text>
          <Text style={styles.emptyText}>
            You don't have any past appointments. Once you complete a consultation, it will appear here.
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderScene = SceneMap({
    upcoming: UpcomingAppointmentsScene,
    past: PastAppointmentsScene,
  });

  const renderTabBar = props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: '#2563EB' }}
      style={{ backgroundColor: 'white', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}
      labelStyle={{ color: '#1E293B', fontWeight: '500', textTransform: 'none' }}
      activeColor="#2563EB"
      inactiveColor="#64748B"
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'My Appointments',
        }}
      />
      
      {user ? (
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.nameText}>{user.name}</Text>
          </View>
        </View>
      ) : null}
      
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={renderTabBar}
        style={styles.tabView}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  loginButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  registerButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
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
  profileCard: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profileInfo: {
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#64748B',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  tabView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    flexGrow: 1,
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
    backgroundColor: '#2563EB',
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
  cancelButton: {
    backgroundColor: '#FEE2E2',
  },
  cancelButtonText: {
    color: '#EF4444',
  },
  reviewButton: {
    backgroundColor: '#ECFDF5',
  },
  reviewButtonText: {
    color: '#10B981',
  },
  videoCallButton: {
    backgroundColor: '#DBEAFE',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyActionButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
