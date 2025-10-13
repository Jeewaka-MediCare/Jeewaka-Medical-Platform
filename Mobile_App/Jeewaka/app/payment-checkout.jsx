import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider, useStripe, CardField } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { format, parseISO } from 'date-fns';
import paymentService from '../services/paymentService';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Payment Form Component
function PaymentForm({ paymentData, onSuccess, onError }) {
  const { confirmPayment } = useStripe();
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  const [cardFocused, setCardFocused] = useState(false);

  const handlePayment = async () => {
    if (!cardDetails?.complete) {
      Alert.alert('Incomplete Card', 'Please enter complete card details');
      return;
    }

    setLoading(true);

    try {
      const { error, paymentIntent } = await confirmPayment(paymentData.clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {
            name: paymentData.patientName || 'Patient',
          },
        },
      });

      if (error) {
        console.error('Payment failed:', error);
        onError(error);
      } else if (paymentIntent) {
        console.log('Payment succeeded:', paymentIntent);
        onSuccess(paymentIntent);
      }
    } catch (err) {
      console.error('Payment error:', err);
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.paymentForm}>
      <Text style={styles.sectionTitle}>Payment Details</Text>
      
      <Text style={styles.cardInstructions}>
        Enter your card details below to complete the payment
      </Text>
      
      <View style={styles.cardFieldContainer}>
        <View style={styles.cardFieldHeader}>
          <Text style={styles.cardFieldLabel}>Card Information</Text>
          {cardDetails?.complete && (
            <View style={styles.validationIndicator}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.validationText}>Valid</Text>
            </View>
          )}
        </View>
        <CardField
          postalCodeEnabled={false}
          placeholders={{
            number: '4242 4242 4242 4242',
            expiry: 'MM/YY',
            cvc: 'CVC',
          }}
          cardStyle={styles.cardFieldStyle}
          style={[
            styles.cardField,
            cardFocused && styles.cardFieldFocused,
            cardDetails?.complete && styles.cardFieldComplete
          ]}
          onCardChange={(details) => {
            console.log('Card details changed:', details);
            setCardDetails(details);
          }}
          onFocus={() => setCardFocused(true)}
          onBlur={() => setCardFocused(false)}
        />
      </View>

      <TouchableOpacity
        style={[styles.payButton, (!cardDetails?.complete || loading) && styles.disabledButton]}
        onPress={handlePayment}
        disabled={!cardDetails?.complete || loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="card-outline" size={20} color="white" style={styles.payButtonIcon} />
            <Text style={styles.payButtonText}>
              Pay LKR {paymentData.amount}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// Main Payment Checkout Component
export default function PaymentCheckout() {
  const router = useRouter();
  const { 
    sessionId, 
    slotIndex, 
    doctorName, 
    sessionData, 
    amount, 
    patientId 
  } = useLocalSearchParams();

  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const session = sessionData ? JSON.parse(sessionData) : null;

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const paymentRequest = {
        amount: parseFloat(amount),
        currency: 'lkr',
        metadata: {
          sessionId,
          slotIndex,
          patientId,
          doctorName,
          appointmentDate: session ? `${format(parseISO(session.date), 'PPP')} at ${session.timeSlots[slotIndex]?.startTime}` : 'TBD'
        }
      };

      console.log('PaymentCheckout - Creating payment intent:', paymentRequest);
      const { clientSecret, paymentIntentId } = await paymentService.createPaymentIntent(paymentRequest);

      setPaymentData({
        clientSecret,
        paymentIntentId,
        amount: parseFloat(amount),
        sessionId,
        slotIndex,
        patientId,
        doctorName,
        session,
        patientName: 'Patient' // You might want to get this from auth store
      });

    } catch (err) {
      console.error('PaymentCheckout - Error initializing payment:', err);
      setError(err.response?.data?.error || err.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      console.log('PaymentCheckout - Payment successful, confirming booking...');
      
      // Navigate to success screen with payment details
      router.replace({
        pathname: '/payment-success',
        params: {
          sessionId,
          paymentIntentId: paymentIntent.id,
          slotIndex,
          patientId,
          doctorName,
          amount
        }
      });
    } catch (err) {
      console.error('PaymentCheckout - Error handling payment success:', err);
      Alert.alert('Payment Successful', 'Payment completed but there was an issue confirming your booking. Please contact support.');
    }
  };

  const handlePaymentError = (error) => {
    console.error('PaymentCheckout - Payment error:', error);
    Alert.alert(
      'Payment Failed',
      error.message || 'Payment could not be processed. Please try again.',
      [
        { text: 'Try Again', onPress: initializePayment },
        { text: 'Cancel', onPress: () => router.back() }
      ]
    );
  };

  const handleBack = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel the payment?',
      [
        { text: 'Continue Payment', style: 'cancel' },
        { text: 'Cancel', onPress: () => router.back() }
      ]
    );
  };

  if (!STRIPE_PUBLISHABLE_KEY) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Stripe not configured</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen
          options={{
            title: 'Payment',
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
            headerLeft: () => (
              <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
            ),
          }}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#008080" />
            <Text style={styles.loadingText}>Preparing payment...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Payment Error</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={initializePayment}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <KeyboardAvoidingView 
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          >
            <ScrollView 
              style={styles.content}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Appointment Summary */}
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Appointment Summary</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Doctor</Text>
                  <Text style={styles.summaryValue}>{doctorName}</Text>
                </View>
                
                {session && (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Date</Text>
                      <Text style={styles.summaryValue}>
                        {format(parseISO(session.date), 'PPP')}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Time</Text>
                      <Text style={styles.summaryValue}>
                        {session.timeSlots[slotIndex] ? 
                          `${session.timeSlots[slotIndex].startTime} - ${session.timeSlots[slotIndex].endTime}` : 
                          'Time slot not found'}
                      </Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Type</Text>
                      <Text style={styles.summaryValue}>
                        {session.type === 'in-person' ? 'In-Person' : 'Video'}
                      </Text>
                    </View>
                  </>
                )}
                
                <View style={styles.divider} />
                
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Amount</Text>
                  <Text style={styles.totalValue}>LKR {amount}</Text>
                </View>
              </View>

              {/* Payment Form */}
              {paymentData && (
                <PaymentForm
                  paymentData={paymentData}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              )}
              
              {/* Extra padding at bottom to ensure content is visible above keyboard */}
              <View style={styles.bottomPadding} />
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerButton: {
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#008080',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  bottomPadding: {
    height: 100,
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#008080',
  },
  paymentForm: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  cardInstructions: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  cardFieldContainer: {
    marginBottom: 20,
  },
  cardFieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  validationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  validationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  cardField: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  cardFieldFocused: {
    borderColor: '#008080',
    shadowColor: '#008080',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cardFieldComplete: {
    borderColor: '#10B981',
  },
  cardFieldStyle: {
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    fontSize: 16,
    placeholderColor: '#9CA3AF',
    cursorColor: '#008080',
  },
  payButton: {
    backgroundColor: '#008080',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  payButtonIcon: {
    marginRight: 8,
  },
  payButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});