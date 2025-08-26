import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { format, parseISO } from 'date-fns';

export default function DoctorDetails() {
  const { id, doctorData } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [doctor, setDoctor] = useState(null);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('about');

  // Parse fallback data if available
  const fallbackData = doctorData ? JSON.parse(doctorData) : null;
  
  // Fetch doctor details
  useEffect(() => {
    const fetchDoctorDetails = async () => {
      // If we have fallback data, use it immediately to improve UX
      if (fallbackData && fallbackData.doctor) {
        setDoctor(fallbackData.doctor);
        setRatingSummary(fallbackData.ratingSummary || null);
        setSessions(fallbackData.sessions || []);
        setLoading(false);
      }
      
      try {
        const { data } = await api.get(`/api/doctor/${id}`);
        console.log('Doctor details received:', data);
        
        // Backend returns doctor object directly, not wrapped in data.doctor
        setDoctor(data);
        setRatingSummary(data.ratingSummary || null);
        
        // Sessions are references in doctor model, need separate API call
        // For now, use empty array until we implement proper session fetching
        setSessions([]);
        
        // TODO: Add separate API call to fetch doctor sessions
        // const sessionsResponse = await api.get(`/api/session/doctor/${id}`);
        // setSessions(sessionsResponse.data || []);
      } catch (error) {
        console.error('Error fetching doctor details:', error);
        
        // Try to use fallback data if available
        if (fallbackData && fallbackData.doctor) {
          console.log('Using fallback data for doctor');
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
    
    fetchDoctorDetails();
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

  console.log('Rendering doctor:', doctor?.name, 'Specialization:', doctor?.specialization);

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
              <Text style={styles.doctorName}>{doctor?.name}</Text>
              <Text style={styles.doctorSpecialty}>
                {doctor?.specialization}
                {doctor?.subSpecializations && doctor.subSpecializations.length > 0 && 
                  ` • ${doctor.subSpecializations[0]}`
                }
              </Text>
              
              {/* Qualifications and Experience Badge */}
              {(doctor?.qualifications?.length > 0 || doctor?.yearsOfExperience) && (
                <View style={styles.credentialsBadge}>
                  <Text style={styles.credentialsText}>
                    {doctor?.qualifications?.join(', ')}
                    {doctor?.yearsOfExperience && 
                      ` • ${doctor.yearsOfExperience}+ years experience`
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
                <Text style={styles.feeAmount}>${doctor?.consultationFee?.toLocaleString() || '0'}</Text>
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
              {doctor?.bio && doctor.bio.trim() && (
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
                    {doctor.qualifications.map((qualification, index) => (
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
                        ? doctor.languagesSpoken.join(', ') 
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
              {doctor?.subSpecializations && doctor.subSpecializations.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Sub-Specializations</Text>
                  <View style={styles.specializationsContainer}>
                    {doctor.subSpecializations.map((specialization, index) => (
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
                  {doctor?.phone && (
                    <View style={styles.contactItem}>
                      <MaterialCommunityIcons name="phone" size={18} color="#64748B" />
                      <Text style={styles.contactText}>{doctor.phone}</Text>
                    </View>
                  )}
                  
                  {doctor?.email && (
                    <View style={styles.contactItem}>
                      <MaterialCommunityIcons name="email" size={18} color="#64748B" />
                      <Text style={styles.contactText}>{doctor.email}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Legacy Education Section - Keep for backward compatibility */}
              {doctor?.education && doctor.education.length > 0 && (
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
              {doctor?.experience && doctor.experience.length > 0 && (
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
              <Text style={styles.sectionTitle}>Available Sessions</Text>
              {sessions && sessions.length > 0 ? (
                sessions.map((session) => (
                  <View key={session._id} style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <Text style={styles.sessionDate}>
                        {format(parseISO(session.date), 'MMM dd, yyyy')}
                      </Text>
                      <View style={styles.sessionTypeBadge}>
                        <Text style={styles.sessionTypeText}>
                          {session.sessionType === 'in-person' ? 'In-person' : 'Video'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.sessionDetails}>
                      <View style={styles.sessionDetail}>
                        <Ionicons name="time-outline" size={16} color="#64748B" />
                        <Text style={styles.sessionDetailText}>
                          {session.startTime} ({session.slotDuration} mins)
                        </Text>
                      </View>
                      
                      {session.sessionType === 'in-person' && session.hospital && (
                        <View style={styles.sessionDetail}>
                          <Ionicons name="location-outline" size={16} color="#64748B" />
                          <Text style={styles.sessionDetailText} numberOfLines={1}>
                            {session.hospital.name}
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.sessionDetail}>
                        <Ionicons name="people-outline" size={16} color="#64748B" />
                        <Text style={styles.sessionDetailText}>
                          {session.availableSlots}/{session.totalSlots} slots available
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={[
                        styles.bookButton,
                        session.availableSlots === 0 && styles.disabledButton
                      ]}
                      onPress={() => handleBookSession(session)}
                      disabled={session.availableSlots === 0}
                    >
                      <Text style={styles.bookButtonText}>
                        {session.availableSlots === 0 ? 'Fully Booked' : 'Book Appointment'}
                      </Text>
                    </TouchableOpacity>
                  </View>
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
                
                {ratingSummary && (
                  <View style={styles.ratingBreakdown}>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <View key={rating} style={styles.ratingRow}>
                        <Text style={styles.ratingLabel}>{rating} Star</Text>
                        <View style={styles.ratingBarContainer}>
                          <View 
                            style={[
                              styles.ratingBar,
                              { 
                                width: `${ratingSummary[rating] ? 
                                  (ratingSummary[rating] / doctor?.totalReviews * 100) : 0}%` 
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
              
              {doctor?.reviews && doctor.reviews.length > 0 ? (
                doctor.reviews.map((review) => (
                  <View key={review._id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>{review.patientName || 'Anonymous'}</Text>
                      <Text style={styles.reviewDate}>
                        {format(parseISO(review.createdAt), 'MMM dd, yyyy')}
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
          )}
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
});
