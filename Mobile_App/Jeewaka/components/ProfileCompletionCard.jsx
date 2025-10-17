import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileCompletionCard({ 
  percentage, 
  missingFields, 
  navigateToProfile 
}) {
  const isComplete = percentage === 100;
  
  return (
    <View style={[
      styles.profileCompletionSection,
      isComplete ? styles.profileCompletionComplete : styles.profileCompletionIncomplete
    ]}>
      <View style={styles.profileCompletionHeader}>
        <Ionicons 
          name={isComplete ? "checkmark-circle" : "warning"} 
          size={24} 
          color={isComplete ? "#10B981" : "#F59E0B"} 
        />
        <Text style={[
          styles.profileCompletionTitle,
          { color: isComplete ? "#065F46" : "#92400E" }
        ]}>
          {isComplete ? "Profile Complete" : `Complete Your Profile (${percentage}% Complete)`}
        </Text>
      </View>
      
      {isComplete ? (
        <Text style={[
          styles.profileCompletionDescription,
          { color: "#065F46" }
        ]}>
          Your profile is fully optimized! Keep it updated to attract more patients.
        </Text>
      ) : (
        <Text style={[
          styles.profileCompletionDescription,
          { color: "#78350F" }
        ]}>
          Please complete the following fields to have a fully optimized profile:
        </Text>
      )}
      
      {!isComplete && missingFields.length <= 3 && (
        <View style={styles.missingFieldsContainer}>
          {missingFields.map((field, index) => (
            <View key={index} style={styles.missingFieldTag}>
              <Text style={styles.missingFieldText}>{field}</Text>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.profileProgressContainer}>
        <View style={[
          styles.profileProgressBar,
          { backgroundColor: isComplete ? "#A7F3D0" : "#FDE68A" }
        ]}>
          <View 
            style={[
              styles.profileProgressFill, 
              { 
                width: `${percentage}%`,
                backgroundColor: isComplete ? "#10B981" : "#008080"
              }
            ]} 
          />
        </View>
        <Text style={[
          styles.profileProgressText,
          { color: isComplete ? "#065F46" : "#92400E" }
        ]}>{percentage}%</Text>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.profileActionButton,
          { backgroundColor: isComplete ? "#10B981" : "#008080" }
        ]}
        onPress={navigateToProfile}
      >
        <Ionicons 
          name={isComplete ? "person" : "add-circle"} 
          size={20} 
          color="#FFFFFF" 
        />
        <Text style={styles.profileActionButtonText}>
          {isComplete ? "Update Profile" : "Complete Profile"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Profile Completion Section Styles
  profileCompletionSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  profileCompletionIncomplete: {
    backgroundColor: '#d1f4f4ff',
    borderColor: '#008080',
  },
  profileCompletionComplete: {
    backgroundColor: '#91e2e2ff',
    borderColor: '#10B981',
  },
  profileCompletionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileCompletionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  profileCompletionDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  missingFieldsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  missingFieldTag: {
    backgroundColor: '#39d3d3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#008080',
  },
  missingFieldText: {
    fontSize: 12,
    color: '#1e6d6dff',
    fontWeight: '600',
  },
  profileProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileProgressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  profileProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  profileProgressText: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 40,
  },
  profileActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileActionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});