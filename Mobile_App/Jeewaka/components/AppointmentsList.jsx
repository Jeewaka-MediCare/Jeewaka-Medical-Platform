import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import AppointmentCard from './AppointmentCard';
import EmptyState from './EmptyState';

export default function AppointmentsList({
  appointments,
  type = 'upcoming', // 'upcoming' or 'past'
  refreshing,
  onRefresh,
  onViewDoctor,
  onViewPayment,
  onWriteReview,
  loadingPaymentId,
  currentFilters,
  onFindDoctors,
  isAppointmentOngoing
}) {
  const hasFilters = Object.keys(currentFilters).some(key => 
    currentFilters[key] && currentFilters[key] !== ''
  );

  const getEmptyStateProps = () => {
    if (type === 'upcoming') {
      return {
        icon: 'calendar-outline',
        title: hasFilters ? 'No Matching Appointments' : 'No Upcoming Appointments',
        message: hasFilters 
          ? 'No appointments match your current filters. Try adjusting your search criteria.'
          : 'You don\'t have any upcoming appointments. Book a consultation with a doctor.',
        actionText: hasFilters ? undefined : 'Find Doctors',
        onAction: hasFilters ? undefined : onFindDoctors,
        showAction: !hasFilters
      };
    } else {
      return {
        icon: 'document-text-outline',
        title: hasFilters ? 'No Matching Appointments' : 'No Past Appointments',
        message: hasFilters 
          ? 'No past appointments match your current filters. Try adjusting your search criteria.'
          : 'You don\'t have any past appointments. Once you complete a consultation, it will appear here.',
        showAction: false
      };
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#008080']}
        />
      }
    >
      {appointments.length > 0 ? (
        appointments.map((appointment) => (
          <AppointmentCard
            key={appointment._id}
            appointment={appointment}
            type={type}
            onViewDoctor={onViewDoctor}
            onViewPayment={onViewPayment}
            onWriteReview={onWriteReview}
            loadingPaymentId={loadingPaymentId}
            isOngoing={type === 'upcoming' && isAppointmentOngoing(appointment)}
          />
        ))
      ) : (
        <EmptyState {...getEmptyStateProps()} />
      )}
    </ScrollView>
  );
}