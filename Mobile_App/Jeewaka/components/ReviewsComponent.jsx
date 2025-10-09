import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';

export default function ReviewsComponent({ doctor, showRatingSummary = true }) {
  if (!doctor) {
    return (
      <View style={styles.reviewsContainer}>
        <Text style={styles.noDataText}>Doctor information not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.reviewsContainer}>
      {showRatingSummary && (
        <View style={styles.ratingsSummary}>
          <Text style={styles.sectionTitle}>Patient Reviews</Text>
          <View style={styles.overallRating}>
            <Text style={styles.ratingNumber}>{doctor?.avgRating?.toFixed(1) || '0.0'}</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={16}
                  color={star <= Math.round(doctor?.avgRating || 0) ? "#FFD700" : "#CBD5E1"}
                />
              ))}
              <Text style={styles.totalReviewsText}>({doctor?.totalReviews || 0} reviews)</Text>
            </View>
          </View>
          
          {doctor?.reviews && doctor.reviews.length > 0 && (
            <View style={styles.ratingBreakdown}>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = doctor.reviews.filter(review => review.rating === rating).length;
                const percentage = doctor.totalReviews > 0 ? (count / doctor.totalReviews * 100) : 0;
                return (
                  <View key={rating} style={styles.ratingRow}>
                    <Text style={styles.ratingLabel}>{rating} Star</Text>
                    <View style={styles.ratingBarContainer}>
                      <View 
                        style={[
                          styles.ratingBar,
                          { width: `${percentage}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.ratingCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
      
      {Boolean(doctor?.reviews && doctor.reviews.length > 0) ? (
        doctor.reviews.map((review, index) => (
          <View key={index} style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>{review.patient?.name || 'Anonymous'}</Text>
              <Text style={styles.reviewDate}>
                {review.createdAt ? format(parseISO(review.createdAt), 'MMM dd, yyyy') : 'Recent'}
              </Text>
            </View>
            
            <View style={styles.reviewStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={14}
                  color={star <= review.rating ? "#FFD700" : "#CBD5E1"}
                />
              ))}
            </View>
            
            <Text style={styles.reviewText}>{review.comment}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>No reviews yet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  reviewsContainer: {},
  ratingsSummary: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1E293B',
    marginRight: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalReviewsText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  ratingBreakdown: {
    marginTop: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingLabel: {
    width: 60,
    fontSize: 14,
    color: '#64748B',
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  ratingBar: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  ratingCount: {
    width: 30,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'right',
  },
  reviewItem: {
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
  },
  reviewDate: {
    fontSize: 13,
    color: '#64748B',
  },
  reviewStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
});