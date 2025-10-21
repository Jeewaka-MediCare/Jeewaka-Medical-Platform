import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

const DoctorAboutTab = ({ doctor }) => {
  return (
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
                <MaterialCommunityIcons name="certificate" size={16} color="#008080" />
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
            <MaterialCommunityIcons name="clock-outline" size={20} color="#008080" />
            <Text style={styles.infoCardLabel}>Experience</Text>
            <Text style={styles.infoCardValue}>
              {doctor?.yearsOfExperience ? `${doctor.yearsOfExperience} years` : 'Not specified'}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="card-account-details" size={20} color="#008080" />
            <Text style={styles.infoCardLabel}>Registration</Text>
            <Text style={styles.infoCardValue}>
              {doctor?.regNo || 'Not specified'}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="translate" size={20} color="#008080" />
            <Text style={styles.infoCardLabel}>Languages</Text>
            <Text style={styles.infoCardValue}>
              {doctor?.languagesSpoken && doctor.languagesSpoken.length > 0 
                ? doctor.languagesSpoken.filter(lang => lang && lang.trim()).join(', ') 
                : 'English'}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="gender-male-female" size={20} color="#008080" />
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
  );
};

const styles = StyleSheet.create({
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
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
    borderColor: '#E0F2F1',
  },
  qualificationText: {
    fontSize: 14,
    color: '#008080',
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
});

export default DoctorAboutTab;