import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { format, parseISO, isSameDay, parse } from 'date-fns';

export default function DoctorDetails() {
  const { id, doctorData } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [doctor, setDoctor] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('about');
  const [showPastSessions, setShowPastSessions] = useState(false);

  // Parse fallback data if available
  const fallbackData = doctorData ? JSON.parse(doctorData) : null;
  
  console.log('DoctorDetails - Props received:', {
    id,
    hasDoctorData: !!doctorData,
    fallbackDataDoctor: fallbackData?.doctor?.name
  });

  // Helper functions to categorize and sort sessions
  const categorizeAndSortSessions = useMemo(() => {
    if (!sessions || sessions.length === 0) {
      return { upcomingSessions: [], pastSessions: [] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today

    const upcoming = [];
    const past = [];

    sessions.forEach(session => {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0); // Set to start of session date

      if (sessionDate >= today) {
        upcoming.push(session);
      } else {
        past.push(session);
      }
    });

    // Sort upcoming sessions: nearest date first
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Sort past sessions: most recent first
    past.sort((a, b) => new Date(b.date) - new Date(a.date));

    return { upcomingSessions: upcoming, pastSessions: past };
  }, [sessions]);

  const { upcomingSessions, pastSessions } = categorizeAndSortSessions;
  
  // Fetch doctor details
  useEffect(() => {
    const fetchDoctorDetails = async () => {
      // If we have fallback data, use it immediately to improve UX
      if (fallbackData && fallbackData.doctor) {
        console.log('Using fallback data for doctor:', fallbackData.doctor.name);
        setDoctor(fallbackData.doctor);
        setRatingSummary(fallbackData.ratingSummary || null);
        setSessions(fallbackData.sessions || []);
        setLoading(false);
      }
      
      try {
        console.log('Fetching doctor details for ID:', id);
        // Use the same endpoint as web app to get doctor with sessions and reviews
        const { data } = await api.get(`/api/doctorCard/${id}`);
        console.log('Doctor details received:', {
          doctorName: data.doctor?.name,
          sessionsCount: data.sessions?.length,
          reviewsCount: data.reviews?.length,
          ratingSummary: data.ratingSummary
        });
        
        // Backend returns structured data with doctor, sessions, ratingSummary, and reviews
        setDoctor({
          ...data.doctor,
          avgRating: data.ratingSummary?.avgRating || 0,
          totalReviews: data.ratingSummary?.totalReviews || 0,
          reviews: data.reviews || []
        });
        setRatingSummary(data.ratingSummary || null);
        setSessions(data.sessions || []);
      } catch (error) {
        console.error('Error fetching doctor details:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        // Try to use fallback data if available
        if (fallbackData && fallbackData.doctor) {
          console.log('Using fallback data after error for doctor:', fallbackData.doctor.name);
          setDoctor(fallbackData.doctor);
          setRatingSummary(fallbackData.ratingSummary || null);
          setSessions(fallbackData.sessions || []);
        } else {
          // Check if it's a network error or server error
          if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
            Alert.alert(
              'Connection Error', 
              'Unable to connect to the server. Please check your internet connection and try again.',
              [
                { text: 'Retry', onPress: () => fetchDoctorDetails() },
                { text: 'Go Back', onPress: () => router.back() }
              ]
            );
          } else {
            Alert.alert('Error', 'Failed to load doctor information');
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchDoctorDetails();
    } else {
      console.error('No doctor ID provided');
      setLoading(false);
    }
  }, [id]);

  const handleBookSession = (session) => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'You need to login to book a session',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/login') }
        ]
      );
      return;
    }
    
    router.push({
      pathname: `/book-session/${session._id}`,
      params: { 
        doctorId: doctor._id,
        doctorName: doctor.name,
        sessionData: JSON.stringify(session)
      }
    });
  };

  // Get detailed availability information for session slots
  const getSlotAvailabilityInfo = (session) => {
    if (!session.timeSlots || session.timeSlots.length === 0) {
      return {
        total: 0,
        available: 0,
        booked: 0,
        timePassed: 0,
        isFullyBooked: false,
        isAllTimePassed: false,
        hasAvailableSlots: false,
        displayMessage: 'No Slots Available'
      };
    }

    const sessionDateObj = parseISO(session.date);
    const today = new Date();
    const isToday = isSameDay(sessionDateObj, today);

    let available = 0;
    let booked = 0;
    let timePassed = 0;

    session.timeSlots.forEach(slot => {
      if (slot.status === 'booked') {
        booked++;
      } else if (slot.status === 'available') {
        // Check if this available slot has passed its time today
        if (isToday) {
          const [hours, minutes] = slot.startTime.split(':').map(Number);
          const slotDateTime = new Date(sessionDateObj);
          slotDateTime.setHours(hours, minutes, 0, 0);
          
          if (today > slotDateTime) {
            timePassed++;
          } else {
            available++;
          }
        } else {
          available++;
        }
      } else {
        // Handle other statuses like 'unavailable'
        timePassed++;
      }
    });

    const total = session.timeSlots.length;
    const isFullyBooked = booked === total;
    const isAllTimePassed = timePassed === total && booked === 0;
    const hasAvailableSlots = available > 0;

    let displayMessage = 'Book Appointment';
    if (hasAvailableSlots) {
      displayMessage = 'Book Appointment';
    } else if (isFullyBooked) {
      displayMessage = 'Fully Booked';
    } else if (isAllTimePassed) {
      displayMessage = 'Time Passed';
    } else {
      displayMessage = 'No Available Slots';
    }

    return {
      total,
      available,
      booked,
      timePassed,
      isFullyBooked,
      isAllTimePassed,
      hasAvailableSlots,
      displayMessage
    };
  };

  // Reusable SessionCard component
  const SessionCard = ({ session, isPast = false }) => {
    const slotInfo = getSlotAvailabilityInfo(session);
    
    return (
      <View style={[styles.sessionCard, isPast && styles.pastSessionCard]}>
        <View style={styles.sessionHeader}>
          <Text style={[styles.sessionDate, isPast && styles.pastSessionDate]}>
            {format(parseISO(session.date), 'MMM dd, yyyy')}
          </Text>
          <View style={[styles.sessionTypeBadge, isPast && styles.pastSessionTypeBadge]}>
            <Text style={[styles.sessionTypeText, isPast && styles.pastSessionTypeText]}>
              {session.type === 'in-person' ? 'In-person' : 'Video'}
            </Text>
          </View>
        </View>
        
        <View style={styles.sessionDetails}>
          <View style={styles.sessionDetail}>
            <Ionicons name="time-outline" size={16} color={isPast ? "#9CA3AF" : "#64748B"} />
            <Text style={[styles.sessionDetailText, isPast && styles.pastSessionDetailText]}>
              {session.timeSlots && session.timeSlots.length > 0 
                ? `${session.timeSlots[0].startTime} - ${session.timeSlots[session.timeSlots.length - 1].endTime}` 
                : 'Time not specified'}
            </Text>
          </View>
          
          {Boolean(session.type === 'in-person' && session.hospital) && (
            <View style={styles.sessionDetail}>
              <Ionicons name="location-outline" size={16} color={isPast ? "#9CA3AF" : "#64748B"} />
              <Text style={[styles.sessionDetailText, isPast && styles.pastSessionDetailText]} numberOfLines={1}>
                {session.hospital.name}
              </Text>
            </View>
          )}
          
          <View style={styles.sessionDetail}>
            <Ionicons name="people-outline" size={16} color={isPast ? "#9CA3AF" : "#64748B"} />
            <Text style={[styles.sessionDetailText, isPast && styles.pastSessionDetailText]}>
              {session.timeSlots ? 
                isPast 
                  ? `${slotInfo.total} total slots${slotInfo.booked > 0 ? `, ${slotInfo.booked} were booked` : ''}${slotInfo.available > 0 ? `, ${slotInfo.available} were available` : ''}`
                  : `${slotInfo.available}/${slotInfo.total} slots available${slotInfo.booked > 0 ? `, ${slotInfo.booked} booked` : ''}${slotInfo.timePassed > 0 ? `, ${slotInfo.timePassed} time passed` : ''}` 
                : 'Slots info not available'}
            </Text>
          </View>
        </View>
        
        {!isPast && (
          <TouchableOpacity
            style={[
              styles.bookButton,
              !slotInfo.hasAvailableSlots && styles.disabledButton
            ]}
            onPress={() => handleBookSession(session)}
            disabled={!slotInfo.hasAvailableSlots}
          >
            <Text style={styles.bookButtonText}>
              {slotInfo.displayMessage}
            </Text>
          </TouchableOpacity>
        )}
        
        {isPast && (
          <View style={styles.pastSessionFooter}>
            <Text style={styles.pastSessionLabel}>Session Completed</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading doctor details...</Text>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Doctor not found</Text>
      </SafeAreaView>
    );
  }

  console.log('Rendering doctor:', {
    name: doctor?.name,
    specialization: doctor?.specialization,
    sessionsCount: sessions?.length,
    reviewsCount: doctor?.reviews?.length
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerTintColor: '#fff',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Image
            source={
              doctor?.profile 
                ? { uri: doctor.profile } 
                : require('../../assets/images/doctor-placeholder.png')
            }
            style={styles.doctorImage}
            resizeMode="cover"
          />
          
          <View style={styles.heroOverlay}>
            <View style={styles.heroContent}>
              <Text style={styles.doctorName}>{doctor?.name || 'Unknown Doctor'}</Text>
              <Text style={styles.doctorSpecialty}>
                {doctor?.specialization || 'General Practice'}
                {(doctor?.subSpecializations && doctor.subSpecializations.length > 0) 
                  ? ` • ${doctor.subSpecializations[0]}` 
                  : ''
                }
              </Text>
              
              {/* Qualifications and Experience Badge */}
              {Boolean((doctor?.qualifications?.length || 0) > 0 || (doctor?.yearsOfExperience || 0) > 0) && (
                <View style={styles.credentialsBadge}>
                  <Text style={styles.credentialsText}>
                    {doctor?.qualifications?.length > 0 ? doctor.qualifications.join(', ') : 'General Practice'}
                    {doctor?.yearsOfExperience 
                      ? ` • ${doctor.yearsOfExperience}+ years experience`
                      : ''
                    }
                  </Text>
                </View>
              )}
              
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={18} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {doctor?.avgRating?.toFixed(1) || '0.0'} ({doctor?.totalReviews || 0} reviews)
                </Text>
              </View>
              
              <View style={styles.feeContainer}>
                <Text style={styles.feeLabel}>Consultation Fee</Text>
                <Text style={styles.feeAmount}>LKR{doctor?.consultationFee?.toLocaleString() || '0'}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'about' && styles.activeTab]} 
            onPress={() => setSelectedTab('about')}
          >
            <Text style={[styles.tabText, selectedTab === 'about' && styles.activeTabText]}>About</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'sessions' && styles.activeTab]} 
            onPress={() => setSelectedTab('sessions')}
          >
            <Text style={[styles.tabText, selectedTab === 'sessions' && styles.activeTabText]}>Sessions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, selectedTab === 'reviews' && styles.activeTab]} 
            onPress={() => setSelectedTab('reviews')}
          >
            <Text style={[styles.tabText, selectedTab === 'reviews' && styles.activeTabText]}>Reviews</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.contentContainer}>
          {selectedTab === 'about' && (
            <View>
              {/* Doctor Bio */}
              {Boolean(doctor?.bio && doctor.bio.trim() !== '') && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>About Doctor</Text>
                  <Text style={styles.bioText}>{doctor.bio}</Text>
                </View>
              )}

              {/* Qualifications */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Qualifications</Text>
                {doctor?.qualifications && doctor.qualifications.length > 0 ? (
                  <View style={styles.qualificationsContainer}>
                    {doctor.qualifications.filter(qual => qual && qual.trim()).map((qualification, index) => (
                      <View key={index} style={styles.qualificationBadge}>
                        <MaterialCommunityIcons name="certificate" size={16} color="#2563EB" />
                        <Text style={styles.qualificationText}>{qualification}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noDataText}>No qualification information available</Text>
                )}
              </View>

              {/* Professional Info */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Professional Information</Text>
                
                <View style={styles.professionalInfoGrid}>
                  <View style={styles.infoCard}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color="#2563EB" />
                    <Text style={styles.infoCardLabel}>Experience</Text>
                    <Text style={styles.infoCardValue}>
                      {doctor?.yearsOfExperience ? `${doctor.yearsOfExperience} years` : 'Not specified'}
                    </Text>
                  </View>

                  <View style={styles.infoCard}>
                    <MaterialCommunityIcons name="card-account-details" size={20} color="#2563EB" />
                    <Text style={styles.infoCardLabel}>Registration</Text>
                    <Text style={styles.infoCardValue}>
                      {doctor?.regNo || 'Not specified'}
                    </Text>
                  </View>

                  <View style={styles.infoCard}>
                    <MaterialCommunityIcons name="translate" size={20} color="#2563EB" />
                    <Text style={styles.infoCardLabel}>Languages</Text>
                    <Text style={styles.infoCardValue}>
                      {doctor?.languagesSpoken && doctor.languagesSpoken.length > 0 
                        ? doctor.languagesSpoken.filter(lang => lang && lang.trim()).join(', ') 
                        : 'English'}
                    </Text>
                  </View>

                  <View style={styles.infoCard}>
                    <MaterialCommunityIcons name="gender-male-female" size={20} color="#2563EB" />
                    <Text style={styles.infoCardLabel}>Gender</Text>
                    <Text style={styles.infoCardValue}>
                      {doctor?.gender || 'Not specified'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Specializations */}
              {Boolean(doctor?.subSpecializations && doctor.subSpecializations.length > 0) && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Sub-Specializations</Text>
                  <View style={styles.specializationsContainer}>
                    {doctor.subSpecializations.filter(spec => spec && spec.trim()).map((specialization, index) => (
                      <View key={index} style={styles.specializationTag}>
                        <Text style={styles.specializationText}>{specialization}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Contact Information */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                
                <View style={styles.contactContainer}>
                  {Boolean(doctor?.phone) && (
                    <View style={styles.contactItem}>
                      <MaterialCommunityIcons name="phone" size={18} color="#64748B" />
                      <Text style={styles.contactText}>{doctor.phone}</Text>
                    </View>
                  )}
                  
                  {Boolean(doctor?.email) && (
                    <View style={styles.contactItem}>
                      <MaterialCommunityIcons name="email" size={18} color="#64748B" />
                      <Text style={styles.contactText}>{doctor.email}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Legacy Education Section - Keep for backward compatibility */}
              {Boolean(doctor?.education && doctor.education.length > 0) && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Education</Text>
                  {doctor.education.map((edu, index) => (
                    <View key={index} style={styles.educationItem}>
                      <MaterialCommunityIcons name="school" size={18} color="#64748B" />
                      <View style={styles.educationContent}>
                        <Text style={styles.educationDegree}>{edu.degree}</Text>
                        <Text style={styles.educationInstitution}>
                          {edu.institution}, {edu.year}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Legacy Experience Section - Keep for backward compatibility */}
              {Boolean(doctor?.experience && doctor.experience.length > 0) && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Work Experience</Text>
                  {doctor.experience.map((exp, index) => (
                    <View key={index} style={styles.experienceItem}>
                      <FontAwesome name="briefcase" size={16} color="#64748B" />
                      <View style={styles.experienceContent}>
                        <Text style={styles.experiencePosition}>{exp.position}</Text>
                        <Text style={styles.experienceLocation}>
                          {exp.hospital}, {exp.duration}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          
          {selectedTab === 'sessions' && (
            <View style={styles.sessionsContainer}>
              <View style={styles.sessionHeaderRow}>
                <Text style={styles.sectionTitle}>Available Sessions</Text>
                {pastSessions.length > 0 && (
                  <TouchableOpacity 
                    style={styles.pastSessionsButton}
                    onPress={() => setShowPastSessions(true)}
                  >
                    <Text style={styles.pastSessionsButtonText}>See Past Sessions</Text>
                    <Ionicons name="chevron-forward" size={16} color="#2563EB" />
                  </TouchableOpacity>
                )}
              </View>
              
              {Boolean(upcomingSessions && upcomingSessions.length > 0) ? (
                upcomingSessions.map((session) => (
                  <SessionCard key={session._id} session={session} />
                ))
              ) : (
                <Text style={styles.noDataText}>No upcoming sessions available</Text>
              )}
            </View>
          )}
          
          {selectedTab === 'reviews' && (
            <View style={styles.reviewsContainer}>
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
                
                {ratingSummary && ratingSummary !== null && (
                  <View style={styles.ratingBreakdown}>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <View key={rating} style={styles.ratingRow}>
                        <Text style={styles.ratingLabel}>{rating} Star</Text>
                        <View style={styles.ratingBarContainer}>
                          <View 
                            style={[
                              styles.ratingBar,
                              { 
                                width: `${ratingSummary[rating] && doctor?.totalReviews > 0 ? 
                                  (ratingSummary[rating] / doctor.totalReviews * 100) : 0}%` 
                              }
                            ]}
                          />
                        </View>
                        <Text style={styles.ratingCount}>{ratingSummary[rating] || 0}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              
              {Boolean(doctor?.reviews && doctor.reviews.length > 0) ? (
                doctor.reviews.map((review, index) => (
                  <View key={index} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>{review.patientName || 'Anonymous'}</Text>
                      <Text style={styles.reviewDate}>Recent</Text>
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
          )}
        </View>
      </ScrollView>

      {/* Past Sessions Modal */}
      <Modal
        visible={showPastSessions}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPastSessions(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowPastSessions(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Past Sessions</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {Boolean(pastSessions && pastSessions.length > 0) ? (
              pastSessions.map((session) => (
                <SessionCard key={session._id} session={session} isPast={true} />
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyStateTitle}>No Past Sessions</Text>
                <Text style={styles.emptyStateText}>
                  Dr. {doctor?.name || 'This doctor'} hasn't conducted any sessions yet.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    height: 280,
    position: 'relative',
  },
  doctorImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 16,
  },
  heroContent: {
    paddingHorizontal: 16,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  credentialsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  credentialsText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
  },
  feeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  feeLabel: {
    color: 'white',
    fontSize: 12,
    marginRight: 4,
  },
  feeAmount: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    paddingVertical: 16,
    marginRight: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 16,
    color: '#64748B',
  },
  activeTabText: {
    fontWeight: '500',
    color: '#2563EB',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: 'white',
    minHeight: 300,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  educationItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  educationContent: {
    marginLeft: 12,
    flex: 1,
  },
  educationDegree: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 2,
  },
  educationInstitution: {
    fontSize: 14,
    color: '#64748B',
  },
  experienceItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  experienceContent: {
    marginLeft: 12,
    flex: 1,
  },
  experiencePosition: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 2,
  },
  experienceLocation: {
    fontSize: 14,
    color: '#64748B',
  },
  bioText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  qualificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  qualificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  qualificationText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 6,
  },
  professionalInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  infoCardValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
    textAlign: 'center',
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specializationTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  specializationText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  contactContainer: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactText: {
    fontSize: 15,
    color: '#334155',
    marginLeft: 12,
    flex: 1,
  },
  noDataText: {
    color: '#94A3B8',
    fontSize: 15,
    fontStyle: 'italic',
  },
  sessionsContainer: {
    marginBottom: 16,
  },
  sessionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  sessionTypeBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sessionTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  sessionDetails: {
    marginBottom: 16,
  },
  sessionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#334155',
  },
  bookButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  bookButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  reviewsContainer: {},
  ratingsSummary: {
    marginBottom: 20,
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
  
  // Session Header Row Styles
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pastSessionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  pastSessionsButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  
  // Past Session Card Styles
  pastSessionCard: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  pastSessionDate: {
    color: '#64748B',
  },
  pastSessionTypeBadge: {
    backgroundColor: '#64748B',
  },
  pastSessionTypeText: {
    color: '#E2E8F0',
  },
  pastSessionDetailText: {
    color: '#64748B',
  },
  pastSessionFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
  },
  pastSessionLabel: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  
  // Empty State Styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
