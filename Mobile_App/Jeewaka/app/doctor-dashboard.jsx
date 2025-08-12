import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import { format, parseISO, addDays } from 'date-fns';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Dimensions } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const initialLayout = { width: Dimensions.get('window').width };

export default function DoctorDashboard() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'appointments', title: 'Appointments' },
    { key: 'sessions', title: 'Sessions' },
    { key: 'profile', title: 'Profile' },
  ]);
  
  const [appointments, setAppointments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Session creation modal
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newSession, setNewSession] = useState({
    date: new Date(),
    startTime: '09:00',
    slotDuration: 30,
    totalSlots: 6,
    sessionType: 'in-person',
    hospital: '',
    meetingLink: '',
    fee: 2500,
  });
  
  // Hospital options
  const [hospitals, setHospitals] = useState([]);

  // Fetch appointments
  const fetchAppointments = async () => {
    if (!user || !user._id) return;
    
    setLoading(true);
    try {
      const { data } = await api.get(`/sessions/doctor/${user._id}/appointments`);
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch sessions
  const fetchSessions = async () => {
    if (!user || !user._id) return;
    
    setLoading(true);
    try {
      const { data } = await api.get(`/sessions/doctor/${user._id}`);
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      Alert.alert('Error', 'Failed to load sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Fetch hospitals
  const fetchHospitals = async () => {
    try {
      const { data } = await api.get('/hospitals');
      setHospitals(data.hospitals || []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchSessions();
      fetchHospitals();
    }
  }, [user]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    if (index === 0) {
      fetchAppointments();
    } else if (index === 1) {
      fetchSessions();
    }
  };
  
  // Handle date change
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setNewSession({ ...newSession, date: selectedDate });
    }
  };
  
  // Create new session
  const handleCreateSession = async () => {
    if (!user || !user._id) return;
    
    // Validate fields
    if (newSession.sessionType === 'in-person' && !newSession.hospital) {
      Alert.alert('Error', 'Please select a hospital for in-person session');
      return;
    }
    
    if (newSession.sessionType === 'video' && !newSession.meetingLink) {
      Alert.alert('Error', 'Please provide a meeting link for video session');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/sessions/create', {
        ...newSession,
        doctorId: user._id,
        date: format(newSession.date, 'yyyy-MM-dd'),
      });
      
      Alert.alert('Success', 'Session created successfully');
      setModalVisible(false);
      fetchSessions();
      
      // Reset form
      setNewSession({
        date: addDays(new Date(), 1),
        startTime: '09:00',
        slotDuration: 30,
        totalSlots: 6,
        sessionType: 'in-person',
        hospital: '',
        meetingLink: '',
        fee: 2500,
      });
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  // Tab scenes
  const AppointmentsScene = () => (
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
      {appointments.length > 0 ? (
        appointments.map((appointment) => (
          <View key={appointment._id} style={styles.appointmentCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.appointmentDate}>
                {format(parseISO(appointment.session.date), 'EEE, MMM dd, yyyy')}
              </Text>
              <Text style={styles.timeSlot}>
                {appointment.startTime} - {appointment.endTime}
              </Text>
            </View>
            
            <View style={styles.patientInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={18} color="#64748B" />
                <Text style={styles.infoText}>
                  {appointment.patient?.name || 'Patient'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons 
                  name={appointment.session.sessionType === 'in-person' ? 'location-outline' : 'videocam-outline'} 
                  size={18} 
                  color="#64748B" 
                />
                <Text style={styles.infoText}>
                  {appointment.session.sessionType === 'in-person' 
                    ? (appointment.session.hospital?.name || 'Hospital') 
                    : 'Video Consultation'
                  }
                </Text>
              </View>
              
              {appointment.session.sessionType === 'video' && (
                <View style={styles.infoRow}>
                  <Ionicons name="link-outline" size={18} color="#64748B" />
                  <Text style={styles.infoText}>
                    {appointment.session.meetingLink || 'No meeting link available'}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  // Handle view patient details
                  Alert.alert('Coming Soon', 'This feature will be available soon');
                }}
              >
                <Text style={styles.actionText}>View Patient</Text>
              </TouchableOpacity>
              
              {appointment.session.sessionType === 'video' && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.startButton]}
                  onPress={() => {
                    // Handle start video call
                    if (appointment.session.meetingLink) {
                      // Open the meeting link
                      // This would typically use Linking.openURL
                      Alert.alert('Open Meeting', 'Opening video call link');
                    } else {
                      Alert.alert('Error', 'No meeting link available');
                    }
                  }}
                >
                  <Text style={[styles.actionText, styles.startText]}>Start Call</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Appointments</Text>
          <Text style={styles.emptyText}>
            You don't have any upcoming appointments. Create a session to allow patients to book.
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const SessionsScene = () => (
    <View style={styles.sessionsContainer}>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
        <Text style={styles.createButtonText}>Create New Session</Text>
      </TouchableOpacity>
      
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
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <View key={session._id} style={styles.sessionCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.sessionDate}>
                  {format(parseISO(session.date), 'EEE, MMM dd, yyyy')}
                </Text>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>
                    {session.sessionType === 'in-person' ? 'In-person' : 'Video'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.sessionDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={18} color="#64748B" />
                  <Text style={styles.detailText}>
                    {session.startTime} ({session.slotDuration} mins per slot)
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <MaterialIcons name="attach-money" size={18} color="#64748B" />
                  <Text style={styles.detailText}>
                    ${session.fee || 0} consultation fee
                  </Text>
                </View>
                
                {session.sessionType === 'in-person' && session.hospital && (
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={18} color="#64748B" />
                    <Text style={styles.detailText}>
                      {session.hospital.name}
                    </Text>
                  </View>
                )}
                
                {session.sessionType === 'video' && session.meetingLink && (
                  <View style={styles.detailRow}>
                    <Ionicons name="link-outline" size={18} color="#64748B" />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {session.meetingLink}
                    </Text>
                  </View>
                )}
                
                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={18} color="#64748B" />
                  <Text style={styles.detailText}>
                    {session.totalSlots - session.availableSlots}/{session.totalSlots} slots booked
                  </Text>
                </View>
              </View>
              
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    // Navigate to session details
                    Alert.alert('Coming Soon', 'This feature will be available soon');
                  }}
                >
                  <Text style={styles.actionText}>View Details</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => {
                    // Handle session cancellation
                    Alert.alert(
                      'Cancel Session',
                      'Are you sure you want to cancel this session? This cannot be undone.',
                      [
                        { text: 'No', style: 'cancel' },
                        { 
                          text: 'Yes', 
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              await api.delete(`/sessions/${session._id}`);
                              Alert.alert('Success', 'Session cancelled successfully');
                              fetchSessions();
                            } catch (error) {
                              console.error('Error cancelling session:', error);
                              Alert.alert('Error', 'Failed to cancel session');
                            }
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Sessions</Text>
            <Text style={styles.emptyText}>
              You haven't created any sessions yet. Create a session to allow patients to book appointments.
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Create Session Modal */}
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
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Session Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {format(newSession.date, 'MMM dd, yyyy')}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#64748B" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={newSession.date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Start Time</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Start time (HH:MM)"
                  value={newSession.startTime}
                  onChangeText={(value) => setNewSession({ ...newSession, startTime: value })}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Session Type</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      newSession.sessionType === 'in-person' && styles.radioButtonActive
                    ]}
                    onPress={() => setNewSession({ ...newSession, sessionType: 'in-person' })}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        newSession.sessionType === 'in-person' && styles.radioTextActive
                      ]}
                    >
                      In-person
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.radioButton,
                      newSession.sessionType === 'video' && styles.radioButtonActive
                    ]}
                    onPress={() => setNewSession({ ...newSession, sessionType: 'video' })}
                  >
                    <Text
                      style={[
                        styles.radioText,
                        newSession.sessionType === 'video' && styles.radioTextActive
                      ]}
                    >
                      Video Call
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {newSession.sessionType === 'in-person' ? (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Hospital</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={newSession.hospital}
                      onValueChange={(itemValue) => 
                        setNewSession({ ...newSession, hospital: itemValue })
                      }
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Hospital" value="" />
                      {hospitals.map((hospital) => (
                        <Picker.Item 
                          key={hospital._id} 
                          label={hospital.name} 
                          value={hospital._id} 
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Meeting Link</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter video call link"
                    value={newSession.meetingLink}
                    onChangeText={(value) => setNewSession({ ...newSession, meetingLink: value })}
                  />
                </View>
              )}
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Duration per Slot (minutes)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Duration (minutes)"
                  value={newSession.slotDuration.toString()}
                  onChangeText={(value) => 
                    setNewSession({ ...newSession, slotDuration: parseInt(value) || 30 })
                  }
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Number of Slots</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Number of slots"
                  value={newSession.totalSlots.toString()}
                  onChangeText={(value) => 
                    setNewSession({ ...newSession, totalSlots: parseInt(value) || 1 })
                  }
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Consultation Fee ($)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Fee amount"
                  value={newSession.fee.toString()}
                  onChangeText={(value) => 
                    setNewSession({ ...newSession, fee: parseInt(value) || 0 })
                  }
                  keyboardType="number-pad"
                />
              </View>
              
              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={handleCreateSession}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? 'Creating...' : 'Create Session'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  const ProfileScene = () => (
    <ScrollView style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0) || 'D'}
          </Text>
        </View>
        <Text style={styles.doctorName}>{user?.name || 'Doctor'}</Text>
        <Text style={styles.doctorSpecialty}>{user?.specialization || 'Specialist'}</Text>
      </View>
      
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email || '-'}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{user?.phone || '-'}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Gender</Text>
          <Text style={styles.infoValue}>{user?.gender || '-'}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Registration No.</Text>
          <Text style={styles.infoValue}>{user?.regNo || '-'}</Text>
        </View>
      </View>
      
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Practice Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Specialization</Text>
          <Text style={styles.infoValue}>{user?.specialization || '-'}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Consultation Fee</Text>
          <Text style={styles.infoValue}>${user?.consultationFee || '0'}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.editProfileButton}
        onPress={() => {
          // Navigate to edit profile
          Alert.alert('Coming Soon', 'Edit profile functionality will be available soon');
        }}
      >
        <Text style={styles.editProfileText}>Edit Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderScene = SceneMap({
    appointments: AppointmentsScene,
    sessions: SessionsScene,
    profile: ProfileScene,
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
          title: 'Doctor Dashboard',
        }}
      />
      
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
  tabView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    paddingBottom: 40,
  },
  
  // Appointment card styles
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
  timeSlot: {
    fontSize: 14,
    color: '#64748B',
  },
  patientInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
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
  startButton: {
    backgroundColor: '#ECFDF5',
  },
  actionText: {
    fontWeight: '500',
    color: '#1E293B',
  },
  startText: {
    color: '#10B981',
  },
  
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
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
  },
  
  // Sessions tab styles
  sessionsContainer: {
    flex: 1,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    margin: 16,
    marginBottom: 0,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  typeBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  typeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  sessionDetails: {
    marginVertical: 12,
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
  cancelButton: {
    backgroundColor: '#FEE2E2',
  },
  cancelText: {
    color: '#EF4444',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  modalForm: {
    padding: 16,
    maxHeight: '80%',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateButton: {
    backgroundColor: '#F8FAFC',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#334155',
  },
  radioGroup: {
    flexDirection: 'row',
  },
  radioButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: '#EBF5FF',
    borderColor: '#2563EB',
  },
  radioText: {
    fontSize: 16,
    color: '#64748B',
  },
  radioTextActive: {
    color: '#2563EB',
    fontWeight: '500',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  
  // Profile tab styles
  profileContainer: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#64748B',
  },
  profileSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  editProfileButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  editProfileText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 40,
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 16,
  },
});
