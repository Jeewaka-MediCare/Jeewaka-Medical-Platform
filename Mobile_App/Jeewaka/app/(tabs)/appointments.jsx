import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthStore from '../../store/authStore';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { Dimensions } from 'react-native';
import DoctorSessionContent from '../../components/DoctorSessionContent';
import PaymentDetailsModal from '../../components/PaymentDetailsModal';
import AppointmentFilters from '../../components/AppointmentFilters';
import AuthPrompt from '../../components/AuthPrompt';
import LoadingState from '../../components/LoadingState';
import AppointmentsList from '../../components/AppointmentsList';
import { useAppointments } from '../../hooks/useAppointments';

const initialLayout = { width: Dimensions.get('window').width };

export default function Appointments() {
  const { user, userRole, loading } = useAuthStore();
  const router = useRouter();
  
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'upcoming', title: 'Upcoming' },
    { key: 'past', title: 'Past' },
  ]);

  // Use the custom hook for appointments logic
  const {
    filteredUpcomingAppointments,
    filteredPastAppointments,
    appointmentsLoading,
    refreshing,
    selectedPayment,
    showPaymentDetails,
    loadingPaymentId,
    currentFilters,
    availableHospitals,
    handleFiltersChange,
    onRefresh,
    isAppointmentOngoing,
    handleViewPayment,
    setShowPaymentDetails,
    setSelectedPayment
  } = useAppointments(user, userRole);

  // Handle section change from filters (when date filter changes section)
  const handleSectionChange = (section) => {
    const newIndex = section === 'upcoming' ? 0 : 1;
    setIndex(newIndex);
  };

  // Handle cancel appointment - temporarily disabled
  const handleCancelAppointment = async (appointmentId) => {
    Alert.alert('Coming Soon', 'Appointment cancellation feature will be available soon');
  };

  // Handle view doctor profile
  const handleViewDoctor = (doctorId) => {
    router.push(`/doctor/${doctorId}`);
  };

  // Handle write review
  const handleWriteReview = (appointment) => {
    router.push({
      pathname: '/write-review',
      params: {
        doctorId: appointment.doctor?._id || appointment.doctor,
        doctorName: appointment.doctor?.name || 'Doctor',
        appointmentId: appointment._id
      }
    });
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
        
        <AuthPrompt
          title="Login Required"
          message="You need to log in to view your appointments"
          icon="calendar-outline"
          onLogin={() => router.push('/login')}
          onRegister={() => router.push('/register')}
        />
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
        
        <LoadingState text="Loading..." />
      </SafeAreaView>
    );
  }

  // Show loading state while fetching appointments
  if (appointmentsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'My Appointments',
            headerShown: true,
          }}
        />
        
        <LoadingState text="Loading appointments..." />
      </SafeAreaView>
    );
  }

  // Tab scenes
  const UpcomingAppointmentsScene = () => (
    <AppointmentsList
      appointments={filteredUpcomingAppointments}
      type="upcoming"
      refreshing={refreshing}
      onRefresh={onRefresh}
      onViewDoctor={handleViewDoctor}
      onViewPayment={handleViewPayment}
      onWriteReview={handleWriteReview}
      loadingPaymentId={loadingPaymentId}
      currentFilters={currentFilters}
      onFindDoctors={() => router.push('/')}
      isAppointmentOngoing={isAppointmentOngoing}
    />
  );

  const PastAppointmentsScene = () => (
    <AppointmentsList
      appointments={filteredPastAppointments}
      type="past"
      refreshing={refreshing}
      onRefresh={onRefresh}
      onViewDoctor={handleViewDoctor}
      onViewPayment={handleViewPayment}
      onWriteReview={handleWriteReview}
      loadingPaymentId={loadingPaymentId}
      currentFilters={currentFilters}
      onFindDoctors={() => router.push('/')}
      isAppointmentOngoing={isAppointmentOngoing}
    />
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
  tabView: {
    flex: 1,
  },
});
