import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import CertificateItem from './CertificateItem';
import api from '../services/api';

export default function CertificateUploadSection({
  doctorData,
  setDoctorData,
  uploadedFiles,
  uploading,
  handleFileUpload,
  removeFile,
  formatDate,
  children
}) {
  
  const handleCleanCertificates = async () => {
    // Filter out empty certificates
    const cleanCertificates = doctorData.certificates.filter(cert => cert && cert.trim() !== '');
    
    setDoctorData(prev => ({
      ...prev,
      certificates: cleanCertificates,
      updatedAt: new Date().toISOString()
    }));
    
    // Save the cleaned certificates to backend
    try {
      const doctorId = doctorData.doctorId;
      await api.put(`/api/admin-verification/${doctorId}`, {
        certificates: cleanCertificates
      });
      Alert.alert('Success', 'Empty certificates cleaned. You can now upload new certificates.');
    } catch (error) {
      console.error('Error cleaning certificates:', error);
      Alert.alert('Error', 'Failed to clean certificates.');
    }
  };

  const renderCertificate = ({ item }) => (
    <CertificateItem 
      item={item} 
      onRemove={removeFile} 
      formatDate={formatDate} 
    />
  );

  return (
    <View style={styles.uploadCard}>
      <View style={styles.uploadHeader}>
        <Text style={styles.uploadTitle}>Certificates</Text>
        <View style={styles.certificateCount}>
          <Text style={styles.countLabel}>Total</Text>
          <Text style={styles.countValue}>
            {doctorData.certificates.filter(cert => cert && cert.trim() !== '').length}
          </Text>
        </View>
      </View>

      {/* Upload Button */}
      <TouchableOpacity
        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
        onPress={handleFileUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>Choose Files</Text>
        )}
      </TouchableOpacity>
      
      {/* Clean Empty Certificates Button - Temporary Fix */}
      {doctorData.certificates.some(cert => !cert || cert.trim() === '') && (
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: '#f59e0b', marginTop: 10 }]}
          onPress={handleCleanCertificates}
        >
          <Text style={styles.uploadButtonText}>Clean Empty Certificates</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.uploadHint}>
        PDF, JPG, PNG, DOC, DOCX files up to 10MB each
      </Text>

      {/* Certificates List */}
      {uploadedFiles.length > 0 ? (
        <View style={styles.certificatesList}>
          <Text style={styles.listTitle}>
            Uploaded Certificates ({uploadedFiles.length})
          </Text>
          <FlatList
            data={uploadedFiles}
            renderItem={renderCertificate}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        </View>
      ) : (
        <View style={styles.noCertificates}>
          <Text style={styles.noCertificatesTitle}>No Certificates Uploaded</Text>
          <Text style={styles.noCertificatesText}>
            Please upload at least one certificate to proceed with admin verification.
          </Text>
        </View>
      )}

      {/* Render action buttons passed as children */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  uploadCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  certificateCount: {
    alignItems: 'center',
  },
  countLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  countValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1bccccff',
  },
  uploadButton: {
    backgroundColor: '#008080',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadHint: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  certificatesList: {
    marginTop: 20,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  noCertificates: {
    padding: 20,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 20,
  },
  noCertificatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A16207',
    marginBottom: 8,
  },
  noCertificatesText: {
    fontSize: 14,
    color: '#A16207',
    lineHeight: 20,
  },
});