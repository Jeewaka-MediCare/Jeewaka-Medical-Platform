import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import paymentService from '../services/paymentService';
import useAuthStore from '../store/authStore';

export default function PaymentSuccess() {
  const router = useRouter();
  const { user, userRole } = useAuthStore();
  const { 
    sessionId, 
    paymentIntentId, 
    slotIndex, 
    patientId, 
    doctorName, 
    amount 
  } = useLocalSearchParams();

  const [status, setStatus] = useState('processing'); // processing, success, error
  const [error, setError] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    handlePaymentSuccess();
  }, []);

  const handlePaymentSuccess = async () => {
    try {
      console.log('PaymentSuccess - Starting booking confirmation...');
      console.log('PaymentSuccess - Parameters:', {
        sessionId,
        paymentIntentId,
        slotIndex,
        patientId,
        user: user?._id,
        userRole
      });
      
      // Confirm the booking with payment details
      const result = await paymentService.handlePaymentSuccess(
        sessionId,
        paymentIntentId,
        slotIndex,
        patientId
      );

      console.log('PaymentSuccess - Booking confirmed:', result);
      setBookingDetails(result);
      setStatus('success');
    } catch (error) {
      console.error('PaymentSuccess - Booking confirmation error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to confirm booking');
      setStatus('error');
    }
  };

  const handleViewAppointments = () => {
    router.replace('/(tabs)/appointments');
  };

  const handleReturnHome = () => {
    // Role-aware return: send logged-in users to their dashboards
    if (user && userRole) {
      if (userRole === 'patient') {
        router.replace('/patient-dashboard');
        return;
      }
      if (userRole === 'doctor') {
        router.replace('/doctor-dashboard');
        return;
      }
    }
    // Fallback: go to root (login) if no authenticated user found
    router.replace('/');
  };

  const handleTryAgain = () => {
    setStatus('processing');
    setError(null);
    handlePaymentSuccess();
  };

  if (status === 'processing') {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Processing Payment',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#1E293B',
            },
            headerTitleStyle: {
              color: 'white',
              fontSize: 20,
              fontWeight: '600',
            },
            headerTintColor: 'white',
            headerLeft: () => null, // Disable back button during processing
          }}
        />
        
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#008080" />
          <Text style={styles.processingTitle}>Confirming Your Booking</Text>
          <Text style={styles.processingText}>
            Please wait while we process your payment and confirm your appointment...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Payment Error',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#1E293B',
            },
            headerTitleStyle: {
              color: 'white',
              fontSize: 20,
              fontWeight: '600',
            },
            headerTintColor: 'white',
          }}
        />
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Booking Error</Text>
          <Text style={styles.errorText}>
            There was an issue confirming your booking:
          </Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <View style={styles.errorActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.retryButton]} 
              onPress={handleTryAgain}
            >
              <Text style={styles.actionButtonText}>Try Again</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.homeButton]} 
              onPress={handleReturnHome}
            >
              <Text style={styles.homeButtonText}>Return Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Payment Successful',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#1E293B',
          },
          headerTitleStyle: {
            color: 'white',
            fontSize: 20,
            fontWeight: '600',
          },
          headerTintColor: 'white',
          headerLeft: () => null, // Disable back button on success
        }}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
          </View>
          
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your appointment has been successfully booked and payment processed.
          </Text>

          {/* Booking Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Appointment Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Doctor:</Text>
              <Text style={styles.detailValue}>{doctorName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Amount:</Text>
              <Text style={styles.detailValue}>LKR {amount}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment ID:</Text>
              <Text style={styles.detailValue}>{paymentIntentId}</Text>
            </View>
            
            {bookingDetails?.session && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Session ID:</Text>
                <Text style={styles.detailValue}>{bookingDetails.session._id || sessionId}</Text>
              </View>
            )}
            
            {bookingDetails?.slot && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Time Slot:</Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.slot.startTime} - {bookingDetails.slot.endTime}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleViewAppointments}
            >
              <Ionicons name="calendar-outline" size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>View My Appointments</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40, // Extra bottom padding to ensure buttons are accessible
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  processingText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  errorActions: {
    width: '100%',
    gap: 12,
  },
  successContainer: {
    padding: 20,
    paddingBottom: 40, // Extra bottom padding
    minHeight: '100%', // Ensure it takes full height for proper centering
    justifyContent: 'center',
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  detailsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    flex: 2,
    textAlign: 'right',
  },
  actionContainer: {
    gap: 12,
    marginTop: 8,
    marginBottom: 20, // Extra bottom margin for the buttons
  },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#008080',
  },
  homeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#008080',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButtonText: {
    color: '#008080',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#008080',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#008080',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#008080',
    fontSize: 16,
    fontWeight: '600',
  },
});