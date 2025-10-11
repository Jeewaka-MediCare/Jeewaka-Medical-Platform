import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import reviewService from '../services/reviewService';
import useAuthStore from '../store/authStore';

export default function WriteReview() {
  const { doctorId, doctorName, appointmentId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing review when component mounts
  useEffect(() => {
    const checkExistingReview = async () => {
      if (!user?._id || !doctorId) return;
      
      try {
        let userReview = null;
        
        if (appointmentId) {
          // Check for appointment-specific review
          userReview = await reviewService.getAppointmentReview(appointmentId, user._id);
        } else {
          // Fallback to doctor-specific review for backward compatibility
          const reviews = await reviewService.getDoctorReviews(doctorId);
          userReview = reviews.find(review => 
            review.patient && (review.patient === user._id || review.patient._id === user._id)
          );
        }
        
        if (userReview) {
          setExistingReview(userReview);
          setRating(userReview.rating);
          setComment(userReview.comment || '');
        }
      } catch (error) {
        console.error('Error checking existing review:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingReview();
  }, [doctorId, appointmentId, user?._id]);

  const handleRatingPress = (starRating) => {
    setRating(starRating);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting your review.');
      return;
    }

    if (!comment.trim()) {
      Alert.alert('Review Required', 'Please write a review comment.');
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        doctorId,
        patientId: user._id,
        rating,
        comment: comment.trim(),
      };

      // Include appointmentId if available for appointment-specific reviews
      if (appointmentId) {
        reviewData.appointmentId = appointmentId;
      }

      await reviewService.submitReview(reviewData);

      Alert.alert(
        existingReview ? 'Review Updated' : 'Review Submitted',
        existingReview 
          ? 'Your review has been updated successfully.'
          : 'Thank you for your feedback! Your review has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit review. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: existingReview ? 'Update Review' : 'Write Review',
          headerStyle: {
            backgroundColor: '#2563EB',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Doctor Info Header */}
            <View style={styles.doctorInfoCard}>
              <Ionicons name="medical" size={32} color="#2563EB" />
              <View style={styles.doctorInfo}>
                <Text style={styles.doctorName}>{doctorName || 'Doctor'}</Text>
                <Text style={styles.appointmentInfo}>
                  {existingReview ? 'Update your review' : 'Rate your recent appointment'}
                  {isLoading && ' (Loading...)'}
                </Text>
              </View>
            </View>

            {/* Rating Section */}
            <View style={styles.ratingSection}>
              <Text style={styles.sectionTitle}>How would you rate this doctor?</Text>
              <Text style={styles.sectionSubtitle}>Tap the stars to rate</Text>
              
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRatingPress(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= rating ? '#FFD700' : '#CBD5E1'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {rating > 0 && (
                <Text style={styles.ratingText}>
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </Text>
              )}
            </View>

            {/* Comment Section */}
            <View style={styles.commentSection}>
              <Text style={styles.sectionTitle}>Write your review</Text>
              <Text style={styles.sectionSubtitle}>
                Share your experience to help other patients
              </Text>
              
              <TextInput
                style={styles.commentInput}
                multiline={true}
                numberOfLines={6}
                placeholder="Describe your experience with this doctor..."
                placeholderTextColor="#9CA3AF"
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
                maxLength={500}
              />
              
              <Text style={styles.characterCount}>
                {comment.length}/500 characters
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (rating === 0 || !comment.trim() || isSubmitting || isLoading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitReview}
              disabled={rating === 0 || !comment.trim() || isSubmitting || isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting 
                  ? (existingReview ? 'Updating...' : 'Submitting...') 
                  : (existingReview ? 'Update Review' : 'Submit Review')
                }
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      )}
    </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  backButton: {
    padding: 4,
  },
  doctorInfoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorInfo: {
    marginLeft: 16,
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  appointmentInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  ratingSection: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
    marginHorizontal: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  commentSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    minHeight: 120,
    marginBottom: 8,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});