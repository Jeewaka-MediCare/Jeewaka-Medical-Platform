import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';

export default function ReviewsSection({
  recentReviews,
  fadeAnim,
  slideAnim,
  scrollAnim,
  handleViewReviews,
}) {
  return (
    <Animated.View 
      style={[
        styles.reviewsSection,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.reviewsSectionHeader}>
        <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
        <Text style={styles.reviewsSectionTitle}>Recent Reviews</Text>
        <TouchableOpacity onPress={handleViewReviews}>
          <Text style={styles.viewAllReviewsButton}>View All</Text>
        </TouchableOpacity>
      </View>
      
      {recentReviews.length > 0 ? (
        <View style={styles.reviewsContainer}>
          <Animated.View
            style={[
              styles.reviewsAnimatedContainer,
              {
                transform: [{ translateX: scrollAnim }]
              }
            ]}
          >
            {/* Render reviews twice for seamless loop */}
            {[...recentReviews, ...recentReviews].map((review, index) => (
              <Animated.View 
                key={`${review.id || index}-${index >= recentReviews.length ? 'duplicate' : 'original'}`}
                style={[
                  styles.reviewCard,
                  {
                    opacity: fadeAnim,
                    transform: [{ 
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1]
                      })
                    }]
                  }
                ]}
              >
                <View style={styles.reviewCardHeader}>
                  <Text style={styles.reviewerName} numberOfLines={1}>
                    {review.patient?.name || 'Anonymous'}
                  </Text>
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
                </View>
                <Text style={styles.reviewComment} numberOfLines={4}>
                  {review.comment}
                </Text>
                <Text style={styles.reviewDate}>
                  {review.createdAt ? format(parseISO(review.createdAt), 'MMM dd, yyyy') : 'Recent'}
                </Text>
              </Animated.View>
            ))}
          </Animated.View>
        </View>
      ) : (
        <View style={styles.noReviewsContainer}>
          <MaterialCommunityIcons name="star-outline" size={48} color="#CBD5E1" />
          <Text style={styles.noReviewsText}>No reviews yet</Text>
          <Text style={styles.noReviewsSubtext}>
            Your first patient reviews will appear here
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Recent Reviews Section Styles
  reviewsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  reviewsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  reviewsSectionTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 12,
  },
  viewAllReviewsButton: {
    fontSize: 14,
    color: '#008080',
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  reviewsContainer: {
    height: 200,
    overflow: 'hidden',
    marginHorizontal: -16,
  },
  reviewsAnimatedContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  reviewCard: {
    width: 280,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 12,
    minHeight: 60,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  noReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
    marginBottom: 4,
  },
  noReviewsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});