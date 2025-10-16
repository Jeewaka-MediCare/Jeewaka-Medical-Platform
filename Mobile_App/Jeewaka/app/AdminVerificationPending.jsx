import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import api from '../services/api';
import { getErrorMessage } from '../services/errorHandler';
import useAuthStore from '../store/authStore';

export default function AdminVerificationPending() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const params = useLocalSearchParams();
  
  // Get doctor data from params or user store
  const [doctorData, setDoctorData] = useState({
    doctorId: params.doctorId || user?._id,
    _id: params._id || user?._id,
    name: params.name || user?.name,
    email: params.email || user?.email,
    certificates: [],
    isVerified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    __v: 0
  });
  
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [hasSavedCertificates, setHasSavedCertificates] = useState(false);

  // Load existing verification data on mount
  useEffect(() => {
    loadVerificationData();
  }, []);

  // Sync uploadedFiles with doctorData.certificates
  useEffect(() => {
    if (doctorData.certificates && doctorData.certificates.length > 0) {
      setUploadedFiles(
        doctorData.certificates.map((url, idx) => {
          let filename = url.split('/').pop() || '';
          if (filename.includes('?')) filename = filename.split('?')[0];
          return {
            id: `${idx}-${filename}`,
            name: filename,
            url,
            uploadedAt: doctorData.updatedAt || new Date().toISOString(),
            raw: { url },
          };
        })
      );
    } else {
      setUploadedFiles([]);
    }
  }, [doctorData.certificates, doctorData.updatedAt]);

  const loadVerificationData = async () => {
    try {
      const doctorId = params.doctorId || user?._id;
      if (!doctorId) {
        Alert.alert('Error', 'Doctor ID is missing. Please contact support.');
        return;
      }

      // Try to get existing verification data
      try {
        const response = await api.get(`/api/admin-verification/${doctorId}`);
        if (response.data) {
          setDoctorData(prev => ({
            ...prev,
            ...response.data,
            certificates: response.data.certificates || []
          }));
          // If verification record exists, certificates have been saved
          setHasSavedCertificates(true);
        }
      } catch (error) {
        // Verification doesn't exist yet, which is normal for new doctors
        if (error.response?.status === 404) {
          console.log('No existing verification found - this is expected for new doctors');
        } else {
          console.error('Unexpected error loading verification data:', error);
        }
      }
    } catch (error) {
      console.error('Error loading verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    try {
      // Pick documents
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      });

      if (result.canceled) return;

      const files = result.assets || [result];
      
      // Validate file sizes (10MB limit)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      const invalidFile = files.find(file => file.size && file.size > MAX_SIZE);
      
      if (invalidFile) {
        Alert.alert('File Too Large', 'Maximum file size is 10MB per file.');
        return;
      }

      setUploading(true);

      const doctorId = doctorData.doctorId;
      if (!doctorId || doctorId === 'undefined') {
        Alert.alert('Error', 'Doctor ID is missing. Please contact support.');
        setUploading(false);
        return;
      }

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        
        formData.append('document', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name
        });

        try {
          const response = await api.post(`/api/admin-verification/documents/${doctorId}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          const doc = response.data.document || {};
          const newFile = {
            id: Date.now() + i,
            name: doc.filename || file.name,
            url: doc.url || doc.path || '',
            uploadedAt: doc.uploadedAt || new Date().toISOString(),
            raw: doc
          };

          setUploadedFiles(prev => [...prev, newFile]);
          setDoctorData(prev => ({
            ...prev,
            certificates: [...(prev.certificates || []), newFile.url],
            updatedAt: new Date().toISOString()
          }));
        } catch (uploadError) {
          console.error('Upload error for file:', file.name, uploadError);
          Alert.alert(
            'Upload Failed',
            `Failed to upload ${file.name}. Please try again.`
          );
        }
      }

      Alert.alert(
        'Success',
        'Certificates uploaded successfully! Waiting for admin verification.'
      );
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert(
        'Error',
        getErrorMessage(error, 'Failed to select documents. Please try again.')
      );
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (id) => {
    const fileToRemove = uploadedFiles.find(f => f.id === id);
    if (!fileToRemove) return;

    const doctorId = doctorData.doctorId;
    if (!doctorId || doctorId === 'undefined') {
      Alert.alert('Error', 'Doctor ID is missing. Please contact support.');
      return;
    }

    try {
      await api.delete(`/api/admin-verification/documents/${doctorId}/${encodeURIComponent(fileToRemove.name)}`);
      
      setUploadedFiles(prev => prev.filter(f => f.id !== id));
      setDoctorData(prev => ({
        ...prev,
        certificates: prev.certificates.filter(url => url !== fileToRemove.url),
        updatedAt: new Date().toISOString()
      }));
      
      Alert.alert('Success', 'File deleted successfully.');
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete file from storage.');
    }
  };

  const handleSaveCertificates = async () => {
    if (doctorData.certificates.length === 0) {
      Alert.alert('Missing Certificates', 'Please upload at least one certificate');
      return;
    }

    try {
      const doctorId = doctorData.doctorId;
      if (!doctorId || doctorId === 'undefined') {
        Alert.alert('Error', 'Doctor ID is missing. Please contact support.');
        return;
      }

      // Check if verification exists
      let exists = false;
      try {
        await api.get(`/api/admin-verification/${doctorId}`);
        exists = true;
      } catch (err) {
        exists = false;
      }

      if (exists) {
        await api.put(`/api/admin-verification/${doctorId}`, {
          certificates: doctorData.certificates
        });
      } else {
        await api.post(`/api/admin-verification/`, {
          doctorId,
          certificates: doctorData.certificates
        });
      }

      Alert.alert(
        'Success',
        'Certificates saved successfully! Waiting for admin verification.'
      );
      
      // Mark that certificates have been saved
      setHasSavedCertificates(true);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save certificates to backend.');
    }
  };

  const checkVerificationStatus = async () => {
    // Check if certificates have been saved first
    if (!hasSavedCertificates) {
      Alert.alert(
        '📋 Save Certificates First',
        'Please upload and save your certificates before checking verification status.',
        [
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
      return;
    }

    setCheckingStatus(true);
    try {
      const doctorId = doctorData.doctorId;
      if (!doctorId || doctorId === 'undefined') {
        Alert.alert('Error', 'Doctor ID is missing. Please contact support.');
        return;
      }

      const response = await api.get(`/api/admin-verification/${doctorId}`);
      const isVerified = response.data?.isVerified || false;
      
      if (isVerified) {
        Alert.alert(
          '✅ Verification Complete!',
          'Your account has been verified by admin. You can now access your dashboard.',
          [
            {
              text: 'Go to Dashboard',
              onPress: () => router.replace('/(tabs)/appointments')
            }
          ]
        );
      } else {
        Alert.alert(
          '⏳ Still Pending',
          'Your verification is still pending. Please wait for admin approval or ensure you have uploaded and saved your certificates.'
        );
      }
      
      // Update local data
      setDoctorData(prev => ({
        ...prev,
        isVerified,
        ...response.data
      }));
      
    } catch (error) {
      console.error('Status check error:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        Alert.alert(
          '📋 No Verification Record',
          'No verification record found. Please make sure you have uploaded and saved your certificates first.',
          [
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      } else if (error.response?.status === 401) {
        Alert.alert(
          '🔐 Authentication Error',
          'Please log out and log back in to refresh your session.',
          [
            {
              text: 'Go to Login',
              onPress: handleLogout
            }
          ]
        );
      } else {
        Alert.alert(
          '⏳ Still Pending',
          'Unable to check status right now. Your verification is likely still pending admin approval.'
        );
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, navigate to login for safety
      router.replace('/login');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const renderCertificate = ({ item }) => (
    <View style={styles.certificateItem}>
      <View style={styles.certificateInfo}>
        <Text style={styles.certificateName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.certificateDate}>
          Uploaded: {formatDate(item.uploadedAt)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removeFile(item.id)}
      >
        <Text style={styles.deleteButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            title: 'Doctor Verification',
            headerStyle: { backgroundColor: '#1E293B' },
            headerTintColor: '#fff',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading verification data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Doctor Verification',
          headerStyle: { backgroundColor: '#1E293B' },
          headerTintColor: '#fff',
        }}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Doctor Verification</Text>
          <Text style={styles.subtitle}>Complete your profile by uploading certificates</Text>
          
          {/* Welcome message for new doctors */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>
              🎉 Registration successful! Now please upload your medical certificates for admin verification.
            </Text>
          </View>
          
          <View style={[
            styles.statusBadge,
            doctorData.isVerified ? styles.verifiedBadge : styles.pendingBadge
          ]}>
            <Text style={[
              styles.statusText,
              doctorData.isVerified ? styles.verifiedText : styles.pendingText
            ]}>
              {doctorData.isVerified ? '✓ Verified' : '⏳ Pending Verification'}
            </Text>
          </View>
        </View>

        {/* Doctor Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Doctor Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Doctor ID</Text>
              <Text style={styles.infoValue}>{doctorData.doctorId}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{doctorData.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{doctorData.email}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>
                {doctorData.isVerified ? 'Verified' : 'Not Verified'}
              </Text>
            </View>
          </View>
        </View>

        {/* Verification Process Info */}
        <View style={styles.processCard}>
          <Text style={styles.processTitle}>Verification Process</Text>
          <View style={styles.processSteps}>
            <Text style={styles.processStep}>→ Upload all your medical certificates and licenses</Text>
            <Text style={styles.processStep}>→ Click "Save Certificates" to submit for review</Text>
            <Text style={styles.processStep}>→ Admin team will review your documents within 24-48 hours</Text>
            <Text style={styles.processStep}>→ Use "Check Status" button to see verification progress</Text>
            <Text style={styles.processStep}>→ Once verified, you can access your dashboard</Text>
          </View>
        </View>

        {/* Admin Comment */}
        {doctorData.commentFromAdmin ? (
          <View style={styles.commentCard}>
            <Text style={styles.commentTitle}>Message from Admin</Text>
            <Text style={styles.commentText}>{doctorData.commentFromAdmin}</Text>
          </View>
        ) : (
          <View style={styles.noCommentCard}>
            <Text style={styles.noCommentText}>No comments from admin yet</Text>
          </View>
        )}

        {/* Certificate Upload Section */}
        <View style={styles.uploadCard}>
          <View style={styles.uploadHeader}>
            <Text style={styles.uploadTitle}>Certificates</Text>
            <View style={styles.certificateCount}>
              <Text style={styles.countLabel}>Total</Text>
              <Text style={styles.countValue}>{doctorData.certificates.length}</Text>
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

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleLogout}
            >
              <Text style={styles.backButtonText}>Logout</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.statusButton, 
                (checkingStatus || !hasSavedCertificates) && styles.statusButtonDisabled
              ]}
              onPress={checkVerificationStatus}
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
              onPress={handleSaveCertificates}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  welcomeCard: {
    backgroundColor: '#DBEAFE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  welcomeText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  verifiedText: {
    color: '#15803D',
  },
  pendingText: {
    color: '#A16207',
  },
  infoCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  processCard: {
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
  processTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  processSteps: {
    gap: 8,
  },
  processStep: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  commentCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  noCommentCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#94A3B8',
  },
  noCommentText: {
    fontSize: 14,
    color: '#64748B',
  },
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
    color: '#3B82F6',
  },
  uploadButton: {
    backgroundColor: '#3B82F6',
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
  certificateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  certificateInfo: {
    flex: 1,
  },
  certificateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  certificateDate: {
    fontSize: 12,
    color: '#64748B',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 8,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  statusButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusButtonTextDisabled: {
    color: '#E2E8F0',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#E2E8F0',
  },
});