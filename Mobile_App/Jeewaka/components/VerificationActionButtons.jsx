import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VerificationActionButtons({
  checkingStatus,
  hasSavedCertificates,
  doctorData,
  uploading,
  onCheckStatus,
  onSaveCertificates,
  onLogout
}) {
  return (
    <>
      {/* First Row: Check Status and Save Certificates */}
      <View style={styles.primaryButtonsRow}>
        <TouchableOpacity
          style={[
            styles.statusButton, 
            (checkingStatus || !hasSavedCertificates) && styles.statusButtonDisabled
          ]}
          onPress={onCheckStatus}
          disabled={checkingStatus || !hasSavedCertificates}
        >
          {checkingStatus ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={[
              styles.statusButtonText,
              !hasSavedCertificates && styles.statusButtonTextDisabled
            ]}>
              Check Status
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.saveButton,
            (doctorData.certificates.length === 0 || uploading) && styles.saveButtonDisabled
          ]}
          onPress={onSaveCertificates}
          disabled={doctorData.certificates.length === 0 || uploading}
        >
          <Text style={[
            styles.saveButtonText,
            (doctorData.certificates.length === 0 || uploading) && styles.saveButtonTextDisabled
          ]}>
            Save Certificates
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Second Row: Logout Button */}
      <View style={styles.logoutButtonRow}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // First row: Check Status and Save Certificates buttons
  primaryButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  statusButton: {
    flex: 1,
    backgroundColor: '#26e6e6ff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.05,
  },
  statusButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  statusButtonTextDisabled: {
    color: '#E2E8F0',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#31ada2ff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0.05,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButtonTextDisabled: {
    color: '#E2E8F0',
  },
  // Second row: Logout button (centered, profile page style)
  logoutButtonRow: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});