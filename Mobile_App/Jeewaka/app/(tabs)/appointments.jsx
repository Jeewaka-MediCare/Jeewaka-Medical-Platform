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
import { format, parseISO, isSameDay, isWithinInterval } from 'date-fns';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Dimensions } from 'react-native';
import VideoCallButton from '../../components/VideoCallButton';
import DoctorSessionContent from '../../components/DoctorSessionContent';
import PaymentDetailsModal from '../../components/PaymentDetailsModal';
import paymentService from '../../services/paymentService';
import AppointmentFilters from '../../components/AppointmentFilters';

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
  const [filteredUpcomingAppointments, setFilteredUpcomingAppointments] = useState([]);
  const [filteredPastAppointments, setFilteredPastAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [loadingPaymentId, setLoadingPaymentId] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});
  const [availableHospitals, setAvailableHospitals] = useState([]);

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
              type: session.type,
              // Payment information from slot
              paymentIntentId: slot.paymentIntentId,
              paymentAmount: slot.paymentAmount,
              paymentCurrency: slot.paymentCurrency,
              paymentDate: slot.paymentDate,
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
      
      // Sort upcoming appointments: soonest first (ascending by start time)
      const sortedUpcoming = upcoming.sort((a, b) => {
        try {
          const dateOnlyA = a.date.split('T')[0];
          const dateOnlyB = b.date.split('T')[0];
          const startDateA = parseISO(`${dateOnlyA}T${a.startTime}`);
          const startDateB = parseISO(`${dateOnlyB}T${b.startTime}`);
          return startDateA.getTime() - startDateB.getTime();
        } catch (error) {
          console.error('Error sorting upcoming appointments:', error);
          return 0;
        }
      });
      
      // Sort past appointments: most recent first (descending by end time)
      const sortedPast = past.sort((a, b) => {
        try {
          const dateOnlyA = a.date.split('T')[0];
          const dateOnlyB = b.date.split('T')[0];
          const endDateA = parseISO(`${dateOnlyA}T${a.endTime}`);
          const endDateB = parseISO(`${dateOnlyB}T${b.endTime}`);
          return endDateB.getTime() - endDateA.getTime();
        } catch (error) {
          console.error('Error sorting past appointments:', error);
          return 0;
        }
      });
      
      setUpcomingAppointments(sortedUpcoming);
      setPastAppointments(sortedPast);
      
      // Extract unique hospitals for filter dropdown - only from in-person appointments
      const hospitals = [...new Set(appointments
        .filter(apt => {
          // Check if appointment is in-person using multiple criteria
          const isInPerson = apt.type === 'in-person' || 
                            (apt.hospital && apt.hospital.name);
          return isInPerson && apt.hospital?.name;
        })
        .map(apt => apt.hospital.name)
      )];
      setAvailableHospitals(hospitals);
      
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setAppointmentsLoading(false);
      setRefreshing(false);
    }
  };

  // Filter appointments based on current filters
  const filterAppointments = (appointments, filters) => {
    return appointments.filter(appointment => {
      // Doctor name filter
      if (filters.doctorName && filters.doctorName.trim()) {
        const doctorName = appointment.doctor?.name?.toLowerCase() || '';
        if (!doctorName.includes(filters.doctorName.toLowerCase())) {
          return false;
        }
      }

      // Hospital name filter (only for in-person appointments)
      if (filters.hospitalName && filters.hospitalName.trim()) {
        const hospitalName = appointment.hospital?.name?.toLowerCase() || '';
        if (!hospitalName.includes(filters.hospitalName.toLowerCase())) {
          return false;
        }
      }

      // Appointment type filter
      if (filters.appointmentType) {
        // Check both the type field and hospital presence for better accuracy
        const isInPerson = appointment.type === 'in-person' || 
                          (appointment.hospital && appointment.hospital.name);
        const isVideo = appointment.type === 'video' || 
                       appointment.type === 'online' || 
                       (!appointment.hospital || !appointment.hospital.name);
        
        if (filters.appointmentType === 'in-person' && !isInPerson) {
          return false;
        }
        if (filters.appointmentType === 'video' && !isVideo) {
          return false;
        }
      }

      // Date filter
      if (filters.selectedDate) {
        try {
          const appointmentDate = parseISO(appointment.date.split('T')[0]);
          const filterDate = new Date(filters.selectedDate);
          
          // Normalize both dates to compare only the date part
          appointmentDate.setHours(0, 0, 0, 0);
          filterDate.setHours(0, 0, 0, 0);
          
          if (appointmentDate.getTime() !== filterDate.getTime()) {
            return false;
          }
        } catch (error) {
          console.error('Error filtering by date:', error);
          return false;
        }
      }

      // Date range filter
      if (filters.startDate && filters.endDate) {
        try {
          const appointmentDate = parseISO(appointment.date.split('T')[0]);
          
          // Normalize dates to start of day for accurate comparison
          const startDate = new Date(filters.startDate);
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999); // End of day to include the end date
          
          const normalizedAppointmentDate = new Date(appointmentDate);
          normalizedAppointmentDate.setHours(12, 0, 0, 0); // Noon to avoid timezone issues
          
          if (normalizedAppointmentDate < startDate || normalizedAppointmentDate > endDate) {
            return false;
          }
        } catch (error) {
          console.error('Error filtering by date range:', error);
          return false;
        }
      }

      return true;
    });
  };

  // Handle filter changes
  const handleFiltersChange = (filters) => {
    setCurrentFilters(filters);
    setFilteredUpcomingAppointments(filterAppointments(upcomingAppointments, filters));
    setFilteredPastAppointments(filterAppointments(pastAppointments, filters));
  };

  // Handle section change from filters (when date filter changes section)
  const handleSectionChange = (section) => {
    const newIndex = section === 'upcoming' ? 0 : 1;
    setIndex(newIndex);
  };

  // Update filtered appointments when original appointments change
  useEffect(() => {
    setFilteredUpcomingAppointments(filterAppointments(upcomingAppointments, currentFilters));
    setFilteredPastAppointments(filterAppointments(pastAppointments, currentFilters));
  }, [upcomingAppointments, pastAppointments, currentFilters]);

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

  // Helper function to check if appointment is today
  const isAppointmentToday = (appointment) => {
    try {
      const today = new Date();
      const appointmentDate = parseISO(appointment.date);
      return isSameDay(today, appointmentDate);
    } catch (error) {
      console.error('Error checking if appointment is today:', error);
      return false;
    }
  };

  // Handle view doctor profile
  const handleViewDoctor = (doctorId) => {
    router.push(`/doctor/${doctorId}`);
  };

  // Handle view payment details
  const handleViewPayment = async (appointment) => {
    try {
      setLoadingPaymentId(appointment._id);
      console.log('Loading payment details for appointment:', appointment);
      
      // Check if appointment has payment information
      if (!appointment.paymentIntentId) {
        Alert.alert(
          'No Payment Information',
          'No payment information found for this appointment. The payment may still be processing or this appointment may not require payment.'
        );
        return;
      }

      // Fetch specific payment details using the payment intent ID
      const response = await paymentService.getPaymentDetails(appointment.paymentIntentId);
      
      if (response.success && response.payment) {
        console.log('Payment details loaded:', response.payment);
        setSelectedPayment(response.payment);
        setShowPaymentDetails(true);
      } else {
        // If getPaymentDetails doesn't work, create payment object from appointment data
        const paymentFromAppointment = {
          id: appointment.paymentIntentId,
          amount: (appointment.paymentAmount || 0) * 100, // Convert to cents
          currency: appointment.paymentCurrency || 'lkr',
          status: 'succeeded', // If it's in the appointment, payment was successful
          date: appointment.paymentDate,
          created: appointment.paymentDate,
          doctorName: appointment.doctor?.name || 'Unknown Doctor',
          doctorSpecialization: appointment.doctor?.specialization || 'General',
          appointmentDate: appointment.date,
          appointmentTime: `${appointment.startTime} - ${appointment.endTime}`,
          appointmentStatus: appointment.appointmentStatus || 'confirmed',
          doctor: {
            name: appointment.doctor?.name || 'Unknown Doctor',
            specialization: appointment.doctor?.specialization || 'General'
          },
          appointment: {
            date: appointment.date,
            time: `${appointment.startTime} - ${appointment.endTime}`,
            status: appointment.appointmentStatus || 'confirmed'
          },
          sessionId: appointment.sessionId,
          slotIndex: appointment.slotIndex
        };
        
        console.log('Using payment data from appointment:', paymentFromAppointment);
        setSelectedPayment(paymentFromAppointment);
        setShowPaymentDetails(true);
      }
    } catch (error) {
      console.error('Error loading payment details:', error);
      
      // If API call fails but we have payment data in appointment, use that
      if (appointment.paymentIntentId) {
        const paymentFromAppointment = {
          id: appointment.paymentIntentId,
          amount: (appointment.paymentAmount || 0) * 100, // Convert to cents
          currency: appointment.paymentCurrency || 'lkr',
          status: 'succeeded', // If it's in the appointment, payment was successful
          date: appointment.paymentDate,
          created: appointment.paymentDate,
          doctorName: appointment.doctor?.name || 'Unknown Doctor',
          doctorSpecialization: appointment.doctor?.specialization || 'General',
          appointmentDate: appointment.date,
          appointmentTime: `${appointment.startTime} - ${appointment.endTime}`,
          appointmentStatus: appointment.appointmentStatus || 'confirmed',
          doctor: {
            name: appointment.doctor?.name || 'Unknown Doctor',
            specialization: appointment.doctor?.specialization || 'General'
          },
          appointment: {
            date: appointment.date,
            time: `${appointment.startTime} - ${appointment.endTime}`,
            status: appointment.appointmentStatus || 'confirmed'
          },
          sessionId: appointment.sessionId,
          slotIndex: appointment.slotIndex
        };
        
        console.log('Using fallback payment data from appointment:', paymentFromAppointment);
        setSelectedPayment(paymentFromAppointment);
        setShowPaymentDetails(true);
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to load payment information. Please try again.'
        );
      }
    } finally {
      setLoadingPaymentId(null);
    }
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
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <Stack.Screen
          options={{
            title: 'My Sessions',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#1E293B',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0,
            },
            headerTitleStyle: {
              color: 'white',
              fontSize: 20,
              fontWeight: '600',
            },
            headerTintColor: 'white',
          }}
        />
        <DoctorSessionContent />
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
          colors={['#008080']}
        />
      }
    >
      {filteredUpcomingAppointments.length > 0 ? (
        filteredUpcomingAppointments.map((appointment) => {
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
                  onPress={() => handleViewDoctor(appointment.doctor?._id || appointment.doctor)}
                >
                  <Text style={styles.actionButtonText}>View Doctor</Text>
                </TouchableOpacity>
                
                {(appointment.type === 'online' || appointment.type === 'video') && (
                  <VideoCallButton
                    style={[styles.actionButton, styles.videoCallButton]}
                    title="Video Call"
                    sessionId={appointment.sessionId}
                    slotIndex={appointment.slotIndex}
                  />
                )}
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.paymentButton]}
                  onPress={() => handleViewPayment(appointment)}
                  disabled={loadingPaymentId === appointment._id}
                >
                  <Ionicons name="card-outline" size={16} color="#008080" />
                  <Text style={[styles.actionButtonText, styles.paymentButtonText]}>
                    {loadingPaymentId === appointment._id ? 'Loading...' : 'View Payment'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyTitle}>
            {Object.keys(currentFilters).some(key => 
              currentFilters[key] && currentFilters[key] !== ''
            ) ? 'No Matching Appointments' : 'No Upcoming Appointments'}
          </Text>
          <Text style={styles.emptyText}>
            {Object.keys(currentFilters).some(key => 
              currentFilters[key] && currentFilters[key] !== ''
            ) 
              ? 'No appointments match your current filters. Try adjusting your search criteria.'
              : 'You don\'t have any upcoming appointments. Book a consultation with a doctor.'
            }
          </Text>
          {!Object.keys(currentFilters).some(key => 
            currentFilters[key] && currentFilters[key] !== ''
          ) && (
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.emptyActionText}>Find Doctors</Text>
            </TouchableOpacity>
          )}
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
          colors={['#008080']}
        />
      }
    >
      {filteredPastAppointments.length > 0 ? (
        filteredPastAppointments.map((appointment) => (
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
                onPress={() => handleViewDoctor(appointment.doctor?._id || appointment.doctor)}
              >
                <Text style={styles.actionButtonText}>View Doctor</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.reviewButton]}
                onPress={() => router.push({
                  pathname: '/write-review',
                  params: {
                    doctorId: appointment.doctor?._id || appointment.doctor,
                    doctorName: appointment.doctor?.name || 'Doctor',
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
          <Text style={styles.emptyTitle}>
            {Object.keys(currentFilters).some(key => 
              currentFilters[key] && currentFilters[key] !== ''
            ) ? 'No Matching Appointments' : 'No Past Appointments'}
          </Text>
          <Text style={styles.emptyText}>
            {Object.keys(currentFilters).some(key => 
              currentFilters[key] && currentFilters[key] !== ''
            ) 
              ? 'No past appointments match your current filters. Try adjusting your search criteria.'
              : 'You don\'t have any past appointments. Once you complete a consultation, it will appear here.'
            }
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
      indicatorStyle={{ backgroundColor: '#008080' }}
      style={{ backgroundColor: 'white', elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}
      labelStyle={{ color: '#1E293B', fontWeight: '500', textTransform: 'none' }}
      activeColor="#008080"
      inactiveColor="#64748B"
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'My Appointments',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1E293B', // Dark header like in the image
          },
          headerTitleStyle: {
            color: 'white',
            fontSize: 20,
            fontWeight: '600',
          },
          headerTintColor: 'white',
        }}
      />
      
      {/* Appointment Filters */}
      <AppointmentFilters
        onFiltersChange={handleFiltersChange}
        onSectionChange={handleSectionChange}
        currentSection={index === 0 ? 'upcoming' : 'past'}
        hospitals={availableHospitals}
      />
      
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={initialLayout}
        renderTabBar={renderTabBar}
        style={styles.tabView}
      />

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        visible={showPaymentDetails}
        onClose={() => {
          setShowPaymentDetails(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
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
    backgroundColor: '#008080',
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
    borderColor: '#008080',
  },
  registerButtonText: {
    color: '#008080',
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
  todayAppointmentCard: {
    backgroundColor: '#E6FFFA', // Very light teal
    borderColor: '#008080',
    borderWidth: 1,
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
    backgroundColor: '#008080',
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
