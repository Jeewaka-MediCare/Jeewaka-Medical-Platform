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
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { format, parseISO } from 'date-fns';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Dimensions } from 'react-native';

const initialLayout = { width: Dimensions.get('window').width };

export default function PatientDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'upcoming', title: 'Upcoming' },
    { key: 'past', title: 'Past' },
  ]);
  
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch patient appointments
  const fetchAppointments = async () => {
    if (!user || !user._id) return;
    
    setLoading(true);
    try {
      const { data } = await api.get(`/api/session/patient/${user._id}`);
      
      // Filter appointments into upcoming and past
      const now = new Date();
      
      const upcoming = data.appointments.filter(apt => {
        const appointmentDate = parseISO(`${apt.session.date}T${apt.startTime}`);
        return appointmentDate > now;
      });
      
      const past = data.appointments.filter(apt => {
        const appointmentDate = parseISO(`${apt.session.date}T${apt.startTime}`);
        return appointmentDate <= now;
      });
      
      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, [user]);

  // Handle cancel appointment
  const handleCancelAppointment = async (appointmentId) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/api/session/cancel/${appointmentId}`);
              Alert.alert('Success', 'Appointment canceled successfully');
              fetchAppointments();
            } catch (error) {
              console.error('Error canceling appointment:', error);
              Alert.alert('Error', 'Failed to cancel appointment');
            }
          }
        }
      ]
    );
  };

  // Handle view doctor profile
  const handleViewDoctor = (doctorId) => {
    router.push(`/doctor/${doctorId}`);
  };

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
        upcomingAppointments.map((appointment) => (
          <View key={appointment._id} style={styles.appointmentCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.appointmentDate}>
                {format(parseISO(appointment.session.date), 'EEE, MMM dd, yyyy')}
              </Text>
              
              <View style={styles.badgeContainer}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Confirmed</Text>
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
                  name={appointment.session.sessionType === 'in-person' ? 'location-outline' : 'videocam-outline'} 
                  size={18} 
                  color="#64748B" 
                />
                <Text style={styles.detailText}>
                  {appointment.session.sessionType === 'in-person' 
                    ? (appointment.session.hospital?.name || 'Hospital') 
                    : 'Video Consultation'
                  }
                </Text>
              </View>
            </View>
            
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleViewDoctor(appointment.doctor._id)}
              >
                <Text style={styles.actionButtonText}>View Doctor</Text>
              </TouchableOpacity>
              
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
        ))
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
                {format(parseISO(appointment.session.date), 'EEE, MMM dd, yyyy')}
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
                  name={appointment.session.sessionType === 'in-person' ? 'location-outline' : 'videocam-outline'} 
                  size={18} 
                  color="#64748B" 
                />
                <Text style={styles.detailText}>
                  {appointment.session.sessionType === 'in-person' 
                    ? (appointment.session.hospital?.name || 'Hospital') 
                    : 'Video Consultation'
                  }
                </Text>
              </View>
            </View>
            
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleViewDoctor(appointment.doctor._id)}
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
          headerRight: () => (
            <TouchableOpacity onPress={logout} style={{ marginRight: 16 }}>
              <Ionicons name="log-out-outline" size={24} color="#1E293B" />
            </TouchableOpacity>
          ),
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
