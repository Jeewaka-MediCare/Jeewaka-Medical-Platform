import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfessionalInfoSection({ doctorData }) {
  if (!doctorData) return null;

  return (
    <>
      {/* Professional Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Professional Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="medical-bag" size={20} color="#008080" />
            <Text style={styles.infoLabel}>Specialization</Text>
          </View>
          <Text style={styles.infoValue}>
            {doctorData?.specialization || 'Not specified'}
          </Text>
          {doctorData?.subSpecializations && doctorData.subSpecializations.length > 0 && (
            <Text style={styles.subSpecText}>
              {doctorData.subSpecializations.join(', ')}
            </Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="certificate" size={20} color="#008080" />
            <Text style={styles.infoLabel}>Qualifications</Text>
          </View>
          <Text style={styles.infoValue}>
            {doctorData?.qualifications && doctorData.qualifications.length > 0 
              ? doctorData.qualifications.join(', ') 
              : 'Not specified'
            }
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="card-account-details" size={20} color="#008080" />
            <Text style={styles.infoLabel}>Registration Number</Text>
          </View>
          <Text style={styles.infoValue}>
            {doctorData?.regNo || 'Not specified'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="translate" size={20} color="#008080" />
            <Text style={styles.infoLabel}>Languages</Text>
          </View>
          <Text style={styles.infoValue}>
            {doctorData?.languagesSpoken && doctorData.languagesSpoken.length > 0 
              ? doctorData.languagesSpoken.join(', ') 
              : 'Not specified'
            }
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="cash" size={20} color="#008080" />
            <Text style={styles.infoLabel}>Consultation Fee</Text>
          </View>
          <Text style={styles.infoValue}>
            LKR {doctorData?.consultationFee || 0}
          </Text>
        </View>
      </View>

      {/* About Section */}
      {doctorData?.bio && doctorData.bio.trim() && (
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{doctorData.bio}</Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  infoSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 22,
  },
  subSpecText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  bioCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bioText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
});